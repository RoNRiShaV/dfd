# backend/forensics.py
import os
from PIL import Image, ImageChops, ImageEnhance, ImageFilter
import imagehash
import exifread
import numpy as np
from pathlib import Path
import requests

def download_file_if_url(url: str, out_path: Path) -> bool:
    try:
        r = requests.get(url, timeout=15, stream=True)
        if r.status_code == 200:
            with open(out_path, "wb") as f:
                for chunk in r.iter_content(1024*32):
                    f.write(chunk)
            return True
    except Exception:
        return False
    return False

def compute_phash(p: str) -> str:
    img = Image.open(p).convert("RGB")
    ph = imagehash.phash(img)
    return str(ph)

def read_exif(p: str) -> dict:
    data = {}
    try:
        with open(p, "rb") as f:
            tags = exifread.process_file(f, details=False)
            for k, v in tags.items():
                data[k] = str(v)
    except Exception:
        pass
    return data

def error_level_analysis(infile: str, out_heatmap: str, quality: int = 90) -> dict:
    """
    Produces ELA heatmap and tamper score.
    tamper_score: scaled mean of the ELA intensity (0-100)
    """
    img = Image.open(infile).convert("RGB")
    tmp = infile + ".resaved.jpg"
    img.save(tmp, quality=quality)
    resaved = Image.open(tmp).convert("RGB")

    diff = ImageChops.difference(img, resaved)
    # amplify differences
    extrema = diff.getextrema()
    # scale factor
    max_diff = max([ex[1] for ex in extrema])
    if max_diff == 0:
        scale = 1
    else:
        scale = 255.0 / max_diff
    diff = ImageEnhance.Brightness(diff).enhance(scale)

    # convert to grayscale for score
    gray = diff.convert("L")
    arr = np.asarray(gray).astype("float32")
    # tamper score heuristic
    score = float(arr.mean()) / 255.0 * 100.0

    # save heatmap: apply blur and enhance for visualization
    heat = diff.filter(ImageFilter.GaussianBlur(radius=2))
    heat.save(out_heatmap)

    try:
        os.remove(tmp)
    except Exception:
        pass

    return {"heatmap": out_heatmap, "tamper_score": score}

def analyze_image_from_path(path: str, out_heatmap_path: str = None) -> dict:
    if out_heatmap_path is None:
        out_heatmap_path = str(Path(path).with_suffix(".heatmap.png"))
    ph = compute_phash(path)
    exif = read_exif(path)
    ela = error_level_analysis(path, out_heatmap_path)
    # Reverse search is mocked in MVP
    reverse_matches = [
        {"title": "Mock match from example.com", "url": "https://example.com/similar.jpg", "similarity": 0.82}
    ]
    return {
        "phash": ph,
        "exif": exif,
        "tamper_score": int(round(ela["tamper_score"])),
        "heatmap": out_heatmap_path,
        "reverse_matches": reverse_matches,
    }
