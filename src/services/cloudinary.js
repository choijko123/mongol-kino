import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "../config/constants";

// Cloudinary руу файл upload хийх
export async function uploadToCloudinary(file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const type = file.type.startsWith("video") ? "video" : "image";
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${type}/upload`
    );
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      const res = JSON.parse(xhr.responseText);
      if (xhr.status === 200) resolve(res.secure_url);
      else reject(new Error(res.error?.message || "Upload амжилтгүй боллоо"));
    };
    xhr.onerror = () => reject(new Error("Сүлжээний алдаа гарлаа"));
    xhr.send(formData);
  });
}
