"use strict";
const loadStartpage = (() => {
    const panelsInfo = [
        {
            className: "panel-general",
            name: {
                text: "Start",
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
                        {
                            className: "action",
                            label: {
                                text: "2. Wait for results to load to see your keywords highlighted.",
                            },
                            note: {
                                text: `Generic keywords such as "my" and "the" are excluded.
If highlighting has not worked, try Troubleshooting.`,
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "3. You're done! The same keywords will be highlighted on any page you visit from the results.",
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
                        {
                            className: "action",
                            label: {
                                text: "Highlighting - activation by search",
                            },
                            note: {
                                text: "Search on any search engine.",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Keywords - create or edit",
                            },
                            note: {
                                text: `Click the pen button next to a keyword, or the + button, to open a text input.
Type your new keyword into the input and press [Enter] or click off when you're done.`,
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Keywords - remove",
                            },
                            note: {
                                text: "Edit a keyword then delete the text or click the bin button, or right-click a keyword's pen button.",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Keywords - change matching",
                            },
                            note: {
                                text: `Click the 3-dots button next to a keyword (or press [Shift+Space] while editing) \
and click an option (or press the key underlined), or pull down from a keyword and release over an option.
See Matching for details of these options.`,
                            },
                        },
                    ],
                },
                {
                    title: {
                        text: "Keyword Matching",
                    },
                    interactions: [
                        {
                            className: "action",
                            label: {
                                text: "Matching options affect how strictly Mark My Search looks for a keyword.",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Case sensitivity",
                            },
                            note: {
                                text: "\"Mark\" matches \"Mark\" but not \"mark\", \"MARK\", \"mArk\", etc.",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Whole words",
                            },
                            note: {
                                text: "\"a\" is matched in \"b a b\" but not in \"bab\", \"ba b\", or \"b ab\".",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Stemming",
                            },
                            note: {
                                text: "\"marking\" matches \"mark\", \"marks\", \"marker\", \"marked\", \"marking\", etc.",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Diacritics insensitivity",
                            },
                            note: {
                                text: "\"şéârçh\" matches \"search\".",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Regex mode",
                            },
                            note: {
                                text: "Enter a custom expression for advanced matching.",
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
                                text: "Found a problem? File a bug report",
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
        {
            className: "panel-features",
            name: {
                text: "Start",
            },
            sections: [
                {
                    title: {
                        text: "Features",
                    },
                    interactions: [
                        {
                            className: "action",
                            label: {
                                text: "Inserts highlighting for keyword matches in the page.",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Inserts scroll markers showing the position of highlights.",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Toolbar - click keyword buttons to scroll to the next match.",
                            },
                            note: {
                                text: "Press [Shift+Space] to jump to the next generic match, or assign a shortcut like [Alt+Shift+1] for each term.",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Toolbar - view and edit keywords with the pen/bin and 3-dots buttons, create them with the + button.",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Toolbar - see the number of matches for a keyword by hovering over it with your cursor.",
                            },
                            note: {
                                text: "If the keyword background is grey, no matches were found.",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Settings - open the popup at any time to quickly change highlighting options.",
                            },
                            note: {
                                text: "Settings - open the popup at any time to quickly change highlighting options.",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Settings - open the options page for advanced configuration.",
                            },
                            note: {
                                text: "Open the popup and click 'More options' or use your browser's standard method.",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Filtering - exclude misbehaving websites from highlighting.",
                            },
                            note: {
                                text: "Open the popup, go to Highlight, enter e.g. \"example.com\" into the Never Highlight list.",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Filtering - exclude websites from being detected as search engines.",
                            },
                            note: {
                                text: "Open the popup, go to Highlight, enter e.g. \"example.com\" into the Not Search Engines list.",
                            },
                        },
                    ],
                },
            ],
        },
    ];
    return () => {
        loadPage(panelsInfo, `
body
	{ border: unset; }
.container-tab > .tab
	{ flex: unset; }
		`);
    };
})();
(() => {
    return () => {
        loadStartpage();
    };
})()();
