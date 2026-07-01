import { verifyApiBaseUrl } from "./config.js";

function mapVerifyError(message) {
  if (!message) return "Verification service error. Please try again.";
  if (message.includes("Delivery channel disabled: EMAIL")) {
    return "Email verification is temporarily unavailable. Please try again later or contact support.";
  }
  if (message.includes("Max send attempts reached")) {
    return "Too many code requests. Please wait a few minutes and try again.";
  }
  if (message.includes("Brevo")) {
    return "Could not send email verification code. Please try again later.";
  }
  return message;
}

async function post(path, body) {
  const res = await fetch(`${verifyApiBaseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(mapVerifyError(data.error) || `Verification service error (HTTP ${res.status}).`);
  }

  return data;
}

export function sendVerification(to) {
  return post("/verify/send", { to: to.trim() });
}

export function checkVerification(to, code) {
  return post("/verify/check", { to: to.trim(), code: code.trim() });
}

export async function sendEmailCode(email) {
  const trimmed = email.trim();
  await sendVerification(trimmed);
  return trimmed;
}

export async function sendSignupCodes(email) {
  return sendEmailCode(email);
}

export async function verifyEmailCode(email, code) {
  const result = await checkVerification(email, code);
  return result.ok === true && result.status === "approved";
}

export function resetPassword(email, code, newPassword) {
  return post("/verify/reset-password", {
    email: email.trim(),
    code: code.trim(),
    newPassword: newPassword,
  });
}
