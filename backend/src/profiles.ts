export interface ChampionProfile {
  roles: string[];
  damageType: 'AP' | 'AD' | 'Mixed';
  frontline: number;
  engage: number;
  peel: number;
  scaling: number;
  earlyGame: number;
  safeBlind: boolean;
  flex: boolean;
  counterReliant: boolean;
  provides: string[];
  wants: string[];
  counters: string[];
  hardCounters: string[];
  weakInto: string[];
  hardWeakInto: string[];
  weaknesses: string[];
  metaScore: number;
  style: string[];
  traits: string[];
}

// Static snapshot, roughly models patch 16.6 metadata defaults
const metaTierMap: Record<string, number> = {
  Jinx: 9, Ahri: 8, LeeSin: 9, Aatrox: 8, Kaisa: 10, Nautilus: 9, Thresh: 8, Viego: 8,
  Sylas: 8, Yone: 9, Yasuo: 7, Jhin: 8, Ezreal: 9, Ashe: 8,
  Darius: 7, Garen: 7, Hecarim: 6, Lux: 7, Karma: 7, Rakan: 7,
  Teemo: 3, Shaco: 3, Yuumi: 2, Ryze: 3, Azir: 4,
  Aurora: 9, Smolder: 8, Ambessa: 8, Skarner: 7, Rell: 8,
};

export const champArchetypes: Record<string, Partial<ChampionProfile>> = {
  Aatrox: { 'provides': ['Frontline'], 'wants': ['Engage', 'CC'], 'style': ['Skirmish', 'Frontline'], 'traits': ['DrainTank'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['Burst'] },
  Ahri: { 'provides': ['CC'], 'wants': ['Engage', 'Frontline'], 'style': ['Pick', 'Skirmish'], 'traits': ['Mobility'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Akali: { 'provides': [], 'wants': ['Engage', 'Frontline'], 'style': ['Skirmish'], 'traits': ['Dive', 'Mobility'], 'safeBlind': false, 'counterReliant': true },
  Akshan: { 'provides': ['Damage'], 'wants': ['Frontline', 'CC'], 'style': ['Skirmish', 'Pick'], 'traits': ['Roam'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Alistar: { 'provides': ['Engage', 'Frontline', 'CC', 'Peel'], 'wants': ['Damage'], 'style': ['Engage', 'Frontline', 'Peel'], 'traits': ['Tank'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Engage'], 'hardWeakInto': ['AntiTank', 'TrueDamage', 'Poke', 'Artillery'] },
  Amumu: { 'provides': ['Engage', 'Frontline', 'CC'], 'wants': ['Damage'], 'style': ['Engage', 'Frontline'], 'traits': ['Tank'], 'safeBlind': false, 'counterReliant': false, 'hardWeakInto': ['AntiTank', 'TrueDamage'] },
  Anivia: { 'provides': ['CC', 'Zone'], 'wants': ['Frontline'], 'style': ['Scaling', 'Zone'], 'traits': ['Immobile', 'AP'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['Dive', 'Pick'] },
  Annie: { 'provides': ['CC', 'Engage'], 'wants': ['Frontline'], 'style': ['Burst', 'Engage'], 'traits': ['Immobile', 'AP'], 'safeBlind': true, 'counterReliant': false },
  Aphelios: { 'provides': ['Damage', 'CC'], 'wants': ['Peel', 'Frontline'], 'style': ['Scaling'], 'traits': ['Hypercarry', 'Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['Dive', 'Pick'] },
  Ashe: { 'provides': ['CC', 'Engage'], 'wants': ['Peel', 'Frontline'], 'style': ['Utility', 'Scaling'], 'traits': ['Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['Dive', 'Pick'] },
  AurelionSol: { 'provides': ['Zone', 'Scaling'], 'wants': ['Peel', 'Frontline'], 'style': ['Scaling', 'Zone'], 'traits': ['Immobile', 'AP'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['Dive', 'Pick'] },
  Azir: { 'provides': ['Damage', 'Engage', 'Zone'], 'wants': ['Frontline'], 'style': ['Scaling'], 'traits': ['Hypercarry', 'AP'], 'safeBlind': true, 'counterReliant': false },
  Bard: { 'provides': ['CC', 'Pick', 'Peel'], 'wants': ['Damage'], 'style': ['Pick', 'Roam'], 'traits': ['Enchanter'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy', 'Dive', 'Engage'], 'hardWeakInto': ['Tank', 'Teamfight', 'Poke', 'Artillery'] },
  Belveth: { 'provides': ['Damage'], 'wants': ['Engage', 'CC'], 'style': ['Skirmish', 'Scaling'], 'traits': ['Dive'], 'safeBlind': false, 'counterReliant': false },
  Blitzcrank: { 'provides': ['Pick', 'CC'], 'wants': ['Damage'], 'style': ['Pick'], 'traits': ['Tank'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['AntiTank', 'TrueDamage', 'Tank', 'Teamfight'] },
  Brand: { 'provides': ['Damage', 'AOE'], 'wants': ['Frontline', 'CC'], 'style': ['Burst', 'Scaling'], 'traits': ['Immobile', 'AP'], 'safeBlind': false, 'counterReliant': false, 'hardWeakInto': ['Dive', 'Pick'] },
  Braum: { 'provides': ['Peel', 'Frontline', 'CC'], 'wants': ['Damage'], 'style': ['Peel', 'Frontline'], 'traits': ['AntiPoke'], 'safeBlind': true, 'counterReliant': true, 'hardCounters': ['Dive', 'Engage'], 'hardWeakInto': ['Poke', 'Artillery'] },
  Briar: { 'provides': ['Engage', 'Damage'], 'wants': ['CC'], 'style': ['Skirmish', 'Dive'], 'traits': ['DrainTank'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Immobile', 'Artillery'], 'hardWeakInto': ['Peel', 'AntiDive', 'Burst'] },
  Caitlyn: { 'provides': ['Zone'], 'wants': ['Peel', 'CC'], 'style': ['Poke', 'Zone'], 'traits': ['Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Juggernaut', 'Immobile'], 'hardWeakInto': ['Dive', 'Engage'] },
  Camille: { 'provides': ['Engage', 'Pick'], 'wants': ['Frontline'], 'style': ['Pick', 'Skirmish'], 'traits': ['Dive', 'Mobility'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Cassiopeia: { 'provides': ['Damage', 'Zone', 'CC'], 'wants': ['Frontline', 'Peel'], 'style': ['Scaling'], 'traits': ['Immobile', 'AP', 'Hypercarry'], 'safeBlind': false, 'counterReliant': true, 'hardWeakInto': ['Dive', 'Pick'] },
  Chogath: { 'provides': ['Frontline', 'CC'], 'wants': ['Engage'], 'style': ['Frontline', 'Scaling'], 'traits': ['Tank', 'Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['AntiTank', 'TrueDamage'] },
  Corki: { 'provides': ['Damage', 'Poke'], 'wants': ['Frontline'], 'style': ['Poke', 'Scaling'], 'traits': ['Mixed'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Juggernaut', 'Immobile'], 'hardWeakInto': ['Dive', 'Engage'] },
  Darius: { 'provides': ['Damage', 'Frontline'], 'wants': ['Engage', 'CC'], 'style': ['Skirmish', 'Frontline'], 'traits': ['Immobile', 'Juggernaut'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Dive', 'Melee'], 'hardWeakInto': ['Poke', 'Range'] },
  Diana: { 'provides': ['Engage', 'Damage'], 'wants': ['Frontline', 'CC'], 'style': ['Dive', 'Engage'], 'traits': ['AP', 'Mobility'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Artillery'], 'hardWeakInto': ['Peel', 'AntiDive'] },
  Draven: { 'provides': ['Damage'], 'wants': ['Engage', 'Peel', 'CC'], 'style': ['Early', 'Snowball'], 'traits': ['Immobile'], 'safeBlind': false, 'counterReliant': true },
  Ekko: { 'provides': ['Damage', 'Pick'], 'wants': ['Engage'], 'style': ['Skirmish', 'Pick'], 'traits': ['AP', 'Mobility'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Elise: { 'provides': ['Pick', 'Damage'], 'wants': ['CC'], 'style': ['Early', 'Pick'], 'traits': ['AP', 'Dive'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Evelynn: { 'provides': ['Pick', 'Damage'], 'wants': ['Engage', 'Frontline'], 'style': ['Pick', 'Scaling'], 'traits': ['AP', 'Stealth'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Ezreal: { 'provides': ['Poke', 'Damage'], 'wants': ['Engage'], 'style': ['Poke', 'Safety'], 'traits': ['Mobility'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Juggernaut', 'Immobile'], 'hardWeakInto': ['Dive', 'Engage'] },
  Fiddlesticks: { 'provides': ['Engage', 'CC', 'AOE'], 'wants': ['Frontline'], 'style': ['Engage'], 'traits': ['AP'], 'safeBlind': true, 'counterReliant': false },
  Fiora: { 'provides': ['Damage'], 'wants': ['Engage'], 'style': ['Splitpush', 'Skirmish'], 'traits': ['Mobility', 'TrueDamage'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Tank', 'Juggernaut'] },
  Fizz: { 'provides': ['Pick'], 'wants': ['Engage'], 'style': ['Pick', 'Skirmish'], 'traits': ['AP', 'Mobility', 'Dive'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Galio: { 'provides': ['Engage', 'Frontline', 'CC', 'Peel'], 'wants': ['Dive'], 'style': ['Engage', 'Frontline', 'Peel'], 'traits': ['AntiAP', 'Tank', 'Roam'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['AP', 'Dive', 'Engage'], 'hardWeakInto': ['AD', 'AntiTank', 'TrueDamage', 'Poke', 'Artillery'] },
  Garen: { 'provides': ['Frontline', 'Damage'], 'wants': ['Engage', 'CC'], 'style': ['Frontline', 'Skirmish'], 'traits': ['Immobile', 'Juggernaut'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Melee'], 'hardWeakInto': ['Poke', 'Range'] },
  Gnar: { 'provides': ['Engage', 'Frontline', 'CC'], 'wants': ['Damage'], 'style': ['Frontline', 'Engage', 'Poke'], 'traits': ['Range'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Juggernaut', 'Immobile'], 'hardWeakInto': ['Dive', 'Engage'] },
  Gragas: { 'provides': ['Peel', 'Engage', 'Frontline', 'CC'], 'wants': ['Damage'], 'style': ['Frontline', 'Peel', 'Poke'], 'traits': ['AP'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Juggernaut', 'Immobile', 'Dive', 'Engage'], 'hardWeakInto': ['Dive', 'Engage', 'Poke', 'Artillery'] },
  Graves: { 'provides': ['Damage', 'Frontline'], 'wants': ['CC', 'Engage'], 'style': ['Skirmish', 'Scaling'], 'traits': ['Ranged'], 'safeBlind': true, 'counterReliant': false },
  Gwen: { 'provides': ['Damage'], 'wants': ['Engage', 'CC'], 'style': ['Skirmish', 'Scaling'], 'traits': ['AP', 'AntiTank'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Tank', 'Juggernaut'], 'hardWeakInto': ['Burst'] },
  Hecarim: { 'provides': ['Engage', 'Damage', 'Frontline'], 'wants': ['CC'], 'style': ['Engage', 'Dive'], 'traits': ['Mobility', 'DrainTank'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Artillery'], 'hardWeakInto': ['Peel', 'AntiDive', 'Burst'] },
  Heimerdinger: { 'provides': ['Zone', 'Damage'], 'wants': ['Peel', 'Frontline'], 'style': ['Zone', 'Poke'], 'traits': ['Immobile', 'AP'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Juggernaut', 'Immobile'], 'hardWeakInto': ['Dive', 'Engage'] },
  Hwei: { 'provides': ['Poke', 'CC', 'Zone'], 'wants': ['Frontline', 'Peel'], 'style': ['Poke', 'Zone', 'Scaling'], 'traits': ['Immobile', 'AP'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Juggernaut', 'Immobile'], 'hardWeakInto': ['Dive', 'Pick', 'Engage'] },
  Illaoi: { 'provides': ['Zone', 'Damage'], 'wants': ['Engage'], 'style': ['Zone', 'Frontline', 'Skirmish'], 'traits': ['Juggernaut', 'Immobile'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Dive', 'Melee'], 'hardWeakInto': ['Poke', 'Range'] },
  Irelia: { 'provides': ['Damage', 'Engage'], 'wants': ['Frontline'], 'style': ['Skirmish', 'Dive'], 'traits': ['Mobility'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Immobile', 'Artillery'], 'hardWeakInto': ['Peel', 'AntiDive'] },
  Ivern: { 'provides': ['Peel', 'Frontline'], 'wants': ['Frontline', 'Damage'], 'style': ['Peel', 'Utility'], 'traits': ['Enchanter'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Engage'], 'hardWeakInto': ['Pick', 'Zone'] },
  Janna: { 'provides': ['Peel', 'CC'], 'wants': ['Damage', 'Frontline'], 'style': ['Peel'], 'traits': ['Enchanter', 'AntiEngage'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Engage'], 'hardWeakInto': ['Pick', 'Zone'] },
  JarvanIV: { 'provides': ['Engage', 'Frontline', 'CC'], 'wants': ['Damage'], 'style': ['Engage', 'Frontline', 'Early'], 'traits': ['Mobility'], 'safeBlind': true, 'counterReliant': false },
  Jax: { 'provides': ['Damage', 'Frontline'], 'wants': ['Engage'], 'style': ['Skirmish', 'Splitpush'], 'traits': ['Mobility', 'AntiAutoAttack'], 'safeBlind': false, 'counterReliant': true },
  Jayce: { 'provides': ['Poke', 'Damage'], 'wants': ['Frontline', 'CC'], 'style': ['Poke', 'Skirmish'], 'traits': ['Early'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Juggernaut', 'Immobile'], 'hardWeakInto': ['Dive', 'Engage'] },
  Jhin: { 'provides': ['Pick', 'Poke'], 'wants': ['Frontline', 'Peel'], 'style': ['Utility', 'Pick'], 'traits': ['Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Jinx: { 'provides': ['Damage', 'Scaling'], 'wants': ['Peel', 'Frontline'], 'style': ['Scaling'], 'traits': ['Hypercarry', 'Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['Dive', 'Pick'] },
  KSante: { 'provides': ['Frontline', 'Peel', 'Engage'], 'wants': ['Damage'], 'style': ['Frontline', 'Skirmish', 'Peel'], 'traits': ['Tank'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Engage'], 'hardWeakInto': ['AntiTank', 'TrueDamage', 'Poke', 'Artillery'] },
  Kaisa: { 'provides': ['Damage', 'Dive'], 'wants': ['Engage', 'CC'], 'style': ['Dive', 'Scaling'], 'traits': ['Hypercarry', 'Mobility'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Artillery'], 'hardWeakInto': ['Peel', 'AntiDive'] },
  Kalista: { 'provides': ['Objective', 'Engage'], 'wants': ['Peel', 'CC'], 'style': ['Early', 'Skirmish'], 'traits': ['Mobility'], 'safeBlind': false, 'counterReliant': true },
  Karma: { 'provides': ['Peel', 'Poke'], 'wants': ['Frontline', 'Damage'], 'style': ['Peel', 'Poke'], 'traits': ['Enchanter', 'Early'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Juggernaut', 'Immobile', 'Dive', 'Engage'], 'hardWeakInto': ['Dive', 'Engage', 'Poke', 'Artillery'] },
  Karthus: { 'provides': ['Damage', 'AOE'], 'wants': ['Frontline', 'CC'], 'style': ['Scaling'], 'traits': ['AP', 'Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['Dive', 'Pick'] },
  Kassadin: { 'provides': ['Damage'], 'wants': ['Engage', 'Frontline'], 'style': ['Scaling'], 'traits': ['AP', 'Mobility', 'AntiAP'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['AP', 'Mage'], 'hardWeakInto': ['AD', 'Marksman'] },
  Katarina: { 'provides': ['Damage'], 'wants': ['Engage', 'CC'], 'style': ['Skirmish', 'Reset'], 'traits': ['AP', 'Mobility'], 'safeBlind': false, 'counterReliant': true },
  Kayn: { 'provides': ['Damage'], 'wants': ['CC'], 'style': ['Skirmish', 'Dive'], 'traits': ['Mobility'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Artillery'], 'hardWeakInto': ['Peel', 'AntiDive'] },
  Kennen: { 'provides': ['Engage', 'CC', 'AOE'], 'wants': ['Frontline'], 'style': ['Engage', 'Skirmish'], 'traits': ['AP', 'Mobility'], 'safeBlind': true, 'counterReliant': false },
  Khazix: { 'provides': ['Damage', 'Pick'], 'wants': ['Frontline', 'Engage'], 'style': ['Pick', 'Skirmish'], 'traits': ['Mobility'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Kindred: { 'provides': ['Damage', 'Objective'], 'wants': ['Frontline', 'CC'], 'style': ['Scaling', 'Skirmish'], 'traits': ['Ranged'], 'safeBlind': true, 'counterReliant': false },
  Kled: { 'provides': ['Engage', 'Frontline'], 'wants': ['Damage'], 'style': ['Engage', 'Skirmish'], 'traits': ['Dive'], 'safeBlind': true, 'counterReliant': false },
  KogMaw: { 'provides': ['Damage'], 'wants': ['Peel', 'Frontline'], 'style': ['Scaling', 'Poke'], 'traits': ['Hypercarry', 'Immobile', 'Mixed'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Juggernaut', 'Immobile'], 'hardWeakInto': ['Dive', 'Pick', 'Engage'] },
  Leblanc: { 'provides': ['Pick', 'Damage'], 'wants': ['Frontline', 'Engage'], 'style': ['Pick', 'Early'], 'traits': ['AP', 'Mobility'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  LeeSin: { 'provides': ['Pick', 'Early'], 'wants': ['CC'], 'style': ['Early', 'Skirmish'], 'traits': ['Mobility'], 'safeBlind': true, 'counterReliant': false },
  Leona: { 'provides': ['Engage', 'Frontline', 'CC'], 'wants': ['Damage'], 'style': ['Engage', 'Frontline'], 'traits': ['Tank'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['AntiTank', 'TrueDamage'] },
  Lillia: { 'provides': ['Damage', 'Engage', 'CC'], 'wants': ['Frontline'], 'style': ['Skirmish', 'Scaling'], 'traits': ['AP', 'Mobility'], 'safeBlind': true, 'counterReliant': false },
  Lissandra: { 'provides': ['Engage', 'CC', 'Peel'], 'wants': ['Damage'], 'style': ['Engage', 'Pick'], 'traits': ['AP', 'AntiDive'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Mobility', 'Immobile', 'Squishy'], 'hardWeakInto': ['Poke', 'Zone', 'Tank', 'Teamfight'] },
  Lucian: { 'provides': ['Damage', 'Skirmish'], 'wants': ['Engage', 'Peel', 'CC'], 'style': ['Early', 'Skirmish'], 'traits': ['Mobility'], 'safeBlind': true, 'counterReliant': false },
  Lulu: { 'provides': ['Peel'], 'wants': ['Hypercarry', 'Frontline'], 'style': ['Peel'], 'traits': ['Enchanter', 'AntiDive'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Mobility', 'Engage'], 'hardWeakInto': ['Pick', 'Zone'] },
  Lux: { 'provides': ['Pick', 'Poke', 'CC'], 'wants': ['Frontline'], 'style': ['Poke', 'Pick'], 'traits': ['Immobile', 'AP'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Juggernaut', 'Immobile', 'Squishy'], 'hardWeakInto': ['Dive', 'Engage', 'Tank', 'Teamfight'] },
  Malphite: { 'provides': ['Engage', 'Frontline', 'CC'], 'wants': ['Damage'], 'style': ['Engage', 'Frontline'], 'traits': ['AntiAD', 'Tank'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['AD', 'Marksman'], 'hardWeakInto': ['AP', 'TrueDamage', 'AntiTank'] },
  Malzahar: { 'provides': ['Pick', 'CC', 'Peel'], 'wants': ['Frontline'], 'style': ['Pick', 'Scaling'], 'traits': ['Immobile', 'AP', 'AntiMobility'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Dive', 'Pick', 'Tank', 'Teamfight'] },
  Maokai: { 'provides': ['Engage', 'Frontline', 'CC', 'Peel'], 'wants': ['Damage'], 'style': ['Engage', 'Frontline', 'Peel'], 'traits': ['Tank'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Engage'], 'hardWeakInto': ['AntiTank', 'TrueDamage', 'Poke', 'Artillery'] },
  MasterYi: { 'provides': ['Damage'], 'wants': ['Engage', 'Peel', 'CC'], 'style': ['Scaling', 'Skirmish'], 'traits': ['Hypercarry', 'Mobility'], 'safeBlind': false, 'counterReliant': true },
  Milio: { 'provides': ['Peel'], 'wants': ['Frontline', 'Damage'], 'style': ['Peel'], 'traits': ['Enchanter', 'AntiEngage'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Engage'], 'hardWeakInto': ['Pick', 'Zone'] },
  MissFortune: { 'provides': ['Damage', 'AOE'], 'wants': ['Engage', 'CC', 'Frontline'], 'style': ['Utility', 'Early'], 'traits': ['Immobile'], 'safeBlind': true, 'counterReliant': false },
  MonkeyKing: { 'provides': ['Engage', 'Frontline', 'CC'], 'wants': ['Damage'], 'style': ['Engage', 'Skirmish'], 'traits': ['Dive'], 'safeBlind': true, 'counterReliant': false },
  Mordekaiser: { 'provides': ['Frontline', 'Damage'], 'wants': ['Engage', 'CC'], 'style': ['Frontline', 'Skirmish'], 'traits': ['AP', 'Immobile', 'Juggernaut'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Melee'], 'hardWeakInto': ['Poke', 'Range'] },
  Morgana: { 'provides': ['Peel', 'CC', 'Pick'], 'wants': ['Frontline'], 'style': ['Peel', 'Pick'], 'traits': ['AP', 'AntiCC'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy', 'Dive', 'Engage'], 'hardWeakInto': ['Tank', 'Teamfight', 'Poke', 'Artillery'] },
  Naafiri: { 'provides': ['Damage', 'Dive'], 'wants': ['Engage'], 'style': ['Skirmish', 'Pick'], 'traits': ['Mobility'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Nami: { 'provides': ['Peel', 'Sustain', 'CC'], 'wants': ['Damage', 'Frontline'], 'style': ['Peel', 'Utility'], 'traits': ['Enchanter'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Engage'], 'hardWeakInto': ['Pick', 'Zone'] },
  Nasus: { 'provides': ['Frontline', 'Scaling'], 'wants': ['Engage'], 'style': ['Scaling', 'Splitpush'], 'traits': ['Immobile', 'Juggernaut'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Dive', 'Melee'], 'hardWeakInto': ['Dive', 'Pick', 'Poke', 'Range'] },
  Nautilus: { 'provides': ['Engage', 'Frontline', 'CC', 'Peel'], 'wants': ['Damage'], 'style': ['Engage', 'Frontline'], 'traits': ['Tank'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['AntiTank', 'TrueDamage', 'Tank', 'Teamfight'] },
  Neeko: { 'provides': ['Engage', 'CC', 'AOE'], 'wants': ['Frontline'], 'style': ['Engage', 'Pick'], 'traits': ['AP'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Nidalee: { 'provides': ['Poke', 'Early'], 'wants': ['CC', 'Engage'], 'style': ['Poke', 'Early'], 'traits': ['AP', 'Mobility'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Juggernaut', 'Immobile'], 'hardWeakInto': ['Dive', 'Engage'] },
  Nilah: { 'provides': ['Damage'], 'wants': ['Engage', 'Peel', 'CC'], 'style': ['Skirmish', 'Scaling'], 'traits': ['Dive'], 'safeBlind': false, 'counterReliant': true },
  Nocturne: { 'provides': ['Dive', 'Engage'], 'wants': ['Frontline'], 'style': ['Dive', 'Pick'], 'traits': ['Global'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Artillery', 'Squishy'], 'hardWeakInto': ['Peel', 'AntiDive', 'Tank', 'Teamfight'] },
  Nunu: { 'provides': ['Objective', 'Peel', 'Frontline'], 'wants': ['Damage'], 'style': ['Frontline', 'Utility'], 'traits': ['Tank'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['AntiTank', 'TrueDamage'] },
  Olaf: { 'provides': ['Damage', 'Frontline'], 'wants': ['Engage'], 'style': ['Early', 'Skirmish'], 'traits': ['AntiCC', 'Juggernaut'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Melee'], 'hardWeakInto': ['Poke', 'Range'] },
  Orianna: { 'provides': ['Peel', 'CC', 'AOE'], 'wants': ['Engage', 'Frontline'], 'style': ['Scaling', 'Utility'], 'traits': ['AP', 'Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['Dive', 'Pick'] },
  Ornn: { 'provides': ['Engage', 'Frontline', 'CC', 'Scaling'], 'wants': ['Damage'], 'style': ['Engage', 'Frontline'], 'traits': ['Tank', 'Upgrade'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['AntiTank', 'TrueDamage'] },
  Pantheon: { 'provides': ['Pick', 'Early'], 'wants': ['Damage', 'Frontline'], 'style': ['Pick', 'Early'], 'traits': ['Global', 'Dive'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Poppy: { 'provides': ['Peel', 'Frontline', 'CC'], 'wants': ['Damage'], 'style': ['Peel', 'Frontline'], 'traits': ['AntiDash', 'Tank'], 'safeBlind': true, 'counterReliant': true, 'hardCounters': ['Dive', 'Mobility', 'Engage'], 'hardWeakInto': ['Poke', 'Zone', 'AntiTank', 'TrueDamage', 'Artillery'] },
  Pyke: { 'provides': ['Pick', 'Damage'], 'wants': ['Frontline'], 'style': ['Pick', 'Roam'], 'traits': ['Mobility'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Qiyana: { 'provides': ['Damage', 'Engage', 'CC'], 'wants': ['Frontline'], 'style': ['Skirmish', 'Pick'], 'traits': ['Mobility'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Quinn: { 'provides': ['Damage'], 'wants': ['Frontline', 'Engage'], 'style': ['Splitpush', 'Roam'], 'traits': ['Ranged'], 'safeBlind': false, 'counterReliant': true },
  Rakan: { 'provides': ['Engage', 'CC', 'Peel'], 'wants': ['Frontline', 'Damage'], 'style': ['Engage', 'Peel'], 'traits': ['Mobility'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Engage'], 'hardWeakInto': ['Poke', 'Artillery'] },
  Rammus: { 'provides': ['Engage', 'Frontline', 'CC'], 'wants': ['Damage'], 'style': ['Engage', 'Frontline'], 'traits': ['Tank', 'AntiAD'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['AD', 'Marksman'], 'hardWeakInto': ['AP', 'TrueDamage', 'AntiTank'] },
  RekSai: { 'provides': ['Pick', 'Frontline', 'Early'], 'wants': ['Damage'], 'style': ['Pick', 'Skirmish'], 'traits': ['Mobility'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Rell: { 'provides': ['Engage', 'Frontline', 'CC'], 'wants': ['Damage'], 'style': ['Engage', 'Frontline'], 'traits': ['Tank'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['AntiTank', 'TrueDamage'] },
  Renata: { 'provides': ['Peel', 'CC'], 'wants': ['Frontline'], 'style': ['Peel'], 'traits': ['Enchanter', 'AntiEngage'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Engage'], 'hardWeakInto': ['Poke', 'Artillery'] },
  Renekton: { 'provides': ['Cleanse', 'Early', 'Frontline'], 'wants': ['Scaling'], 'style': ['Early', 'Skirmish'], 'traits': ['Diver'], 'safeBlind': true, 'counterReliant': false },
  Rengar: { 'provides': ['Damage', 'Pick'], 'wants': ['Engage', 'Frontline'], 'style': ['Pick', 'Skirmish'], 'traits': ['Dive'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Riven: { 'provides': ['Damage'], 'wants': ['Engage'], 'style': ['Skirmish', 'Snowball'], 'traits': ['Mobility'], 'safeBlind': true, 'counterReliant': false },
  Rumble: { 'provides': ['Damage', 'AOE', 'Engage'], 'wants': ['CC'], 'style': ['Skirmish', 'Teamfight'], 'traits': ['AP'], 'safeBlind': true, 'counterReliant': false },
  Ryze: { 'provides': ['Damage', 'Scaling'], 'wants': ['Frontline', 'Peel'], 'style': ['Scaling', 'Splitpush'], 'traits': ['AP', 'Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['Dive', 'Pick'] },
  Samira: { 'provides': ['Damage', 'Reset'], 'wants': ['Engage', 'CC'], 'style': ['Skirmish', 'Early'], 'traits': ['Dive'], 'safeBlind': false, 'counterReliant': true },
  Sejuani: { 'provides': ['Engage', 'Frontline', 'CC'], 'wants': ['Melee', 'Damage'], 'style': ['Engage', 'Frontline'], 'traits': ['Tank'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['AntiTank', 'TrueDamage'] },
  Senna: { 'provides': ['Damage', 'Scaling', 'Sustain'], 'wants': ['Frontline', 'Peel'], 'style': ['Scaling'], 'traits': ['Ranged'], 'safeBlind': true, 'counterReliant': false },
  Seraphine: { 'provides': ['AOE', 'Sustain', 'CC'], 'wants': ['Frontline'], 'style': ['Utility', 'Teamfight'], 'traits': ['Enchanter', 'AP'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Engage'], 'hardWeakInto': ['Poke', 'Artillery'] },
  Sett: { 'provides': ['Frontline', 'Damage', 'Engage'], 'wants': ['CC'], 'style': ['Frontline', 'Skirmish'], 'traits': ['Juggernaut', 'Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Melee'], 'hardWeakInto': ['Poke', 'Range'] },
  Shaco: { 'provides': ['Pick'], 'wants': ['Frontline'], 'style': ['Pick', 'Early'], 'traits': ['Stealth'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Shen: { 'provides': ['Peel', 'Frontline', 'Global'], 'wants': ['Damage'], 'style': ['Frontline', 'Peel'], 'traits': ['Tank'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Engage'], 'hardWeakInto': ['AntiTank', 'TrueDamage', 'Poke', 'Artillery'] },
  Shyvana: { 'provides': ['Damage', 'Frontline'], 'wants': ['CC', 'Engage'], 'style': ['Scaling', 'Skirmish'], 'traits': ['AP', 'Juggernaut'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Melee'], 'hardWeakInto': ['Poke', 'Range'] },
  Singed: { 'provides': ['Frontline', 'Zone'], 'wants': ['Damage'], 'style': ['Frontline', 'Splitpush'], 'traits': ['AP', 'Tank', 'Mobility'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['AntiTank', 'TrueDamage'] },
  Sion: { 'provides': ['Frontline', 'Engage', 'CC'], 'wants': ['Damage'], 'style': ['Frontline', 'Engage', 'Scaling'], 'traits': ['Tank'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['AntiTank', 'TrueDamage'] },
  Sivir: { 'provides': ['Waveclear', 'Utility'], 'wants': ['Frontline'], 'style': ['Scaling', 'Teamfight'], 'traits': ['Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['Dive', 'Pick'] },
  Skarner: { 'provides': ['Pick', 'Frontline', 'CC'], 'wants': ['Damage'], 'style': ['Pick', 'Frontline'], 'traits': ['Tank'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['AntiTank', 'TrueDamage', 'Tank', 'Teamfight'] },
  Smolder: { 'provides': ['Damage', 'Scaling'], 'wants': ['Peel', 'Frontline'], 'style': ['Scaling', 'Poke'], 'traits': ['Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Juggernaut', 'Immobile'], 'hardWeakInto': ['Dive', 'Pick', 'Engage'] },
  Sona: { 'provides': ['Sustain', 'Peel', 'Utility'], 'wants': ['Frontline'], 'style': ['Scaling', 'Utility'], 'traits': ['Enchanter'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Engage'], 'hardWeakInto': ['Pick', 'Zone', 'Early'] },
  Soraka: { 'provides': ['Sustain', 'Peel'], 'wants': ['Frontline'], 'style': ['Utility', 'Peel'], 'traits': ['Enchanter', 'Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Engage'], 'hardWeakInto': ['Pick', 'Zone', 'Early'] },
  Swain: { 'provides': ['Frontline', 'Damage', 'Zone'], 'wants': ['Engage'], 'style': ['Teamfight', 'Frontline'], 'traits': ['AP', 'DrainTank', 'Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['Burst'] },
  Sylas: { 'provides': ['Damage', 'Dive'], 'wants': ['Engage'], 'style': ['Skirmish', 'Scaling'], 'traits': ['AP', 'Mobility'], 'safeBlind': true, 'counterReliant': false },
  Syndra: { 'provides': ['Pick', 'Damage', 'CC'], 'wants': ['Frontline', 'Peel'], 'style': ['Burst', 'Pick'], 'traits': ['AP', 'Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  TahmKench: { 'provides': ['Peel', 'Frontline'], 'wants': ['Damage'], 'style': ['Peel', 'Frontline'], 'traits': ['Tank'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Engage'], 'hardWeakInto': ['AntiTank', 'TrueDamage', 'Poke', 'Artillery'] },
  Taliyah: { 'provides': ['Zone', 'Damage', 'Global'], 'wants': ['Frontline', 'CC'], 'style': ['Zone', 'Roam', 'Scaling'], 'traits': ['AP'], 'safeBlind': true, 'counterReliant': false },
  Talon: { 'provides': ['Pick', 'Roam'], 'wants': ['Frontline', 'Engage'], 'style': ['Pick', 'Early'], 'traits': ['Mobility'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Taric: { 'provides': ['Peel', 'Frontline', 'Sustain'], 'wants': ['Damage'], 'style': ['Peel', 'Teamfight'], 'traits': ['Enchanter', 'Tank'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Dive', 'Engage'], 'hardWeakInto': ['AntiTank', 'TrueDamage', 'Poke', 'Artillery'] },
  Teemo: { 'provides': ['Zone', 'Damage'], 'wants': ['Frontline', 'Engage'], 'style': ['Zone', 'Splitpush'], 'traits': ['AP', 'Immobile'], 'safeBlind': false, 'counterReliant': true },
  Thresh: { 'provides': ['Peel', 'Pick', 'CC'], 'wants': ['Damage'], 'style': ['Peel', 'Pick'], 'traits': ['Tank', 'Utility'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy', 'Dive', 'Engage'], 'hardWeakInto': ['AntiTank', 'TrueDamage', 'Tank', 'Teamfight', 'Poke', 'Artillery'] },
  Tristana: { 'provides': ['Damage', 'TowerDamage'], 'wants': ['Peel', 'Frontline'], 'style': ['Scaling'], 'traits': ['Mobility'], 'safeBlind': true, 'counterReliant': false },
  Trundle: { 'provides': ['Frontline', 'TowerDamage'], 'wants': ['Engage'], 'style': ['Splitpush', 'Frontline'], 'traits': ['AntiTank', 'Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Tank', 'Juggernaut'], 'hardWeakInto': ['Burst'] },
  Tryndamere: { 'provides': ['Damage', 'TowerDamage'], 'wants': ['Engage', 'CC'], 'style': ['Splitpush', 'Skirmish'], 'traits': ['Mobility'], 'safeBlind': false, 'counterReliant': true },
  TwistedFate: { 'provides': ['Pick', 'Global', 'CC'], 'wants': ['Frontline', 'Damage'], 'style': ['Pick', 'Roam'], 'traits': ['AP', 'Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Twitch: { 'provides': ['Damage', 'Pick'], 'wants': ['Peel', 'Frontline'], 'style': ['Scaling', 'Teamfight'], 'traits': ['Stealth', 'Hypercarry', 'Immobile'], 'safeBlind': false, 'counterReliant': true, 'hardWeakInto': ['Dive', 'Pick'] },
  Udyr: { 'provides': ['Frontline', 'Damage', 'Objective'], 'wants': ['Engage', 'CC'], 'style': ['Skirmish', 'FastClear'], 'traits': ['Juggernaut', 'Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Melee'], 'hardWeakInto': ['Poke', 'Range'] },
  Urgot: { 'provides': ['Damage', 'Frontline'], 'wants': ['Engage'], 'style': ['Skirmish', 'Frontline'], 'traits': ['Juggernaut', 'Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Melee'], 'hardWeakInto': ['Poke', 'Range'] },
  Varus: { 'provides': ['Pick', 'Damage'], 'wants': ['Peel', 'Frontline'], 'style': ['Poke', 'Pick'], 'traits': ['Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Juggernaut', 'Immobile', 'Squishy'], 'hardWeakInto': ['Dive', 'Engage', 'Tank', 'Teamfight'] },
  Vayne: { 'provides': ['Damage'], 'wants': ['Peel'], 'style': ['Scaling', 'Skirmish'], 'traits': ['Hypercarry', 'AntiTank'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Tank', 'Juggernaut'], 'hardWeakInto': ['Burst'] },
  Veigar: { 'provides': ['Damage', 'Zone', 'Scaling'], 'wants': ['Peel', 'Frontline'], 'style': ['Scaling', 'Zone'], 'traits': ['AP', 'Immobile'], 'safeBlind': false, 'counterReliant': true, 'hardWeakInto': ['Dive', 'Pick'] },
  Velkoz: { 'provides': ['Damage', 'Poke'], 'wants': ['Peel', 'Frontline'], 'style': ['Poke', 'Teamfight'], 'traits': ['AP', 'Immobile', 'TrueDamage'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Juggernaut', 'Immobile'], 'hardWeakInto': ['Dive', 'Engage'] },
  Vex: { 'provides': ['Engage', 'Damage', 'CC'], 'wants': ['Frontline'], 'style': ['Burst', 'Engage'], 'traits': ['AP', 'AntiDash'], 'safeBlind': true, 'counterReliant': true, 'hardCounters': ['Dive', 'Mobility'], 'hardWeakInto': ['Poke', 'Zone'] },
  Vi: { 'provides': ['Engage', 'Pick', 'Frontline'], 'wants': ['Damage'], 'style': ['Engage', 'Pick'], 'traits': ['Dive'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Viego: { 'provides': ['Damage', 'Reset'], 'wants': ['Engage', 'CC'], 'style': ['Skirmish', 'Teamfight'], 'traits': ['Dive'], 'safeBlind': true, 'counterReliant': false },
  Viktor: { 'provides': ['Damage', 'Zone', 'Scaling'], 'wants': ['Peel', 'Frontline'], 'style': ['Scaling', 'Zone'], 'traits': ['AP', 'Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['Dive', 'Pick'] },
  Vladimir: { 'provides': ['Damage', 'AOE', 'Scaling'], 'wants': ['Engage', 'CC'], 'style': ['Scaling', 'Teamfight'], 'traits': ['AP', 'DrainTank'], 'safeBlind': false, 'counterReliant': true, 'hardWeakInto': ['Burst'] },
  Volibear: { 'provides': ['Frontline', 'Damage', 'TowerDive'], 'wants': ['Engage', 'CC'], 'style': ['Frontline', 'Skirmish'], 'traits': ['Juggernaut'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Melee'], 'hardWeakInto': ['Poke', 'Range'] },
  Warwick: { 'provides': ['Frontline', 'Objective'], 'wants': ['Damage'], 'style': ['Skirmish'], 'traits': ['DrainTank'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight', 'Burst'] },
  Xayah: { 'provides': ['Damage', 'Peel'], 'wants': ['Engage', 'CC'], 'style': ['Scaling', 'Zone'], 'traits': ['AntiDive', 'Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Mobility'], 'hardWeakInto': ['Poke', 'Zone', 'Dive', 'Pick'] },
  Xerath: { 'provides': ['Damage', 'Poke'], 'wants': ['Peel', 'Frontline'], 'style': ['Poke', 'Scaling'], 'traits': ['AP', 'Immobile'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Juggernaut', 'Immobile'], 'hardWeakInto': ['Dive', 'Pick', 'Engage'] },
  XinZhao: { 'provides': ['Early', 'Pick', 'Frontline'], 'wants': ['CC'], 'style': ['Early', 'Skirmish'], 'traits': ['Dive'], 'safeBlind': true, 'counterReliant': false },
  Yasuo: { 'provides': ['Damage', 'Windwall'], 'wants': ['Knockup', 'Engage', 'CC'], 'style': ['Skirmish', 'Scaling'], 'traits': ['Mobility'], 'safeBlind': false, 'counterReliant': true },
  Yone: { 'provides': ['Damage', 'Engage', 'Scaling'], 'wants': ['Engage', 'Frontline'], 'style': ['Skirmish', 'Scaling'], 'traits': ['Mobility'], 'safeBlind': true, 'counterReliant': false },
  Yorick: { 'provides': ['TowerDamage', 'Frontline'], 'wants': ['Engage'], 'style': ['Splitpush'], 'traits': ['Juggernaut', 'Immobile'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Dive', 'Melee'], 'hardWeakInto': ['Poke', 'Range'] },
  Yuumi: { 'provides': ['Peel', 'Sustain'], 'wants': ['Damage', 'Frontline'], 'style': ['Utility', 'Scaling'], 'traits': ['Enchanter'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Engage'], 'hardWeakInto': ['Pick', 'Zone', 'Early'] },
  Zac: { 'provides': ['Engage', 'Frontline', 'CC'], 'wants': ['Damage'], 'style': ['Engage', 'Frontline'], 'traits': ['Tank', 'Mobility'], 'safeBlind': true, 'counterReliant': false, 'hardWeakInto': ['AntiTank', 'TrueDamage'] },
  Zed: { 'provides': ['Pick', 'Damage'], 'wants': ['Frontline', 'Engage'], 'style': ['Pick', 'Early'], 'traits': ['Mobility'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Immobile', 'Squishy'], 'hardWeakInto': ['Tank', 'Teamfight'] },
  Zeri: { 'provides': ['Damage', 'Scaling'], 'wants': ['Peel', 'Frontline'], 'style': ['Scaling', 'Teamfight'], 'traits': ['Mobility', 'Hypercarry'], 'safeBlind': true, 'counterReliant': false },
  Ziggs: { 'provides': ['Damage', 'TowerDamage', 'Poke'], 'wants': ['Peel', 'Frontline'], 'style': ['Poke', 'Zone'], 'traits': ['AP', 'Immobile'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Juggernaut', 'Immobile'], 'hardWeakInto': ['Dive', 'Engage'] },
  Zilean: { 'provides': ['Peel', 'Utility', 'Revive'], 'wants': ['Damage', 'Frontline'], 'style': ['Utility', 'Peel'], 'traits': ['Enchanter'], 'safeBlind': true, 'counterReliant': false, 'hardCounters': ['Dive', 'Engage'], 'hardWeakInto': ['Poke', 'Artillery'] },
  Zoe: { 'provides': ['Pick', 'Poke'], 'wants': ['Frontline'], 'style': ['Poke', 'Pick'], 'traits': ['AP', 'Immobile'], 'safeBlind': false, 'counterReliant': true, 'hardCounters': ['Juggernaut', 'Immobile', 'Squishy'], 'hardWeakInto': ['Dive', 'Engage', 'Tank', 'Teamfight'] },
  Zyra: { 'provides': ['Damage', 'Zone', 'CC'], 'wants': ['Frontline'], 'style': ['Zone', 'Teamfight'], 'traits': ['AP', 'Immobile'], 'safeBlind': true, 'counterReliant': false },
};

export function buildAutoProfile(champion: any, role: string): ChampionProfile {
  const tags: string[] = champion.tags || [];

  let damageType: 'AP' | 'AD' | 'Mixed' = 'Mixed';
  if (tags.includes('Mage')) {
    damageType = 'AP';
  } else if (['Diana', 'Gragas', 'Galio', 'Amumu', 'Maokai', 'Singed', 'Mordekaiser', 'Gwen', 'Sylas', 'Akali', 'Katarina', 'Evelynn', 'Elise', 'Nidalee', 'Zac', 'Sejuani', 'Nunu', 'Fiddlesticks', 'Karthus', 'Fizz', 'Lillia', 'Ekko', 'Kennen', 'Rumble', 'Teemo'].includes(champion.id)) {
    damageType = 'AP';
  } else if (tags.includes('Marksman') || tags.includes('Assassin') || tags.includes('Fighter')) {
    damageType = 'AD';
  }

  const profile: ChampionProfile = {
    roles: [role],
    damageType,
    frontline: tags.includes('Tank') ? 2 : (tags.includes('Fighter') ? 1 : 0),
    engage: tags.includes('Tank') || tags.includes('Fighter') ? 1 : 0,
    peel: tags.includes('Support') ? 2 : (tags.includes('Tank') ? 1 : 0),
    scaling: tags.includes('Marksman') || tags.includes('Mage') ? 2 : 1,
    earlyGame: tags.includes('Assassin') || tags.includes('Fighter') ? 2 : 1,
    safeBlind: tags.includes('Tank') || ['Orianna', 'Ahri', 'Karma'].includes(champion.id),
    flex: false,
    counterReliant: tags.includes('Assassin'),
    provides: [],
    wants: [],
    counters: [],
    hardCounters: [],
    weakInto: [],
    hardWeakInto: [],
    weaknesses: [],
    metaScore: metaTierMap[champion.id] ?? 5,
    style: [],
    traits: []
  };

  // Populate implicit synergetic wants directly based on tags
  if (tags.includes('Marksman') || tags.includes('Mage')) profile.wants.push('Frontline');
  if (tags.includes('Marksman')) profile.wants.push('Peel');
  if (tags.includes('Assassin') || tags.includes('Fighter')) profile.wants.push('Engage');

  if (tags.includes('Tank')) {
    profile.style.push('Frontline', 'Engage');
    profile.provides.push('Frontline', 'Engage');
  }
  if (tags.includes('Fighter')) {
    profile.style.push('Skirmish');
    profile.provides.push('Engage');
  }
  if (tags.includes('Mage')) {
    profile.style.push('Scaling');
    profile.traits.push('AP');
  }
  if (tags.includes('Marksman')) {
    profile.style.push('Scaling');
  }
  if (tags.includes('Support')) {
    profile.style.push('Peel');
    profile.provides.push('Peel');
  }
  if (tags.includes('Assassin')) {
    profile.style.push('Early');
    profile.traits.push('Dive');
    profile.wants.push('Engage');
    profile.counters.push('Immobile', 'Mage', 'Marksman');
    profile.weakInto.push('Tank', 'Frontline', 'Peel');
  }

  if (tags.includes('Tank') || tags.includes('Support')) {
    profile.provides.push('CC');
  }

  if (tags.includes('Mage')) {
    profile.provides.push('CC');
    profile.traits.push('Immobile');
  }

  if (tags.includes('Marksman')) {
    profile.weakInto.push('Assassin', 'Dive');
    profile.counters.push('Tank');
    profile.traits.push('Immobile');
  }

  return profile;
}

export function getProfile(champion: any, role: string): ChampionProfile {
  const base = buildAutoProfile(champion, role);
  const override = champArchetypes[champion.id] || {};
  return {
    ...base,
    ...override,
    provides: [...new Set([...base.provides, ...(override.provides || [])])],
    wants: [...new Set([...base.wants, ...(override.wants || [])])],
    style: [...new Set([...base.style, ...(override.style || [])])],
    traits: [...new Set([...base.traits, ...(override.traits || [])])],
    counters: [...new Set([...base.counters, ...(override.counters || [])])],
    hardCounters: [...new Set([...base.hardCounters, ...(override.hardCounters || [])])],
    weakInto: [...new Set([...base.weakInto, ...(override.weakInto || [])])],
    hardWeakInto: [...new Set([...base.hardWeakInto, ...(override.hardWeakInto || [])])],
    weaknesses: [...new Set([...base.weaknesses, ...(override.weaknesses || [])])]
  };
}