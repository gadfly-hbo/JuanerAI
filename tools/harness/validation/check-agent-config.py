"""Bounded Codex routing check; Python 3.11+ stdlib TOML, no dependencies."""
import copy
import json
from pathlib import Path
import stat
import sys
import tomllib

CONFIG = ".codex/config.toml"
ROLES = {f".codex/agents/juaner_{role}.toml": role for role in ("worker", "spec", "test", "validator")}


def validate(path, data):
    model = "gpt-6-astra" if path == CONFIG else "gpt-6.1-sol"
    if data.get("model") != model:
        raise ValueError(f"{path}: expected fixed {model} model")
    effort = "high" if path == CONFIG or ROLES[path] == "validator" else "medium"
    if data.get("model_reasoning_effort") != effort:
        raise ValueError(f"{path}: expected {effort} effort")
    sandbox = "read-only" if ROLES.get(path) == "validator" else "workspace-write"
    if data.get("sandbox_mode") != sandbox:
        raise ValueError(f"{path}: unexpected sandbox")
    if path == CONFIG:
        agents = data["agents"]
        if agents.get("default_subagent_model") != "gpt-6-astra" or agents.get("default_subagent_reasoning_effort") != "medium":
            raise ValueError("default support routing mismatch")
        concurrency = agents.get("max_concurrent_threads_per_session")
        if type(concurrency) is not int or concurrency != 3 or agents.get("enabled") is not True:
            raise ValueError("agent concurrency/enabled mismatch")
    elif data.get("name") != f"juaner_{ROLES[path]}" or not isinstance(data.get("developer_instructions"), str) or not data["developer_instructions"].strip():
        raise ValueError(f"{path}: missing role identity/instructions")


def without_routing(data, path):
    data = copy.deepcopy(data)
    for key in ("model", "model_reasoning_effort"):
        del data[key]
    if path == CONFIG:
        for key in ("default_subagent_model", "default_subagent_reasoning_effort"):
            del data["agents"][key]
    return data


def same_toml_value(before, after):
    # Python considers True == 1 == 1.0; TOML gives these distinct types.
    if type(before) is not type(after):
        return False
    if isinstance(before, dict):
        return before.keys() == after.keys() and all(same_toml_value(value, after[key]) for key, value in before.items())
    if isinstance(before, list):
        return len(before) == len(after) and all(same_toml_value(left, right) for left, right in zip(before, after))
    return before == after


try:
    if sys.argv[1:] == ["--compare"]:
        packet = json.load(sys.stdin)
        path = packet["path"]
        if path not in {CONFIG, *ROLES}:
            raise ValueError("unmapped config")
        before = tomllib.loads(packet["before"])
        after = tomllib.loads(packet["after"])
        validate(path, after)
        if not same_toml_value(without_routing(before, path), without_routing(after, path)):
            raise ValueError("non-routing config changed")
    elif sys.argv[1:] == ["--check"]:
        for path in (CONFIG, *ROLES):
            # Reject links in both files and parent paths, including .codex.
            target = Path(path)
            for parent in reversed(target.parents):
                if not stat.S_ISDIR(parent.lstat().st_mode):
                    raise ValueError(f"{parent}: expected real directory")
            if not stat.S_ISREG(target.lstat().st_mode):
                raise ValueError(f"{path}: expected regular config")
            validate(path, tomllib.loads(target.read_text(encoding="utf-8")))
    else:
        raise ValueError("expected --compare or --check")
except (ValueError, KeyError, OSError, TypeError) as error:
    print(f"Agent config failed: {error}", file=sys.stderr)
    sys.exit(1)
