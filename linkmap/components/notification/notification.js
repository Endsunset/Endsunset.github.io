(() => {
  "use strict";
  // Each caller owns its notice, so recovery cannot hide another service's error.
  window.showErrorNotification = ({ title, code, message, onRetry = () => window.location.reload() }) => {
    const notice = document.createElement("div");
    notice.className = "error-notification";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    const text = document.createElement("span");
    text.textContent = [title, code, message].filter(Boolean).join(": ");
    const retry = document.createElement("button");
    retry.className = "button button-small button-outline";
    retry.type = "button";
    retry.textContent = "Try again";
    retry.addEventListener("click", onRetry);
    notice.append(text, retry);
    let host = document.querySelector(".error-notifications");
    if (!host) {
      host = document.createElement("div");
      host.className = "error-notifications";
      (document.querySelector(".map-workspace") || document.body).append(host);
    }
    host.append(notice);
    return { dismiss() { notice.remove(); } };
  };
})();
