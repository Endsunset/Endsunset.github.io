import { loadProjects } from "./project.js";
import { loadProjectRecords } from "./records.js";
import { visibleLocations } from "./map-view.js";
import { initializeMap } from "./map.js";
import { createPlaceSearch } from "./place-search.js";
import { createPlaceDetails } from "./place-details.js";
import { createCoordinates } from "./coordinates.js";
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
const coordinates = createCoordinates(coordinate => {
  search.cancel();
  map.showSelection(coordinate);
  details.show(null);
});
const search = createPlaceSearch(place => {
  revealPlace();
  map.showSelection(place.coordinate, place);
  coordinates.show(place.coordinate);
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
  coordinates.ready();
}, location => {
  inspectLocation(location, false);
  consoleView.open("Location", location);
}, regionID => {
  if (state.context.layerID || state.context.regionID === regionID) return;
  state.context.regionID = regionID;
  renderContext();
});
map.setPlaceSelectionHandler(place => {
  revealPlace();
  if (place.coordinate) coordinates.show(place.coordinate);
  details.show(place);
});

function revealPlace() {
  consoleView.close({ restoreFocus: false });
  sidebar.show("search");
}

const query = document.getElementById("record-query");
const results = document.getElementById("record-results");
const searchStatus = document.getElementById("record-search-status");
const layerPicker = document.getElementById("layer-select");
for (const [id, kind] of [["project-console", "Project"], ["locations-console", "Locations"], ["regions-console", "Regions"], ["layers-console", "Layers"], ["items-console", "Items"]]) {
  document.getElementById(id).addEventListener("click", () => consoleView.open(kind, kind === "Project" ? state.selectedProject : null));
}
layerPicker.addEventListener("change", () => selectLayer(state.records.layers.find(layer => layer.id === layerPicker.value) || null, state.context.regionID));
document.getElementById("map-show-all").addEventListener("click", () => {
  state.context = emptyContext();
  renderMap(false);
  map.showAll();
});
document.getElementById("project-refresh").addEventListener("click", () => {
  if (state.selectedProject) selectProject(state.selectedProject);
});
query.addEventListener("input", renderRecordSearch);
query.addEventListener("keydown", event => {
  if (event.key === "ArrowDown") { event.preventDefault(); results.querySelector("button")?.focus(); }
  if (event.key === "Escape") { query.value = ""; renderRecordSearch(); }
});
results.addEventListener("keydown", event => {
  const buttons = [...results.querySelectorAll("button")];
  const index = buttons.indexOf(document.activeElement);
  if (["ArrowDown", "ArrowUp"].includes(event.key)) {
    event.preventDefault();
    buttons[(index + (event.key === "ArrowDown" ? 1 : buttons.length - 1)) % buttons.length]?.focus();
  }
  if (event.key === "Escape") { query.value = ""; renderRecordSearch(); query.focus(); }
});

function inspectLocation(location, focus = true) {
  state.context = { regionID: location.regionID, layerID: location.layerID, locationAreaID: location.id };
  renderMap(false);
  if (location.coordinate) {
    coordinates.show(location.coordinate);
    if (focus) map.focusLocation(location);
  }
}

function selectLayer(layer, regionID = null) {
  state.context = { regionID: layer?.regionID || regionID, layerID: layer?.id || null, locationAreaID: null };
  renderMap(false);
}

function renderContext() {
  const region = state.records.regions.find(value => value.id === state.context.regionID);
  const layer = state.records.layers.find(value => value.id === state.context.layerID);
  document.getElementById("map-context").textContent = [region ? recordLabel(region) : state.selectedProject && recordLabel(state.selectedProject), layer ? `${recordLabel(layer)} · Level ${layer.level}` : "Map · Level 0"].filter(Boolean).join(" · ");
  const layers = state.records.layers.filter(value => value.regionID === state.context.regionID)
    .sort((a, b) => b.level - a.level || recordLabel(a).localeCompare(recordLabel(b), undefined, { numeric: true }));
  const options = [];
  let baseAdded = false;
  function addOption(value, label) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    options.push(option);
  }
  for (const value of layers) {
    if (!baseAdded && value.level <= 0) { addOption("", "Map · Level 0"); baseAdded = true; }
    addOption(value.id, `${recordLabel(value)} · Level ${value.level}`);
  }
  if (!baseAdded) addOption("", "Map · Level 0");
  layerPicker.replaceChildren(...options);
  layerPicker.value = layer?.id || "";
  layerPicker.disabled = !loaded || !layers.length;
  document.getElementById("map-show-all").disabled = !loaded;
}

function renderMap(fit) {
  map.setRecords(state.records, state.context, { fit });
  renderContext();
}

function renderRecordSearch() {
  results.replaceChildren();
  const normalize = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
  const words = normalize(query.value.trim()).split(/\s+/).filter(Boolean);
  if (!words.length || !loaded) {
    results.hidden = true;
    searchStatus.textContent = loaded ? "Search Locations, Regions, Layers, and Items in this project." : "Choose a project to search its records.";
    return;
  }
  const records = Object.values(state.records).flat().filter(record => {
    const region = state.records.regions.find(value => value.id === record.regionID);
    const layer = state.records.layers.find(value => value.id === record.layerID);
    const text = normalize([recordLabel(record), record.detail, record.type, region?.name, layer?.name, record.type === "Layer" ? record.level : ""].filter(value => value !== undefined).join(" "));
    return words.every(word => text.includes(word));
  });
  for (const record of records.slice(0, 100)) {
    const row = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "place-result";
    button.textContent = `${recordLabel(record)} · ${record.type}`;
    button.addEventListener("click", () => {
      if (record.type === "Location") inspectLocation(record);
      else if (record.type === "Region") { state.context = { regionID: record.id, layerID: null, locationAreaID: null }; renderMap(false); }
      else if (record.type === "Layer") selectLayer(record);
      consoleView.open(record.type, record);
    });
    row.append(button);
    results.append(row);
  }
  results.hidden = !records.length;
  searchStatus.textContent = records.length > 100 ? `${records.length} matches. Showing the first 100; refine your search.`
    : records.length ? `${records.length} matching record${records.length === 1 ? "" : "s"}.` : "No matching records. Try another name or detail.";
}

function render(message, options = {}) {
  selector.render({ ...state, message, ...options });
  for (const id of ["project-console", "project-refresh", "locations-console", "regions-console", "layers-console", "items-console"]) {
    document.getElementById(id).disabled = !loaded;
  }
  query.disabled = !loaded;
  renderContext();
  renderRecordSearch();
}

function clearRecords() {
  loaded = false;
  state.records = emptyRecords();
  state.context = emptyContext();
  query.value = "";
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
    const visible = visibleLocations(records, state.context).filter(location => location.coordinate).length;
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
