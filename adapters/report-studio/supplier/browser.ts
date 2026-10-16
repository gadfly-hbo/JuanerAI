import {chromium,type Browser} from 'playwright';

/** Local rendering is not a model call. Built-in previews do not inherit keys or fetch remote resources. */
export function launchReportBrowser() {
  if(process.env['REPORT_STUDIO_BUILTIN']!=='1')return chromium.launch();
  const env=Object.fromEntries(['PATH','HOME','TMPDIR','LANG','LC_ALL','PLAYWRIGHT_BROWSERS_PATH']
    .filter(key=>process.env[key]!==undefined).map(key=>[key,process.env[key]!]));
  return chromium.launch({env,args:['--force-webrtc-ip-handling-policy=disable_non_proxied_udp']});
}
export async function createReportPage(browser:Browser) {
  const builtin=process.env['REPORT_STUDIO_BUILTIN']==='1';
  if(!builtin)return browser.newPage({viewport:{width:1280,height:720}});
  // Context-wide guards precede page creation: frames, workers and popups must
  // not escape page-only request interception. This is a local rendering profile,
  // not an OS sandbox for arbitrary code executed through the separate Bash tool.
  const context=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});
  await context.route('**/*',route=>route.abort('blockedbyclient'));
  await context.routeWebSocket('**/*',socket=>socket.close());
  await context.addInitScript(()=>{
    for(const name of ['RTCPeerConnection','webkitRTCPeerConnection','WebTransport'])Object.defineProperty(globalThis,name,{value:undefined,writable:false,configurable:false});
  });
  const page=await context.newPage();
  // Chromium's initial about:blank may predate the injected socket/RTC guards.
  // setContent itself does not navigate, so create the guarded document first.
  await page.goto('about:blank');return page;
}
