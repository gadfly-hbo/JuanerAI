import type {BoardView} from './reference/data/types.ts';
import type {DecisionReportLink} from '../../../packages/ports/decision-platform.ts';

/** Display-only host provenance; plugin IDs, slugs and persisted source records are unchanged. */
export function projectReportSources(view:BoardView,links:readonly DecisionReportLink[]):BoardView{
 return {...view,reports:view.reports.map(report=>{
  const link=links.find(value=>value.pluginReportId===String(report.id));
  return link?{...report,filename:`${link.source.filename} · 版本 ${link.source.revision}`}:report;
 })};
}
