import { initAuth } from "./auth.js";
import { db } from "./firebase.js";
import { getCountFromServer, collection } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

async function loadUserCount() {
  try {
    const snap = await getCountFromServer(collection(db, "users"));
    const count = snap.data().count;
    const el = document.getElementById("userCountText");
    if (el) el.textContent = `${count}+ users already on board`;
  } catch {
    const el = document.getElementById("userCountText");
    if (el) el.textContent = "Join the growing community";
  }
}
loadUserCount();
import {
  closeAuthModal,
  closeLegalModal,
  closePaymentModal,
  openAuthModal,
  openLegalModal,
  openPaymentModal,
  scrollToBtcpay,
  switchAuthMode,
  toggleAuthModal,
} from "./modals.js";

window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.toggleAuthModal = toggleAuthModal;
window.switchAuthMode = switchAuthMode;
window.openPaymentModal = openPaymentModal;
window.closePaymentModal = closePaymentModal;
window.openLegalModal = openLegalModal;
window.closeLegalModal = closeLegalModal;
window.scrollToBtcpay = scrollToBtcpay;

try {
  initAuth();
} catch (err) {
  console.error("Auth initialization failed:", err);
}


