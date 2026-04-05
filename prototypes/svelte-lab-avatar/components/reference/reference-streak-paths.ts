/**
 * Hand-traced streak paths from s-aureus-real.png, normalized to
 * the 600×600 canvas coordinate system (center 300,300, plate radius ~276).
 *
 * COORDINATE SYSTEM: heightmap y-axis is inverted vs. screen —
 * large y = screen top, small y = screen bottom. All y-values here
 * are pre-flipped so the rendered plate matches the reference photo.
 *
 * The reference shows a characteristic quadrant streak with:
 *  - Dense swirl at top-center-right
 *  - Horizontal line going LEFT, with vertical "prongs" dropping down
 *  - Two curved strokes going RIGHT from the swirl
 *  - A sweeping zigzag in the middle zone
 *  - Sparse strokes near the bottom
 */

type Pt = [number, number];

export interface StreakDeposition {
  startDensity: number;
  endDensity: number;
  startWidth: number;
  endWidth: number;
  colonyR: [number, number];
  colonyH: [number, number];
}

export interface StreakZone {
  path: Pt[];
  deposition: StreakDeposition;
}

export interface SwirlConfig {
  cx: number;
  cy: number;
  radius: number;
  colonyCount: number;
  colonyR: [number, number];
  colonyH: [number, number];
  baseFill: number;
}

export interface ReferenceStreakData {
  swirl: SwirlConfig;
  zones: StreakZone[];
  scattered: {
    positions: Pt[];
    radiusRange: [number, number];
    heightRange: [number, number];
  };
}

// Shared deposition presets
const DENSE: StreakDeposition = {
  startDensity: 4.0,
  endDensity: 1.0,
  startWidth: 12,
  endWidth: 8,
  colonyR: [1.5, 3.2],
  colonyH: [0.2, 0.48],
};

const PRONG: StreakDeposition = {
  startDensity: 3.5,
  endDensity: 0.6,
  startWidth: 10,
  endWidth: 7,
  colonyR: [1.5, 3.5],
  colonyH: [0.2, 0.48],
};

const CURVE: StreakDeposition = {
  startDensity: 3.0,
  endDensity: 0.4,
  startWidth: 10,
  endWidth: 6,
  colonyR: [1.8, 4.0],
  colonyH: [0.2, 0.5],
};

const MEDIUM: StreakDeposition = {
  startDensity: 1.6,
  endDensity: 0.04,
  startWidth: 10,
  endWidth: 5,
  colonyR: [2.0, 5.0],
  colonyH: [0.2, 0.5],
};

const SPARSE: StreakDeposition = {
  startDensity: 0.3,
  endDensity: 0.008,
  startWidth: 7,
  endWidth: 3,
  colonyR: [2.5, 5.5],
  colonyH: [0.25, 0.55],
};

export const REFERENCE_PATHS: ReferenceStreakData = {
  swirl: {
    cx: 335,
    cy: 432,
    radius: 78,
    colonyCount: 550,
    colonyR: [1.5, 2.8],
    colonyH: [0.28, 0.5],
    baseFill: 0.42,
  },

  zones: [
    // ── A: Horizontal streak going LEFT from the swirl ──
    {
      path: [
        [260, 422],
        [195, 426],
        [130, 428],
        [70, 430],
      ],
      deposition: DENSE,
    },

    // ── B1–B4: Vertical "prongs" dropping DOWN from the horizontal line ──
    // These are the most visually distinctive feature of the reference plate.
    // Each prong is a short nearly-vertical stroke.

    // B1 — leftmost prong
    {
      path: [
        [72, 422],
        [76, 390],
        [80, 358],
        [82, 332],
      ],
      deposition: PRONG,
    },
    // B2
    {
      path: [
        [128, 418],
        [127, 388],
        [126, 358],
        [125, 338],
      ],
      deposition: PRONG,
    },
    // B3
    {
      path: [
        [175, 415],
        [173, 388],
        [171, 360],
        [170, 345],
      ],
      deposition: PRONG,
    },
    // B4 — rightmost prong
    {
      path: [
        [220, 412],
        [218, 388],
        [216, 368],
        [215, 352],
      ],
      deposition: PRONG,
    },

    // ── C1: Curved stroke from swirl going RIGHT then sweeping down-left ──
    {
      path: [
        [370, 405],
        [420, 395],
        [445, 375],
        [448, 348],
        [430, 325],
        [395, 312],
        [355, 308],
      ],
      deposition: CURVE,
    },

    // ── C2: Second wider curve from swirl going RIGHT ──
    {
      path: [
        [395, 392],
        [450, 378],
        [488, 358],
        [492, 332],
        [478, 310],
        [440, 295],
        [385, 288],
      ],
      deposition: CURVE,
    },

    // ── D: Middle sweeping zigzag (second dilution) ──
    // Broader curves, density thinning, individual colonies visible at edges
    {
      path: [
        [400, 285],
        [320, 270],
        [220, 258],
        [130, 250],
        [125, 232],
        [200, 222],
        [310, 215],
        [400, 208],
        [405, 192],
        [320, 182],
        [220, 174],
        [150, 168],
      ],
      deposition: MEDIUM,
    },

    // ── E: Lower sparse strokes (third dilution) ──
    {
      path: [
        [150, 152],
        [230, 145],
        [320, 138],
        [400, 130],
        [405, 118],
        [330, 112],
        [250, 108],
      ],
      deposition: SPARSE,
    },
  ],

  scattered: {
    positions: [
      [440, 250],
      [465, 215],
      [175, 140],
      [230, 108],
      [350, 105],
      [420, 155],
      [155, 115],
      [300, 95],
      [480, 180],
      [260, 135],
    ],
    radiusRange: [2.5, 5.5],
    heightRange: [0.2, 0.5],
  },
};
