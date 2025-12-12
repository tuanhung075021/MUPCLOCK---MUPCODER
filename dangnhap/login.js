import {
  db,
  ref,
  set,
  get,
  child,
  update,
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "../firebase-config.js";

// --- XỬ LÝ CHUYỂN ĐỔI FORM ---
const loginBox = document.getElementById("login-box");
const regBox = document.getElementById("register-box");
const linkDangKi = document.getElementById("dangki");
const linkReturn = document.getElementById("return-dangnhap");

if (linkDangKi)
  linkDangKi.addEventListener("click", (e) => {
    e.preventDefault();
    loginBox.classList.add("hidden");
    regBox.classList.remove("hidden");
  });
if (linkReturn)
  linkReturn.addEventListener("click", (e) => {
    e.preventDefault();
    regBox.classList.add("hidden");
    loginBox.classList.remove("hidden");
  });

// 1. ĐĂNG KÝ
const regForm = document.getElementById("register-form");
if (regForm) {
  regForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("reg-email").value;
    const username = document.getElementById("reg-user").value;
    const phone = document.getElementById("reg-phone").value;
    const pass = document.getElementById("reg-pass").value;
    const repass = document.getElementById("reg-repass").value;
    const btn = regForm.querySelector("button");

    if (pass !== repass) {
      alert("Mật khẩu không khớp!");
      return;
    }

    const dbRef = ref(db);
    get(child(dbRef, `users/${username}`)).then((snapshot) => {
      if (snapshot.exists()) {
        alert("Email này đã được đăng ký!");
        return;
      } else {
        btn.disabled = true;
        btn.innerText = "Đang đăng kí...";
        createUserWithEmailAndPassword(auth, email, pass)
          .then((userCredential) => {
            const user = userCredential.user;
            sendEmailVerification(user).then(() => {
              // Lưu đúng cấu trúc: info -> email
              set(ref(db, "users/" + username), {
                info: {
                  email: email,
                  phone: phone,
                  username: username,
                },
                coin: 1000,
                inventory: {},
                uid: user.uid,
              }).then(() => {
                alert(
                  `Đăng ký thành công!\n\nLink xác thực đã gửi tới: ${email}.\n\n⚠️ LƯU Ý: Nếu không thấy trong Hộp thư đến, vui lòng kiểm tra mục SPAM/THƯ RÁC.`
                );
                signOut(auth);
                regBox.classList.add("hidden");
                loginBox.classList.remove("hidden");
                regForm.reset();
              });
            });
          })
          .catch((error) => {
            console.error(error);
            alert("Lỗi: " + error.message);
          })
          .finally(() => {
            btn.disabled = false;
            btn.innerText = "Đăng Ký";
          });
      }
    });
  });
}

// 2. ĐĂNG NHẬP
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // --- SỬA LẠI DÒNG NÀY ĐỂ KHỚP VỚI HTML ---
    const inputEl = document.getElementById("login-input");
    if (!inputEl) {
      alert(
        "Lỗi code: Không tìm thấy ô nhập liệu (id='login-input') trong HTML!"
      );
      return;
    }

    const inputVal = inputEl.value.trim(); // Lấy giá trị từ ô đã sửa ID
    const inputPass = document.getElementById("login-pass").value;
    const btn = loginForm.querySelector("button");

    btn.disabled = true;
    btn.innerText = "Đăng Nhập...";

    // Kiểm tra xem người dùng nhập Email hay Username
    const isEmail = inputVal.includes("@");

    if (isEmail) {
      // Nếu có @ -> Đăng nhập kiểu Email
      handleFirebaseLogin(inputVal, inputPass, btn);
    } else {
      // Nếu không có @ -> Đăng nhập kiểu Username (User cũ)
      handleLegacyLogin(inputVal, inputPass, btn);
    }
  });
}

function handleFirebaseLogin(email, pass, btn) {
  signInWithEmailAndPassword(auth, email, pass)
    .then((userCredential) => {
      const user = userCredential.user;
      if (user.emailVerified) {
        findUsernameByEmail(email, () => {
          window.location.href = "../index.html";
        });
      } else {
        alert(
          "Tài khoản chưa được kích hoạt!\n\nLink xác thực đã gửi tới địa chỉ Email.\n\n⚠️ LƯU Ý: Nếu không thấy trong Hộp thư đến, vui lòng kiểm tra mục SPAM/THƯ RÁC."
        );
        signOut(auth);
        btn.disabled = false;
        btn.innerText = "Đăng Nhập";
      }
    })
    .catch((error) => {
      alert("Sai email hoặc mật khẩu!");
      btn.disabled = false;
      btn.innerText = "Đăng Nhập";
    });
}

function handleLegacyLogin(username, pass, btn) {
  const dbRef = ref(db);
  get(child(dbRef, `users/${username}`)).then((snapshot) => {
    if (snapshot.exists()) {
      const userData = snapshot.val();

      // --- SỬA Ở ĐÂY: Lấy đúng đường dẫn info.email ---
      // Kiểm tra cấu trúc cũ (password nằm ngoài) hoặc cấu trúc mới
      const storedPass =
        userData.password || (userData.info && userData.info.password);

      if (storedPass === pass) {
        // Lấy email từ trong mục info
        const storedEmail = userData.info ? userData.info.email : null;

        if (storedEmail) {
          upgradeUserAccount(username, storedEmail, pass, btn);
        } else {
          const newEmail = prompt(
            `Chào ${username}, vui lòng nhập Email để nâng cấp bảo mật:`
          );
          if (newEmail && newEmail.includes("@")) {
            upgradeUserAccount(username, newEmail, pass, btn);
          } else {
            alert("Cần email để tiếp tục!");
            btn.disabled = false;
            btn.innerText = "Đăng Nhập";
          }
        }
      } else {
        alert("Sai mật khẩu!");
        btn.disabled = false;
        btn.innerText = "Đăng Nhập";
      }
    } else {
      alert("Tên đăng nhập không tồn tại!");
      btn.disabled = false;
      btn.innerText = "Đăng Nhập";
    }
  });
}

// Hàm phụ: Thực hiện nâng cấp tài khoản cũ -> Firebase Auth
function upgradeUserAccount(username, email, pass, btn) {
  btn.innerText = "Đang cập nhật...";

  // Thử tạo tài khoản với mật khẩu cũ
  createUserWithEmailAndPassword(auth, email, pass)
    .then((userCredential) => {
      const user = userCredential.user;

      // Nâng cấp thành công -> Lưu UID và xóa pass thô
      update(ref(db), {
        [`users/${username}/uid`]: user.uid,
        [`users/${username}/info/email`]: email,
        [`users/${username}/password`]: null,
      }).then(() => {
        sendEmailVerification(user).then(() => {
          alert(
            `Đăng ký thành công!\n\nLink xác thực đã gửi tới: ${email}.\n\n⚠️ LƯU Ý: Nếu không thấy trong Hộp thư đến, vui lòng kiểm tra mục SPAM/THƯ RÁC.`
          );
          signOut(auth);
          btn.disabled = false;
          btn.innerText = "Đăng Nhập";
        });
      });
    })
    .catch((err) => {
      console.error("Lỗi nâng cấp:", err);

      // --- XỬ LÝ CÁC LỖI THƯỜNG GẶP ---

      // 1. Lỗi Mật khẩu quá yếu (Ví dụ: "123")
      if (err.code === "auth/weak-password") {
        const newPass = prompt(
          `⚠️ Mật khẩu cũ của bạn quá yếu (dưới 6 ký tự).\n\nĐể nâng cấp bảo mật, vui lòng nhập mật khẩu MỚI (ít nhất 6 ký tự):`
        );

        if (newPass && newPass.length >= 6) {
          // Gọi lại hàm này với mật khẩu mới
          upgradeUserAccount(username, email, newPass, btn);
        } else {
          alert("Nâng cấp thất bại! Bạn cần mật khẩu > 6 ký tự.");
          btn.disabled = false;
          btn.innerText = "Đăng Nhập";
        }
      }
      // 2. Lỗi Email đã tồn tại (Đã nâng cấp rồi mà bấm nhầm)
      else if (err.code === "auth/email-already-in-use") {
        // Thử đăng nhập luôn bằng mật khẩu đó
        handleFirebaseLogin(email, pass, btn);
      }
      // 3. Lỗi khác
      else {
        alert("Lỗi nâng cấp: " + err.message);
        btn.disabled = false;
        btn.innerText = "Đăng Nhập";
      }
    });
}
function findUsernameByEmail(email, callback) {
  const dbRef = ref(db);
  get(child(dbRef, "users")).then((snapshot) => {
    if (snapshot.exists()) {
      const allUsers = snapshot.val();
      let found = null;
      for (const key in allUsers) {
        // --- SỬA Ở ĐÂY: Tìm trong info.email ---
        if (allUsers[key].info && allUsers[key].info.email === email) {
          found = key;
          break;
        }
      }
      if (found) {
        localStorage.setItem("currentUser", found);
        if (callback) callback();
      } else {
        alert("Lỗi dữ liệu user!");
      }
    }
  });
}
