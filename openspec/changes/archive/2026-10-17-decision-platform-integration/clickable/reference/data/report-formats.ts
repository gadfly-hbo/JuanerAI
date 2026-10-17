/**
 * 报告上传支持的格式清单（前后端共享唯一来源）。
 * 文本类直接按 UTF-8 解码；pdf/office 由服务端解析为文本；图片不做本地 OCR，
 * 按 InputImage 直送视觉模型（MiniMax-M3 原生多模态）。
 */

/** 纯文本格式：上传时按 UTF-8 校验，抽取时直接读取 */
export const REPORT_TEXT_EXTENSIONS = ['md', 'txt', 'csv'] as const

/** 图片格式：直送多模态模型（mimeType 受 pi-agent-runtime InputImage 约束，bmp 不在内） */
export const REPORT_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif'] as const

/** 服务端解析为文本的二进制格式（xls 旧格式不支持） */
export const REPORT_BINARY_EXTENSIONS = ['pdf', 'docx', 'doc', 'pptx', 'xlsx', ...REPORT_IMAGE_EXTENSIONS] as const

export const REPORT_EXTENSIONS: readonly string[] = [...REPORT_TEXT_EXTENSIONS, ...REPORT_BINARY_EXTENSIONS]

const EXT_SET = new Set(REPORT_EXTENSIONS.map((ext) => `.${ext}`))
const TEXT_SET = new Set(REPORT_TEXT_EXTENSIONS.map((ext) => `.${ext}`))

const IMAGE_MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
} as const

export type ReportImageMime = (typeof IMAGE_MIME)[keyof typeof IMAGE_MIME]

/** 文件名后缀（含点，小写）；无后缀返回 '' */
export function reportExtension(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot > 0 ? filename.slice(dot).toLowerCase() : ''
}

export function isSupportedReportFile(filename: string): boolean {
  return EXT_SET.has(reportExtension(filename))
}

export function isTextReportFile(filename: string): boolean {
  return TEXT_SET.has(reportExtension(filename))
}

/** 图片报告 → InputImage mimeType；非图片返回 undefined */
export function reportImageMime(filename: string): ReportImageMime | undefined {
  return (IMAGE_MIME as Record<string, ReportImageMime>)[reportExtension(filename)]
}

/** 去掉报告文件扩展名（slug 生成用） */
export function stripReportExtension(filename: string): string {
  const ext = reportExtension(filename)
  return ext === '' ? filename : filename.slice(0, -ext.length)
}

/** 文件选择器 accept 串 */
export const REPORT_ACCEPT = REPORT_EXTENSIONS.map((ext) => `.${ext}`).join(',')

/** 上传大小上限（pptx/pdf/图片常见 5-15MB，取 20MB） */
export const MAX_REPORT_BYTES = 20 * 1024 * 1024

/** 拒绝文案（前后端统一口径） */
export const REPORT_FORMAT_HINT = '支持格式：md/txt/csv/pdf/docx/doc/pptx/xlsx/图片(png/jpg/jpeg/webp/gif)'
