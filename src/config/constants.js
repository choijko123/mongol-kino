// ─── БҮХ ТОХИРГООГ ЭНД ЗАСНА ─────────────────────────────────────

export const ADMIN_EMAIL = "admin@movie.mn";

// Cloudinary (cloudinary.com дээр үнэгүй бүртгүүлнэ)
export const CLOUDINARY_CLOUD_NAME = "dfoisc49h";
export const CLOUDINARY_UPLOAD_PRESET = "padzzmf3";

// ── Subscription дансны мэдээлэл ──
export const BANK_INFO = {
  bank:     "Хаан Банк",     // ← өөрийн банк
  account:  "5586016813",    // ← өөрийн данс
  name:     "C.энхтөр",     // ← өөрийн нэр
  currency: "₮",
};

// ── Үнийн сонголтууд ──────────────────────────────────────────────
// id нь Firestore subscriptions.plan талбарт хадгалагдана
export const PLANS = [
  {
    id:       "weekly",
    label:    "7 хоног",
    days:     7,
    price:    "900",
    badge:    null,
    features: ["Бүх кино үзэх", "HD чанар", "Дурын төхөөрөмж"],
    accent:   "#7c3aed",
  },
  {
    id:       "monthly",
    label:    "1 сар",
    days:     30,
    price:    "4500",
    badge:    "Хамгийн алдартай",
    features: ["Бүх кино үзэх", "HD чанар", "Дурын төхөөрөмж", "Шинэ кино шууд"],
    accent:   "#00e5ff",
  },
  {
    id:       "yearly",
    label:    "1 жил",
    days:     365,
    price:    "15000,900",
    badge:    "Хэмнэлттэй",
    features: ["Бүх кино үзэх", "4K чанар", "Дурын төхөөрөмж", "Шинэ кино шууд", "Зар байхгүй"],
    accent:   "#f59e0b",
  },
];

// Google Fonts
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap";
document.head.appendChild(link);