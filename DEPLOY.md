# КиноТайм — Vercel дээр байршуулах заавар

## 1-р алхам: Firebase тохиргоо (5 минут)

### 1.1 Firebase Project үүсгэх
1. https://console.firebase.google.com руу орно
2. **"Create a project"** дарна → нэр өгнө (жишээ: `kinotime-app`)
3. Google Analytics-ийг унтраагаад **Create project** дарна

### 1.2 Authentication идэвхжүүлэх
1. Зүүн цэснээс **Authentication** → **Get started**
2. **Email/Password** → Enable → Save

### 1.3 Firestore Database үүсгэх
1. Зүүн цэснээс **Firestore Database** → **Create database**
2. **Start in test mode** сонгоно (турших горим)
3. Location: **asia-east1** (Ойрхи) → Enable

### 1.4 Web App нэмэх
1. Project Overview → **</>** (Web) товч дарна
2. App nickname: `kinotime-web` → **Register app**
3. Гарч ирсэн `firebaseConfig` объектыг **хуулж авна**

### 1.5 Config оруулах
`src/firebase.js` файлыг нээж, `YOUR_API_KEY` гэх мэт хэсгүүдийг
таны хуулсан утгуудаар солино:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",         // ← энд оруулна
  authDomain: "kinotime-app.firebaseapp.com",
  projectId: "kinotime-app",
  storageBucket: "kinotime-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

### 1.6 Админ бүртгэл үүсгэх
Firebase Console → Authentication → Users → **Add user**
- Email: `admin@movie.mn`
- Password: (хүссэн нууц үгээ)



## 2-р алхам: GitHub-д оруулах

```bash
# Node.js суулгасан байх ёстой: https://nodejs.org

cd kinotime
git init
git add .
git commit -m "init"

# GitHub.com дээр шинэ repo үүсгэж URL авна
git remote add origin https://github.com/ТАНЫ_НЭР/kinotime.git
git push -u origin main
```



## 3-р алхам: Vercel дээр deploy хийх

1. https://vercel.com → **Sign up** (GitHub-аар нэвтэрнэ)
2. **"New Project"** → GitHub repo сонгоно
3. Framework: **Create React App** автоматаар тодорхойлогдоно
4. **Deploy** дарна
5. 2-3 минутын дараа URL авна: `https://kinotime-xxx.vercel.app`



## Дууссан! 🎉

Одоо:
- Хэн ч бүртгүүлж нэвтрэх боломжтой
- Админ кино нэмэхэд бүх утсан дээр **шууд** харагдана
- Vercel-ийн үнэгүй tier дээр жилд 100GB bandwidth

---

## Firebase Storage идэвхжүүлэх (видео upload-д шаардлагатай)

1. Firebase Console → **Storage** → **Get started**
2. **Start in test mode** → Next → Done
3. **Rules** tab руу орж дараах дүрмийг оруулна:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.email == "admin@movie.mn";
    }
  }
}
```

4. **Publish** дарна

Одоо админ MP4 видео болон постер зураг шууд Firebase-д upload хийж чадна!
