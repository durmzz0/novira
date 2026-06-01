import { legalData } from "./legal.js";

const authModal = document.getElementById("authModal");
const paymentModal = document.getElementById("paymentModal");
const legalModal = document.getElementById("legalModal");
const signupTermsModal = document.getElementById("signupTermsModal");

let signupTermsAcceptCallback = null;

export function openAuthModal(mode = "signup") {
  if (!authModal) return;
  setAuthMode(mode);
  authModal.classList.remove("hidden");
  document.body.classList.add("modal-active");
}

export function closeAuthModal() {
  if (!authModal) return;
  authModal.classList.add("hidden");
  resetAuthFlow();
  syncBodyScrollLock();
}

export function toggleAuthModal(mode = "signup") {
  if (!authModal) return;
  if (authModal.classList.contains("hidden")) openAuthModal(mode);
  else closeAuthModal();
}

export function setAuthMode(mode) {
  const modeInput = document.getElementById("authMode");
  const signupFields = document.getElementById("signupFields");
  if (!modeInput || !signupFields) return;

  modeInput.value = mode;
  clearAuthError();
  resetAuthFlow();

  const isSignup = mode === "signup";
  const isSignin = mode === "signin";
  const isReset = mode === "reset";

  signupFields.classList.toggle("hidden", !isSignup);
  document.getElementById("signinPasswordField")?.classList.toggle("hidden", !isSignin);

  if (isReset) {
    document.getElementById("switchText").innerText = "Remember your password?";
    document.getElementById("switchBtn").innerText = "Sign In Here";
  } else {
    document.getElementById("switchText").innerText = isSignup
      ? "Already registered?"
      : "New profile activation required?";

    document.getElementById("switchBtn").innerText = isSignup
      ? "Sign In Here"
      : "Create Profile";
  }

  const signinPasswordInput = document.querySelector('[name="signinPassword"]');
  if (signinPasswordInput) signinPasswordInput.required = isSignin;

  document.getElementById("emailCodeField")?.classList.toggle("hidden", isSignin);
  document.getElementById("verifyEmailRow")?.classList.toggle("hidden", isSignin);

  document.getElementById("authStepDot3")?.classList.toggle("hidden", !isReset);
  document.getElementById("authStepLine2")?.classList.toggle("hidden", !isReset);
  document.getElementById("authStepLabel3")?.classList.toggle("hidden", !isReset);

  const titles = {
    signup: "Create Your Corporate Account",
    signin: "Access Software Terminal Node",
    reset: "Reset Your Password",
  };
  const descs = {
    signup: "Verify your email to activate your Novira profile.",
    signin: "Sign in with your email and password.",
    reset: "We will send a verification code to your email.",
  };

  document.getElementById("modalTitle").innerText = titles[mode] || titles.signup;
  document.getElementById("modalDesc").innerText = descs[mode] || descs.signup;

  document.getElementById("authStepLabel1").innerText = isReset ? "Email" : "Contact Info";
  document.getElementById("authStepLabel2").innerText = isReset ? "Verification" : "Verification";

  document.getElementById("authSendBtn").innerHTML = isSignup
    ? '<i class="fa-solid fa-paper-plane"></i>Send Verification Code'
    : isReset
      ? '<i class="fa-solid fa-envelope"></i>Send Verification Code'
      : '<i class="fa-solid fa-right-to-bracket"></i>Sign In';

  document.getElementById("authVerifyBtn").innerHTML = isSignup
    ? '<i class="fa-solid fa-shield-check"></i>Verify &amp; Create Account'
    : '<i class="fa-solid fa-shield-check"></i>Verify Code';

  if (isSignup) {
    const birthInput = document.querySelector('[name="birthDate"]');
    if (birthInput) {
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() - 18);
      birthInput.max = maxDate.toISOString().slice(0, 10);
    }
  }

  updateStepIndicator(1);
}

export function switchAuthMode() {
  const current = document.getElementById("authMode")?.value || "signup";
  if (current === "reset") {
    setAuthMode("signin");
    return;
  }
  setAuthMode(current === "signup" ? "signin" : "signup");
}

export function showAuthStep(step) {
  document.getElementById("authStep1")?.classList.toggle("hidden", step !== 1);
  document.getElementById("authStep2")?.classList.toggle("hidden", step !== 2);
  document.getElementById("authStep3")?.classList.toggle("hidden", step !== 3);
  updateStepIndicator(step);
}

export function updateStepIndicator(step) {
  const mode = document.getElementById("authMode")?.value || "signup";
  const maxSteps = mode === "reset" ? 3 : 2;

  document.querySelectorAll(".auth-step-dot").forEach((dot) => {
    const dotStep = Number(dot.dataset.step);
    if (dotStep > maxSteps) return;

    dot.classList.remove("active", "done");
    if (dotStep < step) dot.classList.add("done");
    if (dotStep === step) dot.classList.add("active");
  });

  document.getElementById("authStepLine1")?.classList.toggle("active", step >= 2);
  document.getElementById("authStepLine2")?.classList.toggle("active", step >= 3);
}

export function resetAuthFlow() {
  showAuthStep(1);
  document.getElementById("authCredentialsForm")?.reset();
  document.getElementById("authVerifyForm")?.reset();
  document.getElementById("authResetForm")?.reset();
}

export function setVerifyLabels(email) {
  const emailEl = document.getElementById("verifyEmailLabel");
  if (emailEl) emailEl.textContent = email;
}

export function setResetEmailLabel(email) {
  const el = document.getElementById("resetEmailLabel");
  if (el) el.textContent = email;
}

export function openPaymentModal(planName, price) {
  if (!paymentModal) return;
  document.getElementById("selectedPlanLabel").innerText = `${planName} Activation — Total: $${price}`;
  paymentModal.classList.remove("hidden");
  document.body.classList.add("modal-active");
}

export function closePaymentModal() {
  if (!paymentModal) return;
  paymentModal.classList.add("hidden");
  syncBodyScrollLock();
}

export function openLegalModal(type) {
  if (!legalModal) return;
  document.getElementById("legalModalTitle").innerText = legalData[type].title;
  document.getElementById("legalModalContent").innerHTML = legalData[type].body;
  legalModal.classList.remove("hidden");
  document.body.classList.add("modal-active");
}

export function closeLegalModal() {
  if (!legalModal) return;
  legalModal.classList.add("hidden");
  syncBodyScrollLock();
}

export function openSignupTermsModal(onAccept) {
  if (!signupTermsModal) return;
  signupTermsAcceptCallback = onAccept;
  document.getElementById("signupTermsTitle").innerText = legalData.terms.title;
  document.getElementById("signupTermsContent").innerHTML = legalData.terms.body;

  signupTermsModal.classList.remove("hidden");

  const acceptBtn = document.getElementById("signupTermsAccept");
  const checkTerms = document.getElementById("checkTerms");
  const checkPrivacy = document.getElementById("checkPrivacy");
  const checkRisk = document.getElementById("checkRisk");

  if (checkTerms) checkTerms.checked = false;
  if (checkPrivacy) checkPrivacy.checked = false;
  if (checkRisk) checkRisk.checked = false;
  if (acceptBtn) acceptBtn.setAttribute("disabled", "true");

  function updateAcceptBtn() {
    if (checkTerms?.checked && checkPrivacy?.checked && checkRisk?.checked) {
      acceptBtn?.removeAttribute("disabled");
    } else {
      acceptBtn?.setAttribute("disabled", "true");
    }
  }

  checkTerms?.addEventListener("change", updateAcceptBtn);
  checkPrivacy?.addEventListener("change", updateAcceptBtn);
  checkRisk?.addEventListener("change", updateAcceptBtn);
  document.body.classList.add("modal-active");
}

export function closeSignupTermsModal() {
  if (!signupTermsModal) return;
  signupTermsModal.classList.add("hidden");
  signupTermsAcceptCallback = null;
  syncBodyScrollLock();
}

export function scrollToBtcpay(planName, price) {
  const label = document.getElementById("homePlanLabel");
  if (label) {
    label.textContent = `${planName} — $${price} / monthly`;
  }
  document.getElementById("btcpay")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function initSignupTermsModal() {
  document.getElementById("signupTermsAccept")?.addEventListener("click", () => {
    const callback = signupTermsAcceptCallback;
    closeSignupTermsModal();
    callback?.();
  });

  document.getElementById("signupTermsDecline")?.addEventListener("click", closeSignupTermsModal);
  document.getElementById("signupTermsBackdrop")?.addEventListener("click", closeSignupTermsModal);
}

initSignupTermsModal();

function syncBodyScrollLock() {
  const anyOpen =
    (authModal && !authModal.classList.contains("hidden")) ||
    (paymentModal && !paymentModal.classList.contains("hidden")) ||
    (legalModal && !legalModal.classList.contains("hidden")) ||
    (signupTermsModal && !signupTermsModal.classList.contains("hidden"));

  document.body.classList.toggle("modal-active", anyOpen);
}

export function showAuthError(message) {
  const el = document.getElementById("authError");
  if (!el) return;
  el.textContent = message;
  el.classList.add("visible");
}

export function clearAuthError() {
  const el = document.getElementById("authError");
  if (!el) return;
  el.textContent = "";
  el.classList.remove("visible");
}

export function setAuthLoading(loading, buttonId) {
  const btn = document.getElementById(buttonId);
  if (btn) btn.disabled = loading;
}

document.addEventListener("novira:auth-open", (e) => {
  setAuthMode(e.detail?.mode || "signup");
});

document.addEventListener("novira:auth-close", resetAuthFlow);
