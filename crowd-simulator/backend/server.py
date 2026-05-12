"""
FastAPI server for CSRNet crowd counting inference.
Receives an image, runs it through the trained CSRNet model, returns the predicted count.
"""
import io
import os
import torch
import numpy as np
from PIL import Image
from torchvision import transforms
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from csrnet_model import CSRNet

# ── Configuration ──
WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "weights", "csrnet_partA.pth.tar")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# ── Load Model ──
print(f"Loading CSRNet model from {WEIGHTS_PATH} on {DEVICE}...")
model = CSRNet()

if os.path.exists(WEIGHTS_PATH):
    checkpoint = torch.load(WEIGHTS_PATH, map_location=DEVICE, weights_only=False)
    # Handle different checkpoint formats
    if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
        model.load_state_dict(checkpoint["state_dict"])
    elif isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        model.load_state_dict(checkpoint["model_state_dict"])
    else:
        model.load_state_dict(checkpoint)
    print("[OK] Model weights loaded successfully!")
else:
    print(f"[WARN] Weights file not found at {WEIGHTS_PATH}. Model will use random weights.")

model = model.to(DEVICE)
model.eval()

# ── Image preprocessing (same as training) ──
preprocess = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# ── FastAPI App ──
app = FastAPI(title="CrowdFlow CSRNet API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "device": DEVICE, "weights_loaded": os.path.exists(WEIGHTS_PATH)}


@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    """Run CSRNet inference on an uploaded crowd image."""
    try:
        # Read image
        contents = await image.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        original_w, original_h = img.size

        # Resize if too large (for memory/speed), keep aspect ratio
        max_side = 1024
        if max(original_w, original_h) > max_side:
            scale = max_side / max(original_w, original_h)
            new_w = int(original_w * scale)
            new_h = int(original_h * scale)
            img = img.resize((new_w, new_h), Image.BILINEAR)

        # Preprocess
        img_tensor = preprocess(img).unsqueeze(0).to(DEVICE)

        # Inference
        with torch.no_grad():
            density_map = model(img_tensor)

        # Sum density map to get total count
        count = density_map.sum().item()
        count = max(0, count)  # Clamp negative predictions

        # Get density map stats for confidence estimate
        density_np = density_map.squeeze().cpu().numpy()
        max_density = float(density_np.max())
        mean_density = float(density_np.mean())

        return JSONResponse(content={
            "count": round(count),
            "count_raw": round(count, 2),
            "confidence": min(0.95, 0.7 + (min(count, 500) / 5000)),
            "mode": "csrnet",
            "device": DEVICE,
            "imageWidth": original_w,
            "imageHeight": original_h,
            "densityMax": round(max_density, 4),
            "densityMean": round(mean_density, 6),
        })

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "mode": "csrnet"},
        )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
