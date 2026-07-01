import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { auth, db } from "./firebase.js";
import {
  clearAuthError,
  closeAuthModal,
  openSignupTermsModal,
  resetAuthFlow,
  setAuthLoading,
  setAuthMode,
  setResetEmailLabel,
  setVerifyLabels,
  showAuthError,
  showAuthStep,
} from "./modals.js";
import {
  sendEmailCode,
  sendSignupCodes,
  resetPassword,
  verifyEmailCode,
} from "./verify-api.js";

const guestActions = document.getElementById("guestActions");
const userActions = document.getElementById("userActions");
const userDisplayNameEl = document.getElementById("userDisplayName");
const heroSignupBtn = document.getElementById("heroSignupBtn");
const heroDownloadBtn = document.getElementById("heroDownloadBtn");
const heroDownloadHint = document.getElementById("heroDownloadHint");

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function formatDisplayName(data, fallbackEmail) {
  const first = data?.firstName?.trim();
  const last = data?.lastName?.trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  return fallbackEmail || "";
}

function updateHeroDownload(isLoggedIn) {
  if (!heroSignupBtn || !heroDownloadBtn || !heroDownloadHint) return;

  const android = isAndroid();

  if (!isLoggedIn) {
    heroSignupBtn.classList.remove("hidden");
    heroDownloadBtn.classList.add("hidden");
    heroDownloadHint.classList.add("hidden");
    return;
  }

  heroSignupBtn.classList.add("hidden");

  if (android) {
    heroDownloadBtn.classList.remove("hidden");
    heroDownloadHint.classList.add("hidden");
  } else {
    heroDownloadBtn.classList.add("hidden");
    heroDownloadHint.classList.remove("hidden");
  }
}

async function updateAuthUI(user) {
  if (user) {
    guestActions.classList.add("hidden");
    userActions.classList.remove("hidden");

    let displayName = user.email;
    try {
      const snapshot = await getDoc(doc(db, "users", user.uid));
      if (snapshot.exists()) {
        displayName = formatDisplayName(snapshot.data(), user.email);
      }
    } catch {
      displayName = user.email;
    }

    userDisplayNameEl.textContent = displayName;
    userDisplayNameEl.classList.remove("hidden");
    updateHeroDownload(true);
  } else {
    guestActions.classList.remove("hidden");
    userActions.classList.add("hidden");
    userDisplayNameEl.textContent = "";
    userDisplayNameEl.classList.add("hidden");
    updateHeroDownload(false);
  }
}

let pendingAuth = {
  email: "",
  password: "",
  emailCode: "",
  firstName: "",
  lastName: "",
  birthDate: "",
  phone: "",
};

function mapFirebaseError(code) {
  const messages = {
    "auth/email-already-in-use": "This email address is already registered.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/requires-recent-login": "Sign in again to update your password.",
  };
  return messages[code] || "Authentication failed. Please try again.";
}

function formatPhone(input) {
  if (!input || !String(input).trim()) {
    throw new Error("Enter a phone number.");
  }

  let digits = String(input).trim().replace(/\D/g, "");

  if (digits.startsWith("90") && digits.length >= 12) {
    digits = digits.slice(0, 12);
  } else if (digits.startsWith("0") && digits.length >= 11) {
    digits = "90" + digits.slice(1, 11);
  } else if (digits.startsWith("5") && digits.length >= 10) {
    digits = "90" + digits.slice(0, 10);
  } else if (digits.length >= 10) {
    digits = "90" + digits.slice(-10);
  }

  if (!/^90[5][0-9]{9}$/.test(digits)) {
    throw new Error("Enter a valid Turkish mobile number (05XX or 5XX).");
  }

  return "+" + digits;
}

function isAtLeast18(birthDateStr) {
  const birth = new Date(birthDateStr + "T00:00:00");
  if (Number.isNaN(birth.getTime())) return false;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 18;
}

function validateSignupForm(form) {
  const firstName = form.firstName?.value?.trim() || "";
  const lastName = form.lastName?.value?.trim() || "";
  const birthDate = form.birthDate?.value || "";
  const email = form.email?.value?.trim() || "";
  const phone = form.phone?.value?.trim() || "";
  const password = form.password?.value || "";

  if (!firstName) return "First name is required.";
  if (!lastName) return "Last name is required.";
  if (!birthDate) return "Date of birth is required.";
  if (!isAtLeast18(birthDate)) return "You must be at least 18 years old to register.";
  if (!email) return "Email address is required.";
  if (password.length < 6) return "Password must be at least 6 characters.";

  let formattedPhone;
  try {
    formattedPhone = formatPhone(phone);
  } catch (err) {
    return err.message;
  }

  return {
    firstName,
    lastName,
    birthDate,
    email,
    password,
    phone: formattedPhone,
  };
}

function buildUserDoc({ email, firstName, lastName, birthDate, phone }) {
  const now = new Date().toISOString();
  return {
    email,
    firstName,
    lastName,
    birthDate,
    waPhone: phone,
    isAdmin: false,
    isBanned: false,
    tier: "FREE",
    subscriptionEnd: null,
    streak: 0,
    totalPnl: 0,
    deviceId: null,
    deviceName: null,
    badges: [],
    waEnabled: false,
    createdAt: now,
    updatedAt: now,
  };
}

async function registerVerifiedUser(profile) {
  const credential = await createUserWithEmailAndPassword(auth, profile.email, profile.password);
  await setDoc(doc(db, "users", credential.user.uid), buildUserDoc(profile));
}

async function applyPasswordReset(email, emailCode, newPassword) {
  await resetPassword(email, emailCode);

  const current = auth.currentUser;
  if (current?.email?.toLowerCase() === email.toLowerCase()) {
    await updatePassword(current, newPassword);
    return;
  }

  await signInWithEmailAndPassword(auth, email, newPassword);
}

async function sendSignupVerification(profile) {
  setAuthLoading(true, "authSendBtn");
  try {
    const trimmedEmail = await sendSignupCodes(profile.email);
    pendingAuth = { ...profile, email: trimmedEmail, emailCode: "" };
    setVerifyLabels(trimmedEmail);
    showAuthStep(2);
  } catch (err) {
    showAuthError(err.message);
  } finally {
    setAuthLoading(false, "authSendBtn");
  }
}

export function initAuth() {
  heroDownloadBtn?.addEventListener("click", (e) => {
    if (!auth.currentUser || !isAndroid()) {
      e.preventDefault();
    }
  });

  onAuthStateChanged(auth, updateAuthUI);

  document.getElementById("forgotPasswordBtn")?.addEventListener("click", () => {
    setAuthMode("reset");
  });

  document.getElementById("authCredentialsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAuthError();

    const mode = document.getElementById("authMode").value;
    const email = e.target.email.value.trim();
    const signinPassword = e.target.signinPassword?.value || "";

    if (mode === "signup") {
      const validation = validateSignupForm(e.target);
      if (typeof validation === "string") {
        showAuthError(validation);
        return;
      }

      openSignupTermsModal(() => sendSignupVerification(validation));
      return;
    }

    if (!email) {
      showAuthError("Email address is required.");
      return;
    }

    if (mode === "reset") {
      setAuthLoading(true, "authSendBtn");
      try {
        await sendPasswordResetEmail(auth, email);
        showAuthError("Password reset email sent. Please check your inbox.");
      } catch (err) {
        showAuthError(mapFirebaseError(err.code) || "Failed to send reset email.");
      } finally {
        setAuthLoading(false, "authSendBtn");
      }
      return;
    }

    if (!signinPassword) {
      showAuthError("Enter your password.");
      return;
    }

    setAuthLoading(true, "authSendBtn");
    try {
      await signInWithEmailAndPassword(auth, email, signinPassword);
      e.target.reset();
      resetAuthFlow();
      closeAuthModal();
    } catch (err) {
      showAuthError(mapFirebaseError(err.code));
    } finally {
      setAuthLoading(false, "authSendBtn");
    }
  });

  document.getElementById("authVerifyForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAuthError();

    const mode = document.getElementById("authMode").value;
    setAuthLoading(true, "authVerifyBtn");

    try {
      if (mode === "signup") {
        const emailCode = e.target.emailCode.value.trim();

        if (emailCode.length !== 6) {
          showAuthError("Enter the 6-digit email code.");
          return;
        }

        const ok = await verifyEmailCode(pendingAuth.email, emailCode);
        if (!ok) {
          showAuthError("Invalid email verification code.");
          return;
        }

        await registerVerifiedUser(pendingAuth);
        e.target.reset();
        resetAuthFlow();
        closeAuthModal();
        return;
      }

      if (mode === "reset") {
        const emailCode = e.target.emailCode.value.trim();
        if (emailCode.length !== 6) {
          showAuthError("Enter the 6-digit email code.");
          return;
        }

        const ok = await verifyEmailCode(pendingAuth.email, emailCode);
        if (!ok) {
          showAuthError("Invalid email verification code.");
          return;
        }

        pendingAuth.emailCode = emailCode;
        setResetEmailLabel(pendingAuth.email);
        showAuthStep(3);
      }
    } catch (err) {
      showAuthError(mapFirebaseError(err.code) || err.message);
    } finally {
      setAuthLoading(false, "authVerifyBtn");
    }
  });

  document.getElementById("authResetForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAuthError();

    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (newPassword.length < 6) {
      showAuthError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAuthError("Passwords do not match.");
      return;
    }

    setAuthLoading(true, "authResetBtn");

    try {
      await applyPasswordReset(pendingAuth.email, pendingAuth.emailCode, newPassword);
      e.target.reset();
      resetAuthFlow();
      closeAuthModal();
    } catch (err) {
      showAuthError(mapFirebaseError(err.code) || err.message);
    } finally {
      setAuthLoading(false, "authResetBtn");
    }
  });

  document.getElementById("authBackBtn").addEventListener("click", () => {
    clearAuthError();
    showAuthStep(1);
  });

  document.getElementById("authBackBtnStep3").addEventListener("click", () => {
    clearAuthError();
    showAuthStep(2);
  });

  document.getElementById("signOutBtn").addEventListener("click", async () => {
    try {
      await signOut(auth);
    } catch {
      showAuthError("Could not sign out. Please try again.");
    }
  });
}
