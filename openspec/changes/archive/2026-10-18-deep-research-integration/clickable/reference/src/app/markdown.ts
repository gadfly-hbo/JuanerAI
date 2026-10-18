/**
 * Markdown → HTML 渲染器(纯函数,无 Node/DOM 依赖)。
 * 服务端导出与前端阅读区共用;所有文本经 escapeHtml,不信任来源内容。
 * 支持机器生成报告的实际语法:h1-h4、无序/有序列表、管道表格、引用块、分隔线、**粗体**、`代码`、段落。
 */

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** 行内标记:粗体与行内代码(先转义再注入标签,顺序保证安全)。 */
function renderInline(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  return out;
}

interface MdSection {
  html: string;
  /** 章节标题(## 级),供正式报告装配对齐用 */
  heading?: string;
  level?: number;
}

const isTableLine = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isTableDivider = (line: string) => /^\s*\|[\s:|-]+\|\s*$/.test(line);

function parseTable(lines: string[]): string {
  const rows = lines.map((l) =>
    l
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim()),
  );
  // 第二行是 |---|---| 分隔行时第一行为表头
  const hasHeader = rows.length >= 2 && lines[1] !== undefined && isTableDivider(lines[1]);
  const body = hasHeader ? rows.slice(2) : rows;
  const head = hasHeader ? rows[0] : [];
  const parts: string[] = ['<table class="md-table">'];
  if (hasHeader) {
    parts.push("<thead><tr>" + head.map((c) => `<th>${renderInline(c)}</th>`).join("") + "</tr></thead>");
  }
  parts.push("<tbody>");
  for (const row of body) {
    parts.push("<tr>" + row.map((c) => `<td>${renderInline(c)}</td>`).join("") + "</tr>");
  }
  parts.push("</tbody></table>");
  return parts.join("");
}

/** 渲染一段 Markdown 正文(不含文档级 h1)为 HTML 块序列。 */
export function markdownBlocks(md: string): string[] {
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;
  const flushList = (ordered: boolean, items: string[]) => {
    if (items.length === 0) return;
    const tag = ordered ? "ol" : "ul";
    out.push(`<${tag}>` + items.map((t) => `<li>${renderInline(t)}</li>`).join("") + `</${tag}>`);
  };
  let ul: string[] = [];
  let ol: string[] = [];
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    const closeLists = () => {
      flushList(false, ul);
      ul = [];
      flushList(true, ol);
      ol = [];
    };
    if (trimmed === "") {
      closeLists();
      i += 1;
      continue;
    }
    if (isTableLine(line)) {
      closeLists();
      const tableLines: string[] = [];
      while (i < lines.length && isTableLine(lines[i])) {
        tableLines.push(lines[i]);
        i += 1;
      }
      out.push(parseTable(tableLines));
      continue;
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (heading) {
      closeLists();
      const level = heading[1].length;
      out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      closeLists();
      out.push("<hr/>");
      i += 1;
      continue;
    }
    const quote = /^>\s?(.*)$/.exec(trimmed);
    if (quote) {
      closeLists();
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }
      out.push("<blockquote>" + quoteLines.map((t) => `<p>${renderInline(t)}</p>`).join("") + "</blockquote>");
      continue;
    }
    const ulItem = /^[-*]\s+(.*)$/.exec(trimmed);
    if (ulItem) {
      flushList(true, ol);
      ol = [];
      ul.push(ulItem[1]);
      i += 1;
      continue;
    }
    const olItem = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    if (olItem) {
      flushList(false, ul);
      ul = [];
      ol.push(olItem[1]);
      i += 1;
      continue;
    }
    closeLists();
    out.push(`<p>${renderInline(trimmed)}</p>`);
    i += 1;
  }
  flushList(false, ul);
  flushList(true, ol);
  return out;
}

/** 渲染整篇 Markdown 为 HTML(含 h1)。 */
export function markdownToHtml(md: string): string {
  return markdownBlocks(md).join("\n");
}

/** 按标题切分 Markdown 为章节;h1 作为文档标题,## 及以下聚合成节。 */
export function splitMdSections(md: string): MdSection[] {
  const lines = md.split("\n");
  const sections: MdSection[] = [];
  let current: { heading?: string; level?: number; lines: string[] } = { lines: [] };
  const push = () => {
    const html = markdownBlocks(current.lines.join("\n")).join("\n");
    if (current.heading !== undefined || html.trim() !== "") {
      sections.push({ html, heading: current.heading, level: current.level });
    }
  };
  for (const line of lines) {
    const m = /^(#{1,3})\s+(.*)$/.exec(line.trim());
    if (m) {
      push();
      current = { heading: m[2], level: m[1].length, lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  push();
  return sections;
}

export { escapeHtml, renderInline };
