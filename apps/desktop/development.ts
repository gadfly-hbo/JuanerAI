import {mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync} from 'node:fs';
import {dirname, isAbsolute, join, relative, resolve, sep} from 'node:path';

export function prepareDevelopmentRoot(path: string,kind:'development'|'installed-browser'='development') {
  if (!isAbsolute(path) || resolve(path) !== path) throw new Error('Development root must be an absolute normalized path');
  mkdirSync(path, {recursive:true, mode:0o700});
  // Do not turn an existing unrelated directory or symlink into a dev workspace.
  if (realpathSync(path) !== path) throw new Error('Development root must not use symlinks');
  if(!['development','installed-browser'].includes(kind))throw new Error('Unknown workspace kind');
  const marker = join(path,kind==='development'?'.xanthil-development-root':'.juanerai-installed-browser-root'),identity=kind==='development'?'xanthil-desktop-development-v1\n':'juanerai-installed-browser-v1\n';
  if (readdirSync(path).length === 0) writeFileSync(marker,identity,{flag:'wx',mode:0o600});
  if (readFileSync(marker,'utf8') !== identity) throw new Error('Not a development workspace');
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
