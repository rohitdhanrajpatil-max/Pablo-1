
import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationResult, EvaluationType } from "../types";

const SYSTEM_INSTRUCTION = `
You are a Senior Commercial & Strategy Leader at Treebo Hotels. 
Conduct a high-fidelity commercial audit using live Google Search grounding.

CORE DIRECTIVE - TREEBO NETWORK SYNERGY:
You MUST provide 100% accurate, live data for the Treebo Network Synergy section.
1. Perform a live search: "site:treebo.com hotels in [CITY]"
2. Count the properties by looking for the actual count displayed on the page (e.g., "Showing 25 Hotels"). Do NOT rely on training data. If treebo.com returns no results for that city, the count is 0.
3. For the 'nearestHotelName' and 'nearestHotelDistance', search for "distance from [TARGET HOTEL NAME] to nearest Treebo hotel in [CITY]". Use maps data or site info to find the absolute closest one.

MANDATORY DATA SOURCE PROTOCOLS:
1. Guest Sentiment & Quality Index: You MUST provide a detailed analysis for exactly THREE platforms: Booking.com, MakeMyTrip (MMT), and Agoda. 
   - Extract real-world positive/negative points, sentimentScore (0-100), and recurringThemes.
   
2. OTA Performance Audit: Check presence and status on treebo.com, MMT, Booking.com, Agoda, Goibibo, and Google Maps.

3. Protocol Audit: Strictly return "PASS", "FAIL", or "WARNING" for duplication, geo-verification, and compliance.

Framework Scores (0-10): Location, Demand, Inventory, Pricing, Upside, Brand Fit.

Output ONLY valid JSON matching the provided schema.`;

export const evaluateHotel = async (hotelName: string, city: string, type: EvaluationType): Promise<EvaluationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
      PROPERTY AUDIT REQUEST (Current Date: ${new Date().toLocaleDateString()}):
      Hotel: "${hotelName}"
      City: "${city}"
      Type: ${type}

      LIVE DATA SCRAPING PROTOCOL:
      1. TREEBO.COM VERIFICATION: Search "site:treebo.com hotels in ${city}". Look for the text "Showing X hotels" on the page. Set 'cityHotelCount' to X.
      2. PROXIMITY AUDIT: Search "distance between ${hotelName} ${city} and nearest Treebo property". Identify the closest property name and distance in km.
      3. GUEST REVIEWS: Search for "${hotelName} ${city} reviews" specifically on Booking.com, MakeMyTrip, and Agoda. Populating guestReviews with all three is mandatory.
      4. CHANNEL AUDIT: Check if "${hotelName}" is live on MMT, Booking, Agoda.
      
      Return JSON conforming to the schema. If data is unavailable for a specific field, provide an industry-standard benchmark but indicate it is an estimate in the justification.`,
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
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      result.groundingSources = chunks.filter((c: any) => c.web).map((c: any) => ({ title: c.web.title || 'Source', uri: c.web.uri }));
    }
    return result;
  } catch (err: any) {
    if (err.message?.includes('xhr error') || err.message?.includes('code: 6')) {
      throw new Error("High-speed audit gateway is busy. Please try again in a few seconds.");
    }
    throw err;
  }
};
