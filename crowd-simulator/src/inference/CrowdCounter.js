/**
 * CrowdCounter — Uses the Python FastAPI backend for real CSRNet inference.
 * Falls back to simulation only if the backend is unreachable.
 */
export class CrowdCounter {
  constructor() {
    this.mode = 'simulation'; // default until health check completes
    this.backendUrl = 'http://localhost:8000';
    this.status = {
      connected: false,
      device: null,
      weightsLoaded: false,
      lastChecked: null,
    };
    this._listeners = new Set();
    this.checkBackend();

    // Periodically re-check connection every 15 seconds
    setInterval(() => this.checkBackend(), 15000);
  }

  onStatusChange(fn) {
    this._listeners.add(fn);
    fn(this.getBackendStatus());
    return () => this._listeners.delete(fn);
  }

  _notify() {
    const status = this.getBackendStatus();
    this._listeners.forEach((fn) => fn(status));
  }

  getBackendStatus() {
    return {
      mode: this.mode,
      backendUrl: this.backendUrl,
      ...this.status,
    };
  }

  async checkBackend() {
    try {
      const res = await fetch(`${this.backendUrl}/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        this.mode = 'backend';
        this.status = {
          connected: true,
          device: data.device || 'CPU',
          weightsLoaded: data.weights_loaded ?? true,
          lastChecked: new Date(),
        };
        console.log('✅ CSRNet backend connected:', data);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      this.mode = 'simulation';
      this.status = {
        connected: false,
        device: null,
        weightsLoaded: false,
        lastChecked: new Date(),
      };
      console.warn('⚠️ CSRNet backend not available. Running in simulation mode.');
    }
    this._notify();
    return this.getBackendStatus();
  }

  async predict(imageFile) {
    if (this.mode === 'backend') {
      try {
        return await this._backendPredict(imageFile);
      } catch (e) {
        console.warn('Backend prediction failed, falling back to simulation:', e.message);
        this.mode = 'simulation';
        this.status.connected = false;
        this._notify();
        return this._simulatePredict(imageFile);
      }
    }
    return this._simulatePredict(imageFile);
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

