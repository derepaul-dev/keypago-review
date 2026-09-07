/**
 * Utility functions to compress and downscale images in the browser
 * to keep Firestore document sizes well below the 1MB limit.
 */

/**
 * Compresses an image data URL (base64) to a JPEG of specified dimensions and quality.
 */
export function compressImageDataUrl(
  dataUrl: string,
  maxWidth?: number,
  maxHeight?: number,
  quality: number = 0.6
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's already tiny or not an image data url, skip
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Adjust dimensions if bounds are provided
      if (maxWidth || maxHeight) {
        if (maxWidth && width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (maxHeight && height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      // Draw to a canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl); // Fallback
        return;
      }

      // Fill background white in case of transparent png to avoid black background in jpeg
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw the image
      ctx.drawImage(img, 0, 0, width, height);

      try {
        // Export to quality compressed JPEG
        const compressed = canvas.toDataURL('image/jpeg', quality);
        
        // Return whichever is smaller to be completely efficient
        if (compressed.length < dataUrl.length) {
          resolve(compressed);
        } else {
          resolve(dataUrl);
        }
      } catch (err) {
        console.error('Error during canvas compression:', err);
        resolve(dataUrl);
      }
    };
    img.onerror = (err) => {
      reject(err);
    };
  });
}

/**
 * Reads a File and returns a compressed JPEG data URL.
 */
export function compressImageFile(
  file: File,
  maxWidth?: number,
  maxHeight?: number,
  quality: number = 0.6
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error('No file contents read'));
        return;
      }
      const originalDataUrl = e.target.result as string;
      compressImageDataUrl(originalDataUrl, maxWidth, maxHeight, quality)
        .then(resolve)
        .catch(reject);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
