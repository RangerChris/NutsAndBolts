# Nuts and Bolts

A casual puzzle game where the player groups same-colored "nuts" onto "bolts".

## Development

Install dependencies and start dev server:

```
npm install
npm run dev
```

Run tests (Vitest):

```
npm run test
```

See `.github/PRD.md` and `.github/TODO.md` for project goals and next tasks.

## Project overview

Nuts and Bolts is a single-screen puzzle: move contiguous top groups of same-colored nuts between bolts to produce bolts containing only a single color. The app includes a seeded level generator (reproducible by seed), an undo history, and a single-use Extra Bolt action per level.

Controls

- Click / tap a bolt to pick its top contiguous group.
- Click / tap a target bolt to attempt the move (legal if empty or matching top color and target capacity allows).
- Use the bottom action bar for `Undo` and `Extra Bolt` actions.

Quick commands

Install, start dev server, run tests, and build:

```bash
npm install
npm run dev     # start dev server (Vite)
npm run build   # production build
npm run test    # run unit & integration tests (Vitest)
npm run test:e2e  # run Playwright e2e tests
```

Where to look

- Engine and game rules: `src/lib/engine.ts` and tests under `src/lib/*.test.ts`
- Level generator: `src/lib/generator.ts` and `src/lib/generator.test.ts`
- Persistence: `src/lib/persistence.ts` and `src/lib/persistence.test.ts`
- UI: `src/app/GameShell.tsx` and components in `src/components`

Contributing

See [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) for branch/PR guidance, testing checklist, and the release notes template.

Live demo

The application is deployed to GitHub Pages at: <https://RangerChris.github.io/NutsAndBolts/>
Visit that URL to test the app (the site updates automatically on push or when the deploy workflow runs).
