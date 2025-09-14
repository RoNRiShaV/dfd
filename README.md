# 🔍 DeepFake Detection  

![Python](https://img.shields.io/badge/Python-3.9%2B-blue?logo=python)  
![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-ee4c2c?logo=pytorch)  
![OpenCV](https://img.shields.io/badge/OpenCV-4.0+-green?logo=opencv)  
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)  

A *DeepFake Detection System* powered by *Machine Learning* and *Computer Vision* to identify manipulated images and videos.  
This project provides a backend pipeline for analyzing media files and detecting deepfake content.  

---

## ✨ Features  
✅ Detects manipulated (deepfake) images and videos  
✅ Forensic analysis using OpenCV, PyTorch, and ImageHash  
✅ Pre-trained model integration via [timm](https://huggingface.co/timm)  
✅ JSON-based logging of detection results  
✅ Lightweight Python backend for scalability  

---

## ⚡ Installation  

### 1️⃣ Clone the Repository  
```bash
git clone https://github.com/your-username/DeepFakeDetection.git
cd DeepFakeDetection/Backend

python -m venv venv
source venv/bin/activate   # On Linux/Mac
venv\Scripts\activate      # On Windows

pip install -r requirements.txt

DeepFakeDetection/
│── Backend/
│   ├── main.py              # Entry point
│   ├── forensics.py         # Core deepfake detection logic
│   ├── debug_weights.py     # Debugging and model inspection
│   ├── analysis_log.json    # Sample analysis logs
│   ├── forensics.db         # SQLite database (if used for storage)
│   ├── requirements.txt     # Dependencies
│   └── .venv/               # Virtual environment (local use only)
│── .gitattributes
│── bfg-1.15.0.jar           # (Optional) Git history cleaning tool

python main.py --input path_to_media_file


