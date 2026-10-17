import type { ReactNode } from 'react'

interface WorkbenchShellProps {
  /** 主内容区（S1/S1b/S6/S2 卡片流）；DOM 在侧栏之前（G13 焦点顺序），视觉列位由 grid 控制 */
  children: ReactNode
  /** S-L 左栏报告导航 */
  reportNav: ReactNode
  /** S-R 右栏运行详情抽屉（展开时才渲染） */
  runDrawer?: ReactNode
}

/** 三栏工作台 shell（G13）：左栏 240px 固定 / 主区自适应 / 右栏抽屉；<1080px 折叠单列、主区在前 */
export function WorkbenchShell({ children, reportNav, runDrawer }: WorkbenchShellProps) {
  return (
    <div className="workbench">
      <main className="wb-main">{children}</main>
      {reportNav}
      {runDrawer}
    </div>
  )
}
