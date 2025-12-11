// 1. IMPORT (Chỉ giữ lại một phiên bản đúng)
// Lưu ý: Nếu shop.js nằm trong thư mục con (ví dụ: cua-hang/shop.js) thì dùng ../
// Nếu shop.js nằm ở thư mục gốc (cùng với index.html) thì dùng ./

import { db, ref, get, update } from "../firebase-config.js";
import { applyTheme } from "../theme-manager.js";
import { SOUNDS } from "../sound-manager.js";

const currentUser = localStorage.getItem("currentUser");
// Biến toàn cục để lưu bài nhạc đang phát
let currentAudio = null;
let currentButton = null;
// 2. KHAI BÁO DANH SÁCH GIAO DIỆN (THEMES)
const THEMES = [
  {
    id: "theme-default",
    name: "Mặc Định - Light Mode",
    price: 0,
    class: "bg-light",
    image: "light.png", // Đảm bảo đường dẫn ảnh đúng
  },
  {
    id: "theme-tet",
    name: "Tết Nguyên Đán",
    price: 500,
    class: "demo",
    image: "tet.png",
  },
  {
    id: "theme-summer",
    name: "Ocean Dream",
    price: 100,
    class: "bg-warning text-dark",
    image: "bien.png",
  },
  {
    id: "theme-autumn-beta",
    name: "Autumn Day - Coming Soon",
    price: 200,
    class: "bg-secondary text-white",
    image: "../assets/images/theme-autumn.png",
  },
  {
    id: "theme-xmas-beta",
    name: "Christmas World - Coming Soon",
    price: 250,
    class: "bg-success text-white",
    image: "../assets/images/theme-xmas.png",
    alt: "Đang Cập Nhật",
  },
  {
    id: "theme-dark-beta", // Sửa id theme-darl thành theme-dark cho chuẩn
    name: "Dark Mode - Coming Soon",
    price: 50,
    class: "bg-dark text-white",
    image: "../assets/images/theme-dark.png",
    alt: "Đang Cập Nhật",
  },
];

// 3. HÀM KHỞI TẠO DỮ LIỆU
async function initUserData() {
  if (!currentUser) return;
  const userRef = ref(db, "users/" + currentUser);

  get(userRef).then((snapshot) => {
    const data = snapshot.val();

    // Nếu chưa có kho đồ, tạo mặc định
    if (!data.inventory) {
      update(userRef, {
        coin: 1000,
        inventory: {
          "theme-default": true,
          "sound-beep": true,
        },
        settings: {
          theme: "theme-default",
          sound: "sound-beep",
        },
      }).then(() => {
        loadShopUI();
      });
    } else {
      loadShopUI();
    }
  });
}

// 4. HÀM HIỂN THỊ GIAO DIỆN
function loadShopUI() {
  const userRef = ref(db, "users/" + currentUser);

  get(userRef).then((snapshot) => {
    const userData = snapshot.val();
    const inventory = userData.inventory || {};
    const currentSettings = userData.settings || {};

    // Hiển thị số xu
    if (document.getElementById("user-coin")) {
      document.getElementById("user-coin").innerText = userData.coin || 0;
    }

    // A. Render Themes
    const themeHTML = THEMES.map((item) => {
      const isOwned = inventory[item.id];
      const isEquipped = currentSettings.theme === item.id;

      let btnAction = "";
      if (isEquipped) {
        btnAction = `<button class="btn btn-secondary text-dark w-100" disabled><b>Đang dùng</b></button>`;
      } else if (isOwned) {
        btnAction = `<button class="btn btn-primary w-100 btn-equip-theme" data-id="${item.id}">Áp dụng</button>`;
      } else {
        btnAction = `<button class="btn btn-outline-danger w-100 btn-buy-theme" data-id="${item.id}" data-price="${item.price}">Mua (${item.price} xu)</button>`;
      }

      return `
        <div class="col-12 col-md-6 col-lg-4 mb-4">
            <div class="card h-100">
                <img src="${item.image}" class="card-img-top theme-preview-img" alt="${item.name}" onerror="this.src='https://via.placeholder.com/300x150?text=No+Image'">
                
                <div class="card-body text-center p-2">
                    <h5 class="card-title mb-0">${item.name}</h5>
                </div>
                
                <div class="card-footer bg-transparent border-top-0">
                    ${btnAction} 
                </div>
            </div>
        </div>`;
    }).join("");

    const themeListEl = document.getElementById("theme-list");
    if (themeListEl) themeListEl.innerHTML = themeHTML;
    // B. Render Sounds
    const soundHTML = SOUNDS.map((item) => {
      const isOwned = inventory[item.id];
      const isEquipped = currentSettings.sound === item.id;

      let btnAction = "";

      if (isEquipped) {
        btnAction = `<button class="btn btn-secondary w-100" disabled>Đang dùng</button>`;
      } else if (isOwned) {
        btnAction = `<button class="btn btn-primary w-100 btn-equip-sound" data-id="${item.id}">Dùng</button>`;
      } else {
        btnAction = `<button class="btn btn-outline-danger w-100 btn-buy-sound" data-id="${item.id}" data-price="${item.price}">Mua (${item.price} xu)</button>`;
      }

      return `
        <div class="col-12 col-md-6 col-lg-4 mb-4">
            <div class="card h-100">
                <div class="card-body text-center p-4">
                    <div class="mb-3" style="font-size: 3rem;">💿</div>
                    
                    <h5 class="card-title mb-3">${item.name}</h5>
                    
                    <button class="btn btn-sm btn-light rounded-pill px-3" onclick="window.previewSound('${item.file}', this)">
                        <i class="fas fa-play"></i> Nghe thử
                    </button> 
                </div>
                
                <div class="card-footer bg-transparent border-top-0 pb-4 px-4">
                    ${btnAction}
                </div>
            </div>
        </div>`;
    }).join("");
    const soundListEl = document.getElementById("sound-list");
    if (soundListEl) soundListEl.innerHTML = soundHTML;

    // Gắn sự kiện click
    addEventListeners();
  });
}

// 5. XỬ LÝ SỰ KIỆN CLICK
function addEventListeners() {
  // Theme
  document.querySelectorAll(".btn-buy-theme").forEach((btn) => {
    btn.addEventListener("click", () =>
      buyItem(btn.dataset.id, parseInt(btn.dataset.price), "theme")
    );
  });
  document.querySelectorAll(".btn-equip-theme").forEach((btn) => {
    btn.addEventListener("click", () => equipItem(btn.dataset.id, "theme"));
  });

  // Sound
  document.querySelectorAll(".btn-buy-sound").forEach((btn) => {
    btn.addEventListener("click", () =>
      buyItem(btn.dataset.id, parseInt(btn.dataset.price), "sound")
    );
  });
  document.querySelectorAll(".btn-equip-sound").forEach((btn) => {
    btn.addEventListener("click", () => equipItem(btn.dataset.id, "sound"));
  });
}

function buyItem(itemId, price, type) {
  const userRef = ref(db, "users/" + currentUser);
  get(userRef).then((snapshot) => {
    const userData = snapshot.val();
    const currentCoin = userData.coin || 0;

    if (currentCoin >= price) {
      if (confirm(`Bạn muốn mua với giá ${price} xu?`)) {
        const updates = {};
        updates["/coin"] = currentCoin - price;
        updates["/inventory/" + itemId] = true;

        update(userRef, updates).then(() => {
          alert("Mua thành công!");
          loadShopUI();
        });
      }
    } else {
      alert("Bạn không đủ xu! Hãy truy cập trang Liên hệ để nạp thêm.");
    }
  });
}

function equipItem(itemId, type) {
  const userRef = ref(db, "users/" + currentUser);
  const updates = {};
  updates["/settings/" + type] = itemId;

  update(userRef, updates).then(() => {
    // Cập nhật localStorage để dùng ngay lập tức
    if (type === "theme") {
      localStorage.setItem("currentTheme", itemId);
      applyTheme(itemId); // Đổi màu
    }
    if (type === "sound") {
      localStorage.setItem("currentSound", itemId);
    }

    loadShopUI();
  });
}

// Hàm nghe thử nhạc
window.previewSound = function (soundFile, btn) {
  if (!soundFile) return;

  // Xử lý đường dẫn
  let path = soundFile;
  if (!path.startsWith("http") && !path.startsWith("../")) {
    path = "../" + path;
  }

  // TRƯỜNG HỢP 1: Đang phát bài này -> Bấm để DỪNG
  if (
    currentAudio &&
    currentAudio.src.includes(path.replace("..", "")) &&
    !currentAudio.paused
  ) {
    currentAudio.pause();
    currentAudio.currentTime = 0; // Tua về đầu
    btn.innerHTML = '<i class="fas fa-play"></i> Nghe thử';
    currentAudio = null;
    return;
  }

  // TRƯỜNG HỢP 2: Đang phát bài khác -> DỪNG bài cũ trước
  if (currentAudio) {
    currentAudio.pause();
    if (currentButton) {
      currentButton.innerHTML = '<i class="fas fa-play"></i> Nghe thử'; // Reset nút cũ
    }
  }

  // TRƯỜNG HỢP 3: Bắt đầu phát bài mới
  const audio = new Audio(path);
  currentAudio = audio;
  currentButton = btn;

  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Tải...'; // Hiệu ứng loading

  audio
    .play()
    .then(() => {
      btn.innerHTML = '<i class="fas fa-pause"></i> Dừng'; // Đổi sang icon Pause
    })
    .catch((error) => {
      console.error("Lỗi phát nhạc:", error);
      btn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Lỗi';
    });

  // Khi nhạc hết -> Tự động đổi lại icon Play
  audio.onended = function () {
    btn.innerHTML = '<i class="fas fa-play"></i> Nghe thử';
    currentAudio = null;
  };
};

// Chạy chương trình
initUserData();
