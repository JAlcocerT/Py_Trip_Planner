
![alt text](new-uix.png)

## Dev (plain terminals)

**Terminal 1 — backend**
```sh
cd ~/Py_Trip_Planner/poc-vibe-weather/backend && uv sync && uv run uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — frontend**
```sh
cd ~/Py_Trip_Planner/poc-vibe-weather/frontend && npm install --legacy-peer-deps && npm run dev
```

Open: http://localhost:3000  
API docs: http://localhost:8000/docs

---

## Dev (tmux)

Run from the `poc-vibe-weather/` folder:

```sh
tmux new-session -d -s trip -n backend  -c "$(pwd)/backend"  "uv sync && uv run uvicorn app.main:app --reload --port 8000" \; \
  new-window          -n frontend -c "$(pwd)/frontend" "npm install --legacy-peer-deps && npm run dev" \; \
  attach
```

That's it — one command, two named windows, both start automatically.

| shortcut | action |
|---|---|
| `Ctrl-b 0` | backend window |
| `Ctrl-b 1` | frontend window |
| `Ctrl-b d` | detach (processes keep running) |
| `tmux attach -t trip` | re-attach later |

Open: http://localhost:3000  
API docs: http://localhost:8000/docs

> On subsequent restarts (deps already installed) replace `uv sync &&` with nothing and drop `npm install --legacy-peer-deps &&`.

Or start each service independently into its own named tmux window:

```sh
# backend (creates the session)
tmux new-session -d -s trip -n backend -c "$(pwd)/backend" "uv sync && uv run uvicorn app.main:app --reload --port 8000"

# frontend (adds a window to the existing session)
tmux new-window -t trip -n frontend -c "$(pwd)/frontend" "npm install --legacy-peer-deps && npm run dev"
```

Run them whenever you're ready — the session persists between the two calls.

---

## Production (Docker Compose)

```sh
docker compose up --build
```

No `.env` files needed — `API_URL` is baked into the Next.js bundle at build time via the compose `build.args`.

---

Using https://recharts.github.io/ inspired at https://ui.shadcn.com/docs/components/chart
