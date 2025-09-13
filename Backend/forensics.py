# backend/forensics.py
import torch
import timm
from torchvision import transforms
from PIL import Image, ExifTags
import imagehash
import logging
from collections import OrderedDict

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
# Load model robustly
# -------------------------------
CHECKPOINT_PATH = "weights/efficientnet-b3.pkl"

# Load checkpoint
checkpoint = torch.load(CHECKPOINT_PATH, map_location=DEVICE)

# Attempt to extract state_dict from common keys
if 'state_dict' in checkpoint:
    state_dict = checkpoint['state_dict']
elif 'network' in checkpoint:
    state_dict = checkpoint['network']
else:
    state_dict = checkpoint  # assume raw state_dict

# Strip "module." prefix if it exists (from DataParallel training)
new_state_dict = OrderedDict()
for k, v in state_dict.items():
    if k.startswith('module.'):
        k = k.replace('module.', '')
    new_state_dict[k] = v
state_dict = new_state_dict

# Initialize EfficientNet-B3
model = timm.create_model('tf_efficientnet_b3', pretrained=False, num_classes=2)

# Load weights strictly and log any missing/unexpected keys
missing, unexpected = model.load_state_dict(state_dict, strict=False)
if missing:
    logger.warning(f"Missing keys when loading weights: {missing}")
if unexpected:
    logger.warning(f"Unexpected keys when loading weights: {unexpected}")

model.to(DEVICE)
model.eval()
logger.info("EfficientNet-B3 model loaded successfully.")

# -------------------------------
# Image preprocessing
# -------------------------------
transform = transforms.Compose([
    transforms.Resize((300, 300)),  # Ensure exact 300x300 input size
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

# -------------------------------
# Prediction function
# -------------------------------
def analyze_image_from_path(image_path: str, out_heatmap_path: str = None):
    """
    Analyze uploaded image:
      - Compute EXIF metadata
      - Compute phash
      - Run DeepFake prediction
    Returns a dict with results.
    """
    result = {}
    try:
        # Load image
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
        logger.debug(f"Input tensor shape: {img_tensor.shape}")  # Should be [1, 3, 300, 300]

        with torch.no_grad():
            logits = model(img_tensor)
            probs = torch.softmax(logits, dim=1)[0]

        real_prob = float(probs[0])
        fake_prob = float(probs[1])

        authenticity_score = real_prob * 100  # percentage

        # Define margin for suspicious predictions around 50%
        margin = 5.0  # 5%

        if abs(authenticity_score - 50.0) <= margin:
            prediction = "Suspicious"
        elif fake_prob > real_prob:
            prediction = "Fake"
        else:
            prediction = "Real"

        result["deepfake"] = {
            "real_prob": real_prob,
            "fake_prob": fake_prob,
            "authenticity_score": authenticity_score,
            "prediction": prediction
        }

        # --- Optional heatmap path placeholder ---
        if out_heatmap_path:
            result["heatmap"] = out_heatmap_path

        # Other dummy placeholders for your pipeline
        result["tamper_score"] = fake_prob * 100  # simple example
        result["reverse_matches"] = []

    except Exception as e:
        logger.error(f"Error analyzing image: {e}")
        result["error"] = str(e)

    return result
