/**
 * 项目列表分组:按更新时间分为 今天/本周/本月/更早,组内按更新时间倒序;
 * 已归档项目不参与时间分组,单独成组置于最后。
 * 纯函数,前端与服务端测试共用。
 */
export interface ProjectLike {
  id: string;
  updatedAt: string;
  status?: "active" | "archived";
}

export interface ProjectGroup<T extends ProjectLike> {
  key: "today" | "week" | "month" | "earlier" | "archived";
  label: string;
  items: T[];
}

const DAY_MS = 86_400_000;

function startOfToday(now: Date): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** 本周起点:周一 00:00(本地时区) */
function startOfWeek(now: Date): number {
  const d = new Date(startOfToday(now));
  const dow = d.getDay() === 0 ? 7 : d.getDay(); // 周日按 7
  d.setDate(d.getDate() - dow + 1);
  return d.getTime();
}

function startOfMonth(now: Date): number {
  const d = new Date(now);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function groupProjects<T extends ProjectLike>(projects: T[], now: Date = new Date()): ProjectGroup<T>[] {
  const todayStart = startOfToday(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const groups: ProjectGroup<T>[] = [
    { key: "today", label: "今天", items: [] },
    { key: "week", label: "本周", items: [] },
    { key: "month", label: "本月", items: [] },
    { key: "earlier", label: "更早", items: [] },
    { key: "archived", label: "已归档", items: [] },
  ];
  const byKey = new Map(groups.map((g) => [g.key, g.items]));

  const sorted = [...projects].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  for (const p of sorted) {
    if (p.status === "archived") {
      byKey.get("archived")!.push(p);
      continue;
    }
    const t = new Date(p.updatedAt).getTime();
    if (t >= todayStart) byKey.get("today")!.push(p);
    else if (t >= weekStart) byKey.get("week")!.push(p);
    else if (t >= monthStart) byKey.get("month")!.push(p);
    else byKey.get("earlier")!.push(p);
  }
  return groups.filter((g) => g.items.length > 0);
}
