const { VitePlugin } = require('@electron-forge/plugin-vite');
const fs = require('node:fs');
const path = require('node:path');

const electronZipDir = process.env.JUANERAI_ELECTRON_ZIP_DIR;
const internalResources = process.env.JUANERAI_INTERNAL_INSTALL_RESOURCES;
const internalOutput = process.env.JUANERAI_INTERNAL_INSTALL_OUTPUT;
const deepResearchPackage=process.env.JUANERAI_DEEP_RESEARCH_PACKAGE==='1';
if(deepResearchPackage&&!internalResources)throw new Error('Deep Research delivery requires explicit verified bundled resources');
const reportStudioPackage=process.env.JUANERAI_REPORT_STUDIO_PACKAGE==='1';
const metricFactoryPackage=process.env.JUANERAI_METRIC_FACTORY_PACKAGE==='1';
if(metricFactoryPackage&&!internalResources)throw new Error('Metric Factory delivery requires verified bundled resources');
const browserPackage=reportStudioPackage||deepResearchPackage||metricFactoryPackage;
if(reportStudioPackage&&!internalResources)throw new Error('Report Studio delivery requires explicit verified bundled resources');
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
    require('./tools/desktop/build-keychain-helper.cjs').buildKeychainHelper(path.join(output, 'Xanthil.app'));
    require('./tools/desktop/seal-internal-app.cjs').sealInternalApp(path.join(output, 'Xanthil.app'));
  } } } : {}),
  packagerConfig: {
    asar: true,
    // Pi is dynamically loaded. Keep the already installed production closure;
    // Packager filters dev modules during copy without npm install or lifecycle scripts.
    prune: true,
    ignore: file => file.includes('/node_modules/.') || Boolean(file) && !(/^\/(?:\.vite(?:\/|$)|node_modules(?:\/|$)|package\.json$)/.test(file)),
    extraResource: internalResources
      ? [path.join(internalResources, 'toolchain-deployment.json'), path.join(internalResources, 'toolchain'), path.join(internalResources, 'THIRD_PARTY_NOTICES'), ...(reportStudioPackage?[path.join(internalResources,'report-studio'),path.join(internalResources,'report-studio-deployment.json')]:[]), ...(deepResearchPackage?[path.join(internalResources,'deep-research'),path.join(internalResources,'deep-research-deployment.json')]:[]), ...(metricFactoryPackage?[path.join(internalResources,'metric-factory'),path.join(internalResources,'metric-factory-deployment.json')]:[]), '.vite/build/xanthil-resources']
      : ['build/xanthil-toolchain-deployment.json', '.vite/build/xanthil-resources'],
    afterCopyExtraResources: internalResources ? [] : [renameToolchainDeploymentResource],
    ...(electronZipDir ? { electronZipDir } : {}),
  },
  rebuildConfig: {
    onlyModules: [],
  },
  makers: [],
  plugins: [
    new VitePlugin({
      build: browserPackage?[{entry:'apps/browser/installed-main.ts',config:'vite.main.config.mjs',target:'main'}]:[
        {
          entry: browserPackage?'apps/browser/installed-main.ts':'apps/desktop/main.ts',
          config: 'vite.main.config.mjs',
          target: 'main',
        },
        {
          entry: 'apps/desktop/preload.ts',
          config: 'vite.preload.config.mjs',
          target: 'preload',
        },
      ],
      renderer: browserPackage?[]:[
        {
          name: 'main_window',
          config: 'vite.renderer.config.mjs',
        },
      ],
    }),
  ],
};
