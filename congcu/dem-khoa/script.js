// ============================================================
// 1. IMPORT CÔNG CỤ
// Lưu ý: Hãy chỉnh số lượng dấu ../ cho đúng với thư mục của bạn
// Nếu file này ở: cong-cu/dem-khoa/script.js -> dùng ../../
import { db, ref, set, get, remove } from "../../firebase-config.js";
import { playAlarm } from "../../sound-manager.js";

// Lấy thông tin người dùng
const currentUser = localStorage.getItem("currentUser");
const dbRef = currentUser
  ? ref(db, `users/${currentUser}/tools/date_countdown`)
  : null;

// Biến lưu nhạc để tắt
let currentAlarmAudio = null;
let countdownTimer = null;

// ============================================================
// 2. KẾT NỐI GIAO DIỆN (DOM ELEMENTS)
// ============================================================
const targetDateInput = document.getElementById("target-date");
const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const resetBtn = document.getElementById("reset-btn");
const presetButtons = document.querySelectorAll(".btn-preset");

// Các thẻ hiển thị (Đảm bảo ID trong HTML trùng khớp)
const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const timeRemainingEl = document.getElementById("time-remaining-display");
const statusDisplayEl = document.getElementById("status-display");
const targetDisplayEl = document.getElementById("target-date-display");

// UI Báo thức (Overlay)
const uiOverlay = document.getElementById("alarm-overlay");
const btnStopAlarm = document.getElementById("btn-stop-alarm");

// ============================================================
// 3. LOGIC ĐẾM NGƯỢC (CLASS)
// ============================================================
class CountdownTimer {
  constructor(targetDate, updateCallback, completeCallback) {
    this.targetDate = new Date(targetDate).getTime();
    this.updateCallback = updateCallback;
    this.completeCallback = completeCallback;
    this.interval = null;
    this.isRunning = false;
    this.totalDuration = 0;
    this.startTime = new Date().getTime();
  }

  // Nhận savedStartTime để hồi phục khi tải lại trang
  start(savedStartTime = null) {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = savedStartTime || new Date().getTime();
    this.totalDuration = this.targetDate - this.startTime;

    this.update();
    this.interval = setInterval(() => this.update(), 1000);
    console.log("Bộ đếm ngược đã bắt đầu");
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearInterval(this.interval);
    this.interval = null;
    console.log("Bộ đếm ngược đã dừng");
  }

  reset() {
    this.stop();
    if (this.updateCallback) {
      this.updateCallback({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        progress: 0,
        expired: false,
        status: "reset",
      });
    }
  }

  update() {
    const now = new Date().getTime();
    const timeRemaining = this.targetDate - now;

    if (timeRemaining <= 0) {
      this.complete();
      return;
    }

    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor(
      (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
    );
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    let progress = 0;
    if (this.totalDuration > 0) {
      progress = Math.max(
        0,
        Math.min(
          100,
          ((this.totalDuration - timeRemaining) / this.totalDuration) * 100
        )
      );
    }

    if (this.updateCallback) {
      this.updateCallback({
        days,
        hours,
        minutes,
        seconds,
        progress,
        expired: false,
        status: "running",
      });
    }
  }

  complete() {
    this.stop();
    if (this.completeCallback) this.completeCallback();
    if (this.updateCallback) {
      this.updateCallback({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        progress: 100,
        expired: true,
        status: "completed",
      });
    }
  }
}

// ============================================================
// 4. CÁC HÀM HỖ TRỢ & UPDATE UI
// ============================================================
const pad = (n) => (n < 10 ? "0" + n : n);
const formatNumber = (num) => pad(num);
const formatInputDate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;

function updateUI(data) {
  // Kiểm tra nếu các thẻ tồn tại mới gán giá trị (Tránh lỗi null)
  if (daysEl) daysEl.textContent = formatNumber(data.days);
  if (hoursEl) hoursEl.textContent = formatNumber(data.hours);
  if (minutesEl) minutesEl.textContent = formatNumber(data.minutes);
  if (secondsEl) secondsEl.textContent = formatNumber(data.seconds);

  if (progressFill) progressFill.style.width = `${data.progress}%`;
  if (progressText) progressText.textContent = `${Math.round(data.progress)}%`;

  if (data.expired) {
    if (timeRemainingEl) timeRemainingEl.textContent = "00:00:00";
    if (statusDisplayEl) statusDisplayEl.textContent = "Đã hoàn thành";
  } else if (data.status !== "reset") {
    if (timeRemainingEl)
      timeRemainingEl.textContent = `${data.days}d ${data.hours}h ${data.minutes}m`;
    if (statusDisplayEl) statusDisplayEl.textContent = "Đang chạy";
  } else {
    if (timeRemainingEl) timeRemainingEl.textContent = "--";
    if (statusDisplayEl) statusDisplayEl.textContent = "Chưa bắt đầu";
  }
}

// ============================================================
// 5. XỬ LÝ SỰ KIỆN NÚT BẤM
// ============================================================

// --- NÚT BẮT ĐẦU ---
if (startBtn) {
  startBtn.addEventListener("click", () => {
    const targetDateVal = targetDateInput.value;
    if (!targetDateVal) return alert("Vui lòng chọn ngày mục tiêu!");

    const targetTime = new Date(targetDateVal).getTime();
    const startTime = Date.now();

    if (targetTime <= startTime) return alert("Ngày phải ở tương lai!");

    if (countdownTimer) countdownTimer.stop();

    // Tạo Timer mới
    countdownTimer = new CountdownTimer(targetDateVal, updateUI, () => {
      // KHI HẾT GIỜ:
      console.log("Đếm ngược hoàn thành!");

      // 1. Phát nhạc
      currentAlarmAudio = playAlarm();
      if (currentAlarmAudio) currentAlarmAudio.loop = true;

      // 2. Hiện Overlay
      if (uiOverlay) uiOverlay.classList.remove("d-none");

      // 3. Xóa trên mây
      if (dbRef) remove(dbRef);
    });

    if (targetDisplayEl)
      targetDisplayEl.textContent = new Date(targetDateVal).toLocaleString(
        "vi-VN"
      );

    // Chạy đồng hồ
    countdownTimer.start(startTime);

    // --- LƯU LÊN FIREBASE ---
    if (dbRef) {
      set(dbRef, {
        target: targetTime,
        start: startTime,
        dateString: targetDateVal,
      }).then(() => console.log("Đã lưu lên mây"));
    }
  });
}

// --- NÚT DỪNG ---
if (stopBtn) {
  stopBtn.addEventListener("click", () => {
    if (countdownTimer && countdownTimer.isRunning) {
      countdownTimer.stop();
      if (statusDisplayEl) statusDisplayEl.textContent = "Đã dừng";
    }
  });
}

// --- NÚT RESET ---
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    if (countdownTimer) countdownTimer.reset();

    // Xóa trên Firebase
    if (dbRef) remove(dbRef);

    // Tắt nhạc & Ẩn Overlay
    if (currentAlarmAudio) {
      currentAlarmAudio.pause();
      currentAlarmAudio.currentTime = 0;
    }
    if (uiOverlay) uiOverlay.classList.add("d-none");

    // Reset UI
    updateUI({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      progress: 0,
      expired: false,
      status: "reset",
    });
    if (targetDisplayEl) targetDisplayEl.textContent = "Chưa chọn";

    // Đặt lại ngày mặc định
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    targetDateInput.value = formatInputDate(now);
  });
}

// --- NÚT TẮT CHUÔNG (Overlay) ---
if (btnStopAlarm) {
  btnStopAlarm.addEventListener("click", () => {
    if (currentAlarmAudio) {
      currentAlarmAudio.pause();
      currentAlarmAudio.currentTime = 0;
    }
    if (uiOverlay) uiOverlay.classList.add("d-none");
  });
}

// --- CÁC NÚT CHỌN NHANH ---
presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const now = new Date();
    const hours = button.getAttribute("data-hours");
    const days = button.getAttribute("data-days");

    if (hours) now.setHours(now.getHours() + parseInt(hours));
    else if (days) now.setDate(now.getDate() + parseInt(days));

    targetDateInput.value = formatInputDate(now);
  });
});

// ============================================================
// 6. TÍNH NĂNG TỰ ĐỘNG TẢI TỪ FIREBASE (CHẠY NỀN)
// ============================================================
function loadFromFirebase() {
  if (!dbRef) return;

  get(dbRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.target > Date.now()) {
          // Khôi phục
          targetDateInput.value = data.dateString;
          if (targetDisplayEl)
            targetDisplayEl.textContent = new Date(
              data.dateString
            ).toLocaleString("vi-VN");
          if (statusDisplayEl)
            statusDisplayEl.textContent = "Đang chạy (Đồng bộ)";

          if (countdownTimer) countdownTimer.stop();

          countdownTimer = new CountdownTimer(data.dateString, updateUI, () => {
            // Hết giờ
            currentAlarmAudio = playAlarm();
            if (currentAlarmAudio) currentAlarmAudio.loop = true;
            if (uiOverlay) uiOverlay.classList.remove("d-none");
            remove(dbRef);
          });

          // CHẠY TIẾP TỪ MỐC CŨ
          countdownTimer.start(data.start);
        } else {
          // Đã hết giờ lúc tắt máy -> Hiện thông báo
          remove(dbRef);
          updateUI({
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            progress: 100,
            expired: true,
            status: "completed",
          });
          if (uiOverlay) {
            uiOverlay.classList.remove("d-none");
            // Có thể đổi text trong overlay thành "ĐÃ KẾT THÚC KHI VẮNG MẶT"
          }
        }
      }
    })
    .catch(console.error);
}

// --- KHỞI CHẠY ---
const now = new Date();
now.setMinutes(now.getMinutes() + 5);
targetDateInput.value = formatInputDate(now);

updateUI({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  progress: 0,
  expired: false,
  status: "initial",
});
loadFromFirebase(); // Tự động kiểm tra Firebase

console.log("Ứng dụng đồng hồ đếm ngày đã sẵn sàng!");
