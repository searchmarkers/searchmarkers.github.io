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
            set: async () => undefined,
            get: async () => {
                const store = {};
                Object.keys(StorageSession).forEach(key => store[key] = {});
                return store;
            },
        },
        local: {
            set: async () => undefined,
            get: async () => {
                const store = {};
                Object.keys(StorageLocal).forEach(key => store[key] = {});
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
    },
};
