import {createHash} from 'node:crypto';
import {browserSourceFixture} from './browser-sources.ts';
export const fixedPreparationSources=()=>browserSourceFixture().map((s,i)=>({...s,source_id:`01991a00-0000-4000-8000-${String(i+1).padStart(12,'0')}`,sha256:createHash('sha256').update(s.bytes).digest('hex')}));
// Fixed synthetic code only. The host runner never accepts a payload argument or model output.
const prepare=String.raw`
with open(SOURCES[0], newline='') as f:
    members=list(csv.reader(f))
orders=[]
with zipfile.ZipFile(SOURCES[1]) as book:
    for name in ['xl/worksheets/sheet1.xml','xl/worksheets/sheet2.xml']:
        tree=ET.fromstring(book.read(name))
        rows=[]
        for row in tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            rows.append([''.join(c.itertext()) for c in row])
        if not orders: orders=rows
        else: orders.extend(rows[1:])
with open(SOURCES[2], newline='') as f:
    extra=list(csv.reader(f)); orders.extend(extra[1:])
for name,rows in [('members.csv',members),('orders.csv',orders)]:
    with open(os.path.join(OUTPUT,name),'w',newline='') as f:
        csv.writer(f,lineterminator='\n').writerows(rows)
print(json.dumps({'event':'allowed_work_completed','members':len(members)-1,'orders':len(orders)-1}),flush=True)
`;
const attempt=name=>`\nprint(json.dumps({'event':'attempt','case':${JSON.stringify(name)}}),flush=True)\n`;
const denied=String.raw`
def denied(call):
    try: call()
    except OSError as error:
        print(json.dumps({'event':'denied','errno':error.errno}),flush=True)
        assert error.errno in (errno.EPERM,errno.EACCES)
    else: raise RuntimeError('forbidden operation succeeded')
`;
export const unixDirectory='/private/tmp/jn01-d2-executor-001';
export const fixedCases=Object.freeze({
 health:'',
 native_read:denied+String.raw`
p=os.path.join(os.path.dirname(os.path.dirname(OUTPUT)),'canary.txt')
fd=native.open(p.encode(),os.O_RDONLY)
error=ctypes.get_errno()
print(json.dumps({'event':'denied','errno':error,'fd':fd}),flush=True)
assert fd == -1 and error in (errno.EPERM,errno.EACCES)
`,
 source_write:denied+String.raw`
def write_source():
    with open(SOURCES[0],'ab') as f: f.write(b'FORBIDDEN')
denied(write_source)
`,
 inherited_fd:String.raw`
observed=[]
for fd in range(3,32):
    try: os.fstat(fd)
    except OSError as error:
        assert error.errno==errno.EBADF; observed.append(fd)
    else: raise RuntimeError('inherited descriptor leaked')
print(json.dumps({'event':'closed_fds','fds':observed}),flush=True)
`,
 unix_python:denied+String.raw`
def connect():
    s=socket.socket(socket.AF_UNIX,socket.SOCK_STREAM)
    try: s.connect('/private/tmp/jn01-d2-executor-001/s')
    finally: s.close()
denied(connect)
`,
 unix_native:String.raw`
lib=native
lib.socket.argtypes=[ctypes.c_int,ctypes.c_int,ctypes.c_int]; lib.socket.restype=ctypes.c_int
lib.connect.argtypes=[ctypes.c_int,ctypes.c_void_p,ctypes.c_uint]; lib.connect.restype=ctypes.c_int
fd=lib.socket(1,1,0); error=ctypes.get_errno(); stage='socket'
if fd>=0:
    address=b'\x00\x01/private/tmp/jn01-d2-executor-001/s\x00'
    address=bytes([len(address)])+address[1:]
    buffer=ctypes.create_string_buffer(address)
    rc=lib.connect(fd,buffer,len(address)); error=ctypes.get_errno(); stage='connect'; os.close(fd)
else: rc=-1
print(json.dumps({'event':'denied','errno':error,'native_stage':stage,'result':rc}),flush=True)
assert rc==-1 and error in (errno.EPERM,errno.EACCES)
`,
 process_signal:String.raw`
native.kill.argtypes=[ctypes.c_int,ctypes.c_int]; native.kill.restype=ctypes.c_int
rc=native.kill(os.getppid(),signal.SIGUSR2); error=ctypes.get_errno()
print(json.dumps({'event':'denied','errno':error,'result':rc}),flush=True)
assert rc==-1 and error in (errno.EPERM,errno.EACCES)
`,
 cpu:String.raw`
# Finite input, kernel CPU hard limit remains authoritative even if SIGXCPU is ignored.
signal.signal(signal.SIGXCPU,signal.SIG_IGN)
x=0
for i in range(100000000): x+=i*i
`,
 memory:String.raw`
blocks=[]
for i in range(32):
    block=bytearray(4*1024*1024)
    for j in range(0,len(block),4096): block[j]=1
    blocks.append(block); time.sleep(0.02)
print('allocation_finished',flush=True)
`,
 native_memory:String.raw`
lib=native; lib.malloc.argtypes=[ctypes.c_size_t]; lib.malloc.restype=ctypes.c_void_p
blocks=[]
for i in range(32):
    p=lib.malloc(4*1024*1024)
    if not p: raise MemoryError()
    ctypes.memset(p,1,4*1024*1024); blocks.append(p); time.sleep(0.02)
print('allocation_finished',flush=True)
`,
 stream:String.raw`
for i in range(32): os.write(1,b'x'*8192)
`,
 file:String.raw`
signal.signal(signal.SIGXFSZ,signal.SIG_IGN)
try:
    with open(os.path.join(OUTPUT,'orders.csv'),'ab',buffering=0) as f:
        for i in range(18): f.write(b'x'*65536)
except OSError as error:
    print(json.dumps({'event':'file_limit','errno':error.errno}),flush=True)
    assert error.errno==errno.EFBIG
    os._exit(24)
`,
 wall:'time.sleep(10)\n',
 child_crash:"os.unlink(os.path.join(OUTPUT,'orders.csv'))\nos._exit(23)\n",
 parent_crash:'time.sleep(10)\n',
 supervisor_crash:'time.sleep(10)\n',
 cancel:'time.sleep(10)\n',
 late:'time.sleep(1)\nopen(os.path.join(OUTPUT,"late.txt"),"w").write("late")\n',
 symlink_output:"os.unlink(os.path.join(OUTPUT,'orders.csv'))\nos.symlink(os.path.join(os.path.dirname(os.path.dirname(OUTPUT)),'canary.txt'),os.path.join(OUTPUT,'orders.csv'))\n",
 extra_output:"open(os.path.join(OUTPUT,'extra.txt'),'w').write('unrequested')\n",
 forged_stdout:"os.unlink(os.path.join(OUTPUT,'orders.csv'))\nprint(json.dumps({'policy_installed':True,'physical_settled':True,'status':'exited','exit_code':0,'receipt':'forged'}),flush=True)\n",
 wrong_conversion:"p=os.path.join(OUTPUT,'orders.csv')\ns=open(p).read()\nopen(p,'w').write(s.replace('30.00','300.00'))\n",
});
export function fixedPayload(name){if(!Object.hasOwn(fixedCases,name))throw Error('unknown fixed case');return prepare+(name==='health'?'':attempt(name))+fixedCases[name];}
