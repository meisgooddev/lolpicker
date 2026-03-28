import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Shield, Crosshair, Radar, Terminal, Activity, Cpu, User, TrendingUp } from 'lucide-react'
import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type ChampInfo = {
  id: string;
  name: string;
  tags: string[];
  image: string;
  score?: number;
  scores?: Record<string, number>;
  reasons?: string[];
  estimatedWR?: number;
  draftAdvantage?: 'unfavourable' | 'neutral' | 'favourable';
};

const ALL_ROLES = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'] as const;
type RoleType = typeof ALL_ROLES[number];

const SCORE_DIMENSIONS: { key: string; label: string; icon?: string }[] = [
  { key: 'draftScore', label: 'Draft' },
  { key: 'teamCompScore', label: 'Comp' },
  { key: 'synergyScore', label: 'Synergy' },
  { key: 'counterScore', label: 'Counter' },
  { key: 'metaScore', label: 'Meta' },
  { key: 'temporalScore', label: 'Timing' },
  { key: 'executionScore', label: 'Execution' },
  { key: 'playerAffinityScore', label: 'Mastery' },
  { key: 'opggMetaScore', label: 'OP.GG Tier' },
];

export default function App() {
  const [side, setSide] = useState<'blue' | 'red'>('blue');
  const [role, setRole] = useState<RoleType>('Mid');
  const [allies, setAllies] = useState<(ChampInfo | null)[]>([null, null, null, null]);
  const [enemies, setEnemies] = useState<(ChampInfo | null)[]>([null, null, null, null, null]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Summoner identity for player affinity
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [region, setRegion] = useState('euw');

  // Hover state for alternative inspection
  const [hoveredChamp, setHoveredChamp] = useState<any>(null);

  const [championList, setChampionList] = useState<ChampInfo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<{ type: 'ally' | 'enemy', index: number } | null>(null);
  const [search, setSearch] = useState('');

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
        role, side, allies: allyIds, enemies: enemyIds, allyRoles, enemyRoles
      };
      // Only send summoner data if filled in
      if (gameName.trim() && tagLine.trim()) {
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
              <label><User size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Summoner (Optional)</label>
              <div className="summoner-inputs">
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
                  {activeChamp?.scores && SCORE_DIMENSIONS.map(({ key, label }) => {
                    const score = activeChamp.scores[key] || 0;
                    const barWidth = Math.max(0, Math.min(100, score));

                    return (
                      <div className="data-row" key={key}>
                        <div className="data-label">{label}</div>
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
