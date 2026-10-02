import { loadProjects } from "./project.js";
import { loadLocations } from "./location.js";
import { initializeMap } from "./map.js";
import { createPlaceSearch } from "./place-search.js";
import { createPlaceDetails } from "./place-details.js";
import { createCoordinates } from "./coordinates.js";
import { createProjectSelector } from "./project-selector.js";

// The only owner of project selection and loaded page data.
const state = { projects: [], selectedProject: null, locations: [] };
let requestVersion = 0;
let errorNotice;
const selector = createProjectSelector(id => {
  const project = state.projects.find(project => project.id === id);
  if (project) selectProject(project);
}, () => {
  if (window.LinkMapAuth.current.state !== "signed-in") window.LinkMapAuth.retry();
  else if (state.selectedProject) selectProject(state.selectedProject);
  else refreshProjects();
});
const details = createPlaceDetails();
const coordinates = createCoordinates(coordinate => {
  search.cancel();
  map.showSelection(coordinate);
  details.show(null);
});
const search = createPlaceSearch(place => {
  map.showSelection(place.coordinate, place);
  coordinates.show(place.coordinate);
  details.show(place);
}, () => map.region);
const map = initializeMap(() => {
  map.setLocations(state.locations);
  search.ready();
  coordinates.ready();
});

function render(message, options = {}) {
  selector.render({ ...state, message, ...options });
}

function clearLocations() {
  state.locations = [];
  map.clearLocations();
  errorNotice?.dismiss();
}

async function selectProject(project) {
  const version = ++requestVersion;
  state.selectedProject = project;
  clearLocations();
  render("Loading Locations…", { busy: true });
  try {
    const locations = await loadLocations(project);
    if (version !== requestVersion) return;
    state.locations = locations;
    map.setLocations(locations);
    const visible = locations.filter(location => location.coordinate).length;
    const skipped = locations.length - visible;
    render(locations.length
      ? `${visible} Location${visible === 1 ? "" : "s"}${skipped ? ` · ${skipped} skipped: missing or invalid coordinates` : ""}`
      : "This project has no Locations.");
  } catch (error) {
    if (version !== requestVersion) { console.error("Previous Location request failed:", error); return; }
    errorNotice = window.reportCloudKitError(error);
    render("Could not load Locations. Try again.", { retryable: true });
  }
}

async function refreshProjects() {
  const version = ++requestVersion;
  state.projects = [];
  state.selectedProject = null;
  clearLocations();
  render("Loading projects…", { busy: true });
  try {
    const projects = await loadProjects();
    if (version !== requestVersion) return;
    state.projects = projects;
    if (projects.length) await selectProject(projects[0]);
    else render("No projects available. Create a project or accept a share in the LinkMap app.");
  } catch (error) {
    if (version !== requestVersion) { console.error("Previous Project request failed:", error); return; }
    errorNotice = window.reportCloudKitError(error);
    render("Could not load projects. Try again.", { retryable: true });
  }
}

function updateAuth(auth) {
  if (auth?.state === "signed-in") {
    refreshProjects();
    return;
  }
  ++requestVersion;
  state.projects = [];
  state.selectedProject = null;
  clearLocations();
  if (auth?.state === "signed-out") render("Sign in to see your projects.", { signedOut: true });
  else if (!auth || auth.state === "loading") render("Connecting to iCloud…", { busy: true });
  else render("Could not connect to iCloud. Try again.", { retryable: true });
}

window.addEventListener("linkmap-auth", event => updateAuth(event.detail));
updateAuth(window.LinkMapAuth?.current);
