import requests
import re
import json
import logging
from typing import Optional

logger = logging.getLogger("opgg_mcp")

MCP_URL = "https://mcp-api.op.gg/mcp"

# ─── MCP Response Parser ─────────────────────────────────────────────────────
# OP.GG MCP returns a custom text format (NOT JSON). The format is:
#
#   class ClassName: attr1,attr2,attr3
#   class OtherClass: x,y
#
#   ClassName(OtherClass(val1,val2),val3,...))
#
# This parser:
#   1. Extracts class definitions (name -> ordered attribute list)
#   2. Builds callable constructors that produce dicts
#   3. Evaluates the data expression safely using those constructors
#
# Confirmed via live call: the raw text is NOT valid JSON and this parser IS
# required. See commit log for the curl verification.


def parse_mcp_response(text: str) -> Optional[dict]:
    """Parse the OP.GG MCP pseudo-Python class format into a dict."""
    if not text or not text.strip():
        return None

    # Step 0: Try JSON first (future-proofing if OP.GG ever changes format)
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        pass

    lines = text.strip().split('\n')
    class_defs = {}
    data_line = ""

    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.startswith("class "):
            match = re.match(r"class (\w+): (.*)", line)
            if match:
                cls_name = match.group(1)
                attrs = [a.strip() for a in match.group(2).split(',')]
                class_defs[cls_name] = attrs
        else:
            # The last non-empty, non-class line is the data expression
            data_line = line

    if not data_line or not class_defs:
        logger.warning("[OPGG MCP] No parseable data found in response")
        return None

    # Replace null/true/false with Python equivalents
    data_line = data_line.replace('null', 'None').replace('true', 'True').replace('false', 'False')

    # Build safe constructors
    # The eval resolves inner constructors first (Python evaluation order),
    # so by the time an outer constructor receives args, inner ones are already
    # dicts. zip() pairs each positional arg with the declared attribute name.
    # We add explicit length validation to catch misalignment immediately.
    local_env: dict = {}

    def make_class(cls_name: str, attributes: list):
        def cls_constructor(*args):
            if len(args) != len(attributes):
                logger.warning(
                    f"[OPGG MCP] Attribute count mismatch for {cls_name}: "
                    f"expected {len(attributes)} ({attributes}), got {len(args)}"
                )
                # Pad or truncate gracefully instead of silently losing data
                result = {}
                for i, attr in enumerate(attributes):
                    result[attr] = args[i] if i < len(args) else None
                return result
            return dict(zip(attributes, args))
        return cls_constructor

    for cls_name, attrs in class_defs.items():
        local_env[cls_name] = make_class(cls_name, attrs)

    try:
        result = eval(data_line, {"__builtins__": {}}, local_env)
        return result
    except Exception as e:
        logger.error(f"[OPGG MCP] Failed to evaluate data expression: {e}")
        logger.debug(f"[OPGG MCP] Data line was: {data_line[:200]}")
        return None


# ─── MCP API Callers ──────────────────────────────────────────────────────────

def _call_mcp(tool_name: str, arguments: dict) -> Optional[dict]:
    """Generic MCP JSON-RPC caller with error handling."""
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }

    try:
        response = requests.post(MCP_URL, json=payload, timeout=15)
        response.raise_for_status()
        rpc_result = response.json()

        # Check for JSON-RPC error
        if "error" in rpc_result:
            logger.error(f"[OPGG MCP] RPC error for {tool_name}: {rpc_result['error']}")
            return None

        content = rpc_result.get("result", {}).get("content", [])
        if not content:
            logger.warning(f"[OPGG MCP] Empty content for {tool_name}")
            return None

        raw_text = content[0].get("text", "")
        if not raw_text:
            logger.warning(f"[OPGG MCP] Empty text in content for {tool_name}")
            return None

        parsed = parse_mcp_response(raw_text)
        if parsed is None:
            logger.error(f"[OPGG MCP] Failed to parse response for {tool_name}")
        return parsed

    except requests.exceptions.Timeout:
        logger.error(f"[OPGG MCP] Timeout calling {tool_name}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"[OPGG MCP] Request failed for {tool_name}: {e}")
        return None
    except Exception as e:
        logger.error(f"[OPGG MCP] Unexpected error for {tool_name}: {e}")
        return None


def fetch_mcp_champion_analysis(champion: str, position: str) -> Optional[dict]:
    """Fetch champion counter/synergy data from OP.GG MCP."""
    parsed = _call_mcp("lol_get_champion_analysis", {
        "game_mode": "RANKED",
        "champion": champion,
        "position": position.upper(),
        "desired_output_fields": [
            "data.weak_counters[].{champion_id,champion_name,play,win,win_rate}",
            "data.strong_counters[].{champion_id,champion_name,play,win,win_rate}",
            "data.summary.average_stats.{ban_rate,kda,pick_rate,play,rank,tier,win_rate}"
        ]
    })

    if not parsed or 'data' not in parsed:
        return None

    return {
        "weak_counters": parsed['data'].get('weak_counters', []),
        "strong_counters": parsed['data'].get('strong_counters', []),
        "stats": parsed['data'].get('summary', {}).get('average_stats', {})
    }


def fetch_mcp_summoner_profile(game_name: str, tag_line: str, region: str = "euw") -> Optional[dict]:
    """Fetch summoner ranked stats and champion pool from OP.GG MCP."""
    parsed = _call_mcp("lol_get_summoner_profile", {
        "game_name": game_name,
        "tag_line": tag_line,
        "region": region.upper(),
        "desired_output_fields": [
            "data.summoner.league_stats[].tier_info.{tier,division,lp}",
            "data.summoner.league_stats[].{win,lose}",
            "data.summoner.ranked_most_champions.my_champion_stats[].{champion_name,play,win,lose}"
        ]
    })

    if not parsed or 'data' not in parsed:
        return None

    summoner = parsed['data'].get('summoner', {})
    league_stats = summoner.get('league_stats', [])

    ranked_data = summoner.get('ranked_most_champions', {})
    champion_pool = []
    if isinstance(ranked_data, dict):
        champion_pool = ranked_data.get('my_champion_stats', [])
    elif isinstance(ranked_data, list):
        champion_pool = ranked_data

    return {
        "league_stats": league_stats,
        "champion_pool": champion_pool
    }


# Lane meta cache: position -> {champion_name -> stats}
_lane_meta_cache: dict = {}

POSITION_MAP = {
    'top': 'top', 'jungle': 'jungle', 'mid': 'mid',
    'adc': 'adc', 'support': 'support'
}

def fetch_mcp_lane_meta(position: str = "all") -> Optional[dict]:
    """Fetch lane-by-lane champion tiers with win/pick/ban rates from OP.GG MCP."""
    cache_key = position.lower()
    if cache_key in _lane_meta_cache:
        return _lane_meta_cache[cache_key]

    parsed = _call_mcp("lol_list_lane_meta_champions", {
        "position": POSITION_MAP.get(position.lower(), "all"),
        "desired_output_fields": [
            f"data.positions.{pos}[].{{champion,tier,win_rate,pick_rate,ban_rate,is_rip}}"
            for pos in ["top", "jungle", "mid", "adc", "support"]
        ]
    })

    if not parsed or 'data' not in parsed:
        return None

    positions = parsed['data'].get('positions', {})
    result = {}

    for pos_name, champ_list in positions.items():
        if not isinstance(champ_list, list):
            continue
        pos_map = {}
        for entry in champ_list:
            if isinstance(entry, dict) and 'champion' in entry:
                pos_map[entry['champion']] = entry
        result[pos_name] = pos_map

    _lane_meta_cache[cache_key] = result
    logger.info(f"[OPGG MCP] Cached lane meta for '{cache_key}': {sum(len(v) for v in result.values())} entries")
    return result
