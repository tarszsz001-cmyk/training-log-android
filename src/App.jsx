import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Target,
  ListChecks,
  PlayCircle,
  LineChart as LineChartIcon,
  Play,
  Pause,
  Check,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Flame,
  X,
  Dumbbell,
  PersonStanding,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

/* =========================================================================
   MUSCLE ZONE GEOMETRY — single source of truth for the body map AND
   the small animated muscle-activation icons used throughout the app
   ========================================================================= */

const ZONE_LABELS = {
  chest: "Chest",
  shoulders: "Shoulders",
  biceps: "Biceps",
  forearms: "Forearms",
  abs: "Abs",
  obliques: "Obliques",
  quads: "Quads",
  traps: "Traps",
  back: "Back",
  triceps: "Triceps",
  glutes: "Glutes",
  hamstrings: "Hamstrings",
  calves: "Calves",
};

const ZONE_SHAPES = {
  front: {
    chest: [{ type: "ellipse", cx: 100, cy: 75, rx: 26, ry: 16 }],
    shoulders: [
      { type: "circle", cx: 52, cy: 60, r: 11 },
      { type: "circle", cx: 148, cy: 60, r: 11 },
    ],
    biceps: [
      { type: "ellipse", cx: 52, cy: 97, rx: 9, ry: 22 },
      { type: "ellipse", cx: 148, cy: 97, rx: 9, ry: 22 },
    ],
    forearms: [
      { type: "ellipse", cx: 52, cy: 147, rx: 8, ry: 20 },
      { type: "ellipse", cx: 148, cy: 147, rx: 8, ry: 20 },
    ],
    abs: [{ type: "rect", x: 83, y: 95, width: 34, height: 42, rx: 10 }],
    obliques: [
      { type: "rect", x: 71, y: 100, width: 11, height: 35, rx: 5 },
      { type: "rect", x: 118, y: 100, width: 11, height: 35, rx: 5 },
    ],
    quads: [
      { type: "ellipse", cx: 86, cy: 210, rx: 13, ry: 45 },
      { type: "ellipse", cx: 114, cy: 210, rx: 13, ry: 45 },
    ],
  },
  back: {
    traps: [{ type: "ellipse", cx: 100, cy: 58, rx: 22, ry: 13 }],
    back: [{ type: "ellipse", cx: 100, cy: 100, rx: 28, ry: 28 }],
    triceps: [
      { type: "ellipse", cx: 52, cy: 97, rx: 9, ry: 22 },
      { type: "ellipse", cx: 148, cy: 97, rx: 9, ry: 22 },
    ],
    glutes: [
      { type: "ellipse", cx: 90, cy: 195, rx: 14, ry: 16 },
      { type: "ellipse", cx: 110, cy: 195, rx: 14, ry: 16 },
    ],
    hamstrings: [
      { type: "ellipse", cx: 86, cy: 250, rx: 12, ry: 38 },
      { type: "ellipse", cx: 114, cy: 250, rx: 12, ry: 38 },
    ],
    calves: [
      { type: "ellipse", cx: 86, cy: 300, rx: 9, ry: 25 },
      { type: "ellipse", cx: 114, cy: 300, rx: 9, ry: 25 },
    ],
  },
};

const ZONE_VIEW = {};
Object.keys(ZONE_SHAPES.front).forEach((z) => (ZONE_VIEW[z] = "front"));
Object.keys(ZONE_SHAPES.back).forEach((z) => (ZONE_VIEW[z] = "back"));

/* =========================================================================
   EXERCISE DATABASE
   ========================================================================= */

const EXERCISES = [
  // QUADS
  { id: "squat", name: "Back Squat", zone: "quads", defaultSets: 4, defaultReps: "8", rest: 90, equipment: true, cue: "Bar on the traps, hips back, drive through the heels." },
  { id: "legpress", name: "Leg Press", zone: "quads", defaultSets: 4, defaultReps: "10", rest: 90, equipment: true, cue: "Feet shoulder-width, don't lock the knees at the top." },
  { id: "bwsquat", name: "Bodyweight Squat", zone: "quads", defaultSets: 3, defaultReps: "15", rest: 60, equipment: false, cue: "Hips back, chest tall, knees track over toes." },
  { id: "lunge", name: "Lunge", zone: "quads", defaultSets: 3, defaultReps: "10/side", rest: 60, equipment: false, cue: "Front knee stacked over ankle, back knee kisses the floor." },

  // HAMSTRINGS
  { id: "rdl", name: "Romanian Deadlift", zone: "hamstrings", defaultSets: 4, defaultReps: "8", rest: 90, equipment: true, cue: "Soft knees, push hips back, feel the stretch." },
  { id: "legcurl", name: "Leg Curl Machine", zone: "hamstrings", defaultSets: 3, defaultReps: "12", rest: 60, equipment: true, cue: "Slow and controlled, don't swing the weight." },
  { id: "nordic", name: "Nordic Curl", zone: "hamstrings", defaultSets: 3, defaultReps: "6", rest: 90, equipment: false, cue: "Lower under control, use your hands to catch if needed." },
  { id: "slgbridge", name: "Single-Leg Glute Bridge", zone: "hamstrings", defaultSets: 3, defaultReps: "10/side", rest: 60, equipment: false, cue: "Drive through the heel, squeeze at the top." },

  // GLUTES
  { id: "hipthrust", name: "Barbell Hip Thrust", zone: "glutes", defaultSets: 4, defaultReps: "10", rest: 90, equipment: true, cue: "Chin tucked, drive hips up, squeeze hard at the top." },
  { id: "cablekick", name: "Cable Kickback", zone: "glutes", defaultSets: 3, defaultReps: "12", rest: 45, equipment: true, cue: "Slow and controlled, avoid swinging the leg." },
  { id: "glutebridge", name: "Glute Bridge", zone: "glutes", defaultSets: 3, defaultReps: "15", rest: 45, equipment: false, cue: "Feet close to hips, squeeze glutes at the top." },
  { id: "donkeykick", name: "Donkey Kicks", zone: "glutes", defaultSets: 3, defaultReps: "12/side", rest: 45, equipment: false, cue: "Keep the core braced, don't arch the lower back." },

  // CALVES
  { id: "calfmachine", name: "Standing Calf Raise Machine", zone: "calves", defaultSets: 4, defaultReps: "15", rest: 45, equipment: true, cue: "Full stretch at the bottom, pause at the top." },
  { id: "bwcalf", name: "Bodyweight Calf Raise", zone: "calves", defaultSets: 3, defaultReps: "20", rest: 30, equipment: false, cue: "Rise onto the toes slowly, control the descent." },

  // CHEST
  { id: "bench", name: "Barbell Bench Press", zone: "chest", defaultSets: 4, defaultReps: "8", rest: 90, equipment: true, cue: "Shoulder blades pinned, bar path over the chest." },
  { id: "dbfly", name: "Dumbbell Fly", zone: "chest", defaultSets: 3, defaultReps: "12", rest: 60, equipment: true, cue: "Slight bend in the elbows, open like hugging a barrel." },
  { id: "pushup", name: "Push-Up", zone: "chest", defaultSets: 3, defaultReps: "12", rest: 60, equipment: false, cue: "Straight line from shoulders to ankles, elbows at 45°." },
  { id: "diamondpushup", name: "Diamond Push-Up", zone: "chest", defaultSets: 3, defaultReps: "10", rest: 60, equipment: false, cue: "Hands form a diamond, elbows stay close to the ribs." },

  // SHOULDERS
  { id: "ohp", name: "Overhead Press", zone: "shoulders", defaultSets: 3, defaultReps: "8", rest: 90, equipment: true, cue: "Ribs down, press in a straight line over the head." },
  { id: "latraise", name: "Lateral Raise", zone: "shoulders", defaultSets: 3, defaultReps: "12", rest: 45, equipment: true, cue: "Lead with the elbows, stop at shoulder height." },
  { id: "pikepushup", name: "Pike Push-Up", zone: "shoulders", defaultSets: 3, defaultReps: "10", rest: 60, equipment: false, cue: "Hips high, lower the head toward the floor." },

  // BICEPS
  { id: "curl", name: "Barbell Curl", zone: "biceps", defaultSets: 3, defaultReps: "12", rest: 45, equipment: true, cue: "Elbows pinned to the ribs, control the lowering phase." },
  { id: "dbcurl", name: "Dumbbell Curl", zone: "biceps", defaultSets: 3, defaultReps: "12", rest: 45, equipment: true, cue: "Alternate arms, avoid swinging the shoulders." },
  { id: "chinup", name: "Chin-Up", zone: "biceps", defaultSets: 3, defaultReps: "6", rest: 90, equipment: false, cue: "Palms facing you, lead with the chest." },

  // TRICEPS
  { id: "pushdown", name: "Cable Pushdown", zone: "triceps", defaultSets: 3, defaultReps: "12", rest: 45, equipment: true, cue: "Elbows locked at the sides, extend fully." },
  { id: "skullcrusher", name: "Skull Crusher", zone: "triceps", defaultSets: 3, defaultReps: "10", rest: 60, equipment: true, cue: "Elbows stay still, only the forearm moves." },
  { id: "benchdip", name: "Bench Dip", zone: "triceps", defaultSets: 3, defaultReps: "12", rest: 60, equipment: false, cue: "Elbows point straight back, don't flare them out." },

  // FOREARMS
  { id: "wristcurl", name: "Wrist Curl", zone: "forearms", defaultSets: 3, defaultReps: "15", rest: 30, equipment: true, cue: "Small range of motion, focus on the squeeze." },
  { id: "deadhang", name: "Dead Hang", zone: "forearms", defaultSets: 3, defaultReps: "30s", rest: 45, equipment: false, cue: "Relax the shoulders, let the grip do the work." },

  // ABS
  { id: "cablecrunch", name: "Cable Crunch", zone: "abs", defaultSets: 3, defaultReps: "15", rest: 45, equipment: true, cue: "Curl the spine, not just the shoulders." },
  { id: "plank", name: "Plank", zone: "abs", defaultSets: 3, defaultReps: "45s", rest: 45, equipment: false, cue: "Brace the core, don't let the hips sag or pike." },
  { id: "legraise", name: "Leg Raise", zone: "abs", defaultSets: 3, defaultReps: "12", rest: 45, equipment: false, cue: "Lower legs slowly, keep the lower back flat." },

  // OBLIQUES
  { id: "woodchop", name: "Cable Woodchop", zone: "obliques", defaultSets: 3, defaultReps: "12/side", rest: 45, equipment: true, cue: "Rotate from the core, not just the arms." },
  { id: "sideplank", name: "Side Plank", zone: "obliques", defaultSets: 3, defaultReps: "30s/side", rest: 45, equipment: false, cue: "Stack the hips, keep the body in one line." },

  // BACK
  { id: "latpulldown", name: "Lat Pulldown", zone: "back", defaultSets: 4, defaultReps: "10", rest: 75, equipment: true, cue: "Pull to the upper chest, don't lean back too far." },
  { id: "row", name: "Bent-Over Row", zone: "back", defaultSets: 4, defaultReps: "10", rest: 75, equipment: true, cue: "Pull to the lower ribs, squeeze the shoulder blades." },
  { id: "deadlift", name: "Deadlift", zone: "back", defaultSets: 4, defaultReps: "6", rest: 120, equipment: true, cue: "Bar close to shins, hinge at the hips, flat back throughout." },
  { id: "pullup", name: "Pull-Up", zone: "back", defaultSets: 4, defaultReps: "6", rest: 90, equipment: false, cue: "Lead with the chest, full hang at the bottom." },
  { id: "superman", name: "Superman", zone: "back", defaultSets: 3, defaultReps: "15", rest: 45, equipment: false, cue: "Lift chest and legs together, squeeze the lower back." },

  // TRAPS
  { id: "shrug", name: "Barbell Shrug", zone: "traps", defaultSets: 3, defaultReps: "12", rest: 60, equipment: true, cue: "Lift straight up, avoid rolling the shoulders." },
  { id: "yraise", name: "Prone Y-Raise", zone: "traps", defaultSets: 3, defaultReps: "12", rest: 45, equipment: false, cue: "Lift arms in a Y shape, squeeze the upper back." },
];

const VIDEO_IDS = {
  squat: "-bJIpOq-LWk",
  legpress: "XNvaNipSycI",
  bwsquat: "ZLJBfYF_oO0",
  lunge: "mBhqeQm8RdM",
  rdl: "_oyxCn2iSjU",
  legcurl: "MAbThtU8Sis",
  nordic: "F-AaE8mw_pY",
  slgbridge: "sVfp4LN9niA",
  hipthrust: "S_uZP4UH6J0",
  cablekick: "bVrmtCI00Ys",
  glutebridge: "nuapk_-Q2BI",
  donkeykick: "vKV2aueKBDA",
  calfmachine: "MAMzF7iZNkc",
  bwcalf: "Uyg2QR1WAq8",
  bench: "gRVjAtPip0Y",
  dbfly: "LzFvciCdoW0",
  pushup: "WDIpL0pjun0",
  diamondpushup: "ZR5U3sb-KeE",
  ohp: "F3QY5vMz_6I",
  latraise: "ssAo_xwFt5c",
  pikepushup: "pHR5yG6xBps",
  curl: "dDI8ClxRS04",
  dbcurl: "6DeLZ6cbgWQ",
  chinup: "liebDvbcdow",
  pushdown: "y6EdXBdL75A",
  skullcrusher: "4re6CJ0XNF8",
  benchdip: "IExSaQUjyIw",
  wristcurl: "sVLVLcsfWSo",
  deadhang: "3CEmHJXbNpc",
  cablecrunch: "3qjoXDTuyOE",
  plank: "mwlp75MS6Rg",
  legraise: "xqTh6NqbAtM",
  woodchop: "he4IhLc1d5k",
  sideplank: "pitOuJxdyI0",
  latpulldown: "j9jtjL8FhPI",
  row: "sNPIHaaLXfM",
  deadlift: "VL5Ab0T07e4",
  pullup: "vw5Xmu5CIew",
  superman: "hhq86gJvrvo",
  shrug: "X26Ji1j9LWA",
  yraise: "DQFTp5n0uh0",
};
EXERCISES.forEach((e) => { e.video = VIDEO_IDS[e.id]; });

const exById = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

const PLANS = [
  {
    id: "ppl",
    name: "Push / Pull / Legs",
    tagline: "3-day split — classic hypertrophy rotation",
    days: [
      { label: "Push", ids: ["pushup", "bench", "ohp"] },
      { label: "Pull", ids: ["pullup", "row", "curl"] },
      { label: "Legs", ids: ["squat", "lunge", "deadlift", "plank"] },
    ],
  },
  {
    id: "fullbody",
    name: "Full Body",
    tagline: "3-day split — every session hits everything",
    days: [
      { label: "Day A", ids: ["squat", "pushup", "row", "plank"] },
      { label: "Day B", ids: ["deadlift", "ohp", "pullup", "plank"] },
      { label: "Day C", ids: ["lunge", "bench", "row", "curl"] },
    ],
  },
  {
    id: "upperlower",
    name: "Upper / Lower",
    tagline: "4-day split — balanced volume, more recovery",
    days: [
      { label: "Upper A", ids: ["pushup", "pullup", "ohp", "curl"] },
      { label: "Lower A", ids: ["squat", "deadlift", "lunge", "plank"] },
      { label: "Upper B", ids: ["bench", "row", "ohp", "curl"] },
      { label: "Lower B", ids: ["deadlift", "lunge", "squat", "plank"] },
    ],
  },
];

/* =========================================================================
   SHAPE RENDERING HELPERS
   ========================================================================= */

function renderShape(shape, idx, className) {
  if (shape.type === "ellipse") {
    return <ellipse key={idx} className={className} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} />;
  }
  if (shape.type === "circle") {
    return <circle key={idx} className={className} cx={shape.cx} cy={shape.cy} r={shape.r} />;
  }
  if (shape.type === "rect") {
    return <rect key={idx} className={className} x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} />;
  }
  return null;
}

function BodyOutline({ className = "body-outline" }) {
  return (
    <g className={className}>
      {/* head + neck */}
      <circle cx="100" cy="24" r="14" />
      <path d="M92,36 C92,42 93,45 93,47 L107,47 C107,45 108,42 108,36 C104,39 96,39 92,36 Z" />
      {/* torso: shoulders taper to waist, flare to hips */}
      <path d="M69,49 C80,44 120,44 131,49 C133,58 128,72 122,88 C126,102 128,118 127,133 C127,140 125,145 122,148 C114,152 86,152 78,148 C75,145 73,140 73,133 C72,118 74,102 78,88 C72,72 67,58 69,49 Z" />
      {/* left arm: shoulder cap to wrist, tapered */}
      <path d="M70,52 C58,58 49,72 46,92 C44,108 44,126 46,142 C47,150 48,157 49,163 L59,163 C59,156 59,148 58,140 C57,124 58,106 61,90 C63,76 68,62 74,53 Z" />
      <ellipse cx="53" cy="171" rx="9" ry="13" />
      {/* right arm mirrored */}
      <path d="M130,52 C142,58 151,72 154,92 C156,108 156,126 154,142 C153,150 152,157 151,163 L141,163 C141,156 141,148 142,140 C143,124 142,106 139,90 C137,76 132,62 126,53 Z" />
      <ellipse cx="147" cy="171" rx="9" ry="13" />
      {/* left leg: hip to ankle, tapered, with foot */}
      <path d="M75,148 C73,172 73,198 75,222 C77,246 80,268 82,288 C83,297 83,304 83,310 L94,310 C95,304 95,297 95,289 C96,268 96,246 95,222 C95,198 96,172 97,150 C89,153 81,153 75,148 Z" />
      <path d="M79,310 C77,313 74,316 71,318 C69,319 68,321 70,322 L96,322 C97,320 96,317 95,315 L94,310 Z" />
      {/* right leg mirrored */}
      <path d="M125,148 C127,172 127,198 125,222 C123,246 120,268 118,288 C117,297 117,304 117,310 L106,310 C105,304 105,297 105,289 C104,268 104,246 105,222 C105,198 104,172 103,150 C111,153 119,153 125,148 Z" />
      <path d="M121,310 C123,313 126,316 129,318 C131,319 132,321 130,322 L104,322 C103,320 104,317 105,315 L106,310 Z" />
    </g>
  );
}

/* Thin blueprint-style line art tracing individual muscle groups —
   pec/ab/delt/quad separation lines up front, trap/lat/hamstring/calf
   lines on the back. Purely decorative, sits on top of the silhouette
   and (optionally) the zone highlight so it reads as an anatomical
   schematic rather than a flat body outline. */
function FrontMuscleDetail() {
  return (
    <g className="muscle-detail" fill="none">
      <path d="M76,58 Q100,52 124,58" />
      <path d="M100,60 L100,92" />
      <path d="M82,64 Q92,80 82,96" />
      <path d="M118,64 Q108,80 118,96" />
      <path d="M100,96 L100,136" />
      <path d="M86,108 L114,108" />
      <path d="M86,120 L114,120" />
      <path d="M86,132 L114,132" />
      <path d="M74,102 L80,132" />
      <path d="M126,102 L120,132" />
      <path d="M58,52 Q46,60 50,72" />
      <path d="M142,52 Q154,60 150,72" />
      <path d="M50,80 Q44,96 49,112" />
      <path d="M150,80 Q156,96 151,112" />
      <path d="M78,175 Q76,210 79,245" />
      <path d="M86,170 L86,250" />
      <path d="M94,175 Q96,210 93,245" />
      <path d="M106,175 Q104,210 107,245" />
      <path d="M114,170 L114,250" />
      <path d="M122,175 Q124,210 121,245" />
    </g>
  );
}

function BackMuscleDetail() {
  return (
    <g className="muscle-detail" fill="none">
      <path d="M76,52 L100,66 L124,52" />
      <path d="M100,48 L100,145" />
      <path d="M72,88 Q90,105 76,130" />
      <path d="M128,88 Q110,105 124,130" />
      <path d="M50,80 Q56,96 51,112" />
      <path d="M150,80 Q144,96 149,112" />
      <path d="M100,182 L100,208" />
      <path d="M78,206 Q100,214 122,206" />
      <path d="M80,215 Q78,250 81,285" />
      <path d="M92,212 L92,288" />
      <path d="M120,215 Q122,250 119,285" />
      <path d="M108,212 L108,288" />
      <path d="M82,280 Q78,300 83,318" />
      <path d="M118,280 Q122,300 117,318" />
    </g>
  );
}

/* Small animated body-and-muscle icon: full mini silhouette with the
   target zone highlighted and pulsing, like a muscle contracting. */
function MuscleFlex({ zone, size = 56 }) {
  const view = ZONE_VIEW[zone];
  const shapes = (view && ZONE_SHAPES[view][zone]) || [];
  return (
    <svg viewBox="0 0 200 328" width={size} height={Math.round(size * 1.6)} className="muscle-flex" aria-label={`${ZONE_LABELS[zone] || zone} activation`}>
      <BodyOutline className="flex-body-outline" />
      {view === "back" ? <BackMuscleDetail /> : <FrontMuscleDetail />}
      <g>{shapes.map((s, i) => renderShape(s, i, "flex-shape"))}</g>
    </svg>
  );
}

/* YouTube tutorial clip. The artifact sandbox blocks embedding external
   iframes, so this opens the real YouTube video in a new tab instead of
   trying to play inline. */
function VideoThumb({ videoId, title, aspect = "16 / 9" }) {
  if (!videoId) return null;

  return (
    <a
      href={`https://www.youtube.com/watch?v=${videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="video-thumb"
      style={{ aspectRatio: aspect, backgroundImage: `url(https://img.youtube.com/vi/${videoId}/mqdefault.jpg)` }}
      aria-label={`Watch tutorial video on YouTube: ${title}`}
    >
      <span className="video-play-icon">
        <Play size={16} fill="var(--bg)" strokeWidth={0} />
      </span>
      <span className="video-thumb-label">Watch on YouTube ↗</span>
    </a>
  );
}

/* =========================================================================
   SMALL UI PRIMITIVES
   ========================================================================= */

function Panel({ children, className = "", style = {} }) {
  return (
    <div className={`panel ${className}`} style={style}>
      <span className="corner corner-tl" />
      <span className="corner corner-br" />
      {children}
    </div>
  );
}

function SpecLabel({ children }) {
  return <div className="spec-label">{children}</div>;
}

/* =========================================================================
   BODY MAP VIEW (clickable, non-animated — the navigation surface)
   ========================================================================= */

function Zone({ id, selected, onSelect, children }) {
  return (
    <g
      className={`muscle-zone ${selected ? "muscle-zone-selected" : ""}`}
      onClick={() => onSelect(id)}
      tabIndex={0}
      role="button"
      aria-label={ZONE_LABELS[id]}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(id); } }}
    >
      {children}
    </g>
  );
}

function ZoneGroup({ zones, selectedZone, onSelect }) {
  return (
    <>
      {Object.entries(zones).map(([zoneId, shapes]) => (
        <Zone key={zoneId} id={zoneId} selected={selectedZone === zoneId} onSelect={onSelect}>
          {shapes.map((s, i) => renderShape(s, i))}
        </Zone>
      ))}
    </>
  );
}

function BodyMapView() {
  const [view, setView] = useState("front");
  const [selectedZone, setSelectedZone] = useState(null);
  const [equipTab, setEquipTab] = useState("equipment");

  const handleSelect = (zoneId) => setSelectedZone(zoneId === selectedZone ? null : zoneId);
  const handleViewToggle = (v) => { setView(v); setSelectedZone(null); };

  const zoneExercises = selectedZone
    ? EXERCISES.filter((e) => e.zone === selectedZone && e.equipment === (equipTab === "equipment"))
    : [];

  return (
    <div>
      <div className="bodymap-toggle">
        <button className={`chip ${view === "front" ? "chip-active" : ""}`} onClick={() => handleViewToggle("front")}>Front</button>
        <button className={`chip ${view === "back" ? "chip-active" : ""}`} onClick={() => handleViewToggle("back")}>Back</button>
      </div>

      <Panel className="bodymap-card">
        <SpecLabel>{view === "front" ? "ANTERIOR VIEW" : "POSTERIOR VIEW"} — TAP A MUSCLE GROUP</SpecLabel>
        <svg viewBox="0 0 200 328" className="bodymap-svg">
          <BodyOutline />
          {view === "front" ? <FrontMuscleDetail /> : <BackMuscleDetail />}
          <ZoneGroup zones={view === "front" ? ZONE_SHAPES.front : ZONE_SHAPES.back} selectedZone={selectedZone} onSelect={handleSelect} />
        </svg>
      </Panel>

      {selectedZone && (
        <Panel className="zone-panel">
          <div className="zone-panel-head">
            <div>
              <SpecLabel>SELECTED REGION</SpecLabel>
              <div className="zone-panel-name">{ZONE_LABELS[selectedZone]}</div>
            </div>
            <button className="btn-icon" onClick={() => setSelectedZone(null)} aria-label="Close">
              <X size={15} />
            </button>
          </div>

          <div className="filter-row">
            <button className={`chip ${equipTab === "equipment" ? "chip-active" : ""}`} onClick={() => setEquipTab("equipment")}>
              <Dumbbell size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} /> With Equipment
            </button>
            <button className={`chip ${equipTab === "bodyweight" ? "chip-active" : ""}`} onClick={() => setEquipTab("bodyweight")}>
              <PersonStanding size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Bodyweight Only
            </button>
          </div>

          <div className="zone-ex-list">
            {zoneExercises.length === 0 && <div className="empty-chart">No exercises tagged for this combination yet.</div>}
            {zoneExercises.map((ex) => (
              <div className="zone-ex-row" key={ex.id}>
                <MuscleFlex zone={ex.zone} size={44} />
                <div className="zone-ex-info">
                  <div className="zone-ex-name">{ex.name}</div>
                  <div className="ex-meta">{ex.defaultSets} × {ex.defaultReps} &nbsp;·&nbsp; rest {ex.rest}s</div>
                  <p className="ex-cue">{ex.cue}</p>
                  <VideoThumb videoId={ex.video} title={ex.name} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* =========================================================================
   PLANS VIEW
   ========================================================================= */

function PlansView({ onStart }) {
  const [openPlan, setOpenPlan] = useState(PLANS[0].id);

  return (
    <div className="plans-wrap">
      {PLANS.map((plan) => {
        const isOpen = openPlan === plan.id;
        return (
          <Panel key={plan.id} className="plan-card">
            <button className="plan-head" onClick={() => setOpenPlan(isOpen ? null : plan.id)}>
              <div>
                <div className="plan-name">{plan.name}</div>
                <div className="plan-tag">{plan.tagline}</div>
              </div>
              <ChevronRight size={18} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 150ms ease", color: "var(--line-cyan)", flexShrink: 0 }} />
            </button>
            {isOpen && (
              <div className="plan-days">
                {plan.days.map((day, di) => (
                  <div className="plan-day" key={di}>
                    <div className="plan-day-head">
                      <span className="spec-label" style={{ margin: 0 }}>DAY {di + 1} — {day.label.toUpperCase()}</span>
                      <button className="btn-start" onClick={() => onStart(plan, di)}>
                        <PlayCircle size={15} /> Start
                      </button>
                    </div>
                    <div className="plan-day-exercises">
                      {day.ids.map((id) => {
                        const ex = exById[id];
                        return (
                          <div className="plan-ex-row" key={id}>
                            <MuscleFlex zone={ex.zone} size={26} />
                            <span className="plan-ex-name">{ex.name}</span>
                            <span className="plan-ex-meta">{ex.defaultSets}×{ex.defaultReps}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
}

/* =========================================================================
   SESSION VIEW
   ========================================================================= */

function SessionView({ session, onExit, onFinish }) {
  const { plan, dayIndex } = session;
  const day = plan.days[dayIndex];
  const exercises = day.ids.map((id) => exById[id]);

  const [exIndex, setExIndex] = useState(0);
  const [setsDone, setSetsDone] = useState(0);
  const [resting, setResting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const [completedLog, setCompletedLog] = useState([]);

  const current = exercises[exIndex];

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setResting(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const completeSet = () => {
    const next = setsDone + 1;
    setSetsDone(next);
    if (next >= current.defaultSets) {
      setCompletedLog((l) => [...l, current.id]);
      goNext(true);
    } else {
      setResting(true);
      setTimeLeft(current.rest);
      setRunning(true);
    }
  };

  const goNext = (fromComplete = false) => {
    if (exIndex + 1 < exercises.length) {
      setExIndex((i) => i + 1);
      setSetsDone(0);
      setResting(false);
      setRunning(false);
      clearInterval(intervalRef.current);
    } else {
      const finalLog = fromComplete ? [...completedLog, current.id] : completedLog;
      onFinish({
        planName: plan.name,
        dayLabel: day.label,
        exerciseIds: [...new Set(finalLog)],
        totalExercises: exercises.length,
        date: new Date().toISOString(),
      });
    }
  };

  const skipRest = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setResting(false);
    setTimeLeft(0);
  };

  const progressPct = Math.round((exIndex / exercises.length) * 100);

  return (
    <div className="session-wrap">
      <div className="session-top">
        <button className="btn-ghost" onClick={onExit}>
          <X size={15} /> Exit session
        </button>
        <div className="session-progress-track">
          <div className="session-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="spec-label" style={{ margin: 0 }}>{exIndex + 1} / {exercises.length}</span>
      </div>

      <Panel className="session-card">
        <SpecLabel>{plan.name.toUpperCase()} — {day.label.toUpperCase()}</SpecLabel>
        <div className="session-pose">
          <MuscleFlex zone={current.zone} size={104} />
        </div>
        <div className="session-ex-name">{current.name}</div>
        <div className="session-zone-tag">{ZONE_LABELS[current.zone]} activation</div>
        <p className="ex-cue" style={{ textAlign: "center" }}>{current.cue}</p>
        <div className="session-video">
          <VideoThumb videoId={current.video} title={current.name} aspect="16 / 9" />
        </div>

        <div className="session-set-dots">
          {Array.from({ length: current.defaultSets }).map((_, i) => (
            <span key={i} className={`set-dot ${i < setsDone ? "set-dot-done" : ""}`} />
          ))}
        </div>
        <div className="session-target">
          Target: <strong>{current.defaultReps}</strong> reps · Set {Math.min(setsDone + 1, current.defaultSets)} of {current.defaultSets}
        </div>

        {resting ? (
          <div className="rest-block">
            <div className="rest-timer">{String(Math.floor(timeLeft / 60)).padStart(1, "0")}:{String(timeLeft % 60).padStart(2, "0")}</div>
            <div className="rest-label">REST</div>
            <div className="session-controls">
              <button className="btn-icon" onClick={() => setRunning((r) => !r)}>{running ? <Pause size={16} /> : <Play size={16} />}</button>
              <button className="btn-icon" onClick={() => setTimeLeft(current.rest)}><RotateCcw size={16} /></button>
              <button className="btn-primary" onClick={skipRest}>Skip rest <ChevronRight size={15} /></button>
            </div>
          </div>
        ) : (
          <button className="btn-primary btn-wide" onClick={completeSet}><Check size={16} /> Complete set</button>
        )}
      </Panel>

      <div className="session-nav">
        <button className="btn-ghost" disabled={exIndex === 0} onClick={() => { setExIndex((i) => Math.max(0, i - 1)); setSetsDone(0); setResting(false); setRunning(false); }}>
          <ChevronLeft size={15} /> Previous
        </button>
        <button className="btn-ghost" onClick={() => goNext(false)}>Skip exercise <ChevronRight size={15} /></button>
      </div>
    </div>
  );
}

/* =========================================================================
   PROGRESS VIEW
   ========================================================================= */

function weekKey(dateStr) {
  const d = new Date(dateStr);
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
  return `W${week}`;
}

function ProgressView({ history, loading }) {
  const chartData = (() => {
    const map = {};
    history.forEach((h) => {
      const k = weekKey(h.date);
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).slice(-8).map(([week, sessions]) => ({ week, sessions }));
  })();

  const totalSessions = history.length;
  const totalSets = history.reduce((sum, h) => sum + h.exerciseIds.length, 0);

  return (
    <div>
      <div className="stat-row">
        <Panel className="stat-card"><SpecLabel>SESSIONS LOGGED</SpecLabel><div className="stat-num">{loading ? "—" : totalSessions}</div></Panel>
        <Panel className="stat-card"><SpecLabel>EXERCISES COMPLETED</SpecLabel><div className="stat-num">{loading ? "—" : totalSets}</div></Panel>
        <Panel className="stat-card">
          <SpecLabel>CURRENT STREAK</SpecLabel>
          <div className="stat-num"><Flame size={20} style={{ verticalAlign: "-3px", color: "var(--accent-yellow)" }} /> {loading ? "—" : Math.min(totalSessions, 7)}</div>
        </Panel>
      </div>

      <Panel style={{ marginTop: 16 }}>
        <SpecLabel>SESSIONS PER WEEK</SpecLabel>
        <div style={{ width: "100%", height: 200 }}>
          {chartData.length === 0 ? (
            <div className="empty-chart">No sessions logged yet — finish a workout to see it here.</div>
          ) : (
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--grid-line)" vertical={false} />
                <XAxis dataKey="week" stroke="var(--ink-dim)" fontSize={11} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
                <YAxis stroke="var(--ink-dim)" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 12 }} labelStyle={{ color: "var(--ink)" }} cursor={{ fill: "var(--grid-line)" }} />
                <Bar dataKey="sessions" fill="var(--accent-yellow)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Panel>

      <Panel style={{ marginTop: 16 }}>
        <SpecLabel>SESSION LOG</SpecLabel>
        {history.length === 0 && !loading && <div className="empty-chart">Nothing here yet.</div>}
        <div className="log-list">
          {[...history].reverse().slice(0, 12).map((h, i) => (
            <div className="log-row" key={i}>
              <div className="log-date">{new Date(h.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
              <div className="log-name">{h.planName} — {h.dayLabel}</div>
              <div className="log-count">{h.exerciseIds.length}/{h.totalExercises} exercises</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================================
   ROOT APP
   ========================================================================= */

const STORAGE_KEY = "workout-history";

export default function App() {
  const [tab, setTab] = useState("bodymap");
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY);
        if (result && result.value) setHistory(JSON.parse(result.value));
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistHistory = useCallback(async (next) => {
    setHistory(next);
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* non-fatal */
    }
  }, []);

  const startSession = (plan, dayIndex) => {
    setSession({ plan, dayIndex });
    setTab("session");
  };

  const finishSession = (record) => {
    persistHistory([...history, record]);
    setSession(null);
    setTab("progress");
  };

  const NAV = [
    { id: "bodymap", label: "Body Map", icon: Target },
    { id: "plans", label: "Plans", icon: ListChecks },
    { id: "progress", label: "Progress", icon: LineChartIcon },
  ];

  return (
    <div className="app-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --bg: #0F1E2E;
          --bg-panel: #152740;
          --grid-line: rgba(95,184,201,0.10);
          --line-cyan: #5FB8C9;
          --accent-yellow: #F2C94C;
          --accent-coral: #E8604A;
          --ink: #EDEEE9;
          --ink-dim: #8FA4B8;
          --border: #28405A;
          --font-display: 'Oswald', sans-serif;
          --font-body: 'Manrope', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
        }

        .app-root {
          font-family: var(--font-body);
          background-color: var(--bg);
          background-image: linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
          background-size: 28px 28px;
          color: var(--ink);
          min-height: 100%;
          padding: 20px 16px 60px;
          box-sizing: border-box;
        }
        .app-root * { box-sizing: border-box; }
        .app-root button { font-family: var(--font-body); cursor: pointer; }
        .app-root button:focus-visible, .app-root .chip:focus-visible, .muscle-zone:focus-visible {
          outline: 2px solid var(--accent-yellow);
          outline-offset: 2px;
        }

        .app-header { display: flex; align-items: baseline; justify-content: space-between; max-width: 860px; margin: 0 auto 18px; flex-wrap: wrap; gap: 8px; }
        .app-title { font-family: var(--font-display); font-size: 26px; letter-spacing: 0.03em; text-transform: uppercase; margin: 0; }
        .app-title span { color: var(--line-cyan); }
        .app-sub { font-family: var(--font-mono); font-size: 11px; color: var(--ink-dim); letter-spacing: 0.05em; }

        .nav-row { display: flex; gap: 8px; max-width: 860px; margin: 0 auto 20px; }
        .nav-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; background: var(--bg-panel); border: 1px solid var(--border); color: var(--ink-dim); padding: 10px 8px; font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.04em; font-size: 13px; border-radius: 3px; transition: all 120ms ease; }
        .nav-btn.nav-active { color: var(--bg); background: var(--line-cyan); border-color: var(--line-cyan); }

        .main-col { max-width: 860px; margin: 0 auto; }

        .panel { position: relative; background: var(--bg-panel); border: 1px solid var(--border); border-radius: 4px; padding: 16px; }
        .corner { position: absolute; width: 10px; height: 10px; pointer-events: none; }
        .corner-tl { top: -1px; left: -1px; border-top: 2px solid var(--line-cyan); border-left: 2px solid var(--line-cyan); }
        .corner-br { bottom: -1px; right: -1px; border-bottom: 2px solid var(--line-cyan); border-right: 2px solid var(--line-cyan); }

        .spec-label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.08em; color: var(--line-cyan); margin-bottom: 8px; }

        .filter-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .chip { background: transparent; border: 1px solid var(--border); color: var(--ink-dim); font-size: 12px; padding: 6px 12px; border-radius: 20px; font-family: var(--font-body); font-weight: 600; display: inline-flex; align-items: center; }
        .chip-active { background: var(--accent-yellow); color: var(--bg); border-color: var(--accent-yellow); }

        .bodymap-toggle { display: flex; gap: 8px; max-width: 220px; margin: 0 auto 14px; }
        .bodymap-toggle .chip { flex: 1; justify-content: center; }
        .bodymap-card { display: flex; flex-direction: column; align-items: center; }
        .bodymap-svg { width: 100%; max-width: 260px; height: auto; }
        .body-outline rect, .body-outline circle, .body-outline path { fill: var(--bg); stroke: var(--border); stroke-width: 2; stroke-linejoin: round; }
        .muscle-detail { pointer-events: none; }
        .muscle-detail path { stroke: var(--line-cyan); stroke-width: 0.9; stroke-linecap: round; opacity: 0.4; }
        .muscle-zone { cursor: pointer; }
        .muscle-zone ellipse, .muscle-zone rect, .muscle-zone circle {
          fill: rgba(95,184,201,0.18);
          stroke: var(--line-cyan);
          stroke-width: 1;
          transition: fill 120ms ease, stroke 120ms ease;
        }
        .muscle-zone:hover ellipse, .muscle-zone:hover rect, .muscle-zone:hover circle {
          fill: rgba(242,201,76,0.35);
          stroke: var(--accent-yellow);
        }
        .muscle-zone-selected ellipse, .muscle-zone-selected rect, .muscle-zone-selected circle {
          fill: rgba(232,96,74,0.55) !important;
          stroke: var(--accent-coral) !important;
          stroke-width: 1.5;
        }

        /* animated muscle-activation icon */
        .muscle-flex { flex-shrink: 0; overflow: visible; }
        .flex-body-outline rect, .flex-body-outline circle, .flex-body-outline path { fill: var(--bg); stroke: var(--border); stroke-width: 1.5; opacity: 0.65; stroke-linejoin: round; }
        .flex-shape {
          transform-box: fill-box;
          transform-origin: center;
          fill: var(--accent-coral);
          stroke: var(--accent-coral);
          stroke-width: 1;
          animation: musclePulse 1.1s ease-in-out infinite;
        }
        @keyframes musclePulse {
          0%, 100% { transform: scale(1); opacity: 0.5; filter: drop-shadow(0 0 0px rgba(232,96,74,0)); }
          50% { transform: scale(1.18); opacity: 1; filter: drop-shadow(0 0 4px rgba(232,96,74,0.65)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .flex-shape { animation: none; opacity: 0.85; }
        }

        .zone-panel { margin-top: 14px; }
        .zone-panel-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
        .zone-panel-name { font-family: var(--font-display); font-size: 22px; text-transform: uppercase; letter-spacing: 0.02em; }
        .zone-ex-list { display: flex; flex-direction: column; gap: 12px; }
        .zone-ex-row { display: flex; gap: 12px; align-items: flex-start; border-top: 1px solid var(--border); padding-top: 12px; }
        .zone-ex-row:first-child { border-top: none; padding-top: 0; }
        .zone-ex-info { flex: 1; }
        .zone-ex-name { font-family: var(--font-display); font-size: 16px; letter-spacing: 0.02em; }

        .ex-meta { font-family: var(--font-mono); font-size: 11px; color: var(--ink-dim); margin: 4px 0 4px; }
        .ex-cue { font-size: 12px; color: var(--ink-dim); line-height: 1.4; margin: 0; }

        .video-thumb {
          position: relative;
          display: flex;
          align-items: flex-end;
          width: 100%;
          max-width: 220px;
          margin-top: 10px;
          border: 1px solid var(--border);
          border-radius: 4px;
          background-size: cover;
          background-position: center;
          background-color: var(--bg);
          overflow: hidden;
          padding: 0;
          text-decoration: none;
          cursor: pointer;
          transition: border-color 120ms ease;
        }
        .video-thumb:hover { border-color: var(--line-cyan); }
        .video-thumb::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(15,30,46,0.85), rgba(15,30,46,0.05) 55%);
        }
        .video-play-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--accent-yellow);
          display: flex;
          align-items: center;
          justify-content: center;
          padding-left: 2px;
        }
        .video-thumb-label {
          position: relative;
          z-index: 1;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.06em;
          color: var(--ink);
          padding: 6px 8px;
        }
        .session-video { display: flex; justify-content: center; margin-bottom: 6px; }
        .session-video .video-thumb { max-width: 320px; }

        .plans-wrap { display: flex; flex-direction: column; gap: 12px; }
        .plan-card { padding: 0; overflow: hidden; }
        .plan-head { width: 100%; background: none; border: none; color: var(--ink); display: flex; align-items: center; justify-content: space-between; padding: 16px; text-align: left; }
        .plan-name { font-family: var(--font-display); font-size: 18px; text-transform: uppercase; letter-spacing: 0.02em; }
        .plan-tag { font-size: 12px; color: var(--ink-dim); margin-top: 2px; }
        .plan-days { border-top: 1px solid var(--border); padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 14px; }
        .plan-day-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .plan-day-exercises { display: flex; flex-direction: column; gap: 4px; }
        .plan-ex-row { display: flex; align-items: center; gap: 10px; padding: 4px 0; }
        .plan-ex-name { flex: 1; font-size: 13px; font-weight: 600; }
        .plan-ex-meta { font-family: var(--font-mono); font-size: 11px; color: var(--ink-dim); }

        .btn-start, .btn-primary, .btn-ghost, .btn-icon { font-family: var(--font-body); font-weight: 700; font-size: 12px; border-radius: 3px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--border); }
        .btn-start { background: transparent; color: var(--accent-yellow); border-color: var(--accent-yellow); padding: 6px 10px; }
        .btn-primary { background: var(--accent-yellow); color: var(--bg); border: none; padding: 12px 18px; font-size: 14px; justify-content: center; }
        .btn-wide { width: 100%; }
        .btn-ghost { background: transparent; color: var(--ink-dim); padding: 8px 12px; }
        .btn-ghost:disabled { opacity: 0.35; cursor: default; }
        .btn-icon { background: var(--bg); padding: 8px 10px; color: var(--ink); }

        .session-wrap { display: flex; flex-direction: column; gap: 14px; }
        .session-top { display: flex; align-items: center; gap: 10px; }
        .session-progress-track { flex: 1; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
        .session-progress-fill { height: 100%; background: var(--line-cyan); transition: width 200ms ease; }
        .session-card { text-align: center; padding: 24px 16px; }
        .session-pose { display: flex; justify-content: center; margin: 6px 0 6px; }
        .session-ex-name { font-family: var(--font-display); font-size: 26px; text-transform: uppercase; letter-spacing: 0.02em; }
        .session-zone-tag { font-family: var(--font-mono); font-size: 11px; color: var(--accent-coral); letter-spacing: 0.06em; margin-bottom: 8px; }
        .session-set-dots { display: flex; justify-content: center; gap: 8px; margin: 14px 0 8px; }
        .set-dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--border); }
        .set-dot-done { background: var(--accent-yellow); border-color: var(--accent-yellow); }
        .session-target { font-size: 13px; color: var(--ink-dim); margin-bottom: 18px; }
        .session-target strong { color: var(--ink); }
        .session-controls { display: flex; gap: 8px; justify-content: center; margin-top: 10px; }
        .rest-timer { font-family: var(--font-mono); font-size: 44px; color: var(--accent-yellow); line-height: 1; }
        .rest-label { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.15em; color: var(--ink-dim); margin-top: 4px; }
        .session-nav { display: flex; justify-content: space-between; }

        .stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .stat-card { text-align: center; }
        .stat-num { font-family: var(--font-display); font-size: 30px; color: var(--ink); }
        .empty-chart { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--ink-dim); font-size: 13px; text-align: center; padding: 12px 20px; }

        .log-list { display: flex; flex-direction: column; }
        .log-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-top: 1px solid var(--border); font-size: 13px; }
        .log-row:first-child { border-top: none; }
        .log-date { font-family: var(--font-mono); color: var(--ink-dim); width: 56px; flex-shrink: 0; }
        .log-name { flex: 1; font-weight: 600; }
        .log-count { font-family: var(--font-mono); font-size: 11px; color: var(--line-cyan); }

        @media (max-width: 480px) {
          .stat-row { grid-template-columns: 1fr; }
          .app-title { font-size: 21px; }
        }
      `}</style>

      <div className="app-header">
        <h1 className="app-title">TRAINING<span>.LOG</span></h1>
        <div className="app-sub">MOVEMENT REFERENCE &amp; SESSION PLANNER</div>
      </div>

      {!session && (
        <div className="nav-row">
          {NAV.map((n) => (
            <button key={n.id} className={`nav-btn ${tab === n.id ? "nav-active" : ""}`} onClick={() => setTab(n.id)}>
              <n.icon size={15} /> {n.label}
            </button>
          ))}
        </div>
      )}

      <div className="main-col">
        {session ? (
          <SessionView session={session} onExit={() => { setSession(null); setTab("plans"); }} onFinish={finishSession} />
        ) : tab === "bodymap" ? (
          <BodyMapView />
        ) : tab === "plans" ? (
          <PlansView onStart={startSession} />
        ) : (
          <ProgressView history={history} loading={loading} />
        )}
      </div>
    </div>
  );
}
