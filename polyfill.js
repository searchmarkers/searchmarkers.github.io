window["chrome"] = {
    runtime: {
        getManifest: () => ({
            name: "Mark My Search",
            version: "X.Y.Z",
        }),
    },
    storage: {
        session: {},
        local: {},
        sync: {},
    },
};
