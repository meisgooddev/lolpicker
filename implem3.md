Yep — this is now actually well-structured.

At this point, the engine is no longer “pretending” to reason. It really does have:
	•	a hard validity filter
	•	context profiling
	•	modular scoring
	•	draft-stage awareness
	•	team-need detection
	•	a path for incremental overrides

That’s the right shape.

That said, there are still a few things I’d tighten, because now the weak points are more subtle.

⸻

What is now genuinely good

getContextProfile()

This is much better than the fake "Fallback" role.
Good change.

threshold-based comp needs

Also correct.
ap < 2 is already much more realistic than ap === 0.

role pool validation

Very good. This will save you from silent stupidity.

draft granularity

Also good.
Early / mid / late is already much saner.

⸻

The important issues I still see

1. getContextProfile() is still too naive

Right now:

if (champion.tags?.includes('Marksman')) inferredRole = 'ADC';
else if (champion.tags?.includes('Support')) inferredRole = 'Support';
else if (champion.tags?.includes('Mage')) inferredRole = 'Mid';
else if (champion.tags?.includes('Fighter')) inferredRole = 'Top';
else if (champion.tags?.includes('Tank')) inferredRole = 'Jungle';

This is serviceable, but it will misread a lot of champions:
	•	Gragas → often inferred weirdly
	•	Galio → mage but not “just Mid”
	•	Maokai → tank but not always Jungle
	•	Nautilus / Leona / Rell → tank but support identity matters more
	•	Taliyah → mage but jungle/mid ambiguity
	•	Diana → fighter/assassin but often jungle/mid
	•	Swain / Seraphine → role identity very contextual
	•	Poppy → fighter/tank but top/jungle/support

So the engine is structurally correct, but context profiles may still be slightly off.

Better fix

Use a lightweight primaryRoleMap override before tag inference.

Example:

const primaryRoleMap: Record<string, string> = {
  Jinx: 'ADC',
  Lulu: 'Support',
  Nautilus: 'Support',
  Leona: 'Support',
  Rell: 'Support',
  Maokai: 'Jungle',
  Gragas: 'Top',
  Diana: 'Jungle',
  Taliyah: 'Mid',
  Poppy: 'Jungle',
  Seraphine: 'Support',
  Swain: 'Support'
};

Then:

export function getContextProfile(champion: any): ChampionProfile {
  const inferredRole =
    primaryRoleMap[champion.id] ||
    inferRoleFromTags(champion);

  return getProfile(champion, inferredRole);
}

That would massively improve ally/enemy interpretation without needing a full DB.

⸻

2. needsAP and needsAD can both become true

This is a bit funny but possible:

needsAP: ap < 2,
needsAD: ad < 2,

If team has only 1 ally and that ally is AP, then:
	•	needsAP = true
	•	needsAD = true

That may be acceptable early in draft, but it means team comp score can become too generous and reward almost everybody.

Not necessarily wrong, but a bit loose.

Cleaner approach

Instead of pure booleans, you could score deficits.

Example:

type TeamNeeds = {
  apDeficit: number;
  adDeficit: number;
  frontlineDeficit: number;
  engageDeficit: number;
  peelDeficit: number;
  scalingDeficit: number;
  earlyDeficit: number;
};

Then:

apDeficit: Math.max(0, 2 - ap)

And score with weights:

score += needs.apDeficit * 12 if AP

That gives smoother behavior.

You do not need to do this now, but this is the next logical upgrade.

⸻

3. scoreTeamComp() may over-reward too many things at once

Right now a single champion can stack:
	•	+25 AP
	•	+25 AD
	•	+25 frontline
	•	+15 engage
	•	+15 peel
	•	+10 scaling
	•	+10 early

That can get quite inflated if your heuristic marks a champion as covering multiple needs.

Even if that doesn’t happen often, the score may become dominated by team-comp needs compared with synergy/counter logic.

That means:

Right now team comp weighting is probably stronger than synergy and countering.

That may be okay for MVP, but if the output feels too generic, this is likely why.

Possible fix

Either:
	•	reduce those numbers slightly
	•	or cap total team-comp contribution

Example:

return Math.min(score, 45);

That would stop team need filling from completely overwhelming the rest.

⸻

4. Fighters currently always “provide engage”

You added:

if (tags.includes('Fighter')) {
  profile.style.push('Skirmish');
  profile.provides.push('Engage');
}

That is better than before, but also a bit too broad.

Not every fighter is equally good engage:
	•	Jax? not really primary engage
	•	Fiora? definitely not team engage
	•	Camille? more yes
	•	Wukong? yes
	•	Sett? yes-ish
	•	Trundle? not really engage in the same way

So this may falsely make some top laners seem like they solve engage needs.

Better compromise

Maybe:

if (tags.includes('Fighter')) {
  profile.style.push('Skirmish');
}

And only some fighters get manual provides: ['Engage'].

Or, if you want an automatic compromise:

if (tags.includes('Fighter')) {
  profile.style.push('Skirmish');
  profile.engage += 1;
}

without necessarily adding "Engage" to provides.

Because provides is stronger semantically than just “can sometimes go in”.

⸻

5. safeBlind is still too tag-driven

Right now:

safeBlind: tags.includes('Tank') || tags.includes('Mage'),

This is not a disaster, but it is definitely inaccurate.

Some mages are not safe blinds at all.
Some tanks are safer than others.

For example:
	•	Orianna yes
	•	Syndra often yes
	•	Viktor fairly yes
	•	Xerath less so
	•	Veigar no
	•	Kassadin not because he isn’t even tagged mage only in the same sense
	•	Malphite top blind? depends a lot
	•	Sion/Ornn/Shen much safer than some others

Better for now

Keep the generic rule, but add overrides for the main outliers:

Xerath: { safeBlind: false }
Veigar: { safeBlind: false }
Kassadin: { safeBlind: false }
Ornn: { safeBlind: true }
Shen: { safeBlind: true }
Sion: { safeBlind: true }

You do not need many. Just enough to stop obvious weirdness.

⸻

6. counterReliant: tags.includes('Assassin') is too narrow

Late-pick value is not just assassins.

Counter-reliant or situational picks include:
	•	Malphite
	•	Rammus
	•	Poppy
	•	Vayne
	•	Nilah
	•	Samira
	•	Kassadin
	•	Morgana in some spots
	•	Braum into projectiles
	•	Janna into dive

So your late-pick logic is currently still a bit assassin-biased.

Fix

Add more manual overrides where it matters:

Poppy: { counterReliant: true }
Malphite: { counterReliant: true }
Rammus: { counterReliant: true }
Vayne: { counterReliant: true }
Nilah: { counterReliant: true }
Braum: { counterReliant: true }

That would make late-pick behavior much smarter.

⸻

7. scoreSynergy() and scoreCounters() are only as good as vocabulary consistency

This is a subtle one, but important.

You currently use strings like:
	•	'Peel'
	•	'Frontline'
	•	'Engage'
	•	'CC'
	•	'Wombo'
	•	'Hypercarry'
	•	'Dash'
	•	'Dive'
	•	'Immobile'

That’s fine, but only if your whole system uses the same ontology consistently.

Right now there are possible mismatches:
	•	Yasuo wants 'Knockup'
	•	but who provides 'Knockup' automatically? basically nobody unless overridden
	•	Samira wants 'CC'
	•	but many engage champs do not explicitly provide 'CC'
	•	Orianna wants 'Engage'
	•	okay, that one is more covered

So the structure is correct, but some tags will never match in practice.

Immediate recommendation

Create a tiny controlled vocabulary and stick to it.

For MVP, I’d keep only:
	•	Frontline
	•	Engage
	•	Peel
	•	CC
	•	Scaling
	•	Early
	•	Dive
	•	AntiDash
	•	Immobile
	•	Hypercarry

And then make sure:
	•	if a champion wants one of those,
	•	some champions actually provide it.

Otherwise some logic paths are dead.

⸻

8. validateRolePool() is good, but your pool still likely has bad IDs

Good utility, but I’d actually expect warnings from this list.

A few IDs I’d check carefully:
	•	Chogath
	•	KSante
	•	Velkoz
	•	maybe Belveth
	•	maybe TahmKench
	•	maybe KhaZix
	•	maybe KaiSa
	•	Carmille was previously wrong, not sure if already fixed outside the pasted code

So yes, the validator is correct — just make sure you actually read and fix the warnings.

⸻

My overall read now

Architecture

Strong.

Code organization

Clean.

Logic shape

Correct.

Current weakness

Mostly data semantics, not architecture.

That’s good news.

⸻

What I would do next, in order

1. Add a tiny primaryRoleMap

For context profiling only.

2. Add 10–20 more overrides

Not for everyone — just for:
	•	obvious hypercarries
	•	obvious engage champs
	•	obvious situational counters
	•	safe blinds
	•	anti-dive / anti-dash picks

3. Normalize vocabulary

Make sure wants, provides, counters, traits, and style actually overlap meaningfully.

4. Optionally cap teamCompScore

Because right now it may dominate too much.

⸻

Tiny practical note

This line is fine:

return (profile.metaScore || 5) * 3;

But just know that right now meta awareness is still placeholder awareness.
That’s okay. Just don’t mentally over-credit that part yet.

⸻

Verdict

You’ve crossed the line from “toy logic” into “real system with improvable heuristics”.

That is the hard part.

Now you’re in the nice phase where every improvement actually compounds instead of fighting broken structure.

The next highest-value move is not a rewrite — it’s better controlled overrides and vocabulary cleanup.