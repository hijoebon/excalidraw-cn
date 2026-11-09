import { ExcalidrawElement } from "../../element/types";
import {
  getContainerListFromStorage,
  getContainerNameFromStorage,
  getElementsFromStorage,
  removeContainerFromStorage,
  renameContainerNameToStorage,
  setContainerListToStorage,
  setContainerNameToStorage,
  setElementsToStorage,
} from "./localStorage";

const makeElement = (id: string) => ({ id } as ExcalidrawElement);

describe("multi-canvas localStorage persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps each canvas drawing separate when switching canvases", () => {
    const defaultDrawing = [makeElement("default-drawing")];
    const draftDrawing = [makeElement("draft-drawing")];

    setElementsToStorage(defaultDrawing);
    setContainerListToStorage(["default_canvas", "draft"]);
    setContainerNameToStorage("draft");
    setElementsToStorage(draftDrawing);

    expect(getElementsFromStorage()).toEqual(draftDrawing);
    setContainerNameToStorage("default_canvas");
    expect(getElementsFromStorage()).toEqual(defaultDrawing);
    expect(getContainerListFromStorage()).toEqual(["default_canvas", "draft"]);
  });

  it("creates a named canvas without overwriting the existing default drawing", () => {
    const defaultDrawing = [makeElement("default-drawing")];
    setElementsToStorage(defaultDrawing);

    const canvasList = getContainerListFromStorage();
    setContainerNameToStorage("draft");
    setContainerListToStorage([...canvasList, "draft"]);
    setElementsToStorage([]);

    expect(getContainerListFromStorage()).toEqual(["default_canvas", "draft"]);
    expect(getElementsFromStorage()).toEqual([]);
    expect(getElementsFromStorage("default_canvas")).toEqual(defaultDrawing);
  });

  it("restores persisted drawings after reloading with the stored canvas name", () => {
    const drawing = [makeElement("persisted-drawing")];
    setContainerNameToStorage("draft");
    setElementsToStorage(drawing);

    const activeCanvasAfterReload = getContainerNameFromStorage();

    expect(getElementsFromStorage(activeCanvasAfterReload)).toEqual(drawing);
  });

  it("keeps existing default-canvas data when no canvas list exists yet", () => {
    const existingDrawing = [makeElement("existing-drawing")];
    localStorage.setItem("default_canvas", JSON.stringify(existingDrawing));

    expect(getContainerListFromStorage()).toEqual(["default_canvas"]);
    expect(getElementsFromStorage("default_canvas")).toEqual(existingDrawing);
  });

  it("preserves the active canvas contents when renaming it", () => {
    const drawing = [makeElement("drawing-to-keep")];
    setContainerListToStorage(["default_canvas", "old-name"]);
    setContainerNameToStorage("old-name");
    setElementsToStorage(drawing);

    renameContainerNameToStorage("old-name", "new-name");

    expect(getContainerNameFromStorage()).toBe("new-name");
    expect(getContainerListFromStorage()).toEqual([
      "default_canvas",
      "new-name",
    ]);
    expect(getElementsFromStorage()).toEqual(drawing);
    expect(localStorage.getItem("old-name")).toBeNull();
  });

  it("removes only the requested canvas and keeps other drawings", () => {
    const defaultDrawing = [makeElement("default-drawing")];
    const draftDrawing = [makeElement("draft-drawing")];
    setElementsToStorage(defaultDrawing);
    setContainerListToStorage(["default_canvas", "draft"]);
    setContainerNameToStorage("draft");
    setElementsToStorage(draftDrawing);

    removeContainerFromStorage("draft");

    expect(getContainerListFromStorage()).toEqual(["default_canvas"]);
    expect(localStorage.getItem("draft")).toBeNull();
    expect(getElementsFromStorage("default_canvas")).toEqual(defaultDrawing);
  });
});
