# MacBook 原生验收接续 003

仅对应用户已批准的C，不含MacBook Provider/凭据、远程GUI或部署/Git。Mini已安装并校验同一native-004（22710模块文件、9关键资源/签名），包内Node/Chromium离线生成三格式。MacBook独立仓库及28个WIP文件哈希未变。

MacBook应用已按准确路径启动：`/Users/huangbo/Applications/JuanerAI-ReportStudio-Trial/Xanthil.app`。这只是启动及本机端口就绪，不代替插件/UI/Keynote验收。当前Mini的CUA只能操作Mini，按已批准请求003，本段由用户在MacBook完成；不启用屏幕共享，不用AppleScript替代。

请在MacBook按顺序操作，任一步失败保留现场并只回报该步，不反复重试：

1. 查看自动打开的JuanerAI本机页面，必要时点“在此页继续”。进入“插件与产品能力”→“打开报告工作台”。确认“JuanerAI内置”“尚未配置模型”“仅查看”，不要在MacBook输入密钥或发送制作请求。可新建一个“MacBook 离线合成验收”项目并确认独立报告无分析关联，刷新后仍可打开。
2. 用Keynote打开 `/Users/huangbo/JuanerAI-artifacts/report-studio-acceptance-20261016/macbook-installed-synthetic-001.pptx`。在编辑前先按⌘S，把`.key`明确保存到上述本地证据目录，名称`macbook-edited-002`，不要选iCloud，也不要覆盖其他文件。
3. 把第1页标题改为“MacBook 编辑后标题”，修改中文正文，将原生表格第一项100改101，通过“编辑图表数据”将原生图表第一项100改101。图表丢失或不能编辑即报告失败，不用图片替换。
4. 文件→导出为→PowerPoint，将`macbook-edited-002.pptx`存到同一本地证据目录；关闭后重新打开这个PPTX，核对四项修改仍在，两页中文无明显裁切/重叠。没有实际操作前保持NOT_RUN。
5. 用Chrome查看同目录`macbook-installed-synthetic-001.html`，用Preview查看同名`.pdf`，记录能否打开及中文是否明显异常。这两个旧合成近似样张没有PPTX中的原生图表，不能据此判完整三格式等价；该缺口保留。
6. 关闭本次合成文稿/查看窗口，从本次Xanthil正常退出（⌘Q）。若出现选择框，保留并回报，不强制退出或改权限。随后回复各步结果和“Xanthil已正常退出”或具体阻塞，Mini再只读核对自有进程/端口及导出字节。

记录结果时不包含密钥/业务文件。此前失败、未知、干净机和三格式质量缺口不因这次成功自动关闭。MacBook当前有独立源码环境，本轮不是“无源码干净Mac”证明。


## 用户后续决定 · 2026-10-16

用户先回复“已完成”。Mini只读回读确认本次app/子进程及59410端口已退出、独立仓库HEAD与28个WIP哈希未变，但约定路径没有macbook-edited-002.pptx/.key；未搜索用户其他目录或猜测文件位置。

在明确询问该缺口后，用户回复：“macbook后续用在实际产品中体验即可，授权通过验证”。据此接受MacBook本轮以已取得的安装/包内离线输出/退出证据通过，原生编辑/逐项UI与重开没有工程实测产物，作为用户知悉后的接续体验/风险接受项保留，不再要求本轮补做。该决定只针对MacBook此项，不是全Change用户Product Acceptance、Mini Provider通过、部署或Git授权。原步骤和EXPECTED_FILE_NOT_FOUND记录保留，不改成历史实测PASS。
