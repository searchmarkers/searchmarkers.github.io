"use strict";
/**
 * Loads the startpage content into the page.
 * This presents the user with expandable onboarding information and functions, for use when the user has installed the extension.
 */
const loadStartpage = (() => {
    /**
     * Details of the page's panels and their various components.
     */
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
                                text: "Search on DuckDuckGo, Google, or anywhere else",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "See your keywords highlighted in the search results",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "You're done! See highlights on any site you visit",
                            },
                        },
                        {
                            className: "action",
                            submitters: [{
                                    text: "Try it out",
                                    // Allow the user to try out the extension by searching for the query string, if any, they entered into the input.
                                    // Prefer highlighting within the startpage, fallback to searching with their default search provider.
                                    onClick: (messageText, formFields, onSuccess) => {
                                        if (chrome.runtime.getURL("/").startsWith("chrome-extension://")) {
                                            chrome.search["query"]({
                                                disposition: "NEW_TAB",
                                                text: messageText,
                                            }, onSuccess);
                                        }
                                        else {
                                            messageSendBackground({
                                                toggleHighlightsOn: true,
                                                makeUnique: true,
                                                terms: messageText.split(" ").filter(phrase => phrase !== "").map(phrase => new MatchTerm(phrase)),
                                            });
                                            onSuccess();
                                        }
                                    },
                                    message: {
                                        singleline: true,
                                        rows: 1,
                                        placeholder: "Search words",
                                    },
                                }],
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
                                text: "Activate or deactivate with Alt+M",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Activate automatically by searching online",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Keywords - create or edit",
                            },
                            note: {
                                text: "Click (+) or the pen button, type your new keyword, then press [Enter] or click out.",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Keywords - remove",
                            },
                            note: {
                                text: "While editing a keyword, delete the text or click the bin button.",
                            },
                        },
                        {
                            className: "action",
                            label: {
                                text: "Keywords - change matching",
                            },
                            note: {
                                text: "Use [Shift+Space] while editing or the 3-dots button, and click an option.",
                            },
                        },
                    ],
                },
            ],
        },
        {
            className: "panel-features",
            name: {
                text: "Features",
            },
            sections: [
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
                        text: "Advanced Operation",
                    },
                    interactions: [
                        {
                            className: "action",
                            label: {
                                text: "Toolbar - click keyword buttons to scroll to the next match.",
                            },
                            note: {
                                text: `Press [Alt+Space] to jump to the next generic match, and [Alt+Shift+Space] for the previous,
or assign a shortcut like [Alt+Shift+1] for individual terms.`,
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
                                text: "Click the extensions icon and pin Mark My Search to the toolbar.",
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
        loadStartpage();
    };
})()();
