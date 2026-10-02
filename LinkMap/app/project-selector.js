export function createProjectSelector(onSelect, onRetry) {
  const select = document.getElementById("project-select");
  const status = document.getElementById("project-status");
  const retry = document.getElementById("project-retry");
  const signIn = document.getElementById("project-sign-in");
  select.addEventListener("change", () => onSelect(select.value));
  retry.addEventListener("click", onRetry);

  return {
    render({ projects, selectedProject, message, busy = false, retryable = false, signedOut = false }) {
      const options = projects.map(project => {
        const option = document.createElement("option");
        option.value = project.id;
        option.textContent = (project.name || "New Project") + (project.databaseScope === "shared" ? " · Shared" : "");
        return option;
      });
      if (!options.length) {
        const placeholder = document.createElement("option");
        placeholder.textContent = busy ? "Loading projects…" : "No projects available";
        placeholder.value = "";
        options.push(placeholder);
      }
      select.replaceChildren(...options);
      select.value = selectedProject?.id || "";
      select.disabled = !projects.length;
      status.textContent = message;
      status.setAttribute("aria-busy", String(busy));
      retry.hidden = !retryable;
      signIn.hidden = !signedOut;
    }
  };
}
