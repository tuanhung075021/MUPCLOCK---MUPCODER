import { db, ref, get, child } from "./firebase-config.js";

// Hàm áp dụng theme ngay lập tức
function applyTheme(themeName) {
  // 1. Xóa hết các class theme cũ trên body
  document.body.classList.remove(
    "theme-default",
    "theme-tet",
    "theme-summer",
    "theme-autumn",
    "theme-xmas"
  );

  // 2. Thêm class theme mới
  if (themeName) {
    document.body.classList.add(themeName);
  }
}

// Hàm tải theme từ Firebase về
function loadUserTheme() {
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) return;

  // Ưu tiên 1: Lấy từ localStorage cho nhanh (đỡ phải đợi mạng)
  const localTheme = localStorage.getItem("currentTheme");
  if (localTheme) {
    applyTheme(localTheme);
  }

  // Ưu tiên 2: Lấy từ Firebase để đồng bộ (chính xác nhất)
  const dbRef = ref(db);
  get(child(dbRef, `users/${currentUser}/settings/theme`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const serverTheme = snapshot.val();
        // Lưu lại vào localStorage để lần sau vào nhanh hơn
        localStorage.setItem("currentTheme", serverTheme);
        applyTheme(serverTheme);
      }
    })
    .catch((error) => {
      console.error("Lỗi tải theme:", error);
    });
}

// Tự động chạy khi file được nhúng
loadUserTheme();

// Xuất hàm để các file khác dùng (Ví dụ shop.js dùng để đổi màu ngay khi bấm nút)
export { applyTheme };
