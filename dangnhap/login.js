import { db, ref, set, get, child } from "../firebase-config.js";

// --- XỬ LÝ ẨN HIỆN FORM ---
document.getElementById("dangki").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("login-box").classList.add("hidden");
  document.getElementById("register-box").classList.remove("hidden");
});

document.getElementById("return-dangnhap").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("register-box").classList.add("hidden");
  document.getElementById("login-box").classList.remove("hidden");
});

// --- XỬ LÝ ĐĂNG KÝ ---
document.getElementById("register-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("reg-user").value;
  const pass = document.getElementById("reg-pass").value;
  const repass = document.getElementById("reg-repass").value;

  if (pass !== repass) {
    alert("Mật khẩu không khớp!");
    return;
  }

  set(ref(db, "users/" + user), {
    username: user,
    password: pass,
  })
    .then(() => {
      alert("Đăng ký thành công!");
      document.getElementById("return-dangnhap").click();
    })
    .catch((error) => alert("Lỗi: " + error));
});

// --- XỬ LÝ ĐĂNG NHẬP ---
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const inputUser = document.getElementById("login-user").value;
  const inputPass = document.getElementById("login-pass").value;
  const dbRef = ref(db);

  get(child(dbRef, `users/${inputUser}`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.password === inputPass) {
          localStorage.setItem("currentUser", inputUser);
          localStorage.setItem("lastActive", Date.now());
          window.location.href = "../congcu/app.html";
        } else {
          alert("Sai mật khẩu!");
        }
      } else {
        alert("Tài khoản không tồn tại!");
      }
    })
    .catch((error) => console.error(error));
});
