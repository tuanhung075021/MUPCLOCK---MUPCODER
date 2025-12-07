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

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startTime = new Date().getTime();
        this.totalDuration = this.targetDate - this.startTime;
        
        this.update(); // Cập nhật ngay lập tức
        this.interval = setInterval(() => this.update(), 1000);
        
        console.log('Bộ đếm ngược đã bắt đầu');
    }

    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        clearInterval(this.interval);
        this.interval = null;
        
        console.log('Bộ đếm ngược đã dừng');
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
                status: 'reset'
            });
        }
        
        console.log('Bộ đếm ngược đã đặt lại');
    }

    update() {
        const now = new Date().getTime();
        const timeRemaining = this.targetDate - now;

        if (timeRemaining <= 0) {
            this.complete();
            return;
        }

        // Tính toán thời gian
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        // Tính toán phần trăm
        const progress = Math.max(0, Math.min(100, 
            ((this.totalDuration - timeRemaining) / this.totalDuration * 100)
        ));

        // Gọi callback để cập nhật UI
        if (this.updateCallback) {
            this.updateCallback({
                days: days,
                hours: hours,
                minutes: minutes,
                seconds: seconds,
                progress: progress,
                expired: false,
                status: 'running'
            });
        }
    }

    complete() {
        this.stop();
        
        if (this.completeCallback) {
            this.completeCallback();
        }
        
        if (this.updateCallback) {
            this.updateCallback({
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                progress: 100,
                expired: true,
                status: 'completed'
            });
        }
        
        console.log('Bộ đếm ngược đã hoàn thành');
    }

    getRemainingTime() {
        const now = new Date().getTime();
        const timeRemaining = this.targetDate - now;

        if (timeRemaining <= 0) {
            return { expired: true };
        }

        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        return {
            days: days,
            hours: hours,
            minutes: minutes,
            seconds: seconds,
            expired: false
        };
    }
}

// Khởi tạo ứng dụng
let countdownTimer = null;

// DOM Elements
const targetDateInput = document.getElementById('target-date');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const resetBtn = document.getElementById('reset-btn');
const presetButtons = document.querySelectorAll('.btn-preset');
const countdownDisplay = document.getElementById('countdown-display');

// Cập nhật UI
function updateUI(data) {
    // Cập nhật các số
    document.getElementById('days').textContent = formatNumber(data.days);
    document.getElementById('hours').textContent = formatNumber(data.hours);
    document.getElementById('minutes').textContent = formatNumber(data.minutes);
    document.getElementById('seconds').textContent = formatNumber(data.seconds);
    
    // Cập nhật progress bar
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    progressFill.style.width = `${data.progress}%`;
    progressText.textContent = `${Math.round(data.progress)}%`;
    
    // Cập nhật thông tin
    document.getElementById('time-remaining-display').textContent = 
        `${data.days} ngày ${data.hours} giờ ${data.minutes} phút`;
    
    document.getElementById('status-display').textContent = 
        data.expired ? 'Đã hoàn thành' : 'Đang chạy';
    
    // Cập nhật display chính
    if (data.expired) {
        countdownDisplay.innerHTML = `
            <div class="completed-message">
                <i class="fas fa-check-circle" style="font-size: 3em; color: #4CAF50; margin-bottom: 20px;"></i>
                <h2 style="color: white; margin-bottom: 10px;">ĐẾM NGƯỢC ĐÃ HOÀN THÀNH!</h2>
                <p style="color: #bdc3c7;">Đã đến thời điểm mục tiêu!</p>
            </div>
        `;
        document.getElementById('status-display').textContent = 'Đã hoàn thành';
    }
}

// Format số với 2 chữ số
function formatNumber(num) {
    return num < 10 ? `0${num}` : num.toString();
}

// Format ngày tháng
function formatDate(date) {
    return new Date(date).toLocaleString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Xử lý sự kiện bắt đầu
startBtn.addEventListener('click', () => {
    const targetDate = targetDateInput.value;
    
    if (!targetDate) {
        alert('Vui lòng chọn ngày mục tiêu!');
        return;
    }
    
    if (new Date(targetDate) <= new Date()) {
        alert('Ngày mục tiêu phải ở tương lai!');
        return;
    }
    
    // Dừng timer cũ nếu có
    if (countdownTimer) {
        countdownTimer.stop();
    }
    
    // Tạo timer mới
    countdownTimer = new CountdownTimer(
        targetDate,
        updateUI,
        () => {
            console.log('Đếm ngược hoàn thành!');
            // Có thể thêm hiệu ứng hoặc âm thanh tại đây
            playCompletionSound();
        }
    );
    
    // Cập nhật thông tin ngày mục tiêu
    document.getElementById('target-date-display').textContent = formatDate(targetDate);
    document.getElementById('status-display').textContent = 'Đang chạy';
    
    // Bắt đầu đếm ngược
    countdownTimer.start();
    
    // Thay đổi nội dung display
    countdownDisplay.innerHTML = `
        <div class="running-message">
            <i class="fas fa-hourglass-half" style="font-size: 3em; color: #6a11cb; margin-bottom: 20px;"></i>
            <h3 style="color: white; margin-bottom: 10px;">ĐANG ĐẾM NGƯỢC...</h3>
            <p style="color: #bdc3c7;">Hãy theo dõi tiến trình bên dưới</p>
        </div>
    `;
});

// Xử lý sự kiện dừng
stopBtn.addEventListener('click', () => {
    if (countdownTimer && countdownTimer.isRunning) {
        countdownTimer.stop();
        document.getElementById('status-display').textContent = 'Đã dừng';
        
        countdownDisplay.innerHTML = `
            <div class="paused-message">
                <i class="fas fa-pause-circle" style="font-size: 3em; color: #FF9800; margin-bottom: 20px;"></i>
                <h3 style="color: white; margin-bottom: 10px;">ĐÃ DỪNG</h3>
                <p style="color: #bdc3c7;">Bấm "Bắt đầu" để tiếp tục</p>
            </div>
        `;
    }
});

// Xử lý sự kiện reset
resetBtn.addEventListener('click', () => {
    if (countdownTimer) {
        countdownTimer.reset();
    }
    
    // Reset UI
    updateUI({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        progress: 0,
        expired: false,
        status: 'reset'
    });
    
    document.getElementById('target-date-display').textContent = 'Chưa chọn';
    document.getElementById('time-remaining-display').textContent = '--';
    document.getElementById('status-display').textContent = 'Chưa bắt đầu';
    
    countdownDisplay.innerHTML = `
        <div class="initial-message">
            <i class="fas fa-hourglass-start"></i>
            <p>Chọn ngày và bấm "Bắt đầu" để bắt đầu đếm ngược</p>
        </div>
    `;
});

// Xử lý các nút preset
presetButtons.forEach(button => {
    button.addEventListener('click', () => {
        const now = new Date();
        const hours = button.getAttribute('data-hours');
        const days = button.getAttribute('data-days');
        
        if (hours) {
            now.setHours(now.getHours() + parseInt(hours));
        } else if (days) {
            now.setDate(now.getDate() + parseInt(days));
        }
        
        // Format date cho input datetime-local
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hoursStr = String(now.getHours()).padStart(2, '0');
        const minutesStr = String(now.getMinutes()).padStart(2, '0');
        
        targetDateInput.value = `${year}-${month}-${day}T${hoursStr}:${minutesStr}`;
    });
});

// Đặt ngày mặc định (ngày mai)
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(23, 59, 0, 0);

const year = tomorrow.getFullYear();
const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
const day = String(tomorrow.getDate()).padStart(2, '0');
const hours = String(tomorrow.getHours()).padStart(2, '0');
const minutes = String(tomorrow.getMinutes()).padStart(2, '0');

targetDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;

// Hàm phát âm thanh khi hoàn thành
function playCompletionSound() {
    // Tạo âm thanh đơn giản bằng Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
    } catch (e) {
        console.log('Không thể phát âm thanh:', e);
    }
}

// Thêm hiệu ứng cho các số
function animateNumber(element, newValue) {
    const oldValue = parseInt(element.textContent);
    const difference = newValue - oldValue;
    
    if (difference === 0) return;
    
    element.style.transform = 'scale(1.2)';
    element.style.color = '#6a11cb';
    
    setTimeout(() => {
        element.style.transform = 'scale(1)';
        element.style.color = '#2c3e50';
    }, 300);
}

// Khởi tạo UI ban đầu
updateUI({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    progress: 0,
    expired: false,
    status: 'initial'
});

console.log('Ứng dụng đồng hồ đếm ngược đã sẵn sàng!');