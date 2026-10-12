import type {PlainRecord} from '../../packages/product-core/local-analysis.ts';

// Adapter-private codecs shared by the retained and native consumers.
function protocol(){const error=Object.assign(new Error('PROTOCOL_FAILURE'),{code:'PROTOCOL_FAILURE'});error.stack=undefined;return error;}
function isPlainObject(value:unknown):value is PlainRecord{return value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}

export function closedTerminalJson(text: string): PlainRecord {
  if (text.startsWith('<think>')) {
    const end = text.indexOf('</think>');
    if (end < 0) throw protocol();
    const thought = text.slice('<think>'.length, end);
    if (thought.includes('<think>') || thought.includes('</think>')) throw protocol();
    text = text.slice(end + '</think>'.length);
  }
  let index = 0;
  const whitespace = () => {
    while (index < text.length && /[\t\n\r ]/.test(text[index])) index += 1;
  };
  const string = () => {
    const start = index;
    if (text[index] !== '"') throw protocol();
    index += 1;
    while (index < text.length) {
      const character = text[index];
      if (character === '"') { index += 1; return text.slice(start, index); }
      if (character < ' ') throw protocol();
      if (character === '\\') {
        index += 1;
        if ('"\\/bfnrt'.includes(text[index])) index += 1;
        else if (text[index] === 'u' && /^[0-9a-fA-F]{4}$/.test(text.slice(index + 1, index + 5))) index += 5;
        else throw protocol();
      } else index += 1;
    }
    throw protocol();
  };
  const value = () => {
    whitespace();
    if (text[index] === '"') { string(); return; }
    if (text[index] === '{') {
      index += 1;
      whitespace();
      const keys = new Set();
      if (text[index] === '}') { index += 1; return; }
      while (true) {
        whitespace();
        const key = JSON.parse(string());
        if (keys.has(key)) throw protocol();
        keys.add(key);
        whitespace();
        if (text[index] !== ':') throw protocol();
        index += 1;
        value();
        whitespace();
        if (text[index] === '}') { index += 1; return; }
        if (text[index] !== ',') throw protocol();
        index += 1;
      }
    }
    if (text[index] === '[') {
      index += 1;
      whitespace();
      if (text[index] === ']') { index += 1; return; }
      while (true) {
        value();
        whitespace();
        if (text[index] === ']') { index += 1; return; }
        if (text[index] !== ',') throw protocol();
        index += 1;
      }
    }
    if (text.startsWith('true', index)) { index += 4; return; }
    if (text.startsWith('false', index)) { index += 5; return; }
    if (text.startsWith('null', index)) { index += 4; return; }
    const number = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
    number.lastIndex = index;
    const match = number.exec(text);
    if (!match) throw protocol();
    index += match[0].length;
  };
  value();
  whitespace();
  if (index !== text.length) throw protocol();
  const parsed = JSON.parse(text);
  if (!isPlainObject(parsed)) throw protocol();
  return parsed;
}

export const desktopAssistanceSystemPrompt = `{"instruction":"Return exactly one JSON object for the disclosed action_kind, using its response template below.","response_templates":{"organize_question":{"draft_kind":"question_fields","draft_content":{"question_text":"string","hypothesis_display_title":"string","business_context":"string","alternative_explanations":["nonblank string"]}},"explain_evidence":{"draft_kind":"evidence_explanation","draft_content":{"evidence_explanation_text":"string"}},"draft_candidates":{"draft_kind":"candidates","draft_content":{"candidates":[{"title":"string","evidence_basis":"string","risk_or_refutation":"string","applicability_conditions":"string","future_validation_metric":"string"}]}}},"rules":["Choose only response_templates[action_kind]. Keep its draft_kind exactly; draft_content is an object, never a string.","Include every displayed field with exactly its displayed JSON type and no extra fields. All leaves shown as string are strings; alternative_explanations and candidates are arrays.","Replace template strings with concise draft text grounded only in the disclosed input. Preserve supplied question and hypothesis meaning; do not invent business facts. State uncertainty where evidence is absent.","Use an empty string for unavailable text and an empty array when there are no items. Each alternative_explanations item must be a nonblank string. Each candidate has all five displayed string fields, without IDs.","No Markdown fences, comments, duplicate keys, prefixes or suffixes. No tools, identities, preference, action execution, additional data or product authority. All output is an untrusted editable draft requiring human review."]}`;
