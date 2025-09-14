import os
import uuid
import json
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Import pipeline
from forensics import analyze_image_from_path, DEVICE

# -------------------------------
# Config / paths
# -------------------------------
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
HEATMAP_DIR = UPLOAD_DIR / "heatmaps"   # ✅ dedicated heatmap folder
LOG_FILE = BASE_DIR / "analysis_log.json"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
HEATMAP_DIR.mkdir(parents=True, exist_ok=True)
if not LOG_FILE.exists():
    LOG_FILE.write_text("[]", encoding="utf-8")

# -------------------------------
# FastAPI setup
# -------------------------------
app = FastAPI(title="DeepFake Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/api/heatmaps", StaticFiles(directory=str(HEATMAP_DIR)), name="heatmaps")

# -------------------------------
# Helpers
# -------------------------------
def _read_log():
    try:
        return json.loads(LOG_FILE.read_text(encoding="utf-8") or "[]")
    except Exception:
        return []

def _write_log(logs):
    LOG_FILE.write_text(json.dumps(logs, indent=2), encoding="utf-8")

def append_log(entry: dict):
    logs = _read_log()
    logs.append(entry)
    _write_log(logs)

def update_log(entry: dict):
    logs = _read_log()
    for i, e in enumerate(logs):
        if e.get("id") == entry["id"]:
            logs[i] = entry
            _write_log(logs)
            return
    # if not found, append
    logs.append(entry)
    _write_log(logs)

def find_log_entry(file_id: str):
    logs = _read_log()
    for entry in reversed(logs):
        if entry.get("id") == file_id or entry.get("filename") == file_id:
            return entry
    return None

def save_upload_file(upload_file: UploadFile, dest: Path) -> Path:
    ext = Path(upload_file.filename).suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    out_path = dest / filename
    try:
        with out_path.open("wb") as f:
            upload_file.file.seek(0)
            while True:
                chunk = upload_file.file.read(1024 * 1024)
                if not chunk:
                    break
                f.write(chunk)
    finally:
        try:
            upload_file.file.close()
        except Exception:
            pass
    return out_path

# -------------------------------
# Routes
# -------------------------------
@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    filename_lower = (file.filename or "").lower()
    if not filename_lower.endswith((".png", ".jpg", ".jpeg")):
        raise HTTPException(status_code=400, detail="Invalid image type")

    try:
        saved_path = save_upload_file(file, UPLOAD_DIR)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Save error: {e}")

    # ✅ save heatmap in heatmaps/ folder
    heatmap_out = HEATMAP_DIR / f"{saved_path.stem}_heatmap.png"
    try:
        result = analyze_image_from_path(str(saved_path), out_heatmap_path=str(heatmap_out))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forensics error: {e}")

    deepfake = result.get("deepfake") or {}
    real_prob = deepfake.get("real_prob")
    fake_prob = deepfake.get("fake_prob")
    authenticity = deepfake.get("authenticity_score")
    prediction = deepfake.get("prediction")

    entry = {
        "id": saved_path.name,
        "timestamp": datetime.utcnow().isoformat(),
        "filename": saved_path.name,
        "file_url": f"/api/uploads/{saved_path.name}",
        "phash": result.get("phash"),
        "exif": result.get("exif") or {},
        "tamper_score": result.get("tamper_score"),
        "heatmap_url": f"/api/heatmaps/{heatmap_out.name}" if heatmap_out.exists() else None,
        "reverse_matches": result.get("reverse_matches", []),
        "label": prediction,
        "authenticity": authenticity,
        "real_prob": real_prob,
        "fake_prob": fake_prob,
        "prediction": prediction,
        "votes_fake": 0,
        "votes_real": 0,
    }

    try:
        append_log(entry)
    except Exception as e:
        return JSONResponse(content={**entry, "warning": f"Log error: {e}"})

    return JSONResponse({
        "id": entry["id"],
        "filename": entry["filename"],
        "file_url": entry["file_url"],
        "label": entry["label"],
        "authenticity": entry["authenticity"],
        "real_prob": entry["real_prob"],
        "fake_prob": entry["fake_prob"],
        "heatmap_url": entry["heatmap_url"],
    })

@app.get("/api/result/{file_id}")
async def get_result(file_id: str):
    entry = find_log_entry(file_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Result not found")
    return entry

# -------------------------------
# ✅ Community Voting
# -------------------------------
@app.post("/api/vote/{file_id}")
async def vote(file_id: str, vote: str = Body(..., embed=True)):
    entry = find_log_entry(file_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Image not found")

    if vote == "real":
        entry["votes_real"] = entry.get("votes_real", 0) + 1
    elif vote == "fake":
        entry["votes_fake"] = entry.get("votes_fake", 0) + 1
    else:
        raise HTTPException(status_code=400, detail="Vote must be 'real' or 'fake'")

    update_log(entry)

    return {
        "votes_real": entry["votes_real"],
        "votes_fake": entry["votes_fake"],
        "total": entry["votes_real"] + entry["votes_fake"],
    }

@app.get("/api/votes/{file_id}")
async def get_votes(file_id: str):
    entry = find_log_entry(file_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Image not found")

    return {
        "votes_real": entry.get("votes_real", 0),
        "votes_fake": entry.get("votes_fake", 0),
        "total": entry.get("votes_real", 0) + entry.get("votes_fake", 0),
    }

# -------------------------------
# ✅ History endpoint
# -------------------------------
@app.get("/api/history")
async def get_history():
    logs = _read_log()
    # Sort latest first
    logs_sorted = sorted(logs, key=lambda x: x.get("timestamp", ""), reverse=True)
    return logs_sorted

# -------------------------------
# Static serving
# -------------------------------
@app.get("/api/uploads/{filename}")
async def serve_upload(filename: str):
    path = UPLOAD_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)

@app.get("/api/heatmaps/{filename}")
async def serve_heatmap(filename: str):
    path = HEATMAP_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Heatmap not found")
    return FileResponse(path)

@app.get("/api/health")
async def health():
    return {"status": "ok", "device": DEVICE}
