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
                        text: "Farewell",
                    },
                    interactions: [
                        {
                            className: "action",
                            label: {
                                text: "Uninstallation successful",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "We're sorry to see you go. Please consider filling out this form so we can improve for the future!",
                            },
                            note: {
                                text: `If you do not wish to submit feedback, simply close this tab and carry on.
However, Mark My Search will only improve if we know what needs fixing.`,
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "All data is sent stripped of any personal information, and will be viewed only by the developer of Mark My Search.",
                            },
                            submitters: [{
                                    text: "Submit",
                                    onClick: (messageText, onSuccess, onError) => {
                                        sendProblemReport(messageText)
                                            .then(onSuccess)
                                            .catch(onError);
                                    },
                                    formFields: [
                                        {
                                            className: "TODOreplace",
                                            label: {
                                                text: "it's just bad",
                                            },
                                            checkbox: {},
                                        },
                                        {
                                            className: "TODOreplace",
                                            label: {
                                                text: "do not like",
                                            },
                                            checkbox: {},
                                        },
                                    ],
                                    message: {
                                        rows: 6,
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
                                            text: "Pending, do not close tab",
                                        },
                                    },
                                }],
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
