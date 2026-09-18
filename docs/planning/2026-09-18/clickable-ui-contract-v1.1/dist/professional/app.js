/* Xanthil Desktop 数分助手 · UI Contract · 模拟执行交互
   纯前端状态模拟：不读取真实文件，不调用模型 / Python / 网络；所有"运行"均为界面状态演示。 */
(function () {
  "use strict";
  var D = window.XANTHIL_DEMO_DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var state = {
    stage: "home",
    processStatus: "idle",      // idle | running | success | failed
    gateApproved: false,
    forked: false,
    subagentStatus: "queued",   // queued | running | success | failed | cancelled
    converged: false
  };

  // 异步运行代次隔离：本地处理 / subagent / 导览自动动作各自单调递增 token；
  // 新运行、取消、重置、数据失效或任何后续导航都会作废旧 token，任何 timer 在副作用前必须仍是当前代次
  var runTokens = { process: 0, subagent: 0, guide: 0 };
  function nextToken(kind) { runTokens[kind] += 1; return runTokens[kind]; }
  function isCurrent(kind, tok) { return runTokens[kind] === tok; }

  // 一切直接改变处理 / subagent / Gate / fork / 结论状态的用户显式操作，必须在自身副作用前
  // 作废待执行的导览代次：最新显式操作唯一生效，旧导览 auto 不得覆盖 / 伪批准（不经过 goto() 也要作废）
  function invalidPendingGuide() { nextToken("guide"); }

  var STAGES = ["home", "prepare", "process", "analysis", "report", "feedback"];

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 3200);
  }

  /* ---------- 阶段导航 ---------- */
  function stageUnlocked(stage) {
    var idx = STAGES.indexOf(stage);
    if (idx <= 2) return true; // home / prepare / process 始终可达
    if (stage === "analysis") return state.gateApproved;
    // report / feedback：需要 Gate 批准且主线结论已收敛（仅子任务真实成功后启用）
    return state.gateApproved && state.converged;
  }

  function blockedReason() {
    if (!state.gateApproved) return "聚合数据未经显式批准";
    return "主线结论尚未收敛（子任务未成功返回，无已支持结论）";
  }

  // 这些自动动作会先补齐最小就绪状态，允许直达目标阶段
  var UNLOCK_AUTOS = { fork: 1, subagent: 1, "fail-conclude": 1, "fail-subagent": 1 };
  // 导览自动动作导航期间，render 的视图校正让位于即将发生的快捷就绪
  var pendingAutoUnlock = false;

  function goto(stage, auto) {
    // 任何导览（含普通导航）都使旧的外层自动动作作废：最新动作唯一生效
    var gtok = nextToken("guide");
    if (!stageUnlocked(stage) && !(auto && UNLOCK_AUTOS[auto])) {
      toast("已阻止：" + blockedReason() + "，不能进入「" + D.stageNames[stage] + "」。");
      stage = stageUnlocked("analysis") ? "analysis" : "process";
    }
    pendingAutoUnlock = !!(auto && UNLOCK_AUTOS[auto]);
    state.stage = stage;
    render();
    if (auto) runAuto(auto, gtok);
    pendingAutoUnlock = false;
    $("#main").focus({ preventScroll: true });
  }

  function render() {
    // 视图校正：若非导览自动就绪场景且当前阶段已不可到达（如最新处理失败），
    // 退回最近的可到达阶段，避免停留在已锁定的分析 / 报告 / 反馈视图
    if (!pendingAutoUnlock && !stageUnlocked(state.stage)) {
      state.stage = stageUnlocked("analysis") ? "analysis" : "process";
    }
    // 视图切换
    STAGES.forEach(function (s) {
      $("#view-" + s).hidden = (s !== state.stage);
    });
    // 阶段条
    $$(".stage").forEach(function (b) {
      var s = b.getAttribute("data-stage");
      b.classList.toggle("active", s === state.stage);
      var idx = STAGES.indexOf(s), cur = STAGES.indexOf(state.stage);
      b.classList.toggle("done", idx < cur && stageUnlocked(s));
      b.classList.toggle("locked", !stageUnlocked(s));
    });
    // 状态栏
    $("#status-stage").textContent = D.stageNames[state.stage];
    $("#insp-stage-name").textContent = D.stageNames[state.stage];
    updateStatusRun();
    updateContextInspector();
  }

  function updateStatusRun() {
    var run = "空闲";
    if (state.processStatus === "running") run = "本地处理运行中（模拟）";
    else if (state.subagentStatus === "running") run = "子任务运行中（模拟）";
    else if (state.processStatus === "failed") run = "本地处理失败 · 分析被阻止";
    $("#status-run").textContent = run;
  }

  function updateContextInspector() {
    var dataStage = "原始数据已登记 · 未处理";
    var visible = "无（原始数据不可见）";
    if (state.processStatus === "success" && !state.gateApproved) {
      dataStage = "聚合产物已生成 · 待批准";
    }
    if (state.gateApproved) {
      dataStage = "聚合产物 A-01、A-02 已批准进入分析";
      visible = "A-01、A-02（仅聚合数据；原始数据不可见）";
    }
    var boundary = "仅已批准聚合数据";
    if (state.gateApproved) {
      boundary = "A-01、A-02 · 原始数据不可见";
    }
    if (state.processStatus === "failed") {
      dataStage = "本地处理失败 · 无可消费聚合产物";
      visible = "无（旧批准已失效 · 原始数据不可见）";
      boundary = "无 · 原始数据不可见";
    }
    $("#insp-data-stage").textContent = dataStage;
    $("#insp-model-visible").textContent = visible;
    $("#pill-boundary").textContent = "模型可见：" + boundary;
    $("#status-boundary").textContent = boundary;
  }

  /* ---------- 本地处理 ---------- */
  function setStep(step, status, pct) {
    var el = $('.pstep[data-step="' + step + '"]');
    var chip = $(".pstep-status", el);
    el.classList.remove("running", "done", "failed");
    var map = { wait: ["待运行", "chip-wait"], running: ["运行中（模拟）", "chip-run"], done: ["成功", "chip-ok"], failed: ["失败", "chip-fail"] };
    chip.textContent = map[status][0];
    chip.className = "chip pstep-status " + map[status][1];
    if (status === "running") el.classList.add("running");
    if (status === "done") el.classList.add("done");
    if (status === "failed") el.classList.add("failed");
    $(".bar-fill", el).style.width = (pct || 0) + "%";
    if (status === "done") $(".bar-fill", el).classList.add("full");
  }

  function resetProcessUI() {
    ["extract", "clean", "agg"].forEach(function (s) { setStep(s, "wait", 0); });
    $("#process-error").hidden = true;
    $("#process-summary").hidden = true;
    $("#btn-retry-process").hidden = true;
    $("#btn-reprocess").hidden = true;
    $("#btn-run-process").hidden = false;
    $("#btn-run-process").disabled = false;
    $("#gate-blocked").hidden = true;
    $("#gate-wait").hidden = false;
    $("#gate-wait").innerHTML = '<span class="chip chip-wait">等待</span> 请先成功完成本地处理，再批准聚合产物进入分析。';
    $("#gate-desc").innerHTML = "批准后，以上 <strong>2 个聚合产物</strong> 将对模型可见；<strong>原始数据始终不可见</strong>。不批准则无法进入循证分析。";
    $("#btn-approve-gate").disabled = true;
    $("#btn-approve-gate").textContent = "批准并进入循证分析 →";
    $("#gate-card").style.borderLeftColor = "";
    $("#agg-ready-prepare").hidden = true;
    $("#agg-empty").hidden = false;
    $("#agg-pill-prepare").textContent = "待生成";
  }

  // 撤销既有收敛结论（子任务重跑 / 数据失效时调用）：H1 回验证中，反例与收敛收回，报告/反馈重新锁定
  function revokeConclusions() {
    state.converged = false;
    $("#h1-counter").hidden = true;
    var h1 = $("#hypo-h1");
    h1.classList.remove("falsified");
    var st = $("#h1-status");
    st.textContent = "验证中";
    st.className = "chip chip-run hypo-status";
    var inspH1 = $("#insp-h1");
    inspH1.textContent = "验证中";
    inspH1.className = "chip chip-run";
    $("#converge-card").hidden = true;
    $("#conclude-block").hidden = true;
    $("#btn-to-report").disabled = true;
    $("#to-report-hint").textContent = "仅在子任务成功返回并完成收敛后，才可生成报告草稿";
  }

  // 失效旧的聚合批准与全部下游状态（重新处理 / 重置时调用）
  function invalidateDownstream() {
    var hadDownstream = state.gateApproved || state.converged || state.subagentStatus !== "queued";
    state.gateApproved = false;
    revokeConclusions();
    // 作废在途 subagent 运行代次：任何旧回调不得再写状态 / 日志 / 结论 / UI
    nextToken("subagent");
    // fork 属于旧聚合语境的产物：一并撤销，允许新语境重建
    state.forked = false;
    $("#sb-fork").hidden = true;
    $("#fork-banner").hidden = true;
    // Gate 卡恢复未批准态
    $("#gate-card").style.borderLeftColor = "";
    $("#gate-desc").innerHTML = "批准后，以上 <strong>2 个聚合产物</strong> 将对模型可见；<strong>原始数据始终不可见</strong>。不批准则无法进入循证分析。";
    $("#btn-approve-gate").disabled = true;
    $("#btn-approve-gate").textContent = "批准并进入循证分析 →";
    $("#gate-blocked").hidden = true;
    $("#gate-wait").hidden = false;
    $("#gate-wait").innerHTML = '<span class="chip chip-wait">等待</span> 请先成功完成本地处理，再批准聚合产物进入分析。';
    // 数据准备页聚合区回到空
    $("#agg-ready-prepare").hidden = true;
    $("#agg-empty").hidden = false;
    $("#agg-pill-prepare").textContent = "待生成";
    // 旧成功产物的摘要与预览一并失效
    $("#process-summary").hidden = true;
    // 分析侧：子任务回到排队，错误文案恢复初始（结论撤销已由 revokeConclusions 完成）
    setSubagent("queued");
    $("#h1-sa-bar").hidden = true;
    $("#h1-sa-error").hidden = true;
    $("#h1-sa-err-title").textContent = "子任务失败（演示失败路径 3）。";
    $("#h1-sa-err-text").textContent = "原因（合成）：库存切片缺少对照门店字段，核验未完成。";
    $("#h1-sa-desc").textContent = "任务：在 L-03 库存切片上核验缺码门店与对照门店的复购差异（有界任务，只返回证据摘要）。";
    if (hadDownstream) {
      addLog("重新处理开始：旧聚合批准、分叉与下游产物已全部失效，需重新成功处理并批准。");
    }
  }

  function runProcess(simulateFail) {
    // 新运行取得新代次：旧 timer 全部作废
    var tok = nextToken("process");
    // 重新开始处理：使旧批准与下游失效（幂等；首次运行无下游时无副作用）
    invalidateDownstream();
    state.processStatus = "running";
    state.subagentStatus = "queued";
    render();
    var btn = $("#btn-run-process");
    btn.disabled = true;
    btn.hidden = false;
    $("#btn-reprocess").hidden = true;
    btn.textContent = "本地处理中（模拟）…";
    toast("UI Contract · 模拟执行：处理进度为界面模拟，未运行真实 Python。");

    setStep("extract", "running", 40);
    setTimeout(function () {
      if (!isCurrent("process", tok)) return; // 已被新运行 / 重置取代：不得写任何 UI
      setStep("extract", "done", 100);
      setStep("clean", "running", 55);
    }, 700);
    setTimeout(function () {
      if (!isCurrent("process", tok)) return;
      setStep("clean", "done", 100);
      setStep("agg", "running", simulateFail ? 62 : 55);
    }, 1400);
    setTimeout(function () {
      if (!isCurrent("process", tok)) return; // 旧成功回调不得产生可批准窗口
      if (simulateFail) {
        setStep("agg", "failed", 62);
        state.processStatus = "failed";
        // 显式再次保证 Gate 与下游失效（双保险：即使之前被旧回调或批准窗口污染）
        state.gateApproved = false;
        revokeConclusions();
        nextToken("subagent");
        setSubagent("queued");
        $("#h1-sa-bar").hidden = true;
        $("#h1-sa-error").hidden = true;
        state.forked = false;
        $("#sb-fork").hidden = true;
        $("#fork-banner").hidden = true;
        $("#process-error").hidden = false;
        $("#btn-retry-process").hidden = false;
        btn.hidden = true;
        // fail closed：阻塞 Gate
        $("#gate-desc").textContent = "本地处理失败：未生成任何聚合产物，当前没有可批准的内容。";
        $("#gate-blocked").hidden = false;
        $("#gate-wait").hidden = true;
        $("#btn-approve-gate").disabled = true;
        $("#agg-pill-prepare").textContent = "生成失败 · 无可消费产物";
        addLog("本地处理失败：字段 member_tier 缺失（合成错误）；未生成聚合产物，Gate 与下游已撤销，分析通道被阻止。");
        toast("失败路径 1：本地处理失败，未生成聚合数据，进入分析被阻止。");
      } else {
        setStep("agg", "done", 100);
        state.processStatus = "success";
        $("#process-summary").hidden = false;
        btn.hidden = true;
        $("#btn-reprocess").hidden = false;
        $("#gate-wait").innerHTML = '<span class="chip chip-run">待确认</span> 聚合产物已生成，等待你显式批准后才可被模型可见。';
        $("#btn-approve-gate").disabled = false;
        $("#agg-ready-prepare").hidden = false;
        $("#agg-empty").hidden = true;
        $("#agg-pill-prepare").textContent = "已生成 · 待批准";
        addLog("本地处理成功：生成聚合产物 A-01、A-02（合成数据，共 20 行），等待批准。");
        toast("本地处理完成（模拟）：聚合产物已生成，等待显式批准。");
      }
      render();
    }, 2300);
    return tok;
  }

  /* ---------- 聚合 Gate ---------- */
  function approveGate() {
    if (state.processStatus !== "success") return;
    if (state.gateApproved) return; // 防重：已批准时代次 / 视图不受重复批准影响
    state.gateApproved = true;
    $("#gate-card").style.borderLeftColor = "var(--ok)";
    $("#gate-desc").innerHTML = "<strong>已批准。</strong>聚合产物 A-01、A-02 现已对模型可见；原始数据始终不可见。";
    // 已批准后按钮唯一呈现为禁用状态，不再承诺可点击的“进入循证分析”
    var btn = $("#btn-approve-gate");
    btn.disabled = true;
    btn.textContent = "已批准";
    $("#gate-wait").hidden = true;
    $("#agg-pill-prepare").textContent = "已批准 · 可进入分析";
    addLog("用户显式批准：聚合产物 A-01、A-02 对模型可见（留痕于处理记录）。");
    render();
    goto("analysis");
  }

  /* ---------- 循证分析 ---------- */
  function setSubagent(status) {
    state.subagentStatus = status;
    var chip = $("#h1-sa-status");
    var map = {
      queued: ["排队中", "chip-queue"],
      running: ["运行中（模拟）", "chip-run"],
      success: ["成功 · 返回反例", "chip-ok"],
      failed: ["失败", "chip-fail"],
      cancelled: ["已取消", "chip-cancel"]
    };
    chip.textContent = map[status][0];
    chip.className = "chip " + map[status][1];
    var insp = $("#insp-sa-h1");
    insp.textContent = map[status][0];
    insp.className = "chip " + map[status][1];
    updateStatusRun();
  }

  function runSubagent(simulateFail) {
    if (state.subagentStatus === "running") return;
    // 新运行取得新代次：旧 timer（含取消/替换遗留）全部作废
    var tok = nextToken("subagent");
    // 每次新运行先撤销该子任务此前的结论状态：重跑失败/取消不得残留旧成功产物
    if (state.converged) {
      revokeConclusions();
      addLog("重跑子任务：旧收敛、反例 E-103 与「已证伪」判定已撤销，H1 回到「验证中」；报告重新锁定。");
    }
    setSubagent("running");
    $("#h1-sa-bar").hidden = false;
    $(".bar-fill", $("#h1-sa-bar")).style.width = "10%";
    $("#h1-sa-error").hidden = true;
    $("#h1-sa-err-title").textContent = "子任务失败（演示失败路径 3）。";
    $("#h1-sa-err-text").textContent = "原因（合成）：库存切片缺少对照门店字段，核验未完成。";
    $("#h1-sa-desc").textContent = "子任务运行中（模拟）：正在核验缺码门店与对照门店的复购差异…";
    render();
    var fill = $(".bar-fill", $("#h1-sa-bar"));
    setTimeout(function () {
      if (!isCurrent("subagent", tok)) return; // 已被取消 / 替换 / 数据失效：不留痕
      fill.style.width = "55%";
    }, 500);
    setTimeout(function () {
      if (!isCurrent("subagent", tok)) return; // 关键：旧回调不得结算新运行
      fill.style.width = "100%";
      if (simulateFail) {
        setSubagent("failed");
        $("#h1-sa-error").hidden = false;
        $("#h1-sa-desc").textContent = "任务未完成：失败原因见下方卡片（合成）。H1 保持「验证中」。";
        addLog("子任务「尺码库存证据核验」失败：库存切片缺少对照门店字段（合成）；未伪造结果。");
        $("#to-report-hint").textContent = "子任务失败：无结果、不生成报告；主 Session 可继续追问或修正后重试。";
        toast("失败路径 3：子任务失败，显示状态与原因；不生成报告，主 Session 可继续。");
      } else {
        settleSuccess();
      }
      render();
    }, 1500);
    return tok;
  }

  // 子任务真实成功：返回反例 → H1 证伪 → 收敛 → 才允许生成报告
  function settleSuccess() {
    setSubagent("success");
    $("#h1-sa-bar").hidden = true;
    $("#h1-counter").hidden = false;
    var h1 = $("#hypo-h1");
    h1.classList.add("falsified");
    var st = $("#h1-status");
    st.textContent = "已证伪";
    st.className = "chip chip-falsi hypo-status";
    var inspH1 = $("#insp-h1");
    inspH1.textContent = "已证伪";
    inspH1.className = "chip chip-falsi";
    $("#h1-sa-desc").textContent = "返回证据摘要：对照门店（尺码齐全）复购同样下滑 -3.9pp，登记为反例 E-103；H1 被证伪。";
    $("#converge-card").hidden = false;
    state.converged = true;
    addLog("子任务返回反例 E-103：H1「缺码假设」被证伪；主线结论收敛至 H2。");
    toast("subagent 返回反例 E-103：H1 已证伪，主线结论收敛。");
    enableReport();
  }

  function cancelSubagent() {
    if (state.subagentStatus !== "running" && state.subagentStatus !== "queued") return;
    nextToken("subagent"); // 作废在途运行：任何旧 timer 在取消后不得再修改结果
    setSubagent("cancelled");
    $("#h1-sa-bar").hidden = true;
    $("#h1-sa-err-title").textContent = "子任务已取消（演示失败路径 3）。";
    $("#h1-sa-err-text").textContent = "由用户取消；未产生任何结果，H1 保持「验证中」，不会被当作已核验。";
    $("#h1-sa-error").hidden = false;
    addLog("子任务「尺码库存证据核验」已被用户取消；不伪造结果，报告保持不可生成，主 Session 保持可用。");
    $("#to-report-hint").textContent = "子任务已取消：无结果、不生成报告；主 Session 可继续追问或重新运行。";
    toast("子任务已取消：显示状态与原因；不生成报告，主 Session 继续可用。");
    render();
  }

  function enableReport() {
    $("#btn-to-report").disabled = false;
    $("#to-report-hint").textContent = "假设已收敛（H2 已支持 / H1 已证伪），可生成报告草稿";
  }

  function forkSession() {
    if (state.forked) { toast("分叉已存在：左侧边栏「分叉 · 促销节奏假设」。"); return; }
    state.forked = true;
    $("#sb-fork").hidden = false;
    $("#fork-banner").hidden = false;
    addLog("创建分叉分支「促销节奏假设」：自主线 #12 分叉，主线结论不受影响。");
    toast("已创建分叉替代路径：左侧边栏出现「⑂ 分叉 · 促销节奏假设」。");
    render();
  }

  /* ---------- 证据回链 ---------- */
  function showEvidence(id) {
    var evi = D.evidence[id];
    if (!evi) return;
    openInspectorTab("evidence");
    $("#insp-evi-detail").innerHTML =
      "<p><strong>" + id + " · " + evi.title + "</strong></p>" +
      "<p>" + evi.detail + "</p>" +
      '<p class="fine">来源：' + evi.source + " · 关联：" + evi.hypothesis + "</p>";
  }

  /* ---------- Inspector ---------- */
  var INSP_TABS = ["context", "evidence", "tasks", "skills"];

  function openInspectorTab(tab, focusTab) {
    document.body.classList.remove("insp-collapsed");
    $("#btn-inspector").setAttribute("aria-expanded", "true");
    INSP_TABS.forEach(function (p) {
      var t = $("#tab-" + p);
      var active = (p === tab);
      t.classList.toggle("active", active);
      t.setAttribute("aria-selected", String(active));
      t.setAttribute("tabindex", active ? "0" : "-1");
      $("#insp-" + p).hidden = !active;
    });
    if (focusTab) $("#tab-" + tab).focus();
  }

  function inspTabKey(e) {
    var keys = { ArrowRight: 1, ArrowLeft: -1, Home: "home", End: "end" };
    if (!(e.key in keys)) return;
    e.preventDefault();
    var cur = INSP_TABS.indexOf(document.activeElement.getAttribute("data-insp"));
    var next;
    if (keys[e.key] === "home") next = 0;
    else if (keys[e.key] === "end") next = INSP_TABS.length - 1;
    else next = (cur + keys[e.key] + INSP_TABS.length) % INSP_TABS.length;
    openInspectorTab(INSP_TABS[next], true); // 自动激活模式：焦点即激活
  }

  function addLog(text) {
    var li = document.createElement("li");
    li.textContent = text;
    $("#insp-log").appendChild(li);
  }

  /* ---------- 窗口语境 ---------- */
  function setChrome(kind) {
    document.body.setAttribute("data-chrome", kind);
    toast("窗口语境已切换为 " + (kind === "win" ? "Windows" : "macOS") + "（仅演示标题栏语境）。");
  }

  /* ---------- 命令面板 ---------- */
  var paletteSel = 0;
  var paletteReturnFocus = null;
  var guideReturnFocus = null;
  function paletteItems() {
    var q = $("#palette-input").value.trim().toLowerCase();
    return D.commands.filter(function (c) {
      return !q || c.label.toLowerCase().indexOf(q) >= 0 || (c.hint || "").toLowerCase().indexOf(q) >= 0;
    });
  }
  function renderPalette() {
    var list = $("#palette-list");
    var items = paletteItems();
    paletteSel = Math.min(paletteSel, Math.max(0, items.length - 1));
    list.innerHTML = "";
    items.forEach(function (c, i) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.className = "palette-item" + (i === paletteSel ? " active" : "");
      b.setAttribute("role", "option");
      b.innerHTML = "<span>" + c.label + "</span>" + (c.hint ? '<span class="kbd-hint">' + c.hint + "</span>" : "");
      b.addEventListener("click", function () { execCommand(c); });
      li.appendChild(b);
      list.appendChild(li);
    });
  }
  function openPalette() {
    paletteReturnFocus = document.activeElement;
    $("#palette-veil").hidden = false;
    $("#palette-input").value = "";
    paletteSel = 0;
    renderPalette();
    $("#palette-input").focus();
  }
  function closePalette() {
    if ($("#palette-veil").hidden) return;
    $("#palette-veil").hidden = true;
    if (paletteReturnFocus && paletteReturnFocus.focus) paletteReturnFocus.focus();
  }
  // 弹层焦点陷阱：Tab / Shift+Tab 在弹层内循环
  function trapFocus(veil, containerSel, e) {
    if (e.key !== "Tab") return;
    var focusables = $$(containerSel + " button:not([hidden]), " + containerSel + " input, " + containerSel + " [tabindex='0']", veil)
      .filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
    if (!focusables.length) return;
    var first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function execCommand(c) {
    closePalette();
    if (c.stage) { goto(c.stage, c.auto); return; }
    switch (c.action) {
      case "guide": openGuide(); break;
      case "chrome-mac": setChrome("mac"); break;
      case "chrome-win": setChrome("win"); break;
      case "toggle-sb": toggleSidebar(); break;
      case "toggle-insp": toggleInspector(); break;
      case "reset": location.reload(); break;
    }
  }

  /* ---------- 演示导览 ---------- */
  function openGuide() {
    guideReturnFocus = document.activeElement;
    $("#guide-veil").hidden = false;
    $("#btn-guide-close").focus();
  }
  function closeGuide() {
    if ($("#guide-veil").hidden) return;
    $("#guide-veil").hidden = true;
    if (guideReturnFocus && guideReturnFocus.focus) guideReturnFocus.focus();
  }

  /* ---------- 自动演示动作 ---------- */
  function runAuto(auto, gtok) {
    setTimeout(function () {
      if (!isCurrent("guide", gtok)) return; // 旧导览/自动动作已被后续导航作废：零副作用
      switch (auto) {
        case "process":
          $("#toggle-fail-process").checked = false;
          resetProcessUI();
          state.processStatus = "idle";
          runProcess(false);
          break;
        case "gate":
          if (state.processStatus !== "success") {
            $("#toggle-fail-process").checked = false;
            resetProcessUI();
            state.processStatus = "idle";
            // 延迟审批绑定本次处理代次与本次导览代次：任何后续处理 / 重置 / 导览动作都会使旧审批作废
            var ptok = runProcess(false);
            setTimeout(function () {
              if (!isCurrent("guide", gtok) || !isCurrent("process", ptok) || state.gateApproved) return; // 旧审批不得批准新一代产物
              approveGate();
            }, 2600);
          } else {
            approveGate();
          }
          break;
        case "fork":
          ensureAnalysisReady(function () { forkSession(); });
          break;
        case "subagent":
          ensureAnalysisReady(function () {
            $("#toggle-fail-subagent").checked = false;
            runSubagent(false);
          });
          break;
        case "fail-process":
          $("#toggle-fail-process").checked = true;
          resetProcessUI();
          state.processStatus = "idle";
          runProcess(true);
          break;
        case "fail-conclude":
          ensureAnalysisReady(function () {
            function showConcludeBlock() {
              $("#conclude-block").hidden = false;
              toast("失败路径 2：证据不足 / 已证伪内容已被阻止写入确定结论。");
            }
            if (state.converged) {
              // 已有真实收敛证据：直接演示"写入被阻止"
              showConcludeBlock();
            } else {
              // 失败/取消或未收敛：先完整运行一次可观察的成功流程（排队→运行→成功返回反例），再演示阻止。
              // 延迟回调绑定本次子任务代次与本次导览代次：期间被取消 / 替换 / 数据失效 / 后续导航则无任何副作用。
              $("#toggle-fail-subagent").checked = false;
              var atok = runSubagent(false);
              setTimeout(function () {
                if (!isCurrent("guide", gtok) || !isCurrent("subagent", atok) || state.converged !== true) return;
                showConcludeBlock();
              }, 2400);
            }
          });
          break;
        case "fail-subagent":
          ensureAnalysisReady(function () {
            $("#toggle-fail-subagent").checked = true;
            runSubagent(true);
          });
          break;
      }
    }, 350);
  }

  // 进入分析前的最小就绪：处理成功 + Gate 批准
  function ensureAnalysisReady(fn) {
    if (state.gateApproved) { fn(); return; }
    // 快捷覆盖处理 / Gate 状态前，作废在途 process 代次：任何旧处理回调不得反向覆盖本次就绪
    nextToken("process");
    state.processStatus = "success";
    state.gateApproved = true;
    // 一致刷新处理页视图
    ["extract", "clean", "agg"].forEach(function (s) { setStep(s, "done", 100); });
    $("#process-summary").hidden = false;
    $("#process-error").hidden = true;
    $("#btn-run-process").hidden = true;
    $("#btn-reprocess").hidden = false;
    $("#btn-retry-process").hidden = true;
    // Gate 卡一致刷新
    $("#gate-card").style.borderLeftColor = "var(--ok)";
    $("#gate-desc").innerHTML = "<strong>已批准。</strong>聚合产物 A-01、A-02 现已对模型可见；原始数据始终不可见。";
    $("#btn-approve-gate").disabled = true;
    $("#btn-approve-gate").textContent = "已批准";
    $("#gate-wait").hidden = true;
    $("#gate-blocked").hidden = true;
    // 聚合产物区一致刷新
    $("#agg-ready-prepare").hidden = false;
    $("#agg-empty").hidden = true;
    $("#agg-pill-prepare").textContent = "已批准 · 可进入分析";
    addLog("演示导览：快捷就绪（界面模拟）——按冻结主流程完成本地处理并批准聚合产物。");
    fn();
    // 视图归位：快捷就绪的导览动作目标均为循证分析；此前若被失败处理的视图校正拉回 process，此处恢复
    state.stage = "analysis";
    render();
  }

  /* ---------- 侧栏 / Inspector 开关 ---------- */
  function toggleSidebar() {
    var collapsed = document.body.classList.toggle("sb-collapsed");
    $("#btn-sidebar").setAttribute("aria-expanded", String(!collapsed));
    $("#btn-sidebar").textContent = collapsed ? "⟩" : "⟨";
  }
  function toggleInspector() {
    var collapsed = document.body.classList.toggle("insp-collapsed");
    $("#btn-inspector").setAttribute("aria-expanded", String(!collapsed));
  }

  /* ---------- 事件绑定 ---------- */
  function bind() {
    // 阶段导航
    $$(".stage").forEach(function (b) {
      b.addEventListener("click", function () { goto(b.getAttribute("data-stage")); });
    });
    // 通用跳转
    $$("[data-goto]").forEach(function (b) {
      b.addEventListener("click", function () { goto(b.getAttribute("data-goto")); });
    });
    // 演示导览步骤（带自动动作）
    $$(".guide-step").forEach(function (b) {
      b.addEventListener("click", function () {
        closeGuide();
        goto(b.getAttribute("data-goto"), b.getAttribute("data-auto"));
      });
    });

    $("#btn-new").addEventListener("click", function () { goto("home"); toast("演示中：直接回到「新建分析」。"); });
    $("#btn-sidebar").addEventListener("click", toggleSidebar);
    $("#btn-inspector").addEventListener("click", toggleInspector);
    $("#btn-insp-close").addEventListener("click", toggleInspector);
    $("#btn-guide").addEventListener("click", openGuide);
    $("#btn-guide-close").addEventListener("click", closeGuide);
    $("#guide-veil").addEventListener("click", function (e) { if (e.target === this) closeGuide(); });
    $("#palette-veil").addEventListener("click", function (e) { if (e.target === this) closePalette(); });
    $("#btn-palette-sb").addEventListener("click", openPalette);
    $("#btn-chrome-mac").addEventListener("click", function () { setChrome("mac"); });
    $("#btn-chrome-win").addEventListener("click", function () { setChrome("win"); });
    $("#btn-reset").addEventListener("click", function () { location.reload(); });

    // 本地处理（所有直接状态操作都先作废待执行导览，最新显式操作唯一生效）
    $("#btn-run-process").addEventListener("click", function () { invalidPendingGuide(); runProcess($("#toggle-fail-process").checked); });
    $("#btn-reprocess").addEventListener("click", function () { invalidPendingGuide(); runProcess($("#toggle-fail-process").checked); });
    $("#btn-retry-process").addEventListener("click", function () {
      invalidPendingGuide();
      $("#toggle-fail-process").checked = false;
      resetProcessUI();
      state.processStatus = "idle";
      addLog("用户修正数据（合成：补齐 member_tier 字段）后重试本地处理。");
      runProcess(false);
    });
    $("#btn-approve-gate").addEventListener("click", function () { invalidPendingGuide(); approveGate(); });

    // 循证分析（运行/取消 subagent 与 fork 同为直接状态操作）
    $("#btn-run-subagent").addEventListener("click", function () { invalidPendingGuide(); runSubagent($("#toggle-fail-subagent").checked); });
    $("#btn-cancel-subagent").addEventListener("click", function () { invalidPendingGuide(); cancelSubagent(); });
    $("#btn-fork").addEventListener("click", function () { invalidPendingGuide(); forkSession(); });
    $("#btn-back-main").addEventListener("click", function () {
      $("#fork-banner").hidden = true;
      toast("已返回主线 Session；分叉分支保留在左侧边栏。");
    });
    $("#btn-try-conclude").addEventListener("click", function () {
      invalidPendingGuide();
      $("#conclude-block").hidden = false;
      toast("失败路径 2：已阻止把证据不足 / 已证伪内容写成确定结论。");
    });
    $("#btn-to-report").addEventListener("click", function () { goto("report"); });
    $("#btn-send").addEventListener("click", function () {
      toast("UI Contract · 模拟执行：输入未发送给任何模型。");
      $("#composer-input").value = "";
    });
    $("#btn-prompt-switch").addEventListener("click", function () {
      toast("UI Contract · 模拟执行：prompt 版本切换未真实生效；正式产品的版本 / 发布 / 回滚机制待 JuanerAI 决策。");
    });

    // 报告
    $("#btn-export-pdf").addEventListener("click", function () { toast("UI Contract · 模拟执行：PDF 导出入口仅为交互演示，未真实导出。"); });
    $("#btn-export-md").addEventListener("click", function () { toast("UI Contract · 模拟执行：Markdown 导出入口仅为交互演示，未真实导出。"); });
    $("#btn-print").addEventListener("click", function () { window.print(); });

    // 证据回链
    $$(".evi-link[data-evi]").forEach(function (b) {
      b.addEventListener("click", function () { showEvidence(b.getAttribute("data-evi")); });
    });

    // Inspector 页签（点击 + 方向键，自动激活）
    $$(".insp-tab").forEach(function (t) {
      t.addEventListener("click", function () { openInspectorTab(t.getAttribute("data-insp")); });
      t.addEventListener("keydown", inspTabKey);
    });
    $$("[data-inspector]").forEach(function (b) {
      b.addEventListener("click", function () { openInspectorTab(b.getAttribute("data-inspector")); });
    });

    // 弹层焦点陷阱
    $("#palette-veil").addEventListener("keydown", function (e) { trapFocus(this, ".palette", e); });
    $("#guide-veil").addEventListener("keydown", function (e) { trapFocus(this, ".guide", e); });

    // 命令面板键盘
    $("#palette-input").addEventListener("input", function () { paletteSel = 0; renderPalette(); });
    $("#palette-input").addEventListener("keydown", function (e) {
      var items = paletteItems();
      if (e.key === "ArrowDown") { e.preventDefault(); paletteSel = Math.min(paletteSel + 1, items.length - 1); renderPalette(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); paletteSel = Math.max(paletteSel - 1, 0); renderPalette(); }
      else if (e.key === "Enter") { e.preventDefault(); if (items[paletteSel]) execCommand(items[paletteSel]); }
    });

    // 全局快捷键
    document.addEventListener("keydown", function (e) {
      var mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); $("#palette-veil").hidden ? openPalette() : closePalette(); }
      else if (mod && e.key.toLowerCase() === "b") { e.preventDefault(); toggleSidebar(); }
      else if (mod && e.key.toLowerCase() === "i") { e.preventDefault(); toggleInspector(); }
      else if (e.key === "Escape") { closePalette(); closeGuide(); }
    });
  }

  bind();
  openInspectorTab("context");
  render();
})();
