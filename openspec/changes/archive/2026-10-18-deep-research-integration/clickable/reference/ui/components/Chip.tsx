/* 状态徽标:Xanthil 风格 chip(色调映射见 state/types.ts Tone)。 */
import type { ReactNode } from "react";
import type { Tone } from "../state/types";

const TONE_CLASS: Record<Tone, string> = {
  ok: "chip-ok",
  run: "chip-run",
  queue: "chip-queue",
  wait: "chip-wait",
  fail: "chip-fail",
  insuf: "chip-insuf",
  agg: "chip-agg",
  local: "chip-local",
  fork: "chip-fork",
  falsi: "chip-falsi",
  plain: "",
};

export default function Chip({ tone = "plain", title, children }: { tone?: Tone; title?: string; children: ReactNode }) {
  const cls = ["chip", TONE_CLASS[tone]].filter(Boolean).join(" ");
  return <span className={cls} title={title}>{children}</span>;
}
