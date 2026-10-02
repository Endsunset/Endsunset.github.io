(() => {
  "use strict";

  const panel = document.querySelector("[data-auth]");
  const status = document.querySelector("[data-status]");
  const account = document.querySelector("[data-account]");
  const controls = document.querySelector("[data-auth-controls]");
  const retry = document.querySelector("[data-auth-retry]");
  function render(state, message, identity) {
    if (panel) {
      panel.dataset.state = state;
      panel.setAttribute("aria-busy", String(state === "loading"));
    }
    if (status) status.textContent = message;
    if (controls) controls.hidden = state !== "signed-in" && state !== "signed-out";
    if (retry) retry.hidden = state !== "error";
    if (account) account.hidden = state !== "signed-in";
    const signInLink = document.querySelector('[data-sign-in-link]');
    if (signInLink) signInLink.hidden = state !== 'signed-out';
    const name = identity?.nameComponents;
    if (account) account.textContent = state === "signed-in"
      ? [name?.givenName, name?.familyName].filter(Boolean).join(" ") || "Your iCloud account"
      : "";
  }

  const messages = {
    loading: "Connecting to iCloud…",
    "signed-in": "You’re signed in to iCloud. Use the LinkMap app to work with your projects; web project tools are still in development.",
    "signed-out": "Sign in with your Apple Account to connect to LinkMap.",
    error: "",
    unavailable: ""
  };

  function updateUI({ state, identity }) {
    render(state, messages[state], identity);
  }

  retry?.addEventListener("click", () => {
    if (!window.CloudKit) {
      window.location.reload();
      return;
    }
    window.LinkMapAuth?.retry();
  });
  window.addEventListener("linkmap-auth", event => updateUI(event.detail));
  if (window.LinkMapAuth) updateUI(window.LinkMapAuth.current);
})();
