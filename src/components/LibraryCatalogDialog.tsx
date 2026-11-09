import React, { useCallback, useEffect, useMemo, useState } from "react";
import Library, { mergeLibraryItems } from "../data/library";
import { restoreLibraryItems } from "../data/restore";
import { LibraryItem, LibraryItems } from "../types";
import { Dialog } from "./Dialog";
import Spinner from "./Spinner";

import "./LibraryCatalogDialog.scss";

const CATALOG_URL = "https://libraries.excalidraw.com/libraries.json";
const LIBRARIES_BASE_URL = "https://libraries.excalidraw.com/libraries/";
const FAVORITES_STORAGE_KEY = "excalidraw_library_catalog_favorites";
const MANAGED_STORAGE_KEY = "excalidraw_library_catalog_installed";
const PAGE_SIZE = 60;

type CatalogLibrary = {
  id: string;
  name: string;
  description?: string;
  authors?: { name: string; url?: string }[];
  source: string;
  preview?: string;
  created?: string;
  updated?: string;
  itemNames?: string[];
};

type ManagedLibrary = { updated?: string; itemIds: string[] };
type ManagedLibraries = Record<string, ManagedLibrary>;

const readStringSet = (key: string) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return new Set<string>(Array.isArray(value) ? value : []);
  } catch {
    return new Set<string>();
  }
};

const readManagedLibraries = (): ManagedLibraries => {
  try {
    return JSON.parse(localStorage.getItem(MANAGED_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

const getSourceUrl = (source: string) =>
  `${LIBRARIES_BASE_URL}${source.split("/").map(encodeURIComponent).join("/")}`;

const isValidLibrarySource = (source: string) =>
  /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+\.excalidrawlib$/.test(source);

const fetchLibraryItems = async (entry: CatalogLibrary) => {
  const response = await fetch(getSourceUrl(entry.source));
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  const sourceItems = data.libraryItems || data.library;
  if (data.type !== "excalidrawlib" || !Array.isArray(sourceItems)) {
    throw new Error("Formato de biblioteca inválido");
  }
  const libraryItems = restoreLibraryItems(
    sourceItems as LibraryItems,
    "published",
  );
  if (!libraryItems.length) {
    throw new Error("A biblioteca nao contem itens validos");
  }
  return libraryItems;
};

const formatDate = (date?: string) => {
  if (!date) {
    return "";
  }
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? ""
    : parsedDate.toLocaleDateString();
};

export const LibraryCatalogDialog = ({
  library,
  onClose,
}: {
  library: Library;
  onClose: () => void;
}) => {
  const [catalog, setCatalog] = useState<CatalogLibrary[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(() =>
    readStringSet(FAVORITES_STORAGE_KEY),
  );
  const [managed, setManaged] =
    useState<ManagedLibraries>(readManagedLibraries);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "favorites" | "updates">("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(CATALOG_URL, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const entries = (await response.json()) as CatalogLibrary[];
      if (!Array.isArray(entries)) {
        throw new Error("O catálogo retornou um formato inválido");
      }
      setCatalog(
        entries.filter(
          (entry) =>
            entry.id && entry.name && isValidLibrarySource(entry.source),
        ),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? `Não foi possível carregar o catálogo oficial: ${loadError.message}`
          : "Não foi possível carregar o catálogo oficial.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const outdatedIds = useMemo(
    () =>
      new Set(
        catalog
          .filter((entry) => {
            const installed = managed[entry.id];
            return (
              !!installed &&
              !!entry.updated &&
              entry.updated > (installed.updated || "")
            );
          })
          .map((entry) => entry.id),
      ),
    [catalog, managed],
  );

  const filteredCatalog = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return catalog
      .filter((entry) => {
        if (filter === "favorites" && !favorites.has(entry.id)) {
          return false;
        }
        if (filter === "updates" && !outdatedIds.has(entry.id)) {
          return false;
        }
        if (!query) {
          return true;
        }
        const haystack = [
          entry.name,
          entry.description || "",
          ...(entry.itemNames || []),
          ...(entry.authors || []).map((author) => author.name),
        ]
          .join(" ")
          .toLocaleLowerCase();
        return haystack.includes(query);
      })
      .sort((left, right) => {
        if (filter === "updates") {
          return (right.updated || "").localeCompare(left.updated || "");
        }
        return left.name.localeCompare(right.name);
      });
  }, [catalog, favorites, filter, outdatedIds, search]);

  const visibleLibraries = filteredCatalog.slice(0, visibleCount);

  const persistFavorites = (nextFavorites: Set<string>) => {
    setFavorites(nextFavorites);
    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify([...nextFavorites]),
    );
  };

  const toggleFavorite = (id: string) => {
    const nextFavorites = new Set(favorites);
    if (nextFavorites.has(id)) {
      nextFavorites.delete(id);
    } else {
      nextFavorites.add(id);
    }
    persistFavorites(nextFavorites);
  };

  const toggleSelected = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () =>
    setSelected(new Set(filteredCatalog.map(({ id }) => id)));

  const selectFavorites = () =>
    setSelected(
      new Set(
        catalog.filter(({ id }) => favorites.has(id)).map(({ id }) => id),
      ),
    );

  const installLibraries = async (entries: CatalogLibrary[]) => {
    if (!entries.length || isInstalling) {
      return;
    }
    const entriesToInstall = entries.filter(
      (entry) => !managed[entry.id] || outdatedIds.has(entry.id),
    );
    if (!entriesToInstall.length) {
      setMessage(
        "As bibliotecas selecionadas já estão instaladas e atualizadas.",
      );
      return;
    }
    if (
      entriesToInstall.length > 20 &&
      !window.confirm(
        `Isto vai baixar ${entriesToInstall.length} bibliotecas e pode ocupar bastante espaço na biblioteca local. Continuar?`,
      )
    ) {
      return;
    }

    setIsInstalling(true);
    setMessage("");
    setError("");
    const imported: { entry: CatalogLibrary; items: LibraryItems }[] = [];
    const failures: string[] = [];
    for (let index = 0; index < entriesToInstall.length; index += 4) {
      const batch = entriesToInstall.slice(index, index + 4);
      const results = await Promise.all(
        batch.map(async (entry) => {
          try {
            return { entry, items: await fetchLibraryItems(entry) };
          } catch (fetchError) {
            failures.push(
              `${entry.name}: ${
                fetchError instanceof Error
                  ? fetchError.message
                  : "falha no download"
              }`,
            );
            return null;
          }
        }),
      );
      for (const result of results) {
        if (result) {
          imported.push(result);
        }
      }
      setProgress(
        `Baixadas ${Math.min(
          index + batch.length,
          entriesToInstall.length,
        )} de ${entriesToInstall.length} bibliotecas...`,
      );
    }

    try {
      const nextManaged = { ...managed };
      await library.setLibrary((currentItems) => {
        let nextItems = [...currentItems];
        for (const { entry, items } of imported) {
          const previousItemIds = nextManaged[entry.id]?.itemIds || [];
          if (previousItemIds.length) {
            nextItems = nextItems.filter(
              (item) => !previousItemIds.includes(item.id),
            );
          }
          const mergedItems = mergeLibraryItems(nextItems, items);
          nextManaged[entry.id] = {
            updated: entry.updated,
            itemIds: items
              .filter((item: LibraryItem) => mergedItems.includes(item))
              .map((item: LibraryItem) => item.id),
          };
          nextItems = [...mergedItems];
        }
        return nextItems;
      });
      setManaged(nextManaged);
      localStorage.setItem(MANAGED_STORAGE_KEY, JSON.stringify(nextManaged));
      setMessage(
        `${imported.length} biblioteca(s) instalada(s) ou atualizada(s).${
          failures.length ? ` ${failures.length} não puderam ser baixadas.` : ""
        }`,
      );
      setSelected(new Set());
    } catch (installError) {
      setError(
        installError instanceof Error
          ? `Não foi possível salvar na biblioteca local: ${installError.message}`
          : "Não foi possível salvar na biblioteca local.",
      );
    } finally {
      setProgress("");
      setIsInstalling(false);
    }
    if (failures.length) {
      setError(failures.slice(0, 5).join("; "));
    }
  };

  return (
    <Dialog
      className="LibraryCatalogDialog"
      onCloseRequest={onClose}
      title="Bibliotecas oficiais"
      closeOnClickOutside={!isInstalling}
    >
      <div className="library-catalog">
        <p className="library-catalog__intro">
          Pesquise no catálogo oficial, marque favoritas e instale várias
          bibliotecas de uma vez. A biblioteca local existente sera preservada.
        </p>
        <div className="library-catalog__toolbar">
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Buscar por nome, autor ou item"
            aria-label="Buscar bibliotecas"
          />
          <button
            type="button"
            onClick={loadCatalog}
            disabled={isLoading || isInstalling}
          >
            Atualizar catálogo
          </button>
        </div>
        <div
          className="library-catalog__filters"
          role="tablist"
          aria-label="Filtrar bibliotecas"
        >
          <button
            type="button"
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
          >
            Todas ({catalog.length})
          </button>
          <button
            type="button"
            aria-pressed={filter === "favorites"}
            onClick={() => setFilter("favorites")}
          >
            Favoritas ({favorites.size})
          </button>
          <button
            type="button"
            aria-pressed={filter === "updates"}
            onClick={() => setFilter("updates")}
          >
            Atualizações ({outdatedIds.size})
          </button>
        </div>
        <div className="library-catalog__selection">
          <span>
            {selected.size} selecionada(s) de {filteredCatalog.length}
          </span>
          <div>
            <button
              type="button"
              onClick={selectAll}
              disabled={!filteredCatalog.length || isInstalling}
            >
              Selecionar resultados
            </button>
            <button
              type="button"
              onClick={selectFavorites}
              disabled={!favorites.size || isInstalling}
            >
              Selecionar favoritas
            </button>
          </div>
        </div>
        {isLoading ? (
          <div className="library-catalog__status">
            <Spinner /> Carregando catálogo oficial...
          </div>
        ) : error && !catalog.length ? (
          <div className="library-catalog__error" role="alert">
            {error}
          </div>
        ) : (
          <div className="library-catalog__list">
            {visibleLibraries.map((entry) => {
              const isFavorite = favorites.has(entry.id);
              const isInstalled = !!managed[entry.id];
              const hasUpdate = outdatedIds.has(entry.id);
              return (
                <article className="library-catalog__card" key={entry.id}>
                  <input
                    type="checkbox"
                    checked={selected.has(entry.id)}
                    onChange={() => toggleSelected(entry.id)}
                    aria-label={`Selecionar ${entry.name}`}
                    disabled={isInstalling}
                  />
                  {entry.preview && (
                    <img
                      src={`${LIBRARIES_BASE_URL}${entry.preview
                        .split("/")
                        .map(encodeURIComponent)
                        .join("/")}`}
                      alt=""
                      loading="lazy"
                    />
                  )}
                  <div className="library-catalog__details">
                    <strong>{entry.name}</strong>
                    <span>
                      {(entry.authors || []).map(({ name }) => name).join(", ")}
                    </span>
                    {entry.description && <p>{entry.description}</p>}
                    <small>
                      {isInstalled
                        ? hasUpdate
                          ? "Atualizacao disponivel"
                          : "Instalada"
                        : ""}
                      {entry.updated
                        ? ` Atualizada em ${formatDate(entry.updated)}`
                        : ""}
                    </small>
                  </div>
                  <button
                    className="library-catalog__favorite"
                    type="button"
                    onClick={() => toggleFavorite(entry.id)}
                    aria-label={
                      isFavorite
                        ? `Remover ${entry.name} das favoritas`
                        : `Marcar ${entry.name} como favorita`
                    }
                    aria-pressed={isFavorite}
                    disabled={isInstalling}
                  >
                    {isFavorite ? "★" : "☆"}
                  </button>
                </article>
              );
            })}
            {!visibleLibraries.length && <p>Nenhuma biblioteca encontrada.</p>}
            {visibleCount < filteredCatalog.length && (
              <button
                className="library-catalog__more"
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Mostrar mais
              </button>
            )}
          </div>
        )}
        {progress && (
          <div className="library-catalog__status" role="status">
            {progress}
          </div>
        )}
        {message && (
          <div className="library-catalog__status" role="status">
            {message}
          </div>
        )}
        {error && catalog.length > 0 && (
          <div className="library-catalog__error" role="alert">
            {error}
          </div>
        )}
        <footer className="library-catalog__footer">
          <button type="button" onClick={onClose} disabled={isInstalling}>
            Fechar
          </button>
          <button
            type="button"
            onClick={() => installLibraries(filteredCatalog)}
            disabled={isLoading || isInstalling || !filteredCatalog.length}
          >
            Instalar todos os resultados ({filteredCatalog.length})
          </button>
          <button
            type="button"
            onClick={() =>
              installLibraries(catalog.filter(({ id }) => favorites.has(id)))
            }
            disabled={isLoading || isInstalling || !favorites.size}
          >
            Instalar favoritas ({favorites.size})
          </button>
          <button
            type="button"
            onClick={() =>
              installLibraries(catalog.filter(({ id }) => selected.has(id)))
            }
            disabled={isLoading || isInstalling || !selected.size}
          >
            {isInstalling
              ? "Instalando..."
              : `Instalar selecionadas (${selected.size})`}
          </button>
        </footer>
      </div>
    </Dialog>
  );
};
