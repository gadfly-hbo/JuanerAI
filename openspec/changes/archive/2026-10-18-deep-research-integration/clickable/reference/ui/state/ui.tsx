/* 外壳级 UI 状态:侧栏/Inspector 折叠(localStorage 持久)、Inspector 页签、命令面板开关。 */
import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

export type InspTab = "context" | "evidence" | "runs" | "sources";

interface UICtx {
  sbCollapsed: boolean;
  toggleSb(): void;
  inspCollapsed: boolean;
  toggleInsp(): void;
  inspTab: InspTab;
  setInspTab(t: InspTab): void;
  paletteOpen: boolean;
  openPalette(): void;
  closePalette(): void;
}

const Ctx = createContext<UICtx | null>(null);

const readStored = (key: string): boolean => {
  try { return localStorage.getItem(key) === "1"; } catch { return false; }
};
const writeStored = (key: string, on: boolean): void => {
  try { localStorage.setItem(key, on ? "1" : "0"); } catch { /* 隐私模式等场景忽略 */ }
};

export function UIProvider({ children }: { children: ReactNode }) {
  const [sbCollapsed, setSb] = useState(() => readStored("dr.sbCollapsed"));
  const [inspCollapsed, setInsp] = useState(() => readStored("dr.inspCollapsed"));
  const [inspTab, setInspTab] = useState<InspTab>("context");
  const [paletteOpen, setPaletteOpen] = useState(false);

  const toggleSb = useCallback(() => setSb((v) => { writeStored("dr.sbCollapsed", !v); return !v; }), []);
  const toggleInsp = useCallback(() => setInsp((v) => { writeStored("dr.inspCollapsed", !v); return !v; }), []);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  return (
    <Ctx.Provider value={{ sbCollapsed, toggleSb, inspCollapsed, toggleInsp, inspTab, setInspTab, paletteOpen, openPalette, closePalette }}>
      {children}
    </Ctx.Provider>
  );
}

export const useUI = (): UICtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUI 必须在 UIProvider 内使用");
  return ctx;
};
