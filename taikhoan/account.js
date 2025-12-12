// 1. NHẬP CÔNG CỤ TỪ FILE CẤU HÌNH
import { db, ref, get, update } from "../firebase-config.js";

// 2. KHỞI TẠO & KIỂM TRA ĐĂNG NHẬP
const currentUser = localStorage.getItem("currentUser");
if (!currentUser) {
  alert("Vui lòng đăng nhập!");
  window.location.href = "login.html";
}

const userRef = ref(db, "users/" + currentUser);

// 3. HÀM HIỂN THỊ THÔNG TIN (BIO + CHI TIẾT)
function renderBio(info) {
  const bioBox = document.getElementById("display-bio");

  // Kiểm tra xem thẻ có tồn tại không để tránh lỗi null
  if (!bioBox) return;

  // Nếu chưa có thông tin gì
  if (
    !info ||
    (!info.fullname && !info.phone && !info.email && !info.address && !info.bio)
  ) {
    bioBox.innerHTML =
      "<em class='text-muted'>Chưa cập nhật thông tin cá nhân.</em>";
    bioBox.className = "mt-3 text-center small";
    return;
  }

  // Hiển thị thông tin (Bio căn giữa, còn lại căn trái)
  bioBox.className = "mt-3 text-start bg-light p-3 rounded small";
  bioBox.innerHTML = `
        <div class="text-center mb-3">
            <p class="mb-0 fst-italic text-primary">
                <strong>❝ ${info.bio || "..."} ❞</strong>
            </p>
        </div>

        <hr class="my-2">

        <p class="mb-1"><strong>Họ tên:</strong> ${info.fullname || "..."}</p>
        <p class="mb-1"><strong>SĐT:</strong> ${info.phone || "..."}</p>
        <p class="mb-1"><strong>Email:</strong> ${info.email || "..."}</p>
        <p class="mb-0"><strong>Địa chỉ:</strong> ${info.address || "..."}</p>
    `;
}

// 4. HÀM TẢI DỮ LIỆU TỪ FIREBASE
function loadProfile() {
  get(userRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const info = data.info || {};

        // Điền dữ liệu cơ bản
        document.getElementById("display-username").innerText =
          data.username || currentUser;
        document.getElementById("display-coin").innerText = data.coin || 0;

        // Điền vào Form nhập liệu
        document.getElementById("inp-fullname").value = info.fullname || "";
        document.getElementById("inp-phone").value = info.phone || "";
        document.getElementById("inp-email").value = info.email || "";
        document.getElementById("inp-address").value = info.address || "";
        document.getElementById("inp-bio").value = info.bio || ""; // Điền Bio vào ô nhập

        // Hiển thị Avatar
        if (info.avatar) {
          document.getElementById("user-avatar").src = info.avatar;
        }

        // Hiển thị Bio và Thông tin ra cột trái
        renderBio(info);
      }
    })
    .catch((error) => {
      console.error("Lỗi tải dữ liệu:", error);
    });
}

// 5. HÀM LƯU THÔNG TIN (Khi bấm nút Lưu)
document.getElementById("profile-form").addEventListener("submit", (e) => {
  e.preventDefault();

  // Lấy dữ liệu mới từ form
  const newInfo = {
    fullname: document.getElementById("inp-fullname").value,
    phone: document.getElementById("inp-phone").value,
    email: document.getElementById("inp-email").value,
    address: document.getElementById("inp-address").value,
    bio: document.getElementById("inp-bio").value,
  };

  // Chuẩn bị dữ liệu để update lên Firebase
  const updates = {};
  updates["/info/fullname"] = newInfo.fullname;
  updates["/info/phone"] = newInfo.phone;
  updates["/info/email"] = newInfo.email;
  updates["/info/address"] = newInfo.address;
  updates["/info/bio"] = newInfo.bio;

  update(userRef, updates)
    .then(() => {
      // Cập nhật giao diện ngay lập tức (không cần F5)
      renderBio(newInfo);
    })
    .catch((err) => {
      alert("Lỗi: " + err);
    });
});

// 6. HÀM UPLOAD ẢNH ĐẠI DIỆN
document.getElementById("file-input").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 100 * 1024) {
    // Giới hạn 100KB
    alert("⚠️ Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 100KB.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    const base64String = event.target.result;

    // Hiển thị ngay
    document.getElementById("user-avatar").src = base64String;

    // Lưu lên Firebase
    update(userRef, { "/info/avatar": base64String }).catch((err) =>
      alert("Lỗi tải ảnh: " + err)
    );
  };
  reader.readAsDataURL(file);
});

// --- CHẠY HÀM TẢI DỮ LIỆU KHI MỞ TRANG ---
loadProfile();
