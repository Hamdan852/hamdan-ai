(() => {
  "use strict";
  const USER_KEY = "hamdan.auth.user";
  const SESSION_KEY = "hamdan.auth.session";
  const $ = (s) => document.querySelector(s);
  const modal = () => $("#authModal");
  const form = () => $("#authForm");
  let mode = "signin";

  function showAuth(next = "signin") {
    mode = next;
    modal().hidden = false;
    document.body.classList.add("auth-open");
    $("#authTitle").textContent = mode === "signup" ? "Create your Hamdan AI account" : "Welcome back to Hamdan AI";
    $("#authSubmit").textContent = mode === "signup" ? "Create Account" : "Sign In";
    $("#authNameRow").hidden = mode !== "signup";
    $("#authSwitch").innerHTML = mode === "signup" ? 'Already have an account? <button type="button" data-auth-mode="signin">Sign In</button>' : 'New to Hamdan AI? <button type="button" data-auth-mode="signup">Sign Up</button>';
    $("#authEmail").focus();
  }

  function hideAuth() { modal().hidden = true; document.body.classList.remove("auth-open"); }

  function renderAccount() {
    const session = localStorage.getItem(SESSION_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    const label = $("#accountLabel");
    const avatar = $("#accountAvatar");
    const signedIn = Boolean(session && user);
    if (signedIn) {
      label.textContent = user.name || user.email.split("@")[0];
      avatar.textContent = (user.name || "AH").slice(0,2).toUpperCase();
    } else {
      label.textContent = "Guest";
      avatar.textContent = "AH";
    }
    ["#signInBtn", "#signUpBtn", "#logOutBtn", "#sidebarSignIn", "#sidebarSignUp", "#sidebarLogOut"].forEach(selector => {
      const node = $(selector);
      if (!node) return;
      if (signedIn) {
        node.hidden = selector.includes("SignIn") || selector.includes("SignUp");
      } else {
        node.hidden = selector.includes("LogOut");
        if (selector.includes("SignIn") || selector.includes("SignUp")) node.hidden = false;
      }
    });
  }

  function notify(msg) {
    const box = $("#toast");
    if (box) { box.textContent = msg; box.className = "toast show success"; setTimeout(() => box.classList.remove("show"), 3000); }
  }

  document.addEventListener("click", (e) => {
    const authMode = e.target.closest("[data-auth-mode]");
    if (authMode) showAuth(authMode.dataset.authMode);
    if (e.target.closest("#signInBtn")) showAuth("signin");
    if (e.target.closest("#signUpBtn")) showAuth("signup");
    if (e.target.closest("#logOutBtn")) { localStorage.removeItem(SESSION_KEY); renderAccount(); notify("You have been signed out."); }
    if (e.target.closest("#authClose")) hideAuth();
    if (e.target === modal()) hideAuth();
  });

  document.addEventListener("submit", (e) => {
    if (e.target !== form()) return;
    e.preventDefault();
    const email = $("#authEmail").value.trim().toLowerCase();
    const password = $("#authPassword").value;
    const name = $("#authName").value.trim();
    if (!email || !password || (mode === "signup" && !name)) return notify("Please complete all required fields.");
    if (!email.includes("@")) return notify("Please enter a valid email address.");
    if (password.length < 8) return notify("Password must contain at least 8 characters.");
    const existing = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    if (mode === "signup") {
      localStorage.setItem(USER_KEY, JSON.stringify({ name, email }));
      localStorage.setItem(SESSION_KEY, "local-demo-session");
      hideAuth(); renderAccount(); notify("Account created. Welcome to Hamdan AI!");
    } else {
      if (!existing || existing.email !== email) return notify("No local account found for this email. Please Sign Up first.");
      localStorage.setItem(SESSION_KEY, "local-demo-session");
      hideAuth(); renderAccount(); notify("Signed in successfully.");
    }
    e.target.reset();
  });

  window.addEventListener("DOMContentLoaded", renderAccount);
})();
