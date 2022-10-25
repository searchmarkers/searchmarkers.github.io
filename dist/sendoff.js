"use strict";
const loadSendoff = (() => {
    const panelsInfo = [
        {
            className: "panel-general",
            name: {
                text: "Sendoff",
            },
            sections: [
                {
                    title: {
                        text: "How To Use",
                    },
                    interactions: [
                        {
                            className: "action",
                            label: {
                                text: "1. Search for anything on your preferred search engine.",
                            },
                            note: {
                                text: "Try \"mark my search\" on DuckDuckGo or Google to find our pages!",
                            },
                        },
                    ],
                },
                {
                    title: {
                        text: "Operation",
                    },
                    interactions: [
                        {
                            className: "action",
                            label: {
                                text: "Highlighting - activate or deactivate",
                            },
                            note: {
                                text: "Alt+Shift+M",
                            },
                        },
                    ],
                },
                {
                    title: {
                        text: "Contributing",
                    },
                    interactions: [
                        {
                            className: "action",
                            label: {
                                text: "Report a problem",
                            },
                            submitters: [{
                                    text: "Submit anonymously",
                                    onClick: (messageText, onSuccess, onError) => {
                                        sendProblemReport(messageText)
                                            .then(onSuccess)
                                            .catch(onError);
                                    },
                                    message: {
                                        rows: 3,
                                        placeholder: "Optional message",
                                    },
                                    alerts: {
                                        [PageAlertType.SUCCESS]: {
                                            text: "Success",
                                        },
                                        [PageAlertType.FAILURE]: {
                                            text: "Status {status}: {text}",
                                        },
                                        [PageAlertType.PENDING]: {
                                            text: "Pending, do not close popup",
                                        },
                                    },
                                }],
                            note: {
                                text: "Submits: version, url, keywords, message",
                            },
                        },
                        {
                            className: "link",
                            anchor: {
                                url: "https://github.com/searchmarkers/mark-my-search/issues/new",
                                text: "Have a problem or idea? Open an issue",
                            },
                        },
                        {
                            className: "link",
                            anchor: {
                                url: "https://github.com/searchmarkers/mark-my-search",
                                text: "Mark My Search is developed here",
                            },
                        },
                    ],
                },
            ],
        },
    ];
    return () => {
        const title = document.createElement("title");
        title.text = `${getName()} - Start`;
        document.head.appendChild(title);
        loadPage(panelsInfo, `
body
	{ border: unset; }
.container-tab > .tab
	{ flex: unset; padding-inline: 10px; }
		`);
    };
})();
(() => {
    return () => {
        loadSendoff();
    };
})()();
