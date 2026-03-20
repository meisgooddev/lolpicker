import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, X, Search } from 'lucide-react'
import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL;

type ChampInfo = {
  id: string;
  name: string;
  tags: string[];
  image: string;
  score?: number;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('draft')
  const [pickPosition, setPickPosition] = useState(1);
  const [side, setSide] = useState<'blue' | 'red'>('blue');
  const [role, setRole] = useState<'Top' | 'Jungle' | 'Mid' | 'ADC' | 'Support'>('Mid');
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
    try {
      const allRoles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
      const remainingAllyRoles = allRoles.filter(r => r !== role);
      const enemyRolesPattern = [...allRoles];

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
          enemyRoles[e.id] = enemyRolesPattern[index];
        }
      });

      const res = await axios.post(`${API_URL}/api/recommend`, {
        role, pickPosition, side, allies: allyIds, enemies: enemyIds, allyRoles, enemyRoles
      });
      setRecommendation(res.data);
    } catch (e) {
      console.error(e);
      alert("Error generating recommendation.");
    } finally {
      setLoading(false);
    }
  };

  const filteredChamps = championList.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <Zap className="logo-icon" />
          <h1>LOL<span>PICKER</span></h1>
        </div>
        <nav>
          <button className={activeTab === 'draft' ? 'active' : ''} onClick={() => setActiveTab('draft')}>Draft Assistant</button>
        </nav>
      </header>

      <main className="main-content">
        <div className="glass-panel setup-panel">
          <h2>Draft Context</h2>

          <div className="control-group">
            <label>Team Side</label>
            <div className="toggle-group">
              <button className={`side-btn blue ${side === 'blue' ? 'active' : ''}`} onClick={() => setSide('blue')}>Blue Side</button>
              <button className={`side-btn red ${side === 'red' ? 'active' : ''}`} onClick={() => setSide('red')}>Red Side</button>
            </div>
          </div>

          <div className="control-group">
            <label>Pick Position (1-10)</label>
            <input type="range" min="1" max="10" value={pickPosition} onChange={(e) => setPickPosition(parseInt(e.target.value))} />
            <div className="position-display">Pick #{pickPosition}</div>
          </div>

          <div className="control-group">
            <label>Target Role</label>
            <div className="role-selector">
              {['Top', 'Jungle', 'Mid', 'ADC', 'Support'].map(r => (
                <button key={r} className={`role-btn ${role === r ? 'active' : ''}`} onClick={() => setRole(r as any)}>{r}</button>
              ))}
            </div>
          </div>

          <div className="control-group" style={{ marginTop: '2rem' }}>
            <button className="analyze-btn" style={{ width: '100%' }} onClick={getRecommendation}>
              {loading ? 'Analyzing Draft...' : 'Generate Recommendation'}
            </button>
          </div>

        </div>

        <div className="draft-board">
          <div className="allies-col glass-panel">
            <h3>Allies</h3>
            <div className="champ-slots" style={{ alignItems: 'flex-start' }}>
              {allies.map((ally, i) => {
                const curRole = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'].filter(r => r !== role)[i];
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#999', fontWeight: 600, textTransform: 'uppercase' }}>{curRole}</div>
                    <div className={`slot ${ally ? 'filled' : 'outline'}`} onClick={() => openSelectionModal('ally', i)}>
                      {ally ? (
                        <>
                          <img src={ally.image} alt={ally.name} />
                          <span className="champ-name">{ally.name}</span>
                          <X size={16} className="absolute top-1 right-1 cursor-pointer bg-black rounded-full p-0.5" onClick={(e) => clearSlot('ally', i, e)} />
                        </>
                      ) : 'Select Ally'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="enemies-col glass-panel red-tint">
            <h3>Enemies</h3>
            <div className="champ-slots" style={{ alignItems: 'flex-start' }}>
              {enemies.map((enemy, i) => {
                const curRole = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'][i];
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#ff4d4d', fontWeight: 600, textTransform: 'uppercase' }}>{curRole}</div>
                    <div className={`slot ${enemy ? 'filled' : 'outline'}`} onClick={() => openSelectionModal('enemy', i)}>
                      {enemy ? (
                        <>
                          <img src={enemy.image} alt={enemy.name} />
                          <span className="champ-name">{enemy.name}</span>
                          <X size={16} className="absolute top-1 right-1 cursor-pointer bg-black rounded-full p-0.5" onClick={(e) => clearSlot('enemy', i, e)} />
                        </>
                      ) : 'Select Enemy'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className={`recommendation-panel glass-panel ${recommendation ? 'spark' : ''}`}>
          <h2>Optimal Recommendation</h2>

          {!recommendation ? (
            <div className="best-pick" style={{ opacity: 0.5, marginTop: '2rem' }}>
              <div className="champ-avatar">?</div>
              <div className="champ-info"><p className="hint">Awaiting draft metadata...</p></div>
            </div>
          ) : recommendation.best ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="best-pick">
              <div className="champ-avatar best">
                <img src={recommendation.best.image} alt={recommendation.best.name} />
              </div>
              <div className="champ-info">
                <h3 className="main-champ-name">{recommendation.best.name}</h3>
                <div className="tags">
                  {recommendation.best.tags.map((t: string) => <span key={t} className="tag">{t}</span>)}
                </div>
                <p className="score" style={{ marginBottom: 10, fontSize: '1.4rem' }}>Total Score: {recommendation.best.score} pts</p>
                {recommendation.best.scores && (
                  <div style={{ fontSize: '0.85rem', color: '#a3a3a3', lineHeight: '1.6' }}>
                    Draft (+{recommendation.best.scores.draftScore}) •
                    Comp (+{recommendation.best.scores.teamCompScore})<br />
                    Synergy (+{recommendation.best.scores.synergyScore}) •
                    Counters (+{recommendation.best.scores.counterScore}) •
                    Meta (+{recommendation.best.scores.metaScore})
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <p style={{ textAlign: 'center', margin: '2rem 0' }}>No viable champions found for this role/draft context.</p>
          )}

          {recommendation && recommendation.alternatives?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="alternatives mt-4">
              <h4>Top Alternatives</h4>
              <div className="alt-list">
                {recommendation.alternatives.map((alt: any) => (
                  <div key={alt.id} className="alt-card">
                    <img src={alt.image} alt={alt.name} />
                    <div className="alt-name">{alt.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#aaa' }}>{alt.score}pts</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Modal Selection */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setModalOpen(false)}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Select Champion</h3>
                <button className="close-btn" onClick={() => setModalOpen(false)}><X /></button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input autoFocus type="text" className="champ-search pl-10" placeholder="Search champion..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="champ-grid mb-2">
                {filteredChamps.map(c => (
                  <button key={c.id} className="champ-grid-item" onClick={() => selectChampion(c)}>
                    <img src={c.image} alt={c.name} loading="lazy" />
                    <span>{c.name}</span>
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
