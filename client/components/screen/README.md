# Screen compositions

Page-specific UI assembled from `ui` / `layout` / `shell`.

- One folder per page: `screen/<segment>/<Name>.tsx` (e.g. `screen/dashboard/dashboard.tsx`).
- Route modules stay thin: `getData` + pass props into the screen.
- Import the file directly — no barrel `index.ts`.
- No `@app/*` imports; use props from `getData` and `/api` for live updates.
