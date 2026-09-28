const { VitePlugin } = require('@electron-forge/plugin-vite');
const fs = require('node:fs');
const path = require('node:path');

const electronZipDir = process.env.JUANERAI_ELECTRON_ZIP_DIR;
const internalResources = process.env.JUANERAI_INTERNAL_INSTALL_RESOURCES;
const internalOutput = process.env.JUANERAI_INTERNAL_INSTALL_OUTPUT;
if (internalResources || internalOutput) {
  if (!internalResources || !internalOutput || !path.isAbsolute(internalResources) || !path.isAbsolute(internalOutput)) {
    throw new Error('Internal package requires absolute resource and output directories');
  }
  if (fs.existsSync(internalOutput)) throw new Error('Internal package output already exists; do not overwrite');
  const descriptor = JSON.parse(fs.readFileSync(path.join(internalResources, 'toolchain-deployment.json'), 'utf8'));
  if (descriptor.schema_version !== '2.0' || !Array.isArray(descriptor.inventory) || !fs.statSync(path.join(internalResources, 'toolchain')).isDirectory() || !fs.statSync(path.join(internalResources, 'THIRD_PARTY_NOTICES')).isDirectory()) {
    throw new Error('Internal package requires verified relative toolchain resources');
  }
}

function renameToolchainDeploymentResource(
  buildPath,
  _electronVersion,
  platform,
  _arch,
  callback,
) {
  const resourcesPath =
    platform === 'darwin'
      ? path.join(buildPath, 'Xanthil.app', 'Contents', 'Resources')
      : path.join(buildPath, 'resources');

  fs.rename(
    path.join(resourcesPath, 'xanthil-toolchain-deployment.json'),
    path.join(resourcesPath, 'toolchain-deployment.json'),
    callback,
  );
}

module.exports = {
  ...(internalOutput ? { outDir: internalOutput } : {}),
  ...(internalOutput ? { hooks: { postPackage: async (_config, result) => {
    if (result.platform !== 'darwin' || result.arch !== 'arm64' || result.outputPaths.length !== 1) {
      throw new Error('Internal signing requires the approved single darwin-arm64 output');
    }
    const output = path.resolve(result.outputPaths[0]);
    if (!output.startsWith(path.resolve(internalOutput) + path.sep)) throw new Error('Unexpected internal signing output');
    require('./tools/desktop/seal-internal-app.cjs').sealInternalApp(path.join(output, 'Xanthil.app'));
  } } } : {}),
  packagerConfig: {
    asar: true,
    extraResource: internalResources
      ? [path.join(internalResources, 'toolchain-deployment.json'), path.join(internalResources, 'toolchain'), path.join(internalResources, 'THIRD_PARTY_NOTICES')]
      : ['build/xanthil-toolchain-deployment.json'],
    afterCopyExtraResources: internalResources ? [] : [renameToolchainDeploymentResource],
    ...(electronZipDir ? { electronZipDir } : {}),
  },
  rebuildConfig: {
    onlyModules: [],
  },
  makers: [],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'apps/desktop/main.ts',
          config: 'vite.main.config.mjs',
          target: 'main',
        },
        {
          entry: 'apps/desktop/preload.ts',
          config: 'vite.preload.config.mjs',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.mjs',
        },
      ],
    }),
  ],
};
