import { registerHooks } from 'node:module';

const packageName = '@earendil-works/pi-coding-agent';
const fixtureSdk = new URL('./pi-sdk-failure-sdk.ts', import.meta.url).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier !== packageName) return nextResolve(specifier, context);
    if (process.env.XANTHIL_TEST_PI_FAILURE_CASE === 'sdk_import') {
      throw new Error('test-only Pi SDK import unavailable');
    }
    return { url: fixtureSdk, shortCircuit: true };
  },
});
