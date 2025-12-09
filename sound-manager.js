// FILE: sound-manager.js

// 1. DANH SÁCH NHẠC (Đường dẫn gốc: sound/...)
export const SOUNDS = [
  { id: "sound-beep", name: "Beep Beep", price: 0, file: "sound/beep.mp3" },
  {
    id: "sound-firework",
    name: "Pháo Hoa",
    price: 100,
    file: "sound/firework.mp3",
  },
  { id: "sound-sea", name: "Sóng Biển", price: 50, file: "sound/sea.mp3" },
  { id: "sound-rain", name: "Tiếng Mưa", price: 50, file: "sound/rain.mp3" },
  {
    id: "sound-jingle",
    name: "Chuông Tuyết",
    price: 100,
    file: "sound/jingle.mp3",
  },
];

// 2. HÀM PHÁT NHẠC
export function playAlarm() {
  const currentSoundId = localStorage.getItem("currentSound") || "sound-beep";
  const soundItem = SOUNDS.find((item) => item.id === currentSoundId);

  if (soundItem) {
    let soundPath = soundItem.file;

    // --- FIX LỖI ĐƯỜNG DẪN THÔNG MINH ---

    // 1. Giải mã URL để biến %20 thành khoảng trắng, %C3... thành chữ có dấu
    const rawPath = window.location.pathname;
    const decodedPath = decodeURIComponent(rawPath).toLowerCase(); // Chuyển về chữ thường để so sánh

    // 2. Kiểm tra cấp độ thư mục
    // Nếu file hiện tại nằm trong thư mục con cấp 2 (ví dụ: công cụ/dem-khoa/)
    if (decodedPath.includes("/dem-khoa/")) {
      soundPath = "../../" + soundPath; // Lùi 2 cấp
    }
    // Nếu file hiện tại nằm trong thư mục con cấp 1 (công cụ, tài khoản...)
    else if (
      decodedPath.includes("/cong-cu/") ||
      decodedPath.includes("/công cụ/") || // Bắt được tên có dấu
      decodedPath.includes("/tai-khoan/") ||
      decodedPath.includes("/tài khoản/") ||
      decodedPath.includes("/cua-hang/") ||
      decodedPath.includes("/cửa hàng/")
    ) {
      soundPath = "../" + soundPath; // Lùi 1 cấp
    }

    console.log("Đã xử lý đường dẫn nhạc: " + soundPath);

    const audio = new Audio(soundPath);

    audio.play().catch((err) => {
      console.error("Lỗi phát nhạc:", err);
    });

    return audio;
  }
}
