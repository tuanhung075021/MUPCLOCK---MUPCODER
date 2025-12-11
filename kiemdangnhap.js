// File: kiemdangnhap.js

const TIMEOUT_LIMIT = 60 * 60 * 1000;

// --- HÀM TỰ TÍNH ĐƯỜNG DẪN LOGIN ---
function getLoginPath() {
  // 1. Lấy đường dẫn hiện tại
  const path = window.location.pathname;

  // 2. Kiểm tra nếu đang ở trong các thư mục con (ví dụ: cong-cu, tai-khoan...)
  // Lưu ý: Nếu bạn có nhiều thư mục con cấp 1, hãy liệt kê vào đây
  if (
    path.includes("/congcu/") ||
    path.includes("/cuahang/") ||
    path.includes("/taikhoan/") ||
    path.includes("/lienhe/")
  ) {
    // Nếu ở trong con, phải lùi ra 1 cấp (..) rồi mới vào dang-nhap
    return "../dangnhap/login.html";
  }

  // 3. Nếu đang ở thư mục gốc (index.html)
  return "dangnhap/login.html";
}

// 1. Hàm kiểm tra đăng nhập
function checkAuth() {
  const user = localStorage.getItem("currentUser");
  if (!user) {
    alert("Vui lòng đăng nhập để truy cập!");
    // SỬA Ở ĐÂY: Gọi hàm lấy đường dẫn đúng
    window.location.href = getLoginPath();
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
    // SỬA Ở ĐÂY
    window.location.href = getLoginPath();
  }
}

// 4. Hàm Đăng xuất
function logout() {
  if (confirm("Bạn chắc chắn muốn đăng xuất?")) {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("lastActive");

    // Khi đăng xuất thì về trang chủ (index.html ở thư mục gốc)
    const path = window.location.pathname;
    if (
      path.includes("/congcu/") ||
      path.includes("/dangnhap/") ||
      path.includes("/cuahang/") ||
      path.includes("/taikhoan/") ||
      path.includes("/lienhe/")
    ) {
      window.location.href = "../index.html";
    } else {
      window.location.href = "index.html";
    }
  }
}

// --- TỰ ĐỘNG CHẠY ---
const currentPage = window.location.pathname;

// Logic chặn: Chỉ chạy kiểm tra nếu KHÔNG PHẢI là trang login và KHÔNG PHẢI trang chủ (nếu muốn cho khách xem trang chủ)
// Lưu ý: Đã đổi tên thư mục thành 'dang-nhap'
if (
  !currentPage.includes("dangnhap/login.html") &&
  !currentPage.endsWith("index.html") &&
  !currentPage.endsWith("/")
) {
  if (checkAuth()) {
    updateActivity();
    document.onmousemove = updateActivity;
    document.onkeypress = updateActivity;
    document.onclick = updateActivity;
    setInterval(checkIdle, 1000);
    window.logout = logout;
  }
}
