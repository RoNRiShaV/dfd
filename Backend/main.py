# backend/main.py
import os
import uuid
import json
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Use unified pipeline from forensics.py (model lives & loads there)
from forensics import analyze_image_from_path, DEVICE

# -------------------------------
# Config / paths
# -------------------------------
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
LOG_FILE = BASE_DIR / "analysis_log.json"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
if not LOG_FILE.exists():
    LOG_FILE.write_text("[]", encoding="utf-8")

# -------------------------------
# FastAPI setup
# -------------------------------
app = FastAPI(title="DeepFake Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local dev/hackathon only — lock this down in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images under /api/uploads/<filename>
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# -------------------------------
# Helpers
# -------------------------------
def _read_log():
    text = LOG_FILE.read_text(encoding="utf-8") or "[]"
    try:
        return json.loads(text)
    except Exception:
        return []

def _write_log(logs):
    LOG_FILE.write_text(json.dumps(logs, indent=2), encoding="utf-8")

def append_log(entry: dict):
    logs = _read_log()
    logs.append(entry)
    _write_log(logs)

def find_log_entry(file_id: str):
    logs = _read_log()
    for entry in reversed(logs):
        if entry.get("id") == file_id or entry.get("filename") == file_id:
            return entry
    return None

def save_upload_file(upload_file: UploadFile, dest: Path) -> Path:
    """
    Save UploadFile to dest and return path.
    Accepts synchronous file.file.read() (UploadFile.file is SpooledTemporaryFile).
    """
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
    """
    Upload endpoint.
    Accepts multipart/form-data with file field named 'file'.
    Returns: { id, filename, file_url, label, authenticity, real_prob, fake_prob }
    """
    # basic validation
    filename_lower = (file.filename or "").lower()
    if not filename_lower.endswith((".png", ".jpg", ".jpeg")):
        raise HTTPException(status_code=400, detail="Invalid image type. Accepts .png/.jpg/.jpeg")

    # Save file
    try:
        saved_path = save_upload_file(file, UPLOAD_DIR)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save uploaded file: {e}")

    # Run unified analysis pipeline
    heatmap_out = UPLOAD_DIR / f"{saved_path.stem}_heatmap.png"
    try:
        result = analyze_image_from_path(str(saved_path), out_heatmap_path=str(heatmap_out))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forensics pipeline error: {e}")

    # Extract deepfake results
    deepfake = result.get("deepfake") or {}
    real_prob = deepfake.get("real_prob")
    fake_prob = deepfake.get("fake_prob")
    authenticity = deepfake.get("authenticity_score")
    prediction = deepfake.get("prediction")

    try:
        real_prob = float(real_prob) if real_prob is not None else None
        fake_prob = float(fake_prob) if fake_prob is not None else None
        authenticity = float(authenticity) if authenticity is not None else None
    except Exception:
        real_prob, fake_prob, authenticity = None, None, None

    # Build entry for log
    entry = {
        "id": saved_path.name,
        "timestamp": datetime.utcnow().isoformat(),
        "filename": saved_path.name,
        "file_url": f"/api/uploads/{saved_path.name}",
        "phash": result.get("phash"),
        "exif": result.get("exif") or {},
        "tamper_score": result.get("tamper_score"),
        "heatmap_url": f"/api/uploads/{Path(result.get('heatmap')).name}" if result.get("heatmap") else None,
        "reverse_matches": result.get("reverse_matches", []),
        "label": prediction,
        "authenticity": authenticity,
        "real_prob": real_prob,
        "fake_prob": fake_prob,
        "prediction": prediction,
        "votes_fake": 0,
        "votes_real": 0,
    }

    # Persist log
    try:
        append_log(entry)
    except Exception as e:
        return JSONResponse(
            status_code=200,
            content={
                "id": entry["id"],
                "filename": entry["filename"],
                "file_url": entry["file_url"],
                "label": entry["label"],
                "authenticity": entry["authenticity"],
                "real_prob": entry["real_prob"],
                "fake_prob": entry["fake_prob"],
                "warning": f"Could not append to log: {e}"
            },
        )

    return JSONResponse({
        "id": entry["id"],
        "filename": entry["filename"],
        "file_url": entry["file_url"],
        "label": entry["label"],
        "authenticity": entry["authenticity"],
        "real_prob": entry["real_prob"],
        "fake_prob": entry["fake_prob"]
    })

@app.get("/api/result/{file_id}")
async def get_result(file_id: str):
    """
    Return the stored analysis for `file_id`.
    """
    entry = find_log_entry(file_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Result not found")
    return entry

@app.get("/api/uploads/{filename}")
async def serve_upload(filename: str):
    """
    Serve uploaded file. (StaticFiles mount already serves it; this is a fallback.)
    """
    path = UPLOAD_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)

@app.get("/api/health")
async def health():
    return {"status": "ok", "device": DEVICE}
