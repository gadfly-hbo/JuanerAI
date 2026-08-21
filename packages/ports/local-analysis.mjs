function fail() {
  throw new Error('INVALID_PORT_IMPLEMENTATION');
}

function definePort(implementation, methods) {
  if (implementation === null || typeof implementation !== 'object' || Array.isArray(implementation)) fail();
  const keys = Object.keys(implementation);
  if (keys.length !== methods.length || keys.some((key) => !methods.includes(key)) || methods.some((method) => typeof implementation[method] !== 'function')) fail();
  return Object.freeze(Object.fromEntries(methods.map((method) => [method, implementation[method]])));
}

export function defineAgentAnalysisRuntime(implementation) {
  return definePort(implementation, ['preflightModel', 'openSession']);
}

export function defineLocalAnalysisExecution(implementation) {
  return definePort(implementation, ['preflightApprovedFixture', 'profileApprovedFixture', 'calculateMemberRepurchaseMetrics', 'validateMemberRepurchaseMetrics']);
}

export function defineRunArtifactStore(implementation) {
  return definePort(implementation, ['preflightRunRoot', 'beginRun', 'commitConfirmedContract', 'appendAsset', 'replaceManifest', 'commitSuccess', 'readTerminalRun']);
}
