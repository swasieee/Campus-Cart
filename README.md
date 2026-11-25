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
