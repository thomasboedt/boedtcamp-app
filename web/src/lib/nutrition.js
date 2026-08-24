export function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr, delta) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dateLabel(dateStr) {
  const today = todayLocal();
  if (dateStr === today) return "Vandaag";
  if (dateStr === addDays(today, -1)) return "Gisteren";
  if (dateStr === addDays(today, 1)) return "Morgen";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" });
}

// Scale per-100g nutrition values to a given weight in grams.
export function scalePer100g(product, grams) {
  const factor = grams / 100;
  return {
    kcal: Math.round((product.kcalPer100g || 0) * factor),
    eiwit: Math.round((product.eiwitPer100g || 0) * factor * 10) / 10,
    koolhydraten: Math.round((product.koolhydratenPer100g || 0) * factor * 10) / 10,
    vet: Math.round((product.vetPer100g || 0) * factor * 10) / 10,
  };
}

// Downscale + compress a File/Blob image to a base64 JPEG string, keeping
// photo-log uploads small (Netlify Functions have a payload ceiling).
export function fileToCompressedBase64(file, maxDim = 1024, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl.split(",")[1]);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
