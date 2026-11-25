"""Campus Exchange engine-service: media upload (Cloudinary) + search ranking (C via ctypes)."""
import ctypes
import os
import platform
from pathlib import Path

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
MAX_UPLOAD_BYTES = 5 * 1024 * 1024

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)

app = FastAPI(title="Campus Exchange Engine Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- C shared library bridge ----------
def _load_engine():
    name = "engine.dll" if platform.system() == "Windows" else "libengine.so"
    path = BASE_DIR / "lib" / name
    if not path.exists():
        return None
    lib = ctypes.CDLL(str(path))
    lib.calculate_score.argtypes = [ctypes.c_char_p, ctypes.c_char_p]
    lib.calculate_score.restype = ctypes.c_double
    return lib


_engine = _load_engine()


def _py_score(query: str, title: str) -> float:
    """Pure-Python fallback (same algorithm) so the API works before the C lib is built."""
    q, t = query.lower(), title.lower()
    if not q or not t:
        return 0.0
    prev = list(range(len(t) + 1))
    for i, qc in enumerate(q, 1):
        curr = [i]
        for j, tc in enumerate(t, 1):
            curr.append(min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (qc != tc)))
        prev = curr
    score = 1 - prev[-1] / max(len(q), len(t))
    if q in t:
        score = max(score, 0.85 + 0.15 * len(q) / len(t))
    return score


def score(query: str, title: str) -> float:
    if _engine is None:
        return _py_score(query, title)
    return _engine.calculate_score(query.encode("utf-8"), title.encode("utf-8"))


# ---------- Schemas ----------
class RankItem(BaseModel):
    id: int
    title: str


class RankRequest(BaseModel):
    query: str = Field(min_length=1, max_length=200)
    items: list[RankItem] = Field(max_length=2000)
    min_score: float = Field(default=0.0, ge=0.0, le=1.0)


class RankedItem(BaseModel):
    id: int
    score: float


class RankResponse(BaseModel):
    ranked: list[RankedItem]
    ids: list[int]
    engine: str


class UploadResponse(BaseModel):
    secure_url: str
    public_id: str


# ---------- Helpers ----------
def detect_image_type(head: bytes) -> str | None:
    if head.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp"
    return None


# ---------- Routes ----------
@app.get("/health")
def health():
    return {"status": "ok", "native_engine": _engine is not None}


@app.post("/api/media/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Image is larger than 5 MB.")
    if detect_image_type(data[:16]) is None:
        raise HTTPException(415, "File is not a valid JPEG, PNG or WebP image.")
    try:
        result = await run_in_threadpool(
            cloudinary.uploader.upload, data, folder="campus-exchange", resource_type="image"
        )
    except Exception as exc:  # cloudinary raises generic errors
        raise HTTPException(502, f"Cloudinary upload failed: {exc}") from exc
    return UploadResponse(secure_url=result["secure_url"], public_id=result["public_id"])


@app.post("/api/search/rank", response_model=RankResponse)
def rank(req: RankRequest):
    scored = [RankedItem(id=i.id, score=round(score(req.query, i.title), 4)) for i in req.items]
    scored = [s for s in scored if s.score >= req.min_score]
    scored.sort(key=lambda s: s.score, reverse=True)
    return RankResponse(
        ranked=scored,
        ids=[s.id for s in scored],
        engine="native-c" if _engine else "python-fallback",
    )
