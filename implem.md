Tive uma ideia. Considera o que achares lógico, já que foste tu quem escreveu o código. No entanto, neste momento, o teu código não garante mesmo esses 5 fatores como deve ser. Ele só dá uma aproximação muito simplificada. Por exemplo:
    •	role filtering por tags é fraco
    •	não há garantia real de que o champion pertence ao role
    •	não há scoring sério de synergy
    •	não há counter system real
    •	não há meta awareness real
    •	team comp ainda está muito superficial
Portanto, o que precisas é transformar isso num motor de scoring com regras separadas, em vez de um score += coisinhas soltas.
O que deves fazer
A recomendação final deve ser sempre algo deste género:
finalScore =
  roleScore +
  draftOrderScore +
  teamCompScore +
  synergyScore +
  counterScore +
  metaScore

Mas com uma regra importante:
1. Primeiro filtrar
Antes de dar score, tens de remover champions que não são válidos para aquele contexto.
2. Só depois pontuar
Depois de teres só picks válidas, aí sim ordenas por score.
Atualmente estás a fazer isto:
    •	assumes role com base em tags
    •	exemplo: ADC aceita Marksman e Mage
    •	então um mage estranho pode aparecer como ADC viável
    •	ou um support mage pode aparecer em spots absurdos

Isso é exatamente o problema do “não quero pedir ADC e aparecer uma cena sem sentido”.
Como corrigir isso bem
Passo 1:
faz um sistema em camadas. Idealmente seria interessante teres uma base de dados real por champion num ficheiro só teu, mas isso é irrealista e consome demasiado tempo, portanto em vez de precisares de 100% de informação manual por champion, divides o problema em 3 níveis:
nível 1 — dados automáticos
Usas o que já consegues obter automaticamente:
    •	champion name
    •	tags
    •	stats
    •	patch
    •	posição escolhida
    •	picks já feitos
    •	aliados e inimigos
nível 2 — heurísticas globais
Crias regras gerais que funcionam para muitos champions sem teres de escrever um perfil completo para cada um.
Exemplo:
    •	ADCs precisam de frontline/peel
    •	enchanters valorizam hypercarries
    •	tanks sobem se a equipa não tiver engage/frontline
    •	picks tardias valorizam counterpick
    •	equipas full AD penalizam champions AD
    •	equipas sem AP dão boost a AP
    •	equipas sem engage valorizam engage
    •	equipas sem peel valorizam peel
nível 3 — overrides manuais só para os casos importantes
Só defines dados manuais para:
    •	champions muito problemáticos
    •	flex picks
    •	picks que o sistema erra muito
    •	champions com identidade muito específica
Tipo:
    •	Yasuo
    •	Samira
    •	Nilah
    •	Ivern
    •	Senna
    •	Seraphine
    •	Gragas
    •	Poppy
    •	Kindred
    •	Kog’Maw
    •	Aphelios
    •	Kalista
    •	Lulu
    •	Orianna
    •	Jarvan IV
Ou seja: não fazes uma base de dados total. Fazes uma camada de correção para os casos onde as heurísticas automáticas não chegam.
O melhor compromisso para ti
1. garante role correctness primeiro
O mais importante para impedir recomendações absurdas é ter uma whitelist simples por role.
Não precisa de ser super profunda. Basta algo assim:
export const rolePool: Record<string, string[]> = {
  Top: ['Aatrox', 'Camille', 'Darius', 'Fiora', 'Gnar', 'Gragas', 'Jax', 'Kennen', 'Malphite', 'Ornn', 'Renekton', 'Rumble', 'Shen', 'Sion', 'Teemo', 'Urgot'],
  Jungle: ['Amumu', 'Belveth', 'Briar', 'Diana', 'Elise', 'Evelynn', 'Graves', 'Hecarim', 'Ivern', 'JarvanIV', 'Kayn', 'Kindred', 'LeeSin', 'Lillia', 'Maokai', 'Nocturne', 'Nunu', 'Poppy', 'Rammus', 'RekSai', 'Sejuani', 'Viego', 'Vi', 'Wukong', 'XinZhao', 'Zac'],
  Mid: ['Ahri', 'Akali', 'Anivia', 'Annie', 'Azir', 'Cassiopeia', 'Ekko', 'Fizz', 'Hwei', 'Kassadin', 'LeBlanc', 'Lissandra', 'Lux', 'Malzahar', 'Orianna', 'Syndra', 'Talon', 'TwistedFate', 'Veigar', 'Vex', 'Viktor', 'Yasuo', 'Yone', 'Zed', 'Zoe'],
  ADC: ['Aphelios', 'Ashe', 'Caitlyn', 'Draven', 'Ezreal', 'Jhin', 'Jinx', 'KaiSa', 'Kalista', 'KogMaw', 'Lucian', 'MissFortune', 'Nilah', 'Samira', 'Sivir', 'Tristana', 'Twitch', 'Varus', 'Vayne', 'Xayah', 'Zeri'],
  Support: ['Alistar', 'Bard', 'Blitzcrank', 'Braum', 'Janna', 'Karma', 'Leona', 'Lulu', 'Lux', 'Milio', 'Morgana', 'Nami', 'Nautilus', 'Pyke', 'Rakan', 'Rell', 'Renata', 'Senna', 'Seraphine', 'Sona', 'Soraka', 'Thresh', 'Yuumi', 'Zilean', 'Zyra']
};

Isto sozinho já resolve metade do problema.
Se pedes ADC, nunca te aparece um champion que não esteja naquele pool.
2. usa tags “funcionais”, não perfis completos
Em vez de criares 30 campos por champion, crias só meia dúzia de traits úteis.
Exemplo:

export const champArchetypes: Record<string, Partial<ChampionProfile>> = {
  Jinx: { damageType: 'AD', scaling: 3, needsPeel: true, wantsFrontline: true, archetypes: ['FrontToBack', 'Hypercarry'] },
  Samira: { damageType: 'AD', wantsEngage: true, archetypes: ['Dive', 'Snowball'] },
  Malphite: { damageType: 'AP', frontline: 3, engage: 3, archetypes: ['Engage', 'AntiAD'] },
  Poppy: { damageType: 'AD', frontline: 2, antiDive: 3, archetypes: ['Disrupt', 'AntiDash'] },
  Lulu: { damageType: 'AP', peel: 3, buffCarry: 3, archetypes: ['ProtectCarry', 'Enchanter'] },
};

Mas só para alguns champions. Os outros ficam com defaults gerados automaticamente.

o segredo: defaults inteligentes
Tu podes criar um perfil base com base em role + tags.

Exemplo:

function buildAutoProfile(champion: any, role: string) {
  const tags = champion.tags || [];

  return {
    roles: [role],
    damageType: tags.includes('Mage') ? 'AP' : 'AD',
    frontline: tags.includes('Tank') ? 2 : 0,
    engage: tags.includes('Tank') || tags.includes('Fighter') ? 1 : 0,
    peel: tags.includes('Support') ? 1 : 0,
    scaling: tags.includes('Marksman') || tags.includes('Mage') ? 2 : 1,
    earlyGame: tags.includes('Assassin') || tags.includes('Fighter') ? 2 : 1,
    safeBlind: tags.includes('Tank') || tags.includes('Mage'),
    wantsFrontline: tags.includes('Marksman'),
    wantsPeel: tags.includes('Marksman') || tags.includes('Mage'),
    wantsEngage: tags.includes('Assassin'),
  };
}

Depois, se houver override manual, faz merge:

const finalProfile = {
  ...buildAutoProfile(champion, state.role),
  ...(champArchetypes[champion.id] || {})
};

Isto é muito melhor porque:
    •	tens sistema funcional logo
    •	não precisas de preencher tudo
    •	vais refinando só onde dói
como garantir os 5 fatores sem uma base de dados gigante
1. Draft order
Isto nem precisa de dados manuais por champion. Dá para fazer com regras genéricas:
    •	early pick:
    •		•	safeBlind
    •		•	flexible/generalist champions
    •		•	picks dependentes de counter
    •	late pick:
    •		•	champions mais situacionais
    •		•	picks com alto valor de punish
2. Team composition
Também dá para fazer de forma genérica.
Analisa a tua equipa:
    •	falta AP?
    •	falta AD?
    •	falta frontline?
    •	falta engage?
    •	falta peel?
    •	falta scaling?
    •	falta early pressure?
Depois dás score ao champion conforme ele traz isso.
3. Synergy
Não precisas de mapear todas as sinergias do jogo.
Basta mapear categorias:
    •	wantsFrontline
    •	wantsPeel
    •	wantsEngage
    •	buffsCarry
    •	followsEngage
    •	pokeSynergy
    •	diveSynergy

Isso já cria resultados muito melhores.
Exemplo:
    •	Jinx + frontline/peel
    •	Samira + engage
    •	Orianna + engage
    •	Lulu + hypercarry
    •	Xerath + poke
    •	Malphite + AoE follow-up

4. Counterpicking
Também pode começar com traits globais:
    •	antiTank
    •	antiDive
    •	antiDash
    •	antiShortRange
    •	antiImmobile
    •	antiSquishy
    •	antiAD
    •	antiPoke

Não precisas de meter matchups 1v1 para toda a gente.

5. Meta awareness
Aqui é onde tens de ser pragmático.
Para MVP, faz uma destas:
    •	score manual por role para 20–40 picks relevantes
    •	ou uma tier list simples por patch

Exemplo:

export const metaTierByRole = {
  ADC: {
    Jinx: 9,
    KaiSa: 8,
    Ezreal: 7,
    Aphelios: 8,
    Samira: 6
  },
  Support: {
    Lulu: 8,
    Nautilus: 7,
    Rakan: 8,
    Milio: 7
  }
};

Não precisas de fazer isto para todos no início. Só para picks populares.

Os que não tiverem valor:

meta = 5

portanto, o plano realista é este

MVP funcional
    •	whitelist por role
    •	scoring por draft order
    •	análise de comp
    •	traits automáticas por tags
    •	small manual override layer
    •	meta score simples

sem base de dados monstruosa

Não tentas descrever cada champion como um ser humano. Só dizes o suficiente para o algoritmo não ser burro.
a arquitetura certa para ti
Faz 4 ficheiros:

rolePool.ts

quem pode aparecer em cada role

profiles.ts

função que gera perfil automático + overrides manuais

scoring.ts

funções:
    •	scoreDraftOrder
    •	scoreTeamComp
    •	scoreSynergy
    •	scoreCounter
    •	scoreMeta

recommendations.ts

orquestra tudo
o verdadeiro ponto aqui

Tu não precisas de um sistema perfeito.
Tu precisas de um sistema que:
    •	nunca recomende lixo fora do role
    •	entenda necessidades básicas da comp
    •	reaja minimamente a aliados e inimigos
    •	valorize picks fortes do patch
    •	possa ser refinado depois

Isso já parece inteligente para o utilizador.
frase-resumo

Não construas uma encyclopaedia de champions.
Constrói um motor de decisão com defaults inteligentes e exceções manuais.

Os 5 fatores, implementados corretamente

1. Draft Order Awareness
Isto não é só “se early +10, se late +counter”.
Tens de avaliar:
    •	blind pick safety
    •	flexibility
    •	punish potential
    •	counterpick value
    •	information advantage

Regra prática:
    •	picks cedo favorecem:
    •	safe blind picks
    •	flex picks
    •	champions estáveis e pouco counteráveis
    •	picks tarde favorecem:
    •	hard counters
    •	picks específicos contra comp inimiga
    •	picks que precisam de ver mais informação

Exemplo de scoring:
function scoreDraftOrder(profile: any, state: DraftState): number {
  const earlyPick = state.pickPosition <= 3;
  let score = 0;

  if (earlyPick) {
    if (profile.safeBlind) score += 20;
    if (profile.flex) score += 10;
    if (profile.weaknesses?.includes('Easily countered')) score -= 20;
  } else {
    if (profile.counterReliant) score += 15;
    if (profile.safeBlind) score += 5;
  }

  return score;
}

2. Team Composition Analysis
Isto tem de olhar para a comp atual e perceber o que falta.
Tens de analisar:
    •	AD vs AP balance
    •	frontline
    •	engage
    •	peel
    •	waveclear
    •	scaling
    •	early pressure
    •	backline access
    •	objective damage
    •	siege/poke
    •	splitpush
    •	teamfight identity
Exemplo:
Se a tua equipa tem:
    •	Jayce
    •	Nidalee
    •	Ezreal

Então provavelmente falta:
    •	frontline
    •	engage hard
    •	setup confiável

Logo, support ou top/jungle recomendados deviam subir muito se trouxerem isso.

Estrutura útil:

type TeamNeeds = {
  needsAP: boolean;
  needsAD: boolean;
  needsFrontline: boolean;
  needsEngage: boolean;
  needsPeel: boolean;
  needsScaling: boolean;
  needsEarlyGame: boolean;
};

Função:

function analyzeTeamNeeds(allies: string[]): TeamNeeds {
  let ap = 0, ad = 0, frontline = 0, engage = 0, peel = 0, scaling = 0, early = 0;

  for (const champId of allies) {
    const p = championProfiles[champId];
    if (!p) continue;

    if (p.damageType === 'AP') ap++;
    if (p.damageType === 'AD') ad++;
    if (p.style?.includes('Frontline')) frontline++;
    if (p.style?.includes('Engage')) engage++;
    if (p.style?.includes('Peel')) peel++;
    if (p.style?.includes('Scaling')) scaling++;
    if (p.style?.includes('Early')) early++;
  }

  return {
    needsAP: ap === 0,
    needsAD: ad === 0,
    needsFrontline: frontline === 0,
    needsEngage: engage === 0,
    needsPeel: peel === 0,
    needsScaling: scaling < 2,
    needsEarlyGame: early === 0
  };
}

Depois pontuas o champion conforme ele preenche essas lacunas.

3. Synergy

Synergy não é “ah, este champ tem tag mage e o outro também”.
Tens de pensar em combos funcionais.
Exemplos de synergy real:
    •	Orianna + Jarvan
    •	Yasuo + knockups
    •	Jinx + peel/frontline
    •	Kog’Maw + enchanters
    •	Miss Fortune + AoE lockdown
    •	Nilah + enchanters / engage
    •	Samira + engage
    •	Twitch + Lulu/Yuumi
    •	Aphelios + peel/frontline
Como modelar:
Cada champion deve ter tags do que oferece e do que quer receber.

{
  provides: ['Engage', 'Frontline', 'CC', 'Peel'],
  wants: ['Peel', 'Frontline'],
}

Exemplo de função:

function scoreSynergy(profile: any, allies: string[]): number {
  let score = 0;

  for (const allyId of allies) {
    const ally = championProfiles[allyId];
    if (!ally) continue;

    for (const need of profile.wants || []) {
      if (ally.provides?.includes(need)) score += 8;
    }

    for (const offer of profile.provides || []) {
      if (ally.wants?.includes(offer)) score += 8;
    }
  }

  return score;
}

Isto já começa a parecer uma engine de verdade.

4. Counter Picking

Aqui tens mesmo de separar:
    •	lane counter
    •	comp counter
    •	anti-carry
    •	anti-engage
    •	anti-tank
    •	anti-dive
    •	range advantage
    •	mobility punishment

Porque uma pick pode não counterar lane, mas counterar a comp toda.

Exemplo:
    •	Poppy contra dash-heavy comp
    •	Malphite contra full AD / low magic damage
    •	Rammus contra comp AD auto-attack
    •	Janna contra dive
    •	Braum contra projéteis
    •	Vayne contra tanks
    •	Xerath contra low engage pokeable comp

Estrutura útil:

{
  counters: ['Dash', 'ShortRange', 'LowMobility', 'TankStack'],
  weakInto: ['LongRangePoke', 'HeavyDisengage']
}

Função:

function scoreCounters(profile: any, enemies: string[]): number {
  let score = 0;

  for (const enemyId of enemies) {
    const enemy = championProfiles[enemyId];
    if (!enemy) continue;

    for (const c of profile.counters || []) {
      if (enemy.traits?.includes(c)) score += 10;
    }

    for (const w of profile.weakInto || []) {
      if (enemy.traits?.includes(w)) score -= 10;
    }
  }

  return score;
}


5. Meta Awareness

Aqui é importante seres honesto contigo: neste momento não tens meta awareness real.

Porque meta awareness implica dados externos ou uma base tua atualizada.
Semi-automático

Buscar estatísticas por patch e role:
    •	win rate
    •	pick rate
    •	ban rate
    •	pro presence

e transformar isso num score.

Porque o melhor pick em competitivo nem sempre é o melhor em ranked.

Exemplo simples:

function scoreMeta(profile: any): number {
  return (profile.metaScore || 5) * 3;
}

Como impedir picks absurdas por role

Este ponto é obrigatório.

Em vez de usar tags, filtra por roles reais:

function getRoleViableChampions(role: string, picked: Set<string>) {
  return Object.entries(championProfiles)
    .filter(([id, profile]) => {
      if (picked.has(id)) return false;
      return profile.roles.includes(role);
    })
    .map(([id]) => champions[id]);
}

Assim:
    •	se pedes ADC, só aparecem ADCs
    •	se queres Mid, só aparecem mids
    •	se quiseres flex picks, podes permitir roles.includes(role)

Estrutura ideal da recomendação

Em vez de tudo numa função gigante, faz assim:

export function getRecommendation(state: DraftState) {
  const picked = new Set([...state.allies, ...state.enemies]);

  const viable = Object.values(champions).filter((c: any) => {
    const profile = championProfiles[c.id];
    if (!profile) return false;
    if (picked.has(c.id)) return false;
    return profile.roles.includes(state.role);
  });

  const scored = viable.map((c: any) => {
    const profile = championProfiles[c.id];
    const needs = analyzeTeamNeeds(state.allies);

    const roleScore = 100; // because already role-valid
    const draftScore = scoreDraftOrder(profile, state);
    const teamCompScore = scoreTeamComp(profile, needs);
    const synergyScore = scoreSynergy(profile, state.allies);
    const counterScore = scoreCounters(profile, state.enemies);
    const metaScore = scoreMeta(profile);

    const total =
      roleScore +
      draftScore +
      teamCompScore +
      synergyScore +
      counterScore +
      metaScore;

    return {
      id: c.id,
      name: c.name,
      image: `https://ddragon.leagueoflegends.com/cdn/${latestPatch}/img/champion/${c.image.full}`,
      tags: c.tags,
      scores: {
        roleScore,
        draftScore,
        teamCompScore,
        synergyScore,
        counterScore,
        metaScore
      },
      score: total
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return {
    best: scored[0],
    alternatives: scored.slice(1, 4)
  };
}


Atenção: Isto é o que eu reparei no teu projeto e sugestões minhas. Tem de funcionar como estou a pedir, mas não tens necessariamente de fazer exatamente do modo que disse; são apenas sugestões.
Dito isto, mãos à obra e: don’t stop until its finished.
