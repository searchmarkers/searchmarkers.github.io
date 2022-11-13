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
    StorageSession["_ID_R_INSTANCES"] = "idResearchInstances";
    StorageSession["_TAB_R_INSTANCE_IDS"] = "tabResearchInstanceIds";
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
            "keywords",
            "keyword",
            "terms",
            "term",
            "q", "s", "k",
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
        performSearch: true,
        toggleHighlights: true,
        appendTerm: true,
    },
    barLook: {
        showEditIcon: true,
        showRevealIcon: true,
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
 * Calls a function which gets a particular area of storage, initializing storage and retrying **once** if an error is encountered.
 * @param callGetStorage Function to get any storage items from "session", "local", or "sync" storage.
 * @returns The storage returned by the storage getter.
 */
const getStorageSafely = (callGetStorage) => callGetStorage().catch(async () => {
    // TODO use custom logging function
    console.warn("Reinitialized storage due to error when getting storage items. Retrying.");
    await initializeStorage();
    return callGetStorage();
});
/**
 * Stores items to browser session storage.
 * @param items An object of items to create or update.
 */
const setStorageSession = (items) => {
    items = { ...items };
    if (StorageSession.RESEARCH_INSTANCES in items) {
        // TODO disable object shallow copying when linking disabled in settings
        const tabRInstances = items.researchInstances;
        const tabs = Object.keys(tabRInstances);
        const idRInstances = [];
        const tabRInstanceIds = {};
        items.researchInstances = {};
        tabs.forEach(tab => {
            const id = idRInstances.indexOf(tabRInstances[tab]);
            if (id === -1) {
                tabRInstanceIds[tab] = idRInstances.length;
                idRInstances.push(tabRInstances[tab]);
            }
            else {
                tabRInstanceIds[tab] = id;
            }
        });
        items[StorageSession._ID_R_INSTANCES] = idRInstances;
        items[StorageSession._TAB_R_INSTANCE_IDS] = tabRInstanceIds;
    }
    return chrome.storage.session.set(items);
};
/**
 * Retrieves items from browser session storage.
 * @param keysParam An array of storage keys for which to retrieve the items.
 * @returns A promise that resolves with an object containing the requested items.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getStorageSession = (keysParam) => getStorageSafely(async () => {
    const keys = keysParam === undefined
        ? undefined
        : typeof (keysParam) === "string" ? [keysParam] : Array.from(new Set(keysParam));
    const gettingRInstances = keys && keys.includes(StorageSession.RESEARCH_INSTANCES);
    if (gettingRInstances) {
        keys.splice(keys.indexOf(StorageSession.RESEARCH_INSTANCES), 1);
        keys.push(StorageSession._ID_R_INSTANCES);
        keys.push(StorageSession._TAB_R_INSTANCE_IDS);
    }
    const session = await chrome.storage.session.get(keys);
    if (gettingRInstances) {
        const idRInstances = session[StorageSession._ID_R_INSTANCES];
        const tabRInstanceIds = session[StorageSession._TAB_R_INSTANCE_IDS];
        delete session[StorageSession._ID_R_INSTANCES];
        delete session[StorageSession._TAB_R_INSTANCE_IDS];
        const tabRInstances = {};
        Object.keys(tabRInstanceIds).forEach(tab => {
            tabRInstances[tab] = idRInstances[tabRInstanceIds[tab]];
        });
        session.researchInstances = tabRInstances;
    }
    if (session.engines) {
        const engines = session.engines;
        Object.keys(engines).forEach(id => engines[id] = Object.assign(new Engine, engines[id]));
    }
    return session;
});
/**
 * Stores items to browser local storage.
 * @param items An object of items to create or update.
 */
const setStorageLocal = (items) => {
    return chrome.storage.local.set(items);
};
/**
 * Retrieves items from browser local storage.
 * @param keysParam An array of storage keys for which to retrieve the items.
 * @returns A promise that resolves with an object containing the requested items.
 */
const getStorageLocal = async (keysParam) => getStorageSafely(async () => {
    return chrome.storage.local.get(keysParam);
});
/**
 * Stores items to browser sync storage.
 * @param items An object of items to create or update.
 */
const setStorageSync = (items) => {
    return chrome.storage.sync.set(items);
};
/**
 * Retrieves items from browser synced storage.
 * @param keysParam An array of storage keys for which to retrieve the items.
 * @returns A promise that resolves with an object containing the requested items.
 */
const getStorageSync = (keysParam) => getStorageSafely(async () => {
    return chrome.storage.sync.get(keysParam);
});
/**
 * Sets internal storage to its default working values.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const initializeStorage = async () => {
    const local = await getStorageLocal([StorageLocal.ENABLED]);
    const toRemove = [];
    fixObjectWithDefaults(local, {
        enabled: true,
        followLinks: true,
        persistResearchInstances: true,
    }, toRemove);
    await setStorageLocal(local);
    await chrome.storage.local.remove(toRemove);
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
 */
const fixObjectWithDefaults = (object, defaults, toRemove, atTopLevel = true) => {
    Object.keys(object).forEach(objectKey => {
        if (defaults[objectKey] === undefined) {
            delete object[objectKey];
            if (atTopLevel) {
                toRemove.push(objectKey);
            }
        }
        else if (typeof (object[objectKey]) === "object" && !Array.isArray(object[objectKey])) {
            fixObjectWithDefaults(object[objectKey], defaults[objectKey], toRemove, false);
        }
    });
    Object.keys(defaults).forEach(defaultsKey => {
        if (typeof (object[defaultsKey]) !== typeof (defaults[defaultsKey])
            || Array.isArray(object[defaultsKey]) !== Array.isArray(defaults[defaultsKey])) {
            object[defaultsKey] = defaults[defaultsKey];
        }
    });
};
/**
 * Checks persistent options storage for unwanted or misconfigured values, then restores it to a normal state.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const repairOptions = async () => {
    const sync = await getStorageSync();
    const toRemove = [];
    fixObjectWithDefaults(sync, defaultOptions, toRemove);
    setStorageSync(sync);
    chrome.storage.sync.remove(toRemove);
};
