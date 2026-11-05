export function createProjectSelector(onSelect, onRetry) {
  const list = document.getElementById("project-list");
  const filter = document.getElementById("project-filter");
  const status = document.getElementById("project-status");
  const retry = document.getElementById("project-retry");
  const signIn = document.getElementById("project-sign-in");
  const openProject = document.getElementById("project-console");
  let projects = [], selectedProject;

  function renderList() {
    const focusedProjectID = document.activeElement?.dataset?.projectId;
    const query = filter.value.trim().toLocaleLowerCase();
    const visible = projects.filter(project => (project.name || "New Project").toLocaleLowerCase().includes(query));
    const rows = visible.map(project => {
      const row = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "project-choice";
      button.textContent = project.name || "New Project";
      button.dataset.projectId = project.id;
      if (project.id === selectedProject?.id) button.setAttribute("aria-current", "true");
      if (project.databaseScope === "shared") {
        const shared = document.createElement("span");
        shared.className = "project-sharing";
        shared.textContent = "Shared";
        button.append(shared);
      }
      button.addEventListener("click", () => {
        onSelect(project.id);
      });
      row.append(button);
      return row;
    });
    if (projects.length && !visible.length) {
      const empty = document.createElement("li");
      empty.className = "inspector-status";
      empty.textContent = "No matching projects.";
      rows.push(empty);
    }
    list.replaceChildren(...rows);
    if (focusedProjectID) {
      [...list.querySelectorAll("button")].find(button => button.dataset.projectId === focusedProjectID)?.focus();
    }
  }

  filter.addEventListener("input", renderList);
  filter.addEventListener("keydown", event => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      list.querySelector("button")?.focus();
    }
    if (event.key === "Escape") { filter.value = ""; renderList(); }
  });
  retry.addEventListener("click", onRetry);

  return {
    render({ projects: nextProjects, selectedProject: nextSelected, message, busy = false, retryable = false, signedOut = false }) {
      projects = nextProjects;
      selectedProject = nextSelected;
      filter.disabled = !projects.length;
      openProject.disabled = !selectedProject;
      renderList();
      status.textContent = message;
      status.setAttribute("aria-busy", String(busy));
      retry.hidden = !retryable;
      signIn.hidden = !signedOut;
    }
  };
}
