import { supabase } from '../lib/supabase';

const MAX_WIDTH = 1920;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Compress an image file to a maximum width/height using canvas
 */
export async function compressImage(file, maxWidth = MAX_WIDTH, maxHeight = MAX_WIDTH) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Image compression failed'));
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image to Supabase Storage
 * Returns the public URL and metadata
 */
export async function uploadImage(file, userId) {
  const blob = await compressImage(file);
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bucket = 'images';

  // Create bucket if it doesn't exist
  const { data: buckets } = await supabase.storage.getBucket(bucket);
  if (!buckets) {
    const { error: createError } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
    });
    if (createError) throw createError;
  }

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, blob);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

  return {
    url: urlData.publicUrl,
    storagePath: uploadData.path,
    width: MAX_WIDTH, // approximate after compression
    height: MAX_WIDTH,
    mimeType: 'image/jpeg',
  };
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(storagePath) {
  const { error } = await supabase.storage.from('images').remove([storagePath]);
  return !error;
}
