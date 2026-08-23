(() => {
  "use strict";

  const USER_KEY = "hamdan.auth.user";
  const SESSION_KEY = "hamdan.auth.session";
  const $ = (s) => document.querySelector(s);
  const modal = () => $("#authModal");
  const form = () => $("#authForm");
  let mode = "signin";
  let accessRequired = false;

  function hasSession() {
    return Boolean(localStorage.getItem(SESSION_KEY) && localStorage.getItem(USER_KEY));
  }

  function setDashboardAccess(allowed) {
    const sections = document.querySelectorAll(".app main > section");
    sections.forEach(section => {
      section.classList.toggle("auth-locked-section", !allowed);
      section.setAttribute("aria-hidden", allowed ? "false" : "true");
    });
    document.body.classList.toggle("dashboard-locked", !allowed);
  }

  function ensurePasswordToggle() {
    const input = $("#authPassword");
    if (!input || $("#passwordToggle")) return;
    const wrapper = document.createElement("div");
    wrapper.className = "password-field-wrap";
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const button = document.createElement("button");
    button.id = "passwordToggle";
    button.type = "button";
    button.className = "password-toggle";
    button.setAttribute("aria-label", "Show password");
    button.setAttribute("aria-pressed", "false");
    button.textContent = "👁";
    wrapper.appendChild(button);

    button.addEventListener("click", () => {
      const visible = input.type === "text";
      input.type = visible ? "password" : "text";
      button.textContent = visible ? "👁" : "🙈";
      button.setAttribute("aria-label", visible ? "Show password" : "Hide password");
      button.setAttribute("aria-pressed", String(!visible));
    });
  }

  function showAuth(next = "signin", required = false) {
    mode = next;
    accessRequired = required;
    const m = modal();
    if (!m) return;

    m.hidden = false;
    m.dataset.required = required ? "true" : "false";
    document.body.classList.add("auth-open");
    ensurePasswordToggle();

    const title = $("#authTitle");
    const subtitle = $(".auth-subtitle");
    const submit = $("#authSubmit");
    const nameRow = $("#authNameRow");
    const switchBox = $("#authSwitch");
    const close = $("#authClose");

    if (required) {
      title.textContent = next === "signup" ? "Create your Hamdan AI account" : "Sign in to Hamdan AI";
      subtitle.textContent = "Please sign in or create an account before entering the Hamdan AI dashboard.";
      close.hidden = true;
    } else {
      title.textContent = next === "signup" ? "Create your Hamdan AI account" : "Welcome back to Hamdan AI";
      subtitle.textContent = "Create or access your Hamdan AI creator account.";
      close.hidden = false;
    }

    submit.textContent = next === "signup" ? "Create Account" : "Sign In";
    nameRow.hidden = next !== "signup";
    switchBox.innerHTML = next === "signup"
      ? 'Already have an account? <button type="button" data-auth-mode="signin">Sign In</button>'
      : 'New to Hamdan AI? <button type="button" data-auth-mode="signup">Sign Up</button>';

    const email = $("#authEmail");
    if (email) setTimeout(() => email.focus(), 0);
  }

  function hideAuth(force = false) {
    if (accessRequired && !force && !hasSession()) return;
    const m = modal();
    if (m) m.hidden = true;
    document.body.classList.remove("auth-open");
    accessRequired = false;
  }

  function renderAccount() {
    const signedIn = hasSession();
    const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    const label = $("#accountLabel");
    const avatar = $("#accountAvatar");

    if (signedIn && user) {
      label.textContent = user.name || user.email.split("@")[0];
      avatar.textContent = (user.name || "AH").slice(0, 2).toUpperCase();
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

    setDashboardAccess(signedIn);
  }

  function notify(msg, type = "success") {
    const box = $("#toast");
    if (!box) return;
    box.textContent = msg;
    box.className = `toast show ${type}`;
    setTimeout(() => box.classList.remove("show"), 3000);
  }

  document.addEventListener("click", (e) => {
    const authMode = e.target.closest("[data-auth-mode]");
    if (authMode) {
      showAuth(authMode.dataset.authMode, accessRequired);
      return;
    }
    if (e.target.closest("#signInBtn")) {
      showAuth("signin", false);
      return;
    }
    if (e.target.closest("#signUpBtn")) {
      showAuth("signup", false);
      return;
    }
    if (e.target.closest("#logOutBtn")) {
      localStorage.removeItem(SESSION_KEY);
      renderAccount();
      showAuth("signin", true);
      notify("You have been signed out.");
      return;
    }
    if (e.target.closest("#authClose")) {
      hideAuth();
      return;
    }
    if (e.target === modal() && !accessRequired) hideAuth();
  });

  document.addEventListener("submit", (e) => {
    if (e.target !== form()) return;
    e.preventDefault();

    const email = $("#authEmail").value.trim().toLowerCase();
    const password = $("#authPassword").value;
    const name = $("#authName").value.trim();

    if (!email || !password || (mode === "signup" && !name)) {
      notify("Please complete all required fields.", "error");
      return;
    }
    if (!email.includes("@")) {
      notify("Please enter a valid email address.", "error");
      return;
    }
    if (password.length < 8) {
      notify("Password must contain at least 8 characters.", "error");
      return;
    }

    const existing = JSON.parse(localStorage.getItem(USER_KEY) || "null");

    if (mode === "signup") {
      localStorage.setItem(USER_KEY, JSON.stringify({ name, email }));
      localStorage.setItem(SESSION_KEY, "local-demo-session");
      e.target.reset();
      renderAccount();
      hideAuth(true);
      notify("Account created. Welcome to Hamdan AI!");
      return;
    }

    if (!existing || existing.email !== email) {
      notify("No local account found for this email. Please Sign Up first.", "error");
      return;
    }

    localStorage.setItem(SESSION_KEY, "local-demo-session");
    e.target.reset();
    renderAccount();
    hideAuth(true);
    notify("Signed in successfully.");
  });

  window.addEventListener("DOMContentLoaded", () => {
    const signedIn = hasSession();
    setDashboardAccess(signedIn);
    renderAccount();
    ensurePasswordToggle();
    if (!signedIn) showAuth("signin", true);
  });
})();
