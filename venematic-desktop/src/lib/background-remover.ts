/**
 * Utilidad en navegador para remover fondo y crear foto de catálogo con fondo blanco impecable.
 * Aplica segmentación adaptativa por color de fondo periférico (flood fill edge thresholding)
 * y genera una imagen limpia centrada sobre lienzo blanco puro (#FFFFFF) sin dependencias pesadas.
 */
export async function removeBackgroundToWhiteCanvas(
  imageSource: string,
  tolerance: number = 38
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const width = img.width;
        const height = img.height;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSource);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Muestrear las esquinas y bordes exteriores para detectar el color de fondo periférico
        const edgeSamples: [number, number][] = [];
        const stepX = Math.max(1, Math.floor(width / 10));
        const stepY = Math.max(1, Math.floor(height / 10));

        for (let x = 0; x < width; x += stepX) {
          edgeSamples.push([x, 0]);
          edgeSamples.push([x, height - 1]);
        }
        for (let y = stepY; y < height - stepY; y += stepY) {
          edgeSamples.push([0, y]);
          edgeSamples.push([width - 1, y]);
        }

        let bgR = 0, bgG = 0, bgB = 0;
        edgeSamples.forEach(([x, y]) => {
          const idx = (y * width + x) * 4;
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
        });
        bgR = Math.round(bgR / edgeSamples.length);
        bgG = Math.round(bgG / edgeSamples.length);
        bgB = Math.round(bgB / edgeSamples.length);

        // Crear mapa de máscara de fondo usando Flood Fill desde el perímetro exterior
        const isBg = new Uint8Array(width * height);
        const visited = new Uint8Array(width * height);
        const queue: number[] = [];

        // Inicializar cola con los bordes
        for (let x = 0; x < width; x++) {
          queue.push(x); // Borde superior
          queue.push((height - 1) * width + x); // Borde inferior
        }
        for (let y = 1; y < height - 1; y++) {
          queue.push(y * width); // Borde izquierdo
          queue.push(y * width + (width - 1)); // Borde derecho
        }

        const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
          return Math.sqrt(
            Math.pow(r1 - r2, 2) * 0.299 +
              Math.pow(g1 - g2, 2) * 0.587 +
              Math.pow(b1 - b2, 2) * 0.114
          );
        };

        // Región central protegida (donde típicamente descansa el producto para evitar que se coma el interior)
        const centerMinX = width * 0.22;
        const centerMaxX = width * 0.78;
        const centerMinY = height * 0.22;
        const centerMaxY = height * 0.78;

        const effectiveTolerance = Math.min(tolerance, 28);

        let head = 0;
        while (head < queue.length) {
          const pos = queue[head++];
          if (visited[pos]) continue;
          visited[pos] = 1;

          const x = pos % width;
          const y = Math.floor(pos / width);

          const pxIdx = pos * 4;
          const r = data[pxIdx];
          const g = data[pxIdx + 1];
          const b = data[pxIdx + 2];

          const distToEdgeBg = colorDistance(r, g, b, bgR, bgG, bgB);

          // Proteger el producto: en el centro se vuelve mucho más estricto para no vaciar el producto
          const inCenterCore = x > centerMinX && x < centerMaxX && y > centerMinY && y < centerMaxY;
          const currentTolerance = inCenterCore ? effectiveTolerance * 0.7 : effectiveTolerance;

          // Solo es fondo si coincide con el color perimetral detectado
          const isBackgroundPixel = distToEdgeBg <= currentTolerance;

          if (isBackgroundPixel) {
            isBg[pos] = 1;

            // Vecinos 4-direccionales
            if (x > 0) queue.push(pos - 1);
            if (x < width - 1) queue.push(pos + 1);
            if (y > 0) queue.push(pos - width);
            if (y < height - 1) queue.push(pos + width);
          }
        }

        // Construir imagen final sobre fondo blanco puro
        for (let i = 0; i < width * height; i++) {
          const pxIdx = i * 4;
          if (isBg[i]) {
            // Fondo blanco puro
            data[pxIdx] = 255;
            data[pxIdx + 1] = 255;
            data[pxIdx + 2] = 255;
            data[pxIdx + 3] = 255;
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // Devolver JPEG optimizado a fondo blanco
        const cleanDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(cleanDataUrl);
      } catch (err) {
        console.error('Error en removeBackgroundToWhiteCanvas:', err);
        resolve(imageSource);
      }
    };

    img.onerror = () => {
      resolve(imageSource);
    };

    img.src = imageSource;
  });
}
