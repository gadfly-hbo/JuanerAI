// SAP 0.1 规范化序列化 + 指纹引擎（契约 §4；PRD「规范化序列化」段 + GRILL Q4 引号规则）
// 规范要点：输出为 UTF-8 语义的 JS 字符串（BOM 不适用）、LF、单一末尾换行、行尾无空格、2 空格缩进；
// 仅块式（空集合退化为 []/{}）、禁锚点/别名/tag、键按 UTF-16 码元字典序递归排序（深度优先）、无文档标记；
// 所有输入字符串先 NFC；仅 ^[a-z0-9][a-z0-9_.\-/]*$ 且非 YAML 1.2 core schema 非串类型者输出 plain，
// 其余字符串双引号 + JSON 转义；number/boolean 原样、null → null。
// 指纹：SHA-256 over UTF-8 字节，sha256:<hex> 前缀；自引用裁决 = package.fingerprint 置空字符串后计算。
import { createHash } from "node:crypto";

export type SapPackage = {
  package: { fingerprint: string } & Record<string, unknown>;
} & Record<string, unknown>;

const PLAIN_SAFE = /^[a-z0-9][a-z0-9_.\-/]*$/;
// YAML 1.2 core schema 的非串类型（null/bool/int/float），命中即不得 plain
const CORE_NULL = /^(?:~|null|Null|NULL)?$/;
const CORE_BOOL = /^(?:true|True|TRUE|false|False|FALSE)$/;
const CORE_INT = /^[-+]?(?:[0-9]+|0x[0-9a-fA-F]+|0o[0-7]+)$/;
const CORE_FLOAT = /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)(?:[eE][-+]?[0-9]+)?$|^(?:[-+]?\.(?:inf|Inf|INF))$|^(?:\.(?:nan|NaN|NAN))$/;

function isCoreNonString(s: string): boolean {
  return CORE_NULL.test(s) || CORE_BOOL.test(s) || CORE_INT.test(s) || CORE_FLOAT.test(s);
}

function quote(s: string): string {
  let out = '"';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 0x22) out += '\\"';
    else if (c === 0x5c) out += "\\\\";
    else if (c === 0x0a) out += "\\n";
    else if (c === 0x09) out += "\\t";
    else if (c === 0x0d) out += "\\r";
    else if (c < 0x20) out += `\\u${c.toString(16).padStart(4, "0")}`;
    else out += s[i];
  }
  return out + '"';
}

function scalarString(s: string): string {
  const nfc = s.normalize("NFC");
  return PLAIN_SAFE.test(nfc) && !isCoreNonString(nfc) ? nfc : quote(nfc);
}

function scalarNumber(n: number): string {
  if (!Number.isFinite(n)) {
    throw new RangeError(`canonicalize: 非有限数不可序列化（${n}）`);
  }
  return String(n);
}

function emitKey(key: string): string {
  return scalarString(key);
}

function emit(value: unknown, indent: number, pad: string, out: string[]): void {
  if (value === null || value === undefined) {
    out.push(`${pad}null`);
  } else if (typeof value === "string") {
    out.push(`${pad}${scalarString(value)}`);
  } else if (typeof value === "number") {
    out.push(`${pad}${scalarNumber(value)}`);
  } else if (typeof value === "boolean") {
    out.push(`${pad}${value}`);
  } else if (Array.isArray(value)) {
    if (value.length === 0) {
      out.push(`${pad}[]`);
      return;
    }
    for (const item of value) {
      const sub: string[] = [];
      emit(item, indent + 2, pad + "  ", sub);
      out.push(`${pad}- ${sub[0]!.slice(indent + 2)}`);
      out.push(...sub.slice(1));
    }
  } else if (typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    if (keys.length === 0) {
      out.push(`${pad}{}`);
      return;
    }
    for (const key of keys) {
      const v = (value as Record<string, unknown>)[key];
      const isBlock =
        v !== null &&
        typeof v === "object" &&
        (Array.isArray(v) ? v.length > 0 : Object.keys(v as Record<string, unknown>).length > 0);
      if (isBlock) {
        out.push(`${pad}${emitKey(key)}:`);
        emit(v, indent + 2, pad + "  ", out);
      } else {
        const sub: string[] = [];
        emit(v, indent + 2, pad + "  ", sub);
        out.push(`${pad}${emitKey(key)}: ${sub[0]!.slice(indent + 2)}`);
      }
    }
  } else {
    throw new TypeError(`canonicalize: 不支持的类型（${typeof value}）`);
  }
}

export function canonicalize(value: unknown): string {
  const lines: string[] = [];
  emit(value, 0, "", lines);
  return lines.join("\n") + "\n";
}

export function fingerprint(canonicalYaml: string): string {
  return `sha256:${createHash("sha256").update(canonicalYaml, "utf8").digest("hex")}`;
}

export function packageFingerprint(pkg: SapPackage): string {
  const cleared: SapPackage = {
    ...pkg,
    package: { ...pkg.package, fingerprint: "" }
  };
  return fingerprint(canonicalize(cleared));
}

// 内容指纹（G10 五键）：置空 fingerprint/created_at/exported_at/version/namespace 后计算——
// 内容指纹 = 纯业务内容对账键（重导出与无意义版本递增均不改写）；id（资产身份）与 generator（工具来源，红队 R1）保留
export function contentFingerprint(pkg: SapPackage): string {
  const review = (pkg.review as Record<string, unknown> | undefined) ?? {};
  const cleared: SapPackage = {
    ...pkg,
    package: { ...pkg.package, fingerprint: "", created_at: "", version: "", namespace: "" },
    review: { ...review, exported_at: "" }
  };
  return fingerprint(canonicalize(cleared));
}
