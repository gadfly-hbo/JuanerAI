// Exact, reproducible compatibility edits to the independently versioned supplier.
// Never installs, builds, starts Studio, or reads credentials.
import {createHash} from 'node:crypto';
import {lstat, readFile, writeFile, mkdir} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const edits = {
  "src/agent/materials.ts": {
  "sha256": "6318c5594eba9e84b97c2762ed148b1b81b4cca9ab69448f69d0b3d4f1070fb7",
  "replacements": [
    {
      "before": "status: 'ready' | 'failed';",
      "after": "status: 'ready' | 'failed' | 'pending';"
    },
    {
      "before": "  vision?: { transport: ModelTransport; model: ModelConfig };",
      "after": "  vision?: { transport: ModelTransport; model: ModelConfig };\n  /** Only the fixed built-in metered adapter supplies this; never an HTTP upload field. */\n  imageDescription?:string;"
    },
    {
      "before": "  const reply = await transport({",
      "after": "  if(process.env['REPORT_STUDIO_BUILTIN']==='1')throw Error('RS_IMAGE_METERED_PATH_REQUIRED');\n  const reply = await transport({"
    },
    {
      "before": "    if (asset.kind === 'image') {\n      if (!input.vision)",
      "after": "    if (asset.kind === 'image') {\n      if(process.env['REPORT_STUDIO_BUILTIN']==='1'&&input.imageDescription===undefined){base.status='pending';base.error='图片已在本地保存；请先核对外发范围，再明确理解图片。';await upsertManifest(projectRoot,base);return base;}\n      if (process.env['REPORT_STUDIO_BUILTIN']!=='1'&&!input.vision)"
    },
    {
      "before": "const description = await describeImage(input.vision.transport, input.vision.model, { data: content, mimeType: mime });",
      "after": "const description = process.env['REPORT_STUDIO_BUILTIN']==='1'?input.imageDescription!:await describeImage(input.vision!.transport, input.vision!.model, { data: content, mimeType: mime });\n      if(!description.trim())throw Error('RS_IMAGE_UNDERSTANDING_UNCONFIRMED');"
    }
  ]
},
  "src/agent/budget-store.ts": {
  "sha256": "3536931a384f53b191c261d09ac6f9f1700b0ede19082ffb614367a0f6d6128d",
  "replacements": [
    {
      "before": "import { appendFileSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';",
      "after": "import { appendFileSync, lstatSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';"
    },
    {
      "before": "  private load(): void {\n    let raw: string;",
      "after": "  private load(): void {\n    if(process.env['REPORT_STUDIO_BUILTIN']==='1'){\n      try{const stat=lstatSync(this.filePath);if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1||stat.size>16*1024*1024)throw new RuntimeFault('STATE_FAILED');}\n      catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw new RuntimeFault('STATE_FAILED');}\n    }\n    let raw: string;"
    },
    {
      "before": "    } catch {\n      return; // 首次使用：空账本\n    }",
      "after": "    } catch(error) {\n      if(process.env['REPORT_STUDIO_BUILTIN']==='1'&&(error as NodeJS.ErrnoException).code!=='ENOENT')throw new RuntimeFault('STATE_FAILED');\n      return; // 首次使用：空账本\n    }"
    },
    {
      "before": "  /** 任务用量快照（UI 运行详情；不存在返回 null）。 */",
      "after": "  stateOf(taskId:string):{runId:string;active:boolean}|null {\n    const ledger=this.tasks.get(taskId);if(!ledger)return null;\n    if(typeof ledger.runId!=='string'||!ledger.runId||typeof ledger.active!=='boolean')throw new RuntimeFault('STATE_FAILED');\n    return {runId:ledger.runId,active:ledger.active};\n  }\n\n  validatedUsageOf(taskId:string):UncappedUsage|null {\n    const usage=this.usageOf(taskId);if(!usage)return null;\n    for(const key of ['modelCalls','toolCalls','outputTokens','resourceUnits','activeMs','inputTokens','reservedOutputTokens'] as const){\n      const value=usage[key];if(typeof value!=='number'||!Number.isSafeInteger(value)||value<0)throw new RuntimeFault('STATE_FAILED');\n    }\n    if(usage.reservedOutputTokens!>usage.outputTokens)throw new RuntimeFault('STATE_FAILED');\n    return usage as UncappedUsage;\n  }\n\n  /** Only an owned, physically idle host may adopt this durable snapshot after explicit reconciliation. */\n  reloadAfterSettlement():void {\n    const fresh=new FileBudgetStore(this.filePath);\n    for(const taskId of this.tasks.keys())if(!fresh.tasks.has(taskId))throw new RuntimeFault('STATE_FAILED');\n    for(const taskId of fresh.tasks.keys())fresh.validatedUsageOf(taskId);\n    this.tasks.clear();for(const [taskId,value]of fresh.tasks)this.tasks.set(taskId,value);\n  }\n\n  /** 任务用量快照（UI 运行详情；不存在返回 null）。 */"
    }
  ]
},
  "src/agent/export-deck.ts": {
  "sha256": "05e55f4a8de4ec462ae7df4e11617ed47ee3064aba18b9fcd7390498743ef110",
  "replacements": [
    {
      before: `function pageSection(bodyHtml: string): string {
  return \`<section style="width:1280px;height:720px;overflow:hidden;position:relative;box-sizing:border-box">\${bodyHtml}</section>\`;
}

function extractBody(html: string): string {
  const m = /<body[^>]*>([\\s\\S]*?)<\\/body>/i.exec(html);
  return m ? m[1]! : html;
}`,
      after: `// Keep full page documents: merging CSS would let one page restyle another.
function pageSection(html: string, name: string): string {
  const attribute = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return \`<section style="width:1280px;height:720px;overflow:hidden;position:relative;box-sizing:border-box"><iframe title="\${attribute(name)}" srcdoc="\${attribute(html)}" style="display:block;width:100%;height:100%;border:0"></iframe></section>\`;
}`,
    },
    {
      before: "pages.map((p) => pageSection(extractBody(p.html)))",
      after: "pages.map((p) => pageSection(p.html, p.name))",
    },
    {
      "before": "import { existsSync } from 'node:fs';",
      "after": "import { existsSync } from 'node:fs';\nimport {repairChartTableRanges} from '../juanerai/pptx-compat.js';"
    },
    {
      "before": "out.push({ format: 'pptx', artifact: await readFile(pptxPath) });",
      "after": "const original = await readFile(pptxPath);\n      out.push({ format: 'pptx', artifact: process.env['REPORT_STUDIO_BUILTIN'] === '1' ? await repairChartTableRanges(original) : original });"
    },
    {
      "before": "import { chromium } from 'playwright';",
      "after": "import {launchReportBrowser,createReportPage} from '../juanerai/browser.js';"
    },
    {
      "before": "export async function buildDeckPdf(projectRoot: string): Promise<Buffer> {\n  const html = await buildDeckHtml(projectRoot);\n  const browser = await chromium.launch();\n  try {\n    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });\n",
      "after": "export async function buildDeckPdf(projectRoot: string): Promise<Buffer> {\n  const html = await buildDeckHtml(projectRoot);\n  const browser = await launchReportBrowser();\n  try {\n    const page = await createReportPage(browser);\n"
    }
  ]
},
  "src/agent/deck-preview.ts": {
  "sha256": "55090f8b94b70c1fea9f7e8929bb4fd828137487fcc923ecd7855f9e3bda35bb",
  "replacements": [
    {
      "before": "import { chromium } from 'playwright';",
      "after": "import {launchReportBrowser,createReportPage} from '../juanerai/browser.js';"
    },
    {
      "before": "export async function shootHtmlJpeg(html: string): Promise<Buffer> {\n  const browser = await chromium.launch();\n  try {\n    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });\n",
      "after": "export async function shootHtmlJpeg(html: string): Promise<Buffer> {\n  const browser = await launchReportBrowser();\n  try {\n    const page = await createReportPage(browser);\n"
    },
    {
      "before": "export async function shootHtml(html: string): Promise<Buffer> {\n  const browser = await chromium.launch();\n  try {\n    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });\n",
      "after": "export async function shootHtml(html: string): Promise<Buffer> {\n  const browser = await launchReportBrowser();\n  try {\n    const page = await createReportPage(browser);\n"
    }
  ]
},
  'src/agent/session-host.ts': {
  "sha256": "b0cd4d803d31b0ff5924c7e61fda86ab2fb18166d27a32a1cceee23e77c5617e",
  "replacements": [
    {
      "before": "import type { OutlinePage } from './outline.js';",
      "after": "import type { OutlinePage } from './outline.js';\nimport {createBuiltinImagePurpose} from './builtin-image-purpose.js';\nimport type {InputImage,PurposeConfig} from 'pi-agent-runtime';\nimport {reportStudioConsumptionStatus} from '../juanerai/policy.js';\nimport {readBuiltinOperationBindings,writeBuiltinOperationBindings} from './builtin-operation-bindings.js';\nimport {waitForBuiltinExecutions} from './builtin-owned-exec.js';\nimport {withBuiltinSkillRead} from './builtin-skill-environment.js';"
    },
    {
      before: "    const nativeTools = createExecutionTools(env, ['read', 'write', 'edit', 'bash']);",
      after: "    const nativeTools = createExecutionTools(builtin ? withBuiltinSkillRead(env, opts.skillsDir) : env, ['read', 'write', 'edit', 'bash']);",
    },
    {
      "before": "  budgetFile?: string;\n}",
      "after": "  budgetFile?: string;\n  /** Built-in admission is explicit and re-evaluated by the SDK before each effect. */\n  builtin?: {\n    authorize(effect: 'model'|'local'|'code_network'|'screenshot'|'abort', signal: AbortSignal): Promise<boolean>;\n    image?: {model: ModelConfig; transport: ModelTransport};\n    imageFallback?: {model: ModelConfig; transport: ModelTransport};\n    beforeRun?(kind:'main'|'image',signal:AbortSignal):Promise<string>;\n    afterRun?(operationId:string,receipt:{outcome:'succeeded'|'failed'|'cancelled';physical_settled:boolean;sdk_run_id:string|null;operation_usage_known:boolean;cumulative_usage_known:boolean;reserved_output_tokens:number|null}):Promise<void>;\n    chain?: {primary:{model:ModelConfig;transport:ModelTransport};fallback:{model:ModelConfig;transport:ModelTransport};selection:'full'|'primary'|'fallback'};\n  };\n}"
    },
    {
      "before": "  private closed = false;",
      "after": "  private closed = false;\n  private builtin = false;\n  private mainPurpose = PURPOSE;\n  private fixedChain=false;\n  private preparing=false;\n  private builtinLogicalDone=false;\n  private businessOperation:string|null=null;\n  private approvedNativeAbort:string|null=null;\n  private approvedBusinessOperation:string|null=null;\n  private nativeReconciliationObserved:'none'|'matched'|null=null;\n  private nativeReconciliationCheckOnly=false;\n  private currentAbort:AbortController|null=null;\n  private builtinOptions:SessionHostOptions['builtin'];\n  private budgetSnapshot:(()=>{reservedOutputTokens?:number}|null)|null=null;\n  private budgetReconcile:((expectedRunId:string|null)=>Promise<void>)|null=null;\n  private imagePurpose: ReturnType<typeof createBuiltinImagePurpose> | null = null;\n  private imageFallback: ReturnType<typeof createBuiltinImagePurpose> | null = null;\n  private imageSelection: 'primary'|'fallback' = 'primary';\n  private imageRun: Promise<unknown> | null = null;"
    },
    {
      "before": "    const sessionRoot = join(opts.projectRoot, 'session');",
      "after": "    const builtin = process.env['REPORT_STUDIO_BUILTIN'] === '1';\n    if (builtin && !opts.builtin) throw Error('RS_BUILTIN_ADMISSION_REQUIRED');\n    if (!builtin && opts.builtin) throw Error('RS_BUILTIN_MODE_REQUIRED');\n    const sessionRoot = join(opts.projectRoot, 'session');"
    },
    {
      "before": "    const auditFile = opts.auditFile ?? join(opts.projectRoot, '..', 'agent-audit.jsonl');\n    const budgetFile = opts.budgetFile ?? join(opts.projectRoot, '..', 'agent-budget.json');",
      "after": "    const auditFile = opts.auditFile ?? join(opts.projectRoot, ...(builtin ? [] : ['..']), 'agent-audit.jsonl');\n    const budgetFile = opts.budgetFile ?? join(opts.projectRoot, ...(builtin ? [] : ['..']), 'agent-budget.json');"
    },
    {
      "before": "    const authorize = localAuthorize();",
      "after": "    const standaloneAuthorize = localAuthorize();\n    const authorize: SessionRuntimeOptions['authorize'] = builtin ? async (action, signal) => {\n      const gate = opts.builtin!.authorize;\n      if (action.kind === 'control' && action.command.kind === 'abort') return gate('abort', signal);\n      if (action.kind === 'control' && action.command.kind === 'snapshot') return gate('local', signal);\n      if (signal.aborted || !await gate('model', signal)) return false;\n      if (action.kind === 'tool') {\n        if (action.name === 'bash' || action.name === 'render_deck') return gate('code_network', signal);\n        if (action.name === 'look_page') return gate('screenshot', signal);\n      }\n      return standaloneAuthorize(action, signal);\n    } : standaloneAuthorize;\n    const tools = [outlineTool, renderDeck, qaTool, exportTool, lookPage, ...nativeTools].map(soft);\n    const imagePurpose = builtin && opts.builtin?.image ? createBuiltinImagePurpose({\n      ...opts.builtin.image,\n      authorizeRead: () => opts.builtin!.authorize('model', new AbortController().signal),\n    }) : null;\n    const imageFallback = builtin && opts.builtin?.imageFallback ? createBuiltinImagePurpose({\n      ...opts.builtin.imageFallback, id:'image-understand-mimo',\n      authorizeRead: () => opts.builtin!.authorize('model', new AbortController().signal),\n    }) : null;\n    const chain = builtin ? opts.builtin?.chain : undefined;\n    if (chain && !['full','primary','fallback'].includes(chain.selection)) throw Error('RS_CONFIGURATION_INVALID');\n    const mainPurposes:PurposeConfig[] = chain ? [\n      {id:PURPOSE,mode:'agent',...chain.primary,fallbacks:[chain.fallback],tools,thinkingLevel:'medium'},\n      {id:'ppt-build-primary',mode:'agent',...chain.primary,tools,thinkingLevel:'medium'},\n      {id:'ppt-build-text',mode:'agent',...chain.fallback,tools,thinkingLevel:'medium'},\n    ] : [{id:PURPOSE,mode:'agent',model:opts.model,transport:opts.transport,fallbacks:opts.fallbacks,tools,thinkingLevel:'medium'}];\n    const purposes=[...mainPurposes,...(imagePurpose?[imagePurpose.purpose]:[]),...(imageFallback?[imageFallback.purpose]:[])];"
    },
    {
      "before": "      const bindings = await readBindings(operationsFile);\n      for (const op of input.open) {",
      "after": "      const bindings = await readBindings(operationsFile);\n      if(builtin&&hostRef?.approvedNativeAbort&&input.open.length===0)hostRef.nativeReconciliationObserved='none';\n      if(builtin&&input.open.length){\n        const only=input.open[0],binding=bindings.operations[only.operationId];\n        if(hostRef?.nativeReconciliationCheckOnly||input.open.length!==1||only.kind!=='run'||only.branch!=='main'||input.taskId!==taskId||input.sessionId!==hostRef?.sessionId||only.operationId!==hostRef?.approvedNativeAbort||!binding||binding.taskId!==taskId||binding.business_operation_id!==hostRef?.approvedBusinessOperation)return 'unknown';\n        hostRef!.nativeReconciliationObserved='matched';\n      }\n      for (const op of input.open) {"
    },
    {
      "before": "      fallbacks: opts.fallbacks,\n      authorize,",
      "after": "      fallbacks: opts.fallbacks,\n      ...(builtin ? {purposes} : {}),\n      authorize,"
    },
    {
      "before": "    const host = new SessionHost(runtime, taskId, opts.projectRoot, [outlineTool, renderDeck, qaTool, exportTool, lookPage, ...nativeTools].map(soft));",
      "after": "    const host = new SessionHost(runtime, taskId, opts.projectRoot, tools);\n    host.builtin = builtin;\n    host.fixedChain = !!chain;\n    host.builtinOptions = opts.builtin;\n    host.budgetSnapshot = () => new FileBudgetStore(budgetFile).validatedUsageOf(taskId);\n    host.budgetReconcile = async expectedRunId => {\n      const fresh=new FileBudgetStore(budgetFile),state=fresh.stateOf(taskId),usage=fresh.validatedUsageOf(taskId);\n      if(state?.active){\n        if(!expectedRunId||state.runId!==expectedRunId)throw Error('RS_RECONCILIATION_REQUIRED');\n        await fresh.releaseActive(taskId,'report-studio-explicit-physical-reconciliation');\n        const readback=new FileBudgetStore(budgetFile);\n        if(readback.stateOf(taskId)?.active||JSON.stringify(readback.validatedUsageOf(taskId))!==JSON.stringify(usage))throw Error('RS_RECONCILIATION_REQUIRED');\n      }\n      budgets.reloadAfterSettlement();\n    };\n    host.mainPurpose = chain?.selection === 'primary' ? 'ppt-build-primary' : chain?.selection === 'fallback' ? 'ppt-build-text' : PURPOSE;\n    host.imagePurpose = imagePurpose;\n    host.imageFallback = imageFallback;"
    },
    {
      "before": "    return this.activeRun !== null;",
      "after": "    return this.activeRun !== null || this.imageRun !== null || this.preparing;"
    },
    {
      "before": "  async close(): Promise<void> {\n    this.closed = true;",
      "after": "  /** SDK physical settlement is separate from its logical run result. */\n  async waitForIdle(): Promise<void> {\n    await this.runtime.waitForIdle(this.taskId);\n          if(this.builtin)await waitForBuiltinExecutions(this.projectRootDir);\n  }\n\n  async describeImage(image: InputImage, signal: AbortSignal) {\n    if (this.closed) throw Error('RS_HOST_CLOSED');\n    if (!this.builtin || !this.imagePurpose) throw Error('RS_IMAGE_NOT_CONFIGURED');\n    if (this.isBusy()) throw Error('RS_PROJECT_PENDING');\n    if (signal.aborted) throw Error('RS_IMAGE_CANCELLED');\n    const controller=new AbortController(),combined=AbortSignal.any([signal,controller.signal]);\n    this.currentAbort=controller;this.preparing=true;\n    let operationId:string|null=null,baseline:number|null=null,reported=false,entered=false;\n    try {\n      operationId=await this.builtinOptions?.beforeRun?.('image',combined)??null;this.businessOperation=operationId;\n      const initial=this.budgetSnapshot?.();baseline=initial?.reservedOutputTokens??(initial?null:0);\n      if(combined.aborted)throw Error('RS_IMAGE_CANCELLED');\n      entered=true;\n      const stage=this.imageSelection==='fallback'?this.imageFallback:this.imagePurpose;\n      if(!stage)throw Error('RS_IMAGE_NOT_CONFIGURED');\n      const run=stage.run(this.runtime,this.taskId,image,UNLIMITED_LIMITS,combined);\n      this.imageRun=run;\n      const value=await run;\n      await this.runtime.waitForIdle(this.taskId);\n          if(this.builtin)await waitForBuiltinExecutions(this.projectRootDir);\n      if(operationId){reported=true;await this.builtinOptions?.afterRun?.(operationId,{\n        outcome:value.result.status==='cancelled'?'cancelled':value.result.status==='succeeded'?'succeeded':'failed',\n        physical_settled:true,sdk_run_id:value.result.runId,\n        ...reportStudioConsumptionStatus(baseline,this.safeBudgetSnapshot(),value.result.usageKnown),\n      });}\n      return value;\n    } catch(error) {\n      await this.runtime.waitForIdle(this.taskId);\n          if(this.builtin)await waitForBuiltinExecutions(this.projectRootDir);\n      const noModelEffect=!entered||error instanceof Error&&['RS_IMAGE_INVALID','RS_IMAGE_BUSY','RS_IMAGE_CANCELLED','RS_IMAGE_PERMISSION_REQUIRED'].includes(error.message);\n      if(operationId&&!reported)await this.builtinOptions?.afterRun?.(operationId,{\n        outcome:combined.aborted?'cancelled':'failed',physical_settled:true,sdk_run_id:null,\n        ...reportStudioConsumptionStatus(baseline,this.safeBudgetSnapshot(),noModelEffect),\n      });\n      throw error;\n    } finally {this.imageRun=null;this.currentAbort=null;this.businessOperation=null;this.preparing=false;}\n  }\n\n  async close(): Promise<void> {\n    if (this.builtin && this.isBusy()) throw Error('RS_PROJECT_PENDING');\n    this.closed = true;"
    },
    {
      "before": "  async send(text: string, opts: { system?: string } = {}): Promise<{ mode: 'steer' | 'run' }> {\n    // 场景家族（flow-7）+ 企业 VI（flow-9）：并入 system（每 run 注入；降级不阻断）\n    const family = opts.system ? '' : await this.projectFamily();\n    const brand = opts.system ? '' : await this.projectBrand();\n    const locked = opts.system ? '' : await this.projectLocked();\n    const drift = opts.system ? '' : await this.projectDrift();\n    const outlineDrift = opts.system ? '' : await this.projectOutlineDrift();\n    const system = [opts.system ?? BUILD_SYSTEM, family.trim(), brand.trim(), locked.trim(), drift.trim(), outlineDrift.trim()].filter(Boolean).join('\\n\\n');\n    if (this.closed) throw new Error('宿主已关闭');\n    if (this.activeRun) {\n      await this.control({ kind: 'steer', text });\n      return { mode: 'steer' };\n    }\n    const session = this.session ?? (this.session = await this.findOrCreateSession());\n    this.recordEvent({ at: new Date().toISOString(), kind: 'chat:user_send' });\n    const run = this.runtime.run({\n      sessionId: session.id,\n      taskId: this.taskId,\n      prompt: text,\n      system,\n      tools: this.tools,\n      limits: UNLIMITED_LIMITS,\n      thinkingLevel: 'medium', // flow-2 U2：对齐 pi-coding-agent 运行条件（U0 双链 probe 实证）\n      modelRecovery: { extraAttempts: 1 },\n    });\n    this.activeRun = run;\n    void run.then(\n      (r) => { this.lastOutcome = r; },\n      (e) => {\n        // SDK 面上 run 不应 reject；防御性兜底为 failed 结果（R1-2：停止/失败后前端必须能退出 busy）\n        this.lastOutcome = { taskId: this.taskId, runId: 'unknown', status: 'failed', reason: 'MODEL_FAILED', usage: { modelCalls: 0, toolCalls: 0, outputTokens: 0, resourceUnits: 0, activeMs: 0 }, usageKnown: false };\n        void e;\n      },\n    );\n    void run.finally(() => {\n      this.activeRun = null;\n    }).catch(() => { /* finally 上的 catch 防御未处理拒绝 */ });\n    return { mode: 'run' };\n  }\n",
      "after": "  async send(text: string, opts: { system?: string } = {}): Promise<{ mode: 'steer' | 'run' }> {\n    if (this.imageRun || this.builtin && (this.preparing || this.currentAbort?.signal.aborted || this.activeRun && this.builtinLogicalDone)) throw Error('RS_PROJECT_PENDING');\n    // 场景家族（flow-7）+ 企业 VI（flow-9）：并入 system（每 run 注入；降级不阻断）\n    const family = opts.system ? '' : await this.projectFamily();\n    const brand = opts.system ? '' : await this.projectBrand();\n    const locked = opts.system ? '' : await this.projectLocked();\n    const drift = opts.system ? '' : await this.projectDrift();\n    const outlineDrift = opts.system ? '' : await this.projectOutlineDrift();\n    const system = [opts.system ?? BUILD_SYSTEM, family.trim(), brand.trim(), locked.trim(), drift.trim(), outlineDrift.trim()].filter(Boolean).join('\\n\\n');\n    if (this.closed) throw new Error('宿主已关闭');\n    if (this.activeRun) {\n      await this.control({ kind: 'steer', text });\n      return { mode: 'steer' };\n    }\n    const controller = this.builtin ? new AbortController() : null;\n    if (this.builtin) {this.preparing=true;this.currentAbort=controller;this.builtinLogicalDone=false;}\n    let operationId:string|null=null,baseline:number|null=null;\n    try {\n    if (this.builtin) {\n      operationId=await this.builtinOptions?.beforeRun?.('main',controller!.signal)??null;this.businessOperation=operationId;\n      const initial=this.budgetSnapshot?.();baseline=initial?.reservedOutputTokens??(initial?null:0);\n      if(controller!.signal.aborted)throw Error('RS_OPERATION_STOPPED');\n    }\n    const session = this.session ?? (this.session = await this.findOrCreateSession());\n    this.recordEvent({ at: new Date().toISOString(), kind: 'chat:user_send' });\n    const run = this.runtime.run({\n      sessionId: session.id,\n      taskId: this.taskId,\n      ...(this.builtin ? {purpose: this.mainPurpose,signal:controller!.signal} : {}),\n      prompt: text,\n      system,\n      tools: this.tools,\n      limits: UNLIMITED_LIMITS,\n      thinkingLevel: 'medium', // flow-2 U2：对齐 pi-coding-agent 运行条件（U0 双链 probe 实证）\n      modelRecovery: { extraAttempts: 1 },\n    });\n    this.activeRun = run;\n    void run.then(\n      (r) => { this.lastOutcome = r; this.builtinLogicalDone=true; },\n      (e) => {\n        // SDK 面上 run 不应 reject；防御性兜底为 failed 结果（R1-2：停止/失败后前端必须能退出 busy）\n        this.lastOutcome = { taskId: this.taskId, runId: 'unknown', status: 'failed', reason: 'MODEL_FAILED', usage: { modelCalls: 0, toolCalls: 0, outputTokens: 0, resourceUnits: 0, activeMs: 0 }, usageKnown: false };\n        this.builtinLogicalDone=true;\n        void e;\n      },\n    );\n    void run.finally(async () => {\n      try {\n        if (this.builtin) {\n          await this.runtime.waitForIdle(this.taskId);\n          if(this.builtin)await waitForBuiltinExecutions(this.projectRootDir);\n          const result=await run;\n          if(operationId)await this.builtinOptions?.afterRun?.(operationId,{\n            outcome:result.status==='cancelled'?'cancelled':['succeeded','waiting','suspended'].includes(result.status)?'succeeded':'failed',\n            physical_settled:true,sdk_run_id:result.runId,\n            ...reportStudioConsumptionStatus(baseline,this.safeBudgetSnapshot(),result.usageKnown),\n          });\n        }\n      } finally {this.activeRun=null;this.currentAbort=null;this.businessOperation=null;}\n    }).catch(() => { /* finally 上的 catch 防御未处理拒绝 */ });\n    return { mode: 'run' };\n    } catch(error) {\n      if(operationId)await this.builtinOptions?.afterRun?.(operationId,{outcome:controller?.signal.aborted?'cancelled':'failed',physical_settled:true,sdk_run_id:null,...reportStudioConsumptionStatus(baseline,this.safeBudgetSnapshot(),true)});\n      this.currentAbort=null;this.businessOperation=null;\n      throw error;\n    } finally {this.preparing=false;}\n  }\n"
    },
    {
      "before": "    const budgets: BudgetStore = new FileBudgetStore(budgetFile);",
      "after": "    const budgets = new FileBudgetStore(budgetFile);"
    },
    {
      "before": "  async control(command: { kind: 'steer' | 'followUp' | 'nextRun' | 'abort'; text?: string }): Promise<void> {",
      "after": "  async control(command: { kind: 'steer' | 'followUp' | 'nextRun' | 'abort'; text?: string }): Promise<void> {\n    if (this.builtin && command.kind==='abort') {this.currentAbort?.abort();return;}"
    },
    {
      "before": "  defaultTools(): readonly Tool[] {",
      "after": "  private safeBudgetSnapshot(){try{return this.budgetSnapshot?.()??null;}catch{return null;}}\n\n  async reconcileBudgetLease(expectedRunId:string|null,businessOperationId:string,kind:'main'|'image'|'export'|'preview'):Promise<void> {\n    if(!this.builtin||this.isBusy())throw Error('RS_PROJECT_PENDING');\n    await this.runtime.waitForIdle(this.taskId);\n          if(this.builtin)await waitForBuiltinExecutions(this.projectRootDir);\n    if(this.isBusy()||!this.budgetReconcile)throw Error('RS_PROJECT_PENDING');\n    await this.budgetReconcile(expectedRunId);\n    if(kind!=='main'||!expectedRunId||!this.session)return;\n    const bindings=await readBindings(join(this.projectRootDir,'work','agent-operations.json'));\n    const matches=Object.entries(bindings.operations).filter(([,v])=>v.taskId===this.taskId&&v.business_operation_id===businessOperationId);\n    if(matches.length!==1||!matches[0][1].purpose)throw Error('RS_RECONCILIATION_REQUIRED');\n    const [nativeId,binding]=matches[0],purpose=binding.purpose!;\n    const before=this.budgetSnapshot?.();if(!before)throw Error('RS_RECONCILIATION_REQUIRED');\n    const counters=(value:object)=>['modelCalls','toolCalls','inputTokens','outputTokens','reservedOutputTokens','resourceUnits'].map(key=>Reflect.get(value,key));\n    this.approvedNativeAbort=nativeId;this.approvedBusinessOperation=businessOperationId;\n    const probe=async(checkOnly:boolean):Promise<'none'|'aborted'>=>{\n      this.nativeReconciliationObserved=null;this.nativeReconciliationCheckOnly=checkOnly;\n      const result=await this.runtime.run({sessionId:this.session!.id,taskId:this.taskId,purpose,operation:'abort',prompt:'',tools:this.tools,limits:UNLIMITED_LIMITS,thinkingLevel:'medium',modelRecovery:{extraAttempts:1}});\n      await this.runtime.waitForIdle(this.taskId);\n          if(this.builtin)await waitForBuiltinExecutions(this.projectRootDir);\n      const after=this.budgetSnapshot?.();\n      if(!after||JSON.stringify(counters(before))!==JSON.stringify(counters(after)))throw Error('RS_RECONCILIATION_REQUIRED');\n      if(this.nativeReconciliationObserved==='none'&&result.status==='failed'&&result.reason==='INVALID_REQUEST')return 'none';\n      if(!checkOnly&&this.nativeReconciliationObserved==='matched'&&result.status==='cancelled'&&result.reason==='CANCELLED')return 'aborted';\n      throw Error('RS_RECONCILIATION_REQUIRED');\n    };\n    try{if(await probe(false)==='aborted'&&await probe(true)!=='none')throw Error('RS_RECONCILIATION_REQUIRED');}\n    finally{this.approvedNativeAbort=null;this.approvedBusinessOperation=null;this.nativeReconciliationObserved=null;this.nativeReconciliationCheckOnly=false;}\n  }\n\n  selectBuiltinImage(selection:'primary'|'fallback'):void {\n    if(this.activeRun||this.imageRun)throw Error('RS_PROJECT_PENDING');\n    if(selection==='fallback'&&!this.imageFallback)throw Error('RS_IMAGE_PLAN_LEGACY');\n    this.imageSelection=selection;\n  }\n\n  selectBuiltinChain(selection:'full'|'primary'|'fallback'):void {\n    if(!this.fixedChain||this.activeRun||this.imageRun||!['full','primary','fallback'].includes(selection))throw Error('RS_PROJECT_PENDING');\n    this.mainPurpose=selection==='primary'?'ppt-build-primary':selection==='fallback'?'ppt-build-text':PURPOSE;\n  }\n\n  defaultTools(): readonly Tool[] {"
    },
    {
      "before": "  operations: Record<string, { taskId: string; purpose?: string }>;",
      "after": "  operations: Record<string, { taskId: string; purpose?: string; business_operation_id?:string }>;"
    },
    {
      "before": "      bindings.operations[input.operationId] = { taskId: input.taskId, purpose: input.purpose };",
      "after": "      if(builtin&&opts.builtin?.beforeRun&&!hostRef?.businessOperation)throw new RuntimeFault('AUTHORITY_REQUIRED');\n      bindings.operations[input.operationId] = { taskId: input.taskId, purpose: input.purpose,...(builtin&&hostRef?.businessOperation?{business_operation_id:hostRef.businessOperation}:{}) };"
    },
    {
      "before": "async function readBindings(file: string): Promise<OperationBindings> {",
      "after": "async function readBindings(file: string): Promise<OperationBindings> {\n  if(process.env['REPORT_STUDIO_BUILTIN']==='1')return readBuiltinOperationBindings(file);"
    },
    {
      "before": "async function writeBindings(file: string, bindings: OperationBindings): Promise<void> {",
      "after": "async function writeBindings(file: string, bindings: OperationBindings): Promise<void> {\n  if(process.env['REPORT_STUDIO_BUILTIN']==='1')return writeBuiltinOperationBindings(file,bindings);"
    },
    {
      "before": "  async waitForIdle(): Promise<void> {\n    await this.runtime.waitForIdle(this.taskId);",
      "after": "  async waitForIdle(): Promise<void> {\n    await this.runtime.waitForIdle(this.taskId);\n    if(this.builtin)await waitForBuiltinExecutions(this.projectRootDir);"
    },
{
    "before": "import {withBuiltinSkillRead} from './builtin-skill-environment.js';",
    "after": "import {withBuiltinSkillRead} from './builtin-skill-environment.js';\nimport {observeToolExecutions,type ToolExecutionObserver} from './builtin-tool-observer.js';"
},
{
    "before": "  builtin?: {\n",
    "after": "  builtin?: {\n    toolObserver?:ToolExecutionObserver;\n"
},
{
    "before": "    const tools = [outlineTool, renderDeck, qaTool, exportTool, lookPage, ...nativeTools].map(soft);",
    "after": "    const tools = observeToolExecutions([outlineTool, renderDeck, qaTool, exportTool, lookPage, ...nativeTools].map(soft),opts.builtin?.toolObserver,()=>{void hostRef?.control({kind:'abort'});});"
}
  ]
},

  'src/agent/tools/render-deck-tool.ts': {
  "sha256": "bbe5867e26ad1e3755db091c1ad7e930664ff9c3f40af97f1e9446ccc6ec468c",
  "replacements": [
    {
      "before": "          env: process.env,",
      "after": "          env: process.env['REPORT_STUDIO_BUILTIN'] === '1' ? Object.fromEntries(['PATH', 'HOME', 'TMPDIR', 'LANG', 'LC_ALL', 'PLAYWRIGHT_BROWSERS_PATH'].filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]!])) : process.env,"
    },
    {
      "before": "import { existsSync, realpathSync, symlinkSync } from 'node:fs';",
      "after": "import {executeBuiltinFile} from '../builtin-owned-exec.js';\nimport { existsSync, realpathSync, symlinkSync } from 'node:fs';"
    },
    {
      "before": "    execute: async (args): Promise<JsonValue> => {",
      "after": "    execute: async (args,signal): Promise<JsonValue> => {"
    },
    {
      "before": "const { stdout, stderr } = await execFileAsync('node', [deckFile], {",
      "after": "const { stdout, stderr } = await (process.env['REPORT_STUDIO_BUILTIN']==='1'?executeBuiltinFile(projectRoot,process.execPath,[deckFile],{signal,timeout:120_000,maxBuffer:2*1024*1024}):execFileAsync('node', [deckFile], {"
    },
    {
      "before": "        });\n        if (stdout.trim())",
      "after": "        }));\n        if (stdout.trim())"
    }
  ]
},

  'web/src/main.tsx': {
    sha256: 'a85c901d00b446ca1bea89b9c224a53d1075c52995933ede6d7ac1d9d2060891',
    before: "createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n);",
    after: "import {initializeBuiltinSession,showBuiltinSessionFailure} from './juanerai/browser-session';\n\nvoid initializeBuiltinSession().then(()=>{\ncreateRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n);\n}).catch(showBuiltinSessionFailure);",
  },
  'web/src/workbench/Workbench.tsx': {
  "sha256": "17b26a5791efcb9b7a4c87459adcf5c15285404501282e783342f81f4ba53fb3",
  "replacements": [
{
    "before": "    await refreshUsage(pid).catch(() => {});\n    setBusy(false);",
    "after": "    await refreshUsage(pid).catch(() => {});\n    if(import.meta.env.VITE_REPORT_STUDIO_BUILTIN!=='1'||activeProject.current===pid)setBusy(false);"
},
    {
      "before": "  const refreshProjects = useCallback(async () => {\n    const r = await api<{ projects: Project[] }>('/api/projects');\n    setProjects(r.projects);\n    setActiveId((cur) => cur ?? r.projects[0]?.project_id ?? null);\n  }, []);",
      "after": "  const initialRequestedProject=useRef(import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'?new URLSearchParams(location.search).get('project'):null);\n  const refreshProjects = useCallback(async () => {\n    const r = await api<{ projects: Project[] }>('/api/projects');\n    setProjects(r.projects);\n    const requested=initialRequestedProject.current;\n    if(requested){\n      if(r.projects.some(p=>p.project_id===requested)){initialRequestedProject.current=null;setActiveId(requested);}\n      else {setActiveId(null);setError('指定的报告项目不可用；不会打开其他项目。');}\n    }else setActiveId((cur) => cur ?? (import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'?null:r.projects[0]?.project_id??null));\n  }, []);"
    },
    {
      "before": "import { OutlineCard, type OutlineState } from './OutlineCard';",
      "after": "import { OutlineCard, type OutlineState } from './OutlineCard';\nimport {BuiltinControls} from '../juanerai/BuiltinControls';\nimport {BuiltinRunState,classifyBuiltinResult} from '../juanerai/BuiltinRunState';\nimport {BuiltinSource} from '../juanerai/BuiltinSource';"
    },
    {
      "before": "      <nav className=\"wb-topbar\">",
      "after": "      {import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'&&<BuiltinControls projectId={activeId} projectsOpen={builtinSidebarOpen} onToggleProjects={()=>setBuiltinSidebarOpen(value=>!value)}/>}\n      {import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'&&<BuiltinSource projectId={activeId} exports={exportList} exportsProjectId={deckLoadedFor}/>}\n      {import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'&&<BuiltinRunState projectId={activeId} onActivity={setBuiltinActivity}/>}\n      <nav className=\"wb-topbar\">"
    },
    {
      "before": "<button type=\"button\" className=\"btn btn-ghost btn-sm\" onClick={() => void openSettings()}>设置</button>",
      "after": "{import.meta.env.VITE_REPORT_STUDIO_BUILTIN!=='1'&&<button type=\"button\" className=\"btn btn-ghost btn-sm\" onClick={() => void openSettings()}>设置</button>}"
    },
    {
      "before": "  const [activeId, setActiveId] = useState<string | null>(null);",
      "after": "  const [activeId, setActiveId] = useState<string | null>(null);\n  const [builtinSidebarOpen,setBuiltinSidebarOpen]=useState(false);\n  useEffect(()=>{setBuiltinSidebarOpen(false);},[activeId]);"
    },
    {
      "before": "    <div className=\"wb\">",
      "after": "    <div className={import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'?`wb wb-builtin ${builtinSidebarOpen?'wb-builtin-projects-open':''}`:'wb'}>"
    },
    {
      "before": "  const [busy, setBusy] = useState(false);",
      "after": "  const [builtinActivity,setBuiltinActivity]=useState('idle');\n  const [localBusy, setBusy] = useState(false);\n  const busy=localBusy||builtinActivity==='running'||builtinActivity==='stopping';"
    },
    {
      "before": "function classifyResult(r: { status?: string; reason?: string }): { text: string; kind: 'ok' | 'neutral' | 'fail'; recover?: boolean } {",
      "after": "function classifyResult(r: { status?: string; reason?: string }): { text: string; kind: 'ok' | 'neutral' | 'fail'; recover?: boolean } {\n  if(import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1')return classifyBuiltinResult(r);"
    },
    {
      "before": "retry: c.kind === 'fail', recoverable: c.recover",
      "after": "retry: import.meta.env.VITE_REPORT_STUDIO_BUILTIN!=='1'&&c.kind === 'fail', recoverable: c.recover"
    },
    {
      "before": "    if (!activeId || !input.trim()) return;",
      "after": "    if (!activeId || !input.trim()) return;\n    if(import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'&&['unknown','unavailable','stopping'].includes(builtinActivity)){setError('请先核对制作运行状态；未发送新的制作请求。');return;}"
    },
    {
      "before": "interface Usage { modelCalls: number; toolCalls: number; inputTokens?: number; outputTokens: number; activeMs: number }",
      "after": "interface Usage { modelCalls: number; toolCalls: number; inputTokens?: number; outputTokens: number; reservedOutputTokens?:number; activeMs: number }"
    },
    {
      "before": "{usage && <span className=\"chip\">token 入{(usage.inputTokens ?? 0).toLocaleString()} / 出{usage.outputTokens.toLocaleString()}</span>}",
      "after": "{usage && <span className=\"chip\">{import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'?'已记录 token':'token'} 入{(usage.inputTokens ?? 0).toLocaleString()} / 出{(import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'?Math.max(0,usage.outputTokens-(usage.reservedOutputTokens??0)):usage.outputTokens).toLocaleString()}{import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'&&(usage.reservedOutputTokens??0)>0?` · 未结算预留 ${usage.reservedOutputTokens}，累计实际消费未知`:''}</span>}"
    },
    {
      "before": "status: 'ready' | 'failed'; chars:",
      "after": "status: 'ready' | 'failed' | 'pending'; chars:"
    },
    {
      "before": "  const removeMaterial = async (sid: string, name: string) => {",
      "after": "  const understandImage = async (sid:string) => {\n    if(!activeId||busy)return;const pid=activeId;setBusy(true);setError(null);\n    try{await post(`/api/builtin/browser/projects/${pid}/images/${sid}/understand`,{});}\n    catch(e){if(activeProject.current===pid)setError(`图片尚未完成理解：${errMsg(e).includes('RS_IMAGE_PLAN_LEGACY')?'旧项目保留原制作计划，请在新项目使用 MiMo 图片理解':errMsg(e)}。请核对外发范围和运行状态，不会自动重试。`);}\n    finally{if(activeProject.current===pid){await refreshMaterials(pid);await refreshUsage(pid);setBusy(false);}}\n  };\n  const removeMaterial = async (sid: string, name: string) => {"
    },
    {
      "before": "  const lastUserText = useRef('');",
      "after": "  const activeProject=useRef(activeId);activeProject.current=activeId;\n  useEffect(()=>{if(import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'){setBusy(false);setUploading(false);setDeck(null);setExportList([]);setDeckLoadedFor(null);setSelectedPage(null);setQa(null);setVersions([]);setLockedPages([]);setDrift(null);setOutlineDrift(null);}},[activeId]);\n  const lastUserText = useRef('');"
    },
    {
      "before": "m.status === 'failed' ? 'st-fail' : 'st-ok'",
      "after": "m.status === 'pending' ? 'st-pending' : m.status === 'failed' ? 'st-fail' : 'st-ok'"
    },
    {
      "before": "<span className=\"att-status\">{m.status === 'failed' ?",
      "after": "<span className=\"att-status\">{m.status === 'pending' ? '已本地保存，尚未理解' : m.status === 'failed' ?"
    },
    {
      "before": "                        <button type=\"button\" className=\"att-x\" aria-label={`移除 ${m.filename}`}",
      "after": "                        {import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'&&m.kind==='image'&&m.status!=='ready'&&<button type=\"button\" className=\"btn btn-sm\" disabled={busy||uploading||builtinActivity==='unknown'||builtinActivity==='unavailable'} onClick={()=>void understandImage(m.source_id)}>理解图片</button>}\n                        <button type=\"button\" className=\"att-x\" aria-label={`移除 ${m.filename}`}"
    },
    {
      "before": "\n                      <button className=\"btn btn-primary btn-sm\" type=\"submit\" disabled={!input.trim()} title=\"作为插话（steer）注入进行中的任务\">",
      "after": "\n                      <button className=\"btn btn-primary btn-sm\" type=\"submit\" disabled={!input.trim()||builtinActivity==='stopping'||builtinActivity==='unknown'||builtinActivity==='unavailable'} title=\"作为插话（steer）注入进行中的任务\">"
    },
    {
      "before": "<button className=\"btn btn-primary btn-sm\" type=\"submit\" disabled={!input.trim()}>发送</button>",
      "after": "<button className=\"btn btn-primary btn-sm\" type=\"submit\" disabled={!input.trim()||builtinActivity==='unknown'||builtinActivity==='unavailable'}>发送</button>"
    },
    {
      "before": "\n                        <button className=\"btn btn-primary btn-sm\" type=\"submit\" disabled={!input.trim()} title=\"作为插话（steer）注入进行中的任务\">",
      "after": "\n                        <button className=\"btn btn-primary btn-sm\" type=\"submit\" disabled={!input.trim()||builtinActivity==='stopping'||builtinActivity==='unknown'||builtinActivity==='unavailable'} title=\"作为插话（steer）注入进行中的任务\">"
    },
    {
      "before": "<button className=\"btn btn-primary btn-sm\" type=\"submit\" disabled={!input.trim()}>发送修改</button>",
      "after": "<button className=\"btn btn-primary btn-sm\" type=\"submit\" disabled={!input.trim()||builtinActivity==='unknown'||builtinActivity==='unavailable'}>发送修改</button>"
    },
    {
      "before": "  const [exportList, setExportList] = useState<ExportRec[]>([]);",
      "after": "  const [exportList, setExportList] = useState<ExportRec[]>([]);\n  const [deckLoadedFor,setDeckLoadedFor]=useState<string|null>(null);"
    },
    {
      "before": "  const refreshDeck = useCallback(async (id: string) => {",
      "after": "  const refreshDeck = useCallback(async (id: string) => {\n    if(import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'){\n      const [deck,exports,versions,locked,drift,outlineDrift]=await Promise.all([\n        api<DeckInfo>(`/api/projects/${id}/deck`).catch(()=>null),\n        api<{exports:ExportRec[]}>(`/api/projects/${id}/exports`).catch(()=>({exports:[]})),\n        api<{versions:DeckVersion[]}>(`/api/projects/${id}/deck/versions`).catch(()=>({versions:[]})),\n        api<{locked:string[]}>(`/api/projects/${id}/locked-pages`).catch(()=>({locked:[]})),\n        api<DriftInfo>(`/api/projects/${id}/data-drift`).catch(()=>null),\n        api<OutlineDriftInfo>(`/api/projects/${id}/outline-drift`).catch(()=>null),\n      ]);\n      if(activeProject.current!==id)return;\n      setDeck(deck);setExportList(exports.exports);setVersions(versions.versions);setVersionDiff(null);setDiffPair(null);setLockedPages(locked.locked);setDrift(drift);setOutlineDrift(outlineDrift);setDeckLoadedFor(id);return;\n    }"
    },
    {
      "before": "    setMaterials((await api<{ materials: MaterialEntry[] }>(`/api/projects/${id}/materials`).catch(() => ({ materials: [] }))).materials);",
      "after": "    const value=await api<{materials:MaterialEntry[]}>(`/api/projects/${id}/materials`).catch(()=>({materials:[]}));if(import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'&&activeProject.current!==id)return;setMaterials(value.materials);"
    },
    {
      "before": "    setOutline(await api<OutlineState>(`/api/projects/${id}/outline`));",
      "after": "    const value=await api<OutlineState>(`/api/projects/${id}/outline`);if(import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'&&activeProject.current!==id)return;setOutline(value);"
    },
    {
      "before": "    setUsage((await api<{ usage: Usage | null }>(`/api/projects/${id}/agent/usage`).catch(() => ({ usage: null }))).usage);",
      "after": "    const value=await api<{usage:Usage|null}>(`/api/projects/${id}/agent/usage`).catch(()=>({usage:null}));if(import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'&&activeProject.current!==id)return;setUsage(value.usage);"
    },
    {
      "before": "      .then((r) => {\n        const restored: ThreadMsg[] = [];",
      "after": "      .then((r) => {\n        if(import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'&&activeProject.current!==activeId)return;\n        const restored: ThreadMsg[] = [];"
    },
    {
      "before": "    es.onmessage = (e) => {\n      try {",
      "after": "    es.onmessage = (e) => {\n      if(import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'&&activeProject.current!==activeId)return;\n      try {"
    },
    {
      "before": "    for (;;) {\n      await new Promise((r) => setTimeout(r, 1200));",
      "after": "    let readFailures=0;\n    for (;;) {\n      if(import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'&&activeProject.current!==pid)return;\n      await new Promise((r) => setTimeout(r, 1200));"
    },
    {
      "before": "      } catch {\n        continue; // 瞬时网络抖动重试\n      }\n      if (!res.active)",
      "after": "      } catch {\n        if(import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'&&++readFailures>=3){if(activeProject.current===pid){setError('制作状态暂不可读，不能判断已停止；不会重发制作。');setBusy(false);}return;}\n        continue; // 瞬时网络抖动重试\n      }\n      if(import.meta.env.VITE_REPORT_STUDIO_BUILTIN==='1'&&activeProject.current!==pid)return;readFailures=0;\n      if (!res.active)"
    }
  ]
},

  'src/agent/model.ts': {
    sha256: 'c303f161865f5762f9204519c9f76222d09c7f19ea740ae4d1fe6463e1f6e601',
    before: 'export function loadKeysFromDisk(): void {\n',
    after: "export function loadKeysFromDisk(): void {\n  if (process.env['REPORT_STUDIO_BUILTIN'] === '1') return; // Explicit built-in mode never discovers another tool's credentials.\n",
  },
  'src/agent/exec-env.ts': {
    sha256: '0348c1108361dc30d05f5f97229566aa50b7eb9192727cbac65c99546c1712d9',
    replacements:[
      {before:'          cwd: root,\n',after:"          cwd: root,\n          ...(process.env['REPORT_STUDIO_BUILTIN'] === '1' ? { env: Object.fromEntries(['PATH', 'HOME', 'TMPDIR', 'LANG', 'LC_ALL', 'PLAYWRIGHT_BROWSERS_PATH'].filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]!])) } : {}),\n"},
      {before:"import { execFile } from 'node:child_process';",after:"import {executeBuiltinFile} from './builtin-owned-exec.js';\nimport { execFile } from 'node:child_process';"},
      {before:"const { stdout, stderr } = await execFileAsync('/bin/bash', ['-c', command], {",after:"const { stdout, stderr } = await (process.env['REPORT_STUDIO_BUILTIN']==='1'?executeBuiltinFile(root,'/bin/bash',['-c',command],{signal,timeout:execTimeoutMs,maxBuffer:maxOutputBytes}):execFileAsync('/bin/bash', ['-c', command], {"},
      {before:'        } as Parameters<typeof execFileAsync>[2]);',after:'        } as Parameters<typeof execFileAsync>[2]));'},
      {before:"        if (err.killed || /SIGKILL|timed out/i.test(err.message ?? '')) {",after:"        if(process.env['REPORT_STUDIO_BUILTIN']==='1'&&err.code===130){await logExecCommand(root,command,130).catch(()=>{});return {output:'执行已停止',exitCode:130};}\n        if (err.killed || /SIGKILL|timed out/i.test(err.message ?? '')) {"},
    ],
  },
  'src/server/app.ts': {
  "sha256": "1d17c6cf9b521004d04793f0fe3875d12832440b0aacb4ac35acf3292da64ebc",
  "replacements": [
    {
      "before": "export function buildServer(store: WorkspaceStore, webDist?: string): FastifyInstance {\n  const app = Fastify({ logger: false });",
      "after": "export function buildServer(store: WorkspaceStore, webDist?: string, configure?: (app: FastifyInstance) => void, builtin?: {hosts:Map<string,Promise<SessionHost>>;get(id:string):Promise<SessionHost>;operation(id:string):{state:string;usage_known:boolean|null;physical_settled:boolean;kind:string}|null;recover(id:string):Promise<{ok:boolean}>;remove(id:string):Promise<void>}): FastifyInstance {\n  const app = Fastify({ logger: false, ...(process.env['REPORT_STUDIO_BUILTIN']==='1'?{forceCloseConnections:true}:{}) });\n  configure?.(app);"
    },
    {
      "before": "  const agentHosts = new Map<string, Promise<SessionHost>>();",
      "after": "  const agentHosts = builtin?.hosts ?? new Map<string, Promise<SessionHost>>();"
    },
    {
      "before": "  const getAgentHost = (projectId: string): Promise<SessionHost> => {",
      "after": "  const getAgentHost = (projectId: string): Promise<SessionHost> => {\n    if(builtin)return builtin.get(projectId);"
    },
    {
      "before": "  app.get('/api/projects/:id/agent/result', async (req) => {\n    const { id } = req.params as { id: string };",
      "after": "  app.get('/api/projects/:id/agent/result', async (req) => {\n    const { id } = req.params as { id: string };\n    const operation=builtin?.operation(id);\n    if(operation?.state==='unknown')return {active:false,status:'unknown',reason:'RS_RECONCILIATION_REQUIRED',consumptionKnown:operation.usage_known,canReconcile:operation.physical_settled};\n    if(operation&&['running','stopping'].includes(operation.state))return {active:true,status:operation.state,operation_kind:operation.kind};\n    if(operation?.state==='stopped')return {active:false,status:'stopped',consumptionKnown:operation.usage_known};\n    if(operation&&(operation.kind==='export'||operation.kind==='preview'))return {active:false,status:operation.state,operation_kind:operation.kind,consumptionKnown:operation.usage_known};"
    },
    {
      "before": "  app.post('/api/projects/:id/agent/recover', async (req, reply) => {\n    const { id } = req.params as { id: string };\n    try {",
      "after": "  app.post('/api/projects/:id/agent/recover', async (req, reply) => {\n    const { id } = req.params as { id: string };\n    try {\n      if(builtin)return await builtin.recover(id);"
    },
    {
      "before": "  app.get('/api/projects/:id/agent/usage', async (req) => {\n    const { id } = req.params as { id: string };\n    try {\n      const budget = new FileBudgetStore(join(store.root, 'agent-budget.json'));",
      "after": "  app.get('/api/projects/:id/agent/usage', async (req) => {\n    const { id } = req.params as { id: string };\n    try {\n      const budget = new FileBudgetStore(join(store.root,...(builtin?[id]:[]),'agent-budget.json'));"
    },
    {
      "before": "return { usage: budget.usageOf(`task_${id}`) };",
      "after": "return { usage: builtin?budget.validatedUsageOf(`task_${id}`):budget.usageOf(`task_${id}`) };"
    },
    {
      "before": "    await store.deleteProject(id);\n    return { ok: true };",
      "after": "    if(builtin)await builtin.remove(id);else await store.deleteProject(id);\n    return { ok: true };"
    },
    {
      "before": "const chain = (() => { try { return candidateChain()",
      "after": "const chain = builtin?undefined:(() => { try { return candidateChain()"
    }
  ]
},

  'src/storage/workspace.ts': {
    sha256: 'fdf5145a9264f422012d7309c5ca86f28b64b885d9a5b9da48e175da74a64427',
    before: 'async createProject(input: { title: string; purpose?: string }): Promise<Project> {\n    const project = ProjectSchema.parse({\n      project_id: shortId(\'proj\'),',
    after: 'async createProject(input: { title: string; purpose?: string; project_id?: string }): Promise<Project> {\n    const project = ProjectSchema.parse({\n      project_id: input.project_id ?? shortId(\'proj\'),',
  },
};

export function patchedStudioSource(path, bytes) {
  const edit = edits[path];
  if (!edit || hash(bytes) !== edit.sha256) throw Error('STUDIO_SOURCE_IDENTITY_MISMATCH');
  let source = bytes.toString('utf8');
  for (const replacement of edit.replacements ?? [edit]) {
    if (source.split(replacement.before).length !== 2) throw Error('STUDIO_SOURCE_EDIT_MISMATCH');
    source = source.replace(replacement.before, replacement.after);
  }
  return Buffer.from(source);
}

export async function prepareStudioSource(root) {
  if (!await lstat(root).then(s => s.isDirectory() && !s.isSymbolicLink())) throw Error('STUDIO_SOURCE_ROOT_INVALID');
  // Read and validate every input before writing. Accept only original or known complete edits.
  const outputs = [];
  for (const path of Object.keys(edits)) {
    const parts = path.split('/');
    for (let i = 1; i <= parts.length; i++) {
      const prefix = parts.slice(0, i).join('/');
      const stat = await lstat(join(root, prefix));
      if (stat.isSymbolicLink() || !(prefix === path ? stat.isFile() : stat.isDirectory())) throw Error('STUDIO_SOURCE_PATH_INVALID');
    }
    const before = await readFile(join(root, path));
    let original=before;
    if(hash(before)!==edits[path].sha256) {
      let current=before.toString('utf8');const edit=edits[path];
      for (const replacement of [...(edit.replacements ?? [edit])].reverse()) {
        if(current.split(replacement.after).length!==2)throw Error('STUDIO_SOURCE_IDENTITY_MISMATCH');
        current=current.replace(replacement.after,replacement.before);
      }
      original=Buffer.from(current);
    }
    const after=patchedStudioSource(path,original);
    if(hash(before)!==edits[path].sha256&&!after.equals(before))throw Error('STUDIO_SOURCE_IDENTITY_MISMATCH');
    outputs.push({path, before: original, after});
  }
  const copies = [
    ['../../adapters/report-studio/local-access.ts','src/juanerai/local-access.ts'],
    ['../../packages/contracts/report-studio.ts','src/juanerai/contract.ts'],
    ['../../adapters/report-studio/supplier/server.ts','src/juanerai/server.ts'],
    ['../../adapters/report-studio/supplier/owner.ts','src/juanerai/owner.ts'],
    ['../../adapters/report-studio/supplier/version.ts','src/juanerai/version.ts'],
    ['../../adapters/report-studio/supplier/browser.ts','src/juanerai/browser.ts'],
    ['../../adapters/report-studio/supplier/pptx-compat.ts','src/juanerai/pptx-compat.ts'],
    ['../../adapters/report-studio/supplier/credentials.ts','src/juanerai/credentials.ts'],
    ['../../adapters/report-studio/supplier/configuration.ts','src/juanerai/configuration.ts'],
    ['../../adapters/report-studio/policy.ts','src/juanerai/policy.ts'],
    ['../../adapters/report-studio/supplier/agent-pi/image-purpose.ts','src/agent/builtin-image-purpose.ts'],
    ['../../adapters/report-studio/supplier/agent-pi/model-targets.ts','src/agent/builtin-model-targets.ts'],
    ['../../adapters/report-studio/supplier/agent-pi/builtin-hosts.ts','src/agent/builtin-hosts.ts'],
    ['../../adapters/report-studio/supplier/agent-pi/operation-bindings.ts','src/agent/builtin-operation-bindings.ts'],
    ['../../adapters/report-studio/supplier/agent-pi/owned-exec.ts','src/agent/builtin-owned-exec.ts'],
    ['../../adapters/report-studio/supplier/agent-pi/skill-environment.ts','src/agent/builtin-skill-environment.ts'],
    ['../../adapters/report-studio/supplier/agent-pi/tool-observer.ts','src/agent/builtin-tool-observer.ts'],
    ['../../adapters/report-studio/supplier/entry.ts','src/juanerai/entry.ts'],
    ['../../adapters/report-studio/supplier/browser-session.ts','web/src/juanerai/browser-session.ts'],
    ['../../adapters/report-studio/supplier/BuiltinControls.tsx','web/src/juanerai/BuiltinControls.tsx'],
    ['../../adapters/report-studio/supplier/BuiltinRunState.tsx','web/src/juanerai/BuiltinRunState.tsx'],
    ['../../adapters/report-studio/supplier/BuiltinSource.tsx','web/src/juanerai/BuiltinSource.tsx'],
    ['../../adapters/report-studio/supplier/builtin-controls.css','web/src/juanerai/builtin-controls.css'],
  ];
  const copied = await Promise.all(copies.map(async ([from,path])=>({path,after:await readFile(new URL(from,import.meta.url))})));
  const directories=[join(root,'src/juanerai'),join(root,'web/src/juanerai')];
  for(const directory of directories){
    try {const stat=await lstat(directory);if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('STUDIO_SOURCE_PATH_INVALID');}
    catch(error){if(error.code!=='ENOENT')throw error;}
  }
  for(const output of copied) {
    try {const stat=await lstat(join(root,output.path));if(!stat.isFile()||stat.isSymbolicLink())throw Error('STUDIO_SOURCE_PATH_INVALID');}
    catch(error){if(error.code!=='ENOENT')throw error;}
  }
  // Validate all generated destinations before changing any original input.
  for (const output of outputs) await writeFile(join(root, output.path), output.after);
  for(const directory of directories)await mkdir(directory,{recursive:true});
  for(const output of copied) await writeFile(join(root,output.path),output.after);
  return outputs.map(({path, before, after}) => ({path, original_sha256: hash(before), builtin_sha256: hash(after)}));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw Error('Expected one explicit isolated source directory');
    console.log(JSON.stringify(await prepareStudioSource(resolve(process.argv[2])), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
