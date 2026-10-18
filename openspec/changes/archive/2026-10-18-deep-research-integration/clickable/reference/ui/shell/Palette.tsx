/* ⌘K 命令面板:跳项目 / 切阶段 / 新建 / 设置 / 切换面板。↑↓ 选择,Enter 执行,Esc 关闭。 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../state/projects";
import { useProjectOrNull } from "../state/projectDetail";
import { useUI } from "../state/ui";
import { MODULE_LABEL, STAGES } from "../state/types";

interface Item {
  glyph: string;
  label: string;
  hint?: string;
  run(): void;
}

export function Palette() {
  const ui = useUI();
  const navigate = useNavigate();
  const { projects } = useProjects();
  const p = useProjectOrNull();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<Item[]>(() => {
    const list: Item[] = [];
    if (p) {
      list.push({ glyph: "＋", label: "新建研究运行", hint: "当前项目", run: () => navigate(`/project/${p.id}/plan?new=1`) });
      for (const s of STAGES) {
        list.push({ glyph: String(STAGES.indexOf(s) + 1), label: `阶段 · ${s.title}`, hint: "当前项目", run: () => navigate(`/project/${p.id}/${s.key}`) });
      }
    }
    list.push({ glyph: "＋", label: "新建项目", run: () => navigate("/?new=1") });
    list.push({ glyph: "▤", label: "项目总览", run: () => navigate("/") });
    list.push({ glyph: "⚙", label: "设置", hint: "模型与预算", run: () => navigate("/settings") });
    list.push({ glyph: "⟨⟩", label: ui.sbCollapsed ? "展开侧边栏" : "收起侧边栏", hint: "⌘B", run: ui.toggleSb });
    list.push({ glyph: "◫", label: ui.inspCollapsed ? "展开 Inspector" : "收起 Inspector", hint: "⌘I", run: ui.toggleInsp });
    for (const proj of projects) {
      list.push({
        glyph: "▤",
        label: proj.goal,
        hint: MODULE_LABEL[proj.module],
        run: () => navigate(`/project/${proj.id}`),
      });
    }
    return list;
  }, [navigate, p, projects, ui]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((it) => `${it.label} ${it.hint ?? ""}`.toLowerCase().includes(needle));
  }, [items, q]);

  useEffect(() => {
    if (ui.paletteOpen) {
      setQ("");
      setSel(0);
      // 等面板挂载后聚焦
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [ui.paletteOpen]);

  if (!ui.paletteOpen) return null;

  const exec = (it: Item | undefined) => {
    if (!it) return;
    ui.closePalette();
    it.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      exec(filtered[sel]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      ui.closePalette();
    }
  };

  return (
    <div className="palette-veil" onClick={(e) => { if (e.target === e.currentTarget) ui.closePalette(); }}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="命令面板">
        <input
          ref={inputRef}
          type="text"
          className="palette-input"
          value={q}
          placeholder="输入命令或搜索(如:发布、设置、项目名)"
          aria-label="命令搜索"
          onChange={(e) => { setQ(e.target.value); setSel(0); }}
          onKeyDown={onKeyDown}
        />
        <ul className="palette-list" role="listbox" aria-label="命令列表">
          {filtered.length === 0 && <li className="palette-item" aria-disabled="true">无匹配命令</li>}
          {filtered.map((it, i) => (
            <li key={`${it.label}-${i}`} role="option" aria-selected={i === sel}>
              <button
                type="button"
                className={`palette-item${i === sel ? " active" : ""}`}
                onMouseEnter={() => setSel(i)}
                onClick={() => exec(it)}
              >
                <span className="p-glyph" aria-hidden="true">{it.glyph}</span>
                <span className="p-label">{it.label}</span>
                {it.hint && <span className="kbd-hint">{it.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
        <p className="fine palette-foot">↑↓ 选择 · Enter 执行 · Esc 关闭 · ⌘B 侧边栏 · ⌘I Inspector</p>
      </div>
    </div>
  );
}
