// ─── БҮХ ТОХИРГООГ ЭНД ЗАСНА ─────────────────────────────────────

export const ADMIN_EMAIL = "admin@movie.mn";

// Cloudinary (cloudinary.com дээр үнэгүй бүртгүүлнэ)
export const CLOUDINARY_CLOUD_NAME = "YOUR_CLOUD_NAME";
export const CLOUDINARY_UPLOAD_PRESET = "YOUR_UPLOAD_PRESET";

// Subscription дансны мэдээлэл
export const BANK_INFO = {
  bank: "Хаан Банк",        // ← өөрийн банк
  account: "5586016813",    // ← өөрийн данс
  name: "э.энхтөр",        // ← өөрийн нэр
  price: "500",           // ← үнэ
  currency: "₮",
  days: 30,                 // ← хэдэн хоног идэвхтэй байх
};

// Google Fonts
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap";
document.head.appendChild(link);
