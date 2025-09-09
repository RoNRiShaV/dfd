import os
import uuid
import shutil
import json
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Text, DateTime, Integer
from sqlalchemy.orm import sessionmaker, declarative_base
from forensics import analyze_image_from_path, download_file_if_url

BASE_DIR = Path(__file__).resolve().parent
UPLOADS = BASE_DIR / "uploads"
UPLOADS.mkdir(exist_ok=True)
DB_PATH = BASE_DIR / "forensics.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class ImageRecord(Base):
    __tablename__ = "images"
    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    phash = Column(String, nullable=True)
    exif = Column(Text, nullable=True)
    tamper_score = Column(Integer, nullable=True)
    heatmap = Column(String, nullable=True)
    reverse_matches = Column(Text, nullable=True)
    votes_fake = Column(Integer, default=0)
    votes_real = Column(Integer, default=0)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="VerifySpot - Forensics Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ For hackathon only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UploadResponse(BaseModel):
    id: str
    message: str

@app.post("/api/upload", response_model=UploadResponse)
async def upload(image_file: UploadFile | None = File(None), image_url: str | None = Form(None)):
    if image_file is None and not image_url:
        raise HTTPException(status_code=400, detail="Provide file or image_url")

    uid = uuid.uuid4().hex
    if image_file:
        ext = Path(image_file.filename).suffix or ".jpg"
        out_path = UPLOADS / f"{uid}{ext}"
        with out_path.open("wb") as f:
            shutil.copyfileobj(image_file.file, f)
    else:
        out_path = UPLOADS / f"{uid}.jpg"
        success = download_file_if_url(image_url, out_path)
        if not success:
            raise HTTPException(status_code=400, detail="Could not download URL")

    result = analyze_image_from_path(
        str(out_path), out_heatmap_path=str(UPLOADS / f"{uid}_heatmap.png")
    )

    db = SessionLocal()
    rec = ImageRecord(
        id=uid,
        filename=str(out_path.name),
        phash=result.get("phash"),
        exif=json.dumps(result.get("exif", {})),
        tamper_score=int(result.get("tamper_score", 0)),
        heatmap=str(Path(result.get("heatmap")).name) if result.get("heatmap") else None,
        reverse_matches=json.dumps(result.get("reverse_matches", [])),
    )
    db.add(rec)
    db.commit()
    db.close()

    return {"id": uid, "message": "Uploaded and analyzed"}

@app.get("/api/result/{id}")
def get_result(id: str):
    db = SessionLocal()
    rec = db.query(ImageRecord).filter(ImageRecord.id == id).first()
    db.close()
    if not rec:
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "id": rec.id,
        "filename": rec.filename,
        "phash": rec.phash,
        "exif": json.loads(rec.exif or "{}"),
        "tamper_score": rec.tamper_score,
        "heatmap_url": f"/api/uploads/{rec.heatmap}" if rec.heatmap else None,
        "reverse_matches": json.loads(rec.reverse_matches or "[]"),
        "votes_fake": rec.votes_fake,
        "votes_real": rec.votes_real,
        "created_at": rec.created_at.isoformat(),
    }

@app.post("/api/vote")
def vote(payload: dict):
    img_id = payload.get("id")
    v = payload.get("vote")
    if not img_id or v not in ("fake", "real"):
        raise HTTPException(status_code=400, detail="Bad payload")

    db = SessionLocal()
    rec = db.query(ImageRecord).filter(ImageRecord.id == img_id).first()
    if not rec:
        db.close()
        raise HTTPException(status_code=404, detail="Not found")

    if v == "fake":
        rec.votes_fake += 1
    else:
        rec.votes_real += 1
    db.commit()
    db.close()
    return {"status": "ok"}

@app.get("/api/uploads/{filename}")
def serve_upload(filename: str):
    path = UPLOADS / filename
    if not path.exists():
        raise HTTPException(status_code=404)
    return FileResponse(path)

@app.get("/api/health")
def health():
    return {"status": "ok"}
