
import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationResult, EvaluationType, OTAStatus, EvaluationDecision } from "../types";

const SYSTEM_INSTRUCTION = `
You are a Senior Commercial & Strategy Leader at Treebo Hotels. 
Conduct a high-fidelity commercial audit using live Google Search and Google Maps grounding.

CORE DIRECTIVE - TREEBO NETWORK SYNERGY:
You MUST provide 100% accurate, live data for the Treebo Presence section using Treebo.com as the primary source.
1. Perform live searches: "site:treebo.com hotels in [CITY]" to extract exact counts.
2. Identify nearest neighbor distance and name.

UNIT INVENTORY INTEGRITY AUDIT (CRITICAL - CROSS-CHANNEL PARITY):
You MUST ensure the inventory audit matches real-world listings on Booking.com and MakeMyTrip (MMT).
1. SEARCH PROTOCOL: Search "[HOTEL NAME] [CITY] room types site:booking.com" AND "[HOTEL NAME] [CITY] room types site:makemytrip.com".
2. NOMENCLATURE CHECK: If the property is a Treebo, look for mapping of 'Oak', 'Maple', 'Mahogany'.
3. CONFIGURATION RISK: Identify discrepancies in bed types or amenities between MMT and Booking.

COMPETITIVE INDEX (2KM RADIUS CLUSTER - MANDATORY):
1. Use Google Maps grounding to identify exactly 4 local peers located WITHIN A 2KM RADIUS of the target asset.
2. For EACH peer, examine exactly 3 recurring positive and 3 negative review themes from recent OTA data.
3. Distances MUST be relative to the target asset.

OTA CHANNEL LOGIC AUDIT (MANDATORY PLATFORMS):
You MUST audit and report status for these 6 platforms:
1. treebo.com
2. MakeMyTrip (MMT)
3. Booking.com
4. Agoda
5. Goibibo
6. Google Maps (GMB)

OUTPUT FORMAT:
Return ONLY a valid JSON object. Do not include any text before or after the JSON.
CRITICAL: The JSON must contain "executiveSummary", "otaAudit" (with all 6 channels), "protocolStatus", "scorecard", "keyRisks", and "competitors".
`;

export const evaluateHotel = async (
  hotelName: string, 
  city: string, 
  type: EvaluationType,
  userLocation?: { latitude: number; longitude: number }
): Promise<EvaluationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  // Use 2.5-flash for Maps grounding support
  const model = 'gemini-2.5-flash';
  
  const toolConfig: any = {};
  if (userLocation) {
    toolConfig.retrievalConfig = {
      latLng: {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `
      PROPERTY STRATEGY AUDIT (2KM CLUSTER):
      Asset: "${hotelName}"
      City: "${city}"
      Mode: ${type}

      EXECUTION PROTOCOL:
      1. COMPETITIVE INDEX: Find 4 competitors WITHIN 2KM using Google Maps.
      2. OTA AUDIT: Audit status for treebo.com, MMT, Booking.com, Agoda, Goibibo, and Google Maps.
      3. UNIT INVENTORY: Scrape/compare configurations from site:booking.com and site:makemytrip.com.
      
      Return as pure JSON. Ensure all 6 mandatory OTA channels are in the "otaAudit" array.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        toolConfig: toolConfig,
      },
    });

    const text = response.text || '';
    let jsonStr = text.trim();
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(jsonStr);
    } catch (e) {
      console.error("JSON Parsing Error:", e, "Raw text:", text);
      throw new Error("Invalid audit response format. Strategic engine failed to parse data.");
    }

    // --- REPAIR LAYER: Ensure data structures are valid ---
    
    // 1. Executive Summary Guard
    if (!parsedResult.executiveSummary) {
      parsedResult.executiveSummary = {
        hotelName: hotelName,
        city: city,
        evaluationType: type,
        finalDecision: EvaluationDecision.CONDITIONAL,
        averageScore: 5.0
      };
    }

    // 2. Protocol Status Guard
    if (!parsedResult.protocolStatus) {
      parsedResult.protocolStatus = {
        duplicationAudit: OTAStatus.WARNING,
        geoVerification: OTAStatus.WARNING,
        complianceAudit: OTAStatus.WARNING,
        notes: "Automatic fallback: Engine skipped protocol status population."
      };
    }

    // 3. Ensure Arrays are Arrays
    const arrayFields = ['scorecard', 'keyRisks', 'commercialUpside', 'otaAudit', 'competitors', 'roomTypeAudit'];
    arrayFields.forEach(field => {
      if (!Array.isArray(parsedResult[field])) {
        parsedResult[field] = [];
      }
    });

    // 4. MANDATORY OTA CHANNEL INTEGRITY
    const mandatoryOTAs = [
      { id: 'treebo', name: 'treebo.com' },
      { id: 'mmt', name: 'MakeMyTrip' },
      { id: 'booking', name: 'Booking.com' },
      { id: 'agoda', name: 'Agoda' },
      { id: 'goibibo', name: 'Goibibo' },
      { id: 'google', name: 'Google Maps' }
    ];

    mandatoryOTAs.forEach(mOta => {
      const exists = parsedResult.otaAudit.some((item: any) => 
        (item.platform || '').toLowerCase().includes(mOta.id)
      );
      
      if (!exists) {
        parsedResult.otaAudit.push({
          platform: mOta.name,
          status: OTAStatus.WARNING,
          channelBlockers: ["Platform audit yielded no response - investigate manually"],
          recoveryPlan: [`Verify listing status on ${mOta.name} immediately`],
          currentRating: "N/A"
        });
      }
    });

    // 5. Grounding Source Extraction
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: { title: string; uri: string }[] = [];
    
    for (const chunk of groundingChunks) {
      if (chunk.maps) {
        sources.push({ title: chunk.maps.title || 'Google Maps Source', uri: chunk.maps.uri });
      } else if (chunk.web) {
        sources.push({ title: chunk.web.title || 'Web Search Source', uri: chunk.web.uri });
      }
    }

    parsedResult.groundingSources = sources;
    return parsedResult as EvaluationResult;
    
  } catch (err: any) {
    console.error("Gemini Service Error:", err);
    throw err;
  }
};
