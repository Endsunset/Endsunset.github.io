export function recordLabel(record) {
  return record.name || `New ${record.type || "Project"}`;
}

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

// A modeless sheet leaves the map usable, like the native Console.
export function createRecordConsole({ getState, onLocation, onRegion, onLayer }) {
  const dialog = document.getElementById("record-console");
  const title = document.getElementById("console-title");
  const content = document.getElementById("console-content");
  const back = document.getElementById("console-back");
  const close = document.getElementById("console-close");
  let history = [];
  let returnFocus;

  function button(label, action, className = "console-row") {
    const control = node("button", label, className);
    control.type = "button";
    control.addEventListener("click", action);
    return control;
  }

  function fields(values) {
    const list = node("dl", undefined, "record-fields");
    for (const [label, value] of values) {
      list.append(node("dt", label), node("dd", String(value)));
    }
    content.append(list);
  }

  function list(records, empty = "No records available.") {
    if (!records.length) { content.append(node("p", empty, "inspector-status")); return; }
    const rows = node("div", undefined, "console-rows");
    for (const record of records) rows.append(button(recordLabel(record), () => inspect(record)));
    content.append(rows);
  }

  function navigate(kind, record = null, members = null) {
    history.push({ kind, record, members });
    render();
  }

  function inspect(record) {
    if (record.type === "Location") onLocation(record);
    else if (record.type === "Region") onRegion(record);
    else if (record.type === "Layer") onLayer(record);
    navigate(record.type || "Project", record);
  }

  function render() {
    const { selectedProject: project, records } = getState();
    const view = history.at(-1);
    if (!view || !project) return;
    const { kind, record } = view;
    title.textContent = record ? recordLabel(record) : kind;
    back.hidden = history.length < 2;
    content.replaceChildren();

    if (kind === "Project") {
      content.append(node("p", project.databaseScope === "shared" ? "Shared project" : "Private project", "record-summary"));
      for (const [label, key] of [["Locations", "locations"], ["Regions", "regions"], ["Layers", "layers"], ["Items", "items"]]) {
        content.append(button(`${label} · ${records[key].length}`, () => navigate(label)));
      }
    } else if (["Locations", "Regions", "Layers", "Items"].includes(kind)) {
      list(view.members || records[kind.toLowerCase()], `No ${kind.toLowerCase()} in this project.`);
    } else if (kind === "Location") {
      const region = records.regions.find(value => value.id === record.regionID);
      const layer = records.layers.find(value => value.id === record.layerID);
      content.append(node("p", [region && recordLabel(region), layer && `${recordLabel(layer)} · Level ${layer.level}`].filter(Boolean).join(" · ") || "Project Location", "record-summary"));
      const actions = node("div", undefined, "console-actions");
      if (record.coordinate) {
        actions.append(button("Show on map", () => onLocation(record), "button button-small button-outline"));
        const directions = node("a", "Directions", "button button-small button-outline");
        const pair = `${record.coordinate.latitude},${record.coordinate.longitude}`;
        directions.href = `https://maps.apple.com/?daddr=${encodeURIComponent(pair)}&q=${encodeURIComponent(recordLabel(record))}`;
        directions.target = "_blank";
        directions.rel = "noopener noreferrer";
        actions.append(directions);
        fields([["Coordinates", pair], ["Area vertices", record.vertices.length]]);
      } else {
        content.append(node("p", "This Location has no valid map coordinate.", "inspector-status"));
        fields([["Area vertices", record.vertices.length]]);
      }
      content.append(actions);
      if (record.detail) content.append(node("h3", "About"), node("p", record.detail, "record-description"));
      if (region) content.append(button(`Region · ${recordLabel(region)}`, () => inspect(region)));
      if (layer) content.append(button(`Layer · ${recordLabel(layer)}`, () => inspect(layer)));
    } else if (kind === "Region") {
      const locations = records.locations.filter(value => value.regionID === record.id);
      const layers = records.layers.filter(value => value.regionID === record.id)
        .sort((a, b) => b.level - a.level || recordLabel(a).localeCompare(recordLabel(b), undefined, { numeric: true }));
      content.append(button(`Locations · ${locations.length}`, () => navigate("Locations", null, locations)));
      content.append(node("h3", "Layers"));
      let baseAdded = false;
      const baseMap = () => button("Map · Level 0", () => onLayer(null, record.id));
      for (const layer of layers) {
        if (!baseAdded && layer.level <= 0) { content.append(baseMap()); baseAdded = true; }
        content.append(button(`${recordLabel(layer)} · Level ${layer.level}`, () => inspect(layer)));
      }
      if (!baseAdded) content.append(baseMap());
    } else if (kind === "Layer") {
      const locations = records.locations.filter(value => value.layerID === record.id);
      const region = records.regions.find(value => value.id === record.regionID);
      fields([["Name", recordLabel(record)], ["Level", record.level], ["Locations", locations.length]]);
      content.append(button("Show layer on map", () => onLayer(record), "button button-small button-outline"));
      if (region) content.append(button(`Region · ${recordLabel(region)}`, () => inspect(region)));
      content.append(node("h3", "Locations"));
      list(locations, "No Locations in this layer.");
    } else if (kind === "Item") {
      fields([["Name", recordLabel(record)]]);
    }
    content.scrollTop = 0;
  }

  function dismiss() {
    if (!dialog.open) return;
    dialog.close();
    history = [];
    if (returnFocus?.isConnected) returnFocus.focus();
  }
  close.addEventListener("click", dismiss);
  back.addEventListener("click", () => { history.pop(); render(); });
  dialog.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); dismiss(); }
  });
  return {
    open(kind, record = null) {
      if (!dialog.open) returnFocus = document.activeElement;
      history = [{ kind, record }];
      render();
      if (!dialog.open) dialog.show();
      close.focus();
    },
    close: dismiss,
  };
}
