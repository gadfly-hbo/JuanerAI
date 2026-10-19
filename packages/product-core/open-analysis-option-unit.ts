/** Read-only presentation spans. The original text remains the candidate and
 * persistence/hash authority; this module supplies no facts or qualification. */
const optionTitle='可选建议（不自动执行）';
export const judgmentOptionFields=['goal','owner','authority','resources','cost','risk','alternatives','stop','observe'] as const;
export type JudgmentOptionUnit=Readonly<{body:string;fields:Readonly<Record<(typeof judgmentOptionFields)[number],string>>|null}>;
const heading=(line:string)=>line.match(/^#{1,6}[ \t]+(.+?)[ \t]*\r?$/)?.[1];
export function readJudgmentOptionUnit(raw:string):JudgmentOptionUnit|null{
 const lines=raw.trim().split('\n');if(heading(lines[0]!)!==optionTitle)return null;
 const first=lines.findIndex((line,index)=>index>0&&/^[ \t]*[-*][ \t]+[A-Za-z_]+[：:]/.test(line));
 if(first<0)return {body:lines.slice(1).join('\n').trim(),fields:null};
 const fields:Record<string,string>={};
 for(const line of lines.slice(first)){
  if(!line.trim())continue;
  const match=line.match(/^[ \t]*[-*][ \t]+([A-Za-z_]+)[：:][ \t]*(\S.*?)[ \t]*\r?$/);
  if(!match||!judgmentOptionFields.includes(match[1] as any)||Object.hasOwn(fields,match[1]!))return null;
  fields[match[1]!]=match[2]!;
 }
 if(judgmentOptionFields.some(key=>!Object.hasOwn(fields,key)))return null;
 return {body:lines.slice(1,first).join('\n').trim(),fields:fields as JudgmentOptionUnit['fields']};
}
export function judgmentResponseUnits(raw:string):string[]{
 const result:string[]=[];
 for(const section of raw.split(/(?=^#{1,6}[ \t]+)/m)){
  if(heading(section.trimStart().split('\n')[0]!)===optionTitle){result.push(section);continue;}
  const chunks=section.split(/(?=^[ \t]*[-*][ \t]+)|(?=\n[ \t]*\n)/m);let prefix='';const parts:string[]=[];
  for(const chunk of chunks){
   if(!chunk.trim()||/^#{1,6}[ \t]+[^\n]+$/.test(chunk.trim())){prefix+=chunk;continue;}
   parts.push(prefix+chunk);prefix='';
  }
  if(prefix){if(parts.length)parts[parts.length-1]+=prefix;else if(result.length&&!readJudgmentOptionUnit(result.at(-1)!))result[result.length-1]+=prefix;else parts.push(prefix);}
  result.push(...parts);
 }
 return result;
}
