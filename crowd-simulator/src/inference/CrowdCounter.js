/**
 * CrowdCounter — Uses the Python FastAPI backend for real CSRNet inference.
 * Falls back to simulation only if the backend is unreachable.
 */
export class CrowdCounter {
  constructor() {
    this.mode = 'backend'; // default to real inference
    this.backendUrl = 'http://localhost:8000';
    this._checkBackend();
  }

  async _checkBackend() {
    try {
      const res = await fetch(`${this.backendUrl}/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        console.log('✅ CSRNet backend connected:', data);
        this.mode = 'backend';
      }
    } catch {
      console.warn('⚠️ CSRNet backend not available. Start it with: python backend/server.py');
      this.mode = 'simulation';
    }
  }

  async predict(imageFile) {
    // Always try backend first
    try {
      return await this._backendPredict(imageFile);
    } catch (e) {
      console.warn('Backend prediction failed, falling back to simulation:', e.message);
      return this._simulatePredict(imageFile);
    }
  }

  async _backendPredict(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const res = await fetch(`${this.backendUrl}/predict`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `Backend error: ${res.status}`);
    }

    return await res.json();
  }

  async _simulatePredict(imageFile) {
    // Fallback: simulate network delay + generate realistic count
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
    const img = await this._loadImage(imageFile);
    const area = img.width * img.height;
    const base = Math.floor(area / 2000);
    const noise = Math.floor(Math.random() * 200 - 100);
    const count = Math.max(10, Math.min(2000, base + noise));
    return {
      count,
      confidence: 0.75 + Math.random() * 0.2,
      mode: 'simulation (backend unavailable)',
      imageWidth: img.width,
      imageHeight: img.height,
    };
  }

  _loadImage(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve({ width: 640, height: 480 });
      img.src = URL.createObjectURL(file);
    });
  }
}

export const crowdCounter = new CrowdCounter();
