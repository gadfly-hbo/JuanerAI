import { access, mkdir, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { promisify } from 'node:util';
import { execFile as execFileCallback } from 'node:child_process';

const execFile = promisify(execFileCallback);
const descriptorPath = 'build/xanthil-toolchain-deployment.json';

function requireToolchainDirectory() {
  const value = process.env.JUANERAI_TOOLCHAIN_BIN;

  if (typeof value !== 'string' || value.length === 0 || !isAbsolute(value)) {
    throw new Error('JUANERAI_TOOLCHAIN_BIN must name an absolute toolchain directory');
  }

  return value;
}

async function executableFrom(toolchainDirectory, name) {
  const executable = join(toolchainDirectory, name);
  await access(executable, constants.X_OK);
  return executable;
}

async function readVersion(executable) {
  const { stdout } = await execFile(executable, ['--version'], { encoding: 'utf8' });
  return stdout.trim();
}

function duckdbVersion(output) {
  const match = /^v?(\d+\.\d+\.\d+)(?:\s|$)/u.exec(output);

  if (match?.[1] !== '1.5.2') {
    throw new Error(`expected DuckDB 1.5.2, received ${output || 'no version output'}`);
  }

  return match[1];
}

function pythonVersion(output) {
  const match = /^Python (\d+)\.(\d+)\.(\d+)(?:\s|$)/u.exec(output);

  if (match === null) throw new Error(`unrecognized Python version output: ${output || 'empty'}`);

  const major = Number(match[1]);
  const minor = Number(match[2]);
  if (major < 3 || (major === 3 && minor < 9)) {
    throw new Error(`expected Python >=3.9, received ${output}`);
  }

  return `${match[1]}.${match[2]}.${match[3]}`;
}

async function main() {
  const toolchainDirectory = requireToolchainDirectory();
  const duckdb = await executableFrom(toolchainDirectory, 'duckdb');
  const python = await executableFrom(toolchainDirectory, 'python3');
  const deployment = {
    schema_version: '1.0',
    duckdb: {
      executable_path: duckdb,
      version: duckdbVersion(await readVersion(duckdb)),
    },
    python: {
      executable_path: python,
      version: pythonVersion(await readVersion(python)),
    },
  };

  await mkdir(dirname(descriptorPath), { recursive: true });
  await writeFile(descriptorPath, `${JSON.stringify(deployment, null, 2)}\n`, 'utf8');
}

await main();
