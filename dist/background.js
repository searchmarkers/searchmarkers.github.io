"use strict";
var ScriptLib;
(function (ScriptLib) {
    ScriptLib["STORAGE"] = "/dist/manage-storage.js";
    ScriptLib["STEMMING"] = "/dist/stem-pattern-find.js";
    ScriptLib["DIACRITICS"] = "/dist/diacritic-pattern.js";
    ScriptLib["COMMON"] = "/dist/shared-content.js";
})(ScriptLib || (ScriptLib = {}));
var Script;
(function (Script) {
    Script["BACKGROUND"] = "/dist/background.js";
    Script["OPTIONS"] = "/dist/options.js";
    Script["POPUP"] = "/dist/popup.js";
    Script["CONTENT_MARKER"] = "/dist/term-highlight.js";
})(Script || (Script = {}));
if ( /*isBrowserChromium()*/!this.browser) {
    // Firefox accepts a list of event page scripts, whereas Chromium only accepts service workers.
    this["importScripts"](ScriptLib.STORAGE, ScriptLib.STEMMING, ScriptLib.DIACRITICS, ScriptLib.COMMON);
}
chrome.scripting = useChromeAPI() ? chrome.scripting : browser["scripting"];
chrome.tabs.query = useChromeAPI() ? chrome.tabs.query : browser.tabs.query;
chrome.tabs.sendMessage = useChromeAPI()
    ? chrome.tabs.sendMessage
    : browser.tabs.sendMessage;
chrome.tabs.get = useChromeAPI() ? chrome.tabs.get : browser.tabs.get;
chrome.search["search"] = useChromeAPI()
    ? (options) => chrome.search["query"]({ text: options.query, tabId: options.tabId }, () => undefined)
    : browser.search.search;
chrome.commands.getAll = useChromeAPI() ? chrome.commands.getAll : browser.commands.getAll;
/**
 * Creates an object storing highlighting information about a tab, for application to pages within that tab.
 * @param args Arguments for building the initial research instance. Variables in storage may also be used.
 * @returns The resulting research instance.
 */
const createResearchInstance = async (args) => {
    var _a, _b;
    const sync = await getStorageSync([StorageSync.SHOW_HIGHLIGHTS]);
    if (args.url) {
        const phraseGroups = args.url.engine ? [] : (await getSearchQuery(args.url.url)).split("\"");
        const termsRaw = args.url.engine
            ? args.url.engine.extract((_a = args.url.url) !== null && _a !== void 0 ? _a : "")
            : phraseGroups.flatMap(phraseGroups.length % 2
                ? ((phraseGroup, i) => i % 2 ? phraseGroup : phraseGroup.split(" ").filter(phrase => !!phrase))
                : phraseGroup => phraseGroup.split(" "));
        return {
            terms: Array.from(new Set(termsRaw))
                .filter(phrase => args.url ? !args.url.stoplist.includes(phrase) : false)
                .map(phrase => new MatchTerm(phrase)),
            highlightsShown: sync.showHighlights.default,
            autoOverwritable: args.autoOverwritable,
            enabled: true,
        };
    }
    (_b = args.terms) !== null && _b !== void 0 ? _b : (args.terms = []);
    return {
        terms: args.terms,
        highlightsShown: sync.showHighlights.default,
        autoOverwritable: args.autoOverwritable,
        enabled: true,
    };
};
/**
 * Gets the query string of a potential search.
 * @param url A URL to be tested.
 * @returns The URL segment determined to be the search query, or the empty string if none is found.
 */
const getSearchQuery = async (url) => getStorageSync([StorageSync.AUTO_FIND_OPTIONS]).then(sync => {
    var _a, _b;
    return (_b = new URL(url).searchParams.get((_a = sync.autoFindOptions.searchParams.find(param => new URL(url).searchParams.has(param))) !== null && _a !== void 0 ? _a : "")) !== null && _b !== void 0 ? _b : "";
}).catch(() => {
    log("search query extraction fail", "", { url });
    return "";
});
/**
 * Gets heuristically whether or not a URL specifies a search on an arbitrary search engine.
 * @param engines An array of objects representing search engine URLs and how to extract contained search queries.
 * @param url A URL to be tested.
 * @returns An object containing a flag for whether or not the URL specifies a search,
 * and the first object which matched the URL (if any).
 */
const isTabSearchPage = async (engines, url) => {
    if (await getSearchQuery(url)) {
        return { isSearch: true };
    }
    else {
        const engine = Object.values(engines).find(thisEngine => thisEngine.match(url));
        return { isSearch: !!engine, engine };
    }
};
/**
 * Determines whether a URL is filtered in by a given URL filter.
 * @param url A URL object.
 * @param urlFilter A URL filter array, the component strings of which may contain wildcards.
 * @returns `true` if the URL is filtered in, `false` otherwise.
 */
const isUrlFilteredIn = (() => {
    const sanitize = (urlComponent) => sanitizeForRegex(urlComponent).replace("\\*", ".*");
    return (url, urlFilter) => !!urlFilter.find(({ hostname, pathname }) => (new RegExp(sanitize(hostname) + "\\b")).test(url.hostname)
        && (pathname === "" || pathname === "/" || (new RegExp("\\b" + sanitize(pathname.slice(1)))).test(url.pathname.slice(1))));
})();
/**
 * Determines whether the user has permitted pages with the given URL to be deeply modified during highlighting,
 * which is powerful but may be destructive.
 * @param urlString The valid URL string corresponding to a page to be potentially highlighted.
 * @param urlFilters URL filter preferences.
 * @returns `true` if the corresponding page may be modified, `false` otherwise.
 */
const isUrlPageModifyAllowed = (urlString, urlFilters) => {
    try {
        return !isUrlFilteredIn(new URL(urlString), urlFilters.noPageModify);
    }
    catch {
        return true;
    }
};
/**
 * Determines whether the user has permitted pages with the given URL to treated as a search page,
 * from which keywords may be collected.
 * @param urlString The valid URL string corresponding to a page to be potentially auto-highlighted.
 * @param urlFilters An object of details about URL filtering.
 * @returns `true` if the corresponding page may be treated as a search page, `false` otherwise.
 */
const isUrlSearchHighlightAllowed = (urlString, urlFilters) => !isUrlFilteredIn(new URL(urlString), urlFilters.nonSearch);
/**
 * Determines whether the highlight-showing should be toggled on, off, or left unchanged.
 * @param highlightsShown Whether or not highlights are shown currently.
 * @param overrideHighlightsShown Whether or not to force highlights to be shown,
 * or not change highlight-showing if `undefined`
 * @returns `true` to toggle on, `false` to toggle off, `undefined` to not change.
 */
const determineToggleHighlightsOn = (highlightsShown, overrideHighlightsShown) => overrideHighlightsShown === undefined
    ? undefined
    : highlightsShown || overrideHighlightsShown;
/**
 * Caches objects, representing search engine URLs and how to extract their search queries, to session storage.
 * These objects are generated from information such as dynamic bookmarks stored by the user,
 * and caching is triggered on information update.
 */
const manageEnginesCacheOnBookmarkUpdate = (() => {
    /**
     * Updates an array of user search engines with respect to a particular engine ID, based on a potentially dynamic URL.
     * @param engines An array of user search engines.
     * @param id The unique ID of a potential or existing engine.
     * @param urlDynamicString The string of a URL which may be dynamic (contains `%s` as in a dynamic bookmark).
     */
    const updateEngine = (engines, id, urlDynamicString) => {
        if (!urlDynamicString) {
            return;
        }
        if (!urlDynamicString.includes("%s")) {
            delete engines[id];
            return;
        }
        const engine = new Engine({ urlDynamicString });
        if (Object.values(engines).find(thisEngine => thisEngine.equals(engine))) {
            return;
        }
        engines[id] = engine;
    };
    /**
     * Uses a function accepting a single bookmark tree node to modify user search engines in storage.
     * Accepts all such nodes under a root node.
     * @param engines An array of user search engine objects.
     * @param setEngine A function to modify user search engines in storage based on a bookmark tree node.
     * @param node A root node under which to accept descendant nodes (inclusive).
     */
    const setEngines = (engines, setEngine, node) => {
        var _a;
        if (node.type === "bookmark") {
            setEngine(node);
        }
        ((_a = node.children) !== null && _a !== void 0 ? _a : []).forEach(child => setEngines(engines, setEngine, child));
    };
    return () => {
        if (useChromeAPI() || !chrome.bookmarks) {
            return;
        }
        browser.bookmarks.getTree().then(async (nodes) => {
            const session = await getStorageSession([StorageSession.ENGINES]);
            nodes.forEach(node => setEngines(session.engines, node => {
                if (node.url) {
                    updateEngine(session.engines, node.id, node.url);
                }
            }, node));
            setStorageSession(session);
        });
        browser.bookmarks.onRemoved.addListener(async (id, removeInfo) => {
            const session = await getStorageSession([StorageSession.ENGINES]);
            setEngines(session.engines, node => {
                delete session.engines[node.id];
            }, removeInfo.node);
            setStorageSession(session);
        });
        browser.bookmarks.onCreated.addListener(async (id, createInfo) => {
            if (createInfo.url) {
                const session = await getStorageSession([StorageSession.ENGINES]);
                updateEngine(session.engines, id, createInfo.url);
                setStorageSession(session);
            }
        });
        browser.bookmarks.onChanged.addListener(async (id, changeInfo) => {
            if (changeInfo.url) {
                const session = await getStorageSession([StorageSession.ENGINES]);
                updateEngine(session.engines, id, changeInfo.url);
                setStorageSession(session);
            }
        });
    };
})();
/**
 * Updates the action icon to reflect the extension's enabled/disabled status.
 * @param enabled If specified, overrides the extension's enabled/disabled status.
 */
const updateActionIcon = (enabled) => enabled === undefined
    ? getStorageLocal([StorageLocal.ENABLED]).then(local => updateActionIcon(local.enabled))
    : chrome.action.setIcon({ path: useChromeAPI()
            ? enabled ? "/icons/mms-32.png" : "/icons/mms-off-32.png" // Chromium still has patchy SVG support
            : enabled ? "/icons/mms.svg" : "/icons/mms-off.svg"
    });
(() => {
    /**
     * Registers items to selectively appear in context menus, if not present, to serve as shortcuts for managing the extension.
     */
    const createContextMenuItems = () => {
        if (useChromeAPI() && chrome.contextMenus.onClicked["hasListeners"]()) {
            return;
        }
        chrome.contextMenus.removeAll();
        chrome.contextMenus.create({
            title: "&Highlight Selection",
            id: "activate-research-tab",
            contexts: ["selection", "page"],
        });
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            if (tab && tab.id !== undefined) {
                log("research activation request", "context menu item activated", { tabId: tab.id });
                activateResearchInTab(tab.id);
            }
            else {
                assert(false, "research activation [from context menu] no request", "", { tab });
            }
        });
    };
    /**
     * Prepares non-volatile extension components on install.
     */
    const setUp = () => {
        if (useChromeAPI()) {
            // TODO instruct user how to assign the appropriate shortcuts
        }
        else {
            //browser.commands.update({ name: "toggle-select", shortcut: "Ctrl+Shift+U" });
            //browser.commands.update({ name: "toggle-bar", shortcut: "Ctrl+Shift+F" });
            browser.commands.update({ name: "toggle-research-global", shortcut: "Alt+Shift+J" });
            browser.commands.update({ name: "focus-term-append", shortcut: "Alt+Period" });
            for (let i = 0; i < 10; i++) {
                browser.commands.update({ name: `select-term-${i}`, shortcut: `Alt+Shift+${(i + 1) % 10}` });
                browser.commands.update({ name: `select-term-${i}-reverse`, shortcut: `Ctrl+Shift+${(i + 1) % 10}` });
            }
        }
    };
    /**
     * Prepares volatile extension components in a new browser session.
     */
    const initialize = () => {
        chrome.runtime.setUninstallURL("https://searchmarkers.github.io/pages/sendoff/");
        manageEnginesCacheOnBookmarkUpdate();
        createContextMenuItems();
        initializeStorage();
        updateActionIcon();
    };
    const startOnInstall = (isExtensionInstall, allowOnboarding = true) => {
        if (isExtensionInstall) {
            setUp();
            if (allowOnboarding) {
                chrome.tabs.create({ url: chrome.runtime.getURL("/pages/startpage.html") });
            }
        }
        repairOptions();
        initialize();
    };
    chrome.runtime.onInstalled.addListener(details => startOnInstall(details.reason === chrome.runtime.OnInstalledReason.INSTALL));
    chrome.runtime.onStartup.addListener(initialize);
    createContextMenuItems(); // Ensures context menu items will be recreated on enabling the extension (after disablement).
    getStorageSession([StorageSession.RESEARCH_INSTANCES]).then(session => {
        if (session.researchInstances === undefined) {
            assert(false, "storage reinitialize", "storage read returned `undefined` when testing on wake");
            initializeStorage();
        }
    });
})();
(() => {
    /**
     * Compares an updated tab with its associated storage in order to identify necessary storage and highlighting changes,
     * then carries out these changes.
     * @param urlString The current URL of the tab, used to infer desired highlighting.
     * @param tabId The ID of a tab to check and interact with.
     */
    const pageModifyRemote = async (urlString, tabId) => {
        var _a;
        const logMetadata = { timeStart: Date.now(), tabId, url: urlString };
        log("tab-communicate fulfillment start", "", logMetadata);
        const sync = await getStorageSync([
            StorageSync.AUTO_FIND_OPTIONS,
            StorageSync.SHOW_HIGHLIGHTS,
            StorageSync.BAR_CONTROLS_SHOWN,
            StorageSync.BAR_LOOK,
            StorageSync.HIGHLIGHT_LOOK,
            StorageSync.MATCH_MODE_DEFAULTS,
            StorageSync.URL_FILTERS,
            StorageSync.TERM_LISTS,
        ]);
        const local = await getStorageLocal([StorageLocal.ENABLED]);
        const session = await getStorageSession([
            StorageSession.RESEARCH_INSTANCES,
            StorageSession.ENGINES,
        ]);
        const searchDetails = local.enabled
            ? await isTabSearchPage(session.engines, urlString)
            : { isSearch: false };
        searchDetails.isSearch = searchDetails.isSearch && isUrlSearchHighlightAllowed(urlString, sync.urlFilters);
        const termsFromLists = sync.termLists.filter(termList => isUrlFilteredIn(new URL(urlString), termList.urlFilter))
            .flatMap(termList => termList.terms);
        const getTermsAdditionalDistinct = (terms, termsExtra) => termsExtra.filter(termExtra => !terms.find(term => term.phrase === termExtra.phrase));
        const isResearchPage = isTabResearchPage(session.researchInstances, tabId);
        const overrideHighlightsShown = (searchDetails.isSearch && sync.showHighlights.overrideSearchPages)
            || (isResearchPage && sync.showHighlights.overrideResearchPages);
        if (searchDetails.isSearch && (isResearchPage ? session.researchInstances[tabId].autoOverwritable : true)) {
            const researchInstance = await createResearchInstance({
                url: {
                    stoplist: sync.autoFindOptions.stoplist,
                    url: urlString,
                    engine: searchDetails.engine,
                },
                autoOverwritable: !termsFromLists.length,
            });
            const getPhrases = (researchInstance) => researchInstance.terms.map(term => term.phrase);
            if (!isResearchPage || !itemsMatch(getPhrases(session.researchInstances[tabId]), getPhrases(researchInstance))) {
                session.researchInstances[tabId] = researchInstance;
                const researchEnablementReason = isResearchPage
                    ? "search detected in tab containing overwritable non-matching research"
                    : "search detected in tab";
                log("tab-communicate research enable", researchEnablementReason, logMetadata);
                researchInstance.terms = termsFromLists.concat(getTermsAdditionalDistinct(termsFromLists, researchInstance.terms));
                setStorageSession({ researchInstances: session.researchInstances });
            }
        }
        if (isTabResearchPage(session.researchInstances, tabId) || termsFromLists.length) {
            log("tab-communicate highlight activation request", "tab is currently a research page", logMetadata);
            const researchInstance = (_a = session.researchInstances[tabId]) !== null && _a !== void 0 ? _a : await createResearchInstance({ autoOverwritable: false });
            session.researchInstances[tabId] = researchInstance;
            const termsDistinctFromLists = getTermsAdditionalDistinct(researchInstance.terms, termsFromLists);
            researchInstance.terms = researchInstance.terms.concat(termsDistinctFromLists);
            researchInstance.enabled = true; // Enable in case research existed but was disabled.
            await activateHighlightingInTab(tabId, {
                terms: researchInstance.terms,
                toggleHighlightsOn: determineToggleHighlightsOn(researchInstance.highlightsShown, overrideHighlightsShown),
                autoOverwritable: researchInstance.autoOverwritable,
                barControlsShown: sync.barControlsShown,
                barLook: sync.barLook,
                highlightLook: sync.highlightLook,
                matchMode: sync.matchModeDefaults,
                enablePageModify: isUrlPageModifyAllowed(urlString, sync.urlFilters),
            });
            if (termsDistinctFromLists.length) {
                setStorageSession(session);
            }
        }
        log("tab-communicate fulfillment finish", "", logMetadata);
    };
    chrome.tabs.onCreated.addListener(async (tab) => {
        var _a, _b, _c;
        const local = await getStorageLocal([StorageLocal.FOLLOW_LINKS]);
        if (!local.followLinks
            || tab.id === undefined || tab.openerTabId === undefined || /\b\w+:(\/\/)?newtab\//.test((_b = (_a = tab.pendingUrl) !== null && _a !== void 0 ? _a : tab.url) !== null && _b !== void 0 ? _b : "")) {
            return;
        }
        log("tab-communicate obligation check", "tab created", { tabId: tab.id });
        const session = await getStorageSession([StorageSession.RESEARCH_INSTANCES]);
        if (isTabResearchPage(session.researchInstances, tab.openerTabId)) {
            const sync = await getStorageSync([StorageSync.LINK_RESEARCH_TABS]);
            session.researchInstances[tab.id] = sync.linkResearchTabs
                ? session.researchInstances[tab.openerTabId]
                : { ...session.researchInstances[tab.openerTabId] };
            setStorageSession(session);
            pageModifyRemote((_c = tab.url) !== null && _c !== void 0 ? _c : "", tab.id); // New tabs may fail to trigger web navigation, due to loading from cache.
        }
    });
    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (changeInfo.url) {
            pageModifyRemote(changeInfo.url, tabId);
        }
    });
    chrome.tabs.onRemoved.addListener(async (tabId) => {
        const session = await getStorageSession([StorageSession.RESEARCH_INSTANCES]);
        if (session.researchInstances[tabId]) {
            delete session.researchInstances[tabId];
            setStorageSession(session);
        }
    });
    if (useChromeAPI()) {
        // Chromium emits no `tabs` event for tab reload
        chrome.webNavigation.onCommitted.addListener(details => {
            if (details.url !== "" && details.transitionType === "reload") {
                pageModifyRemote(details.url, details.tabId);
            }
        });
    }
})();
/**
 * Activates highlighting within a tab.
 * @param targetTabId The ID of a tab to highlight within.
 * @param highlightMessageToReceive A message to be received by the tab's highlighting script.
 * This script will first be injected if not already present.
 */
const activateHighlightingInTab = async (targetTabId, highlightMessageToReceive) => {
    const logMetadata = { tabId: targetTabId };
    log("pilot function injection start", "", logMetadata);
    await chrome.scripting.executeScript({
        func: (flag, tabId, highlightMessage) => {
            chrome.runtime.sendMessage({
                executeInTab: !window[flag],
                tabId,
                highlightMessage,
            });
            window[flag] = true;
        },
        args: [WindowFlag.EXECUTION_UNNECESSARY, targetTabId, Object.assign({ extensionCommands: await chrome.commands.getAll() }, highlightMessageToReceive)],
        target: { tabId: targetTabId },
    }).then(value => {
        log("pilot function injection finish", "", logMetadata);
        return value;
    }).catch(() => {
        log("pilot function injection fail", "injection not permitted in this tab", logMetadata);
    });
};
/**
 * Attempts to retrieve terms extracted from the current user selection, in a given tab.
 * @param tabId The ID of a tab from which to take selected terms.
 * @param retriesRemaining The number of retries (after attempting to inject scripts) permitted, if any.
 * @returns The terms extracted if successful, `undefined` otherwise.
 */
const getTermsSelectedInTab = async (tabId, retriesRemaining = 0) => {
    log("selection terms retrieval start", "");
    return chrome.tabs.sendMessage(tabId, { getDetails: { termsFromSelection: true } }).then((response) => {
        var _a, _b;
        log("selection terms retrieval finish", "", { tabId, phrases: ((_a = response.terms) !== null && _a !== void 0 ? _a : []).map(term => term.phrase) });
        return (_b = response.terms) !== null && _b !== void 0 ? _b : [];
    }).catch(async () => {
        log("selection terms retrieval fail", "selection terms not received in response, perhaps no script is injected", { tabId });
        if (!assert(retriesRemaining !== 0, "selection terms retrieval cancel", "no retries remain")) {
            return undefined;
        }
        await executeScriptsInTab(tabId);
        return getTermsSelectedInTab(tabId, retriesRemaining - 1);
    });
};
/**
 * Activates highlighting within a tab using the current user selection, storing appropriate highlighting information.
 * @param tabId The ID of a tab to be linked and within which to highlight.
 */
const activateResearchInTab = async (tabId) => {
    log("research activation start", "", { tabId });
    const local = await getStorageLocal([StorageLocal.PERSIST_RESEARCH_INSTANCES]);
    const session = await getStorageSession([StorageSession.RESEARCH_INSTANCES]);
    const termsSelected = await getTermsSelectedInTab(tabId, 1);
    if (termsSelected === undefined) {
        log("research activation fail", "terms were not received in response, perhaps no script is injected");
        return;
    }
    const researchInstance = session.researchInstances[tabId] && local.persistResearchInstances && !termsSelected.length
        ? session.researchInstances[tabId]
        : await createResearchInstance({
            terms: termsSelected,
            autoOverwritable: false,
        });
    researchInstance.enabled = true;
    researchInstance.autoOverwritable = false;
    session.researchInstances[tabId] = researchInstance;
    await setStorageSession(session);
    await handleMessage({
        toggleHighlightsOn: true,
        highlightCommand: { type: CommandType.FOCUS_TERM_INPUT },
    }, tabId);
    log("research activation finish", "", { tabId });
};
/**
 * Disables the highlighting information about a tab.
 * @param tabId The ID of a tab to be disconnected.
 */
const disableResearchInstanceInTab = async (tabId) => {
    const session = await getStorageSession([StorageSession.RESEARCH_INSTANCES]);
    const researchInstance = session.researchInstances[tabId];
    if (researchInstance) {
        researchInstance.enabled = false;
        setStorageSession(session);
    }
};
/**
 * Removes highlighting within a tab, disabling the associated highlighting information.
 * @param tabId The ID of a tab to be forgotten and within which to deactivate highlighting.
 */
const deactivateResearchInTab = (tabId) => {
    disableResearchInstanceInTab(tabId);
    chrome.tabs.sendMessage(tabId, { deactivate: true });
};
/**
 * Toggles highlighting visibility within a tab.
 * @param tabId The ID of a tab to change the highlighting visibility of.
 * @param toggleHighlightsOn If specified, indicates target visibility. If unspecified, inverse of current visibility is used.
 */
const toggleHighlightsInTab = async (tabId, toggleHighlightsOn) => {
    const sync = await getStorageSync([StorageSync.BAR_CONTROLS_SHOWN]);
    const session = await getStorageSession([StorageSession.RESEARCH_INSTANCES]);
    if (isTabResearchPage(session.researchInstances, tabId)) {
        const researchInstance = session.researchInstances[tabId];
        researchInstance.highlightsShown = toggleHighlightsOn !== null && toggleHighlightsOn !== void 0 ? toggleHighlightsOn : !await chrome.tabs.sendMessage(tabId, { getDetails: { highlightsShown: true } }).then((response) => response.highlightsShown).catch(() => researchInstance.highlightsShown);
        chrome.tabs.sendMessage(tabId, {
            toggleHighlightsOn: researchInstance.highlightsShown,
            autoOverwritable: researchInstance.autoOverwritable,
            barControlsShown: sync.barControlsShown,
        });
        setStorageSession({ researchInstances: session.researchInstances });
    }
};
/**
 * Injects a highlighting script, composed of the highlighting code preceded by its dependencies, into a tab.
 * @param tabId The ID of a tab to execute the script in.
 */
const executeScriptsInTab = async (tabId) => {
    const logMetadata = { tabId };
    log("script injection start", "", logMetadata);
    return chrome.scripting.executeScript({
        files: [
            ScriptLib.STEMMING,
            ScriptLib.DIACRITICS,
            ScriptLib.COMMON,
            Script.CONTENT_MARKER,
        ],
        target: { tabId },
    }).then(value => {
        log("script injection finish (silent failure possible)", "", logMetadata);
        return value;
    }).catch(() => {
        log("script injection fail", "injection not permitted in this tab", logMetadata);
    });
};
chrome.commands.onCommand.addListener(async (commandString) => {
    var _a;
    if (commandString === "open-popup") {
        ((_a = chrome.action["openPopup"]) !== null && _a !== void 0 ? _a : (() => undefined))();
    }
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tabId = tab.id; // `tab.id` always defined for this case.
    const commandInfo = parseCommand(commandString);
    switch (commandInfo.type) {
        case CommandType.OPEN_POPUP: {
            return;
        }
        case CommandType.OPEN_OPTIONS: {
            chrome.runtime.openOptionsPage();
            return;
        }
        case CommandType.TOGGLE_ENABLED: {
            getStorageLocal([StorageLocal.ENABLED]).then(local => {
                setStorageLocal({ enabled: !local.enabled });
                updateActionIcon(!local.enabled);
            });
            return;
        }
        case CommandType.TOGGLE_IN_TAB: {
            const session = await getStorageSession([StorageSession.RESEARCH_INSTANCES]);
            if (isTabResearchPage(session.researchInstances, tabId)) {
                deactivateResearchInTab(tabId);
            }
            else {
                activateResearchInTab(tabId);
            }
            return;
        }
        case CommandType.TOGGLE_HIGHLIGHTS: {
            toggleHighlightsInTab(tabId);
            return;
        }
    }
    chrome.tabs.sendMessage(tabId, { command: commandInfo });
});
/**
 * Decodes a message involving backend extension management.
 * @param message A message intended for the background script.
 * @param senderTabId The ID of a tab assumed to be the message sender.
 */
const handleMessage = async (message, senderTabId) => {
    var _a, _b, _c, _d, _e, _f;
    if (message.highlightMessage !== undefined) {
        if (message.executeInTab) {
            await executeScriptsInTab(message.tabId);
        }
        // FIXME generates errors even when wrapped in try...catch
        chrome.tabs.sendMessage(message.tabId, message.highlightMessage);
    }
    else if (message.toggleResearchOn !== undefined) {
        await setStorageLocal({ enabled: message.toggleResearchOn });
        updateActionIcon(message.toggleResearchOn);
    }
    else if (message.disableTabResearch) {
        deactivateResearchInTab(senderTabId);
    }
    else if (message.performSearch) {
        const session = await getStorageSession([StorageSession.RESEARCH_INSTANCES]);
        chrome.search["search"]({
            query: session.researchInstances[senderTabId].terms.map(term => term.phrase).join(" "),
            tabId: senderTabId,
        });
    }
    else if (message.toggleAutoOverwritable === undefined || Object.keys(message).length > 1) {
        const session = await getStorageSession([StorageSession.RESEARCH_INSTANCES]);
        if (message.makeUnique || !isTabResearchPage(session.researchInstances, senderTabId)) {
            const researchInstance = await createResearchInstance({
                terms: message.terms,
                autoOverwritable: (_a = message.toggleAutoOverwritable) !== null && _a !== void 0 ? _a : true,
            });
            session.researchInstances[senderTabId] = researchInstance;
        }
        if (message.makeUnique || message.toggleHighlightsOn !== undefined) {
            const researchInstance = session.researchInstances[senderTabId]; // From previous `if` statement.
            const sync = await getStorageSync([
                StorageSync.BAR_CONTROLS_SHOWN,
                StorageSync.BAR_LOOK,
                StorageSync.HIGHLIGHT_LOOK,
                StorageSync.MATCH_MODE_DEFAULTS,
                StorageSync.URL_FILTERS,
            ]);
            researchInstance.highlightsShown = (_b = message.toggleHighlightsOn) !== null && _b !== void 0 ? _b : researchInstance.highlightsShown;
            researchInstance.autoOverwritable = (_c = message.toggleAutoOverwritable) !== null && _c !== void 0 ? _c : researchInstance.autoOverwritable;
            setStorageSession(session);
            await activateHighlightingInTab(senderTabId, {
                terms: researchInstance.terms,
                toggleHighlightsOn: determineToggleHighlightsOn(researchInstance.highlightsShown, false),
                autoOverwritable: researchInstance.autoOverwritable,
                barControlsShown: sync.barControlsShown,
                barLook: sync.barLook,
                highlightLook: sync.highlightLook,
                matchMode: sync.matchModeDefaults,
                enablePageModify: isUrlPageModifyAllowed((_d = (await chrome.tabs.get(senderTabId)).url) !== null && _d !== void 0 ? _d : "", sync.urlFilters),
                command: message.highlightCommand,
            });
        }
        else if (message.terms !== undefined) {
            const researchInstance = session.researchInstances[senderTabId];
            researchInstance.terms = message.terms;
            researchInstance.highlightsShown = (_e = message.toggleHighlightsOn) !== null && _e !== void 0 ? _e : researchInstance.highlightsShown;
            researchInstance.autoOverwritable = (_f = message.toggleAutoOverwritable) !== null && _f !== void 0 ? _f : researchInstance.autoOverwritable;
            setStorageSession(session);
            const highlightMessage = { terms: message.terms };
            highlightMessage.termUpdate = message.termChanged;
            highlightMessage.termToUpdateIdx = message.termChangedIdx;
            highlightMessage.autoOverwritable = researchInstance.autoOverwritable;
            chrome.tabs.sendMessage(senderTabId, highlightMessage);
        }
        else {
            setStorageSession(session);
        }
        return;
    }
    if (message.toggleAutoOverwritable !== undefined) {
        const session = await getStorageSession([StorageSession.RESEARCH_INSTANCES]);
        session.researchInstances[senderTabId].autoOverwritable = message.toggleAutoOverwritable;
        setStorageSession(session);
    }
};
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.tab && sender.tab.id !== undefined) {
        handleMessage(message, sender.tab.id);
    }
    else {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(([tab]) => handleMessage(message, tab.id));
    }
    sendResponse(); // Mitigates manifest V3 bug which otherwise logs an error message.
});
chrome.action.onClicked.addListener(() => chrome.permissions.request({ permissions: ["bookmarks"] }));
chrome.permissions.onAdded.addListener(permissions => permissions && permissions.permissions && permissions.permissions.includes("bookmarks")
    ? manageEnginesCacheOnBookmarkUpdate() : undefined);
