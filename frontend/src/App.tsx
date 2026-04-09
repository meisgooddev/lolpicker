import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Shield, Crosshair, Radar, Terminal, Cpu, TrendingUp } from 'lucide-react'
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
  const [role, setRole] = useState<RoleType | null>(null);
  const [allies, setAllies] = useState<(ChampInfo | null)[]>([null, null, null, null]);
  const [enemies, setEnemies] = useState<(ChampInfo | null)[]>([null, null, null, null, null]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [bans, setBans] = useState<string[]>([]);
  const [gamePlan, setGamePlan] = useState<any>(null);
  const [gamePlanStatus, setGamePlanStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [gamePlanError, setGamePlanError] = useState<{ code?: string; userMessage?: string; retryable?: boolean; requestId?: string }>({});
  const fetchingPlanRef = useRef(false);

  // Summoner identity for player affinity
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [region] = useState('euw'); // setRegion removed since UI is hidden
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

  // Track the LCU gameflow phase to distinguish dodge vs game-start
  const [gameflowPhase, setGameflowPhase] = useState<string>('None');

  useEffect(() => {
    if ((window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      const draftHandler = (_event: any, data: any) => setLcuData(data);
      const gameflowHandler = (_event: any, phase: any) => {
        // The LCU sends the phase as a plain string like "ChampSelect", "InProgress", "Lobby", "None", etc.
        const phaseStr = typeof phase === 'string' ? phase : String(phase);
        console.log(`[LOLPicker] Gameflow phase: ${phaseStr}`);
        setGameflowPhase(phaseStr);
      };
      ipcRenderer.on('lcu-draft-update', draftHandler);
      ipcRenderer.on('lcu-gameflow-update', gameflowHandler);
      return () => {
        ipcRenderer.removeListener('lcu-draft-update', draftHandler);
        ipcRenderer.removeListener('lcu-gameflow-update', gameflowHandler);
      };
    }
  }, []);

  // Determine if we are currently in-game (loading screen, active game, reconnect)
  const isInGame = ['InProgress', 'GameStart', 'WaitingForStats', 'Reconnect'].includes(gameflowPhase);

  // When the game ends and player returns to lobby, clear the persisted game plan
  useEffect(() => {
    if (['Lobby', 'None', 'EndOfGame'].includes(gameflowPhase) && (gamePlanStatus === 'ready' || gamePlanStatus === 'loading')) {
      console.log(`[LOLPicker] Game ended (phase: ${gameflowPhase}). Clearing game plan.`);
      setGamePlanStatus('idle');
      setGamePlan(null);
      setGamePlanError({});
      fetchingPlanRef.current = false;
    }
  }, [gameflowPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!lcuData || lcuData.httpStatus === 404 || typeof lcuData.localPlayerCellId !== 'number') {
      // If currently in-game, do NOT clear: the champ select session disappeared because
      // the game started, not because of a dodge. Preserve everything.
      if (isInGame) return;

      // Otherwise this is a dodge or lobby exit — full reset.
      setRole(null);
      setAllies([null, null, null, null]);
      setEnemies([null, null, null, null, null]);
      setBans([]);
      setRecommendation(null);
      if (gamePlanStatus !== 'idle') {
        setGamePlanStatus('idle');
        setGamePlan(null);
        setGamePlanError({});
        fetchingPlanRef.current = false;
      }
      return;
    }
    if (championList.length === 0) return;

    const roleMap: Record<string, RoleType> = {
      'top': 'Top', 'jungle': 'Jungle', 'middle': 'Mid', 'bottom': 'ADC', 'utility': 'Support'
    };

    const myTeam = lcuData.myTeam || [];
    const theirTeam = lcuData.theirTeam || [];
    const localPlayer = myTeam.find((c: any) => c.cellId === lcuData.localPlayerCellId);

    // Only update currentRole from LCU when the server has actually assigned a position
    let currentRole = role;
    const lcuPosition = (localPlayer?.assignedPosition || '').toLowerCase();
    if (lcuPosition && roleMap[lcuPosition]) {
      currentRole = roleMap[lcuPosition];
      if (currentRole !== role) {
        setRole(currentRole);
      }
    }

    const isBlue = myTeam.length > 0 && myTeam[0].cellId < 5;
    setSide(isBlue ? 'blue' : 'red');

    const remainingAllyRoles = currentRole ? ALL_ROLES.filter(r => r !== currentRole) : ALL_ROLES.slice(0, 4);
    const newAllies: (ChampInfo | null)[] = [null, null, null, null];
    let fallbackAllyIdx = 0;

    myTeam.forEach((member: any) => {
      if (member.cellId === lcuData.localPlayerCellId) return;
      if (member.championId > 0) {
        const champ = championList.find(c => c.key === member.championId);
        if (champ) {
          const lcuMemberPos = (member.assignedPosition || '').toLowerCase();
          const memberRole = roleMap[lcuMemberPos];
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

    const lcuBansSet = new Set<string>();

    if (lcuData.actions) {
      const flatActions = lcuData.actions.flat();
      flatActions.forEach((a: any) => {
        if (a.type === 'ban' && a.championId > 0 && a.completed) {
          const champ = championList.find(c => c.key === a.championId);
          if (champ) lcuBansSet.add(champ.id);
        }
      });
    }

    if (lcuData.bans) {
      const allBans = [...(lcuData.bans.myTeamBans || []), ...(lcuData.bans.theirTeamBans || [])];
      allBans.forEach((bid: number) => {
        if (bid > 0) {
          const champ = championList.find(c => c.key === bid);
          if (champ) lcuBansSet.add(champ.id);
        }
      });
    }

    const lcuBans = Array.from(lcuBansSet);

    setBans(prev => JSON.stringify(prev) === JSON.stringify(lcuBans) ? prev : lcuBans);
    setAllies(prev => JSON.stringify(prev.map(c => c?.id)) === JSON.stringify(newAllies.map(c => c?.id)) ? prev : newAllies);
    setEnemies(prev => JSON.stringify(prev.map(c => c?.id)) === JSON.stringify(newEnemies.map(c => c?.id)) ? prev : newEnemies);

    // Lock-in detection
    const flatActions = lcuData.actions ? lcuData.actions.flat() : [];
    const myPickAction = flatActions.find((a: any) => a.actorCellId === lcuData.localPlayerCellId && a.type === 'pick');
    const isPlayerLockedIn = myPickAction ? myPickAction.completed : (localPlayer && localPlayer.championId > 0 && lcuData.timer.phase !== 'PLANNING');

    if (!isPlayerLockedIn && gamePlanStatus !== 'idle') {
      setGamePlanStatus('idle');
      setGamePlan(null);
      setGamePlanError({});
      fetchingPlanRef.current = false;
    }

    if (isPlayerLockedIn && localPlayer && localPlayer.championId > 0 && gamePlanStatus === 'idle' && !fetchingPlanRef.current) {
      fetchingPlanRef.current = true;
      setGamePlanStatus('loading');

      const playerChamp = championList.find(c => c.key === localPlayer.championId);
      if (playerChamp) {
        const payload = {
          playerChampion: playerChamp.name,
          playerRole: currentRole, // Always use the mapped role, not the raw LCU string
          allies: newAllies.filter(Boolean).map(c => ({ name: c!.name, role: remainingAllyRoles[newAllies.indexOf(c)] })),
          enemies: newEnemies.filter(Boolean).map(c => ({ name: c!.name, role: ALL_ROLES[newEnemies.indexOf(c)] })),
          alliedBans: lcuBans.filter((_, i) => i < 5).map(id => championList.find(c => c.id === id)?.name).filter(Boolean),
          enemyBans: lcuBans.filter((_, i) => i >= 5).map(id => championList.find(c => c.id === id)?.name).filter(Boolean)
        };

        axios.post(`${API_URL}/api/gameplan`, payload)
          .then(res => {
            if (res.data?.ok) {
              setGamePlan(res.data.data);
              setGamePlanStatus('ready');
            } else {
              console.error('Game Plan: backend returned ok=false', res.data?.error);
              setGamePlanStatus('error');
              setGamePlanError(res.data?.error || { userMessage: 'An unexpected error occurred.' });
            }
          })
          .catch(err => {
            console.error('Game Plan Error', err);
            const backendError = err.response?.data?.error;
            if (backendError && typeof backendError === 'object') {
              setGamePlanError(backendError);
            } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
              setGamePlanError({ code: 'NETWORK_TIMEOUT', userMessage: 'The request to the AI service took too long and timed out.', retryable: true });
            } else if (!err.response) {
              setGamePlanError({ code: 'NETWORK_UNREACHABLE', userMessage: 'Could not reach the backend server.', retryable: true });
            } else {
              setGamePlanError({ code: 'INTERNAL_UNKNOWN', userMessage: err.message || 'An unexpected error occurred.' });
            }
            setGamePlanStatus('error');
          });
      } else {
        setGamePlanStatus('error');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!role) return;
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
    if (!role) return;
    const hash = `${role}-${side}-${allies.map(a => a?.id).join()}-${enemies.map(e => e?.id).join()}-${bans.join()}-${useAffinity ? gameName + tagLine + region : 'off'}`;
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

          <div className="center-battle-hud">
            <div className="vs-badge">VS</div>
            {bans.length > 0 && (
              <div className="bans-zone">
                <div className="bans-header"><X size={12} /> BANNED</div>
                <div className="bans-list">
                  {bans.map((bid, idx) => {
                    const champ = championList.find(c => c.id === bid);
                    if (!champ) return null;
                    return <img key={idx} src={champ.image} alt={champ.name} title={champ.name} />;
                  })}
                </div>
              </div>
            )}
          </div>

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

                  {/* Affinity Toggle (Appears under the main champion recommended) */}
                  <div className="affinity-toggle" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: useAffinity ? 'var(--text-main)' : 'var(--text-secondary)' }}>
                      {useAffinity ? 'MASTERY INFLUENCE: ON' : 'MASTERY INFLUENCE: OFF'}
                    </span>
                    <div
                      className={`toggle-switch ${useAffinity ? 'active' : ''}`}
                      onClick={() => setUseAffinity(!useAffinity)}
                      style={{
                        width: '32px', height: '16px', borderRadius: '8px', cursor: 'pointer',
                        backgroundColor: useAffinity ? 'var(--accent-cyan)' : 'var(--bg-darker)',
                        border: '1px solid var(--border-color)', position: 'relative', transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--text-main)',
                        position: 'absolute', top: '1px', left: useAffinity ? '17px' : '2px', transition: 'all 0.2s'
                      }} />
                    </div>
                  </div>
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

        {/* PRE-GAME STRATEGIC BRIEF */}
        {(gamePlanStatus !== 'idle') && (
          <div className="panel gameplan-panel">
            <div className="panel-header"><TrendingUp size={16} /> PRE-GAME STRATEGIC BRIEF</div>
            {gamePlanStatus === 'loading' ? (
              <div className="compiling-state">
                <div className="scan-line"></div>
                <p>GENERATING WIN CONDITION AND STRATEGIC PLAYBOOK...</p>
              </div>
            ) : gamePlanStatus === 'ready' && gamePlan ? (
              <div className="gameplan-content">
                <h2 className="mission-statement">MISSION: {gamePlan.mission}</h2>
                <div className="comp-identity">{gamePlan.compIdentity}</div>

                <div className="gameplan-grid mt-4">
                  <div className="plan-col">
                    <div className="plan-section">
                      <h4>LANE PLAN</h4>
                      <div className="plan-item"><span className="plan-label">Lvl 1-3:</span> {gamePlan.lanePlan?.levelOneToThree?.waveManagement}. {gamePlan.lanePlan?.levelOneToThree?.bestPlay}</div>
                      {gamePlan.lanePlan?.levelOneToThree?.warnings?.length > 0 && (
                        <div className="plan-item"><span className="plan-warning">WARNING:</span> {gamePlan.lanePlan.levelOneToThree.warnings.join(' ')}</div>
                      )}

                      <div className="plan-item"><span className="plan-label">Lvl 3-5:</span> {gamePlan.lanePlan?.levelThreeToFive?.waveManagement}. {gamePlan.lanePlan?.levelThreeToFive?.bestPlay}</div>

                      {gamePlan.lanePlan?.powerSpikes?.map((sp: any, i: number) => (
                        <div key={i} className="plan-item"><span className="plan-label">SPIKE: {sp.spike}</span> - {sp.whatToDo}</div>
                      ))}
                    </div>

                    <div className="plan-section mt-4">
                      <h4>JUNGLE TRACKING</h4>
                      <div className="plan-item"><span className="plan-label">Start / Path:</span> {gamePlan.jungleTracking?.likelyStart} &rarr; {gamePlan.jungleTracking?.path}</div>
                      <div className="plan-item"><span className="plan-label">First Gank:</span> {gamePlan.jungleTracking?.firstGankTiming}</div>
                      <div className="plan-item"><span className="plan-label">How to play:</span> {gamePlan.jungleTracking?.howToPlay}</div>
                    </div>
                  </div>

                  <div className="plan-col">
                    <div className="plan-section">
                      <h4>MACRO & WIN CONDITION</h4>
                      <div className="plan-item"><span className="plan-label">Mid Game:</span> {gamePlan.midGamePlan?.bestPlay}. {gamePlan.midGamePlan?.why}</div>
                      <div className="plan-item"><span className="plan-label">Win Condition:</span> {gamePlan.winCondition}</div>
                      <div className="plan-item">
                        <span className="plan-label">Priority Targets:</span>
                        {gamePlan.priorityTargets?.map((t: any) => `${t.target} (${t.reason})`).join(', ')}
                      </div>
                    </div>

                    <div className="plan-section mt-4">
                      <h4>BUILD PATH</h4>
                      <div className="plan-item"><span className="plan-label">Start:</span> {gamePlan.build?.startItems?.join(', ')}</div>
                      <div className="plan-item"><span className="plan-label">1st Recall (@{gamePlan.build?.firstRecall?.timing}):</span> {gamePlan.build?.firstRecall?.items?.join(', ')} (Need {gamePlan.build?.firstRecall?.minGold})</div>
                      <div className="plan-item"><span className="plan-label">Rush:</span> {gamePlan.build?.firstItem?.name} ({gamePlan.build?.firstItem?.why})</div>
                      <div className="plan-item"><span className="plan-label">Core:</span> {gamePlan.build?.coreItems?.map((c: any) => c.name).join(', ')}</div>
                    </div>
                  </div>
                </div>

                {(gamePlan.warnings?.length > 0 || gamePlan.microTips?.length > 0) && (
                  <div className="gameplan-grid">
                    <div className="plan-section">
                      <h4>WARNINGS</h4>
                      {gamePlan.warnings?.map((w: string, idx: number) => <div key={idx} className="plan-item"><span className="plan-warning">!</span> {w}</div>)}
                    </div>
                    <div className="plan-section">
                      <h4>MICRO TIPS</h4>
                      {gamePlan.microTips?.map((t: string, idx: number) => <div key={idx} className="plan-item">• {t}</div>)}
                    </div>
                  </div>
                )}
              </div>
            ) : gamePlanStatus === 'error' ? (
              <div className="idle-state error" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontWeight: 800 }}>FAILED TO GENERATE STRATEGIC BRIEF</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: '1.4' }}>
                  {gamePlanError.userMessage || 'An unexpected error occurred.'}
                </span>
                {gamePlanError.retryable && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', opacity: 0.8, marginTop: '0.25rem' }}>This error is transient — the system will retry automatically next lock-in.</span>
                )}
                {gamePlanError.requestId && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.5, fontFamily: 'monospace' }}>REF: {gamePlanError.requestId}</span>
                )}
              </div>
            ) : (
              <div className="idle-state error">AWAITING LOCK-IN</div>
            )}
          </div>
        )}

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
