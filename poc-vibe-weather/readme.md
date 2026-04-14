
![alt text](new-uix.png)


 Terminal 1 — backend:

 ```sh
  cd poc-vibe-weather/backend
  uv init
  uv add -r requirements.txt
  pip install -r requirements.txt
  uv run uvicorn app.main:app --reload --port 8000
  #uvicorn app.main:app --reload --port 8000
  #Verify: http://localhost:8000/docs — you'll see all endpoints in the FastAPI UI.      
```

```sh
  Terminal 2 — frontend:
  cd poc-vibe-weather/frontend
   npm install --legacy-peer-deps
  #npm install
  npm run dev
  Open: http://localhost:3000
```