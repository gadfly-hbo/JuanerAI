# 当前本机合成候选复验

仅在已授权的 Mini 隔离工程目录与合成数据中执行，不读取真实认证或触发 Provider、安装、Git 操作。完整 raw logs、exit、固定源与包保存在 `/Users/bendandebaba/JuanerAI-artifacts/metric-factory-integration/intake-20261019-001`。历史失败一律保留。

宿主 cwd `/Users/bendandebaba/.codex/worktrees/e7fc/JuanerAI`：

```sh
PATH=/Users/bendandebaba/Dev/Env/juanerai-toolchain/bin:$PATH \
MF_TEST_BUNDLE=/Users/bendandebaba/JuanerAI-artifacts/metric-factory-integration/intake-20261019-001/build-018/bundle \
MF_TEST_MANIFEST=c384fe7f3d88890826f580bb85be349fb1938071d719fa9610818bbbf6e2a0c3 \
node --test tests/integration/metric-factory/*.test.ts
```

最后完整 canonical 使用已有 Node26.0.0/npm11.12.1/duckdb1.5.2 与 Python3.14.4 的命令专用链接目录。它只改变本命令 PATH，没有改系统或共享工具链：

```sh
JUANERAI_TEST_EVIDENCE_DIR=/Users/bendandebaba/JuanerAI-artifacts/metric-factory-integration/intake-20261019-001 \
JUANERAI_TOOLCHAIN_BIN=/Users/bendandebaba/JuanerAI-artifacts/metric-factory-integration/intake-20261019-001/validation-bin \
tools/harness/validation/run --portable
```

供应 cwd `/Users/bendandebaba/Dev/Projects/metric-factory-juanerai-integration`：

```sh
PATH=/Users/bendandebaba/Dev/Env/juanerai-toolchain/bin:$PATH npm run typecheck
PATH=/Users/bendandebaba/Dev/Env/juanerai-toolchain/bin:$PATH node node_modules/vitest/vitest.mjs run test/integration/embedding.test.ts test/integration/runtime.test.ts
PATH=/Users/bendandebaba/Dev/Env/juanerai-toolchain/bin:$PATH npm run lint
```

供应 regression008 实际命令选择 `test/unit test/contracts test/integration` 及 `test/ui/{blueprint,drafts,export-download,instance-open,instance-review,receipts,release,sap-download,scenario,spa-create,spa-edit,spa-assist,spa-deliver,spa-at}.test.ts`，Vitest `-t '^(?!Playwright|敌意注入|F1 回归|F3 回归|C 表)'`，`MF_LLM_AUTH_JSON_PATH` 显式指向证据根内不存在的 `no-auth.json`。45文件、315PASS、9SKIP；不会用这个选择声称浏览器测试全通过。

固定构建：`tools/metric-factory/build-bundle.mjs` 输入必须逐项给出 supplier-snapshot-017 的绝对路径、身份SHA 238f5dc0b3818790c8e030c468be93537979665bf0e0bbce4b8de3955e70e331、新的输出目录、固定Node可执行文件、npm-cli.js、Node LICENSE。不要重用已存在build目录。构建不会调用Provider或安装应用；首次需要锁定依赖的registry读取。`stage-bundle.mjs` 校验并复制到全新resources根，再读回；它不宣称已有应用包含。

独立于构建的 installed Main 资源证据：`JUANERAI_METRIC_FACTORY_PACKAGE=1 JUANERAI_TEST_EVIDENCE_DIR=<上述根> node --test tools/report-studio/host-resource-build.test.mjs`（固定Node PATH）。此检查实际Vite构建并在隔离VM检验资源定位；不启动Electron、不触碰用户实例、不构成.app安装验证。

每次 canonical 使用全新空证据子目录；上面DIR应换成新子目录。旧文件wx拒绝覆盖是保全约束，不删除旧证据重跑。host-portable007因旧证据重名失败，008用portable-008-data保留新输出。供应009 typecheck通过；008文件名误标，实际为宿主typecheck，独立归属说明保存在同根。

当前供应regression012为318PASS/9SKIP/45files；F-MF-05永久HTTP回归在spa-assist.test.ts，同一文件6PASS/1浏览器项SKIP。host-integration014实际bundle015为20PASS/0SKIP。用户续授6任务/8请求后，真实试验账本已占6任务/6请求，第六项UNKNOWN与16384输出预留保持；任务额度已用尽，复验命令不授权再次调用Provider。

当前以regression014 321PASS/9SKIP/45files、typecheck017、host-integration016 21PASS/0SKIP、typecheck013、canonical011 exit0为准。canonical默认不包含Metric Factory21项，必须单独执行上述专属命令。F-MF-06历史损坏与F-MF-07绑定保存RED/GREEN原件在证据根；原失败不删除。

最新当前结果：supplier-review003-green003 17PASS/1SKIP；regression015 323PASS/9SKIP/45files；typecheck018、build018/stage019 exit0；host-integration017实际bundle018 21PASS/0SKIP。宿主产品代码未改，typecheck013及canonical011按未变范围复用。CLI003 FAIL仅对应旧host012/source016/bundle017；当前018尚待fresh独立审查。offline-business004不触发Provider，实际经营AI原稿未被人工夹具替换。
