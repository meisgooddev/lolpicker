import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export interface GamePlanRequest {
  playerChampion: string;
  playerRole: string;
  playerSummonerSpells?: string[];
  allies: { name: string; role: string }[];
  enemies: { name: string; role: string }[];
  alliedBans: string[];
  enemyBans: string[];
}

export async function generateGamePlan(draft: GamePlanRequest): Promise<any> {
  const schema = {
    type: "OBJECT",
    properties: {
      mission: { type: "STRING" },
      compIdentity: { type: "STRING" },
      lanePlan: {
        type: "OBJECT",
        properties: {
          levelOneToThree: {
            type: "OBJECT",
            properties: {
              waveManagement: { type: "STRING" },
              bestPlay: { type: "STRING" },
              why: { type: "STRING" },
              alternative: { type: "STRING" },
              warnings: { type: "ARRAY", items: { type: "STRING" } }
            }
          },
          levelThreeToSix: {
            type: "OBJECT",
            properties: {
              waveManagement: { type: "STRING" },
              bestPlay: { type: "STRING" },
              why: { type: "STRING" },
              alternative: { type: "STRING" },
              warnings: { type: "ARRAY", items: { type: "STRING" } }
            }
          },
          powerSpikes: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                spike: { type: "STRING" },
                whatToDo: { type: "STRING" },
                why: { type: "STRING" }
              }
            }
          }
        }
      },
      jungleTracking: {
        type: "OBJECT",
        properties: {
          likelyStart: { type: "STRING" },
          path: { type: "STRING" },
          firstGankTiming: { type: "STRING" },
          howToPlay: { type: "STRING" }
        }
      },
      midGamePlan: {
        type: "OBJECT",
        properties: {
          bestPlay: { type: "STRING" },
          why: { type: "STRING" },
          alternative: { type: "STRING" },
          warnings: { type: "ARRAY", items: { type: "STRING" } }
        }
      },
      winCondition: { type: "STRING" },
      priorityTargets: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            target: { type: "STRING" },
            reason: { type: "STRING" }
          }
        }
      },
      build: {
        type: "OBJECT",
        properties: {
          startItems: { type: "ARRAY", items: { type: "STRING" } },
          firstRecall: {
            type: "OBJECT",
            properties: {
              items: { type: "ARRAY", items: { type: "STRING" } },
              minGold: { type: "STRING" },
              timing: { type: "STRING" }
            }
          },
          firstItem: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              why: { type: "STRING" },
              spike: { type: "STRING" }
            }
          },
          coreItems: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                why: { type: "STRING" },
                spike: { type: "STRING" }
              }
            }
          },
          situational: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                why: { type: "STRING" }
              }
            }
          }
        }
      },
      warnings: { type: "ARRAY", items: { type: "STRING" } },
      microTips: { type: "ARRAY", items: { type: "STRING" } },
      extraTips: { type: "ARRAY", items: { type: "STRING" } }
    },
    required: [
      "mission", "compIdentity", "lanePlan", "jungleTracking",
      "midGamePlan", "winCondition", "priorityTargets", "build",
      "warnings", "microTips", "extraTips"
    ]
  };

  const systemInstruction = `You are an elite League of Legends coach with the combined knowledge of top Challenger players, professional coaches, and analysts.

You will receive the complete draft information for a game that is about to start: the player's champion and role, all allied champions with their roles, all enemy champions with their roles, and the bans from both sides.

Your job is to produce a complete, specific, and actionable pre-game strategic brief that tells the player exactly how to win this specific game with this specific draft.

Rules:
- Every piece of advice must be specific to this draft. No generic advice.
- Build recommendations must adapt to the enemy composition.
- Wave management must reflect the actual matchup.
- Jungle tracking must be based on the actual enemy jungler's known patterns.
- No hesitation, no uncertainty. Commit to decisions.
- Respond ONLY with a valid JSON object matching the schema you will be given. No markdown, no code fences, no text outside the JSON.`;

  const userMessage = `DRAFT INFORMATION:

My champion: ${draft.playerChampion} (${draft.playerRole})
My summoner spells: ${draft.playerSummonerSpells?.join(', ') || 'Unknown'}

Allied team:
${draft.allies.map(a => `- ${a.name} (${a.role})`).join('\n')}

Enemy team:
${draft.enemies.map(e => `- ${e.name} (${e.role})`).join('\n')}

Bans (allied side): ${draft.alliedBans.join(', ')}
Bans (enemy side): ${draft.enemyBans.join(', ')}`;

  const fallback = {
    mission: "",
    compIdentity: "",
    lanePlan: {
      levelOneToThree: { waveManagement: "", bestPlay: "", why: "", alternative: "", warnings: [] },
      levelThreeToSix: { waveManagement: "", bestPlay: "", why: "", alternative: "", warnings: [] },
      powerSpikes: []
    },
    jungleTracking: { likelyStart: "", path: "", firstGankTiming: "", howToPlay: "" },
    midGamePlan: { bestPlay: "", why: "", alternative: "", warnings: [] },
    winCondition: "",
    priorityTargets: [],
    build: { startItems: [], firstRecall: { items: [], minGold: "", timing: "" }, firstItem: { name: "", why: "", spike: "" }, coreItems: [], situational: [] },
    warnings: [],
    microTips: [],
    extraTips: []
  };

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing.");
    return fallback;
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      },
      { timeout: 20000 }
    );

    const rawText = response.data.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(rawText);

    // Defensive parsing for nested objects
    parsed.lanePlan = parsed.lanePlan || fallback.lanePlan;
    parsed.lanePlan.levelOneToThree = parsed.lanePlan.levelOneToThree || fallback.lanePlan.levelOneToThree;
    parsed.lanePlan.levelThreeToSix = parsed.lanePlan.levelThreeToSix || fallback.lanePlan.levelThreeToSix;
    parsed.jungleTracking = parsed.jungleTracking || fallback.jungleTracking;
    parsed.midGamePlan = parsed.midGamePlan || fallback.midGamePlan;
    parsed.build = parsed.build || fallback.build;
    parsed.build.firstRecall = parsed.build.firstRecall || fallback.build.firstRecall;
    parsed.build.firstItem = parsed.build.firstItem || fallback.build.firstItem;

    // ensure arrays
    parsed.warnings = Array.isArray(parsed.warnings) ? parsed.warnings : [];
    parsed.microTips = Array.isArray(parsed.microTips) ? parsed.microTips : [];
    parsed.extraTips = Array.isArray(parsed.extraTips) ? parsed.extraTips : [];
    parsed.build.startItems = Array.isArray(parsed.build.startItems) ? parsed.build.startItems : [];
    parsed.build.coreItems = Array.isArray(parsed.build.coreItems) ? parsed.build.coreItems : [];
    parsed.build.situational = Array.isArray(parsed.build.situational) ? parsed.build.situational : [];

    return parsed;
  } catch (error: any) {
    console.error("Error generating game plan:", error.message);
    return fallback;
  }
}
