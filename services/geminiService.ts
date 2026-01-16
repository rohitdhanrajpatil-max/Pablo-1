
import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationResult, EvaluationType } from "../types";

const SYSTEM_INSTRUCTION = `
You are a Senior Commercial & Strategy Leader at Treebo Hotels. 
Your task is to conduct a thorough commercial evaluation of a hotel using Google Search grounding.

Input: Hotel Name, City, and Evaluation Type.

Research Tasks:
1. Identify hotel market positioning (Budget, Mid-scale, Premium).
2. Target Hotel Core Stats: Find the current average OTA rating and current estimated nightly rate (ADR) for the hotel being evaluated.
3. Guest Sentiment Deep-Dive (MANDATORY): You MUST extract sentiment data from 'Booking.com' and 'MakeMyTrip'. For each, provide 2-3 specific positive and negative points based on actual recent guest reviews found.
4. Treebo Ecosystem Context: Search treebo.com for city hotel count and nearest Treebo property.
5. Protocol Status Audit (CRITICAL): Conduct the following checks:
   - Duplication Audit: Check if there are duplicate listings for the same hotel (active or legacy) on Google, Booking.com, or MMT. Status: PASS (No duplicates), WARNING (Legacy listings found), FAIL (Active competing listings).
   - Geo-Verification: Verify if the pin location is consistent across Google Maps, MMT, and Booking.com. Status: PASS (Consistent), FAIL (Significant drift).
   - Compliance Audit: Verify if the hotel appears to have basic business compliance indicators (e.g., verified Google business profile). Status: PASS, WARNING, FAIL.
6. Room Type Detailed Audit: Research the property's listings on OTAs. Identify 3-4 specific room categories. For each: Identify amenities, audit description quality, and identify configuration risks.
7. OTA Performance Audit: Evaluate 'MakeMyTrip', 'Booking.com', 'Goibibo', and 'Google Maps'. Identify Status (FAIL/WARNING/PASS), Current Rating, Channel Blockers, and Recovery Plan.
8. Competitor Benchmarking: Identify 3-4 specific competitor hotels within a 5km radius in the SAME category.
9. Brand Alignment Check: Compare amenities against Treebo's core brand standards.
10. Demand Landscape: Research the specified city and identify top 5 corporate clients and top 5 travel agents.

Strictly follow the 6-parameter framework for scoring (0-10):
1. Location & micro-market strength
2. City demand & seasonality
3. Room inventory & configuration
4. Pricing power (ADR potential)
5. Revenue & RevPAR upside
6. Brand fit with Treebo standards

Hard Stops: Flag AUTO REJECT / EXIT for legal, safety, or unsustainable economics.
Return data in JSON. Extract grounding URLs.
`;

export const evaluateHotel = async (hotelName: string, city: string, type: EvaluationType): Promise<EvaluationResult> => {
  // Always create a new instance right before the call as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Evaluate for ${type}: ${hotelName} in ${city}. Focus on a high-fidelity audit. Ensure 'Duplication Audit' and 'Room Type Detailed Audit' are specific and accurate to current online listings.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
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
              duplicationAudit: { type: Type.STRING, enum: ["FAIL", "WARNING", "PASS"] },
              geoVerification: { type: Type.STRING, enum: ["FAIL", "WARNING", "PASS"] },
              complianceAudit: { type: Type.STRING, enum: ["FAIL", "WARNING", "PASS"] },
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
                status: { type: Type.STRING, enum: ["FAIL", "WARNING", "PASS"] },
                currentRating: { type: Type.STRING },
                channelBlockers: { type: Type.ARRAY, items: { type: Type.STRING } },
                recoveryPlan: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["platform", "status", "currentRating", "channelBlockers", "recoveryPlan"]
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
          topCorporates: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          topTravelAgents: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          guestReviews: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                platform: { type: Type.STRING },
                positive: { type: Type.ARRAY, items: { type: Type.STRING } },
                negative: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["platform", "positive", "negative"]
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
        required: ["executiveSummary", "targetHotelMetrics", "scorecard", "keyRisks", "commercialUpside", "finalRecommendation", "hardStopFlagged", "treeboPresence", "guestReviews", "otaAudit", "competitors", "topCorporates", "topTravelAgents", "roomTypeAudit", "protocolStatus"]
      }
    }
  });

  if (!response.text) throw new Error("The strategic audit engine returned an empty response. This may be due to temporary network instability.");

  try {
    const result: EvaluationResult = JSON.parse(response.text.trim());
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      result.groundingSources = chunks.filter((c: any) => c.web).map((c: any) => ({ title: c.web.title || 'Source', uri: c.web.uri }));
    }
    return result;
  } catch (parseError) {
    console.error("JSON Parsing Error:", response.text);
    throw new Error("Audit data format was corrupted. Please retry the generation.");
  }
};
