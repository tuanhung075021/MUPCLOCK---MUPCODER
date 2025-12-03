import { db, ref, set, get, child, update } from "./firebase-config.js";

const currentUser = localStorage.getItem("currentUser");

// 1. KHAI BÁO DANH SÁCH SẢN PHẨM (DATABASE ẢO)
const THEMES = [
  { id: "theme-default", name: "Mặc Định (Sáng)", price: 0, class: "bg-light" },
  {
    id: "theme-tet",
    name: "Tết Nguyên Đán",
    price: 100,
    class: "bg-danger text-warning",
  }, // Màu đỏ chữ vàng
  {
    id: "theme-summer",
    name: "Mùa Hạ Rực Rỡ",
    price: 50,
    class: "bg-warning text-dark",
  },
  {
    id: "theme-autumn",
    name: "Mùa Thu Lãng Mạn",
    price: 50,
    class: "bg-secondary text-white",
  }, // Tạm dùng màu xám
  {
    id: "theme-xmas",
    name: "Giáng Sinh An Lành",
    price: 100,
    class: "bg-success text-white",
  },
];

const SOUNDS = [
  {
    id: "sound-beep",
    name: "Beep Beep (Cơ bản)",
    price: 0,
    file: "sounds/beep.mp3",
  },
  {
    id: "sound-firework",
    name: "Pháo Hoa (Tết)",
    price: 100,
    file: "sounds/firework.mp3",
  },
  {
    id: "sound-sea",
    name: "Sóng Biển (Hạ)",
    price: 50,
    file: "sounds/sea.mp3",
  },
  {
    id: "sound-rain",
    name: "Tiếng Mưa (Thu)",
    price: 50,
    file: "sounds/rain.mp3",
  },
  {
    id: "sound-jingle",
    name: "Chuông Tuyết (Noel)",
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
        btnAction = `<button class="btn btn-success w-100" disabled>Đang dùng</button>`;
      } else if (isOwned) {
        // Lưu ý: Dùng arrow function trong onclick cần cẩn thận, ta dùng ID để bắt sự kiện sau
        btnAction = `<button class="btn btn-primary w-100 btn-equip-theme" data-id="${item.id}">Áp dụng</button>`;
      } else {
        btnAction = `<button class="btn btn-outline-danger w-100 btn-buy-theme" data-id="${item.id}" data-price="${item.price}">Mua (${item.price} xu)</button>`;
      }

      return `
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body ${item.class} border" style="height: 100px; display:flex; align-items:center; justify-content:center;">
                            <h5>${item.name}</h5>
                        </div>
                        <div class="card-footer bg-white border-top-0">
                            ${btnAction}
                        </div>
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
        btnAction = `<button class="btn btn-success w-100" disabled>Đang dùng</button>`;
      } else if (isOwned) {
        btnAction = `<button class="btn btn-primary w-100 btn-equip-sound" data-id="${item.id}">Dùng</button>`;
      } else {
        btnAction = `<button class="btn btn-outline-danger w-100 btn-buy-sound" data-id="${item.id}" data-price="${item.price}">Mua (${item.price} xu)</button>`;
      }

      return `
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <h5>🔊 ${item.name}</h5>
                            <button class="btn btn-sm btn-light mt-2" onclick="alert('Đang phát thử: ${item.name}')">▶ Nghe thử</button>
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

// 4. XỬ LÝ MUA VÀ ÁP DỤNG
function addEventListeners() {
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

  // (Làm tương tự cho Sound...)
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

function equipItem(itemId, type) {
  const userRef = ref(db, "users/" + currentUser);
  const updates = {};
  updates["/settings/" + type] = itemId; // settings/theme hoặc settings/sound

  update(userRef, updates).then(() => {
    alert("Đã áp dụng thành công!");
    loadShopUI();
    // Nếu là theme, đổi màu ngay lập tức để test
    // (Phần đổi màu thật sự sẽ nằm ở file chung để áp dụng cho mọi trang)
  });
}

// Chạy chương trình
initUserData();
