import { WebSocketServer } from "ws";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, GenerateVideosOperation, Type, FunctionDeclaration } from "@google/genai";
import * as admin from "firebase-admin";
import fs from "fs";
import { Readable } from "stream";

// Initialize Firebase Admin (lazy)
let firebaseAdminInitialized = false;
function initFirebaseAdmin() {
  if (firebaseAdminInitialized) return;
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is missing. Firebase Admin will not run.");
    return;
  }
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseAdminInitialized = true;
    console.log("Firebase Admin initialized");
  } catch (error) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // Initialize Gemini
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Helper to query Gemini with sequential model fallbacks (gemini-3.5-flash -> gemini-flash-latest -> gemini-3.1-flash-lite)
  async function generateContentWithFallback(params: {
    model: string;
    contents: any;
    config?: any;
  }) {
    const modelSequence = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let startIndex = modelSequence.indexOf(params.model);
    if (startIndex === -1) {
      startIndex = 0;
    }

    let lastError: any = null;

    for (let i = startIndex; i < modelSequence.length; i++) {
      const activeModel = modelSequence[i];
      try {
        console.log(`Attempting Gemini API with model: ${activeModel}...`);
        const result = await ai.models.generateContent({
          ...params,
          model: activeModel
        });
        console.log(`Gemini API succeeded with model: ${activeModel}`);
        return result;
      } catch (err: any) {
        lastError = err;
        const isQuotaError = err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("RESOURCE_EXHAUSTED") || err.status === 429;
        if (isQuotaError) {
          console.warn(`Model ${activeModel} exhausted or rate-limited. Trying next fallback...`);
          continue;
        }
        throw err;
      }
    }

    throw lastError;
  }

  // Offline backup query parser when Gemini quota limit is reached
  function parseOfflineChatRequest(message: string): { text: string; functionCalls?: any[] } {
    const msgLower = message.toLowerCase();
    const functionCalls: any[] = [];
    let replyText = `📡 **VANTi Offline Survival Core Activated** 📡\n\nGoogle Gemini API quota is currently exceeded (429 Rate Limit), but VANTi's reactive safety backup system is maintaining active control over the map!\n\n`;

    let recentered = false;
    const cities = [
      { names: ["seoul", "서울"], lat: 37.5665, lng: 126.9780, nameKor: "서울" },
      { names: ["tokyo", "도쿄", "토쿄"], lat: 35.6762, lng: 139.6503, nameKor: "도쿄" },
      { names: ["paris", "파리"], lat: 48.8566, lng: 2.3522, nameKor: "파리" },
      { names: ["new york", "뉴욕", "ny"], lat: 40.7128, lng: -74.0060, nameKor: "뉴욕" },
      { names: ["london", "런던"], lat: 51.5074, lng: -0.1278, nameKor: "런던" },
      { names: ["san francisco", "샌프란시스코", "sf"], lat: 37.7749, lng: -122.4194, nameKor: "샌프란시스코" },
      { names: ["sydney", "시드니"], lat: -33.8688, lng: 151.2093, nameKor: "시드니" }
    ];

    for (const city of cities) {
      if (city.names.some(n => msgLower.includes(n))) {
        functionCalls.push({
          name: "recenterMap",
          args: { lat: city.lat, lng: city.lng, zoom: 14, tilt: 45 }
        });
        replyText += `📍 Recenter command parsed: Automatically moving map to **${city.nameKor}** (${city.lat}, ${city.lng}).\n`;
        recentered = true;
        break;
      }
    }

    if (!recentered) {
      const latLngMatch = message.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
      if (latLngMatch) {
        const lat = parseFloat(latLngMatch[1]);
        const lng = parseFloat(latLngMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          functionCalls.push({
            name: "recenterMap",
            args: { lat, lng, zoom: 15, tilt: 45 }
          });
          replyText += `📍 Coordinate parser found matching coordinates: Moving map view directly to **${lat}, ${lng}**.\n`;
          recentered = true;
        }
      }
    }

    const styles = [
      { keyword: "night", value: "Night", label: "Night" },
      { keyword: "야간", value: "Night", label: "Night" },
      { keyword: "어두운", value: "Night", label: "Night" },
      { keyword: "simulation", value: "Simulation", label: "Simulation" },
      { keyword: "시뮬레이션", value: "Simulation", label: "Simulation" },
      { keyword: "genie", value: "Genie", label: "Genie" },
      { keyword: "지니", value: "Genie", label: "Genie" },
      { keyword: "retro", value: "Retro", label: "Retro" },
      { keyword: "레트로", value: "Retro", label: "Retro" },
      { keyword: "cosmic", value: "Cosmic", label: "Cosmic" },
      { keyword: "우주", value: "Cosmic", label: "Cosmic" },
      { keyword: "neo-tokyo", value: "Neo-Tokyo", label: "Neo-Tokyo" },
      { keyword: "네오도쿄", value: "Neo-Tokyo", label: "Neo-Tokyo" },
      { keyword: "네오 도쿄", value: "Neo-Tokyo", label: "Neo-Tokyo" },
      { keyword: "sketch", value: "Sketch", label: "Sketch" },
      { keyword: "스케치", value: "Sketch", label: "Sketch" },
      { keyword: "default", value: "Default", label: "Default" },
      { keyword: "기본", value: "Default", label: "Default" }
    ];

    for (const style of styles) {
      if (msgLower.includes(style.keyword)) {
        functionCalls.push({
          name: "setMapStyle",
          args: { style: style.value }
        });
        replyText += `🎨 Style command parsed: Adjusting local environment look to **${style.label}**.\n`;
        break;
      }
    }

    if (msgLower.includes("flight") || msgLower.includes("비행") || msgLower.includes("orbit") || msgLower.includes("공전") || msgLower.includes("회전")) {
      const stopKeywords = ["stop", "중지", "정지", "꺼", "끄"];
      const active = !stopKeywords.some(kw => msgLower.includes(kw));
      functionCalls.push({
        name: "setFlightMode",
        args: { active }
      });
      replyText += `🚁 Flight command parsed: Toggle flight mode to **${active ? "ON" : "OFF"}**.\n`;
    }

    const weatherOptions = [
      { keywords: ["rain", "비"], val: "Rain", label: "Rain" },
      { keywords: ["snow", "눈"], val: "Snow", label: "Snow" },
      { keywords: ["storm", "폭풍" , "번개"], val: "Storm", label: "Storm" },
      { keywords: ["clear", "맑음", "해"], val: "Clear", label: "Clear" }
    ];

    for (const w of weatherOptions) {
      if (w.keywords.some(kw => msgLower.includes(kw))) {
        functionCalls.push({
          name: "setWeather",
          args: { condition: w.val }
        });
        replyText += `☁️ Atmospheric condition parsed: Weather simulated as **${w.label}**.\n`;
        break;
      }
    }

    if (functionCalls.length === 0) {
      replyText += `VANTi offline survival core is fully responsive! You can use common actions directly:\n- **Location names** (e.g., *Seoul, Tokyo, Paris, New York, London, SF, Sydney*)\n- **Interactive styles** (e.g., *Simulation, Cosmic, Neo-Tokyo, Retro, Night*)\n- **Active camera orbits** (e.g., *flight mode, stop flight*)\n- **Active weather dynamics** (e.g., *rain, snow, storm, clear*)`;
    } else {
      replyText += `\nLocal simulation pipeline completed. Direct commands dispatched to map engine!`;
    }

    return {
      text: replyText,
      functionCalls: functionCalls.length > 0 ? functionCalls : undefined
    };
  }
  
  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Chat endpoint for Gemini chatbot
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, context, imageBase64 } = req.body;
      
      let contents: any[] = [];
      
      if (imageBase64) {
          const mimeType = imageBase64.split(';')[0].split(':')[1];
          const data = imageBase64.split(',')[1];
          contents.push({
              inlineData: {
                  data,
                  mimeType
              }
          });
      }

      const systemInstruction = `
        You are VANTi, an advanced geospatial agent built by Google DeepMind.
        You have direct access to map controls and can simulate real-world locations as if they were new worlds (Project Genie).
        
        Guidelines:
        1. When the user asks to see a place, use the 'recenterMap' tool.
        2. When searching for locations, use 'googleMaps' grounding for rich details.
        3. ALWAYS use the 'showPlaces' tool when you identify specific points of interest (POIs) that should be displayed on the map.
        4. For travel planning, use 'showRoute' to visualize paths.
        5. Use 'setFlightMode' to start or stop a cinematic orbiting camera view around the current location.
        6. When simulating a world, use 'setMapStyle' to switch to immersive modes like 'Simulation', 'Genie', 'Night', or 'Neo-Tokyo'.
        6. Provide rich inline responses. If you found places via grounding, include them in your description.
        7. Always maintain a sophisticated, helpful DeepMind-inspired tone.
      `;

      const prompt = `
        Current Map Context: ${JSON.stringify(context || {})}
        User Message: ${message}
      `;
      contents.push(prompt);

      const mapControlTools: FunctionDeclaration[] = [
        {
          name: "recenterMap",
          description: "Move the map view to a specific latitude and longitude.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              zoom: { type: Type.NUMBER, description: "Default is 15" },
              tilt: { type: Type.NUMBER, description: "Tilt in degrees (0-90). Use higher tilt for 3D views." }
            },
            required: ["lat", "lng"]
          }
        },
        {
          name: "setMapStyle",
          description: "Change the visual aesthetic of the map.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              style: { type: Type.STRING, enum: ["Default", "Night", "Simulation", "Genie", "Retro", "Cosmic", "Neo-Tokyo", "Sketch"] }
            },
            required: ["style"]
          }
        },
        {
          name: "setWeather",
          description: "Change the atmospheric conditions of the current world simulation.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              condition: { type: Type.STRING, enum: ["Rain", "Snow", "Clear", "Storm"] }
            },
            required: ["condition"]
          }
        },
        {
          name: "setMapMode",
          description: "Control specific map observation modes like 3D buildings and Terrain.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              mode: { type: Type.STRING, enum: ["3D", "2D", "Terrain", "Flat"] },
              active: { type: Type.BOOLEAN }
            },
            required: ["mode", "active"]
          }
        },
        {
          name: "setFlightMode",
          description: "Toggle cinematic drone-view flight mode (orbiting camera).",
          parameters: {
            type: Type.OBJECT,
            properties: {
              active: { type: Type.BOOLEAN }
            },
            required: ["active"]
          }
        },
        {
          name: "showPlaces",
          description: "Show one or more specific places/markers on the map.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              places: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    lat: { type: Type.NUMBER },
                    lng: { type: Type.NUMBER },
                    type: { type: Type.STRING, description: "e.g., restaurant, park, museum" },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "lat", "lng"]
                }
              }
            },
            required: ["places"]
          }
        },
        {
          name: "showRoute",
          description: "Visualize a travel route or series of stops on the map.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              origin: { type: Type.STRING },
              destination: { type: Type.STRING },
              stops: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["origin", "destination"]
          }
        },
        {
          name: "planTrip",
          description: "Create a custom travel itinerary with multiple locations.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              itinerary: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.NUMBER },
                    locations: { type: Type.ARRAY, items: { type: Type.STRING } },
                    notes: { type: Type.STRING }
                  }
                }
              }
            },
            required: ["itinerary"]
          }
        }
      ];

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction,
          tools: [
            { googleSearch: {} },
            { googleMaps: {} },
            { functionDeclarations: mapControlTools }
          ],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      });

      res.json({ 
        text: response.text, 
        functionCalls: response.functionCalls,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata 
      });
    } catch (err: any) {
      console.error("Chat endpoint error:", err);
      const isQuota = err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("RESOURCE_EXHAUSTED") || err.status === 429;
      if (isQuota) {
        console.warn("API quota exhausted in Chatbot. Providing elegant simulated offline response...");
        const offlineResult = parseOfflineChatRequest(req.body?.message || "");
        return res.json({
          text: offlineResult.text,
          functionCalls: offlineResult.functionCalls,
          groundingMetadata: null,
          isOffline: true
        });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/weather-tile/:layer/:MathZ/:x/:y", async (req, res) => {
    try {
      const { layer, MathZ, x, y } = req.params;
      const apiKey = process.env.OPENWEATHERMAP_API_KEY;
      if (!apiKey) {
        return res.status(500).send("OPENWEATHERMAP_API_KEY not configured");
      }
      const url = `https://tile.openweathermap.org/map/${layer}/${MathZ}/${x}/${y}.png?appid=${apiKey}`;
      const fetchRes = await fetch(url);
      if (!fetchRes.ok) {
        return res.status(fetchRes.status).send(`Failed to fetch weather tile: ${fetchRes.statusText}`);
      }
      const buffer = await fetchRes.arrayBuffer();
      res.setHeader('Content-Type', 'image/png');
      // Set permissive cache since it's weather data
      res.setHeader('Cache-Control', 'public, max-age=600');
      res.send(Buffer.from(buffer));
    } catch (err: any) {
      console.error("Weather Tile proxy error:", err);
      res.status(500).send(err.message);
    }
  });

  // Weather endpoint
  app.get("/api/weather/:lat/:lng", async (req, res) => {
    try {
      const { lat, lng } = req.params;
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&hourly=temperature_2m`);
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // OpenWeatherMap endpoint with robust fallback
  app.get("/api/weather/openweathermap/:lat/:lng", async (req, res) => {
    try {
      const { lat, lng } = req.params;
      const apiKey = process.env.OPENWEATHERMAP_API_KEY;

      if (apiKey) {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          return res.json({
            source: 'OpenWeatherMap',
            temp: data.main?.temp,
            description: data.weather?.[0]?.description,
            main: data.weather?.[0]?.main,
            humidity: data.main?.humidity,
            windSpeed: data.wind?.speed,
            clouds: data.clouds?.all || 0,
            coord: data.coord
          });
        } else {
          console.warn(`OpenWeatherMap call failed with status ${response.status}: ${response.statusText}`);
        }
      }

      // Fallback: If no API Key or call failed, fetch from Open-Meteo and convert to the same OpenWeatherMap structure
      const omRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`);
      const omData = await omRes.json();
      const temp = omData.current?.temperature_2m ?? 20;
      const code = omData.current?.weather_code ?? 0;

      // Map WMO codes to OpenWeatherMap Main categories
      let main = "Clear";
      let description = "clear sky";
      let clouds = 0;

      if (code > 0 && code <= 3) {
        main = "Clouds";
        description = code === 1 ? "mainly clear" : code === 2 ? "partly cloudy" : "overcast";
        clouds = code * 30;
      } else if (code >= 51 && code <= 67) {
        main = "Rain";
        description = "rainy";
        clouds = 80;
      } else if (code >= 71 && code <= 77) {
        main = "Snow";
        description = "snowy";
        clouds = 90;
      } else if (code >= 80 && code <= 82) {
        main = "Rain";
        description = "showers";
        clouds = 85;
      } else if (code >= 95) {
        main = "Thunderstorm";
        description = "thunderstorm with rain";
        clouds = 100;
      }

      res.json({
        source: 'OpenWeatherMap (Converted WMO Fallback)',
        temp,
        description,
        main,
        humidity: 60,
        windSpeed: 3.2,
        clouds,
        coord: { lat: parseFloat(lat), lon: parseFloat(lng) }
      });
    } catch (err: any) {
      console.error("OpenWeatherMap proxy failed:", err);
      res.json({
        source: 'OpenWeatherMap (Mock Offline Fallback)',
        temp: 18.5,
        description: "scattered clouds",
        main: "Clouds",
        humidity: 60,
        windSpeed: 2.1,
        clouds: 40,
        coord: { lat: parseFloat(req.params.lat), lon: parseFloat(req.params.lng) }
      });
    }
  });

  // Route optimization endpoint powered by weather & location
  app.post("/api/optimize-route", async (req, res) => {
    try {
      const { userLocation, weatherData, destination } = req.body;
      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: `Analyze route comfort from location (Lat: ${userLocation?.lat}, Lng: ${userLocation?.lng}) to destination "${destination || 'nearby hotspots'}" under the following weather conditions: ${JSON.stringify(weatherData)}. Suggest the most comfortable walking or transit routes, recommending transit if weather is poor and charming walks if weather is beautiful.`,
        config: {
          systemInstruction: "You are a state-of-the-art spatial router, providing route recommendations based on real-time weather details and geographical safety factors. Optimize for structural shelter (underground, indoor, transit hubs) during harsh weather, and scenic green loops during pleasant weather.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              comfortScore: { type: Type.NUMBER, description: "A score from 0 to 100 reflecting how comfortable a walk or transit is under current weather" },
              analysis: { type: Type.STRING, description: "Brief details explaining why this mode and route is selected based on the weather conditions" },
              suggestionType: { type: Type.STRING, description: "Whether 'walking' or 'transit' stands out as the optimal choice under this weather" },
              optimizedPathSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Sequential comfortable waypoints or route steps to follow"
              },
              safetyNotes: { type: Type.STRING, description: "Actionable preparation gear advice (e.g. umbrella, heavy clothing, hydration, SPF)" }
            },
            required: ["comfortScore", "analysis", "suggestionType", "optimizedPathSteps", "safetyNotes"]
          }
        }
      });
      res.json(JSON.parse(response.text || "{}"));
    } catch (err: any) {
      console.error("Route optimization error:", err);
      const isQuota = err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("RESOURCE_EXHAUSTED") || err.status === 429;
      if (isQuota) {
        const isWet = req.body.weatherData?.activeSimulatedCondition === 'Rain' || req.body.weatherData?.activeSimulatedCondition === 'Snow' || req.body.weatherData?.activeSimulatedCondition === 'Storm' || req.body.weatherData?.realtimeMetrics?.code > 50;
        return res.json({
          comfortScore: isWet ? 45 : 85,
          analysis: `📡 [VANTi Telemetry Backup Engine Active]\n\nBased on your coordinates and offline geofence metrics, we analyzed transit comfort to "${req.body.destination || 'Selected Destination'}". Since API is offline, offline routing suggests:`,
          suggestionType: isWet ? "transit" : "walking",
          optimizedPathSteps: isWet 
            ? [
                `Depart from area node, taking nearest sheltered subway entry`,
                `Ride transit line to target zone, minimizing street-level weather exposure`,
                `Exit via underpass directly into covered retail complex adjacent to target destination`
              ]
            : [
                `Begin pleasant pedestrian-friendly route crossing civic plazas`,
                `Follow leafy pathways and tree-lined avenues to destination`,
                `Arrive via scenic open-air observation viewpoint`
              ],
          safetyNotes: isWet 
            ? "⚠️ Highly recommended: Carry a compact umbrella, avoid slick sewer grates, and prefer connected underground retail routes."
            : "☀️ Highly recommended: Scenic walking conditions are optimal. Put on sunglasses and enjoy a leisure pace."
        });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // Trip planner endpoint
  app.post("/api/plan-trip", async (req, res) => {
    try {
      const { placeDetails } = req.body;
      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: `Create a custom 3-day travel itinerary checklist for: ${JSON.stringify(placeDetails)}. Give a realistic plan with 2-3 locations per day.`,
        config: {
          systemInstruction: "You are an expert travel planner.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.NUMBER },
                locations: { type: Type.ARRAY, items: { type: Type.STRING } },
                notes: { type: Type.STRING }
              }
            }
          }
        }
      });
      res.json({ itinerary: JSON.parse(response.text || "[]") });
    } catch (err: any) {
      console.error("Trip plan error:", err);
      const isQuota = err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("RESOURCE_EXHAUSTED") || err.status === 429;
      if (isQuota) {
        return res.json({ 
          fallback: true,
          itinerary: [
            { day: 1, locations: ["Arrive at " + (req.body.placeDetails?.name || "destination"), "Explore the surrounding neighborhood", "VANTi Local Dining"], notes: "API limit hit. Simulated Day 1." },
            { day: 2, locations: ["Visit nearest Landmark", "Scenic route walk"], notes: "Simulated Day 2." }
          ]
        });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // Intelligence route: analyze location context
  app.post("/api/analyze-location", async (req, res) => {
     try {
       const { placeDetails } = req.body;
       const prompt = `Analyze this place and give a short, high-level summary of what it is, when is the best time to visit, and what people typically do here:\n\n${JSON.stringify(placeDetails)}`;
       
       const response = await generateContentWithFallback({
         model: 'gemini-3.5-flash',
         contents: prompt,
         config: {
           tools: [{ googleSearch: {} }],
         }
       });

       res.json({ analysis: response.text });
     } catch (err: any) {
       console.error("Analyze location error:", err);
       const isQuota = err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("RESOURCE_EXHAUSTED") || err.status === 429;
       if (isQuota) {
         const { placeDetails } = req.body;
         const name = placeDetails?.name || "This location";
         const address = placeDetails?.address || "specified coordinates";
         return res.json({
           analysis: `📡 **VANTi Local Backup Analysis**\n\nGoogle Gemini API quota is currently exceeded, so VANTi has prepared a local analysis based on geospatial telemetry metadata:\n\n- **Target Location**: ${name}\n- **Address**: ${address}\n- **Telemetry Classification**: Highly active local zone.\n- **Recommended Action**: Use the VANTi Offline Survival Core chat module to adjust themes or initiate orbit flight surrounding this location.`
         });
       }
       res.status(500).json({ error: err.message });
     }
  });

  // Trip Recap generator using Gemini AI
  app.post("/api/trip-recap", async (req, res) => {
    try {
      const { groupName, snapshots } = req.body;
      const snapshotContext = snapshots.map((s: any) => `- ${s.locationName || s.address}\n  Photos: ${s.photoUrls?.length || 0}\n  Notes: ${s.notes || 'None'}`).join('\n');
      
      const prompt = `Create a structured narrative summary for our collaborative travel trip named "${groupName}".\n\nHere are the snapshots we took:\n${snapshotContext}\n\nMake it sound like an engaging travel blog post or diary entry, summarizing our journey chronologically or thematically. Keep it under 250 words. Format with markdown.`;

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are an enthusiastic and observant travel writer recapping a group trip.",
        }
      });

      res.json({ recap: response.text });
    } catch (err: any) {
      console.error("Trip recap error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // AI-driven cost calculator for transit and walking
  app.post("/api/calculate-transit-cost", async (req, res) => {
    try {
      const { origin, destination, locationContext } = req.body;
      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: `Estimate the transit and walking expenses for a trip from "${origin}" to "${destination}" in ${locationContext}. Include estimated costs for subway, bus, taxi, and walking (free). Provide a comparison and a recommendation.`,
        config: {
          systemInstruction: "You are a local transit expert. Provide realistic cost estimates in local currency and USD. Consider walking as free but factor in human energy/time.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              currency: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    mode: { type: Type.STRING },
                    costLocal: { type: Type.STRING },
                    costUSD: { type: Type.STRING },
                    notes: { type: Type.STRING }
                  }
                }
              },
              recommendation: { type: Type.STRING }
            },
            required: ["currency", "options", "recommendation"]
          }
        }
      });
      res.json(JSON.parse(response.text || "{}"));
    } catch (err: any) {
      console.error("Cost calculation error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // AI Hidden Gem suggestion engine
  app.post("/api/suggest-hidden-gems", async (req, res) => {
    try {
      const { currentPins, userLocation } = req.body;
      const pinContext = currentPins.map((p: any) => p.locationName).join(', ');
      const prompt = `Based on these currently visited spots: [${pinContext}] and the general user area at (${userLocation?.lat}, ${userLocation?.lng}), suggest 3 unique "hidden gem" locations nearby that are NOT standard main tourists traps. Use Google Search to find real, trendy, or deeply local spots.`;

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are a local cultural scout. Find places that are authentic, highly rated by locals, and slightly off the beaten path.",
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER },
                description: { type: Type.STRING },
                whyHiddenGem: { type: Type.STRING }
              },
              required: ["name", "lat", "lng", "description", "whyHiddenGem"]
            }
          }
        }
      });
      res.json({ suggestions: JSON.parse(response.text || "[]") });
    } catch (err: any) {
      console.error("Hidden gems error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Video generation endpoints
  app.post("/api/generate-video", async (req, res) => {
    try {
      const { prompt } = req.body;
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: prompt || 'A cinematic sweeping view of a city map interface, high tech, neon glows, flying over streets',
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });
      res.json({ operationName: operation.name });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/video-status", async (req, res) => {
    try {
      const { operationName } = req.body;
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      res.json({ done: updated.done });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/video-download", async (req, res) => {
    try {
      const { op: operationName } = req.query;
      if (!operationName || typeof operationName !== 'string') {
        return res.status(400).json({ error: "Missing operationName" });
      }
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) {
        return res.status(404).json({ error: "Video not ready" });
      }
      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY! },
      });
      res.setHeader('Content-Type', 'video/mp4');
      if (videoRes.body) {
        Readable.fromWeb(videoRes.body as any).pipe(res);
      } else {
        res.status(500).json({ error: "Empty video content" });
      }
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    initFirebaseAdmin();
  });

  // WebSocket Server for Live Collaboration Presence
  const wss = new WebSocketServer({ server });

  // tripId -> Map<ws, user>
  const tripPresence = new Map<string, Map<any, any>>();

  wss.on('connection', (ws: any) => {
    let currentTripId: string | null = null;
    let currentUser: any = null;

    function broadcastPresence(tripId: string) {
      const room = tripPresence.get(tripId);
      if (room) {
        const users = Array.from(room.values());
        // Simple deduplication by uid
        const uniqueUsers = Array.from(new Map(users.map(u => [u.uid, u])).values());
        for (const client of room.keys()) {
          if (client.readyState === 1) {
            client.send(JSON.stringify({ type: 'presence', users: uniqueUsers }));
          }
        }
      }
    }

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'join') {
          if (currentTripId) {
            const oldRoom = tripPresence.get(currentTripId);
            if (oldRoom) {
              oldRoom.delete(ws);
              broadcastPresence(currentTripId);
            }
          }
          currentTripId = data.tripId;
          currentUser = data.user;
          if (!tripPresence.has(currentTripId!)) {
            tripPresence.set(currentTripId!, new Map());
          }
          tripPresence.get(currentTripId!)!.set(ws, currentUser);
          broadcastPresence(currentTripId!);
        } else if (data.type === 'leave') {
          if (currentTripId) {
            const room = tripPresence.get(currentTripId);
            if (room) {
              room.delete(ws);
              broadcastPresence(currentTripId);
            }
            currentTripId = null;
          }
        }
      } catch (err) {
        console.error('WS Error:', err);
      }
    });

    ws.on('close', () => {
      if (currentTripId) {
        const room = tripPresence.get(currentTripId);
        if (room) {
          room.delete(ws);
          broadcastPresence(currentTripId);
        }
      }
    });
  });
}

startServer();
