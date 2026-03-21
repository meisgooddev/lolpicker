import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Shield, Crosshair, Radar, Terminal, Activity, Cpu } from 'lucide-react'
import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type ChampInfo = {
  id: string;
  name: string;
  tags: string[];
  image: string;
  score?: number;
};

const ALL_ROLES = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'] as const;
type RoleType = typeof ALL_ROLES[number];

export default function App() {
  const [pickPosition, setPickPosition] = useState(1);
  const [side, setSide] = useState<'blue' | 'red'>('blue');
  const [role, setRole] = useState<RoleType>('Mid');
  const [allies, setAllies] = useState<(ChampInfo | null)[]>([null, null, null, null]);
  const [enemies, setEnemies] = useState<(ChampInfo | null)[]>([null, null, null, null, null]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [championList, setChampionList] = useState<ChampInfo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<{ type: 'ally' | 'enemy', index: number } | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Fetch base champions list
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

  const getRecommendation = async () => {
    setLoading(true);
    setRecommendation(null); // trigger recalculating visual state
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

      const res = await axios.post(`${API_URL}/api/recommend`, {
        role, pickPosition, side, allies: allyIds, enemies: enemyIds, allyRoles, enemyRoles
      });
      // Simulate slight delay for "compiling" feel
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

  // Helpers for Progress Bars
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--score-good)';
    if (score <= 40) return 'var(--score-bad)';
    return 'var(--accent-cyan)';
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
            <h3 className="team-header blue-txt"><Shield size={16}/> ALLIED SQUADRON</h3>
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
            <h3 className="team-header red-txt"><Crosshair size={16}/> HOSTILE FORCES</h3>
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
            <div className="panel-header"><Radar size={16}/> MISSION PARAMETERS</div>

            <div className="control-group">
              <label>Draft Phase / Pick #</label>
              <input type="range" min="1" max="10" value={pickPosition} onChange={(e) => setPickPosition(parseInt(e.target.value))} />
              <div className="position-display">0{pickPosition}</div>
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

            <button className="analyze-btn mt-2" onClick={getRecommendation}>
              {loading ? <><Activity className="spin" size={20}/> ANALYZING...</> : 'INITIALIZE HUD'}
            </button>
          </div>

          <div className={`panel dossier ${recommendation ? 'active' : ''}`}>
            <div className="panel-header"><Cpu size={16}/> TACTICAL DOSSIER</div>

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
                  <div className="champ-avatar best">
                    <img src={recommendation.best.image} alt={recommendation.best.name} />
                    <div className="overall-score">{recommendation.best.score}</div>
                  </div>
                  <h3 className="main-champ-name">{recommendation.best.name.toUpperCase()}</h3>
                  <div className="tags">
                    {recommendation.best.tags.slice(0, 2).map((t: string) => <span key={t} className="tag">{t}</span>)}
                  </div>
                </div>

                <div className="evidence-col">
                  <div className="evidence-label">ANALYTICS BREAKDOWN</div>
                  {recommendation.best.scores && ['draftScore', 'teamCompScore', 'synergyScore', 'counterScore', 'metaScore'].map(key => {
                    const score = recommendation.best.scores[key] || 0;
                    const displayLabel = key.replace('Score', '').replace('teamComp', 'Comp');
                    // Scores are roughly normalized 0-100 now. Sometimes slightly higher or lower. We cap rendering at 100%.
                    const barWidth = Math.max(0, Math.min(100, score));
                    
                    return (
                      <div className="data-row" key={key}>
                        <div className="data-label">{displayLabel}</div>
                        <div className="data-bar-bg">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${barWidth}%` }} 
                            transition={{ duration: 0.8, ease: 'easeOut' }}
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
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + idx * 0.1 }} key={alt.id} className="alt-card">
                            <img src={alt.image} alt={alt.name} />
                            <div className="alt-name">{alt.name.toUpperCase()}</div>
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
