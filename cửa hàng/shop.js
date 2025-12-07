// 1. Thêm import ở đầu file
import { applyTheme } from "../theme-manager.js";
import { db, ref, set, get, child, update } from "../firebase-config.js";

const currentUser = localStorage.getItem("currentUser");

// 1. KHAI BÁO DANH SÁCH SẢN PHẨM (DATABASE ẢO)
const THEMES = [
  {
    id: "theme-default",
    name: "Mặc Định - Light Mode",
    price: 0,
    class: "bg-light",
    image: "light.png",
  },
  {
    id: "theme-tet",
    name: "Tết Nguyên Đán",
    price: 500,
    class: "demo",
    image: "eye.png",
  }, // Màu đỏ chữ vàng
  {
    id: "theme-summer",
    name: "Ocean Dream",
    price: 100,
    class: "bg-warning text-dark",
    image: "bien.png",
  },
  {
    id: "theme-autumn",
    name: "Autumn Day",
    price: 200,
    class: "bg-secondary text-white",
  },
  {
    id: "theme-xmas",
    name: "Christmas Around the World",
    price: 250,
    class: "bg-success text-white",
  },
  {
    id: "theme-darl",
    name: "Dark Mode",
    price: 50,
    class: "bg-success text-white",
  },
];

const SOUNDS = [
  {
    id: "sound-beep",
    name: "Beep Beep",
    price: 0,
    file: "sounds/beep.mp3",
  },
  {
    id: "sound-firework",
    name: "Pháo Hoa",
    price: 100,
    file: "sounds/firework.mp3",
  },
  {
    id: "sound-sea",
    name: "Sóng Biển",
    price: 50,
    file: "sounds/sea.mp3",
  },
  {
    id: "sound-rain",
    name: "Tiếng Mưa",
    price: 50,
    file: "sounds/rain.mp3",
  },
  {
    id: "sound-jingle",
    name: "Chuông Tuyết",
    price: 100,
    file: "sounds/jingle.mp3",
  },
];

// 2. HÀM KHỞI TẠO DỮ LIỆU NGƯỜI DÙNG (Nếu chưa có thì tạo mặc định)
async function initUserData() {
  if (!currentUser) return;
  const userRef = ref(db, "users/" + currentUser);

  get(userRef).then((snapshot) => {
    const data = snapshot.val();

    // Nếu chưa có kho đồ (inventory), tặng mặc định 1000 xu và đồ cơ bản
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
        loadShopUI(); // Tải lại giao diện sau khi tạo xong
      });
    } else {
      loadShopUI(); // Có rồi thì tải giao diện luôn
    }
  });
}

// 3. HÀM HIỂN THỊ GIAO DIỆN (RENDER)
function loadShopUI() {
  const userRef = ref(db, "users/" + currentUser);

  get(userRef).then((snapshot) => {
    const userData = snapshot.val();
    const inventory = userData.inventory || {};
    const currentSettings = userData.settings || {};

    // Hiển thị số xu
    document.getElementById("user-coin").innerText = userData.coin || 0;

    // A. Render Themes
    const themeHTML = THEMES.map((item) => {
      const isOwned = inventory[item.id]; // Kiểm tra đã mua chưa
      const isEquipped = currentSettings.theme === item.id; // Kiểm tra đang dùng không

      let btnAction = "";
      if (isEquipped) {
        btnAction = `<button class="btn btn-secondary text-dark w-100" disabled><b>Đang dùng</b></button>`;
      } else if (isOwned) {
        // Lưu ý: Dùng arrow function trong onclick cần cẩn thận, ta dùng ID để bắt sự kiện sau
        btnAction = `<button class="btn btn-primary w-100 btn-equip-theme" data-id="${item.id}">Áp dụng</button>`;
      } else {
        btnAction = `<button class="btn btn-outline-danger w-100 btn-buy-theme" data-id="${item.id}" data-price="${item.price}">Mua (${item.price} xu)</button>`;
      }

      return `
                <div class="col-12 col-md-6 col-lg-4 mb-4">
            <div class="card h-100">
                <img src="${item.image}" class="card-img-top theme-preview-img" alt="${item.name}">
                
                <div class="card-body text-center p-2 ">
                    <h5 class="card-title mb-0">${item.name}</h5>
                </div>
                
                <div class="card-footer bg-white border-top-0">
                    ${btnAction} </div>
            </div>
        </div>
            `;
    }).join("");
    document.getElementById("theme-list").innerHTML = themeHTML;

    // B. Render Sounds (Tương tự Theme, thêm nút nghe thử)
    const soundHTML = SOUNDS.map((item) => {
      const isOwned = inventory[item.id];
      const isEquipped = currentSettings.sound === item.id;

      let btnAction = "";
      if (isEquipped) {
        btnAction = `<button class="btn btn-secondary text-dark w-100" disabled><b>Đang dùng</b></button>`;
      } else if (isOwned) {
        btnAction = `<button class="btn btn-primary w-100 btn-equip-sound" data-id="${item.id}">Dùng</button>`;
      } else {
        btnAction = `<button class="btn btn-outline-danger w-100 btn-buy-sound" data-id="${item.id}" data-price="${item.price}">Mua (${item.price} xu)</button>`;
      }

      return `
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <h5> ${item.name}</h5>
                            <button class="btn btn-sm btn-light mt-2" onclick="alert('Đang phát thử: ${item.name}')">Nghe thử</button>
                        </div>
                        <div class="card-footer bg-white border-top-0">
                            ${btnAction}
                        </div>
                    </div>
                </div>
            `;
    }).join("");
    document.getElementById("sound-list").innerHTML = soundHTML;

    // GẮN SỰ KIỆN CHO CÁC NÚT VỪA TẠO (QUAN TRỌNG)
    addEventListeners();
  });
}

// 4. XỬ LÝ MUA VÀ ÁP DỤNG (Đã bổ sung phần Âm thanh)
function addEventListeners() {
  // --- PHẦN GIAO DIỆN (THEME) ---
  // Xử lý MUA Theme
  document.querySelectorAll(".btn-buy-theme").forEach((btn) => {
    btn.addEventListener("click", () =>
      buyItem(btn.dataset.id, parseInt(btn.dataset.price), "theme")
    );
  });

  // Xử lý ÁP DỤNG Theme
  document.querySelectorAll(".btn-equip-theme").forEach((btn) => {
    btn.addEventListener("click", () => equipItem(btn.dataset.id, "theme"));
  });

  // --- PHẦN ÂM THANH (SOUND) - MỚI THÊM VÀO ---
  // Xử lý MUA Sound
  document.querySelectorAll(".btn-buy-sound").forEach((btn) => {
    btn.addEventListener("click", () =>
      buyItem(btn.dataset.id, parseInt(btn.dataset.price), "sound")
    );
  });

  // Xử lý ÁP DỤNG Sound
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
        // Trừ tiền và Thêm vào kho
        const updates = {};
        updates["/coin"] = currentCoin - price;
        updates["/inventory/" + itemId] = true;

        update(userRef, updates).then(() => {
          alert("Mua thành công!");
          loadShopUI(); // Tải lại giao diện
        });
      }
    } else {
      alert("Bạn không đủ tiền! Hãy nạp thêm (hoặc xin admin Hưng).");
    }
  });
}

// 2. Sửa hàm equipItem
function equipItem(itemId, type) {
  const userRef = ref(db, "users/" + currentUser);
  const updates = {};
  updates["/settings/" + type] = itemId;

  update(userRef, updates).then(() => {
    // CẬP NHẬT NGAY LẬP TỨC
    if (type === "theme") {
      localStorage.setItem("currentTheme", itemId); // Lưu tạm để các trang khác biết
      applyTheme(itemId); // Đổi màu ngay tại chỗ
    }

    loadShopUI();
  });
}

// Chạy chương trình
initUserData();
