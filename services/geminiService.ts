
import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationResult, EvaluationType, OTAStatus, EvaluationDecision } from "../types";

const SYSTEM_INSTRUCTION = `
You are a Senior Commercial & Strategy Leader at Treebo Hotels. 
Conduct a high-fidelity commercial audit using live Google Search grounding.

CORE DIRECTIVE - TREEBO NETWORK SYNERGY:
You MUST provide 100% accurate, live data for the Treebo Presence section using Treebo.com as the primary source.
1. Perform live searches: "site:treebo.com hotels in [CITY]" to extract exact counts.
2. Identify nearest neighbor distance and name.

UNIT INVENTORY INTEGRITY AUDIT (CRITICAL - CROSS-CHANNEL PARITY):
1. SEARCH PROTOCOL: Search "[HOTEL NAME] [CITY] room types site:booking.com" AND "[HOTEL NAME] [CITY] room types site:makemytrip.com".
2. NOMENCLATURE CHECK: If the property is a Treebo, look for mapping of 'Oak', 'Maple', 'Mahogany'.
3. CONFIGURATION RISK: Identify if room sizes or bed types differ between platforms.
4. AMENITY PARITY: Check for discrepancies in inclusions between MMT and Booking.

MANDATORY OTA CHANNEL AUDIT (THESE 6 MUST BE INCLUDED):
1. treebo.com
2. MakeMyTrip (MMT)
3. Booking.com
4. Agoda
5. Goibibo
6. Google Maps (GMB)

COMPETITIVE INDEX (3KM RADIUS): Identify 4 local peers with 3 positive/negative sentiment themes each.

OUTPUT FORMAT:
Return ONLY a valid JSON object. Do not include any text before or after the JSON.
Ensure all fields are populated correctly. If a value is missing, use a safe default like 0, [], or "N/A".`;

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
      1. UNIT INVENTORY INTEGRITY: Scrape and compare room configurations from site:booking.com and site:makemytrip.com for ${hotelName} ${city}. 
      2. SYNERGY AUDIT: Count Treebo properties in ${city} via site:treebo.com.
      3. CHANNEL AUDIT: Verify presence/ratings on exactly 6 platforms: Treebo, MMT, Booking, Agoda, Goibibo, GMB.
      4. COMPETITIVE INDEX (3KM): Fetch data for 4 peers.
      
      Return as valid JSON.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
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
            treeboPresence: {
              type: Type.OBJECT,
              properties: {
                cityHotelCount: { type: Type.NUMBER },
                nearestHotelName: { type: Type.STRING },
                nearestHotelDistance: { type: Type.STRING },
                marketShareContext: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    if (!response.text) throw new Error("Strategic audit engine timed out.");
    
    let parsed: any = JSON.parse(response.text.trim());

    // --- REPAIR LAYER START ---
    
    // Ensure executiveSummary is valid
    if (!parsed.executiveSummary || typeof parsed.executiveSummary !== 'object') {
      parsed.executiveSummary = {
        hotelName, city, evaluationType: type,
        finalDecision: EvaluationDecision.CONDITIONAL,
        averageScore: 5.0
      };
    }
    parsed.executiveSummary.averageScore = Number(parsed.executiveSummary.averageScore) || 5.0;

    // Ensure protocolStatus is valid
    if (!parsed.protocolStatus || typeof parsed.protocolStatus !== 'object') {
      parsed.protocolStatus = {
        duplicationAudit: OTAStatus.WARNING,
        geoVerification: OTAStatus.WARNING,
        complianceAudit: OTAStatus.WARNING,
        notes: "Automated protocol verification generated default status."
      };
    }

    // Ensure all 6 mandatory OTA platforms are present
    const mandatoryPlatforms = [
      { id: 'treebo', name: 'treebo.com' },
      { id: 'makemytrip', name: 'MakeMyTrip' },
      { id: 'booking', name: 'Booking.com' },
      { id: 'agoda', name: 'Agoda' },
      { id: 'goibibo', name: 'Goibibo' },
      { id: 'google', name: 'Google Maps' }
    ];

    if (!Array.isArray(parsed.otaAudit)) parsed.otaAudit = [];
    
    mandatoryPlatforms.forEach(plat => {
      const exists = parsed.otaAudit.some((a: any) => 
        (a.platform || '').toLowerCase().includes(plat.id)
      );
      if (!exists) {
        parsed.otaAudit.push({
          platform: plat.name,
          status: OTAStatus.WARNING,
          currentRating: 'N/A',
          channelBlockers: ['Platform status not explicitly returned by engine'],
          recoveryPlan: [`Manual verification required for ${plat.name}`]
        });
      }
    });

    // Ensure numeric fields are numbers to prevent toFixed crashes
    if (Array.isArray(parsed.competitors)) {
      parsed.competitors.forEach((c: any) => {
        c.otaRating = Number(c.otaRating) || 0;
      });
    }

    if (Array.isArray(parsed.scorecard)) {
      parsed.scorecard.forEach((s: any) => {
        s.score = Number(s.score) || 0;
      });
    }

    if (parsed.targetHotelMetrics) {
      parsed.targetHotelMetrics.averageOTARating = Number(parsed.targetHotelMetrics.averageOTARating) || 0;
      parsed.targetHotelMetrics.estimatedADR = Number(parsed.targetHotelMetrics.estimatedADR) || 0;
    }

    // Grounding Sources Extraction
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({ title: chunk.web.title || 'Source', uri: chunk.web.uri }));
    
    parsed.groundingSources = sources;
    // --- REPAIR LAYER END ---

    return parsed as EvaluationResult;
  } catch (err: any) {
    console.error("Gemini Service Error:", err);
    throw err;
  }
};
