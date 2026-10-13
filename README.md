# Aura: AI Visual Environment Companion

> **An accessibility-first browser app for blind and low-vision users.**
> Aura uses a phone camera, microphone, AI, audio guidance, and haptics to help users act on their surroundings rather than receive generic scene descriptions.

## Assignment Quick Check

- **Built in Google AI Studio:** Yes
- **Public GitHub repository:** https://github.com/jshirmo/aura_app
- **Public live app:** https://aura-app-live.onrender.com
- **Runs in a phone browser:** Designed as a responsive web app for Safari/Chrome rather than a native app-store app
- **Device feature requirement:** Uses the rear camera through `navigator.mediaDevices.getUserMedia()` and also supports microphone input through the Web Speech Recognition API
- **AI requirement:** Gemini performs multimodal object finding, object analysis, room-change comparison, and natural-language intent routing
- **Deployment:** Render web service connected to the public GitHub `main` branch with automatic redeployment after commits

> **Important security note:** The real `GEMINI_API_KEY` is intentionally **not** stored in this public repository. It is stored as a private Render environment variable. The repository includes `.env.example` and `render.yaml` so the required configuration is still visible and reproducible without exposing the secret.

---

## Live Web & Mobile Prototype

**Public / Shareable App Link:** https://aura-app-live.onrender.com

Anyone with the link can open the app in a supported mobile browser without requesting repository access.

---

## What Aura Does

Many accessibility tools describe an entire scene. Aura instead emphasizes short, actionable guidance.

Examples:

- “Your water bottle is on the table, at 11 o’clock, approximately 3 feet ahead.”
- “Empty chair at 2 o’clock, 7 feet away. Move slightly right.”

### 1. Find It

- Requests access to the phone’s rear-facing camera.
- Captures camera frames in the browser.
- Sends the selected frame to the Aura backend for Gemini multimodal analysis.
- Returns clock-face direction, estimated distance, confidence, and a short action instruction.
- Provides spoken guidance and haptic feedback where supported.
- Includes a simulation mode for desktop/restricted-browser testing, but the real camera path is implemented for phone use.

### 2. Remember It

- Lets a user save personal objects such as medication, a backpack, keys, or earbuds.
- Uses AI to identify the object, suggest a category/room, and note distinctive traits.
- Stores user-saved item information locally in the browser.
- Can hand a remembered item directly into Find It for camera-based locating.

### 3. What Changed?

- Lets the user save a baseline image of a familiar space.
- Compares a later image against the baseline with Gemini.
- Prioritizes meaningful changes such as moved chairs, floor clutter, and walkway hazards rather than redescribing the entire room.

### Voice Input

Aura also supports microphone input using the browser’s speech-recognition capability. A user can say requests such as:

- “Find an empty chair.”
- “Where are my AirPods?”
- “What changed in my room?”

Gemini then classifies the request and routes the user to the appropriate feature.

---

## Device Features Used

### Camera

Aura requests the rear-facing camera with the browser MediaDevices API:

```ts
navigator.mediaDevices.getUserMedia({
  video: { facingMode: { ideal: 'environment' } },
  audio: false,
});
```

This is the primary device feature for the project.

### Microphone

Aura uses browser speech recognition when the device/browser supports it. The microphone is used for natural-language commands that are then interpreted by AI.

### Haptics and Audio

Where supported, Aura also uses vibration/haptic patterns and browser text-to-speech to provide nonvisual feedback.

---

## AI Features

The backend uses the Google GenAI SDK with Gemini for central app behavior:

1. **Find Object:** analyzes a camera image and returns target detection, direction, distance, confidence, and obstacle guidance.
2. **Analyze Object:** identifies a personal object and extracts useful identifying characteristics.
3. **What Changed:** compares baseline/current images and identifies meaningful environmental differences.
4. **Intent Routing:** interprets natural-language voice/text requests and routes them to Find It, Remember It, or What Changed.

The AI runs through the server rather than exposing the API key in the browser.

---

## Deployment / Render Configuration

Aura is hosted as a Render **Web Service** because the project includes both a React/Vite frontend and a Node/Express backend.

The current production configuration is also committed in [`render.yaml`](./render.yaml):

- **Service name:** `aura-app-live`
- **Runtime:** Node
- **Plan:** Free
- **Region:** Ohio
- **Branch:** `main`
- **Build command:** `npm install && npm run build`
- **Start command:** `npm start`
- **Health endpoint:** `/api/health`
- **Auto-deploy:** enabled for GitHub commits
- **Production URL:** https://aura-app-live.onrender.com

### Environment Variables

The repository documents required variables in [`.env.example`](./.env.example).

- `NODE_ENV=production`
- `GEMINI_API_KEY` = stored privately in Render
- `PORT` = supplied automatically by Render in production

The real Gemini key must never be committed to a public GitHub repository.

---

## Accessibility & Universal Design

- Semantic labels and screen-reader-friendly controls
- ARIA live-region announcements
- High-contrast dark/light options
- Adjustable text size
- Large touch targets
- Spoken instructions and repeat controls
- Voice input
- Haptic feedback where browser/device support allows it
- Concise, action-oriented AI responses

---

## Privacy & Safety

- Camera frames are sent for analysis but are not intentionally stored permanently by Aura’s server.
- Explicitly saved item/environment information is stored locally in the browser.
- The Gemini API key remains server-side and private.
- Aura is an assistive visual-awareness tool and is not intended to replace established mobility aids or professional orientation/mobility training.

---

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Express / Node.js / tsx
- **AI:** Google GenAI SDK / Gemini multimodal analysis
- **Device APIs:** MediaDevices camera access, Web Speech Recognition, Speech Synthesis, Vibration API
- **Hosting:** Render
- **Source control:** GitHub

---

## Local Development

1. Clone the repository:

   ```bash
   git clone https://github.com/jshirmo/aura_app.git
   cd aura_app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local `.env` based on `.env.example` and supply your own Gemini key:

   ```bash
   GEMINI_API_KEY="your-gemini-api-key"
   PORT=3000
   ```

4. Start development:

   ```bash
   npm run dev
   ```

5. Production build:

   ```bash
   npm run build
   npm start
   ```

---

## Before Submitting: Real-Phone Test Checklist

The app is deployed and the server is live, but the course specifically requires a real-device test. Before submitting, open the public link on your own phone and verify all of the following:

- [ ] The homepage loads from `https://aura-app-live.onrender.com`
- [ ] Tap **Find It** and allow camera permission
- [ ] Confirm the rear camera preview appears
- [ ] Scan a real object and confirm Aura returns an AI result
- [ ] Tap the microphone button and allow microphone permission
- [ ] Say a command and confirm the app routes it correctly
- [ ] Test at least one **Remember It** action
- [ ] Test **What Changed?** with a baseline/current image pair
- [ ] Reload the site once to confirm it still works
- [ ] Open the link in a private/incognito tab or on another phone to confirm no account login is required

---

## Canvas Submission Information

### 1. Live app link

https://aura-app-live.onrender.com

### 2. Public GitHub repository

https://github.com/jshirmo/aura_app

### 3. Short note

Aura is an AI-powered visual environment companion designed for blind and low-vision users. It uses the phone’s camera to analyze the user’s surroundings and the microphone for optional voice commands. Gemini multimodal AI helps locate objects with directional guidance, recognize and remember personal items, compare familiar spaces for meaningful changes or obstacles, and interpret natural-language requests. The app runs in the phone browser and provides concise audio, visual, and haptic feedback where supported.
