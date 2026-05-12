# JanGinti: Counting the Pulse of the Crowd — Quick Guide

A CSRNet-based crowd density estimation system with an interactive web simulator. Train a model → evaluate it → deploy it as a real-time web app.

> [!IMPORTANT]
> **JanGinti** is a complete end-to-end deep learning project — not just a training notebook. It covers dataset preparation, two-phase model training, comprehensive evaluation with 13 visualizations, and deployment as a FastAPI + Vite web application with an interactive canvas-based crowd flow simulator.

## 🚀 How to Run

### Option A — Web Simulator (Frontend + Backend)

**Prerequisites:** Python 3.10+, Node.js 18+, (Optional) NVIDIA GPU with CUDA

```bash
# Terminal 1: Start the inference backend
cd crowd-simulator/backend
pip install -r requirements.txt
python server.py
```

```bash
# Terminal 2: Start the frontend
cd crowd-simulator
npm install
npm run dev
```

Open `http://localhost:5173` — the crowd flow simulator is ready.

> [!NOTE]
> The backend loads the trained CSRNet model (`weights/csrnet_partA.pth.tar`, 130 MB) and serves inference at `http://localhost:8000`. If the backend is offline, the frontend automatically falls back to simulation mode — no crash, just estimated counts.

### Option B — Training Notebooks (Google Colab)

Upload the notebooks from `training-notebook/` to Google Colab:

1. **`csrnet-part-1.ipynb`** — Train CSRNet from scratch on ShanghaiTech Part A
2. **`csrnet-part-2.ipynb`** — Fine-tune the Plan 1 model on A+B+C combined dataset

Both notebooks are designed for **Colab with T4 GPU**. They save checkpoints and density maps to Google Drive.

## 🎯 How to Use the Simulator

1. **Launch** the frontend (`npm run dev`) and backend (`python server.py`)
2. **Explore scenarios** — click pre-configured scenarios in the left sidebar
3. **Add areas** — press `2` or click "Add Area" in the toolbar, then click the canvas
4. **Connect pathways** — press `3`, click a source area, then click a destination area
5. **Upload images** — use the inspector panel to upload crowd images for CSRNet inference
6. **View results** — the backend returns crowd count, confidence, and density statistics
7. **Configure rules** — set up automated crowd management rules via the Area Editor

### Keyboard Shortcuts

| Key | Action |
|---|---|
| `1` | Select mode (click to select, drag to move) |
| `2` | Add Area mode |
| `3` | Add Path mode (click source → click destination) |
| `4` | Delete mode (click to remove) |
| `Escape` | Clear selection, back to Select mode |
| `Delete` | Delete selected area (with confirmation) |

## 📊 Evaluation Results

| Partition | MAE | MSE | Test Images |
|---|---|---|---|
| **Part A** | **63.31** | **109.62** | 182 |

**Plan 1 → Plan 2 improvement:** MAE reduced from 76.25 → 63.31 (17% better). Our result **beats the original CSRNet paper's Part A MAE** of 68.2.

## 🔌 API Reference

| Method | Endpoint | Request | Response |
|---|---|---|---|
| `GET` | `/health` | — | `{status, device, weights_loaded}` |
| `POST` | `/predict` | `multipart/form-data` with `image` file | `{count, count_raw, confidence, mode, device, imageWidth, imageHeight, densityMax, densityMean}` |

**Example:**
```bash
curl -X POST http://localhost:8000/predict \
  -F "image=@crowd_photo.jpg"
```

## ⚠️ Important Notes

- **Model weights required** — place `csrnet_partA.pth.tar` (130 MB) in `crowd-simulator/backend/weights/`. Without it, the backend uses random weights (useless for inference).
- **GPU auto-detected** — CUDA GPU used if available, otherwise CPU fallback. Check `/health` endpoint to verify.
- **Large images auto-resized** — images larger than 1024px are scaled down for memory efficiency.
- **Training notebooks need Colab** — designed for Google Colab with T4 GPU and Google Drive storage for checkpoints.
- **Dataset not in git** — the ShanghaiTech dataset (~5 GB) is excluded via `.gitignore`. Download separately if you need to retrain.
