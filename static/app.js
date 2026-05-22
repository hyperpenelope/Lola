const paramGroups = [
  {
    id: "speech",
    title: "Speech",
    note: "Recognition model, utterance boundary, and input buffering.",
    controls: [
      { path: "speech.model_path", label: "Model path", type: "text", value: "./vosk-model/vosk-model" },
      { path: "speech.glasgow_csv", label: "Glasgow CSV", type: "text", value: "./glasgow.csv" },
      { path: "speech.min_partial_chars", label: "Minimum partial chars", type: "range", min: 1, max: 12, step: 1, value: 1 },
      { path: "speech.short_pause_sec", label: "Short pause", type: "range", min: 0.001, max: 0.2, step: 0.001, value: 0.005, suffix: "s" },
      { path: "speech.block_size", label: "Input block size", type: "range", min: 512, max: 8192, step: 128, value: 4000 },
      { path: "speech.audio_queue_max_chunks", label: "Audio queue chunks", type: "range", min: 32, max: 1024, step: 1, value: 256 }
    ]
  },
  {
    id: "composer",
    title: "Composer",
    note: "Rhythm, event emission, voice count, decay, and event shaping.",
    controls: [
      { path: "composer.bpm", label: "BPM", type: "range", min: 30, max: 180, step: 1, value: 120, suffix: " BPM" },
      { path: "composer.bar_beats", label: "Beats per bar", type: "range", min: 1, max: 12, step: 1, value: 4 },
      { path: "composer.max_voices", label: "Max voices", type: "range", min: 1, max: 12, step: 1, value: 4 },
      { path: "composer.rotate_patterns", label: "Rotate patterns", type: "boolean", value: true },
      { path: "composer.step_size_choices", label: "Step size choices", type: "text", value: "2, 4, 6" },
      { path: "composer.decay_per_hit", label: "Decay per hit", type: "range", min: 0.05, max: 1, step: 0.01, value: 0.5 },
      { path: "composer.min_gain", label: "Minimum gain", type: "range", min: 0.01, max: 0.5, step: 0.01, value: 0.05 },
      { path: "composer.event_min_duration", label: "Minimum event duration", type: "range", min: 0.01, max: 0.5, step: 0.01, value: 0.05, suffix: "s" },
      { path: "composer.default_word_duration", label: "Default word duration", type: "range", min: 0.03, max: 1.2, step: 0.01, value: 0.2, suffix: "s" },
      { path: "composer.replacements_per_bar", label: "Replacements per bar", type: "range", min: 1, max: 8, step: 1, value: 2 },
      { path: "composer.note_length_choices", label: "Note length choices", type: "text", value: "1, 0.5, 0.25", help: "Fractions of the current rhythmic slot. Example: whole, half, quarter." },
      { path: "composer.note_length_random", label: "Randomize note length", type: "boolean", value: true, help: "Randomly choose from the allowed fractions." },
    ]
  },
  {
    id: "composer-visual",
    title: "Composer Visual Emission",
    note: "Ranges used by composer when emitting visual events.",
    controls: [
      { path: "composer.visual_x_range", label: "Visual X range", type: "text", value: "-6.0, 6.0" },
      { path: "composer.visual_y_range", label: "Visual Y range", type: "text", value: "-1.0, 1.0" },
      { path: "composer.visual_z_range", label: "Visual Z range", type: "text", value: "-1.5, 1.5" }
    ]
  },
  {
    id: "playback",
    title: "Playback",
    note: "Simple synth output, note queue, and gain shaping.",
    controls: [
      { path: "playback.sample_rate", label: "Sample rate", type: "number", min: 8000, max: 96000, step: 1, value: 16000 },
      { path: "playback.block_size", label: "Output block size", type: "range", min: 128, max: 4096, step: 64, value: 1024 },
      { path: "playback.master_gain", label: "Master gain", type: "range", min: 0, max: 1, step: 0.01, value: 0.35 },
      { path: "playback.fade_ms", label: "Fade ms", type: "range", min: 0, max: 50, step: 1, value: 10, suffix: "ms" },
      { path: "playback.queue_size", label: "Queue size", type: "range", min: 8, max: 1024, step: 1, value: 256 }
    ]
  },
  {
    id: "droner",
    title: "Droner",
    note: "Continuous ambient drone generator driven by global affect state.",
    controls: [
      { path: "droner.enabled", label: "Enabled", type: "boolean", value: false },
      { path: "droner.tick_sec", label: "Tick seconds", type: "range", min: 0.05, max: 2.0, step: 0.01, value: 0.25, suffix: "s" },
      { path: "droner.tonic_midi", label: "Tonic MIDI", type: "range", min: 24, max: 84, step: 1, value: 45 },
      { path: "droner.base_channel", label: "Base channel", type: "range", min: 1, max: 120, step: 1, value: 40 },
      { path: "droner.min_active_voices", label: "Min active voices", type: "range", min: 1, max: 8, step: 1, value: 1 },
      { path: "droner.max_active_voices", label: "Max active voices", type: "range", min: 1, max: 8, step: 1, value: 4 },
      { path: "droner.register_min_midi", label: "Register min MIDI", type: "range", min: 12, max: 96, step: 1, value: 36 },
      { path: "droner.register_max_midi", label: "Register max MIDI", type: "range", min: 24, max: 108, step: 1, value: 72 },
      { path: "droner.min_note_duration_sec", label: "Min note duration", type: "range", min: 0.5, max: 20.0, step: 0.1, value: 3.0, suffix: "s" },
      { path: "droner.max_note_duration_sec", label: "Max note duration", type: "range", min: 1.0, max: 30.0, step: 0.1, value: 10.0, suffix: "s" },
      { path: "droner.min_gap_sec", label: "Min gap", type: "range", min: 0.1, max: 20.0, step: 0.1, value: 1.0, suffix: "s" },
      { path: "droner.max_gap_sec", label: "Max gap", type: "range", min: 0.2, max: 30.0, step: 0.1, value: 6.0, suffix: "s" },
      { path: "droner.velocity_min", label: "Velocity min", type: "range", min: 1, max: 127, step: 1, value: 30 },
      { path: "droner.velocity_max", label: "Velocity max", type: "range", min: 1, max: 127, step: 1, value: 72 }
    ]
  },
  {
    id: "visual-core",
    title: "Visual Core",
    note: "Visual engine queueing, generator choice, and shared background video.",
    controls: [
      { path: "visual.active_generator", label: "Active generator", type: "select", value: "fireflight", options: ["fireflight", "waver"] },
      { path: "visual.queue_size", label: "Visual queue size", type: "range", min: 8, max: 1024, step: 1, value: 256 },
      { path: "visual.video_enabled", label: "Background video enabled", type: "boolean", value: true },
      { path: "visual.video_path", label: "Background video path", type: "text", value: "" },
      { path: "visual.video_muted", label: "Background video muted", type: "boolean", value: true }
    ]
  },
    {
      id: "subtitles",
      title: "Subtitles",
      note: "Transcript overlay, wrapping, stacking, and visual depth.",
      controls: [
        { path: "visual.subtitles_enabled", label: "Subtitles enabled", type: "boolean", value: true },
        { path: "visual.subtitle_preview_enabled", label: "Live preview enabled", type: "boolean", value: true },
        { path: "visual.subtitle_max_rows", label: "Max visible rows", type: "range", min: 1, max: 16, step: 1, value: 6 },
        { path: "visual.subtitle_max_chars_per_line", label: "Max chars per line", type: "range", min: 12, max: 100, step: 1, value: 42 },
        { path: "visual.subtitle_top_margin", label: "Top margin", type: "range", min: 20, max: 300, step: 1, value: 80 },
        { path: "visual.subtitle_base_font_size", label: "Base font size", type: "range", min: 12, max: 64, step: 1, value: 28 },
        { path: "visual.subtitle_depth_scale", label: "Depth scale", type: "range", min: 0.5, max: 1, step: 0.01, value: 0.88 },
        { path: "visual.subtitle_depth_alpha", label: "Depth alpha", type: "range", min: 0.2, max: 1, step: 0.01, value: 0.78 },
        { path: "visual.subtitle_attack", label: "Highlight attack", type: "range", min: 1, max: 20, step: 0.1, value: 10.0 },
        { path: "visual.subtitle_release", label: "Highlight release", type: "range", min: 1, max: 20, step: 0.1, value: 6.0 },
        { path: "visual.subtitle_stopword_only_timeout", label: "Stopword-only timeout", type: "range", min: 0.2, max: 10, step: 0.1, value: 2.0 },
        { path: "visual.subtitle_move_speed", label: "Move speed", type: "range", min: 1, max: 30, step: 0.1, value: 10.0 },
        { path: "visual.subtitle_fade_speed", label: "Fade speed", type: "range", min: 1, max: 30, step: 0.1, value: 8.0 },
        { path: "visual.subtitle_font_name", label: "Font name", type: "text", value: "Arial" },
        { path: "visual.subtitle_shadow_enabled", label: "Shadow enabled", type: "boolean", value: true },
        { path: "visual.subtitle_shadow_dx", label: "Shadow X", type: "range", min: -8, max: 8, step: 1, value: 2 },
        { path: "visual.subtitle_shadow_dy", label: "Shadow Y", type: "range", min: -8, max: 8, step: 1, value: -2 },
        { path: "visual.subtitle_shadow_alpha", label: "Shadow alpha", type: "range", min: 0, max: 1, step: 0.01, value: 0.35 },
        { path: "visual.subtitle_glow_enabled", label: "Glow enabled", type: "boolean", value: true },
        { path: "visual.subtitle_glow_alpha", label: "Glow alpha", type: "range", min: 0, max: 1, step: 0.01, value: 0.18 },
        { path: "visual.subtitle_glow_size", label: "Glow size", type: "range", min: 0, max: 6, step: 1, value: 2 },
      ]
    },
  {
    id: "fireflight",
    title: "Fireflight",
    note: "Firefly and trail scene values.",
    controls: [
      { path: "fireflight.width", label: "Window width", type: "number", min: 320, max: 3840, step: 1, value: 1280 },
      { path: "fireflight.height", label: "Window height", type: "number", min: 240, max: 2160, step: 1, value: 720 },
      { path: "fireflight.camera_distance", label: "Camera distance", type: "range", min: -40, max: -2, step: 0.1, value: -17 },
      { path: "fireflight.camera_dolly_speed", label: "Camera dolly speed", type: "range", min: 0, max: 4, step: 0.01, value: 0.2 },
      { path: "fireflight.max_trail_points", label: "Max trail points", type: "range", min: 1000, max: 500000, step: 1000, value: 250000 },
      { path: "fireflight.trail_sample_distance", label: "Trail sample distance", type: "range", min: 0.05, max: 4, step: 0.01, value: 1.0055 },
      { path: "fireflight.spawn_forward_distance", label: "Spawn forward distance", type: "range", min: 1, max: 40, step: 0.1, value: 10.5 },
      { path: "fireflight.spawn_ground_height", label: "Spawn ground height", type: "range", min: -6, max: 6, step: 0.05, value: 1.15 },
      { path: "fireflight.spawn_x_scale", label: "Spawn X scale", type: "range", min: 0.1, max: 10, step: 0.05, value: 1.5 },
      { path: "fireflight.spawn_y_scale", label: "Spawn Y scale", type: "range", min: 0.1, max: 10, step: 0.05, value: 1.35 },
      { path: "fireflight.spawn_z_scale", label: "Spawn Z scale", type: "range", min: 0.1, max: 10, step: 0.05, value: 0.8 },
      { path: "fireflight.update_hz", label: "Update Hz", type: "range", min: 10, max: 240, step: 1, value: 120 }
    ]
  },
  {
    id: "waver",
    title: "Waver",
    note: "Wave field generator values.",
    controls: [
      { path: "waver.width", label: "Window width", type: "number", min: 320, max: 3840, step: 1, value: 1280 },
      { path: "waver.height", label: "Window height", type: "number", min: 240, max: 2160, step: 1, value: 720 },
      { path: "waver.num_particles", label: "Particle count", type: "range", min: 1000, max: 60000, step: 500, value: 22000 },
      { path: "waver.camera_distance", label: "Camera distance", type: "range", min: -20, max: -1, step: 0.1, value: -5 },
      { path: "waver.stream_half_length", label: "Stream half length", type: "range", min: 0.5, max: 12, step: 0.1, value: 4.0 },
      { path: "waver.stream_half_width", label: "Stream half width", type: "range", min: 0.5, max: 12, step: 0.1, value: 3.0 },
      { path: "waver.stream_half_height", label: "Stream half height", type: "range", min: 0.5, max: 12, step: 0.1, value: 2.0 },
      { path: "waver.fade_distance", label: "Fade distance", type: "range", min: 0.5, max: 12, step: 0.1, value: 5.0 },
      { path: "waver.wind_speed", label: "Wind speed", type: "range", min: 0.01, max: 2, step: 0.01, value: 0.15 },
      { path: "waver.spawn_jitter", label: "Spawn jitter", type: "range", min: 0, max: 4, step: 0.01, value: 1.0 },
      { path: "waver.update_hz", label: "Update Hz", type: "range", min: 10, max: 240, step: 1, value: 120 }
    ]
  },
  {
    id: "folier",
    title: "Folier",
    note: "Scene SFX scheduler and sample-folder root. Each line uses a folder with the same name under samples_root.",
    controls: [
      { path: "folier.enabled", label: "Enabled", type: "boolean", value: false },
      { path: "folier.tick_sec", label: "Tick seconds", type: "range", min: 0.05, max: 2.0, step: 0.01, value: 0.25, suffix: "s" },
      { path: "folier.samples_root", label: "Samples root", type: "text", value: "samples" },
      { path: "folier.activity_per_word", label: "Activity per word", type: "range", min: 0, max: 5, step: 0.01, value: 1.0 },
      { path: "folier.activity_decay_per_sec", label: "Activity decay / sec", type: "range", min: 0, max: 2, step: 0.01, value: 0.08 },
      { path: "folier.activity_max", label: "Activity max", type: "range", min: 1, max: 500, step: 1, value: 100.0 }
    ]
  },
];
const folierLineDefaults = {
  name: "new-line",
  enabled: true,
  mode: "sporadic",
  base_epm: 2.0,
  epm_per_activity: 0.0,
  max_polyphony: 1,
  gain_min: 0.15,
  gain_max: 0.30,
  gain_per_activity: 0.0,
  rate_min: 0.95,
  rate_max: 1.05,
  rate_per_activity: 0.0,
  lowpass_hz: 0.0,
  lowpass_per_activity: 0.0,
  highpass_hz: 0.0,
  highpass_per_activity: 0.0,
  delay_mix: 0.0,
  delay_mix_per_activity: 0.0,
  delay_time_min: 0.20,
  delay_time_max: 0.40,
  delay_feedback_min: 0.15,
  delay_feedback_max: 0.35,
  reverb_mix: 0.0,
  reverb_mix_per_activity: 0.0,
  distortion_drive: 0.0,
  distortion_per_activity: 0.0,
  min_duration_sec: 1.0,
  max_duration_sec: 4.0
};

const folierLineFieldDefs = [
  { key: "name", label: "Line name", type: "text" },
  { key: "enabled", label: "Enabled", type: "boolean" },
  { key: "mode", label: "Mode", type: "select", options: ["bed", "sporadic", "clustered"] },

  { key: "base_epm", label: "Base events/min", type: "number", step: 0.01 },
  { key: "epm_per_activity", label: "Events/min per activity", type: "number", step: 0.01 },
  { key: "max_polyphony", label: "Max polyphony", type: "number", step: 1, min: 1 },

  { key: "gain_min", label: "Gain min", type: "number", step: 0.01 },
  { key: "gain_max", label: "Gain max", type: "number", step: 0.01 },
  { key: "gain_per_activity", label: "Gain per activity", type: "number", step: 0.001 },

  { key: "rate_min", label: "Rate min", type: "number", step: 0.01 },
  { key: "rate_max", label: "Rate max", type: "number", step: 0.01 },
  { key: "rate_per_activity", label: "Rate per activity", type: "number", step: 0.001 },

  { key: "lowpass_hz", label: "Lowpass Hz", type: "number", step: 1 },
  { key: "lowpass_per_activity", label: "Lowpass per activity", type: "number", step: 0.1 },
  { key: "highpass_hz", label: "Highpass Hz", type: "number", step: 1 },
  { key: "highpass_per_activity", label: "Highpass per activity", type: "number", step: 0.1 },

  { key: "delay_mix", label: "Delay mix", type: "number", step: 0.01 },
  { key: "delay_mix_per_activity", label: "Delay mix per activity", type: "number", step: 0.001 },
  { key: "delay_time_min", label: "Delay time min", type: "number", step: 0.01 },
  { key: "delay_time_max", label: "Delay time max", type: "number", step: 0.01 },
  { key: "delay_feedback_min", label: "Delay fb min", type: "number", step: 0.01 },
  { key: "delay_feedback_max", label: "Delay fb max", type: "number", step: 0.01 },

  { key: "reverb_mix", label: "Reverb mix", type: "number", step: 0.01 },
  { key: "reverb_mix_per_activity", label: "Reverb mix per activity", type: "number", step: 0.001 },

  { key: "distortion_drive", label: "Distortion drive", type: "number", step: 0.01 },
  { key: "distortion_per_activity", label: "Distortion per activity", type: "number", step: 0.001 },

  { key: "min_duration_sec", label: "Min duration", type: "number", step: 0.01 },
  { key: "max_duration_sec", label: "Max duration", type: "number", step: 0.01 }
];

let folierLines = [];
let initialFolierLines = [];
let folierLinesSectionEl = null;
let folierLinesListEl = null;
let folierLinesCountEl = null;

const state = {};
const initial = {};
const cards = new Map();
let sendTimer = null;
let lastPayload = null;
let statusTimer = null;
let selectedPresetName = "none";

const controlsEl = document.querySelector("#controls");
const navEl = document.querySelector("#nav");
const payloadEl = document.querySelector("#payload");
const toastEl = document.querySelector("#toast");
const presetsEl = document.querySelector("#presets");

function getApiBase() {
  return document.querySelector("#endpoint").value.trim().replace("/\\/$/", "");
}

function flattenObject(value, prefix = "", out = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return out;
  }

  Object.entries(value).forEach(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      flattenObject(child, path, out);
    } else {
      out[path] = child;
    }
  });

  return out;
}

function nestedObjectFromState(values) {
  const out = {};

  Object.entries(values).forEach(([path, value]) => {
    const parts = path.split(".");
    let cursor = out;

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        cursor[part] = parseSpecialValue(path, value);
        return;
      }
      if (!cursor[part] || typeof cursor[part] !== "object" || Array.isArray(cursor[part])) {
        cursor[part] = {};
      }
      cursor = cursor[part];
    });
  });

  return out;
}

function parseSpecialValue(path, value) {
  if (typeof value !== "string") {
    return value;
  }

  const rangeKeys = new Set([
    "composer.visual_x_range",
    "composer.visual_y_range",
    "composer.visual_z_range"
  ]);

  if (rangeKeys.has(path)) {
    return value
      .split(",")
      .map(part => Number(part.trim()))
      .filter(part => !Number.isNaN(part));
  }

  if (path === "composer.step_size_choices") {
    return value
      .split(",")
      .map(part => Number(part.trim()))
      .filter(part => !Number.isNaN(part));
  }

  return value;
}

function controlByPath(path) {
  for (const group of paramGroups) {
    const control = group.controls.find(item => item.path === path);
    if (control) return control;
  }
  return null;
}

function initState() {
  paramGroups.forEach(group => {
    group.controls.forEach(control => {
      state[control.path] = control.value;
      initial[control.path] = control.value;
    });
  });
}

function deepCloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function toFiniteNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeFolierLine(line = {}, index = 0) {
  return {
    ...deepCloneJson(folierLineDefaults),
    ...line,
    name: String(line.name || `line-${index + 1}`).trim() || `line-${index + 1}`,
    enabled: line.enabled !== false,
    mode: ["bed", "sporadic", "clustered"].includes(String(line.mode || "")) ? String(line.mode) : "sporadic",
    base_epm: toFiniteNumber(line.base_epm, folierLineDefaults.base_epm),
    epm_per_activity: toFiniteNumber(line.epm_per_activity, folierLineDefaults.epm_per_activity),
    max_polyphony: Math.max(1, Math.round(toFiniteNumber(line.max_polyphony, folierLineDefaults.max_polyphony))),
    gain_min: toFiniteNumber(line.gain_min, folierLineDefaults.gain_min),
    gain_max: toFiniteNumber(line.gain_max, folierLineDefaults.gain_max),
    gain_per_activity: toFiniteNumber(line.gain_per_activity, folierLineDefaults.gain_per_activity),
    rate_min: toFiniteNumber(line.rate_min, folierLineDefaults.rate_min),
    rate_max: toFiniteNumber(line.rate_max, folierLineDefaults.rate_max),
    rate_per_activity: toFiniteNumber(line.rate_per_activity, folierLineDefaults.rate_per_activity),
    lowpass_hz: toFiniteNumber(line.lowpass_hz, folierLineDefaults.lowpass_hz),
    lowpass_per_activity: toFiniteNumber(line.lowpass_per_activity, folierLineDefaults.lowpass_per_activity),
    highpass_hz: toFiniteNumber(line.highpass_hz, folierLineDefaults.highpass_hz),
    highpass_per_activity: toFiniteNumber(line.highpass_per_activity, folierLineDefaults.highpass_per_activity),
    delay_mix: toFiniteNumber(line.delay_mix, folierLineDefaults.delay_mix),
    delay_mix_per_activity: toFiniteNumber(line.delay_mix_per_activity, folierLineDefaults.delay_mix_per_activity),
    delay_time_min: toFiniteNumber(line.delay_time_min, folierLineDefaults.delay_time_min),
    delay_time_max: toFiniteNumber(line.delay_time_max, folierLineDefaults.delay_time_max),
    delay_feedback_min: toFiniteNumber(line.delay_feedback_min, folierLineDefaults.delay_feedback_min),
    delay_feedback_max: toFiniteNumber(line.delay_feedback_max, folierLineDefaults.delay_feedback_max),
    reverb_mix: toFiniteNumber(line.reverb_mix, folierLineDefaults.reverb_mix),
    reverb_mix_per_activity: toFiniteNumber(line.reverb_mix_per_activity, folierLineDefaults.reverb_mix_per_activity),
    distortion_drive: toFiniteNumber(line.distortion_drive, folierLineDefaults.distortion_drive),
    distortion_per_activity: toFiniteNumber(line.distortion_per_activity, folierLineDefaults.distortion_per_activity),
    min_duration_sec: toFiniteNumber(line.min_duration_sec, folierLineDefaults.min_duration_sec),
    max_duration_sec: toFiniteNumber(line.max_duration_sec, folierLineDefaults.max_duration_sec)
  };
}

function serializeFolierLine(line, index = 0) {
  return normalizeFolierLine(line, index);
}

function setFolierLines(lines, syncInitial = false) {
  folierLines = Array.isArray(lines)
    ? lines.map((line, index) => normalizeFolierLine(line, index))
    : [];

  if (syncInitial) {
    initialFolierLines = deepCloneJson(folierLines);
  }

  renderFolierLines();
}

function folierSamplesRoot() {
  return String(state["folier.samples_root"] || "samples/folier");
}

function makeFolierLineSearchText(line) {
  return `folier ${line.name} ${line.mode} ${folierSamplesRoot()}/${line.name}`.toLowerCase();
}

function createFolierLinesSection() {
  const navLink = document.createElement("a");
  navLink.href = "#folier-lines";
  navLink.innerHTML = `<span>Folier Lines</span><span id="folierLinesCount">0</span>`;
  navEl.appendChild(navLink);

  const section = document.createElement("section");
  section.className = "group";
  section.id = "folier-lines";
  section.innerHTML = `
    <div class="group-head">
      <div>
        <h3>Folier Lines</h3>
        <p>Each line uses samples from <code>folier.samples_root/&lt;line-name&gt;/</code>.</p>
      </div>
      <div class="line-toolbar">
        <button id="addFolierLineBtn" class="primary small" type="button">Add line</button>
      </div>
    </div>
    <div id="folierLinesList" class="folier-lines-list"></div>
  `;

  controlsEl.appendChild(section);

  folierLinesSectionEl = section;
  folierLinesListEl = section.querySelector("#folierLinesList");
  folierLinesCountEl = navLink.querySelector("#folierLinesCount");

  section.querySelector("#addFolierLineBtn").addEventListener("click", () => {
    addFolierLine();
  });
}

function createFolierField(field, line, index, card) {
  const wrap = document.createElement("label");
  wrap.className = "line-field";

  const title = document.createElement("span");
  title.textContent = field.label;
  wrap.appendChild(title);

  if (field.type === "boolean") {
    const toggle = document.createElement("label");
    toggle.className = "toggle";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!line[field.key];
    input.addEventListener("change", () => {
      folierLines[index][field.key] = input.checked;
      onFolierLinesChanged(`folier.lines.${index}.${field.key}`);
    });

    const text = document.createElement("span");
    text.textContent = "Enabled";

    toggle.append(input, text);
    wrap.appendChild(toggle);
    return wrap;
  }

  let input;
  if (field.type === "select") {
    input = document.createElement("select");
    field.options.forEach(option => {
      const opt = document.createElement("option");
      opt.value = option;
      opt.textContent = option;
      input.appendChild(opt);
    });
    input.value = line[field.key];
    input.addEventListener("change", () => {
      folierLines[index][field.key] = input.value;
      card.dataset.search = makeFolierLineSearchText(folierLines[index]);
      onFolierLinesChanged(`folier.lines.${index}.${field.key}`);
    });
  } else {
    input = document.createElement("input");
    input.type = field.type === "number" ? "number" : "text";
    if (field.min !== undefined) input.min = field.min;
    if (field.max !== undefined) input.max = field.max;
    input.step = field.step ?? (field.type === "number" ? "any" : "");
    input.value = line[field.key];

    input.addEventListener("input", () => {
      let nextValue = input.value;
      if (field.type === "number") {
        nextValue = toFiniteNumber(input.value, folierLineDefaults[field.key] ?? 0);
      }

      folierLines[index][field.key] = nextValue;

      if (field.key === "name" || field.key === "mode") {
        card.dataset.search = makeFolierLineSearchText(folierLines[index]);

        const titleEl = card.querySelector(".folier-line-title");
        if (titleEl) titleEl.textContent = folierLines[index].name;

        const folderEl = card.querySelector(".folier-line-folder");
        if (folderEl) folderEl.textContent = `${folierSamplesRoot()}/${folierLines[index].name}/`;
      }

      onFolierLinesChanged(`folier.lines.${index}.${field.key}`);
    });
  }

  wrap.appendChild(input);
  return wrap;
}

function createFolierLineCard(line, index) {
  const card = document.createElement("article");
  card.className = "control folier-line-card";
  card.dataset.search = makeFolierLineSearchText(line);

  const head = document.createElement("div");
  head.className = "control-head";
  head.innerHTML = `
    <div>
      <h4 class="folier-line-title">${line.name}</h4>
      <p class="folier-line-folder">${folierSamplesRoot()}/${line.name}/</p>
    </div>
  `;

  const removeBtn = document.createElement("button");
  removeBtn.className = "secondary small";
  removeBtn.type = "button";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", () => {
    removeFolierLine(index);
  });

  head.appendChild(removeBtn);
  card.appendChild(head);

  const grid = document.createElement("div");
  grid.className = "line-grid";

  folierLineFieldDefs.forEach(field => {
    grid.appendChild(createFolierField(field, line, index, card));
  });

  card.appendChild(grid);
  return card;
}

function renderFolierLines() {
  if (!folierLinesListEl) return;

  folierLinesListEl.innerHTML = "";
  if (folierLinesCountEl) {
    folierLinesCountEl.textContent = String(folierLines.length);
  }

  if (!folierLines.length) {
    const empty = document.createElement("article");
    empty.className = "control";
    empty.innerHTML = `<p>No Folier lines yet. Add one to start building the scene soundscape.</p>`;
    folierLinesListEl.appendChild(empty);
    return;
  }

  folierLines.forEach((line, index) => {
    folierLinesListEl.appendChild(createFolierLineCard(line, index));
  });
}

function onFolierLinesChanged(reason = "folier.lines") {
  const payload = {
    source: "control-panel",
    timestamp: new Date().toISOString(),
    request: "config/set",
    key: "folier.lines",
    reason,
    value: folierLines.map((line, index) => serializeFolierLine(line, index))
  };

  showPayload(payload);

  if (document.querySelector("#autoSend").checked) {
    scheduleSend(sendFolierLines, payload);
  }
}

function addFolierLine() {
  const nextIndex = folierLines.length + 1;
  folierLines.push(normalizeFolierLine({ name: `line-${nextIndex}` }, nextIndex - 1));
  renderFolierLines();
  onFolierLinesChanged("folier.lines.add");
}

function removeFolierLine(index) {
  folierLines.splice(index, 1);
  renderFolierLines();
  onFolierLinesChanged("folier.lines.remove");
}

async function sendFolierLines() {
  try {
    const payload = {
      key: "folier.lines",
      value: folierLines.map((line, index) => serializeFolierLine(line, index))
    };

    await apiFetch("/config/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setStatus("Connected", true);
    document.querySelector("#lastSync").textContent = new Date().toLocaleTimeString();
    toast("Folier lines updated");
  } catch (error) {
    setStatus("Endpoint unavailable", false);
    toast(error.message);
  }
}

function initUi() {
  paramGroups.forEach(group => {
    const navLink = document.createElement("a");
    navLink.href = `#${group.id}`;
    navLink.innerHTML = `<span>${group.title}</span><span>${group.controls.length}</span>`;
    navEl.appendChild(navLink);

    const section = document.createElement("section");
    section.className = "group";
    section.id = group.id;
    section.innerHTML = `
      <div class="group-head">
        <div>
          <h3>${group.title}</h3>
          <p>${group.note}</p>
        </div>
      </div>
      <div class="group-grid"></div>
    `;

    const grid = section.querySelector(".group-grid");

    group.controls.forEach(control => {
      grid.appendChild(createControl(control));
    });

    controlsEl.appendChild(section);
  });

  createFolierLinesSection();
  renderFolierLines();
}

function createControl(control) {
  const card = document.createElement("article");
  card.className = "control";
  card.dataset.path = control.path;
  card.dataset.search = `${control.path} ${control.label} ${control.help || ""} ${control.type}`.toLowerCase();

  const valueText = formatValue(control, state[control.path]);

  card.innerHTML = `
    <div class="control-head">
      <div>
        <h4>${control.label}</h4>
        <p>${control.help || ""}</p>
      </div>
      <span class="value">${valueText}</span>
    </div>
    <div class="input-slot"></div>
  `;

  const slot = card.querySelector(".input-slot");
  const valueEl = card.querySelector(".value");
  const syncers = [];

  if (control.type === "range") {
    slot.classList.add("range-row");

    const range = document.createElement("input");
    range.type = "range";
    range.min = control.min;
    range.max = control.max;
    range.step = control.step;
    range.value = state[control.path];

    const number = document.createElement("input");
    number.type = "number";
    number.min = control.min;
    number.max = control.max;
    number.step = control.step;
    number.value = state[control.path];

    range.addEventListener("input", () => updateControl(control, castValue(control, range.value), valueEl));
    number.addEventListener("input", () => updateControl(control, castValue(control, number.value), valueEl));

    syncers.push(value => {
      range.value = value;
      number.value = value;
    });

    slot.append(range, number);
  }

  if (control.type === "number") {
    const input = document.createElement("input");
    input.type = "number";
    input.min = control.min ?? "";
    input.max = control.max ?? "";
    input.step = control.step ?? 1;
    input.value = state[control.path];
    input.addEventListener("input", () => updateControl(control, castValue(control, input.value), valueEl));
    syncers.push(value => {
      input.value = value;
    });
    slot.appendChild(input);
  }

  if (control.type === "text") {
    const input = document.createElement("input");
    input.type = "text";
    input.value = state[control.path];
    input.addEventListener("input", () => updateControl(control, input.value, valueEl));
    syncers.push(value => {
      input.value = value;
    });
    slot.appendChild(input);
  }

  if (control.type === "select") {
    const input = document.createElement("select");
    control.options.forEach(option => {
      const opt = document.createElement("option");
      opt.value = option;
      opt.textContent = option;
      input.appendChild(opt);
    });
    input.value = state[control.path];
    input.addEventListener("change", () => updateControl(control, input.value, valueEl));
    syncers.push(value => {
      input.value = value;
    });
    slot.appendChild(input);
  }

  if (control.type === "boolean") {
    const label = document.createElement("label");
    label.className = "toggle";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!state[control.path];
    input.addEventListener("change", () => updateControl(control, input.checked, valueEl));
    const span = document.createElement("span");
    span.textContent = "Enabled";
    label.append(input, span);
    syncers.push(value => {
      input.checked = !!value;
    });
    slot.appendChild(label);
  }

  cards.set(control.path, {
    card,
    control,
    valueEl,
    sync(value) {
      syncers.forEach(fn => fn(value));
    }
  });

  return card;
}

function castValue(control, raw) {
  if (control.type === "number" || control.type === "range") {
    return Number(raw);
  }
  if (control.type === "boolean") {
    return !!raw;
  }
  return raw;
}

function formatValue(control, value) {
  if (typeof value === "boolean") return value ? "on" : "off";
  if (Array.isArray(value)) return value.join(", ");
  return `${value}${control.suffix || ""}`;
}

function updateControl(control, value, valueEl, silent = false) {
  const previous = state[control.path];
  state[control.path] = value;
  valueEl.textContent = formatValue(control, value);
  const entry = cards.get(control.path);
  if (entry) entry.sync(value);

  updateReadouts();

  if (silent) return;

  const payload = {
    source: "control-panel",
    timestamp: new Date().toISOString(),
    request: "config/set",
    key: control.path,
    value: parseSpecialValue(control.path, value),
    previous
  };

  showPayload(payload);

  if (document.querySelector("#autoSend").checked) {
    scheduleSend(() => sendSingle(control.path, value), payload);
  }
}

function scheduleSend(action, payload) {
  clearTimeout(sendTimer);
  sendTimer = setTimeout(async () => {
    await action();
    if (payload) lastPayload = payload;
  }, 180);
}

function showPayload(payload) {
  lastPayload = payload;
  payloadEl.textContent = JSON.stringify(payload, null, 2);
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${getApiBase()}${path}`, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

async function sendSingle(path, value) {
  try {
    const payload = {
      key: path,
      value: parseSpecialValue(path, value)
    };

    const data = await apiFetch("/config/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setStatus("Connected", true);
    document.querySelector("#lastSync").textContent = new Date().toLocaleTimeString();
    toast("Config updated");

    if (data.config) {
      applyBackendConfig(data.config, false);
    }

    if (data.info) {
      const presetFromBackend =
        data.info.current_preset ||
        data.info.loaded_preset ||
        data.info.active_preset ||
        data.info.preset_name ||
        null;

      if (presetFromBackend) {
        setSelectedPreset(presetFromBackend);
      }
    }
  } catch (error) {
    setStatus("Endpoint unavailable", false);
    toast(error.message);
  }
}

async function sendAll() {
  const values = nestedObjectFromState(state);
  values.folier = values.folier || {};
  values.folier.lines = folierLines.map((line, index) => serializeFolierLine(line, index));
  const payload = {
    source: "control-panel",
    timestamp: new Date().toISOString(),
    request: "config/update",
    values
  };

  showPayload(payload);

  try {
    const data = await apiFetch("/config/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values, merge: true })
    });

    setStatus("Connected", true);
    document.querySelector("#lastSync").textContent = new Date().toLocaleTimeString();
    toast("All values sent");

    if (data.config) {
      applyBackendConfig(data.config, false);
    }

    if (data.info) {
      const presetFromBackend =
        data.info.current_preset ||
        data.info.loaded_preset ||
        data.info.active_preset ||
        data.info.preset_name ||
        null;

      if (presetFromBackend) {
        setSelectedPreset(presetFromBackend);
      }
    }
  } catch (error) {
    setStatus("Endpoint unavailable", false);
    toast(error.message);
  }
}

function applyStateValue(path, value, syncInitial = false) {
  const control = controlByPath(path);
  if (!control) return;

  let nextValue = value;
  if (Array.isArray(value)) {
    nextValue = value.join(", ");
  }

  state[path] = nextValue;
  if (syncInitial) {
    initial[path] = nextValue;
  }

  const entry = cards.get(path);
  if (!entry) return;

  entry.valueEl.textContent = formatValue(control, nextValue);
  entry.sync(nextValue);
}

function applyBackendConfig(config, syncInitial = true) {
  const flat = flattenObject(config);

  Object.entries(flat).forEach(([path, value]) => {
    if (cards.has(path)) {
      applyStateValue(path, value, syncInitial);
    }
  });

  const backendLines = Array.isArray(config?.folier?.lines) ? config.folier.lines : [];
  setFolierLines(backendLines, syncInitial);

  updateReadouts();
}

async function pullConfig() {
  try {
    const data = await apiFetch("/config");

    if (data.config) {
      applyBackendConfig(data.config, true);
    }

    const presetFromBackend = extractPresetName(data);

    if (presetFromBackend) {
      setSelectedPreset(presetFromBackend);
    }

    showPayload({ source: "control-panel", request: "get/config", received: data });
    setStatus("Connected", true);
    document.querySelector("#lastSync").textContent = new Date().toLocaleTimeString();
    toast("Config pulled");
  } catch (error) {
    setStatus("Endpoint unavailable", false);
    toast(error.message);
  }
}

async function loadPresets() {
  presetsEl.innerHTML = "";

  try {
    const data = await apiFetch("/presets");
    const presets = Array.isArray(data.presets) ? data.presets : [];

    if (!presets.length) {
      const empty = document.createElement("span");
      empty.className = "secondary small";
      empty.textContent = "No presets";
      presetsEl.appendChild(empty);
      return;
    }

    presets.forEach(name => {
      const btn = document.createElement("button");
      btn.className = "secondary small";
      btn.type = "button";
      btn.textContent = name;
      btn.dataset.presetName = name;
      btn.addEventListener("click", async () => {
        await loadPreset(name);
      });
      presetsEl.appendChild(btn);
    });
    refreshPresetButtonState();
  } catch (error) {
    toast(error.message);
  }
}

async function loadPreset(name) {
  try {
    const data = await apiFetch("/preset/load", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    if (data.config) {
      applyBackendConfig(data.config, true);
    }

    setSelectedPreset(name);
    document.querySelector("#presetName").value = name;
    showPayload({ source: "control-panel", request: "preset/load", name });
    setStatus("Connected", true);
    document.querySelector("#lastSync").textContent = new Date().toLocaleTimeString();
    toast(`Preset loaded: ${name}`);
  } catch (error) {
    setStatus("Endpoint unavailable", false);
    toast(error.message);
  }
}

async function savePreset() {
  const name = document.querySelector("#presetName").value.trim();
  if (!name) {
    toast("Enter a preset name");
    return;
  }

  showPayload({ source: "control-panel", request: "preset/save", name });

  try {
    await apiFetch("/preset/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    setSelectedPreset(name);
    toast(`Preset saved: ${name}`);
    await loadPresets();
  } catch (error) {
    toast(error.message);
  }
}

async function saveCurrentPreset() {
  showPayload({ source: "control-panel", request: "preset/save-current" });

  try {
    const data = await apiFetch("/preset/save-current", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    const savedName =
      data.preset ||
      data.name ||
      data.current_preset ||
      selectedPresetName;

    if (savedName) {
      setSelectedPreset(savedName);
    }

    toast("Current preset saved");
    await loadPresets();
  } catch (error) {
    toast(error.message);
  }
}

function resetAll() {
  Object.entries(initial).forEach(([path, value]) => {
    applyStateValue(path, value, false);
  });

  setFolierLines(initialFolierLines, false);

  updateReadouts();

  const payload = {
    source: "control-panel",
    action: "reset-ui",
    timestamp: new Date().toISOString()
  };

  showPayload(payload);
  toast("UI reset");
}

function updateReadouts() {
  document.querySelector("#bpmReadout").textContent = state["composer.bpm"];
  document.querySelector("#generatorReadout").textContent = state["visual.active_generator"];

  const generator = state["visual.active_generator"];
  const budget = generator === "waver"
    ? `${Math.round(Number(state["waver.num_particles"]) / 1000)}k`
    : `${Math.round(Number(state["fireflight.max_trail_points"]) / 1000)}k`;

  document.querySelector("#budgetReadout").textContent = budget;
  document.querySelector("#presetReadout").textContent = selectedPresetName;
  document.querySelector("#videoReadout").textContent =
    state["visual.video_enabled"]
      ? (state["visual.video_path"] || "enabled")
      : "off";
}

function setStatus(text, online) {
  document.querySelector("#statusText").textContent = text;
  document.querySelector("#statusDot").classList.toggle("online", !!online);
}

function searchControls(query) {
  const q = query.trim().toLowerCase();

  document.querySelectorAll(".control").forEach(card => {
    card.classList.toggle("hidden", !!q && !card.dataset.search.includes(q));
  });

  document.querySelectorAll(".group").forEach(section => {
    const hasVisible = Array.from(section.querySelectorAll(".control")).some(card => !card.classList.contains("hidden"));
    section.classList.toggle("hidden", !!q && !hasVisible);
  });
}

async function stopApp() {
  showPayload({
    source: "control-panel",
    action: "stop",
    timestamp: new Date().toISOString()
  });

  try {
    await apiFetch("/stop", { method: "POST" });
    toast("Stop request sent");
  } catch (error) {
    toast(error.message);
  }
}

async function refreshStatus() {
  try {
    const data = await apiFetch("/status");
    const running = !!data.running;
    setStatus(running ? "Connected" : "Stopped", running);
    document.querySelector("#lastSync").textContent = new Date().toLocaleTimeString();

    const presetFromBackend = extractPresetName(data);
    if (presetFromBackend) {
      setSelectedPreset(presetFromBackend);
    }
  } catch (error) {
    setStatus("Endpoint unavailable", false);
  }
}

function copyPayload() {
  const text = payloadEl.textContent;
  navigator.clipboard?.writeText(text);
  toast("Payload copied");
}

function toast(message) {
  const item = document.createElement("div");
  item.className = "toast";
  item.textContent = message;
  toastEl.appendChild(item);

  setTimeout(() => {
    item.remove();
  }, 2600);
}

function wireEvents() {
  document.querySelector("#sendAllBtn").addEventListener("click", sendAll);
  document.querySelector("#pullConfigBtn").addEventListener("click", pullConfig);
  document.querySelector("#refreshBtn").addEventListener("click", async () => {
    await refreshStatus();
    await loadPresets();
    await pullConfig();
  });
  document.querySelector("#resetBtn").addEventListener("click", resetAll);
  document.querySelector("#copyBtn").addEventListener("click", copyPayload);
  document.querySelector("#stopBtn").addEventListener("click", stopApp);
  document.querySelector("#savePresetBtn").addEventListener("click", savePreset);
  document.querySelector("#saveCurrentPresetBtn").addEventListener("click", saveCurrentPreset);

  document.querySelector("#search").addEventListener("input", event => {
    searchControls(event.target.value);
  });

  document.querySelector("#endpoint").addEventListener("change", async () => {
    await refreshStatus();
    await loadPresets();
    await pullConfig();
  });
}

function setSelectedPreset(name) {
  selectedPresetName = name && String(name).trim() ? String(name).trim() : "none";

  const el = document.querySelector("#presetReadout");
  if (el) {
    el.textContent = selectedPresetName;
  }

  refreshPresetButtonState();
}
function refreshPresetButtonState() {
  document.querySelectorAll("#presets button[data-preset-name]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.presetName === selectedPresetName);
  });
}

function extractPresetName(payload) {
  const info = payload?.info || {};

  return (
    info.current_preset_name ||
    info.current_preset ||
    info.loaded_preset ||
    info.active_preset ||
    info.preset_name ||
    payload?.current_preset_name ||
    payload?.current_preset ||
    payload?.loaded_preset ||
    payload?.active_preset ||
    payload?.preset_name ||
    null
  );
}

async function init() {
  initState();
  initUi();
  wireEvents();
  updateReadouts();

  await refreshStatus();
  await loadPresets();
  await pullConfig();

  clearInterval(statusTimer);
  statusTimer = setInterval(() => {
    refreshStatus();
  }, 3000);
}
init();