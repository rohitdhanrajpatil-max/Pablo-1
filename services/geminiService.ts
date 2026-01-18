
import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationResult, EvaluationType } from "../types";

const SYSTEM_INSTRUCTION = `
You are a Senior Commercial & Strategy Leader at Treebo Hotels. 
Conduct a high-fidelity commercial audit using live Google Search grounding.

CORE DIRECTIVE - TREEBO NETWORK SYNERGY (CRITICAL):
You MUST provide 100% accurate, live data for the Treebo Presence section.
1. Perform a live search: "site:treebo.com hotels in [CITY]"
2. Look specifically for the total count of properties mentioned in search results (e.g., "Showing 24 hotels"). Extract the integer.
3. If the target hotel IS a Treebo property, identify the NEXT closest Treebo property as the nearest node.

MANDATORY DATA SOURCE PROTOCOLS:
1. OTA Performance Audit: Check status for treebo.com, MakeMyTrip, Booking.com, Agoda, Goibibo, and Google Maps.
   - Determine listing presence, rating, and blockers (e.g., "Outdated photos", "No available rooms").

2. UNIT INVENTORY INTEGRITY AUDIT (CRITICAL): 
   - Search specifically for "[HOTEL NAME] [CITY] room types" or "[HOTEL NAME] [CITY] booking.com".
   - Extract actual room names (e.g., "Oak (Standard)", "Maple (Deluxe)", "Mahogany (Premium)").
   - Identify discrepancies between platforms (e.g., "Premium room on MMT but Standard on Booking").
   - Audit amenities and potential "Config Risk" (e.g., "Room size mismatch", "Missing AC in description").

3. Protocol Audit: Strictly return "PASS", "FAIL", or "WARNING".

Output ONLY valid JSON matching the provided schema.`;

export const evaluateHotel = async (hotelName: string, city: string, type: EvaluationType): Promise<EvaluationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
      PROPERTY STRATEGY AUDIT:
      Asset: "${hotelName}"
      City: "${city}"
      Mode: ${type}

      EXECUTION PROTOCOL:
      1. INVENTORY SCRAPE: Find actual room types for ${hotelName} ${city}. Use search queries like "room types in ${hotelName} ${city}" and check official listings.
      2. SYNERGY AUDIT: Count Treebo properties in ${city} via "site:treebo.com".
      3. CHANNEL AUDIT: Verify presence on the 6 mandatory OTA platforms.
      4. COMPETITIVE INDEX: Fetch ADR/Ratings for 4 local peers.
      
      Populate roomTypeAudit with specific room names and identified risks.
      Return as valid JSON.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4096 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: {
              type: Type.OBJECT,
              properties: {
                hotelName: { type: Type.STRING },
                city: { type: Type.STRING },
                evaluationType: { type: Type.STRING },
                finalDecision: { type: Type.STRING },
                averageScore: { type: Type.NUMBER }
              },
              required: ["hotelName", "city", "evaluationType", "finalDecision", "averageScore"]
            },
            targetHotelMetrics: {
              type: Type.OBJECT,
              properties: {
                averageOTARating: { type: Type.NUMBER },
                estimatedADR: { type: Type.NUMBER },
                adrCurrency: { type: Type.STRING }
              },
              required: ["averageOTARating", "estimatedADR", "adrCurrency"]
            },
            protocolStatus: {
              type: Type.OBJECT,
              properties: {
                duplicationAudit: { type: Type.STRING },
                geoVerification: { type: Type.STRING },
                complianceAudit: { type: Type.STRING },
                notes: { type: Type.STRING }
              },
              required: ["duplicationAudit", "geoVerification", "complianceAudit"]
            },
            roomTypeAudit: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  roomName: { type: Type.STRING },
                  sizeSqFt: { type: Type.STRING },
                  occupancy: { type: Type.STRING },
                  amenities: { type: Type.ARRAY, items: { type: Type.STRING } },
                  descriptionAudit: { type: Type.STRING },
                  configRisk: { type: Type.STRING }
                },
                required: ["roomName", "occupancy", "amenities", "descriptionAudit", "configRisk"]
              }
            },
            treeboPresence: {
              type: Type.OBJECT,
              properties: {
                cityHotelCount: { type: Type.NUMBER },
                nearestHotelName: { type: Type.STRING },
                nearestHotelDistance: { type: Type.STRING },
                marketShareContext: { type: Type.STRING }
              },
              required: ["cityHotelCount", "nearestHotelName", "nearestHotelDistance", "marketShareContext"]
            },
            otaAudit: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING },
                  status: { type: Type.STRING },
                  currentRating: { type: Type.STRING },
                  channelBlockers: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recoveryPlan: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["platform", "status"]
              }
            },
            competitors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  otaRating: { type: Type.NUMBER },
                  estimatedADR: { type: Type.STRING },
                  distance: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ["name", "otaRating", "estimatedADR", "distance", "category"]
              }
            },
            guestReviews: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING },
                  positive: { type: Type.ARRAY, items: { type: Type.STRING } },
                  negative: { type: Type.ARRAY, items: { type: Type.STRING } },
                  sentimentScore: { type: Type.NUMBER },
                  recurringThemes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        theme: { type: Type.STRING },
                        impact: { type: Type.STRING }
                      },
                      required: ["theme", "impact"]
                    }
                  }
                },
                required: ["platform", "positive", "negative", "sentimentScore", "recurringThemes"]
              }
            },
            scorecard: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  parameter: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                },
                required: ["parameter", "score", "reason"]
              }
            },
            keyRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
            commercialUpside: { type: Type.ARRAY, items: { type: Type.STRING } },
            finalRecommendation: { type: Type.STRING },
            hardStopFlagged: { type: Type.BOOLEAN }
          },
          required: [
            "executiveSummary", 
            "scorecard", 
            "finalRecommendation", 
            "protocolStatus", 
            "keyRisks", 
            "commercialUpside",
            "otaAudit",
            "competitors",
            "targetHotelMetrics",
            "guestReviews",
            "treeboPresence",
            "roomTypeAudit"
          ]
        }
      }
    });

    if (!response.text) throw new Error("Audit engine timed out.");
    return JSON.parse(response.text.trim());
  } catch (err: any) {
    throw err;
  }
};
