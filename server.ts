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
    console.log("FIREBASE_SERVICE_ACCOUNT_KEY is missing. Firebase Admin will not run.");
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
    console.log("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", error);
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

  function isQuotaError(err: any): boolean {
    if (!err) return false;
    const msg = typeof err.message === 'string' ? err.message : "";
    const str = String(err);
    const combined = (msg + " " + str).toLowerCase();
    
    if (combined.includes("429") || 
        combined.includes("quota") || 
        combined.includes("exhausted") || 
        combined.includes("limit_reached") || 
        combined.includes("rate_limit")) return true;
    
    // Support nested error structures from @google/genai ApiError
    if (err.error && (err.error.code === 429 || err.error.status === 'RESOURCE_EXHAUSTED')) return true;
    if (err.status === 429 || err.code === 429) return true;
    return false;
  }

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
        if (isQuotaError(err)) {
          console.log(`Model ${activeModel} exhausted or rate-limited. Trying next fallback...`);
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
  // Smart Planner: Generate 3-day itinerary using Gemini
  app.post("/api/smart-planner/itinerary", async (req, res) => {
    try {
      const { bookmarks, travelHistory, preferences } = req.body;
      
      const prompt = `
        You are an advanced AI travel curator. Based on the following user data, create a highly personalized 3-day travel itinerary.
        
        User Bookmarks (Places they are interested in):
        ${JSON.stringify(bookmarks)}
        
        User Travel History (Places they have visited):
        ${JSON.stringify(travelHistory)}
        
        User Preferences (Moods, categories, etc.):
        ${JSON.stringify(preferences)}

        Task:
        1. Analyze the vibe of their bookmarks (e.g., preference for nature, cafes, or landmarks).
        2. Look at their travel history to avoid suggesting duplicates or to double down on what they love.
        3. Generate a 3-day itinerary with:
           - 2-3 logical stops per day.
           - For each stop, provide a name, approximate time of day, and a 'why' (reasoning based on their profile).
           - Provide one 'Cultural Pro-Tip' per day specific to the primary location/city.
           - Estimate a total daily spend (budget) in USD.

        Provide the response in raw JSON format with the following structure:
        {
          "title": "A 3-Day Journey through [City Name]",
          "days": [
            {
              "day": 1,
              "theme": "Theme name",
              "stops": [{ "name": "Stop Name", "time": "Morning", "reason": "Reason based on bookmarks" }],
              "culturalTip": "Cultural tip text",
              "estimatedBudget": 50
            }
          ],
          "overallSummary": "1-2 sentence summary of the trip vibe"
        }
        
        Only return the raw JSON object.
      `;

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const itinerary = JSON.parse(response.text || "{}");
      res.json(itinerary);
    } catch (err: any) {
      console.log("Smart Planner Error:", err);
      res.status(500).json({ error: "Failed to generate AI itinerary" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Trip Summary AI generator
  app.post("/api/summarize-log", async (req, res) => {
    try {
      const { favorites } = req.body;
      const prompt = `You are an elegant travel companion AI. Process these saved locations from today's trip and weave them into a short, beautifully written chronological travel log (max 3 paragraphs). Write in the first person ("We started our day...", "I visited..."). Be descriptive and imaginative about the journey between these spots. Keep the output formatted in Markdown.
      
      Saved locations today:
      ${favorites.map((f: any) => `- ${f.name} (${f.type}): ${f.note}`).join('\n')}
      `;

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt
      });

      res.json({ summary: response.text });
    } catch (err: any) {
      console.log(err);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  // AI Recommendations
  app.post("/api/ai-recommendations", async (req, res) => {
    try {
      const { savedPlaces } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
      }

      if (!savedPlaces || savedPlaces.length === 0) {
        return res.json({ recommendations: [] });
      }

      const prompt = `
        Based on the following places a user has saved in their travel journal, suggest 4 new similar POIs (Points of Interest) that they might enjoy visiting next.
        Focus on places that share the same vibe, theme, or category (e.g., if they like art, suggest museums; if they like outdoor parks, suggest nature spots).
        Provide the response in raw JSON format as an array of objects with the following keys:
        - name: The name of the place
        - reason: A short 1-sentence reason why it is recommended
        - lat: Provide an approximate latitude for this trending place (or 0 if unknown)
        - lng: Provide an approximate longitude for this trending place (or 0 if unknown)

        Saved places footprint:
        ${JSON.stringify(savedPlaces)}
        
        Only return the raw JSON array.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      
      let rawText = response.text || "[]";
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const recommendations = JSON.parse(rawText);
      res.json({ recommendations });
    } catch (e) {
      console.log("AI Recommendations Error:", e);
      res.json({ 
        recommendations: [
          { name: "Coffee Roasting Masterclass", reason: "Similar to places you frequently interact with.", lat: 0, lng: 0 }
        ] 
      });
    }
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
        2. When searching for locations, use the provided 'Current Map Context' (lat, lng, bounds) to refine your search. If context is provided, prioritize searching for places within or near those coordinates.
        3. When searching for locations, use 'googleMaps' grounding for rich details.
        4. ALWAYS use the 'showPlaces' tool when you identify specific points of interest (POIs) that should be displayed on the map.
        5. For travel planning, use 'showRoute' to visualize paths.
        6. Use 'setFlightMode' to start or stop a cinematic orbiting camera view around the current location.
        7. When simulating a world, use 'setMapStyle' to switch to immersive modes like 'Simulation', 'Genie', 'Night', or 'Neo-Tokyo'.
        8. Provide rich inline responses. If you found places via grounding, include them in your description.
        9. Always maintain a sophisticated, helpful DeepMind-inspired tone.
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
          toolConfig: { 
            includeServerSideToolInvocations: true,
            retrievalConfig: context?.center ? {
              latLng: {
                latitude: context.center.lat,
                longitude: context.center.lng
              }
            } : undefined
          }
        }
      });

      res.json({ 
        text: response.text, 
        functionCalls: response.functionCalls,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata 
      });
    } catch (err: any) {
      console.log("Chat endpoint error:", err);
      const isQuota = isQuotaError(err);
      if (isQuota) {
        console.log("API quota exhausted in Chatbot. Providing elegant simulated offline response...");
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
      console.log("Weather Tile proxy error:", err);
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
      console.log(err);
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
          console.log(`OpenWeatherMap call failed with status ${response.status}: ${response.statusText}`);
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
      console.log("OpenWeatherMap proxy failed:", err);
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
  app.post("/api/smart-route", async (req, res) => {
    try {
      const { origin, destination, weatherData, atmosphereTrends } = req.body;
      const prompt = `
        As an advanced AI travel router, calculate the most SCENIC and ATMOSPHERIC route from ${JSON.stringify(origin)} to ${JSON.stringify(destination)}.
        
        Current Context:
        - Weather: ${JSON.stringify(weatherData)}
        - Local Atmosphere Trends: ${JSON.stringify(atmosphereTrends)}
        
        Task:
        1. Prioritize aesthetic paths (parks, waterfronts, historic districts) over the fastest highway routes.
        2. Adjust recommendations based on atmosphere (e.g., if trend is 'chill', suggest quiet gardens; if 'vibrant', suggest busy markets).
        3. Provide a 'Scenic Score' (0-100).
        4. List 3 scenic waypoints with a brief 'why'.

        Provide the response in raw JSON format:
        {
          "scenicScore": 95,
          "routeAnalysis": "Reasoning based on weather/atmosphere",
          "waypoints": [
            { "name": "Waypoint Name", "lat": 0, "lng": 0, "whyContent": "Why this is scenic right now" }
          ],
          "estimatedTimeAdjustment": "+15 min"
        }
      `;

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (err: any) {
      console.log("Smart route error:", err);
      res.status(500).json({ error: "Failed to calculate scenic route" });
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
      console.log("Route optimization error:", err);
      const isQuota = isQuotaError(err);
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

  app.post("/api/magic-schedule", async (req, res) => {
    try {
      const { places } = req.body;
      const prompt = `You are an expert travel planner. I have the following list of places to visit: 
${JSON.stringify(places)}

Create an optimal chronological daily schedule (e.g. 09:00 AM - 10:30 AM). Optimize for distance and logical flow.
IMPORTANT: Return a JSON array of objects, where each object corresponds EXACTLY to one of the input places (matching the 'id' field).
Format:
[
  { "id": "place_id_1", "timeSlot": "09:00 AM - 11:00 AM", "aiNote": "Great morning spot for coffee." },
  ...
]`;

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are a precise JSON response bot. Never output markdown around the JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                timeSlot: { type: Type.STRING },
                aiNote: { type: Type.STRING }
              }
            }
          }
        }
      });

      const parsed = JSON.parse(response.text || "[]");
      res.json({ schedule: parsed });
    } catch (err: any) {
      console.log("Magic schedule error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Trip planner endpoint
  app.post("/api/plan-trip", async (req, res) => {
    try {
      const { placeDetails } = req.body;
      const cacheKey = placeDetails?.name ? `itinerary_${Buffer.from(placeDetails.name).toString('hex').slice(0, 32)}` : null;
      if (cacheKey && firebaseAdminInitialized) {
        try {
          const cacheDoc = await admin.firestore().collection('vanti_cache').doc(cacheKey).get();
          if (cacheDoc.exists) {
            return res.json({ itinerary: cacheDoc.data()?.itinerary });
          }
        } catch (cacheErr) {
          console.log("Cache read failed:", cacheErr);
        }
      }
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
      const itineraryResult = JSON.parse(response.text || "[]");
      if (cacheKey && firebaseAdminInitialized && itineraryResult.length > 0) {
        admin.firestore().collection('vanti_cache').doc(cacheKey).set({
          itinerary: itineraryResult,
          locationName: placeDetails.name,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        }).catch(e => console.log("Cache write failed:", e));
      }
      res.json({ itinerary: itineraryResult });
    } catch (err: any) {
      const isQuota = isQuotaError(err);
      if (isQuota) {
        console.log("Trip plan quota error:", err.message || err);
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

  app.post("/api/ai-itinerary/generate", async (req, res) => {
    try {
      const { viewport, interests, days } = req.body;
      const numDays = days || 1;
      const lat = viewport?.center?.lat || 37.5665;
      const lng = viewport?.center?.lng || 126.9780;
      const bounds = viewport?.bounds;
      const selectedInterests = (interests && interests.length > 0) ? interests.join(", ") : "general local sights, cafe, food";

      const boundsStr = bounds 
        ? `north ${bounds.north}, south ${bounds.south}, east ${bounds.east}, west ${bounds.west}` 
        : `lat around ${lat}, lng around ${lng}`;

      const prompt = `You are a highly professional local tour guide and AI travel itinerary generator.
I want to establish a perfectly tailored ${numDays}-day tour plan in the city/area centering around coordinates (lat: ${lat}, lng: ${lng}).
The current map view limits (bounds) are: ${boundsStr}.
My specific travel interests/categories are: ${selectedInterests}.

Generate a sequential, exciting ${numDays}-day daily itinerary suited perfectly for this viewport area.
For each day, provide a set of cohesive hourly/timed activities that make sense logistically (geographic proximity).
You MUST output real, specific local places or landmarks (POIs) that exist in that area. For example, if center is in Seoul, suggest places like 'Gyeongbokgung Palace', 'Bukchon Hanok Village', or nearby trending Cafes/Restaurants. 

Provide coordinates (latitude, longitude) for each place. The coords must be realistic, highly accurate numbers in that locale (or slightly outside, matching the real place location).

IMPORTANT: You MUST complete your draft as valid JSON conforming exactly to the schema requested.
Format:
{
  "days": [
    {
      "dayNumber": 1,
      "title": "Day 1 Title",
      "activities": [
        {
          "timeSlot": "09:00 AM - 11:00 AM",
          "placeName": "Real Place Name",
          "lat": 37.58,
          "lng": 126.98,
          "description": "Engaging description...",
          "transitRecommendation": "Walk 10 mins / Bus 272"
        }
      ]
    }
  ],
  "summary": "AI general travel style advisor summary..."
}`;

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are a precise travel guide JSON response bot. Never output markdown around the JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              days: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayNumber: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    activities: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          timeSlot: { type: Type.STRING },
                          placeName: { type: Type.STRING },
                          lat: { type: Type.NUMBER },
                          lng: { type: Type.NUMBER },
                          description: { type: Type.STRING },
                          transitRecommendation: { type: Type.STRING }
                        }
                      }
                    }
                  }
                }
              },
              summary: { type: Type.STRING }
            }
          }
        }
      });

      const itineraryResult = JSON.parse(response.text || "{}");
      res.json(itineraryResult);
    } catch (err: any) {
      console.log("AI Itinerary generate failed:", err);
      const fallbackLat = req.body?.viewport?.center?.lat || 37.5665;
      const fallbackLng = req.body?.viewport?.center?.lng || 126.9780;
      res.json({
        days: [
          {
            dayNumber: 1,
            title: "Simulated Explorer Day",
            activities: [
              {
                timeSlot: "09:30 AM - 11:30 AM",
                placeName: "Scenic Central Hub",
                lat: fallbackLat,
                lng: fallbackLng,
                description: "The beautiful center landmark of your current map view area.",
                transitRecommendation: "Walk or cycle from hotel"
              },
              {
                timeSlot: "12:00 PM - 01:30 PM",
                placeName: "Artisanal Neighborhood Cafe",
                lat: fallbackLat + 0.005,
                lng: fallbackLng - 0.003,
                description: "Sip on local coffee while looking over the street traffic.",
                transitRecommendation: "Walk 5 mins northwest"
              }
            ]
          }
        ],
        summary: "Notice: Using offline simulated backups due to heavy API load. Your localized itinerary is perfectly set up around current map viewport."
      });
    }
  });

  app.post("/api/transit-route", async (req, res) => {
    try {
      const { origin, destination } = req.body;
      if (!origin || !destination) {
        return res.status(400).json({ error: "Missing origin or destination coordinates" });
      }

      const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY || "";
      if (apiKey) {
        try {
          const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=transit&departure_time=now&key=${apiKey}`;
          const response = await fetch(url);
          const data = await response.json();
          if (data.status === "OK" && data.routes && data.routes.length > 0) {
            return res.json(data);
          } else {
            console.warn("Directions API returned non-OK status:", data.status, data.error_message || "");
          }
        } catch (apiErr) {
          console.error("Failed to query Directions API directly, falling back to simulated transit mapping:", apiErr);
        }
      }

      // High-quality simulated Directions API JSON fallback for multi-modal travel options!
      const distance = Math.sqrt(
        Math.pow(destination.lat - origin.lat, 2) + Math.pow(destination.lng - origin.lng, 2)
      );
      const distanceKm = distance * 111 * 1.35;
      const durationMin = Math.round(distanceKm * 4 + 6);

      const midLat1 = origin.lat + (destination.lat - origin.lat) * 0.25;
      const midLng1 = origin.lng + (destination.lng - origin.lng) * 0.25;
      const midLat2 = origin.lat + (destination.lat - origin.lat) * 0.75;
      const midLng2 = origin.lng + (destination.lng - origin.lng) * 0.75;

      const mockRoute = {
        status: "OK",
        routes: [{
          summary: "Metro Line 1 & Blue Bus Line",
          legs: [{
            distance: { text: `${distanceKm.toFixed(1)} km`, value: Math.round(distanceKm * 1000) },
            duration: { text: `${durationMin} mins`, value: durationMin * 60 },
            start_address: "Origin",
            end_address: "Destination",
            start_location: origin,
            end_location: destination,
            steps: [
              {
                travel_mode: "WALKING",
                html_instructions: "Walk to nearest transit station",
                distance: { text: "250 m" },
                duration: { text: "3 mins" },
                start_location: origin,
                end_location: { lat: midLat1, lng: midLng1 }
              },
              {
                travel_mode: "TRANSIT",
                html_instructions: "Take subway Line Metro 1 toward City Center",
                distance: { text: `${(distanceKm * 0.5).toFixed(1)} km` },
                duration: { text: `${Math.round(durationMin * 0.5)} mins` },
                start_location: { lat: midLat1, lng: midLng1 },
                end_location: { lat: midLat2, lng: midLng2 },
                transit_details: {
                  line: {
                    name: "Seoul Metro Line 1",
                    short_name: "Metro 1",
                    color: "#0047a0",
                    text_color: "#ffffff",
                    vehicle: { type: "SUBWAY", name: "Subway" }
                  },
                  num_stops: Math.max(1, Math.round(distanceKm * 0.8)),
                  departure_stop: { name: "Local Station" },
                  arrival_stop: { name: "Exchange Hub" }
                }
              },
              {
                travel_mode: "TRANSIT",
                html_instructions: "Take Blue Bus #143 right outside Exit 4",
                distance: { text: `${(distanceKm * 0.3).toFixed(1)} km` },
                duration: { text: `${Math.round(durationMin * 0.3)} mins` },
                start_location: { lat: midLat2, lng: midLng2 },
                end_location: { lat: destination.lat - (destination.lat - origin.lat) * 0.05, lng: destination.lng - (destination.lng - origin.lng) * 0.05 },
                transit_details: {
                  line: {
                    name: "City Blue Bus #143",
                    short_name: "Bus 143",
                    color: "#3b82f6",
                    text_color: "#ffffff",
                    vehicle: { type: "BUS", name: "Bus" }
                  },
                  num_stops: Math.max(1, Math.round(distanceKm * 0.4)),
                  departure_stop: { name: "Transit Terminal" },
                  arrival_stop: { name: "Destination Stop" }
                }
              },
              {
                travel_mode: "WALKING",
                html_instructions: "Walk to destination",
                distance: { text: "120 m" },
                duration: { text: "2 mins" },
                start_location: { lat: destination.lat - (destination.lat - origin.lat) * 0.05, lng: destination.lng - (destination.lng - origin.lng) * 0.05 },
                end_location: destination
              }
            ]
          }],
          overview_polyline: {
            points: ""
          }
        }]
      };

      res.json(mockRoute);
    } catch (err: any) {
      console.error("Transit action crashed:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Intelligence route: analyze location context
  app.post("/api/analyze-location", async (req, res) => {
     try {
       const { placeDetails } = req.body;
       const cacheKey = placeDetails?.name ? `analysis_${Buffer.from(placeDetails.name).toString('hex').slice(0, 32)}` : null;
       if (cacheKey && firebaseAdminInitialized) {
         try {
           const cacheDoc = await admin.firestore().collection('vanti_cache').doc(cacheKey).get();
           if (cacheDoc.exists) {
             return res.json({ analysis: cacheDoc.data()?.analysis });
           }
         } catch (cacheErr) {
           console.log("Cache read failed:", cacheErr);
         }
       }
       const prompt = `Analyze this place and give a short, high-level summary of what it is, when is the best time to visit, and what people typically do here:\n\n${JSON.stringify(placeDetails)}`;
       
       const response = await generateContentWithFallback({
         model: 'gemini-3.5-flash',
         contents: prompt,
         config: {
           tools: [{ googleSearch: {} }],
         }
       });

       const analysisResult = response.text;
       if (cacheKey && firebaseAdminInitialized && analysisResult) {
         admin.firestore().collection('vanti_cache').doc(cacheKey).set({
           analysis: analysisResult,
           locationName: placeDetails.name,
           timestamp: admin.firestore.FieldValue.serverTimestamp()
         }).catch(e => console.log("Cache write failed:", e));
       }
       res.json({ analysis: analysisResult });
     } catch (err: any) {
       const isQuota = isQuotaError(err);
       if (isQuota) {
         console.log("Analyze location error (QUOTA EXHAUSTED):", err.message || err);
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

  app.post("/api/audio-guide", async (req, res) => {
    try {
      const { placeName, details } = req.body;
      const prompt = `Create a succinct, engaging spoken-word overview for someone visiting "${placeName}". 
      Context: ${JSON.stringify(details || {})}.
      The output should be a natural-sounding script designed to be read by a text-to-speech engine. 
      Limit to 60 words. Highlight the 'wow' factor of the location.`;

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt
      });

      res.json({ script: response.text });
    } catch (err: any) {
      console.log("Audio guide generation failed:", err);
      res.status(500).json({ error: "Failed to generate audio script" });
    }
  });

  // Journey Recap generator using Gemini AI
  app.post("/api/journey-recap", async (req, res) => {
    try {
      const { places, moods } = req.body;
      const prompt = `Create a short, poetic highlight reel (2 paragraphs) summarizing a recent travel journey.
      Visited Locations:
      ${places.map((p: any) => `- ${p.name || 'Unknown Location'}`).join('\n')}
      
      Atmosphere Moods experienced:
      ${moods.map((m: any) => `[${m.emoji}] ${m.text}`).join('\n')}
      
      Weave these into a single thematic story reflecting the vibes and the path taken. Keep it concise, engaging, and suitable for social media. Format as Markdown.`;

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are an enthusiastic and observant travel writer recapping a personal journey.",
        }
      });

      res.json({ recap: response.text });
    } catch (err: any) {
      console.log("Journey recap error:", err);
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
      console.log("Trip recap error:", err);
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
      console.log("Cost calculation error:", err);
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
      console.log("Hidden gems error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Real-time currency exchange rate proxy
  app.get("/api/exchange-rates/:base", async (req, res) => {
    try {
      const { base } = req.params;
      // Using a reliable free open currency API
      const response = await fetch(`https://open.er-api.com/v6/latest/${base.toUpperCase()}`);
      if (!response.ok) throw new Error("Failed to fetch exchange rates");
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.log("Currency API error:", err);
      res.status(500).json({ error: "Failed to fetch rates" });
    }
  });

  // AI Travel Journal Image Generation
  app.post("/api/generate-journal-image", async (req, res) => {
    try {
      const { prompt, locationName } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      console.log(`Generating travel journal cover image for location: ${locationName}`);
      const finalPrompt = `Curated high-quality professional travel photography of ${locationName || 'a beautiful landmark'}, cinematic lighting, masterpiece, capturing the notebook sketch and travel feeling of: ${prompt}`;

      let base64Image: string | null = null;
      let lastImageErr: any = null;
      
      // Try gemini-2.5-flash-image
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: finalPrompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: "16:9"
            }
          }
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              base64Image = part.inlineData.data;
              break;
            }
          }
        }
      } catch (err) {
        lastImageErr = err;
        console.log("gemini-2.5-flash-image failed, trying fallback...", err);
      }

      // If failed, fallback to gemini-3.1-flash-image
      if (!base64Image) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image',
            contents: {
              parts: [{ text: finalPrompt }]
            },
            config: {
              imageConfig: {
                aspectRatio: "16:9",
                imageSize: "512px"
              }
            }
          });

          if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData?.data) {
                base64Image = part.inlineData.data;
                break;
              }
            }
          }
        } catch (err) {
          lastImageErr = err;
          console.log("gemini-3.1-flash-image also failed:", err);
        }
      }

      if (!base64Image) {
        if (isQuotaError(lastImageErr)) {
           return res.json({ imageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80" }); // fallback landscape
        }
        throw new Error("Unable to generate image from any image generation model");
      }

      const imageUrl = `data:image/jpeg;base64,${base64Image}`;
      res.json({ imageUrl });
    } catch (err: any) {
      console.log("Travel Journal Image Generation Error:", err);
      if (isQuotaError(err)) {
        return res.json({ imageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80" });
      }
      res.status(500).json({ error: err.message || "Failed to generate cover image" });
    }
  });

  // AI Local Guide endpoint
  app.post("/api/ai-local-guide", async (req, res) => {
    try {
      const { location } = req.body;
      if (!location) {
        return res.status(400).json({ error: "Location is required" });
      }

      console.log(`Generating local guide for: ${location}`);
      const prompt = `As a local expert, provide 3 essential cultural tips and 3 useful local phrases (with pronunciation) for visitors to ${location}. Output ONLY valid JSON in this format: { "cultureTips": ["tip1", "tip2", "tip3"], "phrases": [{ "phrase": "Hello", "translation": "Bonjour", "pronunciation": "bon-zhoor" }] }`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: "application/json" }
      });

      const responseText = response.text || "{}";
      const guideData = JSON.parse(responseText);
      
      res.json(guideData);
    } catch (err: any) {
      console.log("AI Local Guide Error:", err);
      if (isQuotaError(err)) {
        return res.json({
          cultureTips: ["Keep interactions polite and formal", "Respect local customs and religious sites", "Tipping is appreciated but check if service is already included"],
          phrases: [
            { phrase: "Hello", translation: "Hello", pronunciation: "heh-loh" },
            { phrase: "Thank you", translation: "Thank you", pronunciation: "thayngk-yoo" },
            { phrase: "Excuse me", translation: "Excuse me", pronunciation: "ex-kyooz mee" }
          ]
        });
      }
      res.status(500).json({ error: "Failed to generate local guide" });
    }
  });

  // AI-driven Predictive Autocomplete Trending Destinations
  app.post("/api/trending-destinations", async (req, res) => {
    try {
      const { localTime, weather, locationContext, searchHistory } = req.body;
      
      const prompt = `Based on the current local time (${localTime}), weather conditions (${JSON.stringify(weather || "unknown")}), and the user's current location context (${JSON.stringify(locationContext || "unknown")}), predict 4 trending destinations that would be popular right now.
      Also consider the user's recent search history: ${JSON.stringify(searchHistory || [])}.
      Prioritize destinations that fit the time of day (e.g., breakfast spots in morning, bars at night) and weather (e.g., museums during rain).
      
      Output ONLY a JSON array of objects with:
      - name: The specific trending place name
      - category: One word category (e.g., Morning, Cozy, Nightlife, Indoor)
      - reason: A very short 3-5 word reason why it's trending (e.g., "Perfect for morning coffee", "Avoiding the rain")
      - lat: Approximate latitude
      - lng: Approximate longitude
      `;

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const suggestions = JSON.parse(response.text || "[]");
      res.json({ trending: suggestions });
    } catch (err: any) {
      console.log("Trending destinations error:", err);
      // Fallback trending spots
      res.json({
        trending: [
          { name: "Artisanal Coffee Roasters", category: "Morning", reason: "Locals choice for sunrise", lat: 37.56, lng: 126.97 },
          { name: "Contemporary Art Hub", category: "Indoor", reason: "Trending museum visit", lat: 37.57, lng: 126.98 },
          { name: "Neon Street Food Alley", category: "Nightlife", reason: "Highly active tonight", lat: 37.55, lng: 126.93 },
          { name: "Skyline Sunset Deck", category: "Scenic", reason: "Best views at this hour", lat: 37.54, lng: 127.01 }
        ]
      });
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
      console.log(err);
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
      console.log(err);
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
      console.log(err);
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
        console.log('WS Error:', err);
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
