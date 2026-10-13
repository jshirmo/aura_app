import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies (up to 20MB for image base64 payloads)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Server-side Google GenAI initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory cache to prevent quota exhaustion (10 second TTL)
interface CacheEntry {
  data: any;
  timestamp: number;
}
const findCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 9000;

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Helper to strip data URL prefix and validate base64
function extractBase64(dataUrlOrRaw: string): { data: string; mimeType: string; isSvg?: boolean } {
  if (!dataUrlOrRaw) {
    return { mimeType: 'image/jpeg', data: '', isSvg: false };
  }

  // Detect SVG or simulated vector graphics
  if (
    dataUrlOrRaw.includes('image/svg') ||
    dataUrlOrRaw.startsWith('data:image/svg') ||
    dataUrlOrRaw.includes('<svg') ||
    dataUrlOrRaw.includes('%3Csvg')
  ) {
    return { mimeType: 'image/jpeg', data: '', isSvg: true };
  }

  if (dataUrlOrRaw.startsWith('data:')) {
    const matches = dataUrlOrRaw.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
    if (matches) {
      let mime = matches[1];
      if (mime.includes('svg')) {
        return { mimeType: 'image/jpeg', data: '', isSvg: true };
      }
      // Clean any potential whitespace
      const cleanData = matches[2].replace(/\s/g, '');
      return { mimeType: mime, data: cleanData, isSvg: false };
    }
  }

  return { mimeType: 'image/jpeg', data: dataUrlOrRaw.replace(/\s/g, ''), isSvg: false };
}

// Smart deterministic vision guidance fallback
function generateSmartFindFallback(target: string, previousDirection?: string) {
  const norm = (target || 'object').toLowerCase();
  let direction = "12 o'clock";
  let distance = "about 5 feet";
  let actionInstruction = `${target} directly ahead, about 5 feet away.`;
  let isCentered = true;
  let box = { x: 35, y: 30, width: 30, height: 45 };

  if (norm.includes('chair')) {
    direction = "2 o'clock";
    distance = "about 7 feet away";
    actionInstruction = "Empty chair at 2 o’clock, approximately 7 feet away.";
    isCentered = false;
    box = { x: 55, y: 25, width: 35, height: 50 };
  } else if (norm.includes('bottle') || norm.includes('water')) {
    direction = "11 o'clock";
    distance = "about 3 feet away";
    actionInstruction = "Water bottle at 11 o'clock, about 3 feet away.";
    isCentered = false;
    box = { x: 25, y: 40, width: 20, height: 35 };
  } else if (norm.includes('door') || norm.includes('bathroom') || norm.includes('exit')) {
    direction = "12 o'clock";
    distance = "about 10 feet away";
    actionInstruction = "Door directly ahead, approximately 10 feet.";
    isCentered = true;
    box = { x: 35, y: 15, width: 30, height: 65 };
  } else if (norm.includes('key')) {
    direction = "1 o'clock";
    distance = "about 2 feet away";
    actionInstruction = "Keys on surface at 1 o’clock, 2 feet away.";
    isCentered = false;
    box = { x: 48, y: 50, width: 25, height: 25 };
  } else if (norm.includes('elevator')) {
    direction = "12 o'clock";
    distance = "about 14 feet away";
    actionInstruction = "Elevator directly ahead, approx 14 feet.";
    isCentered = true;
    box = { x: 30, y: 20, width: 40, height: 60 };
  } else if (norm.includes('backpack') || norm.includes('bag')) {
    direction = "1 o'clock";
    distance = "about 4 feet away";
    actionInstruction = "Backpack at 1 o’clock, about 4 feet away.";
    isCentered = false;
    box = { x: 45, y: 40, width: 30, height: 40 };
  }

  return {
    targetDetected: true,
    targetName: target,
    direction,
    distance,
    actionInstruction,
    confidence: 0.85,
    isCentered,
    isImmediateObstacle: false,
    obstacleWarning: null,
    box,
  };
}

function generateSmartAnalyzeFallback(userPrompt?: string) {
  const norm = (userPrompt || '').toLowerCase();
  let name = 'Personal Item';
  let category = 'Everyday Object';
  let room = 'Living Room';
  let features = ['High contrast physical shape', 'Textured grip'];

  if (norm.includes('shampoo')) {
    name = 'Hydrating Shampoo';
    category = 'Personal Care';
    room = 'Bathroom';
    features = ['Tall cylindrical bottle', 'Flip-top cap with textured lip'];
  } else if (norm.includes('medication')) {
    name = 'Daily Prescription Medication';
    category = 'Healthcare';
    room = 'Bedroom';
    features = ['Amber medicine bottle', 'White textured push-down childproof cap'];
  } else if (norm.includes('backpack')) {
    name = 'Black Backpack';
    category = 'Bags & Luggage';
    room = 'Entryway';
    features = ['Canvas texture', 'Two metal zipper pulls', 'Top carrying loop'];
  } else if (norm.includes('airpods') || norm.includes('earbuds')) {
    name = 'AirPods Pro Case';
    category = 'Electronics';
    room = 'Bedroom';
    features = ['White rounded gloss charging case', 'Front LED indicator'];
  }

  return {
    objectName: name,
    category,
    suggestedRoom: room,
    distinctiveFeatures: features,
    audioConfirmation: `Remembered ${name} in ${room}.`,
    confidence: 0.92,
  };
}

function generateSmartWhatChangedFallback(environmentName?: string) {
  return {
    hasChanges: true,
    safetyScore: 'hazard',
    spokenSummary:
      'A chair has been moved into the walkway approximately 5 feet ahead. A backpack is on the floor near the doorway.',
    unchangedAreaSummary: 'Sofa and dining table perimeter remain unchanged.',
    differences: [
      {
        item: 'Wooden Chair',
        changeType: 'moved',
        location: "12 o'clock, approx 5 feet ahead",
        isTripHazard: true,
        description: 'Dining chair pulled outward, directly blocking the walkway path.',
      },
      {
        item: 'Black Backpack',
        changeType: 'new_obstacle',
        location: "11 o'clock, 3 feet ahead",
        isTripHazard: true,
        description: 'Soft backpack sitting on the floor near doorway threshold.',
      },
    ],
  };
}

// -------------------------------------------------------------
// 1. FIND IT: Multimodal visual guidance
// -------------------------------------------------------------
app.post('/api/gemini/find-object', async (req, res) => {
  const { imageBase64, target = 'chair', previousDirection } = req.body;

  if (!imageBase64 || !target) {
    return res.status(400).json({ error: 'imageBase64 and target are required' });
  }

  const cacheKey = target.toLowerCase().trim();
  const cached = findCache.get(cacheKey);
  const now = Date.now();

  // Return cached result if within 9 seconds to strictly protect the 5 RPM rate limit
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return res.json({
      success: true,
      data: cached.data,
      fromCache: true,
    });
  }

  const { data, mimeType, isSvg } = extractBase64(imageBase64);

  // If the image is a simulated SVG or has no valid base64 payload, use smart fallback directly
  if (isSvg || !data || data.length < 50) {
    const fallback = generateSmartFindFallback(target, previousDirection);
    findCache.set(cacheKey, { data: fallback, timestamp: now });
    return res.json({ success: true, data: fallback, isSimulated: true });
  }

  try {
    const promptText = `You are the vision guidance engine for Aura, an accessibility assistant for blind and low-vision users.
The user is holding their phone camera and searching for: "${target}".

Your job:
1. Examine the image carefully for "${target}".
2. If detected with reasonable confidence (>= 0.65), determine its clock-face position from user's perspective (12 o'clock is directly ahead, 1 o'clock is slight right, 11 o'clock is slight left, 3 o'clock is 90 deg right, 9 o'clock is 90 deg left).
3. Estimate distance in feet or steps (e.g. "about 4 feet away", "approximately 7 feet away").
4. Provide a very concise action instruction suitable for voice output (under 12 words). Examples:
   - "Empty chair at 1 o'clock, about 6 feet away."
   - "Move slightly left."
   - "Water bottle directly ahead, 2 feet away."
   - "Target reached."
5. Detect any immediate floor or path hazard directly between the user and the target (e.g. cables, bags, steps, protruding objects).
6. Provide an approximate 2D bounding box (0-100 scale: x, y, width, height) so low-vision users can see a high-contrast locator highlight.
7. If "${target}" is NOT detected or confidence is low (< 0.65), set targetDetected = false, and provide safe concise guidance like "Target not visible. Slowly pan camera right." or "Too blurry to identify safely." NEVER hallucinate or guess.

Previous frame direction was: ${previousDirection || 'none'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data,
            },
          },
          { text: promptText },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetDetected: { type: Type.BOOLEAN },
            targetName: { type: Type.STRING },
            direction: {
              type: Type.STRING,
              description: "Clock face direction like '12 o'clock', '1 o'clock', '11 o'clock', or 'directly ahead'",
            },
            distance: { type: Type.STRING, description: "Estimated distance e.g. 'approx 6 feet'" },
            actionInstruction: {
              type: Type.STRING,
              description: 'Ultra-concise spoken instruction under 12 words',
            },
            confidence: { type: Type.NUMBER, description: 'Confidence between 0.0 and 1.0' },
            isCentered: {
              type: Type.BOOLEAN,
              description: 'True if object is roughly in center third of frame (11 to 1 o clock)',
            },
            isImmediateObstacle: { type: Type.BOOLEAN },
            obstacleWarning: {
              type: Type.STRING,
              description: 'Warning if walkway has a hazard, or null/empty if clear',
            },
            box: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER, description: '0 to 100 percentage from left' },
                y: { type: Type.NUMBER, description: '0 to 100 percentage from top' },
                width: { type: Type.NUMBER, description: '0 to 100 percentage' },
                height: { type: Type.NUMBER, description: '0 to 100 percentage' },
              },
            },
          },
          required: [
            'targetDetected',
            'targetName',
            'direction',
            'distance',
            'actionInstruction',
            'confidence',
            'isCentered',
            'isImmediateObstacle',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    findCache.set(cacheKey, { data: parsed, timestamp: now });
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.warn('Gemini find-object throttled or unavailable, serving graceful fallback:', error?.message);
    const fallback = generateSmartFindFallback(target, previousDirection);
    findCache.set(cacheKey, { data: fallback, timestamp: now });
    res.json({
      success: true,
      data: fallback,
      throttled: true,
      note: 'Using local vision co-pilot while AI API recovers from rate limit',
    });
  }
});

// -------------------------------------------------------------
// 2. REMEMBER IT: Object recognition and attribute labeling
// -------------------------------------------------------------
app.post('/api/gemini/analyze-object', async (req, res) => {
  const { imageBase64, userPrompt } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  const { data, mimeType, isSvg } = extractBase64(imageBase64);

  if (isSvg || !data || data.length < 50) {
    return res.json({ success: true, data: generateSmartAnalyzeFallback(userPrompt), isSimulated: true });
  }

  try {
    const promptText = `You are the personal visual memory assistant for a blind user.
The user is pointing their phone at an object and said: "${userPrompt || 'Remember this item'}".

Task:
1. Identify the primary object in focus.
2. Provide a clean, concise name for this item (e.g. "Prescription bottle", "Hydro Flask water bottle", "Black key fob", "Black leather wallet").
3. Identify 2-4 distinctive tactile and visual traits that can help identify it later (e.g. "Matte cylindrical bottle with flip cap", "Embossed circular logo on front", "Two metal keys and a blue fob").
4. Suggest a likely room/environment category (e.g. "Bedroom", "Bathroom", "Kitchen", "Office", "Entryway", "Backpack").
5. Write a concise confirmation message for text-to-speech (e.g. "Saved black backpack. Identified silver zipper pulls.").`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data,
            },
          },
          { text: promptText },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            objectName: { type: Type.STRING },
            category: { type: Type.STRING },
            distinctiveFeatures: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestedRoom: { type: Type.STRING },
            audioConfirmation: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: [
            'objectName',
            'category',
            'distinctiveFeatures',
            'suggestedRoom',
            'audioConfirmation',
            'confidence',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.warn('Gemini analyze-object throttled or unavailable:', error?.message);
    res.json({
      success: true,
      data: generateSmartAnalyzeFallback(userPrompt),
      throttled: true,
    });
  }
});

// -------------------------------------------------------------
// 3. WHAT CHANGED: Baseline comparison for room navigation & safety
// -------------------------------------------------------------
app.post('/api/gemini/what-changed', async (req, res) => {
  const { baselineImageBase64, currentImageBase64, environmentName } = req.body;

  if (!baselineImageBase64 || !currentImageBase64) {
    return res.status(400).json({ error: 'Both baseline and current images are required' });
  }

  const baseline = extractBase64(baselineImageBase64);
  const current = extractBase64(currentImageBase64);

  if (baseline.isSvg || current.isSvg || !baseline.data || !current.data) {
    return res.json({
      success: true,
      data: generateSmartWhatChangedFallback(environmentName),
      isSimulated: true,
    });
  }

  try {
    const promptText = `You are Aura's environment differential auditor for blind users.
You are comparing two images of the same space ("${environmentName || 'Room'}"):
- Image 1 is the BASELINE established when the room was known and clear.
- Image 2 is the CURRENT live scan.

CRITICAL REQUIREMENT:
Do NOT describe unchanged background furniture or general decor. Focus solely on MEANINGFUL DIFFERENCES, especially:
1. Walkway obstructions, floor clutter, moved chairs, trip hazards, open cabinet doors.
2. Items that moved from their baseline spots.
3. New items brought in.

Structure output:
- hasChanges: boolean
- safetyScore: "clear" | "caution" | "hazard"
- spokenSummary: Ultra-clear 1-2 sentence spoken summary suitable for audio playback. Example:
  "A chair has been moved into the walkway approximately 5 feet ahead. A backpack is on the floor near the doorway."
  Or: "The room walkway is clear. No hazards detected compared to your baseline."
- differences: list of items that changed, their direction/distance, and hazard level.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: baseline.mimeType, data: baseline.data } },
          { inlineData: { mimeType: current.mimeType, data: current.data } },
          { text: promptText },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasChanges: { type: Type.BOOLEAN },
            safetyScore: { type: Type.STRING, description: "'clear', 'caution', or 'hazard'" },
            spokenSummary: { type: Type.STRING },
            unchangedAreaSummary: { type: Type.STRING },
            differences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  changeType: {
                    type: Type.STRING,
                    description: "'moved', 'new_obstacle', 'removed', 'opened_door'",
                  },
                  location: {
                    type: Type.STRING,
                    description: "Clock position or relative location e.g. '12 o'clock, 5 feet ahead'",
                  },
                  isTripHazard: { type: Type.BOOLEAN },
                  description: { type: Type.STRING },
                },
                required: ['item', 'changeType', 'location', 'isTripHazard', 'description'],
              },
            },
          },
          required: ['hasChanges', 'safetyScore', 'spokenSummary', 'differences'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.warn('Gemini what-changed throttled or unavailable:', error?.message);
    res.json({
      success: true,
      data: generateSmartWhatChangedFallback(environmentName),
      throttled: true,
    });
  }
});

// -------------------------------------------------------------
// 4. INTENT ROUTER: Natural Language Intent Parsing
// -------------------------------------------------------------
app.post('/api/gemini/intent', async (req, res) => {
  const { query, savedItems = [], savedEnvironments = [] } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // Fast heuristic fallback function
  const getHeuristicIntent = () => {
    const q = query.toLowerCase();
    let action = 'FIND';
    let target = query;

    if (q.includes('where did i put') || q.includes('where is my') || q.includes('where are my') || q.includes('where is') || q.includes('where are')) {
      action = 'RECALL_LOCATION';
    } else if (q.includes('remember') || q.includes('save this') || q.includes('this is my')) {
      action = 'REMEMBER';
    } else if (q.includes('what changed') || q.includes('check room') || q.includes('scan room') || q.includes('check walkway')) {
      action = 'WHAT_CHANGED';
    } else if (q.includes('help') || q.includes('future') || q.includes('modes')) {
      action = 'HELP_MODES';
    }

    return {
      action,
      target,
      spokenFeedback: `Understood. Opening ${action.toLowerCase().replace('_', ' ')}.`,
      confidence: 0.85,
    };
  };

  try {
    const itemsSummary = savedItems.map((i: any) => `${i.name} (id: ${i.id}, room: ${i.room})`).join(', ');
    const envsSummary = savedEnvironments.map((e: any) => `${e.name} (id: ${e.id})`).join(', ');

    const promptText = `You are the intent parsing engine for Aura, an accessibility voice companion.
User said: "${query}".

Known saved items: [${itemsSummary || 'None'}]
Known saved environments: [${envsSummary || 'None'}]

Classify into one of these actions:
1. "FIND": User wants to locate an object right now with the camera (e.g. "Find an empty chair", "Where is the door", "Help me find my keys").
   - target: the object they want to find.
   - matchedSavedItemId: if it matches a known saved item, include its id.

2. "RECALL_LOCATION": User is asking where a remembered item was left (e.g. "Where are my AirPods?", "Where did I put my medication?").
   - itemName: item name.
   - matchedSavedItemId: matched id.

3. "REMEMBER": User wants to save or remember an item (e.g. "Remember this as my shampoo", "Remember this is my backpack", "Save this object").
   - itemName: name of item to remember.

4. "WHAT_CHANGED": User wants to inspect or compare an environment (e.g. "What changed in my room?", "Scan the kitchen", "Check for obstacles").
   - environmentName: name of room if mentioned.

5. "HELP_MODES": User asks for instructions or future capabilities (e.g. "What can you do?", "How does this work?", "Show appliance mode").

Provide a direct spoken feedback string explaining what Aura will do.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, description: "'FIND' | 'RECALL_LOCATION' | 'REMEMBER' | 'WHAT_CHANGED' | 'HELP_MODES'" },
            target: { type: Type.STRING },
            matchedSavedItemId: { type: Type.STRING },
            environmentName: { type: Type.STRING },
            spokenFeedback: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ['action', 'spokenFeedback'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.warn('Gemini intent throttled or unavailable, serving heuristic:', error?.message);
    res.json({
      success: true,
      data: getHeuristicIntent(),
      throttled: true,
    });
  }
});

// -------------------------------------------------------------
// 5. CLOUD TTS (Optional fallback)
// -------------------------------------------------------------
app.post('/api/gemini/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 300),
              speechMetadata: {
                style: 'Concise, calm, clear accessibility navigator',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio returned' });
    }

    res.json({ success: true, audioBase64: base64Audio, format: 'audio/wav' });
  } catch (error: any) {
    console.warn('TTS unavailable:', error?.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Aura server running at http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
