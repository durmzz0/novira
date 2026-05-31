(function () {
  function openAuthModal(mode) {
    const modal = document.getElementById("authModal");
    if (!modal) return;

    const modeInput = document.getElementById("authMode");
    if (modeInput && mode) modeInput.value = mode;

    modal.classList.remove("hidden");
    document.body.classList.add("modal-active");
    document.dispatchEvent(
      new CustomEvent("novira:auth-open", { detail: { mode: mode || "signup" } })
    );
  }

  function closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (!modal) return;

    modal.classList.add("hidden");
    document.body.classList.remove("modal-active");
    document.dispatchEvent(new CustomEvent("novira:auth-close"));
  }

  function toggleAuthModal(mode) {
    const modal = document.getElementById("authModal");
    if (!modal) return;

    if (modal.classList.contains("hidden")) openAuthModal(mode);
    else closeAuthModal();
  }

  function bindTriggers() {
    document.querySelectorAll("[data-auth-open]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openAuthModal(btn.dataset.authOpen || "signup");
      });
    });

    document.querySelectorAll("[data-auth-close]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        closeAuthModal();
      });
    });
  }

  window.openAuthModal = openAuthModal;
  window.closeAuthModal = closeAuthModal;
  window.toggleAuthModal = toggleAuthModal;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindTriggers);
  } else {
    bindTriggers();
  }
})();
