// Your profile photo: picked on the phone, cut to a small square and kept as text in your
// account (users/{uid}/profile/me), so no file storage is needed. About 10 KB.

export const PHOTO_PX = 192;

// The biggest centred square in a w × h picture.
export function centreSquare(w, h) {
  const size = Math.min(w, h);
  return { x: (w - size) / 2, y: (h - size) / 2, size };
}

// A picked image file -> "data:image/jpeg;base64,...". Fails if the phone can't open it.
export function shrinkPhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { x, y, size } = centreSquare(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = PHOTO_PX; canvas.height = PHOTO_PX;
      canvas.getContext('2d').drawImage(img, x, y, size, size, 0, 0, PHOTO_PX, PHOTO_PX);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Couldn’t open that photo')); };
    img.src = url;
  });
}
