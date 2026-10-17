# Synthetic file fixtures only; no runtime/read/continuation contract is defined here.
import argparse,csv,hashlib,json,zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime
from openpyxl import Workbook
p=argparse.ArgumentParser();p.add_argument('--output',required=True);a=p.parse_args();root=Path(a.output);root.mkdir(parents=True,exist_ok=False)
files=[]
def record(path,kind,scope):
 data=path.read_bytes();files.append({'path':str(path.relative_to(root)),'format':kind,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),**scope})
wide=root/'wide-10000-columns.csv'
cell='界'*(32767-6)+'\\"\nEND' # 32767 characters with literal quoting/newline/backslash
with wide.open('w',newline='',encoding='utf-8') as f:
 writer=csv.writer(f);writer.writerow([f'字段{i+1}' for i in range(10000)]);writer.writerow([cell]+[str(i+1) for i in range(9999)])
assert len(cell)<=32767;record(wide,'csv',{'columns':10000,'data_rows':1,'logical_cells':20000,'long_cell_characters':len(cell),'within_8MiB':wide.stat().st_size<=8*1024*1024})
for index in range(32):
 book=Workbook();book.remove(book.active);book.properties.created=datetime(2026,10,14);book.properties.modified=datetime(2026,10,14)
 for sheet in range(64):
  ws=book.create_sheet(f'Sheet{sheet+1}');ws.append(['数量','合成类别']);ws.append([index+sheet+1,f'类别-{index}-{sheet}'])
 path=root/f'many-sheets-{index:02d}.xlsx';book.save(path)
 # Emit the approved relative OOXML relationship form. Do not relax the reader.
 with zipfile.ZipFile(path) as original:
  entries=[(info,original.read(info.filename)) for info in original.infolist()]
 with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as output:
  for info,data in entries:
   if info.filename=='xl/_rels/workbook.xml.rels':
    tree=ET.fromstring(data)
    for relation in tree:
     target=relation.get('Target','')
     if target.startswith('/xl/'):
      relation.set('Target',target[len('/xl/'):])
    data=ET.tostring(tree,encoding='utf-8',xml_declaration=True)
   output.writestr(info,data)
 with zipfile.ZipFile(path) as z:assert len([s for s in z.namelist() if s.startswith('xl/worksheets/sheet') and s.endswith('.xml')])==64
 record(path,'xlsx',{'sheets':64,'columns':2,'data_rows_per_sheet':1,'logical_cells':256,'within_8MiB':path.stat().st_size<=8*1024*1024})
line=root/'long-single-line.json';line.write_text(json.dumps({'synthetic_authorized_material':cell},ensure_ascii=True,separators=(',',':')),encoding='utf-8');assert len(line.read_text().splitlines())==1;record(line,'native_read_material_only',{'json_source_upload_supported':False,'purpose':'native read long physical line; not a new product upload format'})
assert sum(f['bytes'] for f in files if f['format']!='native_read_material_only')<=32*1024*1024
(root/'MANIFEST.json').write_text(json.dumps({'version':'1.0','source_head':'8265a3920ee1205faec7dede8b0c84e648105d9d','generator_state':'new uncommitted engineering fixture; source hash recorded separately','scope':'synthetic fixtures, no Provider/SDK behavior claim','files':files,'xlsx_sheet_total':2048,'xlsx_logical_cells_total':8192,'pending_tests':['V03 escaped/unicode capacity vs outgoing context','V04 real 32x64 sheet catalog bounded and all reachable','V05 10000 columns/32767 cell and long JSON line authorized continuation','V06/V07 actual final guard and compaction','R3 all large collection outputs with effects/receipt retention']},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for info in files:assert hashlib.sha256((root/info['path']).read_bytes()).hexdigest()==info['sha256']
print(json.dumps({'files':len(files),'xlsx_sheet_total':2048,'long_cell_characters':len(cell),'upload_bytes_total':sum(f['bytes'] for f in files if f['format']!='native_read_material_only')},indent=2))
