# FitTrack

Local-first PWA for food, steps and workouts. See `SPEC.md`.

```bash
npm install
npm run dev      # dev server
npm test         # unit tests (backup round-trip, date helpers)
npm run build    # production build + service worker
```

Deploys to GitHub Pages automatically on push to `main` (`.github/workflows/deploy.yml`).
Regenerate icons: `node scripts/make-icons.mjs` (needs Playwright).

## Notes
- Every record has `uuid` + `updatedAt` (set by Dexie hooks) for Phase 4 sync.
- Deletes write a `tombstones` row so sync can propagate them.
- `FoodEntry.kcal`/macros are per portion; totals = value × `portion`.
- Backups omit `aiApiKey`. Replace-import keeps the local key.
