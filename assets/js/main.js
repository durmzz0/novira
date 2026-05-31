import { initAuth } from "./auth.js";
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
