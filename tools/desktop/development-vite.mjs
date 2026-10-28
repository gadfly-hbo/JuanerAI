// Vite mergeConfig ignores null, so Forge's watch:{} must be disabled after
// its config merge. This hook runs before Vite resolves/builds either target.
export function explicitDesktopRestart(){
 return {name:'xanthil-explicit-desktop-restart',config(config){config.build??={};config.build.watch=null;}};
}
