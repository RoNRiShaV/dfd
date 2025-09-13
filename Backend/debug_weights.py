# Backend/debug_weights.py
import torch
from pathlib import Path
from collections import OrderedDict
import timm
import pickle

MODEL_PATH = Path("Backend/weights/efficientnet-b3.pkl")
DEVICE = "cpu"
print("MODEL_PATH:", MODEL_PATH.exists(), MODEL_PATH)

# create model exactly as used in main
print("Creating model tf_efficientnet_b3 (num_classes=2)")
model = timm.create_model("tf_efficientnet_b3", pretrained=False, num_classes=2)
model_keys = list(model.state_dict().keys())
print("Model param count:", len(model_keys))
print("Sample model keys:", model_keys[:10])

# load checkpoint (try torch.load then pickle)
ckpt = None
try:
    ckpt = torch.load(MODEL_PATH, map_location=DEVICE)
    print("Loaded with torch.load(), type:", type(ckpt))
except Exception as e:
    print("torch.load failed:", e, "- trying pickle.load")
    with open(MODEL_PATH, "rb") as f:
        ckpt = pickle.load(f)
    print("Loaded with pickle, type:", type(ckpt))

# inspect top-level keys if dict
if isinstance(ckpt, dict):
    print("Top-level checkpoint keys:", list(ckpt.keys())[:40])

# pull candidate state_dict
if isinstance(ckpt, dict) and "network" in ckpt:
    sd = ckpt["network"]
elif isinstance(ckpt, dict) and "state_dict" in ckpt:
    sd = ckpt["state_dict"]
elif isinstance(ckpt, dict) and "model" in ckpt and isinstance(ckpt["model"], dict) and "state_dict" in ckpt["model"]:
    sd = ckpt["model"]["state_dict"]
else:
    sd = ckpt

print("Candidate state-dict size (keys):", len(sd) if hasattr(sd, 'keys') else "N/A")
sample_keys = list(sd.keys())[:40] if hasattr(sd, 'keys') else []
print("Sample checkpoint keys:", sample_keys)

# strip prefixes
def strip_module_keys(mapping):
    new = OrderedDict()
    for k, v in mapping.items():
        new_key = k.replace("module.", "").replace("backbone.", "")  # try a couple of common prefixes
        new[new_key] = v
    return new

sd_stripped = strip_module_keys(sd if isinstance(sd, dict) else dict(sd))

# compare shapes
model_sd = model.state_dict()
matching = 0
shape_mismatch = []
for k, v in sd_stripped.items():
    if k in model_sd:
        if tuple(v.shape) == tuple(model_sd[k].shape):
            matching += 1
        else:
            shape_mismatch.append((k, tuple(v.shape), tuple(model_sd[k].shape)))
print(f"Matching keys with same shape: {matching} / {len(model_sd)}")
print("Sample shape mismatches (if any):", shape_mismatch[:10])
print("Sample model keys not in checkpoint:", [k for k in list(model_sd.keys())[:30] if k not in sd_stripped][:10])
print("Sample checkpoint keys not in model:", [k for k in list(sd_stripped.keys())[:50] if k not in model_sd][:20])
