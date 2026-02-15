# BioLogic UI Design Specification

**Visual Style:** Victorian/Steampunk Medical Laboratory (1880s-1940s)
- Dark slate/charcoal backgrounds (`#0f0e0d`, `#1a1815`)
- Brass/sepia accents (`#b8956e`, `#8b7355`)
- Ornate borders and frames (technical blueprint style)
- Parchment textures for notes/dialogs
- Period-appropriate typography (serif for body, monospace for data)

---

## View Hierarchy

```
BioLogic App
├── Clock Bar (persistent header)
├── Main Content Area
│   ├── Lab Grid View (DEFAULT)
│   ├── Instrument Detail View
│   ├── Case Management View
│   ├── City Overview
│   ├── Catalog/Shop View
│   └── M&M Review Modal
├── Side Panel (context-dependent)
│   ├── Inventory Panel
│   ├── Instrument Controls
│   ├── Lab Notebook
│   └── Case Details
└── Tooltip Bar (persistent footer)
```

---

## 1. Clock Bar (Persistent Header)

**Always visible at top of screen**

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Era Badge] │ DAY 3 │ 2:45 PM │ [⏸][1×][2×][4×][8×] │ Events: [🧫 Culture ready (15m)] [🛏️ Patient declining (1h)] │ 💰 $2,450 │ ⭐ 45 │
└─────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- **Era Badge** - "Golden Age" / "Antibiotic Era" with year range
- **Day Counter** - Large, prominent
- **Current Time** - 12-hour format with AM/PM
- **Speed Controls** - Pause/play + 4 speed buttons (disabled when paused)
- **Event Timeline** - Scrollable list of upcoming events, clickable to jump
- **Funds** - Current money
- **Reputation** - Star rating or numerical score

**Style Notes:**
- Brass border with corner ornaments
- Events use category-colored left borders (culture=blue, patient=red, test=yellow)
- Monospace font for time/numbers

---

## 2. Lab Grid View (Main Default View)

**The primary game screen - bird's eye view of the laboratory**

### Layout

```
┌───────────────────────────────────────────────────────────────────┐
│  [Lab Name/Title]                        [🔧 Edit Mode] [📋 Cases] │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│    LAB GRID (6x6 or 8x8 cells)                                    │
│                                                                    │
│    ┌─────┬─────┬─────┬─────┬─────┬─────┐                         │
│    │ 🔬  │     │ 🧫  │ 🧫  │     │ ❄️  │  Infrastructure         │
│    │Micro│OPEN │Cult1│Cult2│OPEN │Frdg │  overlays:              │
│    │IDLE │     │BUSY │IDLE │     │     │  • Power outlets        │
│    ├─────┼─────┼─────┼─────┼─────┼─────┤  • Ventilation          │
│    │ 🎨  │     │ 💉  │     │ 🌀  │     │  • Biosafety zones      │
│    │Stn  │OPEN │Sero │OPEN │Cent │OPEN │  • Storage units        │
│    │IDLE │     │IDLE │     │IDLE │     │                         │
│    ├─────┼─────┼─────┼─────┼─────┼─────┤                         │
│    │ 🛏️  │ 🛏️  │ 🛏️  │     │     │     │                         │
│    │Pat1 │Pat2 │Pat3 │OPEN │OPEN │OPEN │                         │
│    │2pts │     │     │     │     │     │                         │
│    └─────┴─────┴─────┴─────┴─────┴─────┘                         │
│                                                                    │
│    [Grid shows active processes with progress indicators]         │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

### Instrument Tile States

**Idle State:**
- Gray border
- Icon + short name
- "IDLE" status text

**Busy/Processing:**
- Pulsing amber border
- Progress indicator (circular or bar)
- Time remaining shown
- What's processing (e.g., "Culturing: Sample-3")

**Ready for Pickup:**
- Bright brass border with glow
- "READY" badge
- Notification icon

**Occupied but Awaiting Input:**
- Blue border
- "WAITING" status
- What it needs (e.g., "Load Sample")

### Edit Mode (Infrastructure Building)

When "Edit Mode" is active:
- Grid cells show infrastructure overlays (power, ventilation, etc.)
- Drag-and-drop instrument placement
- Infrastructure upgrade buttons per cell
- Ghost preview of dragged instruments (shows if placement valid)
- Cost displayed on hover

### Interactions

- **Click Instrument Tile** → Navigate to Instrument Detail View
- **Hover Instrument** → Tooltip shows full name, status, estimated completion
- **Right-click (future)** → Quick actions menu (relocate, decommission)

---

## 3. Instrument Detail View

**Full-screen takeover when instrument selected**

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ [← Back to Lab]           MICROSCOPE - STATION 1                    │
├───────────────┬─────────────────────────────────────────────────────┤
│               │                                                      │
│               │                                                      │
│   INSTRUMENT  │              CONTROL PANEL                          │
│   VIEWPORT    │                                                      │
│               │  [Sample Loader]                                    │
│   (Main       │  └─ Currently Loaded: Blood Sample (Case-3)         │
│    visual     │                                                      │
│    area)      │  [Stain Selection]                                  │
│               │  ○ None  ● Gram Stain  ○ Acid-Fast                  │
│               │                                                      │
│   Shows:      │  [Magnification] [────●────] 40x                    │
│   - Microscope│                                                      │
│     slide     │  [Observation Recording]                            │
│   - Culture   │  ┌─────────────────────────────────────┐           │
│     plate     │  │ Shape:       [Cocci ▼]              │           │
│   - Gel lanes │  │ Arrangement: [Chains ▼]             │           │
│   - Test      │  │ Gram:        [Positive ▼]           │           │
│     results   │  │ Features:    [None ▼]               │           │
│               │  └─────────────────────────────────────┘           │
│               │                                                      │
│               │  [Record Observation]  [Generate Artifact]          │
│               │                                                      │
│               │  [Process Timeline]                                 │
│               │  ● Sample Loaded (Now)                              │
│               │  ● Stain Applied (Now)                              │
│               │  ○ Microscopy Complete (2m)                         │
│               │                                                      │
├───────────────┴─────────────────────────────────────────────────────┤
│ Hover Tooltip: [Currently hovering over: Gram Stain - Differentiates│
│ bacteria based on cell wall structure. Purple = Gram+, Pink = Gram-]│
└─────────────────────────────────────────────────────────────────────┘
```

### Left: Instrument Viewport (60% width)

**Visual representation specific to instrument type:**

- **Microscope:** Circular viewport showing bacteria/cells on slide
- **Culture Plate:** Petri dish with colonies, hemolysis patterns
- **Staining Bench:** Bench with reagent bottles, slide holders
- **Serology Station:** Test tubes, agglutination results
- **PCR Thermocycler:** Temperature readout, cycle progress
- **Gel Electrophoresis:** Lane view with DNA bands
- **Flow Cytometer:** Dot plot graph, gating controls

**Viewport Features:**
- Blueprint-style overlay grid/measurement marks
- Zoom controls for detailed observation
- Interactive elements (click colonies, adjust focus, etc.)
- Live updates as processes run

### Right: Control Panel (40% width)

**Always includes:**

1. **Sample Loader**
   - Dropdown or drag-drop area
   - Shows current sample + case ID
   - "Load Sample" button if empty

2. **Instrument-Specific Controls**
   - Parameters (temperature, time, reagents)
   - Protocol selection dropdowns
   - "Start Process" / "Stop" / "Collect Result" buttons

3. **Observation Recording Panel**
   - Structured dropdowns for observations
   - Free-text notes field (handwritten style)
   - "Record to Notebook" button

4. **Process Timeline**
   - Shows current step in workflow
   - Estimated time for completion
   - Can schedule events here

5. **Results/Artifacts Section**
   - Shows generated artifacts
   - "Save to Case Notebook" option
   - Quick evidence linking

### Style Details

- Left viewport has brass ornamental border (blueprint style)
- Right panel uses parchment texture background
- Dropdowns styled as vintage labels/tags
- Buttons are brass plaques with engraved text
- Process timeline uses Victorian-era timeline aesthetic

---

## 4. Inventory & Sample Management

**Side panel that can overlay or dock to the right**

```
┌─────────────────────────────────────┐
│    INVENTORY & SAMPLES              │
├─────────────────────────────────────┤
│ [Active Cases ▼]                    │
│                                     │
│ ● Case-3: John Smith (Stable)      │
│   Samples:                          │
│   • Blood Sample [●●●○○] (3/5 vol)  │
│   • Sputum Sample [●●●●●] (5/5)     │
│                                     │
│ ● Case-7: Mary Jones (Declining)   │
│   Samples:                          │
│   • Wound Swab [●●○○○] (2/5 vol)    │
│   • [+ Collect More]                │
│                                     │
├─────────────────────────────────────┤
│ [Consumables ▼]                     │
│                                     │
│ • Gram Stain Kit (12 uses)         │
│ • Blood Agar Plates (8 left)       │
│ • Antiseptic Wash (∞)               │
│                                     │
├─────────────────────────────────────┤
│ [Reagent Storage ▼]                 │
│                                     │
│ ❄️ Refrigerated (2-8°C)             │
│   • Culture Media x5                │
│                                     │
│ 🧊 Frozen (-20°C)                   │
│   • [Empty - Need Freezer]          │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Collapsible sections
- Sample volume indicators (dots or bars)
- Visual warnings when samples depleted
- Drag samples from inventory to instrument
- Per-case organization

---

## 5. Lab Notebook (Evidence Panel)

**Overlays or docks alongside instrument view**

```
┌─────────────────────────────────────────────────┐
│        LAB NOTEBOOK - Case #3                   │
├─────────────────────────────────────────────────┤
│ [Filter: All ▼] [Search...]                     │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Day 2, 10:30 AM - Microscopy                │ │
│ │ Sample: Blood Sample                        │ │
│ │ ┌─────────────────────────────────────────┐ │ │
│ │ │  [Slide Image: Gram Stain]              │ │ │
│ │ │  Circular microscope view thumbnail     │ │ │
│ │ └─────────────────────────────────────────┘ │ │
│ │ Observations:                               │ │
│ │ • Shape: Cocci                              │ │
│ │ • Arrangement: Clusters                     │ │
│ │ • Gram: Positive                            │ │
│ │                                             │ │
│ │ [Link as Evidence]                          │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Day 2, 2:15 PM - Culture                    │ │
│ │ Sample: Blood Sample on Blood Agar          │ │
│ │ ┌─────────────────────────────────────────┐ │ │
│ │ │  [Plate Image]                          │ │ │
│ │ │  Petri dish with colonies thumbnail     │ │ │
│ │ └─────────────────────────────────────────┘ │ │
│ │ Observations:                               │ │
│ │ • Colony size: Medium                       │ │
│ │ • Hemolysis: Beta (complete)                │ │
│ │ • Color: Golden yellow                      │ │
│ │                                             │ │
│ │ [Link as Evidence]                          │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Style:**
- Parchment background texture
- Entries look like lab notebook pages
- Handwritten-style annotations
- Thumbnail artifacts are sepia-toned photographs
- Chronological order with timestamps

---

## 6. Case Management View

**Accessed from top-right corner or dedicated button**

### Case Queue (Triage)

```
┌─────────────────────────────────────────────────────────────┐
│               INCOMING CASES - TRIAGE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Patient: Margaret Wilson      Age: 34    Arrival: 9:15 AM││
│ │ Urgency: MODERATE                                         ││
│ │                                                           ││
│ │ Chief Complaint:                                          ││
│ │ "Persistent cough for 3 weeks, night sweats, weight loss"││
│ │                                                           ││
│ │ Vitals:                                                   ││
│ │ • Temp: 100.4°F   • HR: 88 bpm   • BP: 118/76           ││
│ │                                                           ││
│ │ [Accept Case] [Defer] [Refer Out]                        ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Patient: Thomas Brown        Age: 8     Arrival: 9:30 AM ││
│ │ Urgency: URGENT                                          ││
│ │ [Card content...]                                        ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Active Cases Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│               ACTIVE CASES                                   │
├─────┬───────────────────────────────────────────────────────┤
│Case#│ Patient        Status     Time Elapsed  Progress      │
├─────┼───────────────────────────────────────────────────────┤
│  3  │ John Smith    Stable      2d 4h        ████░░ 4/6     │
│  7  │ Mary Jones    Declining   8h           ██░░░░ 2/6     │
│  12 │ Tom Brown     Critical    45m          █░░░░░ 1/6     │
└─────┴───────────────────────────────────────────────────────┘
        ^ Click row to view case details/diagnosis form
```

### Case Detail & Diagnosis Form

```
┌─────────────────────────────────────────────────────────────┐
│  Case #3: John Smith (32M)              [Status: Stable]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [Patient History] [Samples] [Lab Notebook] [Diagnosis]      │
│                                                              │
│ ════════════════════════════════════════════════════════════│
│ DIAGNOSIS FORM                                               │
│ ════════════════════════════════════════════════════════════│
│                                                              │
│ 1. What is the causative organism?                          │
│    [Search or Select: "Staphylococcus aureus" ▼]            │
│    Supporting Evidence: [+] [Microscopy: Gram+ cocci]       │
│                                                              │
│ 2. What category does this belong to?                       │
│    [Bacterial Infection ▼]                                   │
│                                                              │
│ 3. What immediate action should be taken?                   │
│    [Isolate patient ▼]                                       │
│                                                              │
│ 4. What treatment do you recommend?                         │
│    [Antiseptic wash + carbolic dressing ▼]                  │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ CONFIDENCE ASSESSMENT                                   │ │
│ │ Based on your evidence: Medium (67%)                    │ │
│ │ • Strong: Microscopy confirms Gram+ cocci               │ │
│ │ • Weak: No culture confirmation yet                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ [Submit Diagnosis] [Request More Tests] [Consult]           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Treatment Administration

**Modal or separate view after diagnosis submitted**

```
┌─────────────────────────────────────────────────────────────┐
│            TREATMENT ADMINISTRATION                          │
│                Case #3: John Smith                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Your Diagnosis: Staphylococcus aureus infection            │
│  Prescribed: Antiseptic wash + carbolic dressing            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │     [Illustration: Patient receiving treatment]        │ │
│  │                                                         │ │
│  │  "Applying carbolic acid dressing to wound..."         │ │
│  │                                                         │ │
│  │     [Progress: ████████░░] 80%                         │ │
│  │                                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Follow-up Schedule:                                         │
│  • Day 1: Monitor for adverse reaction                      │
│  • Day 3: Check wound healing                               │
│  • Day 7: Final assessment                                  │
│                                                              │
│  [Administer Treatment] [Modify Protocol]                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Catalog/Shop View

**Purchase new instruments and consumables**

```
┌─────────────────────────────────────────────────────────────┐
│          INSTRUMENT CATALOG - Golden Age Era                │
├─────────────────────────────────────────────────────────────┤
│ [All ▼] [Microscopy] [Culture] [Serology] [Other]          │
│                                                              │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│ │   🔬        │    🧫       │    🎨       │    💉       │  │
│ │ Microscope  │ Culture     │ Staining    │ Serology    │  │
│ │            │ Station     │ Bench       │ Station     │  │
│ │ $450       │ $320        │ $180        │ $250        │  │
│ │            │             │             │             │  │
│ │ [Purchase] │ [Purchase]  │ [Purchase]  │ [Purchase]  │  │
│ │ [Details]  │ [Details]   │ [Details]   │ [Details]   │  │
│ └─────────────┴─────────────┴─────────────┴─────────────┘  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ CONSUMABLES                                            │  │
│ │                                                        │  │
│ │ • Gram Stain Kit (10 uses) ........... $15            │  │
│ │ • Blood Agar Plates (pack of 20) ..... $25            │  │
│ │ • Crystal Violet Reagent ............. $8             │  │
│ │                                                        │  │
│ │ [Add quantities and purchase]                          │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Filter by category/era
- Show requirements (space, infrastructure)
- Comparison mode
- "Add to cart" workflow for batch purchases

---

## 9. City Overview (Meta-Layer)

**The big-picture impact view**

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR CITY - 1887                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  DISEASE BURDEN                   YOUR IMPACT                │
│  ├─ Wound Sepsis: ████████░░      Cases Solved: 47          │
│  ├─ Consumption:  ██████░░░░      Lives Saved: ~23          │
│  ├─ Cholera:      ███░░░░░░░      Outbreaks Stopped: 1      │
│  └─ Unknown:      █░░░░░░░░░      Reputation: ★★★☆☆        │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ DISTRICT ALERTS                                        │  │
│ │                                                        │  │
│ │ ⚠️  Factory District: Typhoid cluster (12 cases)       │  │
│ │     Your lab could respond if you had culture capacity│  │
│ │                                                        │  │
│ │ ℹ️  Market Square: Cholera outbreak contained          │  │
│ │     Thanks to your rapid diagnosis!                    │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ NEWS FEED (Era-appropriate)                            │  │
│ │                                                        │  │
│ │ 📰 "Mysterious illness strikes tenement block"         │  │
│ │ 📰 "City sanitation board calls for lab expansion"     │  │
│ │ 📰 "Dr. Koch visits to inspect local facilities"       │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [View Detailed Statistics] [Accept District Contract]      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Visual Style:**
- Antique map aesthetic
- Bar charts using vintage engraving style
- News feed looks like newspaper clippings

---

## 10. M&M Review (Failure Feedback)

**Educational modal when diagnosis is wrong**

```
┌─────────────────────────────────────────────────────────────┐
│        MORBIDITY & MORTALITY CONFERENCE                      │
│             Case #3: John Smith                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  OUTCOME: Patient developed septic shock. Deceased.          │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ YOUR DIAGNOSIS          vs.    CORRECT DIAGNOSIS       │  │
│ │                                                        │  │
│ │ Staphylococcus aureus   →   Streptococcus pyogenes    │  │
│ │ Antiseptic wash         →   Should have used:          │  │
│ │                              Isolation + aggressive    │  │
│ │                              antiseptic protocol       │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│  EVIDENCE REVIEW:                                            │
│                                                              │
│  ✓ Correct: Identified Gram-positive cocci                  │
│  ✗ Missed: Colony hemolysis pattern (beta)                  │
│  ✗ Missed: Rapid spread indicated virulent strain           │
│                                                              │
│  KEY LEARNING POINTS:                                        │
│  • Beta-hemolysis on blood agar is hallmark of Strep        │
│  • Patient deterioration speed should raise suspicion       │
│  • Culture confirmation is critical before treatment        │
│                                                              │
│  [Review Case Details] [Continue]                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Style:**
- Somber but educational tone
- Side-by-side comparison
- Green checkmarks / red X's for evidence audit
- Parchment background, formal typography

---

## 11. Tooltip Bar (Persistent Footer)

**Always visible at bottom**

```
┌─────────────────────────────────────────────────────────────┐
│ ℹ️ Currently hovering: GRAM STAIN - Differentiates bacteria │
│ based on cell wall structure. Crystal violet retained by    │
│ Gram-positive organisms (purple), washed away from Gram-    │
│ negative (pink after counterstain). Discovered by Hans      │
│ Christian Gram, 1884.                   [More Info] [Guide] │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Context-sensitive descriptions
- Historical notes (educational flavor)
- Links to expanded information
- Can show keyboard shortcuts
- Clear visual separation from main content

---

## UI Component Library

### Buttons

**Primary Action** (Brass plaque style)
```
┌─────────────────┐
│ RECORD OBSERVATION │
└─────────────────┘
```

**Secondary Action** (Outlined)
```
┌─────────────────┐
│   Cancel        │
└─────────────────┘
```

**Danger Action** (Red tint)
```
┌─────────────────┐
│ Discard Sample  │
└─────────────────┘
```

### Dropdowns

**Vintage Label Style**
```
┌──────────────────────────────┐
│ Shape: Cocci              ▼  │
└──────────────────────────────┘
```

### Progress Indicators

**Timeline Style**
```
● Sample Loaded (Complete)
● Staining (In Progress... 30s)
○ Microscopy (Pending)
```

**Bar Style** (Engraved brass)
```
[████████░░] 80%
```

### Cards/Panels

**Parchment Card**
```
┌─────────────────────────────┐
│  Content with aged paper    │
│  texture background         │
│                             │
│  [Action Button]            │
└─────────────────────────────┘
```

**Blueprint Panel** (Technical data)
```
╔═════════════════════════════╗
║  Technical specifications   ║
║  with grid overlay          ║
║                             ║
╚═════════════════════════════╝
```

---

## Responsive Behavior

**Desktop (Primary Target):**
- Full layout as described
- Side panels dock to right
- Minimum 1280x720 resolution

**Tablet (Secondary):**
- Panels become overlays
- Lab grid scales down
- Touch-friendly targets

**Mobile (Not priority for MVP):**
- Stack vertically
- Simplified instrument views
- Swipe gestures for navigation

---

## Accessibility

- All interactive elements have clear focus states
- Colorblind-friendly status indicators (use shapes + colors)
- Text readable at 16px minimum
- High contrast mode available
- Keyboard navigation support

---

## Asset Requirements

### Icons
- Instrument icons (microscope, culture dish, etc.) - 64x64px
- UI icons (buttons, status) - 24x24px
- Vector preferred for scaling

### Textures
- Parchment/paper texture for backgrounds
- Brass/metal texture for borders
- Wood texture for lab benches
- Grid overlay for blueprint style

### Illustrations
- Instrument viewport visuals (microscope views, culture plates, etc.)
- Patient/doctor illustrations for treatment scenes
- Historical figures for era transitions

### Fonts
- **Headings:** Cinzel or similar serif (Victorian feel)
- **Body Text:** Crimson Text or Georgia
- **Monospace:** Courier New or IBM Plex Mono
- **Handwriting:** Daniel or Homemade Apple

---

## Animation & Transitions

**Keep period-appropriate (subtle, mechanical):**
- Fade transitions (200ms)
- Instrument state changes: gentle pulse
- Button clicks: slight depress effect
- Panel slides: smooth but not bouncy
- Progress bars: steady, industrial movement
- Clock: smooth second-hand sweep (not jumpy)

**Avoid:**
- Bouncy/elastic effects
- Flashy particle effects
- Modern flat material design motion
- Anything that breaks immersion

---

## Color Palette

```css
/* Base */
--bg-darkest: #0f0e0d;     /* Charcoal black */
--bg-dark: #1a1815;         /* Dark brown-black */
--bg-medium: #2a2622;       /* Medium brown */
--bg-light: #3a3632;        /* Lighter brown */

/* Accents */
--brass: #b8956e;           /* Primary accent */
--brass-dark: #8b7355;      /* Darker brass */
--brass-light: #d4b896;     /* Lighter brass */

/* Status Colors */
--status-idle: #6b6560;     /* Gray */
--status-active: #b89e4a;   /* Gold */
--status-ready: #7a9b5a;    /* Green */
--status-warning: #b8724a;  /* Orange */
--status-danger: #a85555;   /* Red */

/* Text */
--text-primary: #e8e4dc;    /* Off-white */
--text-secondary: #a89f90;  /* Tan */
--text-muted: #6b6560;      /* Gray */

/* Parchment */
--parchment-bg: #f5f2eb;    /* Light parchment */
--parchment-text: #3a3632;  /* Dark text on parchment */
```

---

This specification provides the complete UI framework. Now we need to build it out, view by view, starting with the Lab Grid View as the foundation.
