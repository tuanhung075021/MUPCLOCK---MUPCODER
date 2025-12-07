// FILE: index.js

// 1. Lấy thông tin người dùng từ localStorage
const currentUser = localStorage.getItem("currentUser");

// 2. Lấy các vị trí cần thay đổi giao diện
// Lấy khung chứa nút trên Menu (Navbar)
const navContainer = document.getElementById("nav-btn-container");
// Lấy khung chứa nút to ở giữa màn hình
const heroBtnContainer = document.getElementById("hero-btn-container");

// 3. Kiểm tra: Nếu đã đăng nhập
if (currentUser) {
  console.log("Đã đăng nhập là: " + currentUser);

  // A. Thay đổi nút trên thanh Menu (Góc phải trên cùng)
  if (navContainer) {
    navContainer.innerHTML = `
            <span class="text-white me-3 align-self-center">Xin chào, ${currentUser}</span>
            <button id="btn-logout" class="btn btn-outline-light fw-bold">Đăng Xuất</button>
        `;
  }

  // B. Thay đổi nút to ở giữa màn hình (Từ Vàng -> Xanh)
  if (heroBtnContainer) {
    heroBtnContainer.innerHTML = `
            <a href="công cụ/app.html" class="btn btn-success btn-lg px-5 py-3 fw-bold">VÀO APP NGAY</a>
        `;
  }

  // C. Gắn sự kiện cho nút Đăng xuất (Vì nút này được tạo ra bằng JS nên phải gắn sự kiện sau)
  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      if (confirm("Bạn muốn đăng xuất?")) {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("lastActive");
        location.reload(); // Tải lại trang để quay về giao diện khách
      }
    });
  }
} else {
  console.log("Chưa đăng nhập (Khách)");
  // Không cần làm gì cả vì mặc định HTML đã hiển thị nút Đăng nhập rồi
}
