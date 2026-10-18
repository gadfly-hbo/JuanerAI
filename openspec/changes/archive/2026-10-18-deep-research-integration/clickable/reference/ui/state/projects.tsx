/* 项目列表上下文:侧栏、项目总览、命令面板共用一份数据。 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, errMsg, post } from "./api";
import type { Module, ProjectMeta } from "./types";
import { useToast } from "./toast";

interface ProjectsCtx {
  projects: ProjectMeta[];
  loaded: boolean;
  error: string | null;
  reload(): Promise<void>;
  create(form: { module: Module; goal: string; summary: string }): Promise<string | null>;
  toggleArchive(p: ProjectMeta): Promise<void>;
}

const Ctx = createContext<ProjectsCtx | null>(null);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const r = await api<{ projects: ProjectMeta[] }>("/api/projects");
      setProjects(r.projects);
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const create = useCallback(async (form: { module: Module; goal: string; summary: string }): Promise<string | null> => {
    try {
      const r = await post<{ id: string }>("/api/projects", {
        module: form.module,
        goal: form.goal,
        scope: { summary: form.summary, queries: [] },
      });
      toast.show("项目已创建");
      await reload();
      return r.id;
    } catch (e) {
      toast.show(errMsg(e));
      return null;
    }
  }, [reload, toast]);

  const toggleArchive = useCallback(async (p: ProjectMeta): Promise<void> => {
    try {
      await post(`/api/projects/${p.id}/archive`, { archived: p.status !== "archived" });
      toast.show(p.status === "archived" ? "已恢复到进行中" : "已归档,数据与版本全部保留");
      await reload();
    } catch (e) {
      toast.show(errMsg(e));
    }
  }, [reload, toast]);

  return (
    <Ctx.Provider value={{ projects, loaded, error, reload, create, toggleArchive }}>
      {children}
    </Ctx.Provider>
  );
}

export const useProjects = (): ProjectsCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProjects 必须在 ProjectsProvider 内使用");
  return ctx;
};
