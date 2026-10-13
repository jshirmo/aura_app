# Aura: AI Visual Environment Companion

> **An accessibility-first physical environment companion for blind and low-vision users.**  
> Focused on **action and directional independence** rather than generic image descriptions.

---

## 🌐 Live Web & Mobile Prototype

- **Public / Shareable App Link**: [https://ais-pre-h4xkeqme267w7p76xjglyw-822788775375.us-east1.run.app](https://ais-pre-h4xkeqme267w7p76xjglyw-822788775375.us-east1.run.app)  
  *(Open this link directly in Safari, Chrome, or any mobile browser. Anyone with the link can test without signing in.)*

---

## 🎯 Product Philosophy

Most visual accessibility tools today generate generic, passive narrations:
> ❌ *“I see a kitchen with a table, cabinets, and a refrigerator.”*

**Aura focuses on actionable, spatial guidance:**
> ✅ *“Your water bottle is on the table, at 11 o’clock, approximately 3 feet ahead.”*  
> ✅ *“Empty chair at 2 o’clock, 7 feet away. Move slightly right.”*

---

## 🌟 Core MVP Features

### 1. 🧭 FIND IT (Directional Guidance & Haptic Centering)
- **Clock-Face Bearing**: Announces targets using intuitive clock directions (e.g., `2 O'CLOCK`, `12 O'CLOCK / DIRECTLY AHEAD`) and estimated distance (e.g., `approx 7 feet away`).
- **Progressive Guidance**: Concise instructions that update as you navigate (*"Move slightly right"*, *"Directly ahead"*, *"Target reached"*).
- **Tactile & Audio Feedback**:
  - Pulse on detection.
  - Distinct **triple-pulse haptic cue** and double-chime when target is centered in front of you.
  - Deep hazard warning vibration if an obstacle or walkway clutter is detected.
- **Dual Camera / Simulation Mode**: Supports real device rear cameras (`getUserMedia`) and includes an instant **Test Simulation Scene** (wooden chair at 2 o'clock) for testing without physical room setup.
- **Visual Radar Compass & High-Contrast Highlight**: 12-hour tactile clock gauge with illuminated bearing pointer.

### 2. 🧠 REMEMBER IT (Personal Visual Memory)
- **Saved Items Library**: Pre-loaded with realistic everyday essentials (AirPods Pro on bedroom desk, Blood pressure medication on nightstand, Hydro Flask on kitchen counter, Keys in entryway).
- **"Where Is My..." Instant Recall**: Voice or tap query:  
  *“Your AirPods were last seen on your bedroom desk yesterday at 9:42 PM.”*
- **1-Tap Camera Handoff**: Tap **"Locate with Camera"** on any remembered item to launch Find It mode pre-configured for that item.
- **Save New Items**: Point camera and say *"Remember this as my medication"* or *"This is my black backpack"*. Multimodal vision extracts tactile traits (caps, labels, texture) and categorizes the room.

### 3. 🔄 WHAT CHANGED? (Room Differential & Hazard Detection)
- **Baseline Establishment**: Save familiar spaces (Living Room, Bedroom, Kitchen, Classroom).
- **Differential Inspection**: Audits only **meaningful changes and trip hazards** while ignoring static furniture.
- **Actionable Hazard Auditing**:
  - Detects moved chairs blocking walkways and items dropped near doorways.
  - High-contrast visual toggle: View Baseline vs. Current live scan.
  - Spoken safety summary: *"A chair has been moved into the walkway approximately 5 feet ahead. Backpack on the floor near the doorway."*

---

## 🔮 Future Capabilities Architecture

An interactive in-app guide showcases five architected future modes:
1. **Appliance Mode**: Interactive microwave/washer touch-panel navigator with finger spatial guidance (*"Finger on Power. Move 2 inches right: Start button."*).
2. **Food / Plate Mode**: Plate diagram translating meals into clock-face coordinates (*"Chicken at 12 o’clock, vegetables at 3 o’clock, potatoes at 7 o’clock."*).
3. **Social Awareness**: Speaker direction, crowd count, and hand-raise detection with a strict zero-facial-recognition privacy guarantee.
4. **Clothing Assistance**: Color palette matching, inside-out detection, and stain checks.
5. **Reading / Identification**: Signs, room numbers, medication labels, and currency.

---

## ♿ Accessibility & Universal Design

- **Screen Reader Optimized**: Semantic HTML5 landmarks, skip link (`#main-content`), and dedicated live region announcements (`aria-live="polite"` and `aria-live="assertive"`).
- **High-Contrast Themes**: High-Contrast Dark mode (`#000000`/`#09090b` with safety yellow `#facc15` and cyan `#38bdf8`) + High-Contrast Light mode.
- **Dynamic Text Scaling**: 1-tap switcher for Standard (16px), Large (19px), and Extra Large (22px).
- **Large Touch Hitboxes**: Interactive touch targets $\ge 48\text{px}$, with primary navigation buttons up to $104\text{px}$.
- **Spoken Audio & Speech Rate**: Integrated Web Speech API with adjustable speech rate (0.8x to 1.4x), audio mute toggle, and *"Hear Again"* repeat buttons.
- **Mobile Ergonomic Thumb Zone**: Fixed bottom navigation bar within the natural thumb reach zone adhering to the 15% sticky surface budget.

---

## 🛡️ Privacy & Safety Disclaimers

- **Privacy**: Live camera video frames are analyzed in-memory via server-side proxies and are **never permanently stored** on remote servers. Only explicitly saved items and baselines reside in local browser storage, with a 1-tap "Purge All Data" option.
- **Mobility Notice**: Aura assists visual awareness and orientation but does **not** replace a white cane, guide dog, or orientation and mobility training. Confidence thresholds explicitly flag uncertain detections.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Express (Node.js/tsx) full-stack proxy with Vite middleware
- **AI / Multimodal Vision**: `@google/genai` TypeScript SDK with `gemini-3.8-flash`
- **Audio & Sensory**: Web Speech API (Synthesis & Recognition), Web Audio API tactile synthesizer, Vibration API

---

## 🚀 Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd aura
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file based on `.env.example`:
   ```bash
   GEMINI_API_KEY="your-gemini-api-key"
   PORT=3000
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```
