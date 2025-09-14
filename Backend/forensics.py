import torch
import timm
from torchvision import transforms
from PIL import Image, ExifTags
import imagehash
import logging
from collections import OrderedDict
from pathlib import Path
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
import numpy as np

# -------------------------------
# Logging
# -------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -------------------------------
# Device
# -------------------------------
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"Device: {DEVICE}")

# -------------------------------
# Load model
# -------------------------------
BASE_DIR = Path(__file__).resolve().parent
CHECKPOINT_PATH = BASE_DIR / "weights" / "efficientnet_b3_deepfake.pth"

checkpoint = torch.load(CHECKPOINT_PATH, map_location=DEVICE)

# Extract state_dict
if isinstance(checkpoint, dict) and any(k in checkpoint for k in ["state_dict", "network"]):
    state_dict = checkpoint.get("state_dict") or checkpoint.get("network")
else:
    state_dict = checkpoint

# Remove "module." prefix if it exists
new_state_dict = OrderedDict()
for k, v in state_dict.items():
    if k.startswith("module."):
        k = k.replace("module.", "")
    new_state_dict[k] = v
state_dict = new_state_dict

# Init EfficientNet-B3
model = timm.create_model("tf_efficientnet_b3", pretrained=False, num_classes=2)

# Load trained weights
missing, unexpected = model.load_state_dict(state_dict, strict=False)
if missing:
    logger.warning(f"Missing keys when loading weights: {missing}")
if unexpected:
    logger.warning(f"Unexpected keys when loading weights: {unexpected}")

model.to(DEVICE)
model.eval()
logger.info("✅ Custom EfficientNet-B3 model loaded successfully.")

# -------------------------------
# Preprocessing
# -------------------------------
transform = transforms.Compose([
    transforms.Resize((300, 300)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225]),
])

# -------------------------------
# Analyzer
# -------------------------------
def analyze_image_from_path(image_path: str, out_heatmap_path: str = None):
    result = {}
    try:
        # --- Load image ---
        img = Image.open(image_path).convert("RGB")

        # --- EXIF ---
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

        # --- pHash ---
        try:
            phash = str(imagehash.phash(img))
        except Exception:
            phash = None
        result["phash"] = phash

        # --- DeepFake prediction ---
        img_tensor = transform(img).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            logits = model(img_tensor)
            probs = torch.softmax(logits, dim=1)[0]

        real_prob = float(probs[1])
        fake_prob = float(probs[0])

        # Authenticity = confidence of being Real
        authenticity_score = real_prob * 100  # %

        # Suspicious if probabilities are very close
        margin = 0.05  # 5%
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

        # --- Heatmap (Grad-CAM) ---
        if out_heatmap_path:
            try:
                # Use last conv layer of EfficientNet
                target_layers = [model.blocks[-1]]
                cam = GradCAM(model=model, target_layers=target_layers)

                rgb_img = np.array(img.resize((300, 300))) / 255.0
                input_tensor = transform(img).unsqueeze(0).to(DEVICE)

                grayscale_cam = cam(input_tensor=input_tensor)[0, :]
                heatmap_img = show_cam_on_image(rgb_img.astype(np.float32), grayscale_cam, use_rgb=True)

                Image.fromarray(heatmap_img).save(out_heatmap_path)
                result["heatmap"] = out_heatmap_path
            except Exception as e:
                logger.error(f"Heatmap generation failed: {e}")
                result["heatmap"] = None

        # Extra fields
        result["tamper_score"] = fake_prob * 100
        result["reverse_matches"] = []

    except Exception as e:
        logger.error(f"Error analyzing image: {e}")
        result["error"] = str(e)

    return result
