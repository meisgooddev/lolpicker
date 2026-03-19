Honestly? This is much, much better.
The architecture now makes sense as an actual recommendation engine.

You fixed the biggest structural problem: the engine now thinks in this order:
	1.	filter
	2.	profile
	3.	analyze
	4.	score
	5.	sort

That’s exactly the right direction.

That said, I can already see a few important issues / weak spots that will make results weird if you don’t tighten them now.

⸻

What is already good

1. Strict role filtering

This is the biggest win.

const viablePool = rolePool[state.role] || [];

This alone prevents a lot of nonsense outputs.

⸻

2. Scoring modules are separated

Very good:
	•	scoreDraftOrder
	•	scoreTeamComp
	•	scoreSynergy
	•	scoreCounters
	•	scoreMeta

That makes the system maintainable.

⸻

3. Auto profile + override merge

Also correct.
That is exactly the smart compromise between:
	•	“manual DB for everyone”
	•	and “pure tag chaos”

⸻

The main problems I see now

1. analyzeTeamNeeds(..., champions) is using getProfile(c, 'Fallback')

This is a bit dangerous.

const p = getProfile(c, 'Fallback');

Because buildAutoProfile(champion, role) sets:

roles: [role]

So all those ally profiles are being generated with a fake role string 'Fallback'.

That won’t break everything, because most of your logic is tag-based, but it’s still conceptually wrong and can bite later.

Better

When analyzing allies/enemies, use their most likely real role, or create a role-agnostic path.

For example:

export function getProfile(champion: any, role?: string): ChampionProfile {
  const resolvedRole = role || inferPrimaryRole(champion.id);
  const base = buildAutoProfile(champion, resolvedRole);
  ...
}

Or even simpler: create another function:

export function getContextProfile(champion: any): ChampionProfile

for ally/enemy analysis, where you do not pretend you know the role from the current request.

Because right now, if a champion is multi-role, your ally/enemy analysis may be misleading.

⸻

2. Team composition analysis is too binary

Currently:

needsAP: ap === 0,
needsAD: ad === 0,
needsFrontline: frontline === 0,

This is too harsh.

Example:
	•	team has 1 AP source
	•	3 AD champions
	•	still probably needs more AP balance
	•	but your engine says needsAP = false

So your system can still recommend a full AD comp because “technically there is 1 AP champ”.

Better

Make it threshold-based.

Example:

needsAP: ap < 2,
needsAD: ad < 2,
needsFrontline: frontline < 1,
needsEngage: engage < 1,
needsPeel: peel < 1,
needsScaling: scaling < 2,
needsEarlyGame: early < 1

Or even weighted ratios later.

This change alone will improve comp recommendations a lot.

⸻

3. damageType logic is oversimplified

Right now:

damageType: tags.includes('Mage') ? 'AP' : (tags.includes('Marksman') || tags.includes('Assassin') || tags.includes('Fighter') ? 'AD' : 'Mixed')

This creates bad classifications.

Examples:
	•	Corki can be weird
	•	Kaisa is hybrid-ish in identity
	•	Varus can go AP or AD
	•	Diana is AP but fighter/assassin style
	•	Gragas is AP but fighter/tank-style
	•	Galio is AP but tanky
	•	Malphite can be treated as AP here because override saves him, but others won’t be saved

You do rescue some of these with overrides, but only for a few.

Better rule

Prioritize overrides, yes, but for auto-profile maybe do:

if (tags.includes('Mage')) damageType = 'AP';
else if (champion.id === 'Diana' || champion.id === 'Gragas' || champion.id === 'Galio' || champion.id === 'Amumu' || champion.id === 'Maokai') damageType = 'AP';
else if (tags.includes('Marksman') || tags.includes('Assassin') || tags.includes('Fighter')) damageType = 'AD';
else damageType = 'Mixed';

Not perfect, but less wrong.

⸻

4. Some style generation is missing important identities

In buildAutoProfile, you currently do:

if (tags.includes('Tank')) { profile.style.push('Frontline'); ... }
if (tags.includes('Mage')) { profile.style.push('Scaling'); ... }
if (tags.includes('Support')) { profile.style.push('Peel'); ... }
if (tags.includes('Assassin')) { profile.style.push('Early'); ... }

But Fighters and some Supports are missing a lot of useful defaults.

For example:
	•	Fighters often imply skirmish / engage / frontline-lite
	•	Tanks often imply engage, not just frontline
	•	Enchanter-like supports are not distinguishable from mage supports
	•	Marksmen are always treated as immobile, which is not true for all ADCs

At minimum

I’d add:

if (tags.includes('Fighter')) {
  profile.style.push('Skirmish');
  profile.provides.push('Engage');
}

if (tags.includes('Tank')) {
  profile.style.push('Engage');
  profile.provides.push('Engage');
}

And for marksmen, don’t automatically force Immobile on all of them.
That’s too broad.

if (tags.includes('Marksman')) {
  profile.style.push('Scaling');
  profile.wants.push('Peel', 'Frontline');
}

Then reserve Immobile for overrides like Jinx, Aphelios, Kog’Maw.

⸻

5. scoreSynergy is good structurally, but currently sparse

This part is fine:

for (const need of profile.wants || []) {
  if (ally.provides?.includes(need) || ally.style?.includes(need)) score += 8;
}

But the system only works if enough champs actually have meaningful provides and wants.

Right now many champions will still have mostly empty arrays, so synergy may underperform except for the overridden champions.

That means:

The structure is good, but the data density is still low.

Not a bug, but expect:
	•	decent results for overridden champs
	•	generic results for the rest

Which is fine for now, just know that this is the current bottleneck.

⸻

6. scoreCounters is also structurally good, but underfed

Same issue.

Most champs have:

counters: []
weakInto: []

So counter logic will only really matter for champions with manual overrides.

Again: not wrong, just limited.

⸻

7. There is a typo in rolePool.ts

You have:

Support: ['Alistar', 'Braum', 'Blitzcrank', 'Bard', 'Brand', 'Carmille', ...]

Carmille should be Camille.

This matters because IDs must match exactly.

Also check:
	•	Chogath vs Riot ID format
	•	Belveth
	•	KSante
	•	Velkoz
	•	RekSai
	•	KhaZix
	•	KaiSa

Some of these Riot IDs are weird and easy to get wrong. If one is wrong, that champion silently disappears from viability.

So you should validate the pool automatically.

I strongly recommend this helper

When loading champs, validate role pools:

export function validateRolePool(champions: Record<string, any>, rolePool: Record<string, string[]>) {
  for (const [role, ids] of Object.entries(rolePool)) {
    for (const id of ids) {
      if (!champions[id]) {
        console.warn(`[rolePool] Invalid champion id in ${role}: ${id}`);
      }
    }
  }
}

Then call it after loadChampionData().

That will save you a lot of silent bugs.

⸻

8. pickPosition <= 3 is probably too simplistic

You currently treat early picks as:

const earlyPick = state.pickPosition <= 3;

But your draft system is more nuanced than that.

If the user’s own pick can be, say, 1st to 10th in total order, then:
	•	1–3 early
	•	4–7 mid
	•	8–10 late

would probably make more sense.

Because pick 4 is not really the same as pick 9.

Better:

if (state.pickPosition <= 3) ...
else if (state.pickPosition <= 7) ...
else ...

Then:
	•	early: blind safety
	•	mid: balanced value
	•	late: counter reliance / punish value

⸻

9. roleScore = 100 works, but it is fake weight

This is okay for now, but it’s not really a score. It’s just a constant baseline.

const roleScore = 100;

Since every viable champ gets it, it doesn’t affect ranking.
So conceptually it’s not doing anything.

You can keep it for debugging clarity, but know that it’s just cosmetic.

⸻

What I would change immediately

Priority 1

Fix binary need detection.

Change:

needsAP: ap === 0,
needsAD: ad === 0,

to something like:

needsAP: ap < 2,
needsAD: ad < 2,
needsFrontline: frontline < 1,
needsEngage: engage < 1,
needsPeel: peel < 1,
needsScaling: scaling < 2,
needsEarlyGame: early < 1


⸻

Priority 2

Stop assigning Immobile to every marksman.

Change this:

if (tags.includes('Marksman')) { 
  profile.style.push('Scaling'); 
  profile.traits.push('Immobile'); 
  profile.wants.push('Peel', 'Frontline'); 
}

to:

if (tags.includes('Marksman')) { 
  profile.style.push('Scaling'); 
  profile.wants.push('Peel', 'Frontline'); 
}

Then manually tag immobile ADCs in overrides.

⸻

Priority 3

Add engage defaults for tanks/fighters.

⸻

Priority 4

Validate rolePool IDs automatically.

⸻

Priority 5

Replace 'Fallback' profiling with a cleaner context-profile approach.

⸻

My verdict

Architecturally:

yes, this is now solid

As a first real engine:

yes, this is already usable

As a truly smart competitive drafter:

not yet, but now the limitations are data-quality limitations, not architecture limitations

And that is a huge upgrade.

Because before, the whole system was structurally weak.
Now the structure is right — you just need to refine the heuristics.

⸻

The single most important sentence

You are no longer fighting the shape of the system.
Now you are only improving the quality of the inputs and weights.

That’s where you want to be.

If you want, next I can rewrite just the weak parts for you:
	•	a better analyzeTeamNeeds
	•	a safer buildAutoProfile
	•	and a validateRolePool() utility you can drop in immediately.