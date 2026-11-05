// One navigation owner keeps Search and Projects mutually exclusive at every size.
export function createSidebar(onChange = () => {}) {
  const mobile = window.matchMedia("(max-width: 760px)");
  const wide = window.matchMedia("(min-width: 1201px)");
  const buttons = { search: document.getElementById("search-toggle"), projects: document.getElementById("projects-toggle") };
  const panels = { search: document.getElementById("search-panel"), projects: document.getElementById("projects-panel") };
  const sidebar = document.getElementById("app-sidebar");
  let active = mobile.matches ? null : "search";
  let detailsOpen = false;

  function render() {
    const visible = active && (!detailsOpen || wide.matches);
    sidebar.hidden = !visible;
    for (const name of Object.keys(panels)) {
      panels[name].hidden = name !== active;
      buttons[name].setAttribute("aria-expanded", String(!!visible && name === active));
    }
  }

  function show(name, { focus = false } = {}) {
    active = name;
    render();
    if (focus) {
      const input = document.getElementById(name === "search" ? "place-query" : "project-filter");
      (input.disabled ? buttons[name] : input).focus();
    }
  }

  for (const [name, button] of Object.entries(buttons)) {
    button.addEventListener("click", () => {
      const wasInspecting = onChange();
      active = active === name && !wasInspecting ? null : name;
      render();
      button.focus();
    });
  }
  document.getElementById("search-close").addEventListener("click", () => {
    active = null;
    render();
    buttons.search.focus();
  });
  sidebar.addEventListener("keydown", event => {
    if (event.key !== "Escape" || !active) return;
    event.preventDefault();
    const previous = active;
    active = null;
    render();
    buttons[previous].focus();
  });
  mobile.addEventListener("change", () => {
    active = mobile.matches ? null : active || "search";
    render();
  });
  wide.addEventListener("change", render);
  render();

  return {
    show,
    setDetailsOpen(open) { detailsOpen = open; render(); },
    projectSelected() {
      if (!mobile.matches) return;
      active = null;
      render();
      buttons.projects.focus();
    },
  };
}
