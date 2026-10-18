import sys, socket
sys.dont_write_bytecode = True
sys.path.insert(0, sys.argv[1])
def forbidden(*args, **kwargs):
    raise RuntimeError('SYNTHETIC_EXTERNAL_NETWORK_DENIED')
socket.socket.connect = forbidden
socket.socket.connect_ex = forbidden
import dotenv
dotenv.load_dotenv = lambda *args, **kwargs: False
from minimax_mcp.client import MinimaxAPIClient
def synthetic(self, path, **kwargs):
    if path != '/v1/coding_plan/search' or kwargs.get('json') != {'q': 'synthetic question'}:
        raise RuntimeError('UNEXPECTED_MCP_REQUEST')
    return {'organic': [{'title': '合成检索', 'link': 'https://synthetic.invalid/mcp', 'snippet': 'only synthetic'}], 'base_resp': {'status_code': 0}}
MinimaxAPIClient.post = synthetic
from minimax_mcp.server import main
main()
