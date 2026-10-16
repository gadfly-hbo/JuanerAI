# 036：正式Git集成与交付记录

2026-10-16。用户“批准036，按范围完成Git交付”。原Mini主工程连续负责；不写MacBook、不新安装/Provider/部署。

## 已保存身份与主线兼容

原HEAD1446276011917ec46b369eadaed40c059db46b34上的已审WIP，以bfa44ac88882368e8c896bd53743172da6f1fa2f保存253文件；全部提交字节与提交前指纹相同。已fetch固定origin/main=5e14913e04c079f4a2f16b9c3308c8246e4b7ec4（PR90），正常合入原work/mac-mini/report-studio-integration，不checkout/rebase/reset/stash/强推或覆盖他人WIP。

四个冲突为local-server、quick-analysis-client、quick-analysis-workbench和对应DOM测试替身。保留PR90单稿编审、引用/确认、草稿/阅读位置和布局，也保留Studio模态焦点、精确历史版本、菜单与关联交付。新路径的三项因果RED明确复现入口仍未接入/当前主稿无关联列表，恢复接线后原报告/新主稿、快/专业均通过；原断言保留。

资源接缝另因果RED：主线local-server有两个import.meta.url，原显式单引用守卫拒绝；缺新CSS及四份只读摘要输入。固定清单补齐，并让两个URL绑定同一资源树；默认Main新增可达文档读取器也显式绑定reader及模块URL。仍拒绝缺失、重复和未知形状，不加扫描/环境回退/通用打包框架，不改SDK/锁。

## 实际验证与未完成部分

- 定向136项单元全部PASS；新增菜单/新旧主稿/快专业5项包含在内。原8项Studio源码测试保留。
- 实际合成宿主3项通过：正常菜单取消/精确创建、稳定副本同字节、快专业、1440/1366/390宽度、精确历史返回、新版取消仍开旧项目、工作项目删除后副本可用；截图已读回。没有真实Provider或用户数据。
- 新资源闭合、默认开发/生产Main与Preload构建/VM、缺失/重复/形状负例3项PASS；实际内置浏览器Main入口经Forge Vite配置生成器构建/VM和24项资源/7摘要读取1项PASS。只是隔离构建夹具，没有重新封装.app、运行Electron/真实用户服务或安装。
- 首轮完整canonical17组4861tests/4837PASS/0FAIL/24历史SKIP、exit0/364.82秒；之后仅资源与构建测试变更，最终完整矩阵已启动，结果尚待收齐，不提前填PASS。
- 受影响独立最终评估、PR确切head required CI、squash、Mini安全main同步、适用归档集成尚待执行；无MacBook写入/同步或部署。Mini仍实际034包，MacBook未更新。

## 全部失败保持

提交前staged空白检查对原866字节作者patch的一条unified-diff上下文空行报错；编排未在此短路而完成了授权提交。随后逐项再次读回全部253提交文件与指纹一致，原patch SHA a5ea74bd…不变，其他路径空白检查PASS。原失败/实际时序单列，未伪称初次检查PASS，未改原作者补丁或全局空白策略。

首次定向命令误带未安装tsx导致环境FAIL，改回原Node26本地TS支持，不安装；不算产品RED。首次浏览器在resize异步重绘间抓住旧DOM报detached；测试现在等待旧主区断开再重新定位，断言和下载/历史/权限覆盖不减，首失败保存。原构建VM夹具从测试文件目录解析Vite拆分chunk报缺文件，改用生成入口原生CJS相对解析并限制输出目录；原默认Main的文档读取器未绑定引出Invalid URL，已通过显式清单修复。新内置入口夹具先误算23资源（实际24），再未用Forge配置导致node内建被浏览器shim化；改正固定计数并用真实Forge Vite生成器，不改产品构建策略。每次日志/退出/输出均以不同文件名保存；不把环境/夹具失败写成因果产品RED。

所有更早032产物FAIL/交付1、033接受/交付2、消费UNKNOWN/未知预留等继续沿原记录；两次新的构建修复没有读取或重置真实账本。

## 证据与当前返回点

Mini原持久根engineering-intake-20261016/engineering-closeout-030/git-delivery-036/保存授权、原冲突、源码指纹、完整diff、每次命令/日志/退出、浏览器截图/下载、Vite输出及资源清单。验收级资料无临时路径唯一副本。034/035包与安装证据在原license-followup-034/，互不替代。

当前返回点：收齐最终矩阵，准备生命周期归档与完整冻结候选，沿031既有实际Sol/high/read-only通道复核本次受影响兼容/资源/测试资产/归档，再完成确切head CI与授权交付。普通范围内修正继续原上下文；任何新增真实效果仍遵守036停止线。


## 2026-10-17最终本地验证收齐

036融合候选最终canonical17组4861tests/4837PASS/0FAIL/24历史SKIP，exit0/341.84秒；非记录源码与本次开跑身份逐字一致。定向136、实际合成浏览器3和资源/实际Vite构建/VM4项通过，三项UI接线与资源形状因果RED均保留。Main/Preload及内置浏览器入口只作隔离构建，没有重新封装.app/安装/启动现装服务/Provider；Mini仍034，MacBook用户免测且未更新。63原Change材料准备归档，9外部相对链接调整，全部独立报告原字节保持；当前等036独立受影响复核及确切PR head托管CI/实际合并，不提前称主线完成。

实际未来PR/CI/merge身份由GitHub和设备交付回执读回；本段不预填。新的构建夹具相对依赖由真实Forge Vite生成器闭合，默认资源20项/内置入口24项与7份身份摘要逐项校验。原r1–r5失败和源码/输出保持，不是产品模型失败。源码后验核对见postvalidation-code-readback-036.json。
