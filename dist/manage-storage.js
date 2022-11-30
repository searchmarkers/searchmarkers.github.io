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
            get: async () => defaultOptions,
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
var _b;
const useChromeAPI = () => !this.browser;
chrome.storage = useChromeAPI() ? chrome.storage : browser.storage;
(_a = (_b = chrome.storage).session) !== null && _a !== void 0 ? _a : (_b.session = chrome.storage.local);
var StorageSession;
(function (StorageSession) {
    StorageSession["RESEARCH_INSTANCES"] = "researchInstances";
    StorageSession["ENGINES"] = "engines";
})(StorageSession || (StorageSession = {}));
var StorageLocal;
(function (StorageLocal) {
    StorageLocal["ENABLED"] = "enabled";
    StorageLocal["FOLLOW_LINKS"] = "followLinks";
    StorageLocal["PERSIST_RESEARCH_INSTANCES"] = "persistResearchInstances";
})(StorageLocal || (StorageLocal = {}));
var StorageSync;
(function (StorageSync) {
    StorageSync["AUTO_FIND_OPTIONS"] = "autoFindOptions";
    StorageSync["MATCH_MODE_DEFAULTS"] = "matchModeDefaults";
    StorageSync["LINK_RESEARCH_TABS"] = "linkResearchTabs";
    StorageSync["SHOW_HIGHLIGHTS"] = "showHighlights";
    StorageSync["BAR_CONTROLS_SHOWN"] = "barControlsShown";
    StorageSync["BAR_LOOK"] = "barLook";
    StorageSync["HIGHLIGHT_LOOK"] = "highlightLook";
    StorageSync["URL_FILTERS"] = "urlFilters";
    StorageSync["TERM_LISTS"] = "termLists";
})(StorageSync || (StorageSync = {}));
const defaultOptions = {
    autoFindOptions: {
        searchParams: [
            "searchTerms",
            "searchTerm",
            "search",
            "query",
            "phrase",
            "keywords",
            "keyword",
            "terms",
            "term",
            "s", "q", "p", "k",
            // Special cases:
            "_nkw", // eBay
        ],
        stoplist: [
            "i", "a", "an", "and", "or", "not", "the", "that", "there", "where", "which", "to", "do", "of", "in", "on", "at", "too",
            "if", "for", "while", "is", "as", "isn't", "are", "aren't", "can", "can't", "how", "vs",
            "them", "their", "theirs", "her", "hers", "him", "his", "it", "its", "me", "my", "one", "one's",
        ],
    },
    matchModeDefaults: {
        regex: false,
        case: false,
        stem: true,
        whole: false,
        diacritics: false,
    },
    linkResearchTabs: false,
    showHighlights: {
        default: true,
        overrideSearchPages: true,
        overrideResearchPages: false,
    },
    barControlsShown: {
        disableTabResearch: true,
        performSearch: false,
        toggleHighlights: true,
        appendTerm: true,
        pinTerms: true,
    },
    barLook: {
        showEditIcon: true,
        showRevealIcon: true,
        fontSize: "14.6px",
        opacityControl: 0.8,
        opacityTerm: 0.86,
        borderRadius: "4px",
    },
    highlightLook: {
        hues: [300, 60, 110, 220, 30, 190, 0],
    },
    urlFilters: {
        noPageModify: [],
        nonSearch: [],
    },
    termLists: [],
};
/**
 * Stores items to browser session storage.
 * @param items An object of items to create or update.
 */
const setStorageSession = (items) => {
    return chrome.storage.session.set(items);
};
/**
 * Retrieves items from browser session storage.
 * @param keys An array of storage keys for which to retrieve the items.
 * @returns A promise that resolves with an object containing the requested items.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getStorageSession = async (keys) => {
    const session = await chrome.storage.session.get(keys);
    if (session.engines) {
        const engines = session.engines;
        Object.keys(engines).forEach(id => engines[id] = Object.assign(new Engine, engines[id]));
    }
    return session;
};
/**
 * Stores items to browser local storage.
 * @param items An object of items to create or update.
 */
const setStorageLocal = (items) => {
    return chrome.storage.local.set(items);
};
/**
 * Retrieves items from browser local storage.
 * @param keys An array of storage keys for which to retrieve the items.
 * @returns A promise that resolves with an object containing the requested items.
 */
const getStorageLocal = async (keys) => {
    return chrome.storage.local.get(keys);
};
/**
 * Stores items to browser sync storage.
 * @param items An object of items to create or update.
 */
const setStorageSync = (items) => {
    return chrome.storage.sync.set(items);
};
/**
 * Retrieves items from browser synced storage.
 * @param keys An array of storage keys for which to retrieve the items.
 * @returns A promise that resolves with an object containing the requested items.
 */
const getStorageSync = async (keys) => {
    return chrome.storage.sync.get(keys);
};
/**
 * Sets internal storage to its default working values.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const initializeStorage = async () => {
    const local = await getStorageLocal();
    const localOld = { ...local };
    const toRemove = [];
    if (fixObjectWithDefaults(local, {
        enabled: true,
        followLinks: true,
        persistResearchInstances: true,
    }, toRemove)) {
        console.warn("Storage 'local' cleanup rectified issues. Results:", localOld, local); // Use standard logging system?
    }
    await setStorageLocal(local);
    if (chrome.storage["session"]) { // Temporary fix. Without the 'session' API, its values may be stored in 'local'.
        await chrome.storage.local.remove(toRemove);
    }
    await setStorageSession({
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
const fixObjectWithDefaults = (object, defaults, toRemove, atTopLevel = true) => {
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
            if (fixObjectWithDefaults(object[objectKey], defaults[objectKey], toRemove, false)) {
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
const repairOptions = async () => {
    const sync = await getStorageSync();
    const syncOld = { ...sync };
    const toRemove = [];
    if (fixObjectWithDefaults(sync, defaultOptions, toRemove)) {
        console.warn("Storage 'sync' cleanup rectified issues. Results:", syncOld, sync); // Use standard logging system?
    }
    await setStorageSync(sync);
    await chrome.storage.sync.remove(toRemove);
};
