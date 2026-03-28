from fastapi import FastAPI
import requests
import uvicorn

app = FastAPI()

champ_key_to_id: dict = {}
meraki_cache: dict = {}

def get_mapping():
    if champ_key_to_id:
        return
    try:
        versions = requests.get(
            'https://ddragon.leagueoflegends.com/api/versions.json', timeout=5
        ).json()
        latest = versions[0]
        champ_data = requests.get(
            f'https://ddragon.leagueoflegends.com/cdn/{latest}/data/en_US/champion.json',
            timeout=5
        ).json()
        for champ_id, info in champ_data['data'].items():
            champ_key_to_id[info['key']] = champ_id
        print(f"[MetaFetcher] Mapped {len(champ_key_to_id)} champion keys")
    except Exception as e:
        print(f"[MetaFetcher] Failed to map champion keys: {e}")

def get_meraki_data() -> dict:
    global meraki_cache
    if meraki_cache:
        return meraki_cache
    try:
        url = "https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/championrates.json"
        meraki_cache = requests.get(url, timeout=10).json().get("data", {})
        print(f"[MetaFetcher] Loaded Meraki data for {len(meraki_cache)} champions")
    except Exception as e:
        print(f"[MetaFetcher] Failed to load Meraki data: {e}")
    return meraki_cache

ROLE_MAP = {
    'top': 'TOP',
    'jungle': 'JUNGLE',
    'mid': 'MIDDLE',
    'middle': 'MIDDLE',
    'adc': 'BOTTOM',
    'bot': 'BOTTOM',
    'bottom': 'BOTTOM',
    'support': 'UTILITY',
    'supp': 'UTILITY',
    'utility': 'UTILITY',
}

@app.get("/meta")
async def get_meta(patch: str = None, role: str = "middle", elo: str = "emerald"):
    try:
        get_mapping()
        meraki_data = get_meraki_data()

        api_role = ROLE_MAP.get(role.lower(), 'MIDDLE')

        result = {}

        for champ_key, stats in meraki_data.items():
            if champ_key not in champ_key_to_id:
                continue

            champ_id = champ_key_to_id[champ_key]
            role_stats = stats.get(api_role, {})

            # Meraki values are decimal fractions: 0.512 = 51.2%, 0.05 = 5%
            play_rate = float(role_stats.get("playRate", 0.0))   # e.g. 0.08
            win_rate  = float(role_stats.get("winRate",  0.50))  # e.g. 0.512
            ban_rate  = float(role_stats.get("banRate",  0.0))   # e.g. 0.15

            # Exclude champions with no meaningful presence in this role
            # 0.005 = 0.5% play rate threshold — catches genuine off-role picks
            if play_rate < 0.005:
                continue

            # Convert to percentage-space for intuitive scoring:
            # win_rate_pct: 50.0 = average, 53.0 = strong
            win_rate_pct = win_rate * 100.0   # 0.512 -> 51.2
            play_rate_pct = play_rate * 100.0  # 0.08 -> 8.0
            ban_rate_pct = ban_rate * 100.0    # 0.15 -> 15.0

            # Score formula:
            # Base 5.0, scaled by win rate deviation from 50%, play rate, and ban rate
            # Weights tuned so a 53% WR + 10% PR champion lands ~7.5
            meta_score = (
                5.0
                + (win_rate_pct - 50.0) * 0.20   # ±2.0 for a ±10% WR swing
                + play_rate_pct * 0.12            # +1.2 for a 10% pick rate
                + ban_rate_pct * 0.05             # +0.75 for a 15% ban rate
            )
            meta_score = round(max(1.0, min(10.0, meta_score)), 1)
            result[champ_id] = meta_score

        print(f"[MetaFetcher] /meta {api_role}: {len(result)} champions scored")
        return {"success": True, "data": result, "patch": patch or "current"}

    except Exception as e:
        return {"success": False, "error": str(e)}

from opgg_mcp import fetch_mcp_champion_analysis, fetch_mcp_summoner_profile, fetch_mcp_lane_meta

@app.get("/mcp/champion")
async def get_champion_analysis(champion: str, position: str):
    data = fetch_mcp_champion_analysis(champion, position)
    if data:
        return {"success": True, "data": data}
    return {"success": False, "error": "Failed to fetch champion data from OP.GG MCP"}

@app.get("/mcp/summoner")
async def get_summoner_profile(gameName: str, tagLine: str, region: str = "euw"):
    data = fetch_mcp_summoner_profile(gameName, tagLine, region)
    if data:
        return {"success": True, "data": data}
    return {"success": False, "error": "Failed to fetch summoner data from OP.GG MCP"}

@app.get("/mcp/lane-meta")
async def get_lane_meta(position: str = "all"):
    data = fetch_mcp_lane_meta(position)
    if data:
        return {"success": True, "data": data}
    return {"success": False, "error": "Failed to fetch lane meta from OP.GG MCP"}


@app.get("/health")
async def health():
    return {"status": "ok", "champions_mapped": len(champ_key_to_id), "meraki_loaded": len(meraki_cache)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)