"""Trusted selected-byte reader. No document code, macros, links or models execute."""
import sys,json,base64,io,zipfile,re,posixpath,xml.etree.ElementTree as ET,subprocess,pathlib,os

def fail(code): raise ValueError(code)
def xml(data):
    if re.search(br'<!\s*(DOCTYPE|ENTITY)',data,re.I): fail('SOURCE_XML_UNSUPPORTED')
    return ET.fromstring(data)
def archive(raw):
    z=zipfile.ZipFile(io.BytesIO(raw)); entries=z.infolist(); names=[e.filename for e in entries]
    if len(entries)>2048 or len(names)!=len(set(names)): fail('SOURCE_ARCHIVE_INVALID')
    if sum(e.file_size for e in entries)>32*1024*1024: fail('SOURCE_CAPACITY')
    for e in entries:
        n=e.filename
        if n.startswith('/') or '\\' in n or '..' in n.split('/') or n.rstrip('/')!=posixpath.normpath(n): fail('SOURCE_ARCHIVE_INVALID')
        if e.flag_bits&1 or e.file_size>8*1024*1024 or e.file_size>200*max(1,e.compress_size): fail('SOURCE_CAPACITY')
        if re.search(r'(vbaProject|embeddings/|activeX/)',n,re.I): fail('SOURCE_CONTENT_UNSUPPORTED')
    types=xml(z.read('[Content_Types].xml'))
    if any('macro' in e.get('ContentType','').lower() for e in types): fail('SOURCE_CONTENT_UNSUPPORTED')
    return z,names

def convert_legacy(request,raw,fmt):
    exe=request.get('sofficeExecutable'); job=request.get('jobDirectory')
    if not exe or not job: fail('SOURCE_LEGACY_READER_UNAVAILABLE')
    if not raw.startswith(bytes.fromhex('d0cf11e0a1b11ae1')): fail('SOURCE_UNREADABLE')
    directory=pathlib.Path(job); profile=directory/'office-profile'; (profile/'user').mkdir(parents=True)
    (profile/'user'/'registrymodifications.xcu').write_text('<oor:items xmlns:oor="http://openoffice.org/2001/registry"><item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="MacroSecurityLevel" oor:op="fuse"><value>3</value></prop></item></oor:items>')
    original=directory/('original.'+fmt); original.write_bytes(raw); target='docx' if fmt=='doc' else 'pptx'
    app=pathlib.Path(exe).resolve(); app_root=app.parents[2] if '.app/' in str(app) else app.parent
    quote=lambda value:json.dumps(str(value))
    sbpl='(version 1)(deny default)(allow file-map-executable (subpath "/System") (subpath '+quote(app_root)+'))(allow process*)(allow sysctl-read)(allow mach-lookup)(allow file-read-metadata)(allow file-read* '+''.join('(subpath '+quote(p)+')' for p in ['/System','/usr','/bin','/sbin','/Library/Fonts',app_root,directory])+''.join('(literal '+quote(p)+')' for p in ['/','/dev/null','/dev/random','/dev/urandom','/etc/localtime','/private/etc/localtime','/Library/Preferences/.GlobalPreferences.plist'])+')(allow file-write* (subpath '+quote(directory)+'))(deny network*)'
    # macOS libignition opens the root directory as an openat descriptor.
    # Literal root permission grants no recursive access to unselected files.
    (directory/'conversion-sandbox.sb').write_text(sbpl)
    args=['/usr/bin/sandbox-exec','-p',sbpl,str(app),'-env:UserInstallation='+profile.as_uri(),'--headless','--norestore','--nodefault','--nofirststartwizard','--convert-to',target,'--outdir',str(directory),str(original)]
    with open(directory/'conversion.log','wb') as log:
        try:
            result=subprocess.run(args,stdin=subprocess.DEVNULL,stdout=log,stderr=log,timeout=12,cwd=str(directory),env={'PATH':'/usr/bin:/bin','HOME':str(directory),'TMPDIR':str(directory),'LANG':'en_US.UTF-8','SAL_USE_VCLPLUGIN':'svp'})
        except subprocess.TimeoutExpired: fail('SOURCE_LEGACY_CONVERSION_FAILED')
    (directory/'conversion-process.json').write_text(json.dumps({'exit':result.returncode,'network':'denied','macros':'very_high','reader':'installed_libreoffice'})+'\n')
    converted=directory/('original.'+target)
    if result.returncode or not converted.is_file(): fail('SOURCE_LEGACY_CONVERSION_FAILED')
    if converted.stat().st_size>8*1024*1024: fail('SOURCE_CAPACITY')
    data=extract({'format':target,'bytes':base64.b64encode(converted.read_bytes()).decode()})
    data['limitations'].insert(0,'原'+fmt.upper()+'经本机受限转换为'+target.upper()+'后读取文本；原件未改动，转换可能影响版式。')
    return data

def read_image(exe,raw):
    if not exe: fail('SOURCE_IMAGE_READER_UNAVAILABLE')
    try: result=subprocess.run([exe],input=json.dumps({'bytes':base64.b64encode(raw).decode()}).encode(),stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,timeout=15,env={'PATH':'/usr/bin:/bin','LANG':'en_US.UTF-8'})
    except subprocess.TimeoutExpired: fail('SOURCE_IMAGE_READER_FAILED')
    if len(result.stdout)>16*1024*1024: fail('SOURCE_CAPACITY')
    data=json.loads(result.stdout)
    if result.returncode: fail(data.get('error','SOURCE_IMAGE_READER_FAILED'))
    if data.get('status')!='ocr_unconfirmed': fail('SOURCE_IMAGE_READER_FAILED')
    return data

def scanned_page(raw,index,exe):
    if not exe: fail('SOURCE_PDF_OCR_REQUIRED')
    try: import pypdfium2 as pdfium
    except ImportError: fail('SOURCE_PDF_OCR_READER_UNAVAILABLE')
    book=pdfium.PdfDocument(raw)
    try:
        page=book[index]
        try:
            width,height=page.get_size()
            if width<=0 or height<=0 or width>10000 or height>10000: fail('SOURCE_CAPACITY')
            scale=min(2,4096/width,4096/height)
            if int(width*scale+1)*int(height*scale+1)>8*1024*1024: fail('SOURCE_CAPACITY')
            bitmap=page.render(scale=scale)
            try:
                image=bitmap.to_pil()
                try:
                    output=io.BytesIO();image.save(output,format='PNG')
                    return read_image(exe,output.getvalue())
                finally: image.close()
            finally: bitmap.close()
        finally: page.close()
    finally: book.close()

def extract(request):
    raw=base64.b64decode(request['bytes'],validate=True); fmt=request['format']; rows=[]; limitations=[]; status='text_observed'
    if fmt in ('doc','ppt'): return convert_legacy(request,raw,fmt)
    if fmt in ('png','jpg','jpeg'):
        if fmt=='png' and not raw.startswith(bytes.fromhex('89504e470d0a1a0a')) or fmt in ('jpg','jpeg') and not raw.startswith(bytes.fromhex('ffd8ff')): fail('SOURCE_IMAGE_INVALID')
        return read_image(request.get('imageExecutable'),raw)
    if fmt=='md':
        text=raw.decode('utf-8-sig')
        if '\x00' in text: fail('SOURCE_TEXT_INVALID')
        rows=[(str(i),v) for i,v in enumerate(text.splitlines(),1)]
        limitations=['Markdown内容为原文观察，内嵌链接不访问；文字中的观点不自动成为核验事实。']
    elif fmt=='docx':
        z,names=archive(raw); ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        parts=['word/document.xml']+sorted(n for n in names if re.fullmatch(r'word/(?:header\d+|footer\d+|footnotes|endnotes|comments)\.xml',n))
        for part in parts:
            tree=xml(z.read(part))
            for i,p in enumerate(tree.findall('.//w:p',ns),1):
                text=''.join(t.text or '' for t in p.findall('.//w:t',ns))
                if text: rows.append((part+':'+str(i),text))
        limitations=['读取正文、页眉页脚、脚注尾注及批注的文本；未把图片、版式或段落顺序当作已核验表格关系。']
    elif fmt=='pptx':
        z,names=archive(raw); rns='http://schemas.openxmlformats.org/officeDocument/2006/relationships'; pns={'p':'http://schemas.openxmlformats.org/presentationml/2006/main'}; ans={'a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
        rels={r.get('Id'):r for r in xml(z.read('ppt/_rels/presentation.xml.rels'))}; presentation=xml(z.read('ppt/presentation.xml'))
        for i,slide in enumerate(presentation.findall('.//p:sldId',pns),1):
            rel=rels.get(slide.get('{'+rns+'}id')); target=rel.get('Target','') if rel is not None else ''
            if rel is None or rel.get('TargetMode','Internal')!='Internal' or '..' in target.split('/') or target.startswith('/'): fail('SOURCE_ARCHIVE_INVALID')
            tree=xml(z.read(posixpath.join('ppt',target)))
            for j,p in enumerate(tree.findall('.//a:p',ans),1):
                text=''.join(t.text or '' for t in p.findall('.//a:t',ans))
                if text: rows.append(('第'+str(i)+'页:'+str(j),text))
        limitations=['按演示文稿实际页面顺序读取文字；图片、图形布局和未显示备注不作为已读取的业务表格。']
    elif fmt=='pdf':
        try: from pypdf import PdfReader
        except ImportError: fail('SOURCE_PDF_READER_UNAVAILABLE')
        book=PdfReader(io.BytesIO(raw),strict=True)
        if book.is_encrypted: fail('SOURCE_ENCRYPTED')
        if len(book.pages)>200: fail('SOURCE_CAPACITY')
        for i,page in enumerate(book.pages,1):
            text=page.extract_text() or ''
            if not text.strip():
                data=scanned_page(raw,i-1,request.get('imageExecutable'))
                rows.extend(('第'+str(i)+'页OCR:'+location,line) for location,line in data['rows'])
                limitations.extend(data['limitations']);status='ocr_unconfirmed'
            else:
                for j,line in enumerate(text.splitlines(),1): rows.append(('第'+str(i)+'页:'+str(j),line))
        limitations=list(dict.fromkeys(['PDF文字层和扫描页按实际页面读取；排版、阅读顺序和表格关系仍需核对。']+limitations))
    else: fail('SOURCE_READER_UNAVAILABLE')
    if not rows: fail('SOURCE_TEXT_EMPTY')
    if len(rows)>100000 or sum(len(v.encode('utf-8')) for _,v in rows)>16*1024*1024 or any(len(v)>32767 for _,v in rows): fail('SOURCE_CAPACITY')
    return {'rows':rows,'limitations':limitations,'status':status}
try:
    request=json.load(sys.stdin); result=extract(request); print(json.dumps(result,ensure_ascii=False,separators=(',',':')))
except Exception as error:
    code=str(error) if isinstance(error,ValueError) and re.fullmatch(r'SOURCE_[A-Z_]+',str(error)) else 'SOURCE_UNREADABLE'
    print(json.dumps({'error':code}));sys.exit(1)
