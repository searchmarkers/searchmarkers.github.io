"use strict"
window["chrome"] = {
    runtime: {
        getURL: path => "",
        getManifest: () => ({
            name: "Mark My Search",
            version: "X.Y.Z",
        }),
        sendMessage: async () => undefined,
        openOptionsPage: () => undefined,
    },
    storage: {
        session: {
            set: async () => undefined,
            get: async () => {
                const store = {};
                Object.values(StorageSession).forEach(key => store[key] = {});
                return store;
            },
        },
        local: {
            set: async () => undefined,
            get: async () => {
                const store = {};
                Object.values(StorageLocal).forEach(key => store[key] = {});
                return store;
            },
        },
        sync: {
            set: async () => undefined,
            get: async () => optionsDefault,
        },
        onChanged: {
            addListener: () => undefined,
        },
    },
    tabs: {
        query: async () => ([ {
            id: -1,
            url: window.location.href,
        } ]),
        onActivated: {
            addListener: () => undefined,
        },
        create: () => undefined,
    },
};
"use strict";
var _a;
const useChromeAPI = () => !this.browser;
chrome.storage = useChromeAPI() ? chrome.storage : browser.storage;
(_a = chrome.storage).session ?? (_a.session = chrome.storage.local);
var StorageSession;
(function (StorageSession) {
    StorageSession["RESEARCH_INSTANCES"] = "researchInstances";
    StorageSession["ENGINES"] = "engines";
})(StorageSession || (StorageSession = {}));
var StorageLocal;
(function (StorageLocal) {
    StorageLocal["ENABLED"] = "enabled";
    StorageLocal["PERSIST_RESEARCH_INSTANCES"] = "persistResearchInstances";
})(StorageLocal || (StorageLocal = {}));
var StorageSync;
(function (StorageSync) {
    StorageSync["AUTO_FIND_OPTIONS"] = "autoFindOptions";
    StorageSync["MATCH_MODE_DEFAULTS"] = "matchModeDefaults";
    StorageSync["SHOW_HIGHLIGHTS"] = "showHighlights";
    StorageSync["BAR_COLLAPSE"] = "barCollapse";
    StorageSync["BAR_CONTROLS_SHOWN"] = "barControlsShown";
    StorageSync["BAR_LOOK"] = "barLook";
    StorageSync["HIGHLIGHT_METHOD"] = "highlightMethod";
    StorageSync["URL_FILTERS"] = "urlFilters";
    StorageSync["TERM_LISTS"] = "termLists";
})(StorageSync || (StorageSync = {}));
/**
 * The default options to be used for items missing from storage, or to which items may be reset.
 * Set to sensible options for a generic first-time user of the extension.
 */
const optionsDefault = {
    autoFindOptions: {
        searchParams: [
            "search_terms", "search_term", "searchTerms", "searchTerm",
            "search_query", "searchQuery",
            "search",
            "query",
            "phrase",
            "keywords", "keyword",
            "terms", "term",
            "text",
            // Short forms:
            "s", "q", "p", "k",
            // Special cases:
            "_nkw",
            "wd", // Baidu
        ],
        stoplist: [
            "i", "a", "an", "and", "or", "not", "the", "that", "there", "where", "which", "to", "do", "of", "in", "on", "at", "too",
            "if", "for", "while", "is", "as", "isn't", "are", "aren't", "can", "can't", "how", "vs",
            "them", "their", "theirs", "her", "hers", "him", "his", "it", "its", "me", "my", "one", "one's", "you", "your", "yours",
        ],
    },
    matchModeDefaults: {
        regex: false,
        case: false,
        stem: true,
        whole: false,
        diacritics: false,
    },
    showHighlights: {
        default: true,
        overrideSearchPages: false,
        overrideResearchPages: false,
    },
    barCollapse: {
        fromSearch: false,
        fromTermListAuto: false,
    },
    barControlsShown: {
        toggleBarCollapsed: true,
        disableTabResearch: true,
        performSearch: false,
        toggleHighlights: true,
        appendTerm: true,
        replaceTerms: true,
    },
    barLook: {
        showEditIcon: true,
        showRevealIcon: true,
        fontSize: "14.6px",
        opacityControl: 0.8,
        opacityTerm: 0.86,
        borderRadius: "4px",
    },
    highlightMethod: {
        paintReplaceByClassic: true,
        paintUseExperimental: false,
        hues: [300, 60, 110, 220, 30, 190, 0],
    },
    urlFilters: {
        noPageModify: [],
        nonSearch: [],
    },
    termLists: [],
};
/**
 * The working cache of items retrieved from storage since the last background startup.
 */
const storageCache = {
    session: {},
    local: {},
    sync: {},
};
/**
 * Gets an object of key-value pairs corresponding to a set of keys in the given area of storage.
 * Storage may be fetched asynchronously or immediately retrieved from a cache.
 * @param area The name of the storage area from which to retrieve values.
 * @param keys The keys corresponding to the entries to retrieve.
 * @returns A promise resolving to an object of storage entries.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const storageGet = async (area, keys) => {
    if (keys && keys.every(key => storageCache[area][key] !== undefined)) {
        return { ...storageCache[area] };
    }
    const store = await chrome.storage[area].get(keys);
    const storeAsSession = store;
    if (storeAsSession.engines) {
        const engines = storeAsSession.engines;
        Object.keys(engines).forEach(id => engines[id] = Object.assign(new Engine, engines[id]));
    }
    Object.entries(store).forEach(([key, value]) => {
        storageCache[area][key] = value;
    });
    return { ...store };
};
/**
 *
 * @param area
 * @param store
 */
const storageSet = async (area, store) => {
    Object.entries(store).forEach(([key, value]) => {
        storageCache[area][key] = value;
    });
    await chrome.storage[area].set(store);
};
/**
 * Sets internal storage to its default working values.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const storageInitialize = async () => {
    const local = await storageGet("local");
    const localOld = { ...local };
    const toRemove = [];
    if (objectFixWithDefaults(local, {
        enabled: true,
        followLinks: true,
        persistResearchInstances: true,
    }, toRemove)) {
        console.warn("Storage 'local' cleanup rectified issues. Results:", localOld, local); // Use standard logging system?
    }
    await storageSet("local", local);
    if (chrome.storage["session"]) { // Temporary fix. Without the 'session' API, its values may be stored in 'local'.
        await chrome.storage.local.remove(toRemove);
    }
    await storageSet("session", {
        researchInstances: {},
        engines: {},
    });
};
/**
 * Makes an object conform to an object of defaults.
 * Missing default items are assigned, and items with no corresponding default are removed. Items within arrays are ignored.
 * @param object An object to repair.
 * @param defaults An object of default items to be compared with the first object.
 * @param toRemove An empty array to be filled with deleted top-level keys.
 * @param atTopLevel Indicates whether or not the function is currently at the top level of the object.
 * @returns Whether or not any fixes were applied.
 */
const objectFixWithDefaults = (object, defaults, toRemove, atTopLevel = true) => {
    let hasModified = false;
    Object.keys(object).forEach(objectKey => {
        if (defaults[objectKey] === undefined) {
            delete object[objectKey];
            if (atTopLevel) {
                toRemove.push(objectKey);
            }
            hasModified = true;
        }
        else if (typeof (object[objectKey]) === "object" && !Array.isArray(object[objectKey])) {
            if (objectFixWithDefaults(object[objectKey], defaults[objectKey], toRemove, false)) {
                hasModified = true;
            }
        }
    });
    Object.keys(defaults).forEach(defaultsKey => {
        if (typeof (object[defaultsKey]) !== typeof (defaults[defaultsKey])
            || Array.isArray(object[defaultsKey]) !== Array.isArray(defaults[defaultsKey])) {
            object[defaultsKey] = defaults[defaultsKey];
            hasModified = true;
        }
    });
    return hasModified;
};
/**
 * Checks persistent options storage for unwanted or misconfigured values, then restores it to a normal state.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const optionsRepair = async () => {
    const sync = await storageGet("sync");
    const syncOld = { ...sync };
    const toRemove = [];
    if (objectFixWithDefaults(sync, optionsDefault, toRemove)) {
        console.warn("Storage 'sync' cleanup rectified issues. Results:", syncOld, sync); // Use standard logging system?
    }
    storageSet("sync", sync);
    await chrome.storage.sync.remove(toRemove);
};
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "managed") {
        return;
    }
    if (["researchInstances", "engines"].some(key => changes[key])) {
        areaName = "session";
    }
    Object.entries(changes).forEach(([key, value]) => {
        storageCache[areaName][key] = value.newValue;
    });
});
/*const updateCache = (changes: Record<string, chrome.storage.StorageChange>, areaName: StorageAreaName | "managed") => {
    if (areaName === "managed") {
        return;
    }
    if ([ "researchInstances", "engines" ].some(key => changes[key])) {
        areaName = "session";
    }
    Object.entries(changes).forEach(([ key, value ]) => {
        storageCache[areaName][key] = value.newValue;
    });
};

chrome.storage.onChanged.addListener(updateCache);

(() => {
    Object.keys(storageCache).forEach(async (areaName: StorageAreaName) => {
        const area = await chrome.storage[areaName].get();
        const areaChange: Record<string, chrome.storage.StorageChange> = {};
        Object.keys(area).forEach(key => {
            areaChange[key] = { oldValue: area[key], newValue: area[key] };
        });
        updateCache(areaChange, areaName);
    });
})();*/
