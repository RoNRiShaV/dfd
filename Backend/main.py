import os
import uuid
import json
import traceback
from pathlib import Path
from datetime import datetime
from typing import Dict

from fastapi import FastAPI, File, UploadFile, HTTPException, Body, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Pillow for EXIF
from PIL import Image, ExifTags

# Import pipeline
from forensics import analyze_image_from_path, DEVICE
from report_util import generate_pdf_report, REPORTS_DIR  # ✅ REPORTS_DIR imported here

# -------------------------------
# Config / paths
# -------------------------------
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
HEATMAP_DIR = UPLOAD_DIR / "heatmaps"
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

# Static serving
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

def extract_exif(image_path: str) -> Dict[str, str]:
    try:
        img = Image.open(image_path)
        exif_data = img._getexif()
        if not exif_data:
            return {}
        exif = {}
        for tag, value in exif_data.items():
            tag_name = ExifTags.TAGS.get(tag, tag)
            exif[tag_name] = str(value)
        return exif
    except Exception:
        return {}

# ✅ Only TinEye homepage (no Bing, no Google Lens)
def build_reverse_links(file_url: str) -> Dict[str, str]:
    return {
        "tineye": "https://tineye.com/"
    }

# -------------------------------
# Routes
# -------------------------------
@app.post("/api/upload")
async def upload(
    file: UploadFile = File(...),
    privacy: bool = Form(False)
):
    filename_lower = (file.filename or "").lower()
    if not filename_lower.endswith((".png", ".jpg", ".jpeg")):
        raise HTTPException(status_code=400, detail="Invalid image type")

    temp_path = save_upload_file(file, BASE_DIR)

    try:
        result = analyze_image_from_path(str(temp_path))
    except Exception as e:
        temp_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Forensics error: {e}")

    exif_data = extract_exif(str(temp_path))
    deepfake = result.get("deepfake") or {}

    if privacy:
        temp_path.unlink(missing_ok=True)
        return JSONResponse({
            "privacy": True,
            "timestamp": datetime.utcnow().isoformat(),
            "exif": exif_data,
            "tamper_score": result.get("tamper_score"),
            "label": deepfake.get("prediction"),
            "authenticity": deepfake.get("authenticity_score"),
            "real_prob": deepfake.get("real_prob"),
            "fake_prob": deepfake.get("fake_prob"),
            "prediction": deepfake.get("prediction"),
        })

    upload_id = uuid.uuid4().hex
    permanent_filename = f"{upload_id}{Path(file.filename).suffix}"
    permanent_path = UPLOAD_DIR / permanent_filename
    os.replace(temp_path, permanent_path)

    heatmap_out = HEATMAP_DIR / f"{upload_id}_heatmap.png"
    try:
        analyze_image_from_path(str(permanent_path), out_heatmap_path=str(heatmap_out))
    except Exception:
        heatmap_out = None

    file_url = f"/api/uploads/{permanent_filename}"
    entry = {
        "id": upload_id,
        "timestamp": datetime.utcnow().isoformat(),
        "filename": permanent_filename,
        "file_url": file_url,
        "phash": result.get("phash"),
        "exif": exif_data,
        "tamper_score": result.get("tamper_score"),
        "heatmap_url": f"/api/heatmaps/{heatmap_out.name}" if heatmap_out and heatmap_out.exists() else None,
        "reverse_matches": build_reverse_links(file_url),
        "label": deepfake.get("prediction"),
        "authenticity": deepfake.get("authenticity_score"),
        "real_prob": deepfake.get("real_prob"),
        "fake_prob": deepfake.get("fake_prob"),
        "prediction": deepfake.get("prediction"),
        "votes_fake": 0,
        "votes_real": 0,
        "privacy": False,
    }

    append_log(entry)
    return JSONResponse(entry)


@app.get("/api/result/{file_id}")
async def get_result(file_id: str):
    entry = find_log_entry(file_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Result not found")
    return entry

@app.post("/api/vote/{file_id}")
async def vote(file_id: str, vote: str = Body(..., embed=True)):
    entry = find_log_entry(file_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Image not found")

    if entry.get("privacy"):
        raise HTTPException(status_code=403, detail="Voting disabled for private uploads")

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

    if entry.get("privacy"):
        raise HTTPException(status_code=403, detail="Votes unavailable for private uploads")

    return {
        "votes_real": entry.get("votes_real", 0),
        "votes_fake": entry.get("votes_fake", 0),
        "total": entry.get("votes_real", 0) + entry.get("votes_fake", 0),
    }

@app.get("/api/history")
async def get_history():
    logs = _read_log()
    logs = [entry for entry in logs if not entry.get("privacy", False)]
    logs_sorted = sorted(logs, key=lambda x: x.get("timestamp", ""), reverse=True)
    return logs_sorted

@app.get("/api/report/{file_id}")
async def generate_report(file_id: str):
    entry = find_log_entry(file_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Result not found")

    # ✅ Save report into reports folder
    output_pdf_path = REPORTS_DIR / f"{file_id}_report.pdf"
    image_path = UPLOAD_DIR / entry["filename"]
    heatmap_path = HEATMAP_DIR / f"{file_id}_heatmap.png" if entry.get("heatmap_url") else None

    try:
        print(f"DEBUG: Generating PDF report for {file_id}")
        print(f"DEBUG: image_path={image_path}, heatmap_path={heatmap_path}")
        print(f"DEBUG: entry={json.dumps(entry, indent=2)}")
        generate_pdf_report(
            str(output_pdf_path),
            str(image_path),
            entry,
            entry.get("exif", {}),
            str(heatmap_path) if heatmap_path and heatmap_path.exists() else None
        )
    except Exception as e:
        print("ERROR: Failed to generate PDF report")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

    return FileResponse(output_pdf_path, media_type="application/pdf", filename=f"{file_id}_report.pdf")

@app.get("/api/uploads/{filename}")
async def serve_upload(filename: str):
    path = UPLOAD_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, headers={"Cache-Control": "no-store"})

@app.get("/api/heatmaps/{filename}")
async def serve_heatmap(filename: str):
    path = HEATMAP_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Heatmap not found")
    return FileResponse(path, headers={"Cache-Control": "no-store"})

@app.get("/api/health")
async def health():
    return {"status": "ok", "device": DEVICE}
