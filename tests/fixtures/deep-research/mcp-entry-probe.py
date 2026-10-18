import sys, socket, runpy
sys.dont_write_bytecode = True
def denied(*args, **kwargs):
    raise RuntimeError('OFFLINE_MCP_NETWORK_DENIED')
socket.socket.connect = denied
socket.socket.connect_ex = denied
runpy.run_path(sys.argv[1], run_name='__main__')
