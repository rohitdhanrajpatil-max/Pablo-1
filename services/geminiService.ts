
import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationResult, EvaluationType } from "../types";

const SYSTEM_INSTRUCTION = `
You are a Senior Commercial & Strategy Leader at Treebo Hotels. 
Conduct a high-fidelity commercial audit using live Google Search grounding.

CORE DIRECTIVE - TREEBO NETWORK SYNERGY:
You MUST provide 100% accurate, live data for the Treebo Presence section using Treebo.com as the primary source.
1. Perform live searches: "site:treebo.com hotels in [CITY]" to extract exact counts.
2. Identify nearest neighbor distance and name.

UNIT INVENTORY INTEGRITY AUDIT (CRITICAL - CROSS-CHANNEL PARITY):
This is your most important task. You MUST ensure the inventory audit matches real-world listings on Booking.com and MakeMyTrip (MMT).
1. SEARCH PROTOCOL: Search "[HOTEL NAME] [CITY] room types site:booking.com" AND "[HOTEL NAME] [CITY] room types site:makemytrip.com".
2. NOMENCLATURE CHECK: If the property is a Treebo, look for mapping of 'Oak' (Standard), 'Maple' (Deluxe), 'Mahogany' (Premium).
3. CONFIGURATION RISK: Identify if room sizes or bed types differ between platforms (e.g., MMT says King Bed, Booking says Twin).
4. AMENITY PARITY: Check for discrepancies in inclusions like "Free Breakfast" or "AC" between MMT and Booking.
5. Populate 'descriptionAudit' with specific findings like "Matches MMT exactly" or "Discrepancy: MMT lists as Deluxe, Booking lists as Standard".

MANDATORY DATA SOURCE PROTOCOLS:
1. OTA Performance Audit: Check status for Treebo, MMT, Booking.com, Agoda, Goibibo, and Google Maps.
2. COMPETITIVE INDEX (3KM RADIUS): Identify 4 local peers with 3 pos/neg themes each.
3. Protocol Audit: Return "PASS", "FAIL", or "WARNING".

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
      1. UNIT INVENTORY INTEGRITY (HIGH PRIORITY): Scrape and compare room configurations from site:booking.com and site:makemytrip.com for ${hotelName} ${city}. 
         - Identify if naming (e.g. Oak/Maple) matches.
         - Identify any 'Config Risk' where platform data conflicts.
      2. SYNERGY AUDIT: Count Treebo properties in ${city} via site:treebo.com.
      3. CHANNEL AUDIT: Verify presence/ratings on all 6 mandatory platforms.
      4. COMPETITIVE INDEX (3KM): Fetch data for 4 peers within 3km.
      
      Return a robust 'roomTypeAudit' reflecting the side-by-side comparison of Booking.com and MMT.
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
                  descriptionAudit: { type: Type.STRING, description: "Critical: Cross-reference findings between Booking.com and MMT" },
                  configRisk: { type: Type.STRING, description: "Risk identified in naming or configuration parity" }
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
                  category: { type: Type.STRING },
                  topPositives: { type: Type.ARRAY, items: { type: Type.STRING } },
                  topNegatives: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["name", "otaRating", "estimatedADR", "distance", "category", "topPositives", "topNegatives"]
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
