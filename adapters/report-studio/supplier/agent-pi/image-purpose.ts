// Compiled only against the fixed supplier SDK, inside its Pi Adapter.
import type {ModelConfig,ModelTransport,PurposeConfig,SessionRuntime,UncappedLimits,InputImage,RunResult} from 'pi-agent-runtime';

export const BUILTIN_IMAGE_MAX_OUTPUT_TOKENS = 2048;

/** One explicitly authorized image per run; every physical request remains SDK-metered. */
export function createBuiltinImagePurpose(config: {
  id?: 'image-understand' | 'image-understand-mimo';
  model: ModelConfig;
  transport: ModelTransport;
  authorizeRead(): Promise<boolean>;
}) {
  let pending: {image: InputImage; signal: AbortSignal; read: boolean} | null = null;
  const tools: NonNullable<PurposeConfig['tools']> = [{
    name: 'read_authorized_image',
    description: 'Read the single image explicitly authorized for this description task.',
    effect: 'read', output: 'content', resourceUnits: 1, replay: 'safe',
    parameters: {type: 'object', properties: {}, additionalProperties: false},
    async execute() {
      const current = pending;
      if (!current || current.signal.aborted || !await config.authorizeRead()) {
        throw Error('RS_IMAGE_PERMISSION_REQUIRED');
      }
      if (pending !== current || current.signal.aborted) throw Error('RS_IMAGE_CANCELLED');
      current.read = true;
      return {content: [{kind: 'image', ...current.image}], details: null};
    },
  }];
  const purpose: PurposeConfig = {
    id: config.id ?? 'image-understand', mode: 'agent',
    model: {...config.model, maxOutputTokens: BUILTIN_IMAGE_MAX_OUTPUT_TOKENS},
    transport: async request => {
      const current = pending;
      if (!current || current.signal.aborted || request.signal.aborted) throw Error('RS_IMAGE_CANCELLED');
      const images = request.messages.flatMap(message => message.images ?? []);
      if (images.some(image => image.data !== current.image.data || image.mimeType !== current.image.mimeType)) {
        throw Error('RS_IMAGE_INVALID');
      }
      const attach = !images.length && current.image.data.length <= 4_194_304;
      if ((images.length || attach) && !await config.authorizeRead()) throw Error('RS_IMAGE_PERMISSION_REQUIRED');
      if (pending !== current || current.signal.aborted || request.signal.aborted) throw Error('RS_IMAGE_CANCELLED');
      // The fixed SDK validates initial images against every declared purpose,
      // including unrelated text-only fallbacks. Attach only at this already
      // admitted vision transport boundary, preserving that immutable plan.
      const outbound = attach ? {...request, messages: [...request.messages,
        {role: 'user' as const, text: '本次明确授权理解的图片', images: [{...current.image}]}]} : request;
      const result = await config.transport(outbound);
      if ((images.length || attach) && pending === current && !current.signal.aborted && !request.signal.aborted) current.read = true;
      return result;
    }, tools, thinkingLevel: 'off',
  };
  return {
    purpose,
    async run(runtime: SessionRuntime, taskId: string, image: InputImage,
      limits: UncappedLimits, signal: AbortSignal): Promise<{result: RunResult<string>; read: boolean}> {
      if (pending) throw Error('RS_IMAGE_BUSY');
      if (signal.aborted) throw Error('RS_IMAGE_CANCELLED');
      if (!['image/png','image/jpeg','image/webp','image/gif'].includes(image.mimeType)
        || typeof image.data !== 'string' || image.data.length > 32 * 1024 * 1024
        || !/^[A-Za-z0-9+/]*={0,2}$/.test(image.data)
        || Buffer.from(image.data, 'base64').toString('base64') !== image.data
        || !image.data.length) throw Error('RS_IMAGE_INVALID');
      // Keep the tool route for inputs beyond the fixed SDK's initial-image bound.
      const initialImage = image.data.length <= 4_194_304;
      if (!await config.authorizeRead()) throw Error('RS_IMAGE_PERMISSION_REQUIRED');
      if (pending) throw Error('RS_IMAGE_BUSY');
      if (signal.aborted) throw Error('RS_IMAGE_CANCELLED');
      const current = {image: {...image}, signal, read: false};
      pending = current;
      try {
        const result = await runtime.runAgent({
          taskId, purpose: purpose.id,
          prompt: initialImage
            ? '用中文客观描述所附图片中的内容、文字和可见数据。无法辨认的信息请明确说明，不要猜测。'
            : '先调用 read_authorized_image，然后用中文客观描述图片中的内容、文字和可见数据。无法辨认的信息请明确说明，不要猜测。',
          tools, limits, thinkingLevel: 'off', modelRecovery: {extraAttempts: 1}, signal,
        });
        return {result, read: current.read};
      } finally {
        pending = null;
      }
    },
  };
}
