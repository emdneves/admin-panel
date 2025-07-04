import axios from 'axios';

export async function uploadAndProcessImage(
  file: File,
  fieldName: string,
  contentTypeId: string,
  contentTypeName: string,
  contentName: string
): Promise<{ url: string, size: number, type: string }> {
  const maxSize = 2 * 1024 * 1024; // 2MB
  // Load image
  const img = new window.Image();
  img.src = URL.createObjectURL(file);
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  // Create a 500x500 canvas
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Fill with white
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 500, 500);

  // Calculate aspect ratio and draw image centered
  const ratio = Math.min(500 / img.width, 500 / img.height);
  const newWidth = img.width * ratio;
  const newHeight = img.height * ratio;
  const x = (500 - newWidth) / 2;
  const y = (500 - newHeight) / 2;
  ctx.drawImage(img, x, y, newWidth, newHeight);

  // Convert canvas to blob
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (!b) reject(new Error('Failed to create image blob'));
      else resolve(b);
    }, file.type || 'image/jpeg', 0.92);
  });

  if (blob.size > maxSize) {
    throw new Error('Image exceeds 2MB size limit after resizing.');
  }

  // Build new file name: contentTypeName_contentName.ext
  const ext = file.name.split('.').pop() || 'jpg';
  const safeType = contentTypeName.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeName = contentName.replace(/[^a-zA-Z0-9_-]/g, '');
  const newFileName = `${safeType}_${safeName}.${ext}`;
  // Upload the new square image
  const formData = new FormData();
  formData.append(fieldName, new File([blob], newFileName, { type: blob.type }));

  const response = await axios.post(
    `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/upload?content_type_id=${contentTypeId}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  const urls = response.data.urls;
  const urlObj = Array.isArray(urls) ? urls.find((u: any) => u.field === fieldName) : null;
  if (!urlObj) {
    throw new Error('Upload succeeded but no URL returned.');
  }
  return { url: urlObj.url, size: blob.size, type: blob.type };
} 