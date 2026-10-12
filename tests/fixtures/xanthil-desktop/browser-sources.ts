import {randomUUID} from 'node:crypto';

/** Independently authored literal OOXML fixture; no production reader/writer is reused. */
function crc32(bytes:Uint8Array){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
export function fixtureZip(entries:ReadonlyArray<readonly[string,string]>):Uint8Array{
 const locals:Buffer[]=[],central:Buffer[]=[];let offset=0;
 for(const [name,text] of entries){const n=Buffer.from(name),body=Buffer.from(text),sum=crc32(body),header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt32LE(sum,14);header.writeUInt32LE(body.length,18);header.writeUInt32LE(body.length,22);header.writeUInt16LE(n.length,26);locals.push(header,n,body);
 const index=Buffer.alloc(46);index.writeUInt32LE(0x02014b50);index.writeUInt16LE(20,4);index.writeUInt16LE(20,6);index.writeUInt32LE(sum,16);index.writeUInt32LE(body.length,20);index.writeUInt32LE(body.length,24);index.writeUInt16LE(n.length,28);index.writeUInt32LE(offset,42);central.push(index,n);offset+=header.length+n.length+body.length;}
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...locals,directory,end]);
}
const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const relationship='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const escape=(x:string)=>x.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function fixtureWorksheet(rows:readonly (readonly string[])[]){return `<worksheet xmlns="${ns}"><sheetData>${rows.map((row,i)=>`<row r="${i+1}">${row.map((value,j)=>`<c r="${String.fromCharCode(65+j)}${i+1}" t="inlineStr"><is><t>${escape(value)}</t></is></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`;}
export function fixtureWorkbook(sheets:ReadonlyArray<{name:string;xml:string}>,extra:ReadonlyArray<readonly[string,string]>=[]){return fixtureZip([
 ['[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/></Types>'],
 ['_rels/.rels',`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="workbook" Type="${relationship}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
 ['xl/workbook.xml',`<workbook xmlns="${ns}" xmlns:r="${relationship}"><sheets>${sheets.map((s,i)=>`<sheet name="${escape(s.name)}" sheetId="${i+1}" r:id="sheet${i+1}"/>`).join('')}</sheets></workbook>`],
 ['xl/_rels/workbook.xml.rels',`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="sheet${i+1}" Type="${relationship}/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}</Relationships>`],
 ...sheets.map((s,i)=>[`xl/worksheets/sheet${i+1}.xml`,s.xml] as const),...extra
]);}
export function browserSourceFixture(){
 const header=['order_id','order_member_id','paid_at','amount','status','currency'];
 const sheets=[{name:'比较期',xml:fixtureWorksheet([header,['p1','m1','2026-01-02','10.00','paid','CNY'],['p2','m1','2026-01-03','20.00','paid','CNY']])},{name:'本期',xml:fixtureWorksheet([header,['c1','m1','2026-02-02','15.00','paid','CNY'],['c2','m1','2026-02-03','30.00','paid','CNY']])}];
 return [
 {source_id:randomUUID(),display_name:'成员.csv',format:'csv',bytes:Buffer.from('member_id,member_group\nm1,North\nm2,South\n')},
 {source_id:randomUUID(),display_name:'订单.xlsx',format:'xlsx',bytes:fixtureWorkbook(sheets)},
 {source_id:randomUUID(),display_name:'补充订单.csv',format:'csv',bytes:Buffer.from(header.join(',')+'\np3,m2,2026-01-02,10.00,paid,CNY\nc3,m2,2026-02-02,10.00,paid,CNY\n')},
 ];
}
export function browserBindingFixture(sources:readonly {source_id:string}[]):import('../../../packages/product-core/member-source-qualification.ts').SourceBinding[]{
 const orders={order_id:'order_id',order_member_id:'order_member_id',paid_at:'paid_at',amount:'amount',status:'status',currency:'currency'};
 return [{source_id:sources[0].source_id,sheet_id:'csv',role:'members',columns:{member_id:'member_id',member_group:'member_group'}},
 {source_id:sources[1].source_id,sheet_id:'1',role:'orders',columns:orders},
 {source_id:sources[1].source_id,sheet_id:'2',role:'orders',columns:orders},
 {source_id:sources[2].source_id,sheet_id:'csv',role:'orders',columns:orders}];
}
export function browserCandidateFixture(){return {members_bytes:Buffer.from('member_id,member_group\nm1,North\nm2,South\n'),orders_bytes:Buffer.from('order_id,order_member_id,paid_at,amount,status,currency\np1,m1,2026-01-02,10.00,paid,CNY\np2,m1,2026-01-03,20.00,paid,CNY\nc1,m1,2026-02-02,15.00,paid,CNY\nc2,m1,2026-02-03,30.00,paid,CNY\np3,m2,2026-01-02,10.00,paid,CNY\nc3,m2,2026-02-02,10.00,paid,CNY\n')};}
