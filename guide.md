# JanGinti: Counting the Pulse of the Crowd — Quick Guide

A CSRNet-based crowd density estimation system that **outperforms the original CSRNet paper** on both ShanghaiTech partitions, incorporates **custom Indian crowd data** to address Western bias in existing benchmarks, and deploys as a real-time web application.

> [!IMPORTANT]
> **JanGinti** (जन-गिंती) is a complete end-to-end deep learning project — not just a training notebook. It covers dataset preparation, two-phase model training on **ShanghaiTech A + B + custom Indian Part C**, comprehensive evaluation with 13 visualizations, and deployment as a FastAPI + Vite web application. The model achieves **MAE 63.31 (Part A) and 8.37 (Part B)** — beating the original CSRNet paper on both partitions.

> [!NOTE]
> **Why Indian crowd data?** Standard benchmarks (ShanghaiTech, UCF-QNRF) predominantly contain Western and East Asian crowd scenes. Indian crowds present unique challenges — diverse cultural contexts, varied attire (saris, turbans, religious garments), extreme density at religious gatherings (Kumbh Mela), and distinctive spatial formations (temple queues, railway platforms, bazaar configurations). JanGinti's Part C dataset addresses this gap.

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

### 🏆 Final Performance (Beats Original CSRNet Paper on Both Partitions)

| Partition | MAE ↓ | MSE ↓ | Test Images | vs. CSRNet Paper (2018) |
|---|---|---|---|---|
| **Part A** (dense) | **63.31** | **109.62** | 182 | MAE **7.2% better** (paper: 68.2), MSE **4.7% better** (paper: 115.0) |
| **Part B** (sparse) | **8.37** | **13.38** | 316 | MAE **21% better** (paper: 10.6), MSE **16.4% better** (paper: 16.0) |

### Benchmark Comparison

| Method | Part A MAE | Part A MSE | Part B MAE | Part B MSE |
|---|---|---|---|---|
| MCNN (2016) | 110.20 | 173.20 | 26.40 | 41.30 |
| CSRNet Paper (2018) | 68.20 | 115.00 | 10.60 | 16.00 |
| JanGinti Plan 1 (Scratch) | 76.25 | 116.00 | — | — |
| **JanGinti Final (Ours)** | **63.31** ✅ | **109.62** ✅ | **8.37** ✅ | **13.38** ✅ |

**Plan 1 → Plan 2 improvement:** Part A MAE reduced from 76.25 → 63.31 (**17% better**). Fine-tuning on the combined A+B+C dataset with Indian crowd data was key to this improvement.

### 🇮🇳 Indian Crowd Data (Part C)

The custom Part C dataset (85 images) demonstrates that incorporating culturally diverse crowd scenes — Kumbh Mela, railway stations, temple gatherings, street markets, cricket stadiums, election rallies — improves generalization and helps the model outperform training on Western-dominated benchmarks alone. Qualitative predictions on Part C are available in `visualizations/partC_predictions_sample.png`.

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
