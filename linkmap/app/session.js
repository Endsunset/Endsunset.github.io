(() => {
  "use strict";

  const account = document.querySelector("[data-account-link]");
  const signIn = document.getElementById("project-sign-in");

  function updateSignInLink() {
    const destination = new URL("sign-in/", window.location.href);
    destination.searchParams.set("redirect", window.location.pathname + window.location.search + window.location.hash);
    signIn.href = destination.href;
  }

  function updateUI({ state }) {
    account.hidden = state !== "signed-in";
  }

  updateSignInLink();
  window.addEventListener("hashchange", updateSignInLink);
  signIn.addEventListener("click", updateSignInLink);
  window.addEventListener("linkmap-auth", event => updateUI(event.detail));
  if (window.LinkMapAuth) updateUI(window.LinkMapAuth.current);
})();
