export type MetricExpression=Readonly<{kind:'constant';value:string}|{kind:'reference';name:string}|{kind:'negate';value:MetricExpression}|{kind:'binary';operator:'+'|'-'|'*'|'/';left:MetricExpression;right:MetricExpression}>;
const fail=():never=>{throw Object.assign(new Error('ASSET_EXPRESSION_UNSUPPORTED'),{code:'ASSET_EXPRESSION_UNSUPPORTED'});};
/** Finite arithmetic grammar only: no eval, property access, calls or unknown tokens. */
export function parseMetricExpression(source:string):MetricExpression {
 if(typeof source!=='string'||!source.trim()||source.length>2048)fail();
 const tokens=source.match(/[a-z][a-z0-9_]*|(?:0|[1-9]\d*)(?:\.\d+)?|[()+\-*/]|\S/g)??[];if(tokens.length>256)fail();let i=0;
 const atom=():MetricExpression=>{const t=tokens[i++];if(t==='-')return {kind:'negate',value:atom()};if(t==='('){const e=add();if(tokens[i++]!==')')fail();return e;}if(t&&/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(t)&&t.length<=128)return {kind:'constant',value:t};if(t&&/^[a-z][a-z0-9_]*$/.test(t))return {kind:'reference',name:t};return fail();};
 const multiply=():MetricExpression=>{let e=atom();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++] as '*'|'/';e={kind:'binary',operator:op,left:e,right:atom()};}return e;};
 const add=():MetricExpression=>{let e=multiply();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++] as '+'|'-';e={kind:'binary',operator:op,left:e,right:multiply()};}return e;};const e=add();if(i!==tokens.length)fail();return e;
}
export function expressionReferences(e:MetricExpression):string[]{return e.kind==='reference'?[e.name]:e.kind==='constant'?[]:e.kind==='negate'?expressionReferences(e.value):[...expressionReferences(e.left),...expressionReferences(e.right)];}
/** Money exponent plus count exponent; structural arithmetic cannot mix units. */
export type MetricDimension=readonly [number,number];
export function expressionDimension(e:MetricExpression,resolve:(name:string)=>MetricDimension):MetricDimension {
 if(e.kind==='constant')return [0,0];if(e.kind==='reference')return resolve(e.name);if(e.kind==='negate')return expressionDimension(e.value,resolve);
 const a=expressionDimension(e.left,resolve),b=expressionDimension(e.right,resolve);if(e.operator==='+'||e.operator==='-'){if(a[0]!==b[0]||a[1]!==b[1])fail();return a;}const sign=e.operator==='*'?1:-1;return [a[0]+sign*b[0],a[1]+sign*b[1]];
}
export type ExactNumber=Readonly<{n:bigint;d:bigint}>;
/** Internal exact result representation; source amounts remain decimal-only. */
export function exactResultNumber(value:string):ExactNumber {
 if(!value.includes('/'))return exactNumber(value);
 const m=/^(-?(?:0|[1-9]\d*))\/([1-9]\d*)$/.exec(value);
 if(!m||value.length>512) return fail();
 return {n:BigInt(m[1]!),d:BigInt(m[2]!)};
}
export function exactNumber(value:string):ExactNumber {if(!/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)||value.length>128)fail();const [whole,part='']=value.split('.');return {n:BigInt(whole!)*10n**BigInt(part.length)+(whole!.startsWith('-')?-1n:1n)*BigInt(part||'0'),d:10n**BigInt(part.length)};}
export function exactOperation(a:ExactNumber,op:'+'|'-'|'*'|'/',b:ExactNumber):ExactNumber {if(op==='/'&&b.n===0n)fail();let n=op==='+'?a.n*b.d+b.n*a.d:op==='-'?a.n*b.d-b.n*a.d:op==='*'?a.n*b.n:a.n*b.d,d=op==='*'?a.d*b.d:op==='/'?a.d*b.n:a.d*b.d;if(d<0n){d=-d;n=-n;}let x=n<0n?-n:n,y=d;while(y){const r=x%y;x=y;y=r;}return {n:n/x,d:d/x};}
export function exactText(v:ExactNumber):string {if(v.n===0n)return '0';let n=v.n,d=v.d;const sign=n<0n?'-':'';n=n<0n?-n:n;let x=n,y=d;while(y){const r=x%y;x=y;y=r;}n/=x;d/=x;let tail=d,two=0,five=0;while(tail%2n===0n){tail/=2n;two++;}while(tail%5n===0n){tail/=5n;five++;}if(tail!==1n)return sign+n+'/'+d;const scale=Math.max(two,five),digits=(n*10n**BigInt(scale)/d).toString().padStart(scale+1,'0');return scale?sign+digits.slice(0,-scale)+'.'+digits.slice(-scale).replace(/0+$/,''):sign+digits;}
export function evaluateMetricExpression(e:MetricExpression,resolve:(name:string)=>ExactNumber):ExactNumber {if(e.kind==='constant')return exactNumber(e.value);if(e.kind==='reference')return resolve(e.name);if(e.kind==='negate'){const v=evaluateMetricExpression(e.value,resolve);return {n:-v.n,d:v.d};}return exactOperation(evaluateMetricExpression(e.left,resolve),e.operator,evaluateMetricExpression(e.right,resolve));}
