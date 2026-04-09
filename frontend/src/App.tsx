import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Shield, Crosshair, Radar, Terminal, Activity, Cpu, User, TrendingUp } from 'lucide-react'
import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type ChampInfo = {
  id: string;
  key?: number;
  name: string;
  validRoles?: string[];
  tags: string[];
  image: string;
  score?: number;
  scores?: Record<string, number>;
  reasons?: string[];
  estimatedWR?: number;
  draftAdvantage?: 'unfavourable' | 'neutral' | 'favourable';
  laneDifficulty?: 'Favourable' | 'Even' | 'Difficult' | 'Unknown';
};

const ALL_ROLES = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'] as const;
type RoleType = typeof ALL_ROLES[number];

const SCORE_DIMENSIONS: { key: string; label: string; desc: React.ReactNode; icon?: string }[] = [
  {
    key: 'draftScore',
    label: 'Draft',
    desc: (
      <>
        <div style={{ fontWeight: 700, marginBottom: '4px', color: '#e2e8f0' }}>Draft Position Score</div>
        How well this champion avoids counter-picks based on your pick order.<br /><br />
        <span style={{ color: '#10b981', fontWeight: 600 }}>80-100:</span> Perfect safe blind pick (e.g., Ahri/Orianna) when picking early, or highly effective counter-pick when picking last.<br />
        <span style={{ color: '#f43f5e', fontWeight: 600 }}>10-30:</span> Dangerous spot. You are either blind-picking a highly counterable champion (e.g., Kassadin 1st pick) or exposing a fatal weakness.
      </>
    )
  },
  {
    key: 'teamCompScore',
    label: 'Comp',
    desc: (
      <>
        <div style={{ fontWeight: 700, marginBottom: '4px', color: '#e2e8f0' }}>Team Composition</div>
        How much this champion provides what your team is critically lacking.<br /><br />
        <span style={{ color: '#10b981', fontWeight: 600 }}>80-100:</span> Plugs a massive hole in the draft (e.g., locking Amumu when your team has 0 engage and 0 AP).<br />
        <span style={{ color: '#f43f5e', fontWeight: 600 }}>10-30:</span> Redundant pick. E.g., picking a 3rd squishy AD poke champion when your team desperately needs magic damage and peel.
      </>
    )
  },
  {
    key: 'synergyScore',
    label: 'Synergy',
    desc: (
      <>
        <div style={{ fontWeight: 700, marginBottom: '4px', color: '#e2e8f0' }}>Allied Synergy Match</div>
        Measures wombo-combo potential and trait synergies with locked allies.<br /><br />
        <span style={{ color: '#10b981', fontWeight: 600 }}>80-100:</span> Incredible synergy. The champion directly provides what an ally wants (e.g., Leona providing Engage for Jinx).<br />
        <span style={{ color: '#f43f5e', fontWeight: 600 }}>0-20:</span> Anti-synergy. The champion wants to dive deep while the rest of the team wants to kite backwards.
      </>
    )
  },
  {
    key: 'counterScore',
    label: 'Counter',
    desc: (
      <>
        <div style={{ fontWeight: 700, marginBottom: '4px', color: '#e2e8f0' }}>Enemy Matchups</div>
        Matchup advantage against the entire enemy team, heavily weighted towards direct lane opponent.<br /><br />
        <span style={{ color: '#10b981', fontWeight: 600 }}>80-100:</span> Hard counters multiple enemies or completely obliterates the direct lane matchup.<br />
        <span style={{ color: '#f43f5e', fontWeight: 600 }}>0-30:</span> Systematically shut down by the enemy traits or suffers from an unplayable lane disadvantage.
      </>
    )
  },
  {
    key: 'metaScore',
    label: 'Meta',
    desc: (
      <>
        <div style={{ fontWeight: 700, marginBottom: '4px', color: '#e2e8f0' }}>Current Meta Strength</div>
        Champion's base strength outside of draft geometry, using Meraki Analytics.<br /><br />
        <span style={{ color: '#10b981', fontWeight: 600 }}>80-100:</span> 52%+ Win-rate with high pick/ban presence. A genuinely free-elo patch for this champion.<br />
        <span style={{ color: '#f43f5e', fontWeight: 600 }}>0-30:</span> Very weak in the current patch. Demands exceptionally good draft conditions to justify picking.
      </>
    )
  },
  {
    key: 'temporalScore',
    label: 'Timing',
    desc: (
      <>
        <div style={{ fontWeight: 700, marginBottom: '4px', color: '#e2e8f0' }}>Power Curve Alignment</div>
        Whether your champion spikes at the exact same time as your team.<br /><br />
        <span style={{ color: '#10b981', fontWeight: 600 }}>80-100:</span> Enhances your team's win condition (e.g., full early game snowball or pure late game scaling).<br />
        <span style={{ color: '#f43f5e', fontWeight: 600 }}>10-30:</span> Your team wants to scale for 40 mins, but this champion needs to end the game at 20 mins to be useful.
      </>
    )
  },
  {
    key: 'executionScore',
    label: 'Execution',
    desc: (
      <>
        <div style={{ fontWeight: 700, marginBottom: '4px', color: '#e2e8f0' }}>Execution Reliability</div>
        How forgiving this champion is for human imperfection in Solo Queue.<br /><br />
        <span style={{ color: '#10b981', fontWeight: 600 }}>80-100:</span> Has a clear 'GO' button (e.g., Malphite) or serves as a solid anchor, making teamfights extremely simple.<br />
        <span style={{ color: '#f43f5e', fontWeight: 600 }}>0-30:</span> Adds severe fragility to your comp. Ex: picking a 3rd fragile hypercarry with no peel, demanding pixel-perfect spacing.
      </>
    )
  },
  {
    key: 'playerAffinityScore',
    label: 'Mastery',
    desc: (
      <>
        <div style={{ fontWeight: 700, marginBottom: '4px', color: '#e2e8f0' }}>Personal Performance</div>
        If your Summoner name is provided, checks your actual OP.GG mastery.<br /><br />
        <span style={{ color: '#10b981', fontWeight: 600 }}>80-100:</span> Comfort pick. You have a positive win-rate (+55%) in a decent sample size.<br />
        <span style={{ color: '#f43f5e', fontWeight: 600 }}>10-30:</span> Sub 50% win rate or you are first-timing a mechanically intensive champion.<br />
        <span style={{ color: '#94a3b8', fontWeight: 600 }}>0: </span> Dimension nullified if no summoner data is present.
      </>
    )
  },
  {
    key: 'opggMetaScore',
    label: 'OP.GG Tier',
    desc: (
      <>
        <div style={{ fontWeight: 700, marginBottom: '4px', color: '#e2e8f0' }}>OP.GG Native Tier</div>
        The direct snapshot of the champion's role classification on OP.GG.<br /><br />
        <span style={{ color: '#10b981', fontWeight: 600 }}>80-100:</span> Tier 1 (OP) or Tier 2 (Strong) in this exact role.<br />
        <span style={{ color: '#f43f5e', fontWeight: 600 }}>0-30:</span> Tier 5 (Weak) or widely considered a troll-pick for this role.
      </>
    )
  },
];

export default function App() {
  const [side, setSide] = useState<'blue' | 'red'>('blue');
  const [role, setRole] = useState<RoleType>('Mid');
  const [allies, setAllies] = useState<(ChampInfo | null)[]>([null, null, null, null]);
  const [enemies, setEnemies] = useState<(ChampInfo | null)[]>([null, null, null, null, null]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [bans, setBans] = useState<string[]>([]);

  // Summoner identity for player affinity
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [region, setRegion] = useState('euw');
  const [useAffinity, setUseAffinity] = useState(true);

  // Auto-fetch summoner data via ipc on load
  useEffect(() => {
    if ((window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.invoke('get-lcu-summoner').then((data: any) => {
        if (data && data.gameName && data.tagLine) {
           setGameName(data.gameName);
           setTagLine(data.tagLine);
        } else if (data && data.displayName) {
           const parts = data.displayName.split('#');
           if (parts.length > 1) {
              setGameName(parts[0]);
              setTagLine(parts[1]);
           } else {
              setGameName(data.displayName);
              setTagLine('EUW');
           }
        }
      }).catch((e: any) => console.warn("Failed to get LCU summoner", e));
    }
  }, []);

  // Hover state for alternative inspection
  const [hoveredChamp, setHoveredChamp] = useState<any>(null);

  const [championList, setChampionList] = useState<ChampInfo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<{ type: 'ally' | 'enemy', index: number } | null>(null);
  const [search, setSearch] = useState('');

  const [lcuData, setLcuData] = useState<any>(null);
  const lastFetchHash = useRef('');

  useEffect(() => {
    if ((window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      const handler = (_event: any, data: any) => setLcuData(data);
      ipcRenderer.on('lcu-draft-update', handler);
      return () => ipcRenderer.removeListener('lcu-draft-update', handler);
    }
  }, []);

  useEffect(() => {
    if (!lcuData || championList.length === 0) return;

    const roleMap: Record<string, RoleType> = {
      'top': 'Top', 'jungle': 'Jungle', 'middle': 'Mid', 'bottom': 'ADC', 'utility': 'Support', '': 'Mid'
    };

    const myTeam = lcuData.myTeam || [];
    const theirTeam = lcuData.theirTeam || [];
    const localPlayer = myTeam.find((c: any) => c.cellId === lcuData.localPlayerCellId);

    let currentRole = role;
    if (localPlayer && localPlayer.assignedPosition && roleMap[localPlayer.assignedPosition]) {
      currentRole = roleMap[localPlayer.assignedPosition];
      setRole(currentRole);
    }

    const isBlue = myTeam.length > 0 && myTeam[0].cellId < 5;
    setSide(isBlue ? 'blue' : 'red');

    const remainingAllyRoles = ALL_ROLES.filter(r => r !== currentRole);
    const newAllies: (ChampInfo | null)[] = [null, null, null, null];
    let fallbackAllyIdx = 0;

    myTeam.forEach((member: any) => {
      if (member.cellId === lcuData.localPlayerCellId) return;
      if (member.championId > 0) {
        const champ = championList.find(c => c.key === member.championId);
        if (champ) {
          const memberRole = roleMap[member.assignedPosition];
          const idx = remainingAllyRoles.indexOf(memberRole);
          if (idx !== -1 && !newAllies[idx]) newAllies[idx] = champ;
          else {
            while (fallbackAllyIdx < 4 && newAllies[fallbackAllyIdx]) fallbackAllyIdx++;
            if (fallbackAllyIdx < 4) { newAllies[fallbackAllyIdx] = champ; fallbackAllyIdx++; }
          }
        }
      }
    });

    const enemyMembers = [...theirTeam].sort((a: any, b: any) => a.cellId - b.cellId);
    const lockedEnemies: ChampInfo[] = [];
    enemyMembers.forEach((e: any) => {
      if (e.championId > 0) {
        const champ = championList.find(c => c.key === e.championId);
        if (champ) lockedEnemies.push(champ);
      }
    });

    const assignEnemiesToRoles = (enemyList: ChampInfo[]): (ChampInfo | null)[] => {
      const result: (ChampInfo | null)[] = [null, null, null, null, null];
      const sortedEnemies = [...enemyList].sort((a, b) => (a.validRoles?.length || 5) - (b.validRoles?.length || 5));
      const backtrack = (idx: number, current: (ChampInfo | null)[]): (ChampInfo | null)[] | null => {
        if (idx === sortedEnemies.length) return current;
        const enemy = sortedEnemies[idx];
        const preferredRoles = enemy.validRoles && enemy.validRoles.length > 0 ? enemy.validRoles : ALL_ROLES;
        for (const role of preferredRoles) {
          const roleIdx = ALL_ROLES.indexOf(role as RoleType);
          if (roleIdx !== -1 && !current[roleIdx]) {
            const next = [...current];
            next[roleIdx] = enemy;
            const res = backtrack(idx + 1, next);
            if (res) return res;
          }
        }
        return null;
      };
      let best = backtrack(0, result);
      if (!best) {
        best = [...result];
        const unassigned: ChampInfo[] = [];
        for (const enemy of sortedEnemies) {
          let placed = false;
          const preferredRoles = enemy.validRoles && enemy.validRoles.length > 0 ? enemy.validRoles : ALL_ROLES;
          for (const role of preferredRoles) {
            const roleIdx = ALL_ROLES.indexOf(role as RoleType);
            if (roleIdx !== -1 && !best[roleIdx]) {
              best[roleIdx] = enemy;
              placed = true;
              break;
            }
          }
          if (!placed) unassigned.push(enemy);
        }
        for (let i = 0; i < 5; i++) {
          if (!best[i] && unassigned.length > 0) best[i] = unassigned.shift()!;
        }
      }
      return best;
    };

    const newEnemies = assignEnemiesToRoles(lockedEnemies);

    const lcuBans: string[] = [];
    if (lcuData.bans) {
      const allBans = [...(lcuData.bans.myTeamBans || []), ...(lcuData.bans.theirTeamBans || [])];
      allBans.forEach((bid: number) => {
        if (bid > 0) {
          const champ = championList.find(c => c.key === bid);
          if (champ) lcuBans.push(champ.id);
        }
      });
    }

    setBans(prev => JSON.stringify(prev) === JSON.stringify(lcuBans) ? prev : lcuBans);
    setAllies(prev => JSON.stringify(prev.map(c => c?.id)) === JSON.stringify(newAllies.map(c => c?.id)) ? prev : newAllies);
    setEnemies(prev => JSON.stringify(prev.map(c => c?.id)) === JSON.stringify(newEnemies.map(c => c?.id)) ? prev : newEnemies);
  }, [lcuData, championList]);

  useEffect(() => {
    axios.get(`${API_URL}/api/champions`).then(res => {
      setChampionList(res.data);
    }).catch(err => console.error("Failed to fetch champions", err));
  }, []);

  const openSelectionModal = (type: 'ally' | 'enemy', index: number) => {
    setModalTarget({ type, index });
    setSearch('');
    setModalOpen(true);
  };

  const selectChampion = (champ: ChampInfo) => {
    if (!modalTarget) return;
    if (modalTarget.type === 'ally') {
      const newAllies = [...allies];
      newAllies[modalTarget.index] = champ;
      setAllies(newAllies);
    } else {
      const newEnemies = [...enemies];
      newEnemies[modalTarget.index] = champ;
      setEnemies(newEnemies);
    }
    setModalOpen(false);
  };

  const clearSlot = (type: 'ally' | 'enemy', index: number, e: any) => {
    e.stopPropagation();
    if (type === 'ally') {
      const newAllies = [...allies];
      newAllies[index] = null;
      setAllies(newAllies);
    } else {
      const newEnemies = [...enemies];
      newEnemies[index] = null;
      setEnemies(newEnemies);
    }
  };

  const fetchRecommendation = async () => {
    setLoading(true);
    setRecommendation(null);
    setHoveredChamp(null);
    try {
      const remainingAllyRoles = ALL_ROLES.filter(r => r !== role);

      const allyIds: string[] = [];
      const allyRoles: Record<string, string> = {};
      allies.forEach((a, index) => {
        if (a) {
          allyIds.push(a.id);
          allyRoles[a.id] = remainingAllyRoles[index];
        }
      });

      const enemyIds: string[] = [];
      const enemyRoles: Record<string, string> = {};
      enemies.forEach((e, index) => {
        if (e) {
          enemyIds.push(e.id);
          enemyRoles[e.id] = ALL_ROLES[index];
        }
      });

      const payload: any = {
        role, side, allies: allyIds, enemies: enemyIds, allyRoles, enemyRoles, bans
      };
      // Only send summoner data if affinity is toggled and filled in
      if (useAffinity && gameName.trim() && tagLine.trim()) {
        payload.gameName = gameName.trim();
        payload.tagLine = tagLine.trim();
        payload.region = region;
      }

      const res = await axios.post(`${API_URL}/api/recommend`, payload);
      setTimeout(() => {
        setRecommendation(res.data);
        setLoading(false);
      }, 600);

    } catch (e) {
      console.error(e);
      alert("Error generating recommendation.");
      setLoading(false);
    }
  };

  useEffect(() => {
    const hash = `${role}-${side}-${allies.map(a => a?.id).join()}-${enemies.map(e => e?.id).join()}-${bans.join()}-${useAffinity ? gameName+tagLine+region : 'off'}`;
    if (lcuData && hash !== lastFetchHash.current) {
      const timer = setTimeout(() => {
        lastFetchHash.current = hash;
        fetchRecommendation();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [role, side, allies, enemies, bans, lcuData, useAffinity, gameName, tagLine, region]);

  const filteredChamps = Array.isArray(championList)
    ? championList.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--score-good)';
    if (score <= 40) return 'var(--score-bad)';
    return 'var(--accent-cyan)';
  };

  // The active champion shown in the dossier — either hovered alt or the best pick
  const activeChamp = hoveredChamp ?? recommendation?.best;

  const getAdvantageColor = (adv: string) => {
    if (adv === 'favourable') return 'var(--score-good)';
    if (adv === 'unfavourable') return 'var(--score-bad)';
    return 'var(--accent-amber)';
  };
  const getAdvantageLabel = (adv: string) => {
    if (adv === 'favourable') return 'FAVOURABLE';
    if (adv === 'unfavourable') return 'UNFAVOURABLE';
    return 'NEUTRAL';
  };

  return (
    <div className="layout-grid">
      <header className="header">
        <div className="logo">
          <Terminal className="logo-icon" />
          <h1>LOL<span>PICKER</span> // TACTICAL</h1>
        </div>
      </header>

      <main className="main-content">

        {/* TOP: LIVE BATTLEFIELD DRAFT BOARD */}
        <div className="battlefield">
          <div className="team-section">
            <h3 className="team-header blue-txt"><Shield size={16} /> ALLIED SQUADRON</h3>
            <div className="team-roster blue">
              {ALL_ROLES.map((r) => {
                if (r === role) {
                  return (
                    <div key={r} className="slot target">
                      <div className="slot-role-label">{r}</div>
                    </div>
                  );
                } else {
                  const remainingAllyRoles = ALL_ROLES.filter(roleName => roleName !== role);
                  const arrayIndex = remainingAllyRoles.indexOf(r);
                  const a = allies[arrayIndex];
                  return (
                    <div key={r} className={`slot ${a ? 'filled' : 'empty'}`} onClick={() => openSelectionModal('ally', arrayIndex)}>
                      <div className="slot-role-label">{r}</div>
                      {a && (
                        <>
                          <img src={a.image} alt={a.name} />
                          <span className="champ-name">{a.name}</span>
                          <X size={14} className="remove-btn" onClick={(e) => clearSlot('ally', arrayIndex, e)} />
                        </>
                      )}
                    </div>
                  );
                }
              })}
            </div>
          </div>

          <div className="vs-badge">VS</div>

          <div className="team-section">
            <h3 className="team-header red-txt"><Crosshair size={16} /> HOSTILE FORCES</h3>
            <div className="team-roster red">
              {ALL_ROLES.map((r, arrayIndex) => {
                const e = enemies[arrayIndex];
                return (
                  <div key={r} className={`slot ${e ? 'filled' : 'empty'}`} onClick={() => openSelectionModal('enemy', arrayIndex)}>
                    <div className="slot-role-label">{r}</div>
                    {e && (
                      <>
                        <img src={e.image} alt={e.name} />
                        <span className="champ-name">{e.name}</span>
                        <X size={14} className="remove-btn" onClick={(ev) => clearSlot('enemy', arrayIndex, ev)} />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM: COMMAND & DOSSIER */}
        <div className="lower-command">

          <div className="panel context-controls">
            <div className="panel-header"><Radar size={16} /> MISSION PARAMETERS</div>

            <div className="control-group">
              <label>Draft Phase / Pick #</label>
              <div className="position-display" style={{ marginTop: '0.5rem' }}>
                {String(Math.min(10, allies.filter(a => a).length + enemies.filter(e => e).length + 1)).padStart(2, '0')}
              </div>
            </div>

            <div className="control-group">
              <label>Map Side</label>
              <div className="toggle-group">
                <button className={`side-btn blue ${side === 'blue' ? 'active' : ''}`} onClick={() => setSide('blue')}>BLUE</button>
                <button className={`side-btn red ${side === 'red' ? 'active' : ''}`} onClick={() => setSide('red')}>RED</button>
              </div>
            </div>

            <div className="control-group">
              <label>Target Assignment</label>
              <div className="role-selector">
                {ALL_ROLES.map(r => (
                  <button key={r} className={`role-btn ${role === r ? 'active' : ''}`} onClick={() => setRole(r)}>{r}</button>
                ))}
              </div>
            </div>

            {/* Summoner Identity Section */}
            <div className="control-group summoner-group">
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><User size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Summoner Affinity</span>
                <input 
                  type="checkbox" 
                  checked={useAffinity} 
                  onChange={e => setUseAffinity(e.target.checked)} 
                  style={{ cursor: 'pointer' }}
                />
              </label>
              {useAffinity && (
                <>
                  <div className="summoner-inputs" style={{ marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      className="summoner-input"
                      placeholder="Game Name"
                      value={gameName}
                      onChange={e => setGameName(e.target.value)}
                    />
                    <input
                      type="text"
                      className="summoner-input tag-input"
                      placeholder="Tag"
                      value={tagLine}
                      onChange={e => setTagLine(e.target.value)}
                    />
                  </div>
                  <select className="region-select" value={region} onChange={e => setRegion(e.target.value)}>
                    <option value="euw">EUW</option>
                    <option value="eune">EUNE</option>
                    <option value="na">NA</option>
                    <option value="kr">KR</option>
                    <option value="br">BR</option>
                    <option value="jp">JP</option>
                    <option value="oce">OCE</option>
                    <option value="lan">LAN</option>
                    <option value="las">LAS</option>
                    <option value="tr">TR</option>
                    <option value="ru">RU</option>
                  </select>
                </>
              )}
            </div>

            <button className="analyze-btn mt-2" onClick={fetchRecommendation}>
              {loading ? <><Activity className="spin" size={20} /> ANALYZING...</> : 'INITIALIZE HUD'}
            </button>
          </div>

          <div className={`panel dossier ${recommendation ? 'active' : ''}`}>
            <div className="panel-header"><Cpu size={16} /> TACTICAL DOSSIER</div>

            {loading ? (
              <div className="compiling-state">
                <div className="scan-line"></div>
                <p>COMPILING DRAFT METADATA...</p>
              </div>
            ) : !recommendation ? (
              <div className="idle-state">AWAITING MISSION PARAMETERS</div>
            ) : recommendation.best ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dossier-grid">
                <div className="verdict-col">
                  <div className="verdict-label">PRIMARY DIRECTIVE</div>
                  <div className={`champ-avatar best ${hoveredChamp ? 'dimmed' : ''}`}>
                    <img src={activeChamp?.image} alt={activeChamp?.name} />
                    <div className="overall-score">{activeChamp?.score}</div>
                  </div>
                  <h3 className="main-champ-name">{activeChamp?.name?.toUpperCase()}</h3>
                  <div className="tags">
                    {activeChamp?.tags?.slice(0, 2).map((t: string) => <span key={t} className="tag">{t}</span>)}
                  </div>

                  {/* Win Rate Gauge */}
                  {activeChamp?.draftAdvantage && (
                    <div className="wr-gauge">
                      <div className="wr-gauge-track">
                        <div className="wr-zone unfav"></div>
                        <div className="wr-zone neut"></div>
                        <div className="wr-zone fav"></div>
                        <motion.div
                          className="wr-needle"
                          initial={{ left: '50%' }}
                          animate={{ left: `${Math.max(5, Math.min(95, ((activeChamp.estimatedWR - 35) / 30) * 100))}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                      <div className="wr-label" style={{ color: getAdvantageColor(activeChamp.draftAdvantage) }}>
                        {getAdvantageLabel(activeChamp.draftAdvantage)}
                        <span className="wr-pct">{activeChamp.estimatedWR}%</span>
                      </div>
                    </div>
                  )}

                  {/* Lane Matchup Indicator */}
                  {activeChamp?.laneDifficulty && activeChamp.laneDifficulty !== 'Unknown' && (
                    <div className="lane-matchup">
                      <div className="lane-matchup-label">LANE MATCHUP</div>
                      <div className="lane-matchup-status">
                        <div className={`status-dot fav ${activeChamp.laneDifficulty === 'Favourable' ? 'active' : ''}`} />
                        <div className={`status-dot even ${activeChamp.laneDifficulty === 'Even' ? 'active' : ''}`} />
                        <div className={`status-dot diff ${activeChamp.laneDifficulty === 'Difficult' ? 'active' : ''}`} />
                        <span className={`status-text ${activeChamp.laneDifficulty.toLowerCase()}`}>
                          {activeChamp.laneDifficulty.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Reasons */}
                  {activeChamp?.reasons?.length > 0 && (
                    <div className="reasons-list">
                      {activeChamp.reasons.slice(0, 3).map((r: string, i: number) => (
                        <motion.div
                          key={r}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * i }}
                          className="reason-item"
                        >
                          <TrendingUp size={10} />
                          <span>{r}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="evidence-col">
                  <div className="evidence-label">ANALYTICS BREAKDOWN {hoveredChamp ? `— ${hoveredChamp.name.toUpperCase()}` : ''}</div>
                  {activeChamp?.scores && SCORE_DIMENSIONS.map(({ key, label, desc }) => {
                    const score = activeChamp.scores[key] || 0;
                    const barWidth = Math.max(0, Math.min(100, score));

                    return (
                      <div className="data-row" key={key}>
                        <div className="data-label">
                          {label}
                          <div className="info-icon">
                            ⓘ
                            <div className="info-tooltip">{desc}</div>
                          </div>
                        </div>
                        <div className="data-bar-bg">
                          <motion.div
                            key={`${activeChamp.id}-${key}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="data-bar-fill"
                            style={{ backgroundColor: getScoreColor(barWidth) }}
                          />
                        </div>
                        <div className="data-value">{score}</div>
                      </div>
                    )
                  })}

                  {recommendation.alternatives?.length > 0 && (
                    <div className="alternatives mt-4">
                      <div className="evidence-label">VIABLE ALTERNATIVES</div>
                      <div className="alt-list">
                        {recommendation.alternatives.map((alt: any, idx: number) => (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + idx * 0.1 }}
                            key={alt.id}
                            className={`alt-card ${hoveredChamp?.id === alt.id ? 'alt-active' : ''}`}
                            onMouseEnter={() => setHoveredChamp(alt)}
                            onMouseLeave={() => setHoveredChamp(null)}
                          >
                            <img src={alt.image} alt={alt.name} />
                            <div className="alt-name">{alt.name.toUpperCase()}</div>
                            <div className="alt-score">{alt.score}</div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="idle-state error">NO VIABLE CHAMPIONS FOUND IN PROTOCOL</div>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setModalOpen(false)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>OVERRIDE SELECTION</h3>
                <button className="close-btn" onClick={() => setModalOpen(false)}><X /></button>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 text-secondary" size={18} />
                <input autoFocus type="text" className="champ-search pl-10" placeholder="CLASSIFICATION QUERY..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="champ-grid">
                {filteredChamps.map(c => (
                  <button key={c.id} className="champ-grid-item" onClick={() => selectChampion(c)}>
                    <img src={c.image} alt={c.name} loading="lazy" />
                    <span>{c.name.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
