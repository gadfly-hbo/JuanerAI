const { VitePlugin } = require('@electron-forge/plugin-vite');
const fs = require('node:fs');
const path = require('node:path');

const electronZipDir = process.env.JUANERAI_ELECTRON_ZIP_DIR;

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
  packagerConfig: {
    asar: true,
    extraResource: ['build/xanthil-toolchain-deployment.json'],
    afterCopyExtraResources: [renameToolchainDeploymentResource],
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
