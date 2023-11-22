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
//
