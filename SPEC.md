# Fitness Tracker PWA — Starter Spec

## Goal
A low-friction personal tracker for food, steps and workouts.
Logging a meal should take under 10 seconds.
Accuracy target: roughly 80%. Trends over precision.

## Principles
- Local-first. All data in the browser (IndexedDB). No server, no account.
- Works offline. Installable as a PWA on phone and desktop.
- Rough estimates are fine. No food database, no scale.
- Repeat meals are one tap.
- Never lose data: easy backup and restore.

## Tech Stack
- Vite + React + TypeScript
- Dexie.js (IndexedDB wrapper) + `dexie-react-hooks` (`useLiveQuery`)
- `vite-plugin-pwa` for manifest + service worker
- Tailwind CSS
- Charts: Recharts (phase 2)
- Deploy: static hosting (GitHub Pages, Netlify or Vercel)

## Data Model (Dexie)

```ts
// db.ts
interface Meal {           // reusable saved meal ("template")
  id?: number;
  name: string;            // "Chicken stir fry, big bowl"
  kcal: number;
  protein?: number;        // grams
  carbs?: number;
  fat?: number;
  tags?: string[];         // "breakfast", "snack"
  useCount: number;        // for sorting quick-add by frequency
  lastUsed?: string;       // ISO date
  archived?: boolean;
}

interface FoodEntry {      // one logged eating event
  id?: number;
  date: string;            // YYYY-MM-DD (local day)
  time: string;            // HH:mm
  mealId?: number;         // set if logged from a saved meal
  name: string;            // copied at log time so edits to Meal don't rewrite history
  kcal: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  portion: number;         // multiplier: 0.5, 1, 1.5, 2
  note?: string;
}

interface Workout {
  id?: number;
  date: string;
  type: string;            // "Run", "Weights", "Bike", free text with suggestions
  durationMin?: number;
  intensity?: 'easy' | 'medium' | 'hard';
  note?: string;
}

interface DayLog {         // one row per day
  date: string;            // primary key, YYYY-MM-DD
  steps?: number;
  bodyWeight?: number;     // optional, weekly is enough
  note?: string;
}

interface Settings {       // single row, key = 'main'
  key: 'main';
  kcalTarget?: number;
  proteinTarget?: number;
  stepTarget?: number;     // default 10000
  units: 'metric' | 'imperial';
  lastBackupAt?: string;
  aiApiKey?: string;       // phase 3, stored locally only
}

// Dexie schema
db.version(1).stores({
  meals: '++id, name, useCount, lastUsed, archived',
  foodEntries: '++id, date, mealId',
  workouts: '++id, date, type',
  days: 'date',
  settings: 'key',
});
```

Use Dexie version upgrades for future schema changes. Never drop tables.

## Screens

### 1. Today (home)
- Header: date, with prev/next day arrows.
- Summary bar: kcal eaten / target, protein / target, steps / target.
- **Quick-add grid:** top 8 saved meals by `useCount`. One tap logs portion ×1.
  Long-press or a "…" button opens the portion picker (½, 1, 1½, 2).
- **"+ Custom" button:** name + kcal (protein optional). Checkbox: "Save as meal".
- Today's food list. Swipe or tap to edit/delete.
- Steps input: one number field. Saves on blur.
- Workout: "+ Workout" opens a small form (type, minutes, intensity).

### 2. Meals
- List of saved meals. Search box.
- Add / edit / archive.
- Sort: most used, A–Z, recent.

### 3. History
- List of past days: kcal, protein, steps, workout icons.
- Tap a day to open it in the Today view.
- Phase 2: weekly averages, 7-day kcal and steps charts, weight trend line.

### 4. Settings
- Targets (kcal, protein, steps).
- Units.
- **Backup section** (see below).
- Storage status: show whether persistent storage was granted.

## Backup & Data Safety (MVP — required)
1. On first launch, call `navigator.storage.persist()`. Show the result in Settings.
2. **Export:** button downloads `fittrack-backup-YYYY-MM-DD.json`
   containing every table plus `schemaVersion` and `exportedAt`.
   On mobile, use the Web Share API (`navigator.share` with a File) when available,
   so the user can save straight to Drive or iCloud.
3. **Import:** file picker. Validate `schemaVersion`.
   Two modes: "Replace all" (with confirm dialog) and "Merge"
   (merge by date for days; skip duplicates for entries by matching date+time+name).
4. **Backup reminder:** if `lastBackupAt` is more than 7 days ago, show a dismissible banner on Today.
5. Update `lastBackupAt` after each successful export.

## PWA Requirements
- Manifest: name, short_name, icons (192, 512, maskable), `display: standalone`, theme color.
- Service worker precaches the app shell. Fully usable offline.
- iOS: add `apple-touch-icon` and meta tags. Prompt users to "Add to Home Screen".
- Note: Safari can evict data from sites unused for 7 days unless installed. Mention this in Settings.

## UX Rules
- Mobile-first. Big tap targets (min 44px).
- Logging a saved meal = 1 tap. Logging a custom food = under 10 seconds.
- Toast with "Undo" after every log or delete.
- No mandatory fields beyond name + kcal.
- Dark mode follows system setting.
- Dates use the device's local timezone, never UTC, for the `date` field.

## Phases

### Phase 1 — MVP
- Dexie DB + schema
- Today screen: quick-add, custom add, steps, workouts
- Meals screen
- Settings: targets + export/import + persist()
- PWA install + offline

### Phase 2 — Insights
- History screen with weekly averages
- Charts: kcal, protein, steps (7/30 days), weight trend
- Streaks (days logged)
- Backup reminder banner

### Phase 3 — AI estimates (optional)
- Text box: "describe what you ate".
- Sends the description to an LLM API, which returns JSON:
  `{ name, kcal, protein, carbs, fat, confidence }`.
- User reviews/edits before saving. Option to save as a meal.
- API key entered by the user, stored in IndexedDB only. Personal use only —
  a client-side key is visible to anyone using the device.
- Optional: photo input for estimates.

### Phase 4 — Sync (optional)
- Auto-backup to Google Drive `appDataFolder` (OAuth, no backend needed),
  or a private GitHub Gist.
- Phone ↔ PC sync via last-write-wins per record using an `updatedAt` field.
  (If planning this, add `updatedAt` and a UUID to every record from the start.)

## Out of Scope
- Food databases or barcode scanning
- Micronutrients
- Social features
- Accounts / backend server

## Acceptance Checklist (MVP)
- [ ] Installs to the home screen on Android Chrome and iOS Safari
- [ ] Works with airplane mode on
- [ ] Logging a saved meal takes one tap
- [ ] Export → clear site data → import restores everything exactly
- [ ] Data survives closing the browser and rebooting
- [ ] Today totals update instantly after a log, edit or delete

## Suggested Folder Structure
```
src/
  db/          db.ts, types.ts, backup.ts
  components/  QuickAddGrid, FoodList, PortionPicker, StepsInput, WorkoutForm, Toast
  pages/       Today, Meals, History, Settings
  hooks/       useDay, useTotals, useSettings
  utils/       dates.ts (local date helpers)
public/
  icons/
```

## First Prompt for Claude Code
> Read SPEC.md. Scaffold Phase 1 with Vite + React + TS + Tailwind + Dexie + vite-plugin-pwa.
> Start with the DB layer and backup export/import, then the Today screen.
> Write unit tests for backup round-trip and local date helpers.
