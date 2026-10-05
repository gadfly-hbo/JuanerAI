"""Trusted macOS preparation supervisor. No payload executes before native policy installation.
Invocation is adapter-private. stdin remains open only while its owning application lives.
Child diagnostics are never used as trusted supervision or result metadata.
"""
import base64
import csv
import ctypes
import datetime
import decimal
import errno
import encodings.cp437
import encodings.utf_8_sig
import hashlib
import io
import json
import os
import resource
import selectors
import signal
import socket
import sys
import time
import zipfile
import xml.etree.ElementTree as ET

LIMITS = {'wall_seconds': 4, 'cpu_rlimit_soft_seconds': 1, 'cpu_rlimit_hard_seconds': 2, 'cpu_observed_seconds': 2,
          'resident_bytes': 96 * 1024 * 1024, 'stream_bytes': 65536,
          'file_bytes': 1048576, 'output_bytes': 2097152, 'output_files': 2,
          'open_files': 32, 'poll_seconds': 0.01}

class Usage(ctypes.Structure):
    # Installed macOS SDK sys/resource.h, rusage_info_v2; libproc.h proc_pid_rusage.
    _fields_ = [('uuid', ctypes.c_uint8 * 16)] + [(name, ctypes.c_uint64) for name in (
        'user_time', 'system_time', 'pkg_idle_wkups', 'interrupt_wkups', 'pageins',
        'wired_size', 'resident_size', 'phys_footprint', 'proc_start_abstime',
        'proc_exit_abstime', 'child_user_time', 'child_system_time', 'child_pkg_idle_wkups',
        'child_interrupt_wkups', 'child_pageins', 'child_elapsed_abstime',
        'diskio_bytesread', 'diskio_byteswritten')]


def usage_seconds(user, system, numerator, denominator):
    if numerator <= 0 or denominator <= 0:
        raise ValueError('RESOURCE_MONITOR_UNAVAILABLE')
    return (user + system) * numerator / denominator / 1000000000


def resource_failure(resident_bytes, cpu_seconds):
    if cpu_seconds >= LIMITS['cpu_observed_seconds']:
        return 'CPU_LIMIT'
    if resident_bytes > LIMITS['resident_bytes']:
        return 'MEMORY_LIMIT'
    return None


def create_usage_reader():
    # rusage_info user/system times are Mach ticks; never assume nanoseconds on ARM.
    class Timebase(ctypes.Structure):
        _fields_ = [('numer', ctypes.c_uint32), ('denom', ctypes.c_uint32)]
    system = ctypes.CDLL(None, use_errno=True)
    system.mach_timebase_info.argtypes = [ctypes.POINTER(Timebase)]
    system.mach_timebase_info.restype = ctypes.c_int
    timebase = Timebase()
    if system.mach_timebase_info(ctypes.byref(timebase)) != 0 or not timebase.numer or not timebase.denom:
        raise OSError('RESOURCE_MONITOR_UNAVAILABLE')
    libproc = ctypes.CDLL('/usr/lib/libproc.dylib', use_errno=True)
    libproc.proc_pid_rusage.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.POINTER(Usage)]
    libproc.proc_pid_rusage.restype = ctypes.c_int
    def read(pid):
        usage = Usage()
        if libproc.proc_pid_rusage(pid, 2, ctypes.byref(usage)) != 0:
            raise OSError(ctypes.get_errno(), 'RESOURCE_MONITOR_UNAVAILABLE')
        return {'resident_bytes': usage.resident_size,
                'cpu_seconds': usage_seconds(usage.user_time, usage.system_time, timebase.numer, timebase.denom)}
    # Check actual accounting/unit conversion before any fork or payload release.
    observed = read(os.getpid())['cpu_seconds']
    if observed <= 0 or abs(observed - time.process_time()) > 0.05:
        raise OSError('RESOURCE_MONITOR_UNAVAILABLE')
    return read


def run(root):
    audit = open(os.path.join(root, 'supervision.jsonl'), 'x', buffering=1)
    def event(name, **fields):
        audit.write(json.dumps({'event': name, 'monotonic': time.monotonic(), **fields}) + '\n')
    request = json.load(open(os.path.join(root, 'request.json')))
    code = open(os.path.join(root, 'payload.py')).read()
    if sys.platform != 'darwin' or '.'.join(map(str, sys.version_info[:3])) != request['python_version']:
        raise RuntimeError('ISOLATION_UNAVAILABLE')
    if hashlib.sha256(code.encode()).hexdigest() != request['code_sha256']:
        raise RuntimeError('PREPARATION_IDENTITY_INVALID')
    for item in request['sources']:
        if hashlib.sha256(open(item['path'], 'rb').read()).hexdigest() != item['sha256']:
            raise RuntimeError('PREPARATION_IDENTITY_INVALID')
    compiled = compile(code, '<preparation>', 'exec')
    ET.fromstring('<warmup/>')  # initialize only trusted stdlib machinery before policy
    output = request['output_directory']
    sandbox = ctypes.CDLL('/usr/lib/libsandbox.dylib', use_errno=True)
    sandbox.sandbox_init.argtypes = [ctypes.c_char_p, ctypes.c_uint64, ctypes.POINTER(ctypes.c_char_p)]
    sandbox.sandbox_init.restype = ctypes.c_int
    native = ctypes.CDLL(None, use_errno=True)
    native.open.argtypes = [ctypes.c_char_p, ctypes.c_int]
    native.open.restype = ctypes.c_int
    read_usage = create_usage_reader()  # fail closed before fork/payload
    quote = lambda value: json.dumps(value, ensure_ascii=True)
    policy = '(version 1)\n(deny default)\n' + ''.join(
        '(allow file-read* (literal ' + quote(s['path']) + '))\n' for s in request['sources'])
    policy += '(allow file-read* file-write* (subpath ' + quote(output) + '))\n'
    open(os.path.join(root, 'policy.sb'), 'x').write(policy)
    event('supervisor_ready', pid=os.getpid(), limits=LIMITS,
          code_sha256=request['code_sha256'], policy_sha256=hashlib.sha256(policy.encode()).hexdigest())
    out_r, out_w = os.pipe(); err_r, err_w = os.pipe(); ready_r, ready_w = os.pipe(); go_r, go_w = os.pipe()
    pid = os.fork()
    if pid == 0:
        try:
            os.dup2(out_w, 1); os.dup2(err_w, 2)
            null = os.open('/dev/null', os.O_RDONLY); os.dup2(null, 0)
            keep = {0, 1, 2, ready_w, go_r}
            # FD closure before policy, independent of the untrusted code's globals.
            maximum = int(resource.getrlimit(resource.RLIMIT_NOFILE)[0])
            if maximum == resource.RLIM_INFINITY: maximum = 1048576
            previous = 3
            for fd in sorted(keep - {0, 1, 2}):
                os.closerange(previous, fd); previous = fd + 1
            os.closerange(previous, max(maximum, 65536))
            if os.read(go_r, 1) != b'G': os._exit(79)
            os.close(go_r)
            os.environ.clear()
            resource.setrlimit(resource.RLIMIT_CPU, (1, 2))
            resource.setrlimit(resource.RLIMIT_FSIZE, (1048576, 1048576))
            resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
            resource.setrlimit(resource.RLIMIT_NOFILE, (32, 32))
            error = ctypes.c_char_p()
            installed = sandbox.sandbox_init(policy.encode(), 0, ctypes.byref(error))
            if installed != 0:
                os.write(ready_w, b'F'); os.close(ready_w); os._exit(78)
            os.write(ready_w, b'P'); os.close(ready_w)
            # No receipt/audit/control descriptor exists during payload execution.
            scope = {'__name__': '__preparation__', 'SOURCES': [s['path'] for s in request['sources']],
                     'OUTPUT': output, 'csv': csv, 'io': io, 'json': json, 'zipfile': zipfile,
                     'ET': ET, 'os': os, 'sys': sys, 'ctypes': ctypes, 'native': native,
                     'socket': socket, 'time': time, 'errno': errno, 'signal': signal}
            exec(compiled, scope, scope)
            sys.stdout.flush(); sys.stderr.flush(); os._exit(0)
        except BaseException:
            # Never leak traceback, paths or arbitrary code exceptions to a model.
            os._exit(70)
    os.close(out_w); os.close(err_w); os.close(ready_w); os.close(go_r)
    stdout = open(os.path.join(root, 'payload.stdout'), 'xb', buffering=0)
    stderr = open(os.path.join(root, 'payload.stderr'), 'xb', buffering=0)
    selector = selectors.DefaultSelector()
    for fd, kind in ((0, 'parent'), (out_r, 'stdout'), (err_r, 'stderr'), (ready_r, 'policy')):
        os.set_blocking(fd, False); selector.register(fd, selectors.EVENT_READ, kind)
    started = time.monotonic(); failure = None; policy_installed = False; total = 0; peak = 0; observed_cpu = 0
    waited = False; wait_status = None; cpu_seconds = None; parent_bytes = b''; released = False
    def stop(reason):
        nonlocal failure
        if failure is None:
            failure = reason; event('termination_requested', reason=reason, child_pid=pid)
        if not waited:
            try: os.kill(pid, signal.SIGKILL)
            except ProcessLookupError: pass
    signal.signal(signal.SIGTERM, lambda *_: stop('SUPERVISOR_CANCELLED'))
    try:
        event('child_created', child_pid=pid)
        print(json.dumps({'event': 'child_created', 'pid': pid}), flush=True)
        while True:
            if not waited:
                found, status, usage = os.wait4(pid, os.WNOHANG)
                if found:
                    waited = True; wait_status = status; cpu_seconds = usage.ru_utime + usage.ru_stime
                    if cpu_seconds >= LIMITS['cpu_observed_seconds']: stop('CPU_LIMIT')
            if not waited:
                try:
                    measured = read_usage(pid)
                    peak = max(peak, measured['resident_bytes'])
                    observed_cpu = max(observed_cpu, measured['cpu_seconds'])
                    reason = resource_failure(peak, observed_cpu)
                    if reason: stop(reason)
                except OSError: stop('RESOURCE_MONITOR_UNAVAILABLE')
                if time.monotonic() - started >= LIMITS['wall_seconds']: stop('WALL_LIMIT')
                try:
                    entries = list(os.scandir(output))
                    size = sum(e.stat(follow_symlinks=False).st_size for e in entries)
                    if len(entries) > 2 or size > LIMITS['output_bytes']: stop('OUTPUT_LIMIT')
                except OSError: stop('OUTPUT_INVALID')
            # Drain output even after waitpid; all inherited writers are closed before execution.
            for key, _ in selector.select(0 if waited else LIMITS['poll_seconds']):
                data = os.read(key.fd, 8192)
                if not data:
                    selector.unregister(key.fd)
                    if key.data == 'parent' and not waited: stop('PARENT_CLOSED')
                    if key.data == 'policy' and not policy_installed: stop('ISOLATION_UNAVAILABLE')
                    continue
                if key.data == 'parent':
                    parent_bytes += data
                    if released or parent_bytes not in (b'g', b'go', b'go\n'): stop('PARENT_PROTOCOL_INVALID')
                    elif parent_bytes == b'go\n':
                        os.write(go_w, b'G'); os.close(go_w); go_w = -1; released = True
                elif key.data == 'policy':
                    if data != b'P' or policy_installed: stop('ISOLATION_UNAVAILABLE')
                    else:
                        policy_installed = True; event('policy_installed', child_pid=pid)
                else:
                    target = stdout if key.data == 'stdout' else stderr
                    remaining = max(0, LIMITS['stream_bytes'] - total)
                    target.write(data[:remaining]); total += len(data)
                    if total > LIMITS['stream_bytes']: stop('STREAM_LIMIT')
            if waited and all(k.data == 'parent' for k in selector.get_map().values()): break
            if waited and time.monotonic() - started > 5: failure = failure or 'PIPE_UNRESOLVED'; break
        exit_code = os.waitstatus_to_exitcode(wait_status)
        if not policy_installed: failure = failure or 'ISOLATION_UNAVAILABLE'
        if exit_code != 0: failure = failure or 'CHILD_FAILED'
        outcome = {'version': '1.0', 'status': 'exited', 'physical_settled': waited,
                   'child_pid': pid, 'supervisor_pid': os.getpid(), 'exit_code': exit_code,
                   'policy_installed': policy_installed, 'failure': failure, 'peak_resident_bytes': peak,
                   'observed_stream_bytes': total, 'observed_cpu_seconds': observed_cpu, 'cpu_seconds': cpu_seconds, 'elapsed_seconds': time.monotonic() - started,
                   'limits': LIMITS}
        open(os.path.join(root, 'outcome.json'), 'x').write(json.dumps(outcome, indent=2) + '\n')
        event('child_reaped', **outcome)
        return 0 if failure is None else (78 if failure == 'ISOLATION_UNAVAILABLE' else 1)
    finally:
        if not waited:
            stop('SUPERVISOR_FAILED'); os.waitpid(pid, 0)
        if go_w >= 0: os.close(go_w)
        selector.close()
        for fd in (out_r, err_r, ready_r): os.close(fd)
        stdout.close(); stderr.close(); audit.close()


if __name__ == '__main__':
    try: status = run(sys.argv[1])
    except BaseException as error:
        # Preserve actual trusted setup/supervisor failures locally; no payload traceback is forwarded.
        try:
            with open(os.path.join(sys.argv[1], 'supervisor-failure.json'), 'x') as f:
                json.dump({'exception': type(error).__name__, 'message': str(error), 'errno': getattr(error, 'errno', None)}, f)
        except OSError:
            pass
        status = 78
    sys.exit(status)
