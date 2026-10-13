/**
 * Sample synthesized environments and object reference images.
 * Uses high-contrast, clean inline SVG data URLs to guarantee 100% offline reliability
 * without any external CDN dependencies.
 */

function createSvgDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

export const SAMPLE_CHAIR_SCENE = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">
  <rect width="640" height="480" fill="#1e293b"/>
  <!-- Room walls and floor -->
  <polygon points="0,0 640,0 640,260 0,260" fill="#334155"/>
  <polygon points="0,260 640,260 640,480 0,480" fill="#0f172a"/>
  <!-- Baseboard -->
  <rect x="0" y="254" width="640" height="6" fill="#64748b"/>
  
  <!-- Wooden chair at 2 o'clock (right-center), approx 7 feet away -->
  <g transform="translate(380, 170)">
    <!-- Shadow -->
    <ellipse cx="60" cy="180" rx="70" ry="18" fill="rgba(0,0,0,0.4)"/>
    <!-- Chair backrest -->
    <rect x="25" y="10" width="70" height="90" rx="6" fill="#b45309" stroke="#78350f" stroke-width="3"/>
    <rect x="35" y="25" width="50" height="65" rx="3" fill="#92400e"/>
    <!-- Seat -->
    <polygon points="10,100 110,100 95,120 25,120" fill="#d97706" stroke="#b45309" stroke-width="2"/>
    <!-- Front legs -->
    <rect x="24" y="120" width="8" height="60" fill="#78350f"/>
    <rect x="88" y="120" width="8" height="60" fill="#78350f"/>
    <!-- Back legs -->
    <rect x="35" y="98" width="6" height="75" fill="#451a03"/>
    <rect x="79" y="98" width="6" height="75" fill="#451a03"/>
    <!-- Label for vision clarity -->
    <text x="60" y="-10" text-anchor="middle" fill="#facc15" font-size="16" font-family="sans-serif" font-weight="bold">Empty Wooden Chair</text>
  </g>

  <!-- Door in background at 11 o'clock -->
  <g transform="translate(80, 80)">
    <rect x="0" y="0" width="90" height="180" fill="#475569" stroke="#1e293b" stroke-width="4"/>
    <circle cx="80" cy="100" r="4" fill="#fbbf24"/>
    <text x="45" y="-10" text-anchor="middle" fill="#94a3b8" font-size="14" font-family="sans-serif">Doorway</text>
  </g>
</svg>
`);

export const SAMPLE_LIVING_ROOM_BASELINE = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">
  <rect width="640" height="480" fill="#0f172a"/>
  <!-- Wall -->
  <rect x="0" y="0" width="640" height="240" fill="#1e293b"/>
  <!-- Floor (Walkway completely clear) -->
  <polygon points="0,240 640,240 640,480 0,480" fill="#020617"/>
  <!-- Baseboard line -->
  <line x1="0" y1="240" x2="640" y2="240" stroke="#475569" stroke-width="4"/>

  <!-- Left Side: Sofa neatly against left wall -->
  <rect x="20" y="160" width="180" height="110" rx="10" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/>
  <rect x="30" y="140" width="160" height="40" rx="6" fill="#2563eb"/>
  <text x="110" y="220" text-anchor="middle" fill="#ffffff" font-size="14" font-family="sans-serif">Sofa (Against Wall)</text>

  <!-- Right Side: Dining Table neatly tucked against right wall -->
  <g transform="translate(430, 180)">
    <rect x="0" y="0" width="170" height="70" rx="4" fill="#78350f"/>
    <!-- Chairs neatly pushed under table -->
    <rect x="20" y="-30" width="35" height="30" fill="#92400e"/>
    <rect x="90" y="-30" width="35" height="30" fill="#92400e"/>
    <text x="85" y="40" text-anchor="middle" fill="#fde68a" font-size="14" font-family="sans-serif">Table &amp; Chairs</text>
  </g>

  <!-- Center: Clear walking path indicator -->
  <rect x="250" y="250" width="140" height="220" fill="rgba(16, 185, 129, 0.08)" stroke="#10b981" stroke-dasharray="6,6" stroke-width="2"/>
  <text x="320" y="370" text-anchor="middle" fill="#34d399" font-size="16" font-family="sans-serif" font-weight="bold">WALKWAY CLEAR</text>
  <text x="320" y="395" text-anchor="middle" fill="#a7f3d0" font-size="13" font-family="sans-serif">Baseline: 0 Obstacles</text>
</svg>
`);

export const SAMPLE_LIVING_ROOM_CHANGED = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">
  <rect width="640" height="480" fill="#0f172a"/>
  <!-- Wall -->
  <rect x="0" y="0" width="640" height="240" fill="#1e293b"/>
  <!-- Floor -->
  <polygon points="0,240 640,240 640,480 0,480" fill="#020617"/>
  <line x1="0" y1="240" x2="640" y2="240" stroke="#475569" stroke-width="4"/>

  <!-- Left Side: Sofa -->
  <rect x="20" y="160" width="180" height="110" rx="10" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/>
  <rect x="30" y="140" width="160" height="40" rx="6" fill="#2563eb"/>

  <!-- Right Side: Dining Table with 1 chair missing -->
  <g transform="translate(430, 180)">
    <rect x="0" y="0" width="170" height="70" rx="4" fill="#78350f"/>
    <!-- Only 1 chair left at table -->
    <rect x="90" y="-30" width="35" height="30" fill="#92400e"/>
  </g>

  <!-- HAZARD 1: Chair pulled directly into middle of walkway -->
  <g transform="translate(260, 240)">
    <ellipse cx="50" cy="120" rx="55" ry="14" fill="rgba(239,68,68,0.4)"/>
    <rect x="20" y="10" width="60" height="70" rx="4" fill="#b45309" stroke="#ef4444" stroke-width="3"/>
    <polygon points="10,80 90,80 80,100 20,100" fill="#d97706"/>
    <rect x="20" y="100" width="8" height="40" fill="#78350f"/>
    <rect x="72" y="100" width="8" height="40" fill="#78350f"/>
    <rect x="0" y="-25" width="110" height="24" rx="4" fill="#ef4444"/>
    <text x="55" y="-9" text-anchor="middle" fill="#ffffff" font-size="12" font-family="sans-serif" font-weight="bold">! MOVED INTO WALKWAY</text>
  </g>

  <!-- HAZARD 2: Backpack dropped on floor near doorway / walkway entry -->
  <g transform="translate(180, 360)">
    <ellipse cx="40" cy="50" rx="45" ry="12" fill="rgba(239,68,68,0.3)"/>
    <rect x="10" y="10" width="60" height="45" rx="10" fill="#18181b" stroke="#f59e0b" stroke-width="3"/>
    <path d="M 25 10 C 25 -5, 55 -5, 55 10" fill="none" stroke="#f59e0b" stroke-width="4"/>
    <rect x="20" y="24" width="40" height="16" rx="4" fill="#27272a"/>
    <text x="40" y="75" text-anchor="middle" fill="#fbbf24" font-size="13" font-family="sans-serif" font-weight="bold">! Backpack on Floor</text>
  </g>
</svg>
`);

export const SAMPLE_AIRPODS_IMAGE = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="#18181b"/>
  <!-- Table surface -->
  <rect x="20" y="180" width="260" height="100" rx="8" fill="#3f3f46"/>
  <!-- Shadow -->
  <ellipse cx="150" cy="195" rx="60" ry="15" fill="rgba(0,0,0,0.5)"/>
  <!-- AirPods Charging Case -->
  <rect x="105" y="110" width="90" height="80" rx="28" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
  <line x1="106" y1="135" x2="194" y2="135" stroke="#94a3b8" stroke-width="2"/>
  <circle cx="150" cy="155" r="3.5" fill="#22c55e"/>
  <!-- Label -->
  <text x="150" y="70" text-anchor="middle" fill="#ffffff" font-size="20" font-family="sans-serif" font-weight="bold">AirPods Pro Case</text>
  <text x="150" y="95" text-anchor="middle" fill="#94a3b8" font-size="14" font-family="sans-serif">White gloss, LED indicator</text>
</svg>
`);

export const SAMPLE_MEDICATION_IMAGE = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="#18181b"/>
  <!-- Table surface -->
  <rect x="20" y="180" width="260" height="100" rx="8" fill="#334155"/>
  <!-- Shadow -->
  <ellipse cx="150" cy="210" rx="45" ry="12" fill="rgba(0,0,0,0.5)"/>
  <!-- Amber prescription bottle -->
  <rect x="115" y="100" width="70" height="110" rx="8" fill="#d97706" stroke="#b45309" stroke-width="3"/>
  <!-- White childproof cap -->
  <rect x="110" y="85" width="80" height="20" rx="4" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  <!-- White paper label -->
  <rect x="120" y="125" width="60" height="60" fill="#ffffff" rx="2"/>
  <line x1="128" y1="140" x2="172" y2="140" stroke="#dc2626" stroke-width="3"/>
  <line x1="128" y1="152" x2="165" y2="152" stroke="#475569" stroke-width="2"/>
  <line x1="128" y1="162" x2="160" y2="162" stroke="#475569" stroke-width="2"/>
  <!-- Label -->
  <text x="150" y="55" text-anchor="middle" fill="#ffffff" font-size="18" font-family="sans-serif" font-weight="bold">Daily Medication</text>
  <text x="150" y="75" text-anchor="middle" fill="#fbbf24" font-size="13" font-family="sans-serif">Amber bottle, white ridges</text>
</svg>
`);

export const SAMPLE_WATER_BOTTLE_IMAGE = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="#18181b"/>
  <!-- Shadow -->
  <ellipse cx="150" cy="235" rx="40" ry="10" fill="rgba(0,0,0,0.5)"/>
  <!-- Blue insulated water bottle -->
  <rect x="120" y="90" width="60" height="145" rx="14" fill="#0284c7" stroke="#0369a1" stroke-width="3"/>
  <!-- Black loop cap -->
  <rect x="130" y="70" width="40" height="22" rx="4" fill="#18181b"/>
  <rect x="138" y="52" width="24" height="20" rx="6" fill="none" stroke="#18181b" stroke-width="4"/>
  <!-- Silver brand band -->
  <rect x="120" y="160" width="60" height="8" fill="#e2e8f0"/>
  <!-- Label -->
  <text x="150" y="35" text-anchor="middle" fill="#ffffff" font-size="18" font-family="sans-serif" font-weight="bold">Blue Water Bottle</text>
</svg>
`);

export const SAMPLE_KEYS_IMAGE = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="#18181b"/>
  <!-- Keychain ring -->
  <circle cx="130" cy="120" r="30" fill="none" stroke="#94a3b8" stroke-width="6"/>
  <!-- Blue oval fob -->
  <ellipse cx="180" cy="140" rx="25" ry="38" fill="#2563eb" stroke="#1d4ed8" stroke-width="2"/>
  <!-- Brass key 1 -->
  <polygon points="120,140 100,220 115,220 125,190 120,180 128,170 125,145" fill="#f59e0b" stroke="#b45309" stroke-width="2"/>
  <!-- Silver key 2 -->
  <polygon points="140,145 155,230 142,230 140,200 146,190 142,175 138,150" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
  <!-- Label -->
  <text x="150" y="55" text-anchor="middle" fill="#ffffff" font-size="18" font-family="sans-serif" font-weight="bold">House Keys &amp; Blue Fob</text>
</svg>
`);
