const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");
const authMessage = document.getElementById("authMessage");
const passwordStrength = document.getElementById("passwordStrength");

const authSection = document.getElementById("authSection");
const dashboard = document.getElementById("dashboard");
const welcomeMessage = document.getElementById("welcomeMessage");
const logoutButton = document.getElementById("logoutButton");

const runBruteForce = document.getElementById("runBruteForce");
const bruteForceOutput = document.getElementById("bruteForceOutput");

const passwordTester = document.getElementById("passwordTester");
const passwordTestResult = document.getElementById("passwordTestResult");

const xssInput = document.getElementById("xssInput");
const unsafePreview = document.getElementById("unsafePreview");
const safeOutput = document.getElementById("safeOutput");
const runXssDemo = document.getElementById("runXssDemo");

let failedAttempts = 0;
let lockedUntil = null;

document.addEventListener("DOMContentLoaded", () => {
  const currentUser = sessionStorage.getItem("currentUser");

  if (currentUser) {
    showDashboard(currentUser);
  }
});

showRegister.addEventListener("click", () => {
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  showRegister.classList.add("active");
  showLogin.classList.remove("active");
  clearMessage();
});

showLogin.addEventListener("click", () => {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  showLogin.classList.add("active");
  showRegister.classList.remove("active");
  clearMessage();
});

document.getElementById("registerPassword").addEventListener("input", (event) => {
  const result = checkPasswordStrength(event.target.value);
  passwordStrength.textContent = `Password strength: ${result.label}`;
  passwordStrength.className = result.className;
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("registerUsername").value.trim();
  const password = document.getElementById("registerPassword").value;

  if (!username || !password) {
    showMessage("Username and password are required.", "error");
    return;
  }

  const strength = checkPasswordStrength(password);

  if (strength.score < 3) {
    showMessage("Please choose a stronger password before registering.", "error");
    return;
  }

  const users = getUsers();

  if (users[username]) {
    showMessage("That username already exists.", "error");
    return;
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);

  users[username] = {
    username,
    salt,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  localStorage.setItem("cyberDemoUsers", JSON.stringify(users));

  registerForm.reset();
  passwordStrength.textContent = "Password strength: none";
  passwordStrength.className = "";

  showMessage("Account created successfully. You can now log in.", "success");
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isLocked()) {
    const secondsLeft = Math.ceil((lockedUntil - Date.now()) / 1000);
    showMessage(`Too many failed attempts. Try again in ${secondsLeft} seconds.`, "error");
    return;
  }

  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  const users = getUsers();
  const user = users[username];

  if (!user) {
    handleFailedLogin();
    return;
  }

  const attemptedHash = await hashPassword(password, user.salt);

  if (attemptedHash !== user.passwordHash) {
    handleFailedLogin();
    return;
  }

  failedAttempts = 0;
  lockedUntil = null;

  sessionStorage.setItem("currentUser", username);
  showDashboard(username);
});

logoutButton.addEventListener("click", () => {
  sessionStorage.removeItem("currentUser");
  dashboard.classList.add("hidden");
  authSection.classList.remove("hidden");
  showMessage("You have logged out.", "success");
});

runBruteForce.addEventListener("click", () => {
  const fakeGuesses = ["password", "123456", "qwerty", "letmein", "admin123"];
  let output = "Starting brute-force simulation...\n\n";

  fakeGuesses.forEach((guess, index) => {
    output += `Attempt ${index + 1}: Trying "${guess}"... Failed.\n`;
  });

  output += "\nDefense triggered: Account temporarily locked after repeated failed attempts.";
  output += "\nMitigation: Use rate limiting, account lockouts, MFA, and strong password policies.";

  bruteForceOutput.textContent = output;
});

passwordTester.addEventListener("input", () => {
  const password = passwordTester.value;
  const result = checkPasswordStrength(password);

  passwordTestResult.textContent = `Result: ${result.label}`;
  passwordTestResult.className = result.className;
});

runXssDemo.addEventListener("click", () => {
  const userInput = xssInput.value;

  unsafePreview.srcdoc = `
    <body>
      <p>This preview renders the input as HTML, but scripts are blocked by sandbox mode.</p>
      <hr>
      ${userInput}
    </body>
  `;

  safeOutput.textContent = escapeHTML(userInput);
});

function getUsers() {
  return JSON.parse(localStorage.getItem("cyberDemoUsers")) || {};
}

function showDashboard(username) {
  authSection.classList.add("hidden");
  dashboard.classList.remove("hidden");
  welcomeMessage.textContent = `Welcome, ${username}. You are now viewing the cybersecurity dashboard.`;
  clearMessage();
}

function showMessage(message, type) {
  authMessage.textContent = message;
  authMessage.className = type;
}

function clearMessage() {
  authMessage.textContent = "";
  authMessage.className = "";
}

function handleFailedLogin() {
  failedAttempts++;

  if (failedAttempts >= 3) {
    lockedUntil = Date.now() + 15000;
    showMessage("Too many failed attempts. Account locked for 15 seconds.", "error");
  } else {
    showMessage(`Invalid login. Failed attempts: ${failedAttempts}/3`, "error");
  }
}

function isLocked() {
  if (!lockedUntil) {
    return false;
  }

  if (Date.now() > lockedUntil) {
    lockedUntil = null;
    failedAttempts = 0;
    return false;
  }

  return true;
}

function checkPasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (!password) {
    return {
      score: 0,
      label: "none",
      className: ""
    };
  }

  if (score <= 2) {
    return {
      score,
      label: "weak",
      className: "error"
    };
  }

  if (score === 3 || score === 4) {
    return {
      score,
      label: "moderate",
      className: ""
    };
  }

  return {
    score,
    label: "strong",
    className: "success"
  };
}

function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);

  return Array.from(array)
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

function escapeHTML(input) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}