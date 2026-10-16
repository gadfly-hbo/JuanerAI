# RS-PROFILE-01：Personal显式装配

业务Application不选择Node/进程/HTTP实现。Personal组合根持有固定bundleRoot、预期身份、独立Studio数据目录；状态查询只核对资源，首次明确打开才启动。先RS-BUNDLE-01验证，失败不创建数据根、不执行入口、不回退独立版；并行启动复用本实例。

项目组合使用原projectId/projectRoot及权威readTask；创建私有关联Store和Application，Gateway委托同一已验证实例。打开明确关联后只签发指向该精确Studio项目的单次bootstrap URL；继续制作保持绑定不创建；独立工作台入口不自动创建/挂接。主分析停止不调用此运行器。

此装配增量不自动修改已运行宿主或安装服务，仍需宿主正常HTTP/UI接线与完整制作准入。只有无活动/未知任务的当前view-only状态允许直接close；制作启用前补齐退出保护。

## RS-DEPLOYMENT-01：相对固定资源身份

实际宿主装配只读取可信资源根内的report-studio-deployment.json，v1字段为schema_version/module/bundle_relative_path/version/source_commit/protocol_version/manifest_sha256；首个来源固定74ebb609，版本0.1.0-juanerai.1，bundle_relative_path固定report-studio。禁止绝对开发目录、路径遍历、自报最新版、环境变量发现或独立版回退。安装载体改变绝对路径时同一相对组合仍有效。

缺少描述符返回not_bundled；未知/损坏/软链描述符返回invalid。宿主可以继续原分析，不因此启动插件进程或创建Studio数据。有效描述符只构建延迟运行器，实际start前仍校验清单和所有字节；固定数据根在宿主userData/report-studio，和资源分离。此读取不是安装或部署动作，构建系统后续生成描述符并随实际载体交付。
