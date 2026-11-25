# Campus Exchange – Python engine + React frontend

## 1. engine-service (port 8000)
```bash
cd engine-service
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                  # add Cloudinary keys
gcc -O3 -shared -fPIC -o lib/libengine.so c_src/engine.c   # Windows: -o lib/engine.dll
uvicorn main:app --reload --port 8000
```
`http://localhost:8000/health` -> `native_engine: true` means the C library loaded.
Interactive docs: `http://localhost:8000/docs`

## 2. frontend (port 5173)
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## 3. Contract the Java teammate must match
- `POST /api/auth/register`, `POST /api/auth/login` -> `{ "token": "...", "user": {...} }`
- `GET /api/listings?department=&semester=&category=` -> array of listings
- `POST /api/listings` (Bearer JWT): `title, description, price, listingType, category, semester, department, imageUrls[]`
- Each listing in the response must also include `sellerName`, `sellerPhone` (digits, with country code) and `status` ("AVAILABLE" by default), needed for the WhatsApp link
- Enable CORS for `http://localhost:5173`

## 4. Deploy to Vercel + Free Supabase Storage/DB
1. Run `npm run dev` from the repository root to start the local core API (`8080`), search engine (`8000`), and Vite frontend (`5173`).
2. To deploy on Vercel (`https://vercel.com`), run `vercel login` then `vercel --prod` from the repository root (`vercel.json` builds `frontend/dist` and exposes serverless `/api/*` endpoints).
3. For persistent cloud database + image storage on the free tier, create a project on [Supabase](https://supabase.com), run `supabase/schema.sql` in the SQL Editor, and set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `AUTH_SECRET` in Vercel Environment Variables.

