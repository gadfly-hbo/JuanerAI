import {mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync} from 'node:fs';
import {dirname, isAbsolute, join, relative, resolve, sep} from 'node:path';

export const developmentOrigin = 'http://127.0.0.1:5173';
/** Forge's compiled localhost spelling is normalized; environment URLs are never inputs. */
export function developmentEndpoint(packaged: boolean, compiled: unknown): string | null {
  if (packaged || compiled === undefined) return null;
  if (compiled !== 'http://localhost:5173' && compiled !== developmentOrigin) throw new Error('Invalid development endpoint');
  return developmentOrigin + '/';
}
export function isDevelopmentFrame(url: string, endpoint: string): boolean {
  return url.split('#',1)[0] === endpoint;
}
export function prepareDevelopmentRoot(path: string) {
  if (!isAbsolute(path) || resolve(path) !== path) throw new Error('Development root must be an absolute normalized path');
  mkdirSync(path, {recursive:true, mode:0o700});
  // Do not turn an existing unrelated directory or symlink into a dev workspace.
  if (realpathSync(path) !== path) throw new Error('Development root must not use symlinks');
  const marker = join(path,'.xanthil-development-root');
  if (readdirSync(path).length === 0) writeFileSync(marker,'xanthil-desktop-development-v1\n',{flag:'wx',mode:0o600});
  if (readFileSync(marker,'utf8') !== 'xanthil-desktop-development-v1\n') throw new Error('Not a development workspace');
  for (const name of ['user-data','cache','logs','Projects']) {
    const child=join(path,name);mkdirSync(child,{recursive:true,mode:0o700});
    if(realpathSync(child)!==child)throw new Error('Development directory must not use symlinks');
  }
  return {root:path,projects:join(path,'Projects'),userData:join(path,'user-data'),cache:join(path,'cache'),logs:join(path,'logs')};
}
/** Native chooser capabilities must resolve beneath the owned directory, including export parents. */
export function assertDevelopmentPath(root: string, path: string, creatingFile = false): void {
  const actual=creatingFile?join(realpathSync(dirname(path)), path.slice(dirname(path).length+1)):realpathSync(path);
  const rel=relative(realpathSync(root),actual);
  if(!rel || rel==='..' || rel.startsWith('..'+sep) || isAbsolute(rel)) throw Object.assign(new Error('FORBIDDEN'),{code:'FORBIDDEN'});
}
