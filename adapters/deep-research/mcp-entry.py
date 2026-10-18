"""Owned MCP entry: pinned site packages, no .env discovery or implicit user imports."""
import sys
from pathlib import Path
if sys.version_info[:2] != (3, 14):
    raise RuntimeError('DR_MCP_PYTHON_314_REQUIRED')
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent / 'mcp-site'))
import dotenv
dotenv.load_dotenv = lambda *args, **kwargs: False
from minimax_mcp.server import main
main()
