// release：SAP 资产包版本发布（快照 + index 登记；PRD 决策 #1-#6 + GRILL G1/G3/G5/G10）
// 管线复用既有导出全链（loadInstance → 基模板 → materialize → 全量校验 → export gate → assembleSap →
// validateSapPackage），零第二套规则；发布动作 = 登记侧写盘（快照 + append-only index），SAP 包结构与契约冻结面零改动。
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { z } from "zod";
import { loadInstance, loadTemplatesFromDir, type LoadError } from "../engine/loader.js";
import { defaultMappingPath, loadMappingFile } from "../engine/io.js";
import { materialize, EMPTY_TEMPLATE } from "../engine/materialize.js";
import { validateDesign, designReview } from "../engine/blueprint.js";
import { loadMethodsFromDir, defaultMethodsDir } from "../engine/methods.js";
import type { Mapping } from "../schema/mapping.js";
import type { Template } from "../schema/template.js";
import { assertExportable } from "../export/gate.js";
import { buildGenerator, packageIdFromInstancePath } from "../export/sap.js";
import { assembleSap } from "./assemble.js";
import { validateSapPackage } from "./validate.js";
import { canonicalize, contentFingerprint } from "./canonical.js";

const SEMVER_RE = /^\d+\.\d+\.\d+$/;
export const RELEASE_INDEX_FILENAME = "index.yaml";

export const ReleaseIndexEntrySchema = z.object({
  package: z.string().min(1),
  version: z.string().regex(SEMVER_RE),
  content_fingerprint: z.string().regex(/^sha256:[0-9a-f]{64}$/),
  package_fingerprint: z.string().regex(/^sha256:[0-9a-f]{64}$/),
  created_at: z.string().min(1),
  released_by: z.string().min(1),
  note: z.string(),
  file: z.string().min(1)
});

export const ReleaseIndexSchema = z.object({
  releases: z.array(ReleaseIndexEntrySchema).default([])
});

export type ReleaseIndexEntry = z.infer<typeof ReleaseIndexEntrySchema>;
export type ReleaseIndex = z.infer<typeof ReleaseIndexSchema>;

// 结构化信息：UI 按 rule 分流渲染 R4–R7（内联错误需要 value/createdAt，错误卡需要 issues/detail 行）
export interface ReleaseErrorInfo {
  /** R4：格式化 "[rule] path: message" 行（实例/模板/SAP 校验失败） */
  issues?: string[];
  /** R5：用户提交的非法版本原文 */
  value?: string;
  /** R6：既有发布的 package@version 与 created_at */
  packageId?: string;
  publishedVersion?: string;
  createdAt?: string;
  /** R7：index 解析/形状错误细节 */
  detail?: string;
}

export class ReleaseError extends Error {
  constructor(
    public readonly rule: string,
    message: string,
    public readonly info: ReleaseErrorInfo = {}
  ) {
    super(message);
    this.name = "ReleaseError";
  }
}

export interface ReleaseResult {
  packageId: string;
  version: string;
  contentFingerprint: string;
  packageFingerprint: string;
  snapshotPath: string;
  indexPath: string;
  /** 追加后的 1 起算序号（R2 登记行「追加为第 N 条」） */
  indexEntryNumber: number;
}

export interface ReleaseOptions {
  instancePath: string;
  /** 包版本（semver；位置参数，G1） */
  version: string;
  templatesDir: string;
  /** releases 基目录（CLI 默认 ./releases；UI 为实例工作区根下 releases/） */
  releasesDir: string;
  releasedBy: string;
  note?: string;
  /** 显式映射文件路径；缺省自动发现 <实例名>.mapping.yaml（与 export 同语义） */
  mappingPath?: string;
  /** 方法模板目录（A1 D3；缺省 <templatesDir>/methods，目录不存在视为空方法库） */
  methodsDir?: string;
  /** ISO-8601；测试可冻结 */
  now: string;
  /** 覆盖 generator（测试可冻结；缺省 buildGenerator()） */
  generator?: string;
}

function formatLoadErrors(path: string, errors: LoadError[]): string {
  return errors.map((e) => `[schema] ${path} ${e.path}: ${e.message}`).join("\n");
}

// 模板目录装载走共享核（F6）：release 策略 = 首个坏文件即 template-invalid（行为与重构前一致）
async function findBaseTemplate(templatesDir: string, baseId: string): Promise<Template> {
  const result = await loadTemplatesFromDir(templatesDir);
  if (!result.ok) {
    if (result.kind === "read") {
      throw new ReleaseError("templates-dir", `无法读取模板目录 ${templatesDir}：${result.message}`);
    }
    if (result.kind === "load") {
      // 输出格式保持基线（f525be6）：首个坏文件的【全部】zod 错误，[schema] 前缀。
      // 装载策略较基线收紧（F6 整目录健康门）：基线在坏文件排序位于目标模板之后时会跳过坏文件继续，
      // 重构后统一为目录含任何坏文件即拒——收敛勘误见 .flow/prd.md GRILL F6。
      const first = result.errors[0]!;
      const firstFileErrors = result.errors.filter((e) => e.file === first.file);
      const detail = firstFileErrors.map((e) => `[schema] ${e.file} ${e.error.path}: ${e.error.message}`).join("\n");
      throw new ReleaseError("template-invalid", detail, {
        issues: firstFileErrors.map((e) => `[schema] ${e.file} ${e.error.path}: ${e.error.message}`)
      });
    }
    // empty：与基线一致——空目录走「找不到基模板」
  }
  const base = (result.ok ? result.templates : []).find((t) => t.template.id === baseId);
  if (!base) {
    throw new ReleaseError("base-template-missing", `找不到基模板 ${baseId}（目录：${templatesDir}）`);
  }
  return base;
}

// 映射装载走共享核（F6）：显式路径 = 必填（损坏即错）；自动发现 = 损坏静默视为无映射（与 export 同语义）
async function loadMappingForRelease(mappingPath: string, required: boolean): Promise<Mapping> {
  const result = await loadMappingFile(mappingPath);
  if (!result.ok) {
    if (required) {
      if (result.kind === "read") {
        throw new ReleaseError("mapping-invalid", `无法读取映射文件 ${mappingPath}：${result.message}`);
      }
      const detail = result.issues.map((i) => `${i.path}: ${i.message}`).join("; ");
      throw new ReleaseError("mapping-invalid", `映射文件不合法 ${mappingPath}：${detail}`);
    }
    return { base: "", mappings: [] };
  }
  return result.mapping;
}

function readReleaseIndex(indexPath: string): ReleaseIndex {
  if (!existsSync(indexPath)) return { releases: [] };
  let doc: unknown;
  try {
    doc = parseYaml(readFileSync(indexPath, "utf8"));
  } catch (e) {
    throw new ReleaseError(
      "index-corrupt",
      `发布登记损坏，拒绝发布（fail-closed，不静默重建）：${indexPath}\n${(e as Error).message}\n请用 git 恢复该文件后重试`,
      { detail: (e as Error).message }
    );
  }
  const parsed = ReleaseIndexSchema.safeParse(doc);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new ReleaseError(
      "index-corrupt",
      `发布登记形状非法，拒绝发布（fail-closed，不静默重建）：${indexPath}\n${detail}\n请用 git 恢复该文件后重试`,
      { detail }
    );
  }
  return parsed.data;
}

export async function releaseInstance(opts: ReleaseOptions): Promise<ReleaseResult> {
  // R3 路径安全：version 强制 semver（天然排除路径分隔符），写盘前拒绝
  if (!SEMVER_RE.test(opts.version)) {
    throw new ReleaseError(
      "invalid-version",
      `版本 "${opts.version}" 不是 semver（要求 ^\\d+\\.\\d+\\.\\d+$），拒绝发布`,
      { value: opts.version }
    );
  }

  const packageId = packageIdFromInstancePath(opts.instancePath);
  const indexPath = join(opts.releasesDir, RELEASE_INDEX_FILENAME);

  // G3：登记先读后写；损坏 → 拒绝，不静默重建
  const index = readReleaseIndex(indexPath);

  // 不可变：同 id@version 已存在 → 拒绝（内容相同也拒）
  const dup = index.releases.find((e) => e.package === packageId && e.version === opts.version);
  if (dup) {
    throw new ReleaseError(
      "duplicate-release",
      `${packageId}@${opts.version} 已发布于 ${dup.created_at}，请升级版本号（发布不可变：同 id@version 不可重复发布）`,
      { packageId, publishedVersion: dup.version, createdAt: dup.created_at }
    );
  }

  const loaded = await loadInstance(opts.instancePath);
  if (!loaded.ok) {
    throw new ReleaseError("instance-invalid", formatLoadErrors(opts.instancePath, loaded.errors), {
      issues: loaded.errors.map((e) => `[schema] ${opts.instancePath} ${e.path}: ${e.message}`)
    });
  }
  const instance = loaded.instance;

  // A1 D13：空白起点实例使用合成空基座（方法库照常装载）
  const base = instance.base ? await findBaseTemplate(opts.templatesDir, instance.base.split("@")[0]!) : EMPTY_TEMPLATE;
  const materialized = materialize(base, instance);

  const mappingPath = opts.mappingPath ?? defaultMappingPath(opts.instancePath);
  const mapping = await loadMappingForRelease(mappingPath, Boolean(opts.mappingPath));
  if (mapping.mappings.length > 0) {
    const names = new Set(materialized.metrics.map((m) => m.name));
    materialized.mapping = mapping.mappings.filter((m) => names.has(m.metric));
  }

  // A1：统一设计校验（指标/场景 + 蓝图规则 + 方法绑定）；方法库装载失败按错误透出（fail-closed）
  const methodsResult = await loadMethodsFromDir(opts.methodsDir ?? defaultMethodsDir(opts.templatesDir));
  if (!methodsResult.ok) {
    const detail =
      methodsResult.kind === "read"
        ? methodsResult.message
        : methodsResult.errors.map((e) => `[schema] ${e.file} ${e.error.path}: ${e.error.message}`).join("\n");
    throw new ReleaseError("methods-invalid", `方法模板库不可用，拒绝发布（fail-closed）：\n${detail}`);
  }
  const methods = methodsResult.methods;

  const issues = validateDesign(materialized, base, instance, methods);
  if (issues.length > 0) {
    const detail = issues.map((i) => `[${i.rule}] ${opts.instancePath} ${i.path}: ${i.message}`).join("\n");
    throw new ReleaseError("instance-validation", `实例校验未通过，拒绝发布（零写盘）：\n${detail}`, {
      issues: issues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`)
    });
  }

  // A1 D7：分析体系模式的发布门——设计缺口零 ∧ 业务复核有效（仅指标体系模式语义不变）
  if (materialized.blueprint) {
    const review = designReview(materialized, base, instance, methods);
    if (!review.ready) {
      const reasons: string[] = [];
      if (review.review.state === "unreviewed") reasons.push("业务复核未确认（请先在「检查与交付」完成复核）");
      if (review.review.state === "stale") reasons.push("业务复核已失效（设计在复核后被修改，需重新复核）");
      reasons.push(...review.designIssues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`));
      throw new ReleaseError("design-review", `分析体系设计未就绪，拒绝发布（零写盘）：\n${reasons.join("\n")}`, {
        issues: reasons
      });
    }
  }

  assertExportable(materialized.metrics);

  const pkg = assembleSap(materialized, base, {
    packageId,
    version: opts.version,
    createdAt: opts.now,
    generator: opts.generator ?? buildGenerator(),
    bindings: materialized.mapping ?? [],
    instanceConceptRefs: instance.concept_refs
  });

  const sapIssues = validateSapPackage(pkg);
  if (sapIssues.length > 0) {
    const detail = sapIssues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`).join("\n");
    throw new ReleaseError("sap-validation", `SAP 包校验未通过，拒绝发布（零写盘）：\n${detail}`, {
      issues: sapIssues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`)
    });
  }

  const cfp = contentFingerprint(pkg);
  const pfp = pkg.package.fingerprint;

  // A1 D11：内容指纹与任意既有条目相同 → 阻断（未修改不重复发版；升级版本号前请先修改设计内容）
  const same = index.releases.find((e) => e.content_fingerprint === cfp);
  if (same) {
    throw new ReleaseError(
      "same-content",
      `内容与 ${same.package}@${same.version} 完全一致（content_fingerprint 相同），未修改不重复发版；如需新版本请先修改设计内容`,
      { packageId: same.package, publishedVersion: same.version }
    );
  }

  // 写盘：快照 → index 追加（append-only，不改写既有条目）
  const snapshotDir = join(opts.releasesDir, packageId);
  mkdirSync(snapshotDir, { recursive: true });
  const snapshotPath = join(snapshotDir, `${opts.version}.sap.yaml`);
  writeFileSync(snapshotPath, canonicalize(pkg), "utf8");

  index.releases.push({
    package: packageId,
    version: opts.version,
    content_fingerprint: cfp,
    package_fingerprint: pfp,
    created_at: opts.now,
    released_by: opts.releasedBy,
    note: opts.note ?? "",
    file: `${packageId}/${opts.version}.sap.yaml`
  });
  writeFileSync(indexPath, stringifyYaml(index), "utf8");

  return {
    packageId,
    version: opts.version,
    contentFingerprint: cfp,
    packageFingerprint: pfp,
    snapshotPath,
    indexPath,
    indexEntryNumber: index.releases.length
  };
}
