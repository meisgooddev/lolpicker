"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreDraftOrder = scoreDraftOrder;
exports.detectCompIdentity = detectCompIdentity;
exports.analyzeTeamNeeds = analyzeTeamNeeds;
exports.scoreTeamComp = scoreTeamComp;
exports.scoreSynergy = scoreSynergy;
exports.scoreCounters = scoreCounters;
exports.analyzeTemporalProfile = analyzeTemporalProfile;
exports.scoreTemporalFit = scoreTemporalFit;
exports.scoreMeta = scoreMeta;
exports.scoreOpggMeta = scoreOpggMeta;
exports.analyzeExecutionComplexity = analyzeExecutionComplexity;
exports.scoreExecutionReliability = scoreExecutionReliability;
exports.scorePlayerAffinity = scorePlayerAffinity;
const profiles_js_1 = require("./profiles.js");
function hasCounterMatch(profile, enemies, champions, enemyRoles) {
    for (const enemyId of enemies) {
        const c = champions[enemyId];
        if (!c)
            continue;
        const enemy = (0, profiles_js_1.getProfile)(c, enemyRoles[enemyId] || 'Unknown');
        for (const counter of profile.counters || []) {
            if (enemy.traits?.includes(counter) || enemy.style?.includes(counter) || enemy.damageType === counter) {
                return true;
            }
        }
    }
    return false;
}
function scoreDraftOrder(profile, state, champions) {
    let score = 0;
    const isRedSide = state.side === 'red';
    const pickPosition = state.allies.length + state.enemies.length + 1;
    const remainingEnemyPicks = 5 - state.enemies.length;
    if (pickPosition <= 3) {
        // Early pick (1-3)
        if (profile.safeBlind)
            score += 20;
        if (profile.flex)
            score += 10;
        // Information hiding: Ambiguous picks actively hide comp identity and waste enemy bans/counters
        if (profile.flexAmbiguity)
            score += profile.flexAmbiguity * 1.5;
        // Active Information / Telegraphed Intent:
        // We avoid counting 'wants' directly to prevent annotation-bias.
        // Instead, we identify strictly dependent archetypes that box the rest of the draft.
        let telegraphPenalty = 0;
        if (profile.traits?.includes('Hypercarry'))
            telegraphPenalty += 15; // Demands Peel/Protect
        if (profile.style?.includes('Protect'))
            telegraphPenalty += 10; // Handshakes a scaling core
        if (profile.style?.includes('Early'))
            telegraphPenalty += 10; // Forces aggressive early mapping
        if (profile.traits?.includes('Immobile') && profile.damageType === 'AD')
            telegraphPenalty += 10; // Highly vulnerable without structure
        score -= telegraphPenalty;
        if (profile.weaknesses?.includes('Easily countered') || profile.counterReliant)
            score -= 20;
    }
    else if (pickPosition <= 7) {
        // Mid pick (4-7)
        if (profile.safeBlind)
            score += 5;
        if (profile.flexAmbiguity)
            score += profile.flexAmbiguity * 0.5; // Still some value
    }
    else {
        // Late pick (8-10)
        const countersEnemy = hasCounterMatch(profile, state.enemies, champions, state.enemyRoles);
        if (profile.counterReliant && countersEnemy)
            score += 15;
        if (profile.safeBlind)
            score += 5;
        // Red side counter-pick advantage
        if (isRedSide && pickPosition === 10) {
            if (profile.counterReliant && countersEnemy)
                score += 15;
        }
    }
    if (profile.counterReliant && remainingEnemyPicks > 0) {
        score -= remainingEnemyPicks * 5;
    }
    return score;
}
function detectCompIdentity(allies, champions, allyRoles) {
    let scores = { Dive: 0, Teamfight: 0, Poke: 0, SplitPush: 0, Protect: 0, Unknown: 0 };
    let totalPoints = 0;
    for (const champId of allies) {
        const c = champions[champId];
        if (!c)
            continue;
        const p = (0, profiles_js_1.getProfile)(c, allyRoles[champId] || 'Unknown');
        let pointsAdded = 0;
        if (p.traits?.includes('Dive') || p.style?.includes('Dive')) {
            scores.Dive++;
            pointsAdded++;
        }
        if (p.style?.includes('Frontline') || p.style?.includes('Teamfight')) {
            scores.Teamfight++;
            pointsAdded++;
        }
        if (p.style?.includes('Poke') || p.style?.includes('Zone')) {
            scores.Poke++;
            pointsAdded++;
        }
        if (p.style?.includes('Splitpush')) {
            scores.SplitPush++;
            pointsAdded++;
        }
        if (p.style?.includes('Peel') || p.traits?.includes('Enchanter')) {
            scores.Protect++;
            pointsAdded++;
        }
        if (pointsAdded > 0)
            totalPoints++; // Count champions contributing to an identity
    }
    let maxScore = 0;
    let dominant = 'Unknown';
    for (const [key, val] of Object.entries(scores)) {
        if (val > maxScore) {
            maxScore = val;
            dominant = key;
        }
    }
    // Coherence: the commitment to the dominant strategic line.
    // 1.0 means all picks contribute to the same direction.
    const coherence = totalPoints > 0 ? (maxScore / totalPoints) : 0;
    return { scores, dominant, coherence, totalPoints };
}
function analyzeTeamNeeds(allies, champions, allyRoles) {
    let ap = 0, ad = 0, frontline = 0, engage = 0, peel = 0, scaling = 0, early = 0;
    for (const champId of allies) {
        const c = champions[champId];
        if (!c)
            continue;
        const actualRole = allyRoles[champId] || 'Unknown';
        const p = (0, profiles_js_1.getProfile)(c, actualRole);
        // Consider intensities or partial contributions
        if (p.damageType === 'AP')
            ap++;
        if (p.damageType === 'AD')
            ad++;
        if (p.style?.includes('Frontline'))
            frontline++;
        if (p.style?.includes('Engage') || p.provides.includes('Engage'))
            engage++;
        if (p.style?.includes('Peel') || p.provides.includes('Peel'))
            peel++;
        if (p.style?.includes('Scaling'))
            scaling++;
        if (p.style?.includes('Early'))
            early++;
    }
    const identityState = detectCompIdentity(allies, champions, allyRoles);
    let targetAP = 2, targetAD = 2;
    let targetFrontline = 1.5, targetEngage = 1.5, targetPeel = 1.5, targetScaling = 2, targetEarly = 1.5;
    switch (identityState.dominant) {
        case 'Dive':
            targetEngage = 2;
            targetFrontline = 1;
            targetPeel = 0.5;
            break;
        case 'Protect':
            targetPeel = 2;
            targetFrontline = 1;
            targetEngage = 0.5;
            break;
        case 'Poke':
            targetPeel = 2;
            targetFrontline = 1;
            targetEngage = 0.5;
            targetScaling = 2.5;
            break;
        case 'SplitPush':
            targetFrontline = 1;
            targetEngage = 1;
            targetPeel = 1;
            break;
        case 'Teamfight':
            targetFrontline = 2;
            targetEngage = 1.5;
            targetPeel = 1;
            break;
    }
    return {
        stats: { ap, ad, frontline, engage, peel, scaling, early },
        needsAP: targetAP - ap,
        needsAD: targetAD - ad,
        needsFrontline: targetFrontline - frontline,
        needsEngage: targetEngage - engage,
        needsPeel: targetPeel - peel,
        needsScaling: targetScaling - scaling,
        needsEarlyGame: targetEarly - early,
        identityState
    };
}
function scoreTeamComp(profile, needs) {
    let score = 0;
    // Continuous contribution based on intensity of need
    // if needsAP is mathematically negative, adding another AP subtracts score
    if (profile.damageType === 'AP')
        score += needs.needsAP * 12;
    if (profile.damageType === 'AD')
        score += needs.needsAD * 12;
    if (profile.style.includes('Frontline'))
        score += needs.needsFrontline * 20;
    if (profile.style.includes('Engage') || profile.provides.includes('Engage'))
        score += needs.needsEngage * 15;
    if (profile.provides.includes('Peel'))
        score += needs.needsPeel * 15;
    if (profile.style.includes('Scaling'))
        score += needs.needsScaling * 10;
    if (profile.style.includes('Early'))
        score += needs.needsEarlyGame * 10;
    // Evaluate dynamic comp cohesion: assess the fragmentation cost or reinforcement value
    if (needs.identityState && needs.identityState.dominant !== 'Unknown' && needs.identityState.totalPoints >= 2) {
        const dom = needs.identityState.dominant;
        let reinforces = false;
        if (dom === 'Dive' && (profile.traits?.includes('Dive') || profile.style?.includes('Dive')))
            reinforces = true;
        else if (dom === 'Teamfight' && (profile.style?.includes('Frontline') || profile.style?.includes('Teamfight')))
            reinforces = true;
        else if (dom === 'Poke' && (profile.style?.includes('Poke') || profile.style?.includes('Zone')))
            reinforces = true;
        else if (dom === 'SplitPush' && profile.style?.includes('Splitpush'))
            reinforces = true;
        else if (dom === 'Protect' && (profile.style?.includes('Peel') || profile.traits?.includes('Enchanter')))
            reinforces = true;
        // Strategic commitment score
        const coherence = needs.identityState.coherence;
        if (reinforces) {
            // Reward keeping an established coherent comp
            score += 20 * coherence;
        }
        else {
            // Cost to pivot / fragmenting penalty (scales non-linearly, but capped to avoid astronomically useless bounds)
            // Changing direction at pick 4 is far more devastating strategically than at pick 2
            const rawFragment = 15 * Math.pow(needs.identityState.totalPoints, 1.5) * coherence;
            score -= Math.min(75, rawFragment); // Caps realistic fragmentation penalty safely before external normalization
        }
    }
    // Removed explicit overriding penalties to avoid distortion, mathematical continuous deficit properly handles anti-synergy
    // Soft cap normalization
    if (score > 0) {
        score = 70 * (1 - Math.exp(-score / 35));
    }
    else if (score < 0) {
        score = -70 * (1 - Math.exp(score / 35));
    }
    return score;
}
function scoreSynergy(profile, allies, champions, allyRoles) {
    let score = 0;
    let providedCount = {};
    let wantedCount = {};
    for (const allyId of allies) {
        const c = champions[allyId];
        if (!c)
            continue;
        // Explicit Role mapping!
        const actualRole = allyRoles[allyId] || 'Unknown';
        const ally = (0, profiles_js_1.getProfile)(c, actualRole);
        for (const need of profile.wants || []) {
            if (ally.provides?.includes(need) || ally.style?.includes(need)) {
                providedCount[need] = (providedCount[need] || 0) + 1;
                score += providedCount[need] === 1 ? 8 : 3;
            }
        }
        for (const offer of profile.provides || []) {
            if (ally.wants?.includes(offer)) {
                wantedCount[offer] = (wantedCount[offer] || 0) + 1;
                score += wantedCount[offer] === 1 ? 8 : 3;
            }
        }
    }
    return score;
}
function scoreCounters(profile, enemies, champions, enemyRoles, opggEnemyData = []) {
    let score = 0;
    let hasRealData = false;
    // ── Layer 1: Real matchup data from OP.GG MCP ──────────────────────────
    // Win rates from thousands of games are the strongest signal.
    // Confidence-weighted by sqrt(sample_size / 500), capped at 1.0.
    // Minimum sample gate: 100 games (below this, the data is noise).
    for (const enemyData of opggEnemyData) {
        if (!enemyData)
            continue;
        // Our candidate appears in the enemy's STRONG counters → we have advantage
        const strongMatch = enemyData.strong_counters.find(c => c.champion_id.toString() === profile.id || c.champion_name === profile.name);
        if (strongMatch && strongMatch.play >= 100) {
            const confidence = Math.min(1.0, Math.sqrt(strongMatch.play / 500));
            const delta = (strongMatch.win_rate - 0.5) * 100;
            score += delta * 1.5 * confidence;
            hasRealData = true;
        }
        // Our candidate appears in the enemy's WEAK counters → we're disadvantaged
        const weakMatch = enemyData.weak_counters.find(c => c.champion_id.toString() === profile.id || c.champion_name === profile.name);
        if (weakMatch && weakMatch.play >= 100) {
            const confidence = Math.min(1.0, Math.sqrt(weakMatch.play / 500));
            const delta = (weakMatch.win_rate - 0.5) * 100;
            score -= delta * 1.5 * confidence;
            hasRealData = true;
        }
    }
    // Clamp MCP contribution so it can't dominate the entire score alone
    score = Math.max(-20, Math.min(20, score));
    // ── Layer 2: Trait-based heuristic counters ────────────────────────────
    // When real data exists, reduce heuristic weight to 40%.
    const heuristicScale = hasRealData ? 0.4 : 1.0;
    for (const enemyId of enemies) {
        const c = champions[enemyId];
        if (!c)
            continue;
        const actualRole = enemyRoles[enemyId] || 'Unknown';
        const enemy = (0, profiles_js_1.getProfile)(c, actualRole);
        let matchedCounter = false;
        let matchedHardCounter = false;
        let matchedWeak = false;
        let matchedHardWeak = false;
        for (const counter of profile.counters || []) {
            if (!matchedCounter && (enemy.traits?.includes(counter) || enemy.style?.includes(counter) || enemy.damageType === counter)) {
                score += 5 * heuristicScale;
                matchedCounter = true;
            }
        }
        for (const hCounter of profile.hardCounters || []) {
            if (!matchedHardCounter && (enemy.traits?.includes(hCounter) || enemy.style?.includes(hCounter) || enemy.damageType === hCounter)) {
                score += 15 * heuristicScale;
                matchedHardCounter = true;
            }
        }
        for (const w of profile.weakInto || []) {
            if (!matchedWeak && (enemy.traits?.includes(w) || enemy.style?.includes(w) || enemy.damageType === w)) {
                score -= 5 * heuristicScale;
                matchedWeak = true;
            }
        }
        for (const hw of profile.hardWeakInto || []) {
            if (!matchedHardWeak && (enemy.traits?.includes(hw) || enemy.style?.includes(hw) || enemy.damageType === hw)) {
                score -= 15 * heuristicScale;
                matchedHardWeak = true;
            }
        }
    }
    // ── Layer 3: Cross-comp damage profile awareness ───────────────────────
    // "Malphite into 3 AD" is a systemic multiplier, not just a 1v1 matchup.
    // Count the enemy comp's damage profile and reward/punish accordingly.
    if (enemies.length >= 2) {
        let enemyAD = 0, enemyAP = 0;
        for (const enemyId of enemies) {
            const c = champions[enemyId];
            if (!c)
                continue;
            const ep = (0, profiles_js_1.getProfile)(c, enemyRoles[enemyId] || 'Unknown');
            if (ep.damageType === 'AD')
                enemyAD++;
            else if (ep.damageType === 'AP')
                enemyAP++;
        }
        // AntiAD picks into heavy AD comps (e.g. Malphite/Rammus into 3+ AD)
        if (profile.traits?.includes('AntiAD') && enemyAD >= 3) {
            score += 10 + (enemyAD - 2) * 5; // +15 for 3AD, +20 for 4AD, +25 for 5AD
        }
        // AntiAP picks into heavy AP comps (e.g. Galio/Kassadin into 3+ AP)
        if (profile.traits?.includes('AntiAP') && enemyAP >= 3) {
            score += 10 + (enemyAP - 2) * 5;
        }
        // AntiTank picks into heavy tank comps (e.g. Vayne/Fiora)
        let enemyTanks = 0;
        for (const enemyId of enemies) {
            const c = champions[enemyId];
            if (!c)
                continue;
            const ep = (0, profiles_js_1.getProfile)(c, enemyRoles[enemyId] || 'Unknown');
            if (ep.traits?.includes('Tank') || ep.traits?.includes('Juggernaut') || ep.style?.includes('Frontline')) {
                enemyTanks++;
            }
        }
        if (profile.traits?.includes('AntiTank') && enemyTanks >= 2) {
            score += 8 + (enemyTanks - 1) * 4;
        }
        if (profile.traits?.includes('TrueDamage') && enemyTanks >= 2) {
            score += 6 + (enemyTanks - 1) * 3;
        }
        // Penalty: pure AD/AP into a comp that stacks armour/MR
        if (profile.damageType === 'AD' && enemyTanks >= 2 && !profile.traits?.includes('TrueDamage') && !profile.traits?.includes('AntiTank')) {
            score -= 5 * enemyTanks; // Gets harder to carry as more tanks appear
        }
    }
    // ── Layer 4: Systemic enemy identity countering ────────────────────────
    // Evaluate the entire enemy comp as a systemic win-condition to invalidate.
    if (enemies.length >= 2) {
        const enemyIdentity = detectCompIdentity(enemies, champions, enemyRoles);
        if (enemyIdentity.dominant !== 'Unknown' && enemyIdentity.coherence >= 0.4) {
            const dom = enemyIdentity.dominant;
            const c = enemyIdentity.coherence;
            if (dom === 'Dive' && (profile.traits?.includes('AntiDive') || profile.style?.includes('Protect') || profile.provides?.includes('Peel') || profile.style?.includes('Zone'))) {
                score += 25 * c;
            }
            else if (dom === 'Poke' && (profile.style?.includes('Engage') || profile.traits?.includes('Dive') || profile.provides?.includes('Engage'))) {
                score += 25 * c;
            }
            else if (dom === 'Teamfight' && (profile.style?.includes('SplitPush') || profile.traits?.includes('Pick') || profile.style?.includes('Poke') || profile.style?.includes('Zone'))) {
                score += 20 * c;
            }
            else if (dom === 'SplitPush' && (profile.traits?.includes('Global') || profile.style?.includes('Engage') || profile.style?.includes('Pick') || profile.traits?.includes('Mobility'))) {
                score += 20 * c;
            }
            else if (dom === 'Protect' && (profile.traits?.includes('Dive') || profile.style?.includes('Poke') || profile.traits?.includes('Artillery'))) {
                score += 20 * c;
            }
        }
    }
    return score;
}
function analyzeTemporalProfile(allies, champions, allyRoles) {
    let early = 0, mid = 0, late = 0, flex = 0;
    for (const champId of allies) {
        const c = champions[champId];
        if (!c)
            continue;
        const p = (0, profiles_js_1.getProfile)(c, allyRoles[champId] || 'Unknown');
        const phase = p.peakPhase ?? 'flex';
        if (phase === 'early')
            early++;
        else if (phase === 'mid')
            mid++;
        else if (phase === 'late')
            late++;
        else
            flex++;
    }
    // Intended timing: whichever non-flex phase dominates; flex doesn't drive intent.
    const phaseScores = { early, mid, late };
    let max = 0;
    let intendedTiming = 'mid'; // sensible default
    for (const [k, v] of Object.entries(phaseScores)) {
        if (v > max) {
            max = v;
            intendedTiming = k;
        }
    }
    // If no phase has more than 1 champion yet, comp timing is undeclared → default mid
    if (max <= 1 && allies.length <= 2)
        intendedTiming = 'mid';
    return { early, mid, late, flex, intendedTiming };
}
function scoreTemporalFit(profile, temporal, allies) {
    if (allies.length === 0)
        return 0; // no context yet, don't influence
    const candidatePhase = profile.peakPhase ?? 'flex';
    const { early, mid, late, intendedTiming } = temporal;
    const total = allies.length;
    let score = 0;
    // flex picks are always temporally acceptable
    if (candidatePhase === 'flex')
        return 5;
    // Alignment bonus: matches the comp's intended timing
    if (candidatePhase === intendedTiming) {
        score += 15;
    }
    // ── Structural safety rules ──────────────────────────────────────────────
    // A comp with no early presence at pick 4+ is likely to lose before
    // their scaling picks come online.  Reward picks that plug this gap.
    const hasNoEarlyPresence = early === 0 && total >= 3;
    if (hasNoEarlyPresence && candidatePhase === 'early') {
        score += 20; // urgently needed
    }
    if (hasNoEarlyPresence && candidatePhase === 'late') {
        score -= 15; // doubles down on the structural problem
    }
    // A comp full of late picks and no early anchor is dangerous.
    // Diminishing returns for stacking the same phase.
    if (candidatePhase === 'late' && late >= 2) {
        score -= (late - 1) * 12; // -12 for 3rd late, -24 for 4th, etc.
    }
    if (candidatePhase === 'early' && early >= 2) {
        score -= (early - 1) * 8; // diminishing but less severe — early is easier to trade
    }
    // ── Timing coherence ────────────────────────────────────────────────────
    // If the comp clearly wants to play late and we add an early pick at pick 5,
    // that early champion will be irrelevant when the comp peaks.
    if (intendedTiming === 'late' && candidatePhase === 'early' && total >= 3) {
        score -= 10; // misaligned timing
    }
    if (intendedTiming === 'early' && candidatePhase === 'late' && total >= 3) {
        score -= 10;
    }
    return score;
}
function scoreMeta(profile) {
    return (profile.metaScore - 5) * 5;
}
function scoreOpggMeta(profile, laneMetaMap) {
    if (!laneMetaMap)
        return 0;
    const entry = laneMetaMap[profile.name] || laneMetaMap[profile.id];
    if (!entry)
        return 0;
    // RIP champions get a flat penalty
    if (entry.is_rip)
        return -15;
    let score = 0;
    // Tier bonus: OP(1) → +15, Strong(2) → +8, Good(3) → +2, Average(4) → 0, Weak(5) → -10
    const tierBonus = { 1: 15, 2: 8, 3: 2, 4: 0, 5: -10 };
    score += tierBonus[entry.tier] ?? 0;
    // Win rate deviation adds a continuous signal on top of the tier bucket
    const wrDelta = (entry.win_rate - 0.5) * 40; // ±2 for each 5% WR deviation
    score += wrDelta;
    return score;
}
function analyzeExecutionComplexity(allies, champions, allyRoles) {
    let hardExecutionSpecs = 0;
    let anchors = 0;
    for (const champId of allies) {
        const c = champions[champId];
        if (!c)
            continue;
        const p = (0, profiles_js_1.getProfile)(c, allyRoles[champId] || 'Unknown');
        // Hard Execution: Highly punishable, rigid positioning requirements, or macro heavy
        if (p.traits?.includes('Hypercarry') || p.style?.includes('Splitpush') || p.style?.includes('Poke') || p.traits?.includes('Artillery')) {
            hardExecutionSpecs++;
        }
        // Easy execution (Anchors): Forgiving, sets the terms of engagement
        if (p.style?.includes('Engage') || p.style?.includes('Frontline') || p.traits?.includes('Tank')) {
            anchors++;
        }
    }
    return { hardExecutionSpecs, anchors };
}
function scoreExecutionReliability(profile, execProfile, allies) {
    const isAnchor = profile.style?.includes('Engage') || profile.style?.includes('Frontline') || profile.traits?.includes('Tank');
    const isHard = profile.traits?.includes('Hypercarry') || profile.style?.includes('Splitpush') || profile.style?.includes('Poke') || profile.traits?.includes('Artillery');
    let score = 0;
    // With no context, anchors are slightly inherently more reliable blind picks for human execution
    if (allies.length === 0) {
        if (isAnchor)
            score += 5;
        if (isHard)
            score -= 5;
        return score;
    }
    const { hardExecutionSpecs, anchors } = execProfile;
    // The comp expects extreme coordination and has no simple 'go' button
    const isFragile = hardExecutionSpecs >= 2 && anchors === 0;
    if (isFragile) {
        if (isAnchor) {
            score += 25; // Massive reward for stabilizing the execution of a chaotic/fragile draft
        }
        if (isHard) {
            score -= 20; // Massive penalty for drafting a 3rd frail/hard champion with no anchor
        }
    }
    else {
        // Normal states
        if (isHard) {
            // Diminishing returns on execution difficulty
            if (hardExecutionSpecs >= 2)
                score -= 15;
            else if (hardExecutionSpecs >= 1)
                score -= 5;
        }
        if (isAnchor) {
            // Multiple anchors ensure extremely easy teamfights (Diminishing returns after 2)
            if (anchors === 0)
                score += 15;
            else if (anchors === 1)
                score += 10;
            else if (anchors >= 2)
                score -= 5; // Too many tanks means no damage (handled by needs anyway, but execution pace slows down)
        }
    }
    return score;
}
// ─── Player Affinity ─────────────────────────────────────────────────────────
// Evaluates how much the user actually plays the champion using real OP.GG 
// MCP stats. First timing a mechanically intense champion ruins games.
// Maining a champion compensates for slightly worse draft geometry.
function scorePlayerAffinity(profile, summonerData) {
    if (!summonerData)
        return 0;
    let score = 0;
    const match = summonerData.champion_pool.find(c => c.champion_name === profile.name);
    if (match) {
        if (match.play >= 5) {
            const winRate = match.win / match.play;
            // Bonus scales with both games played and win rate
            if (winRate > 0.5) {
                score += (winRate - 0.5) * 60 + Math.min(15, match.play); // Up to +30 points
            }
            else {
                score -= (0.5 - winRate) * 40; // Penalize spamming losing champions
            }
        }
        else {
            score += 2; // Slight familiarity reward
        }
    }
    else {
        // Never played recently! If it's a mechanically hard champion, penalize heavily.
        const isHard = profile.traits?.includes('Hypercarry') || profile.style?.includes('Splitpush') || profile.style?.includes('Poke') || profile.traits?.includes('Artillery');
        if (isHard) {
            score -= 25; // Massive penalty for first-timing an execution-heavy champ
        }
        else {
            score -= 5;
        }
    }
    return score;
}
