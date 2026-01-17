
import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationResult, EvaluationType } from "../types";

const SYSTEM_INSTRUCTION = `
You are a Senior Commercial & Strategy Leader at Treebo Hotels. 
Conduct a high-fidelity commercial audit using live Google Search grounding.

CORE DIRECTIVE - TREEBO NETWORK SYNERGY (CRITICAL):
You MUST provide 100% accurate, live data for the Treebo Presence section.
1. Perform a live search: "site:treebo.com hotels in [CITY]" (e.g., "site:treebo.com hotels in Bangalore")
2. Look specifically for the total count of properties mentioned in search results (e.g., "Showing 24 hotels", "Book from 31 Treebo hotels"). Extract the integer.
3. If you find no results, set cityHotelCount to 0. 
4. For 'nearestHotelName' and 'nearestHotelDistance', search for: "distance from [TARGET HOTEL NAME] [CITY] to nearest Treebo hotel". 
5. If the target hotel IS a Treebo property, identify the NEXT closest Treebo property as the nearest node.

MANDATORY DATA SOURCE PROTOCOLS:
1. OTA Performance Audit: You MUST check status for EXACTLY these 6 platforms: treebo.com, MakeMyTrip, Booking.com, Agoda, Goibibo, and Google Maps.
   - For each, determine if the property is listed, its current rating, and any blockers (e.g., "No inventory", "Outdated images", "High price parity").
   
2. Guest Sentiment: Provide detailed analysis for Booking.com, MakeMyTrip, and Agoda. 
   - Extract real-world positive/negative points and sentimentScore (0-100).

3. Protocol Audit: Strictly return "PASS", "FAIL", or "WARNING" for duplication, geo-verification, and compliance.

Framework Scores (0-10): Location, Demand, Inventory, Pricing, Upside, Brand Fit.

Output ONLY valid JSON matching the provided schema.`;

export const evaluateHotel = async (hotelName: string, city: string, type: EvaluationType): Promise<EvaluationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
      PROPERTY STRATEGY AUDIT:
      Target Asset: "${hotelName}"
      Market Node: "${city}"
      Audit Protocol: ${type}

      EXECUTION STEPS:
      1. SYNERGY AUDIT: Use googleSearch to find "treebo hotels in ${city}" and "treebo.com ${city} hotel count". Extract the EXACT count.
      2. PROXIMITY AUDIT: Search "distance between ${hotelName} ${city} and nearest other Treebo hotel".
      3. CHANNEL AUDIT: Verify listing status on: treebo.com, MakeMyTrip, Booking.com, Agoda, Goibibo, and Google Maps. All 6 must be in otaAudit.
      4. COMPETITIVE INDEX: Find at least 4 competitors in the same micro-market with their ADR and ratings.
      
      Return the result as JSON.`,
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
                cityHotelCount: { type: Type.NUMBER, description: "The total number of Treebo properties in this city found on treebo.com" },
                nearestHotelName: { type: Type.STRING, description: "The name of the closest other Treebo property" },
                nearestHotelDistance: { type: Type.STRING, description: "Distance with units, e.g. '2.5 km'" },
                marketShareContext: { type: Type.STRING, description: "A sentence explaining the commercial synergy and network strength in this city." }
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
            topCorporates: { type: Type.ARRAY, items: { type: Type.STRING } },
            topTravelAgents: { type: Type.ARRAY, items: { type: Type.STRING } },
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
            "treeboPresence"
          ]
        }
      }
    });

    if (!response.text) throw new Error("Audit engine timed out.");
    
    const result: EvaluationResult = JSON.parse(response.text.trim());
    return result;
  } catch (err: any) {
    throw err;
  }
};
