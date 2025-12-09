// File này chuyên dùng để bảo vệ các trang nội bộ (App, Shop, Account...)

const TIMEOUT_LIMIT = 60 * 60 * 1000;

// 1. Hàm kiểm tra đăng nhập (Chưa đăng nhập thì đuổi ra)
function checkAuth() {
  const user = localStorage.getItem("currentUser");
  if (!user) {
    alert("Vui lòng đăng nhập để truy cập!");
    window.location.href = "login.html";
    return false;
  }
  return true;
}

// 2. Hàm cập nhật thời gian hoạt động
function updateActivity() {
  localStorage.setItem("lastActive", Date.now());
}

// 3. Hàm kiểm tra "treo máy" (Idle)
function checkIdle() {
  const lastActive = localStorage.getItem("lastActive");
  const now = Date.now();

  if (now - lastActive > TIMEOUT_LIMIT) {
    alert("Phiên làm việc hết hạn! Vui lòng đăng nhập lại.");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("lastActive");
    window.location.href = "login.html";
  }
}

// 4. Hàm Đăng xuất (Dùng chung cho mọi trang)
function logout() {
  if (confirm("Bạn chắc chắn muốn đăng xuất?")) {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("lastActive");
    window.location.href = "index.html";
  }
}

// --- TỰ ĐỘNG CHẠY CÁC LỆNH BẢO VỆ ---

// Chỉ chạy nếu đang KHÔNG ở trang login hoặc index (đề phòng nhúng nhầm)
const currentPage = window.location.pathname;
if (
  !currentPage.includes("đăng nhập/login.html") &&
  !currentPage.includes("index.html")
) {
  // Kiểm tra vé vào cửa ngay lập tức
  if (checkAuth()) {
    // Nếu hợp lệ, cập nhật giờ hoạt động
    updateActivity();

    // Đặt camera giám sát hành động
    document.onmousemove = updateActivity;
    document.onkeypress = updateActivity;
    document.onclick = updateActivity;

    // Bật đồng hồ đếm ngược
    setInterval(checkIdle, 1000);

    // Gán hàm logout vào window để các nút HTML gọi được
    window.logout = logout;
  }
}
