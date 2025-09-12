# backend/forensics.py
import os
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ExifTags, ImageChops, ImageEnhance
import imagehash
import torch
from torchvision import transforms
import timm
from collections import OrderedDict

# -------------------------------
# Device setup
# -------------------------------
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# -------------------------------
# Load Pretrained Deepfake Model
# -------------------------------
MODEL_PATH = Path(__file__).resolve().parent / "weights" / "efficientnet-b3.pkl"

def load_deepfake_model():
    model = timm.create_model("tf_efficientnet_b3", pretrained=False, num_classes=2)
    checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)

    # Some checkpoints wrap weights
    if isinstance(checkpoint, dict):
        if "state_dict" in checkpoint:
            state_dict = checkpoint["state_dict"]
        elif "network" in checkpoint:
            state_dict = checkpoint["network"]
        else:
            state_dict = checkpoint
    else:
        state_dict = checkpoint

    # Strip 'module.' prefixes if trained on DataParallel
    new_state_dict = OrderedDict()
    for k, v in state_dict.items():
        new_state_dict[k.replace("module.", "")] = v

    model.load_state_dict(new_state_dict, strict=False)
    model.to(DEVICE)
    model.eval()
    return model

deepfake_model = load_deepfake_model()

transform = transforms.Compose([
    transforms.Resize((300, 300)),
    transforms.ToTensor(),
    transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])
])

# -------------------------------
# Forensic Tools
# -------------------------------
def extract_exif(img_path: str):
    """Extract EXIF metadata from image."""
    try:
        img = Image.open(img_path)
        exif_data = {}
        if hasattr(img, "_getexif") and img._getexif():
            for tag, value in img._getexif().items():
                decoded = ExifTags.TAGS.get(tag, tag)
                exif_data[decoded] = str(value)
        return exif_data
    except Exception:
        return {}

def compute_phash(img_path: str):
    """Compute perceptual hash."""
    try:
        img = Image.open(img_path)
        return str(imagehash.phash(img))
    except Exception:
        return None

def tamper_analysis(img_path: str, out_path: str):
    """Error Level Analysis (ELA) for tamper detection."""
    try:
        temp_file = img_path + "_ela_tmp.jpg"
        original = Image.open(img_path).convert("RGB")
        original.save(temp_file, "JPEG", quality=90)

        compressed = Image.open(temp_file)
        ela = ImageChops.difference(original, compressed)

        extrema = ela.getextrema()
        max_diff = max([ex[1] for ex in extrema])
        scale = 255.0 / max_diff if max_diff else 1
        ela = ImageEnhance.Brightness(ela).enhance(scale)

        ela.save(out_path)
        tamper_score = int(np.array(ela).mean())

        if os.path.exists(temp_file):
            os.remove(temp_file)

        return tamper_score, out_path
    except Exception as e:
        print(f"[ELA ERROR] {e}")
        return 0, None

def deepfake_inference(img_path: str):
    """Run deepfake classifier."""
    try:
        img = Image.open(img_path).convert("RGB")
        x = transform(img).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            logits = deepfake_model(x)
            probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
        fake_prob = float(probs[1])
        real_prob = float(probs[0])
        pred = "fake" if fake_prob > real_prob else "real"
        return {"real_prob": real_prob, "fake_prob": fake_prob, "prediction": pred}
    except Exception as e:
        print(f"[DEEPFAKE ERROR] {e}")
        return {"real_prob": 0.0, "fake_prob": 0.0, "prediction": "error"}

# -------------------------------
# Main Forensic Pipeline
# -------------------------------
def analyze_image_from_path(img_path: str, out_heatmap_path: str = None):
    result = {}
    result["phash"] = compute_phash(img_path)
    result["exif"] = extract_exif(img_path)

    # Tamper analysis + heatmap
    tamper_score, heatmap = tamper_analysis(img_path, out_heatmap_path) if out_heatmap_path else (0, None)
    result["tamper_score"] = tamper_score
    result["heatmap"] = heatmap

    # Deepfake classifier
    result["deepfake"] = deepfake_inference(img_path)

    # Placeholder for reverse image search
    result["reverse_matches"] = []

    return result
