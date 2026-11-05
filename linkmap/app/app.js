import { loadProjects } from "./project.js";
import { loadProjectRecords } from "./records.js";
import { initializeMap } from "./map.js";
import { createPlaceSearch } from "./place-search.js";
import { createPlaceDetails } from "./place-details.js";
import { createProjectSelector } from "./project-selector.js";
import { createRecordConsole, recordLabel } from "./record-console.js";
import { createSidebar } from "./sidebar.js";

const emptyRecords = () => ({ locations: [], regions: [], layers: [], items: [] });
const emptyContext = () => ({ regionID: null, layerID: null, locationAreaID: null });
// Selection and request versions belong to one coordinator, including all record types.
const state = { projects: [], selectedProject: null, records: emptyRecords(), context: emptyContext() };
let requestVersion = 0;
let loaded = false;
let errorNotice;
const sidebar = createSidebar(() => {
  const wasOpen = document.getElementById("record-console").open;
  consoleView.close({ restoreFocus: false });
  return wasOpen;
});
const selector = createProjectSelector(id => {
  const project = state.projects.find(project => project.id === id);
  if (project) {
    selectProject(project);
    sidebar.projectSelected();
  }
}, () => {
  if (window.LinkMapAuth.current.state !== "signed-in") window.LinkMapAuth.retry();
  else if (state.selectedProject) selectProject(state.selectedProject);
  else refreshProjects();
});
const details = createPlaceDetails();
const search = createPlaceSearch(place => {
  revealPlace();
  map.showSelection(place.coordinate, place);
  details.show(place);
}, () => map.region);
const consoleView = createRecordConsole({
  getState: () => state,
  onLocation: inspectLocation,
  onRegion: region => {
    state.context = { regionID: region.id, layerID: null, locationAreaID: null };
    renderMap(false);
  },
  onLayer: selectLayer,
  onVisibilityChange: open => sidebar.setDetailsOpen(open),
});
const map = initializeMap(() => {
  renderMap(true);
  search.ready();
}, location => {
  inspectLocation(location, false);
  consoleView.open("Location", location);
}, regionID => {
  if (state.context.layerID || state.context.regionID === regionID) return;
  state.context.regionID = regionID;
});
map.setPlaceSelectionHandler(place => {
  revealPlace();
  details.show(place);
});

function revealPlace() {
  consoleView.close({ restoreFocus: false });
  sidebar.show("search");
}

for (const [id, kind] of [["project-console", "Project"], ["locations-console", "Locations"], ["regions-console", "Regions"], ["layers-console", "Layers"], ["items-console", "Items"]]) {
  document.getElementById(id).addEventListener("click", () => consoleView.open(kind, kind === "Project" ? state.selectedProject : null));
}
document.getElementById("project-refresh").addEventListener("click", () => {
  if (state.selectedProject) selectProject(state.selectedProject);
});
function inspectLocation(location, focus = true) {
  state.context = { regionID: location.regionID, layerID: null, locationAreaID: location.id };
  renderMap(false);
  if (location.coordinate && focus) map.focusLocation(location);
}

function selectLayer(layer, regionID = null) {
  state.context = { regionID: layer?.regionID || regionID, layerID: null, locationAreaID: null };
  renderMap(false);
}

function renderMap(fit) {
  map.setRecords(state.records, { ...state.context, layerID: null, groundOnly: true }, { fit });
}

function render(message, options = {}) {
  selector.render({ ...state, message, ...options });
  for (const id of ["project-console", "project-refresh", "locations-console", "regions-console", "layers-console", "items-console"]) {
    document.getElementById(id).disabled = !loaded;
  }
}

function clearRecords() {
  loaded = false;
  state.records = emptyRecords();
  state.context = emptyContext();
  map.clearLocations();
  consoleView.close();
  errorNotice?.dismiss();
}

async function selectProject(project) {
  const version = ++requestVersion;
  state.selectedProject = project;
  clearRecords();
  render("Loading project records…", { busy: true });
  try {
    const records = await loadProjectRecords(project);
    if (version !== requestVersion) return;
    state.records = records;
    loaded = true;
    renderMap(true);
    const visible = records.locations.filter(location => location.coordinate).length;
    const skipped = records.locations.length - visible;
    render(`${visible} Location${visible === 1 ? "" : "s"} · ${records.regions.length} Regions · ${records.layers.length} Layers${skipped ? ` · ${skipped} without valid coordinates` : ""}`);
  } catch (error) {
    if (version !== requestVersion) return;
    errorNotice = window.reportCloudKitError(error);
    render("Could not load project records. Try again.", { retryable: true });
  }
}

async function refreshProjects() {
  const version = ++requestVersion;
  state.projects = [];
  state.selectedProject = null;
  clearRecords();
  render("Loading projects…", { busy: true });
  try {
    const projects = await loadProjects();
    if (version !== requestVersion) return;
    state.projects = projects;
    if (projects.length) await selectProject(projects[0]);
    else render("No projects available. Create a project or accept a share in the LinkMap app.");
  } catch (error) {
    if (version !== requestVersion) return;
    errorNotice = window.reportCloudKitError(error);
    render("Could not load projects. Try again.", { retryable: true });
  }
}

function updateAuth(auth) {
  if (auth?.state === "signed-in") { refreshProjects(); return; }
  ++requestVersion;
  state.projects = [];
  state.selectedProject = null;
  clearRecords();
  if (auth?.state === "signed-out") render("Sign in to see your projects.", { signedOut: true });
  else if (!auth || auth.state === "loading") render("Connecting to iCloud…", { busy: true });
  else render("Could not connect to iCloud. Try again.", { retryable: true });
}

window.addEventListener("linkmap-auth", event => updateAuth(event.detail));
updateAuth(window.LinkMapAuth?.current);
