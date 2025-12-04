export const generateGif = (
  frames: HTMLCanvasElement[],
  fps: number,
  onProgress: (progress: number) => void
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a Blob URL for the worker script to avoid CORS issues with CDNs
      // We explicitly load the worker from the same CDN version
      const workerScript = `importScripts('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');`;
      const workerBlob = new Blob([workerScript], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(workerBlob);

      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: frames[0].width,
        height: frames[0].height,
        workerScript: workerUrl,
        transparent: 0x00000000, // Optional: attempt transparency handling
      });

      // Add frames
      const delay = 1000 / fps;
      frames.forEach((canvas) => {
        gif.addFrame(canvas, { delay: delay, copy: true });
      });

      gif.on('progress', (p: number) => {
        onProgress(p);
      });

      gif.on('finished', (blob: Blob) => {
        URL.revokeObjectURL(workerUrl); // Cleanup
        resolve(blob);
      });

      gif.render();
    } catch (e) {
      reject(e);
    }
  });
};
