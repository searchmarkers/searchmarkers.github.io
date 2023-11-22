"use strict";
if (this.importScripts) {
    // Required for service workers, whereas event pages use declarative imports.
    this.importScripts("/dist/include/utility.js", "/dist/include/pattern-stem.js", "/dist/include/pattern-diacritic.js", "/dist/include/util-privileged.js", "/dist/include/storage.js");
}
// DEPRECATE
/**
 * Creates an object storing highlighting information about a tab, for application to pages within that tab.
 * @param args Arguments for building the initial research instance. Variables in storage may also be used.
 * @returns The resulting research instance.
 */
const createResearchInstance = async (args) => {
    const sync = await storageGet("sync", [
        StorageSync.SHOW_HIGHLIGHTS,
        StorageSync.BAR_COLLAPSE,
    ]);
    if (args.url) {
        const phraseGroups = args.url.engine ? [] : (await getSearchQuery(args.url.url)).split("\"");
        const termsRaw = args.url.engine
            ? args.url.engine.extract(args.url.url ?? "")
            : phraseGroups.flatMap(phraseGroups.length % 2
                ? ((phraseGroup, i) => i % 2 ? phraseGroup : phraseGroup.split(" ").filter(phrase => !!phrase))
                : phraseGroup => phraseGroup.split(" "));
        return {
            terms: Array.from(new Set(termsRaw))
                .filter(phrase => args.url ? !args.url.stoplist.includes(phrase) : false)
                .map(phrase => new MatchTerm(phrase)),
            highlightsShown: sync.showHighlights.default,
            barCollapsed: sync.barCollapse.fromSearch,
            enabled: true,
        };
    }
    args.terms ?? (args.terms = []);
    return {
        terms: args.terms,
        highlightsShown: sync.showHighlights.default,
        barCollapsed: false,
        enabled: true,
    };
};
/**
 * Gets the query string of a potential search.
 * @param url A URL to be tested.
 * @returns The URL segment determined to be the search query, or the empty string if none is found.
 */
const getSearchQuery = async (url) => storageGet("sync", [StorageSync.AUTO_FIND_OPTIONS]).then(sync => new URL(url).searchParams.get(sync.autoFindOptions.searchParams.find(param => new URL(url).searchParams.has(param)) ?? "") ?? "").catch(() => {
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
        if (node.type === "bookmark") {
            setEngine(node);
        }
        (node.children ?? []).forEach(child => setEngines(engines, setEngine, child));
    };
    return () => {
        if (useChromeAPI() || !chrome.bookmarks) {
            return;
        }
        browser.bookmarks.getTree().then(async (nodes) => {
            const session = await storageGet("session", [StorageSession.ENGINES]);
            nodes.forEach(node => setEngines(session.engines, node => {
                if (node.url) {
                    updateEngine(session.engines, node.id, node.url);
                }
            }, node));
            storageSet("session", session);
        });
        browser.bookmarks.onRemoved.addListener(async (id, removeInfo) => {
            const session = await storageGet("session", [StorageSession.ENGINES]);
            setEngines(session.engines, node => {
                delete session.engines[node.id];
            }, removeInfo.node);
            storageSet("session", session);
        });
        browser.bookmarks.onCreated.addListener(async (id, createInfo) => {
            if (createInfo.url) {
                const session = await storageGet("session", [StorageSession.ENGINES]);
                updateEngine(session.engines, id, createInfo.url);
                storageSet("session", session);
            }
        });
        browser.bookmarks.onChanged.addListener(async (id, changeInfo) => {
            if (changeInfo.url) {
                const session = await storageGet("session", [StorageSession.ENGINES]);
                updateEngine(session.engines, id, changeInfo.url);
                storageSet("session", session);
            }
        });
    };
})();
const injectIntoTabs = async () => {
    (await chrome.tabs.query({})).filter(tab => tab.id !== undefined).forEach(tab => {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: [
                "/dist/include/utility.js",
                "/dist/include/pattern-stem.js",
                "/dist/include/pattern-diacritic.js",
                "/dist/content.js",
            ],
        }).catch(() => chrome.runtime.lastError); // Read `lastError` to suppress injection errors.
    });
};
/**
 * Updates the action icon to reflect the extension's enabled/disabled status.
 * @param enabled If specified, overrides the extension's enabled/disabled status.
 */
const updateActionIcon = (enabled) => enabled === undefined
    ? storageGet("local", [StorageLocal.ENABLED]).then(local => updateActionIcon(local.enabled))
    : chrome.action.setIcon({ path: useChromeAPI()
            ? enabled ? "/icons/dist/mms-32.png" : "/icons/dist/mms-off-32.png" // Chromium lacks SVG support for the icon.
            : enabled ? "/icons/mms.svg" : "/icons/mms-off.svg"
    });
(() => {
    const contextMenuListener = async (info, tab) => {
        if (tab && tab.id !== undefined) {
            log("research-activation request", "context menu item activated", { tabId: tab.id });
            activateResearchInTab(tab.id, await getTermsSelectedInTab(tab.id));
        }
        else {
            assert(false, "research-activation (from context menu) void request", "no valid tab", { tab });
        }
    };
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
        if (!chrome.contextMenus.onClicked.hasListener(contextMenuListener)) {
            chrome.contextMenus.onClicked.addListener(contextMenuListener);
        }
    };
    /**
     * Prepares volatile extension components in a new browser session.
     */
    const initialize = () => {
        chrome.runtime.setUninstallURL("https://searchmarkers.github.io/pages/sendoff/");
        try {
            manageEnginesCacheOnBookmarkUpdate();
        }
        catch (error) {
            console.warn("TODO fix bookmark search engines check", error);
        }
        createContextMenuItems();
        optionsRepair();
        storageInitialize();
        updateActionIcon();
    };
    const startOnInstall = (isExtensionInstall, allowOnboarding = true) => {
        if (isExtensionInstall) {
            if (allowOnboarding) {
                chrome.tabs.create({ url: chrome.runtime.getURL("/pages/startpage.html") });
            }
        }
        initialize();
    };
    chrome.runtime.onInstalled.addListener(async (details) => {
        startOnInstall(details.reason === chrome.runtime.OnInstalledReason.INSTALL);
        injectIntoTabs();
    });
    chrome.runtime.onStartup.addListener(initialize);
    createContextMenuItems(); // Ensures context menu items will be recreated on enabling the extension (after disablement).
    storageGet("session", [StorageSession.RESEARCH_INSTANCES]).then(session => {
        if (session.researchInstances === undefined) {
            assert(false, "storage reinitialize", "storage read returned `undefined` when testing on wake");
            storageInitialize();
        }
    });
})();
// AUDITED ABOVE
/**
 * Compares an updated tab with its associated storage in order to identify necessary storage and highlighting changes,
 * then carries out these changes.
 * @param urlString The current URL of the tab, used to infer desired highlighting.
 * @param tabId The ID of a tab to check and interact with.
 */
const pageChangeRespondOld = async (urlString, tabId) => {
    const logMetadata = { timeStart: Date.now(), tabId, url: urlString };
    log("tab-communicate fulfillment start", "", logMetadata);
    const sync = await storageGet("sync", [
        StorageSync.AUTO_FIND_OPTIONS,
        StorageSync.SHOW_HIGHLIGHTS,
        StorageSync.BAR_COLLAPSE,
        StorageSync.BAR_CONTROLS_SHOWN,
        StorageSync.BAR_LOOK,
        StorageSync.HIGHLIGHT_METHOD,
        StorageSync.MATCH_MODE_DEFAULTS,
        StorageSync.URL_FILTERS,
        StorageSync.TERM_LISTS,
    ]);
    const local = await storageGet("local", [StorageLocal.ENABLED]);
    const session = await storageGet("session", [
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
    const isResearchPage = await isTabResearchPage(tabId);
    const overrideHighlightsShown = (searchDetails.isSearch && sync.showHighlights.overrideSearchPages)
        || (isResearchPage && sync.showHighlights.overrideResearchPages);
    // If tab contains a search AND has no research or none: create research based on search (incl. term lists).
    if (searchDetails.isSearch) {
        const researchInstance = await createResearchInstance({ url: {
                stoplist: sync.autoFindOptions.stoplist,
                url: urlString,
                engine: searchDetails.engine,
            } });
        // Apply terms from term lists.
        researchInstance.terms = termsFromLists.concat(getTermsAdditionalDistinct(termsFromLists, researchInstance.terms));
        if (isResearchPage) {
            //await executeScriptsInTabUnsafe(tabId).then(() =>
            messageSendHighlight(tabId, {
                termsOnHold: researchInstance.terms,
            });
            //);
        }
        else {
            session.researchInstances[tabId] = researchInstance;
            log("tab-communicate research enable (not storing yet)", "search detected in tab", logMetadata);
        }
    }
    let highlightActivation = (async () => undefined)();
    // If tab *now* has research OR has applicable term lists: activate highlighting in tab.
    if ((await isTabResearchPage(tabId)) || termsFromLists.length) {
        const highlightActivationReason = termsFromLists.length
            ? (await isTabResearchPage(tabId))
                ? "tab is a research page which term lists apply to"
                : "tab is a page which terms lists apply to"
            : "tab is a research page";
        log("tab-communicate highlight activation request", highlightActivationReason, logMetadata);
        const researchInstance = session.researchInstances[tabId] ?? await createResearchInstance({});
        researchInstance.terms = researchInstance.enabled
            ? researchInstance.terms.concat(getTermsAdditionalDistinct(researchInstance.terms, termsFromLists))
            : termsFromLists;
        if (!await isTabResearchPage(tabId)) {
            researchInstance.barCollapsed = sync.barCollapse.fromTermListAuto;
        }
        researchInstance.enabled = true;
        highlightActivation = messageSendHighlight(tabId, {
            terms: researchInstance.terms,
            toggleHighlightsOn: determineToggleHighlightsOn(researchInstance.highlightsShown, overrideHighlightsShown),
            toggleBarCollapsedOn: researchInstance.barCollapsed,
            barControlsShown: sync.barControlsShown,
            barLook: sync.barLook,
            highlightMethod: sync.highlightMethod,
            matchMode: sync.matchModeDefaults,
            useClassicHighlighting: sync.highlightMethod.paintReplaceByClassic,
            enablePageModify: isUrlPageModifyAllowed(urlString, sync.urlFilters),
        });
        session.researchInstances[tabId] = researchInstance;
    }
    storageSet("session", { researchInstances: session.researchInstances });
    await highlightActivation;
    log("tab-communicate fulfillment finish", "", logMetadata);
};
(() => {
    chrome.tabs.onCreated.addListener(async (tab) => {
        let openerTabId = tab.openerTabId;
        if (tab.id === undefined || /\b\w+:(\/\/)?newtab\//.test(tab.pendingUrl ?? tab.url ?? "")) {
            return;
        }
        if (openerTabId === undefined) {
            if (!useChromeAPI()) { // Must check `openerTabId` manually for Chromium, which may not define it on creation.
                return;
            }
            openerTabId = (await chrome.tabs.get(tab.id)).openerTabId;
            if (openerTabId === undefined) {
                return;
            }
        }
        log("tab-communicate obligation check", "tab created", { tabId: tab.id });
        const session = await storageGet("session", [StorageSession.RESEARCH_INSTANCES]);
        if (await isTabResearchPage(openerTabId)) {
            session.researchInstances[tab.id] = { ...session.researchInstances[openerTabId] };
            storageSet("session", session);
            pageChangeRespondOld(tab.url ?? "", tab.id); // New tabs may fail to trigger web navigation, due to loading from cache.
        }
    });
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
        if (useChromeAPI()) {
            // Chromium emits no `tabs` event for tab reload.
            if (changeInfo.status === "loading" || changeInfo.status === "complete") {
                pageChangeRespondOld((await chrome.tabs.get(tabId)).url ?? "", tabId);
            }
        }
        else if (changeInfo.url) {
            pageChangeRespondOld(changeInfo.url, tabId);
        }
    });
    chrome.tabs.onRemoved.addListener(async (tabId) => {
        const session = await storageGet("session", [StorageSession.RESEARCH_INSTANCES]);
        if (session.researchInstances[tabId]) {
            delete session.researchInstances[tabId];
            storageSet("session", session);
        }
    });
}); //();
(() => {
    const pageChangeRespond = async (urlString, tabId) => {
        const logMetadata = { timeStart: Date.now(), tabId, url: urlString };
        log("tab-communicate fulfillment start", "", logMetadata);
        const sync = await storageGet("sync", [
            StorageSync.AUTO_FIND_OPTIONS,
            StorageSync.SHOW_HIGHLIGHTS,
            StorageSync.BAR_COLLAPSE,
            StorageSync.URL_FILTERS,
            StorageSync.TERM_LISTS,
        ]);
        const local = await storageGet("local", [StorageLocal.ENABLED]);
        const session = await storageGet("session", [
            StorageSession.RESEARCH_INSTANCES,
            StorageSession.ENGINES,
        ]);
        const searchDetails = local.enabled
            ? await isTabSearchPage(session.engines, urlString)
            : { isSearch: false };
        searchDetails.isSearch = searchDetails.isSearch && isUrlSearchHighlightAllowed(urlString, sync.urlFilters);
        const termsFromLists = sync.termLists
            .filter(termList => isUrlFilteredIn(new URL(urlString), termList.urlFilter))
            .flatMap(termList => termList.terms);
        const getTermsAdditionalDistinct = (terms, termsExtra) => termsExtra
            .filter(termExtra => !terms.find(term => term.phrase === termExtra.phrase));
        const isResearchPage = await isTabResearchPage(tabId);
        const overrideHighlightsShown = (searchDetails.isSearch && sync.showHighlights.overrideSearchPages) ||
            (isResearchPage && sync.showHighlights.overrideResearchPages);
        // BELOW CONTENTS NOT AUDITED
        // If tab contains a search AND has no research or none: create research based on search (incl. term lists).
        if (searchDetails.isSearch) {
            const researchInstance = await createResearchInstance({ url: {
                    stoplist: sync.autoFindOptions.stoplist,
                    url: urlString,
                    engine: searchDetails.engine,
                } });
            // Apply terms from term lists.
            researchInstance.terms = termsFromLists.concat(getTermsAdditionalDistinct(termsFromLists, researchInstance.terms));
            if (isResearchPage) {
                messageSendHighlight(tabId, {
                    termsOnHold: researchInstance.terms,
                });
            }
            else {
                session.researchInstances[tabId] = researchInstance;
                log("tab-communicate research enable (not storing yet)", "search detected in tab", logMetadata);
            }
        }
        let highlightActivation = (async () => undefined)();
        // If tab *now* has research OR has applicable term lists: activate highlighting in tab.
        if ((await isTabResearchPage(tabId)) || termsFromLists.length) {
            const highlightActivationReason = termsFromLists.length
                ? (await isTabResearchPage(tabId))
                    ? "tab is a research page which term lists apply to"
                    : "tab is a page which terms lists apply to"
                : "tab is a research page";
            log("tab-communicate highlight activation request", highlightActivationReason, logMetadata);
            const researchInstance = session.researchInstances[tabId] ?? await createResearchInstance({});
            researchInstance.terms = researchInstance.enabled
                ? researchInstance.terms.concat(getTermsAdditionalDistinct(researchInstance.terms, termsFromLists))
                : termsFromLists;
            if (!await isTabResearchPage(tabId)) {
                researchInstance.barCollapsed = sync.barCollapse.fromTermListAuto;
            }
            researchInstance.enabled = true;
            highlightActivation = messageSendHighlight(tabId, {
                terms: researchInstance.terms,
                toggleHighlightsOn: determineToggleHighlightsOn(researchInstance.highlightsShown, overrideHighlightsShown),
            });
            session.researchInstances[tabId] = researchInstance;
        }
        storageSet("session", { researchInstances: session.researchInstances });
        await highlightActivation;
        log("tab-communicate fulfillment finish", "", logMetadata);
    };
    chrome.tabs.onCreated.addListener(async (tab) => {
        let openerTabId = tab.openerTabId;
        if (tab.id === undefined || /\b\w+:(\/\/)?newtab\//.test(tab.pendingUrl ?? tab.url ?? "")) {
            return;
        }
        if (openerTabId === undefined) {
            if (!useChromeAPI()) { // Must check `openerTabId` manually for Chromium, which may not define it on creation.
                return;
            }
            openerTabId = (await chrome.tabs.get(tab.id)).openerTabId;
            if (openerTabId === undefined) {
                return;
            }
        }
        log("tab-communicate obligation check", "tab created", { tabId: tab.id });
        const session = await storageGet("session", [StorageSession.RESEARCH_INSTANCES]);
        if (await isTabResearchPage(openerTabId)) {
            session.researchInstances[tab.id] = { ...session.researchInstances[openerTabId] };
            storageSet("session", session);
            pageChangeRespond(tab.url ?? "", tab.id); // New tabs may fail to trigger web navigation, due to loading from cache.
        }
    });
    const pageEventListener = async (tabId, changeInfo) => {
        // Note: emitted events differ between Firefox and Chromium.
        if (changeInfo.url || changeInfo.status === "loading" || changeInfo.status === "complete") {
            pageChangeRespond(changeInfo.url ?? (await chrome.tabs.get(tabId)).url ?? "", tabId);
        }
    };
    // Note: emitted events differ between Firefox and Chromium.
    if (useChromeAPI()) {
        chrome.tabs.onUpdated.addListener(pageEventListener);
    }
    else {
        browser.tabs.onUpdated.addListener(pageEventListener, { properties: ["url", "status"] });
    }
    chrome.tabs.onRemoved.addListener(async (tabId) => {
        const session = await storageGet("session", [StorageSession.RESEARCH_INSTANCES]);
        if (session.researchInstances[tabId]) {
            delete session.researchInstances[tabId];
            storageSet("session", session);
        }
    });
})();
/**
 * Attempts to retrieve terms extracted from the current user selection, in a given tab.
 * @param tabId The ID of a tab from which to take selected terms.
 * @returns The terms extracted if successful, `undefined` otherwise.
 */
const getTermsSelectedInTab = async (tabId) => {
    log("selection-terms-retrieval start", "");
    return messageSendHighlight(tabId, { getDetails: { termsFromSelection: true } }).then(response => {
        log("selection-terms-retrieval finish", "", { tabId, phrases: (response.terms ?? []).map(term => term.phrase) });
        return response.terms ?? [];
    }).catch(() => {
        log("selection-terms-retrieval fail", "selection terms not received in response, perhaps no script is injected", { tabId });
        return undefined;
    });
};
/**
 * Activates highlighting within a tab using the current user selection, storing appropriate highlighting information.
 * @param tabId The ID of a tab to be linked and within which to highlight.
 */
const activateResearchInTab = async (tabId, terms = []) => {
    log("research-activation start", "", { tabId });
    const local = await storageGet("local", [StorageLocal.PERSIST_RESEARCH_INSTANCES]);
    const session = await storageGet("session", [StorageSession.RESEARCH_INSTANCES]);
    const researchInstance = session.researchInstances[tabId] && local.persistResearchInstances && !terms.length
        ? session.researchInstances[tabId]
        : await createResearchInstance({ terms });
    researchInstance.enabled = true;
    session.researchInstances[tabId] = researchInstance;
    storageSet("session", session);
    await messageHandleBackground({
        tabId,
        terms: researchInstance.terms,
        termsSend: true,
        toggle: {
            highlightsShownOn: true,
        },
        highlightCommands: [{ type: CommandType.FOCUS_TERM_INPUT }],
    });
    log("research-activation finish", "", { tabId });
};
/**
 * Removes highlighting within a tab, disabling the associated highlighting information.
 * @param tabId The ID of a tab to be forgotten and within which to deactivate highlighting.
 */
const deactivateResearchInTab = async (tabId) => {
    log("research-deactivation start", "", { tabId });
    const session = await storageGet("session", [StorageSession.RESEARCH_INSTANCES]);
    const researchInstance = session.researchInstances[tabId];
    if (researchInstance) {
        if (researchInstance.terms.length) {
            researchInstance.enabled = false;
        }
        else {
            delete session.researchInstances[tabId];
        }
        storageSet("session", session);
    }
    await messageSendHighlight(tabId, { deactivate: true });
    log("research-deactivation finish", "", { tabId });
};
/**
 * Toggles highlighting visibility within a tab.
 * @param tabId The ID of a tab to change the highlighting visibility of.
 * @param toggleHighlightsOn If specified, indicates target visibility. If unspecified, inverse of current visibility is used.
 */
const toggleHighlightsInTab = async (tabId, toggleHighlightsOn) => {
    if (!await isTabResearchPage(tabId)) {
        return;
    }
    const sync = await storageGet("sync", [StorageSync.BAR_CONTROLS_SHOWN]);
    const session = await storageGet("session", [StorageSession.RESEARCH_INSTANCES]);
    const researchInstance = session.researchInstances[tabId];
    researchInstance.highlightsShown = toggleHighlightsOn
        ?? !await messageSendHighlight(tabId, { getDetails: { highlightsShown: true } }).then(response => response.highlightsShown).catch(() => researchInstance.highlightsShown);
    messageSendHighlight(tabId, {
        toggleHighlightsOn: researchInstance.highlightsShown,
        barControlsShown: sync.barControlsShown,
    });
    storageSet("session", { researchInstances: session.researchInstances });
};
chrome.commands.onCommand.addListener(async (commandString) => {
    if (commandString === "open-popup") {
        (chrome.action["openPopup"] ?? (() => undefined))();
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
            storageGet("local", [StorageLocal.ENABLED]).then(local => {
                storageSet("local", { enabled: !local.enabled });
                updateActionIcon(!local.enabled);
            });
            return;
        }
        case CommandType.TOGGLE_IN_TAB: {
            if (await isTabResearchPage(tabId)) {
                deactivateResearchInTab(tabId);
            }
            else {
                activateResearchInTab(tabId, await getTermsSelectedInTab(tabId));
            }
            return;
        }
        case CommandType.TOGGLE_HIGHLIGHTS: {
            toggleHighlightsInTab(tabId);
            return;
        }
        case CommandType.TOGGLE_BAR: {
            const session = await storageGet("session", [StorageSession.RESEARCH_INSTANCES]);
            const researchInstance = session.researchInstances[tabId];
            if (!researchInstance) {
                return;
            }
            researchInstance.barCollapsed = !researchInstance.barCollapsed;
            messageSendHighlight(tabId, {
                toggleBarCollapsedOn: researchInstance.barCollapsed,
            });
            storageSet("session", session);
            return;
        }
    }
    messageSendHighlight(tabId, { commands: [commandInfo] });
});
// AUDITED BELOW
/**
 * Decodes a message involving backend extension management.
 * @param message A message intended for the background script.
 */
const messageHandleBackground = async (message) => {
    const tabId = message.tabId;
    if (message.terms) {
        const logMetadata = { tabId, terms: message.terms };
        log("terms-assign start", "", logMetadata);
        const session = await storageGet("session", [StorageSession.RESEARCH_INSTANCES]);
        const researchInstance = session.researchInstances[tabId];
        if (researchInstance) {
            researchInstance.terms = message.terms;
            await storageSet("session", session);
            log("terms-assign finish", "research instance created with terms", logMetadata);
        }
        else {
            const researchInstance = await createResearchInstance({ terms: message.terms });
            session.researchInstances[tabId] = researchInstance;
            await storageSet("session", session);
            log("terms-assign finish", "terms assigned to existing research instance", logMetadata);
        }
    }
    const highlightMessage = {
        terms: message.termsSend
            ? (message.terms
                ?? (await storageGet("session", [StorageSession.RESEARCH_INSTANCES])).researchInstances[tabId]?.terms)
            : undefined,
        commands: message.highlightCommands,
    };
    if (Object.values(highlightMessage).some(value => value !== undefined)) {
        const logMetadata = { tabId, message: highlightMessage };
        log("message-send start", "", logMetadata);
        await messageSendHighlight(tabId, highlightMessage);
        log("message-send finish", "", logMetadata);
    }
    if (message.toggle) {
        const toggle = message.toggle;
        const logMetadata = { tabId, toggle };
        log("flags-toggle start", "", logMetadata);
        if (toggle.highlightsShownOn !== undefined) {
            await toggleHighlightsInTab(tabId, toggle.highlightsShownOn);
        }
        if (toggle.barCollapsedOn !== undefined) {
            const session = await storageGet("session");
            if (await isTabResearchPage(tabId)) {
                session.researchInstances[tabId].barCollapsed = toggle.barCollapsedOn;
                await storageSet("session", session);
            }
        }
        log("flags-toggle finish", "", logMetadata);
    }
    if (message.deactivateTabResearch) {
        deactivateResearchInTab(tabId);
    }
    if (message.performSearch) {
        const session = await storageGet("session", [StorageSession.RESEARCH_INSTANCES]);
        chrome.search["search"]({
            query: session.researchInstances[tabId].terms.map(term => term.phrase).join(" "),
            tabId,
        });
    }
    if (message.initializationGet) {
        log("initialization-return start", "", { tabId });
        const sync = (await storageGet("sync", [
            StorageSync.BAR_CONTROLS_SHOWN,
            StorageSync.BAR_LOOK,
            StorageSync.HIGHLIGHT_METHOD,
            StorageSync.MATCH_MODE_DEFAULTS,
        ]));
        const session = await storageGet("session", [StorageSession.RESEARCH_INSTANCES]);
        const researchInstance = session.researchInstances[tabId];
        if (researchInstance) {
            log("initialization-return finish", "", { tabId });
            return {
                terms: researchInstance.terms,
                toggleHighlightsOn: researchInstance.highlightsShown,
                toggleBarCollapsedOn: researchInstance.barCollapsed,
                barControlsShown: sync.barControlsShown,
                barLook: sync.barLook,
                highlightMethod: sync.highlightMethod,
                matchMode: sync.matchModeDefaults,
                useClassicHighlighting: sync.highlightMethod.paintReplaceByClassic,
                enablePageModify: isUrlPageModifyAllowed((await chrome.tabs.get(tabId)).url ?? "", sync.urlFilters),
            };
        }
        else {
            log("initialization-return fail", "no corresponding research instance exists", { tabId });
        }
    }
    return null;
};
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        message.tabId ?? (message.tabId = sender.tab?.id ?? (await chrome.tabs.query({ active: true, lastFocusedWindow: true }))[0].id);
        messageHandleBackground(message).then(sendResponse);
    })();
    return true;
});
chrome.permissions.onAdded.addListener(permissions => {
    if (permissions?.permissions?.includes("bookmarks")) {
        manageEnginesCacheOnBookmarkUpdate();
    }
    else {
        console.log(permissions);
        injectIntoTabs();
    }
});
