"use strict"
window["chrome"] = {
    runtime: {
        getManifest: () => ({
            name: "Mark My Search",
            version: "X.Y.Z",
        }),
    },
    storage: {
        session: {
            set: () => undefined,
            get: () => {
                const store = {};
                Object.keys(StorageSession).forEach(key => store[key] = {});
                return store;
            },
        },
        local: {
            set: () => undefined,
            get: () => {
                const store = {};
                Object.keys(StorageLocal).forEach(key => store[key] = {});
                return store;
            },
        },
        sync: {
            set: () => undefined,
            get: () => defaultOptions,
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
    },
};
