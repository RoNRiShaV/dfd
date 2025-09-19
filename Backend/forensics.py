"""
forensics.py
------------
Loads the EfficientNet-B3 deepfake model, runs analysis on images,
extracts EXIF + perceptual hash, predicts authenticity, and optionally
creates a Grad-CAM heatmap.

Author: You
"""

import logging
from collections import OrderedDict
from pathlib import Path

import torch
import timm
from torchvision import transforms
from PIL import Image, ExifTags
import imagehash
import numpy as np
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image


# ---------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------
# Device
# ---------------------------------------------------------------------
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"Device selected: {DEVICE}")

# ---------------------------------------------------------------------
# Load model weights
# ---------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
CHECKPOINT_PATH = BASE_DIR / "weights" / "efficientnet_b3_deepfake.pth"

if not CHECKPOINT_PATH.exists():
    raise FileNotFoundError(
        f"Model weights not found at {CHECKPOINT_PATH}. "
        f"Please place efficientnet_b3_deepfake.pth inside weights/."
    )

checkpoint = torch.load(CHECKPOINT_PATH, map_location=DEVICE)

# Extract state dict
if isinstance(checkpoint, dict) and any(k in checkpoint for k in ["state_dict", "network"]):
    state_dict = checkpoint.get("state_dict") or checkpoint.get("network")
else:
    state_dict = checkpoint

# Remove 'module.' prefixes if present
clean_state_dict = OrderedDict()
for k, v in state_dict.items():
    clean_key = k.replace("module.", "") if k.startswith("module.") else k
    clean_state_dict[clean_key] = v

# Init EfficientNet-B3 (2 classes: Fake / Real)
model = timm.create_model("tf_efficientnet_b3", pretrained=False, num_classes=2)
missing, unexpected = model.load_state_dict(clean_state_dict, strict=False)
if missing:
    logger.warning(f"Missing keys when loading weights: {missing}")
if unexpected:
    logger.warning(f"Unexpected keys when loading weights: {unexpected}")

model.to(DEVICE)
model.eval()
logger.info("✅ EfficientNet-B3 deepfake model loaded successfully.")

# ---------------------------------------------------------------------
# Preprocessing
# ---------------------------------------------------------------------
transform = transforms.Compose(
    [
        transforms.Resize((300, 300)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225]),
    ]
)

# ---------------------------------------------------------------------
# Analyzer
# ---------------------------------------------------------------------
def analyze_image_from_path(image_path: str, out_heatmap_path: str = None) -> dict:
    """
    Analyze an image for deepfake authenticity.

    Parameters
    ----------
    image_path : str
        Path to the input image.
    out_heatmap_path : str, optional
        Path where a Grad-CAM heatmap will be saved.

    Returns
    -------
    dict
        Dictionary with EXIF, pHash, deepfake prediction, tamper score,
        and optional heatmap path.
    """
    result = {}
    try:
        # --- Load image ---
        img = Image.open(image_path).convert("RGB")

        # --- EXIF metadata ---
        exif_data = {}
        try:
            raw_exif = img._getexif()
            if raw_exif:
                for tag, val in raw_exif.items():
                    key = ExifTags.TAGS.get(tag, tag)
                    exif_data[key] = str(val)
        except Exception:
            exif_data = {}
        result["exif"] = exif_data

        # --- Perceptual hash ---
        try:
            result["phash"] = str(imagehash.phash(img))
        except Exception:
            result["phash"] = None

        # --- DeepFake prediction ---
        img_tensor = transform(img).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            logits = model(img_tensor)
            probs = torch.softmax(logits, dim=1)[0]

        real_prob = float(probs[1])
        fake_prob = float(probs[0])
        authenticity_score = real_prob * 100

        # Decision
        margin = 0.05  # 5% margin
        if abs(real_prob - fake_prob) <= margin:
            prediction = "Suspicious"
        elif real_prob > fake_prob:
            prediction = "Real"
        else:
            prediction = "Fake"

        result["deepfake"] = {
            "real_prob": real_prob,
            "fake_prob": fake_prob,
            "authenticity_score": authenticity_score,
            "prediction": prediction,
        }

        # --- Grad-CAM heatmap ---
        if out_heatmap_path:
            try:
                target_layers = [model.blocks[-1]]  # last conv block
                cam = GradCAM(model=model, target_layers=target_layers)

                rgb_img = np.array(img.resize((300, 300))) / 255.0
                input_tensor = transform(img).unsqueeze(0).to(DEVICE)

                grayscale_cam = cam(input_tensor=input_tensor)[0, :]
                heatmap_img = show_cam_on_image(
                    rgb_img.astype(np.float32),
                    grayscale_cam,
                    use_rgb=True
                )
                Image.fromarray(heatmap_img).save(out_heatmap_path)
                result["heatmap"] = out_heatmap_path
            except Exception as e:
                logger.error(f"Heatmap generation failed: {e}")
                result["heatmap"] = None

        # --- Tamper score ---
        result["tamper_score"] = fake_prob * 100

    except Exception as e:
        logger.error(f"Error analyzing image: {e}")
        result["error"] = str(e)

    return result
