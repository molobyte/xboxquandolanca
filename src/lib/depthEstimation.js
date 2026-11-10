// Serviço de Estimativa de Profundidade (Depth Anything V2) em Web Worker + Cache IndexedDB
// Arquitetura Custo Zero (Serverless CORS Proxy na Vercel Free + WebGPU/WASM no cliente)

const DB_NAME = 'xbox-depth-cache-v1';
const STORE_NAME = 'depthMaps';
const MEMORY_CACHE = new Map();

function openDepthDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB indisponível'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCachedDepthMap(key) {
  if (MEMORY_CACHE.has(key)) return MEMORY_CACHE.get(key);
  try {
    const db = await openDepthDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result) MEMORY_CACHE.set(key, req.result);
        resolve(req.result || null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function setCachedDepthMap(key, dataUrl) {
  MEMORY_CACHE.set(key, dataUrl);
  try {
    const db = await openDepthDb();
    await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(dataUrl, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignora falha de escrita em modo privado/quota
  }
}

export function getProxiedImageUrl(originalUrl) {
  if (!originalUrl) return '';
  return `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
}

// Código do Web Worker isolado que carrega @huggingface/transformers via CDN ESM
// sem inflar o bundle do Vite nem exigir GPU no servidor da Vercel.
const WORKER_CODE = `
import { pipeline, env, RawImage } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3/+esm';

env.allowLocalModels = false;
env.useBrowserCache = true;

let estimatorPromise = null;

async function getEstimator(onProgress) {
  if (!estimatorPromise) {
    estimatorPromise = (async () => {
      let useWebGpu = false;
      if (typeof navigator !== 'undefined' && navigator.gpu) {
        try {
          const adapter = await navigator.gpu.requestAdapter();
          if (adapter) useWebGpu = true;
        } catch {}
      }

      const progressCallback = (info) => {
        if (info.status === 'progress' && typeof info.progress === 'number') {
          onProgress?.(Math.round(info.progress));
        }
      };

      try {
        if (useWebGpu) {
          return await pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small', {
            device: 'webgpu',
            dtype: 'fp32',
            progress_callback: progressCallback,
          });
        }
      } catch {
        // Fallback automático para WASM q8 caso WebGPU falhe no driver
      }

      return await pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small', {
        device: 'wasm',
        dtype: 'q8',
        progress_callback: progressCallback,
      });
    })();
  }
  return estimatorPromise;
}

self.onmessage = async (event) => {
  const { id, imageUrl } = event.data;
  try {
    const estimator = await getEstimator((pct) => {
      self.postMessage({ id, type: 'progress', progress: pct });
    });

    self.postMessage({ id, type: 'status', stage: 'inferring' });

    const image = await RawImage.fromURL(imageUrl);
    // Redimensiona entrada para inferência rápida preservando proporção
    const targetW = 256;
    const targetH = Math.max(128, Math.round((image.height / image.width) * targetW));
    const resized = await image.resize(targetW, targetH);

    const output = await estimator(resized);
    const depthTensor = output.predicted_depth;
    const data = depthTensor.data;
    const dims = depthTensor.dims;
    const h = dims[dims.length - 2];
    const w = dims[dims.length - 1];

    // Normaliza os valores de profundidade para 0..255 com contraste aprimorado (percentil 2%..98%)
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < data.length; i++) {
      const v = data[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = max - min || 1;

    const rgba = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      // Curva suave (smoothstep/gamma leve) para destacar o primeiro plano (personagem/logo) do fundo
      const norm = Math.max(0, Math.min(1, (data[i] - min) / range));
      const enhanced = Math.pow(norm, 0.92);
      const val = Math.round(enhanced * 255);
      const idx = i * 4;
      rgba[idx] = val;
      rgba[idx + 1] = val;
      rgba[idx + 2] = val;
      rgba[idx + 3] = 255;
    }

    self.postMessage(
      { id, type: 'done', width: w, height: h, rgbaBuffer: rgba.buffer },
      [rgba.buffer]
    );
  } catch (err) {
    self.postMessage({ id, type: 'error', error: err?.message || 'Falha na inferência de profundidade' });
  }
};
`;

let sharedWorker = null;
let requestCounter = 0;
const pendingRequests = new Map();

function getDepthWorker() {
  if (sharedWorker) return sharedWorker;
  const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  sharedWorker = new Worker(workerUrl, { type: 'module' });

  sharedWorker.onmessage = (e) => {
    const { id, type, progress, stage, width, height, rgbaBuffer, error } = e.data;
    const req = pendingRequests.get(id);
    if (!req) return;

    if (type === 'progress') {
      req.onStatus?.({ stage: 'downloading', progress });
    } else if (type === 'status') {
      req.onStatus?.({ stage });
    } else if (type === 'done') {
      pendingRequests.delete(id);
      req.resolve({ width, height, rgbaBuffer });
    } else if (type === 'error') {
      pendingRequests.delete(id);
      req.reject(new Error(error));
    }
  };

  sharedWorker.onerror = (err) => {
    for (const [, req] of pendingRequests) {
      req.reject(new Error(err?.message || 'Erro no Web Worker'));
    }
    pendingRequests.clear();
  };

  return sharedWorker;
}

/**
 * Converte o buffer RGBA bruto do mapa de profundidade em um DataURL suavizado (com leve blur gaussiano
 * para eliminar serrilhados nas bordas do personagem durante o deslocamento WebGL).
 */
function rgbaBufferToSmoothDataUrl(width, height, rgbaBuffer) {
  const rawCanvas = document.createElement('canvas');
  rawCanvas.width = width;
  rawCanvas.height = height;
  const rawCtx = rawCanvas.getContext('2d');
  const imgData = new ImageData(new Uint8ClampedArray(rgbaBuffer), width, height);
  rawCtx.putImageData(imgData, 0, 0);

  const smoothCanvas = document.createElement('canvas');
  smoothCanvas.width = width;
  smoothCanvas.height = height;
  const smoothCtx = smoothCanvas.getContext('2d');
  smoothCtx.filter = 'blur(2.5px)';
  smoothCtx.drawImage(rawCanvas, -4, -4, width + 8, height + 8);

  return smoothCanvas.toDataURL('image/webp', 0.9);
}

/**
 * Gera (ou recupera do cache IndexedDB) o mapa de profundidade de uma capa do Xbox.
 */
export async function generateOrGetDepthMap(coverUrl, { onStatus } = {}) {
  if (!coverUrl) return null;

  // 1. Verifica cache local instantâneo (memória + IndexedDB)
  const cached = await getCachedDepthMap(coverUrl);
  if (cached) {
    onStatus?.({ stage: 'cached' });
    return cached;
  }

  // 2. Executa Depth Anything V2 em segundo plano via Web Worker usando a imagem via proxy CORS
  const proxiedUrl = new URL(getProxiedImageUrl(coverUrl), window.location.origin).toString();
  const id = ++requestCounter;
  const worker = getDepthWorker();

  onStatus?.({ stage: 'starting' });

  const { width, height, rgbaBuffer } = await new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject, onStatus });
    worker.postMessage({ id, imageUrl: proxiedUrl });
  });

  const dataUrl = rgbaBufferToSmoothDataUrl(width, height, rgbaBuffer);
  await setCachedDepthMap(coverUrl, dataUrl);
  onStatus?.({ stage: 'ready' });
  return dataUrl;
}
