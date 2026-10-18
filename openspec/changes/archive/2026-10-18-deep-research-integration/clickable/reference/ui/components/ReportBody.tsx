/* 报告正文渲染:与服务端导出共用 markdownToHtml,文本在渲染器内全量转义。 */
import { useMemo } from "react";
import { markdownToHtml } from "../../src/app/markdown";

export default function ReportBody({ md }: { md: string }) {
  const html = useMemo(() => markdownToHtml(md), [md]);
  return <div className="report-body" dangerouslySetInnerHTML={{ __html: html }} />;
}
