(() => {
  "use strict";

  const panel = document.querySelector("[data-auth]");
  const status = document.querySelector("[data-status]");
  const controls = document.querySelector("[data-auth-controls]");
  const retry = document.querySelector("[data-auth-retry]");
  const home = new URL("../", window.location.href);
  let destination = home.href;
  const redirect = new URL(window.location.href).searchParams.get("redirect");
  if (redirect) {
    try {
      const target = new URL(redirect, window.location.href);
      // Keep returns within this site and avoid redirecting back to sign-in.
      if (target.origin === home.origin && target.pathname.startsWith(home.pathname)
          && target.pathname !== new URL("./", window.location.href).pathname
          && target.pathname !== new URL("index.html", window.location.href).pathname) {
        destination = target.href;
      }
    } catch {
      // Invalid return URLs use the homepage.
    }
  }
  const messages = {
    loading: "Checking your sign-in status…",
    "signed-out": "",
    error: "",
    unavailable: ""
  };

  function updateUI({ state }) {
    if (state === "signed-in") {
      window.location.replace(destination);
      return;
    }
    panel.dataset.state = state;
    panel.setAttribute("aria-busy", String(state === "loading"));
    status.textContent = messages[state];
    status.hidden = state === "signed-out";
    controls.hidden = state !== "signed-out";
    retry.hidden = state !== "error";
  }

  retry.addEventListener("click", () => {
    if (!window.CloudKit) {
      window.location.reload();
      return;
    }
    window.LinkMapAuth?.retry();
  });
  window.addEventListener("linkmap-auth", event => updateUI(event.detail));
  if (window.LinkMapAuth) updateUI(window.LinkMapAuth.current);
})();
