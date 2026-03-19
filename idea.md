🧠 Concept — Smart Draft Assistant for League of Legends

A web-based tool that recommends the optimal champion pick during champion select based on draft context, role, and team compositions.

⸻

⚙️ Core Functionality

The system dynamically suggests the best champion pick by analyzing:
	•	Pick order (draft position)
	•	Team side (Blue / Red)
	•	Selected role
	•	Current allied champions
	•	Current enemy champions

⸻

🔄 User Flow
	1.	User selects:
	•	Team side (Blue / Red)
	•	Pick position (1st to 10th)
	2.	User selects their role:
	•	Top / Jungle / Mid / ADC / Support
	3.	Based on pick order, the system:
	•	Determines current draft state
	•	Asks for already picked champions (allies + enemies)
	4.	System outputs:
	•	The optimal champion pick

⸻

🧩 Decision Factors

The recommendation engine evaluates:

1. Draft Order Awareness
	•	Early picks → prioritize safe, flexible champions
	•	Late picks → prioritize counter-picks

2. Team Composition Analysis
	•	Damage balance (AD/AP)
	•	Frontline vs squishy
	•	Engage / disengage tools
	•	Scaling (early / mid / late game)
	•	Composition archetype:
	•	Teamfight
	•	Pick/Assassin
	•	Siege/Poke
	•	Protect Carry
	•	Split Push

3. Synergy (Allies)
	•	Champion combos
	•	Wombo potential
	•	Peel/support interactions

4. Counter-Picking (Enemies)
	•	Lane counters
	•	Team-wide counters
	•	Anti-carry / anti-tank tools

5. Meta Awareness
	•	Current patch strength
	•	Win rates / pick rates
	•	Pro-play relevance (optional)

⸻

🎯 Output
	•	A single recommended champion
	•	top 3 alternatives

No explanations required — output is concise and actionable.

⸻

🚀 Goal

To replicate high-level competitive draft decision-making in a simple, fast, and intuitive interface.