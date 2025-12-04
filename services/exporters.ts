
/**
 * Generates a GIF using gif.js
 * Uses Alpha Thresholding ("Hard Cut") to handle GIF's lack of semi-transparency.
 * This prevents the "magenta halo" or "jagged dirty edges" artifact.
 */
export const generateGif = (
  frames: HTMLCanvasElement[],
  fps: number,
  onProgress: (progress: number) => void
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a Blob URL for the worker script
      const workerScript = `importScripts('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');`;
      const workerBlob = new Blob([workerScript], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(workerBlob);

      // Chroma key for transparency (Magenta)
      const TRANSPARENT_KEY = 0xFF00FF; 

      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: frames[0].width,
        height: frames[0].height,
        workerScript: workerUrl,
        transparent: TRANSPARENT_KEY,
        background: '#000000'
      });

      const delay = 1000 / fps;

      frames.forEach((originalFrame) => {
        const canvas = document.createElement('canvas');
        canvas.width = originalFrame.width;
        canvas.height = originalFrame.height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
            // 1. Draw the original frame normally
            ctx.drawImage(originalFrame, 0, 0);
            
            // 2. Post-process pixels to enforce binary transparency
            // GIF only supports 1-bit Alpha (On/Off). 
            // Anti-aliased edges (semi-transparent) usually cause artifacts.
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            for(let i = 0; i < data.length; i += 4) {
                const a = data[i+3];

                // Hard Threshold: If a pixel is less than 50% opaque, make it transparent.
                // Otherwise make it fully opaque.
                if (a < 128) {
                    // Force Transparent Color (Magenta)
                    data[i] = 255;   // R
                    data[i+1] = 0;   // G
                    data[i+2] = 255; // B
                    data[i+3] = 255; // A (Must be opaque for GIF lib to see the color key)
                } else {
                    // Force Full Opacity
                    // This removes the "semi-transparent" math that GIF cannot handle,
                    // preserving the true color of the pixel without blending it against a background.
                    data[i+3] = 255;
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
            gif.addFrame(canvas, { delay: delay, copy: true });
        }
      });

      gif.on('progress', (p: number) => {
        onProgress(p);
      });

      gif.on('finished', (blob: Blob) => {
        URL.revokeObjectURL(workerUrl);
        resolve(blob);
      });

      // Safety timeout
      setTimeout(() => {
          // We don't strictly reject because slow PCs might take longer for huge GIFs,
          // but good to have a bound.
          // reject(new Error("GIF generation timed out.")); 
      }, 60000);

      gif.render();
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Generates an Animated PNG (APNG) using UPNG.js
 * Supports full 8-bit alpha transparency.
 */
export const generateApng = (
  frames: HTMLCanvasElement[],
  fps: number,
  onProgress: (progress: number) => void
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (typeof UPNG === 'undefined') {
      reject(new Error("UPNG library not loaded."));
      return;
    }

    // @ts-ignore
    if (typeof pako === 'undefined' && !window.pako) {
       console.warn("Pako is missing, UPNG might fail.");
    }

    try {
      const buffers: ArrayBuffer[] = [];
      const w = frames[0].width;
      const h = frames[0].height;
      const delay = Math.round(1000 / fps);

      frames.forEach((canvas, idx) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Get raw RGBA data
        const imageData = ctx.getImageData(0, 0, w, h);
        
        // Copy buffer to ensure data integrity
        const data = new Uint8Array(imageData.data);
        const buffer = new ArrayBuffer(data.byteLength);
        new Uint8Array(buffer).set(data);
        
        buffers.push(buffer);
        onProgress((idx + 1) / frames.length);
      });

      const delays = new Array(buffers.length).fill(delay);
      
      setTimeout(() => {
        try {
            // UPNG.encode(imgs, w, h, cnum, dels) -> cnum 0 = lossless
            const apngBuffer = UPNG.encode(buffers, w, h, 0, delays);
            resolve(new Blob([apngBuffer], { type: 'image/png' }));
        } catch (err) {
            console.error("UPNG Encoding Error:", err);
            reject(new Error("Failed to encode APNG."));
        }
      }, 50);
      
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Generates a WebM/MP4 Video with Alpha Channel
 * Prioritizes VP9 codec which supports alpha.
 */
export const generateWebM = (
  frames: HTMLCanvasElement[],
  fps: number,
  onProgress: (progress: number) => void
): Promise<Blob> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (frames.length === 0) {
        reject(new Error("No frames to export"));
        return;
      }
      const w = frames[0].width;
      const h = frames[0].height;
      
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not create canvas context");

      // Check supported MIME types - VP9 is required for Alpha in WebM
      const supportedTypes = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
          'video/mp4'
      ];
      const mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type));

      if (!mimeType) {
        reject(new Error("Video export is not supported in this browser."));
        return;
      }
      
      const stream = canvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, { 
        mimeType: mimeType,
        videoBitsPerSecond: 5000000
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const type = mimeType.split(';')[0];
        const blob = new Blob(chunks, { type: type });
        resolve(blob);
      };

      recorder.start();

      const frameDuration = 1000 / fps;
      
      for (let i = 0; i < frames.length; i++) {
        ctx.clearRect(0, 0, w, h); // Ensure transparent background
        ctx.drawImage(frames[i], 0, 0);
        
        onProgress((i + 1) / frames.length);
        await new Promise(r => setTimeout(r, frameDuration));
      }

      await new Promise(r => setTimeout(r, 100));
      recorder.stop();

    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Generates an Animated WebP with Alpha Support
 */
export const generateWebP = async (
    frames: HTMLCanvasElement[],
    fps: number,
    onProgress: (progress: number) => void
  ): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      try {
        if (frames.length === 0) throw new Error("No frames");
  
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 1; testCanvas.height = 1;
        const testUrl = testCanvas.toDataURL('image/webp');
        if (!testUrl.startsWith('data:image/webp')) {
           reject(new Error("Your browser does not support WebP export."));
           return;
        }
  
        const width = frames[0].width;
        const height = frames[0].height;
        const durationMs = Math.round(1000 / fps);
        
        const chunks: Uint8Array[] = [];
  
        for (let i = 0; i < frames.length; i++) {
           // Get single frame WebP (preserves alpha)
           // Quality 1.0 (lossless-like) preserves alpha channel best
           const frameDataUrl = frames[i].toDataURL('image/webp', 1.0);
           const response = await fetch(frameDataUrl);
           const buffer = await response.arrayBuffer();
           
           const rawData = new Uint8Array(buffer);
           const chunkData = extractWebPFrameData(rawData);
           
           if (!chunkData) {
               console.warn(`Frame ${i} skipped due to parsing error`);
               continue;
           }
           chunks.push(chunkData);
           onProgress((i + 1) / frames.length);
        }
  
        const webpBlob = muxWebP(chunks, width, height, durationMs);
        resolve(webpBlob);
  
      } catch (e) {
        reject(e);
      }
    });
  };
  
  // --- WebP Binary Utilities ---
  
  /**
   * Extracts the essential chunks (ALPH + VP8/VP8L) from a static WebP file.
   * This is crucial for preserving transparency in the animated container.
   */
  function extractWebPFrameData(data: Uint8Array): Uint8Array | null {
      // Header: RIFF (4) + Size (4) + WEBP (4)
      if (data.length < 12) return null;
      
      // Check RIFF header
      if (data[0] !== 82 || data[1] !== 73 || data[2] !== 70 || data[3] !== 70) return null;
      
      const extractedChunks: Uint8Array[] = [];
      let totalLength = 0;
  
      let offset = 12;
      while (offset < data.length) {
          if (offset + 8 > data.length) break;
  
          const chunkId = String.fromCharCode(...data.slice(offset, offset + 4));
          const chunkSize = 
              data[offset + 4] | 
              (data[offset + 5] << 8) | 
              (data[offset + 6] << 16) | 
              (data[offset + 7] << 24);
          
          offset += 8;
  
          // We need ALPH (Alpha transparency) and VP8/VP8L (Image data)
          if (chunkId === 'VP8 ' || chunkId === 'VP8L' || chunkId === 'ALPH') {
              const chunk = new Uint8Array(8 + chunkSize);
              // Copy header
              chunk.set(data.slice(offset - 8, offset), 0);
              // Copy payload
              chunk.set(data.slice(offset, offset + chunkSize), 8);
              
              extractedChunks.push(chunk);
              totalLength += chunk.length;
          }
          
          // Move to next chunk (skip data + padding byte if odd)
          offset += chunkSize + (chunkSize % 2);
      }
  
      if (extractedChunks.length === 0) return null;
  
      // Concatenate all relevant chunks
      const result = new Uint8Array(totalLength);
      let pos = 0;
      for (const c of extractedChunks) {
          result.set(c, pos);
          pos += c.length;
      }
      return result;
  }
  
  function muxWebP(frameChunks: Uint8Array[], width: number, height: number, duration: number): Blob {
      const parts: Uint8Array[] = [];
  
      // 1. VP8X (Extended Header) - Required for Animation & Alpha
      const vp8x = new Uint8Array(18);
      setStr(vp8x, 0, 'VP8X');
      setUInt32(vp8x, 4, 10);
      vp8x[8] = 0x02 | 0x10; // Flags: Animation(bit 1) + Alpha(bit 4)
      setUInt24(vp8x, 12, width - 1);
      setUInt24(vp8x, 15, height - 1);
      parts.push(vp8x);
  
      // 2. ANIM (Global Params)
      const anim = new Uint8Array(14);
      setStr(anim, 0, 'ANIM');
      setUInt32(anim, 4, 6);
      setUInt32(anim, 8, 0); // Background Color: 0 (Transparent)
      setUInt16(anim, 12, 0); // Loop: 0 (Infinite)
      parts.push(anim);
  
      // 3. ANMF (Frames)
      for (const chunk of frameChunks) {
          const headerSize = 16;
          // chunk includes Header(8) + Payload.
          // ANMF size = 16 + Chunk Size
          const totalSize = headerSize + chunk.length;
          const anmf = new Uint8Array(8 + headerSize); 
          
          setStr(anmf, 0, 'ANMF');
          setUInt32(anmf, 4, totalSize);
          
          setUInt24(anmf, 8, 0); // X
          setUInt24(anmf, 11, 0); // Y
          setUInt24(anmf, 14, width - 1);
          setUInt24(anmf, 17, height - 1);
          setUInt24(anmf, 20, duration);
          // Flags: 00000010 = 0x02.
          // Bit 1 (Disposal): 1 (Dispose to background) - Prevents trails
          // Bit 0 (Blending): 0 (Use alpha blending)
          anmf[23] = 0x02; 
          
          parts.push(anmf);
          parts.push(chunk);
          
          // RIFF Padding for odd total size
          if ((totalSize + 8) % 2 !== 0) {
              parts.push(new Uint8Array([0]));
          }
      }
  
      // Final RIFF Header
      let totalFileSize = 4; // 'WEBP'
      parts.forEach(p => totalFileSize += p.length);
  
      const riff = new Uint8Array(12);
      setStr(riff, 0, 'RIFF');
      setUInt32(riff, 4, totalFileSize);
      setStr(riff, 8, 'WEBP');
  
      return new Blob([riff, ...parts], { type: 'image/webp' });
  }
  
  function setStr(arr: Uint8Array, offset: number, str: string) {
      for (let i = 0; i < str.length; i++) arr[offset + i] = str.charCodeAt(i);
  }
  function setUInt16(arr: Uint8Array, offset: number, val: number) {
      arr[offset] = val & 0xFF;
      arr[offset + 1] = (val >> 8) & 0xFF;
  }
  function setUInt24(arr: Uint8Array, offset: number, val: number) {
      arr[offset] = val & 0xFF;
      arr[offset + 1] = (val >> 8) & 0xFF;
      arr[offset + 2] = (val >> 16) & 0xFF;
  }
  function setUInt32(arr: Uint8Array, offset: number, val: number) {
      arr[offset] = val & 0xFF;
      arr[offset + 1] = (val >> 8) & 0xFF;
      arr[offset + 2] = (val >> 16) & 0xFF;
      arr[offset + 3] = (val >> 24) & 0xFF;
  }
