# Synthetic approved-capacity CSV fixtures; no new SDK or business contract.
import argparse,csv,hashlib,io,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--output',required=True);a=p.parse_args();root=Path(a.output);root.mkdir(parents=True,exist_ok=False)
target=8*1024*1024;files=[]
def encode(rows):
 out=io.StringIO(newline='');csv.writer(out).writerows(rows);return out.getvalue().encode('utf-8')
def exact(rows):
 data=encode(rows);remaining=target-len(data);assert remaining>=0
 for row in rows[1:]:
  for index,value in enumerate(row):
   added=min(remaining,32767-len(value));row[index]+='x'*added;remaining-=added
   if remaining==0:break
  if remaining==0:break
 assert remaining==0;data=encode(rows);assert len(data)==target;return data
def save(name,rows,batch):
 data=exact(rows);path=root/name;path.write_bytes(data)
 with path.open(newline='',encoding='utf-8') as f:parsed=list(csv.reader(f,strict=True))
 assert parsed==rows
 files.append({'path':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'format':'csv','batch':batch,'logical_cells':sum(map(len,rows)),'data_rows':len(rows)-1,'columns':len(rows[0]),'max_cell_characters':max(map(len,[v for row in rows for v in row]))})
 # Source capacity counts headers; keep this exact rather than 1000 data rows.
save('cells-100000-at-8MiB.csv',[[f'field-{i}' for i in range(100)]]+[['\u754c\\"\n'+'a'*64 for _ in range(100)] for _ in range(999)],'cells-100000')
for i in range(4):save(f'batch-32MiB-{i}.csv',[['synthetic-label']]+[[f'\u754c-{i}-{n}-'+'b'*8190] for n in range(999)],'bytes-32MiB')
assert sum(f['bytes'] for f in files if f['batch']=='bytes-32MiB')==32*1024*1024
for f in files:assert hashlib.sha256((root/f['path']).read_bytes()).hexdigest()==f['sha256']
(root/'manifest.json').write_text(json.dumps({'scope':'source parsing boundary fixtures only; guard/read/Outcome not verified','files':files},indent=2)+'\n')
print(json.dumps({'files':len(files),'single_bytes':target,'batch_bytes':32*1024*1024,'cells':files[0]['logical_cells']}))
