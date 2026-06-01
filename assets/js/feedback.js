import { db, auth } from "./firebase.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

function initFeedback() {
  const form = document.getElementById("feedbackForm");
  const authMsg = document.getElementById("feedbackAuth");
  const submitBtn = document.getElementById("feedbackSubmitBtn");
  const successMsg = document.getElementById("feedbackSuccess");
  const errorMsg = document.getElementById("feedbackError");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      form?.classList.remove("hidden");
      authMsg?.classList.add("hidden");
    } else {
      form?.classList.add("hidden");
      authMsg?.classList.remove("hidden");
    }
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const category = document.getElementById("feedbackCategory").value;
    const text = document.getElementById("feedbackText").value.trim();

    if (!text) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
    successMsg?.classList.add("hidden");
    errorMsg?.classList.add("hidden");

    try {
      await addDoc(collection(db, "feedback"), {
        uid: user.uid,
        email: user.email,
        category,
        text,
        createdAt: serverTimestamp(),
        status: "unread"
      });

      document.getElementById("feedbackText").value = "";
      successMsg?.classList.remove("hidden");
    } catch (err) {
      console.error(err);
      errorMsg?.classList.remove("hidden");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Feedback";
    }
  });
}

initFeedback();
