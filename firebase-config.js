// 1. Import thư viện (Thêm 'remove' vào danh sách này)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  child,
  update,
  remove, // <--- BỔ SUNG THÊM CÁI NÀY
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 2. Cấu hình (Giữ nguyên của bạn)
const firebaseConfig = {
  apiKey: "AIzaSyCm2az1msLlIbfh2RC7zBl8tbsCR92Ysnc",
  authDomain: "mupclock-mupcoder.firebaseapp.com",
  databaseURL: "https://mupclock-mupcoder-default-rtdb.firebaseio.com",
  projectId: "mupclock-mupcoder",
  storageBucket: "mupclock-mupcoder.firebasestorage.app",
  messagingSenderId: "923367897600",
  appId: "1:923367897600:web:ee334b9887dd552124b6e5",
  measurementId: "G-D6F0H85KDN",
};

// 3. Khởi động
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 4. Xuất khẩu (Thêm 'remove' vào đây nữa để các file khác dùng được)
export { db, ref, set, get, child, update, remove };
