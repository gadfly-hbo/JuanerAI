import {createMemberPreparationExecutor,describePreparationFailure,describePreparationSuccess} from './member-preparation-executor.ts';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {isAbsolute} from 'node:path';
import {membershipRecord,membershipUuid} from '../../packages/product-core/member-analysis.ts';
import {desktopRuleFailure} from '../../packages/product-core/xanthil-desktop-decision-case.ts';
import type {MemberSourceFile,MemberSourceInspection,MemberSourceSheet} from '../../packages/ports/member-source.ts';
import {qualifyExtractedMemberSources} from '../../packages/product-core/member-source-qualification.ts';

// Fixed trusted extractor. This is not the generated-Python execution boundary.
const extractor=String.raw`import sys,json,base64,csv,io,zipfile,re,posixpath,datetime,decimal,xml.etree.ElementTree as ET
NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main'
RNS='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
PNS='http://schemas.openxmlformats.org/package/2006/relationships'
def fail(code): raise ValueError(code)
def col(n):
    value=''
    while n:
        n,k=divmod(n-1,26); value=chr(65+k)+value
    return value
def xml(raw):
    text=raw.decode('utf-8-sig')
    if '\x00' in text or re.search(r'<!\s*(DOCTYPE|ENTITY)',text,re.I): fail('SOURCE_XML_UNSUPPORTED')
    return ET.fromstring(text)
def xlsx(raw):
    with zipfile.ZipFile(io.BytesIO(raw)) as book:
        info=book.infolist(); names=[x.filename for x in info]
        if len(info)>512 or len(names)!=len(set(names)): fail('SOURCE_ARCHIVE_INVALID')
        if sum(x.file_size for x in info)>16777216: fail('SOURCE_CAPACITY')
        for entry in info:
            n=entry.filename
            if entry.flag_bits&1 or entry.file_size>8388608 or entry.file_size>100*max(1,entry.compress_size): fail('SOURCE_CAPACITY')
            if n.startswith('/') or '\\' in n or '..' in n.split('/') or n!=posixpath.normpath(n): fail('SOURCE_ARCHIVE_INVALID')
            if not (n.endswith('.xml') or n.endswith('.rels')) or 'embeddings/' in n: fail('SOURCE_CONTENT_UNSUPPORTED')
        if '[Content_Types].xml' not in names: fail('SOURCE_ARCHIVE_INVALID')
        types=xml(book.read('[Content_Types].xml'))
        if any('macro' in x.get('ContentType','').lower() for x in types): fail('SOURCE_CONTENT_UNSUPPORTED')
        for n in names:
            if n.endswith('.rels'):
                if any(x.get('TargetMode','Internal')!='Internal' for x in xml(book.read(n))): fail('SOURCE_EXTERNAL_REFERENCE')
        workbook=xml(book.read('xl/workbook.xml'))
        shared=[]
        if 'xl/sharedStrings.xml' in names:
            shared=[''.join(t.text or '' for t in item.iter('{'+NS+'}t')) for item in xml(book.read('xl/sharedStrings.xml'))]
            if len(shared)>100000: fail('SOURCE_CAPACITY')
        styles=[0]; custom={}
        if 'xl/styles.xml' in names:
            style_tree=xml(book.read('xl/styles.xml')); xfs=style_tree.find('{'+NS+'}cellXfs')
            if xfs is not None: styles=[int(x.get('numFmtId','0')) for x in xfs]
            formats=style_tree.find('{'+NS+'}numFmts')
            if formats is not None: custom={int(x.get('numFmtId')):x.get('formatCode') for x in formats}
        prop=workbook.find('{'+NS+'}workbookPr')
        date1904=prop.get('date1904','0') if prop is not None else '0'
        if date1904 not in ('0','1','true','false'): fail('SOURCE_DATE_UNSUPPORTED')
        relationships=xml(book.read('xl/_rels/workbook.xml.rels'))
        rels={}
        for rel in relationships:
            key=rel.get('Id'); target=rel.get('Target','')
            if not key or key in rels or target.startswith('/') or '..' in target.split('/') or '\\' in target: fail('SOURCE_ARCHIVE_INVALID')
            rels[key]=(rel.get('Type'),posixpath.join('xl',target))
        sheets=workbook.find('{'+NS+'}sheets')
        if sheets is None or not 1<=len(sheets)<=64: fail('SOURCE_CAPACITY')
        result=[]; ids=set(); titles=set(); cells_seen=0; value_bytes=0
        for sheet in sheets:
            sid=sheet.get('sheetId'); title=sheet.get('name'); state=sheet.get('state','visible')
            if not sid or sid in ids or not title or title in titles or state not in ('visible','hidden','veryHidden'): fail('SOURCE_SHEET_INVALID')
            ids.add(sid); titles.add(title)
            rel=rels.get(sheet.get('{'+RNS+'}id'))
            if not rel or rel[0]!=RNS+'/worksheet': fail('SOURCE_SHEET_INVALID')
            tree=xml(book.read(rel[1]))
            if tree.tag!='{'+NS+'}worksheet' or tree.find('{'+NS+'}mergeCells') is not None: fail('SOURCE_CONTENT_UNSUPPORTED')
            data=tree.find('{'+NS+'}sheetData')
            if data is None: fail('SOURCE_SHEET_INVALID')
            rows=[]; previous=0
            for row in data:
                number=int(row.get('r','0'))
                if number<=previous or number>1048576: fail('SOURCE_CELL_INVALID')
                previous=number; cells=[]; positions=set()
                for cell in row:
                    address=cell.get('r',''); match=re.fullmatch(r'([A-Z]{1,3})([1-9][0-9]*)',address)
                    if cell.tag!='{'+NS+'}c' or not match or int(match[2])!=number or match[1] in positions: fail('SOURCE_CELL_INVALID')
                    column_number=0
                    for letter in match[1]: column_number=column_number*26+ord(letter)-64
                    if column_number>16384: fail('SOURCE_CELL_INVALID')
                    positions.add(match[1]); cells_seen+=1
                    if cells_seen>100000: fail('SOURCE_CAPACITY')
                    if cell.find('{'+NS+'}f') is not None: fail('SOURCE_FORMULA_UNSUPPORTED')
                    kind=cell.get('t','n'); value=cell.find('{'+NS+'}v'); original=None
                    if kind=='inlineStr':
                        inline=cell.find('{'+NS+'}is')
                        if inline is None: fail('SOURCE_CELL_INVALID')
                        text=''.join(x.text or '' for x in inline.iter('{'+NS+'}t')); kind='string'
                    elif kind=='s':
                        index=value.text or '' if value is not None else ''
                        if not re.fullmatch(r'[0-9]+',index) or int(index)>=len(shared): fail('SOURCE_CELL_INVALID')
                        text=shared[int(index)]; kind='string'
                    elif kind=='str': text=value.text or '' if value is not None else ''; kind='string'
                    elif kind=='n':
                        text=value.text or '' if value is not None else ''; kind='number' if text else 'blank'
                        if text and not re.fullmatch(r'-?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[Ee][+-]?[0-9]+)?',text): fail('SOURCE_CELL_INVALID')
                        style=int(cell.get('s','0'))
                        if style<0 or style>=len(styles): fail('SOURCE_DATE_UNSUPPORTED')
                        fmt=styles[style]
                        if not (0<=fmt<=22 or 37<=fmt<=44 or fmt in (48,49) or fmt>=164): fail('SOURCE_DATE_UNSUPPORTED')
                        if fmt>=164 and custom.get(fmt) not in ('yyyy-mm-dd','yyyy-mm-dd hh:mm:ss'): fail('SOURCE_DATE_UNSUPPORTED')
                        if text and (14<=fmt<=22 or fmt>=164):
                            if 18<=fmt<=21: fail('SOURCE_DATE_UNSUPPORTED')
                            serial=decimal.Decimal(text)
                            if not serial.is_finite() or serial<0 or serial>2958465: fail('SOURCE_DATE_UNSUPPORTED')
                            whole=int(serial); micros=(serial-whole)*86400000000
                            if micros!=micros.to_integral_value(): fail('SOURCE_DATE_UNSUPPORTED')
                            if date1904 in ('1','true'): base=datetime.datetime(1904,1,1)
                            else:
                                if whole==60: fail('SOURCE_DATE_UNSUPPORTED')
                                base=datetime.datetime(1899,12,31) if whole<60 else datetime.datetime(1899,12,30)
                            date=base+datetime.timedelta(days=whole,microseconds=int(micros)); original=text
                            text=date.date().isoformat() if micros==0 else date.isoformat(); kind='date'
                    elif kind=='b':
                        text=value.text if value is not None else None
                        if text not in ('0','1'): fail('SOURCE_CELL_INVALID')
                        kind='boolean'
                    elif kind=='d':
                        text=value.text or '' if value is not None else ''; kind='date'
                        if not re.fullmatch(r'[0-9]{4}-[0-9]{2}-[0-9]{2}(?:T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,6})?)?',text): fail('SOURCE_DATE_UNSUPPORTED')
                        try: datetime.datetime.fromisoformat(text)
                        except ValueError: fail('SOURCE_DATE_UNSUPPORTED')
                    else: fail('SOURCE_CELL_TYPE_UNSUPPORTED')
                    if len(text)>32767: fail('SOURCE_CAPACITY')
                    value_bytes+=len(text.encode('utf-8'))
                    if value_bytes>16777216: fail('SOURCE_CAPACITY')
                    cell_result={'column':match[1],'type':kind,'value':text}
                    if original is not None: cell_result['source_value']=original
                    cells.append(cell_result)
                rows.append({'row':number,'cells':cells})
            result.append({'sheet_id':sid,'name':title,'state':state,'rows':rows})
        return result
try:
    request=json.load(sys.stdin); raw=base64.b64decode(request['bytes'],validate=True)
    if request['format']=='csv':
        rows=[]; total=0; csv.field_size_limit(32767)
        for i,row in enumerate(csv.reader(io.StringIO(raw.decode('utf-8-sig'),newline=''),strict=True),1):
            total+=len(row)
            if total>100000 or len(row)>16384: fail('SOURCE_CAPACITY')
            rows.append({'row':i,'cells':[{'column':col(j),'type':'string','value':value} for j,value in enumerate(row,1)]})
        sheets=[{'sheet_id':'csv','name':'CSV','state':'visible','rows':rows}]
    elif request['format']=='xlsx': sheets=xlsx(raw)
    else: fail('SOURCE_FORMAT_UNSUPPORTED')
    print(json.dumps({'sheets':sheets},ensure_ascii=False,separators=(',',':')))
except Exception as error:
    code=str(error) if isinstance(error,ValueError) and re.fullmatch(r'SOURCE_[A-Z_]+',str(error)) else 'SOURCE_UNREADABLE'
    print(json.dumps({'error':code})); sys.exit(1)
`;

function extract(python:string,format:string,bytes:Uint8Array,signal:AbortSignal,milliseconds:number):Promise<MemberSourceSheet[]>{
 return new Promise((resolve,reject)=>{
  const fail=(code:string)=>Object.assign(new Error(code),{code});
  if(signal.aborted){reject(fail('CANCELLED'));return;}
  const child=spawn(python,['-I','-B','-c',extractor],{stdio:['pipe','pipe','ignore'],env:{PATH:process.env.PATH??''}});
  const chunks:Buffer[]=[];let length=0,failure:string|undefined;
  const terminate=(code:string)=>{failure??=code;child.kill('SIGKILL');};
  const abort=()=>terminate('CANCELLED'),timer=setTimeout(()=>terminate('DEADLINE_EXCEEDED'),milliseconds);
  signal.addEventListener('abort',abort,{once:true});
  child.stdout.on('data',(chunk:Buffer)=>{length+=chunk.length;if(length>32*1024*1024)terminate('SOURCE_CAPACITY');else if(!failure)chunks.push(chunk);});
  child.on('error',()=>{failure??='SOURCE_READER_UNAVAILABLE';});
  child.on('close',code=>{clearTimeout(timer);signal.removeEventListener('abort',abort);if(failure){reject(fail(failure));return;}try{const result=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(code!==0){reject(fail(typeof result.error==='string'&&/^SOURCE_[A-Z_]+$/.test(result.error)?result.error:'SOURCE_UNREADABLE'));return;}if(!Array.isArray(result.sheets))throw Error();resolve(result.sheets);}catch{reject(fail('SOURCE_UNREADABLE'));}});
  child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify({format,bytes:Buffer.from(bytes).toString('base64')}));if(signal.aborted)abort();
 });
}

export function createMemberSourceInspector(python:string){return async(input:unknown):Promise<MemberSourceInspection>=>{
 const request=membershipRecord(input,['sources','cancellation_signal','deadline_seconds']);
 if(!Array.isArray(request.sources)||request.sources.length<1||request.sources.length>32||!(request.cancellation_signal instanceof AbortSignal)||!Number.isInteger(request.deadline_seconds)||Number(request.deadline_seconds)<1||Number(request.deadline_seconds)>30)desktopRuleFailure();
 const ids=new Set<string>();let total=0;
 const sources=request.sources.map(value=>{const s=membershipRecord(value,['source_id','display_name','format','bytes']);if(!membershipUuid(s.source_id)||ids.has(s.source_id)||typeof s.display_name!=='string'||!s.display_name.trim()||s.display_name.length>255||/[\x00-\x1f/\\]/.test(s.display_name)||!['csv','xlsx'].includes(String(s.format))||!(s.bytes instanceof Uint8Array)||s.bytes.length===0||s.bytes.length>8*1024*1024)desktopRuleFailure();ids.add(s.source_id);total+=s.bytes.length;return {...s,bytes:Uint8Array.from(s.bytes)} as MemberSourceFile;});
 if(total>32*1024*1024)desktopRuleFailure('SOURCE_CAPACITY');
 const until=Date.now()+Number(request.deadline_seconds)*1000,result:MemberSourceInspection['sources'][number][]=[];
 for(const s of sources){const remaining=until-Date.now();if(remaining<=0)desktopRuleFailure('DEADLINE_EXCEEDED');const sheets=await extract(python,s.format,s.bytes,request.cancellation_signal,remaining);result.push({source_id:s.source_id,display_name:s.display_name,format:s.format,sha256:createHash('sha256').update(s.bytes).digest('hex'),byte_length:String(s.bytes.length),sheets});}
 return {version:'1.0',sources:result};
};}

/** Separate preparation Port: the exact legacy three-method analysis Port is unchanged. */
export function createMemberSourcePreparation(config:unknown){
 const c=membershipRecord(config,['pythonExecutable','pythonVersion']);
 if(typeof c.pythonExecutable!=='string'||!isAbsolute(c.pythonExecutable)||typeof c.pythonVersion!=='string'||!/^3\.(?:9|[1-9]\d)\.\d+$/.test(c.pythonVersion))desktopRuleFailure();
 const inspectSources=createMemberSourceInspector(c.pythonExecutable);
 return Object.freeze({inspectSources,describePreparationFailure,describePreparationSuccess,executePreparation:createMemberPreparationExecutor(c.pythonExecutable,c.pythonVersion),async qualifySources(input:unknown){
  const x=membershipRecord(input,['sources','bindings','candidate','cancellation_signal','deadline_seconds']),candidate=membershipRecord(x.candidate,['members_bytes','orders_bytes']);
  if(!(candidate.members_bytes instanceof Uint8Array)||!(candidate.orders_bytes instanceof Uint8Array))desktopRuleFailure('CONVERSION_UNQUALIFIED');
  const copy={members_bytes:Uint8Array.from(candidate.members_bytes),orders_bytes:Uint8Array.from(candidate.orders_bytes)},bindings=structuredClone(x.bindings);
  const inspection=await inspectSources({sources:x.sources,cancellation_signal:x.cancellation_signal,deadline_seconds:x.deadline_seconds});
  return qualifyExtractedMemberSources(inspection,bindings,copy);
 }});
}
