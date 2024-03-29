"use strict";
var PageAlertType;
(function (PageAlertType) {
    PageAlertType["SUCCESS"] = "success";
    PageAlertType["FAILURE"] = "failure";
    PageAlertType["PENDING"] = "pending";
})(PageAlertType || (PageAlertType = {}));
//enum PageButtonClass {
//	TOGGLE = "toggle",
//	ENABLED = "enabled",
//}
/**
 * An EmailJS library function which sends an email using the EmailJS service.
 * @param service The name of a service category for the email.
 * @param template The name of a template under the service for the email.
 * @param details Custom template field entries.
 * @param key The API key to use.
 */
const sendEmail = window["libSendEmail"];
/**
 * Sends a problem report message to a dedicated inbox.
 * @param userMessage An optional message string to send as a comment.
    */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sendProblemReport = async (userMessage = "", formFields) => {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const session = await storageGet("session", [StorageSession.RESEARCH_INSTANCES]);
    const phrases = session.researchInstances[tab.id]
        ? session.researchInstances[tab.id].terms.map((term) => term.phrase).join(" ∣ ")
        : "";
    const message = {
        addon_version: chrome.runtime.getManifest().version,
        url: tab.url,
        phrases,
        user_message: userMessage,
    };
    (formFields ?? []).forEach((formField, i) => {
        message[`item_${i}_question`] = formField.question;
        message[`item_${i}_response`] = formField.response === "true" ? "yes" : "";
    });
    return sendEmail("service_mms_ux", formFields.length ? "template_mms_ux_form" : "template_mms_ux_report", message, "NNElRuGiCXYr1E43j");
};
// TODO document functions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const pageInsertWarning = (container, text) => {
    const warning = document.createElement("div");
    warning.classList.add("warning");
    warning.textContent = text;
    container.appendChild(warning);
};
const pageFocusScrollContainer = () => document.querySelector(".container-panel").focus();
/**
 *
 * @param panelsInfo
 * @param additionalStyleText
 * @param shiftModifierIsRequired
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const loadPage = (() => {
    /**
     * Fills and inserts a CSS stylesheet element to style the page.
     */
    const fillAndInsertStylesheet = (additionalStyleText = "") => {
        const style = document.createElement("style");
        style.textContent = `
body
	{ height: 100vh; margin: 0; border: 2px solid hsl(300 100% 14%); border-radius: 8px; overflow: hidden;
	font-family: ubuntu, sans-serif; background: hsl(300 100% 6%); }
*
	{ font-size: 16px; scrollbar-color: hsl(300 50% 40% / 0.5) transparent; }
::-webkit-scrollbar
	{ width: 5px; }
::-webkit-scrollbar-thumb
	{ background: hsl(300 50% 40% / 0.5); }
::-webkit-scrollbar-thumb:hover
	{ background: hsl(300 50% 60% / 0.5); }
::-webkit-scrollbar-thumb:active
	{ background: hsl(300 50% 80% / 0.5); }
textarea
	{ resize: none; }
#frame
	{ display: flex; flex-direction: column; height: 100%; border-radius: inherit; background: inherit; }
.brand
	{ display: flex; }
.brand > *
	{ margin: 6px; }
.brand .name
	{ flex: 1; align-self: center; text-align: right; font-weight: bold; color: hsl(0 0% 74%); }
.brand .version
	{ align-self: center; font-size: 14px; color: hsl(0 0% 80% / 0.5); }
.brand .logo
	{ width: 32px; height: 32px; }
.container-tab
	{ display: flex; justify-content: center;
	border-top: 2px solid hsl(300 30% 32%); border-bottom-left-radius: inherit; border-bottom-right-radius: inherit; }
.container-tab > .tab
	{ flex: 1 1 auto; font-size: 14px; border: none; border-bottom: 2px solid transparent; border-radius: inherit;
	background: transparent; color: hsl(300 20% 90%); }
.container-tab > .tab:hover
	{ background: hsl(300 30% 22%); }
.container-panel
	{ flex: 1 1 auto; border-top: 2px ridge hsl(300 50% 30%); border-top-left-radius: inherit; overflow-y: auto;
	outline: none; background: hsl(300 16% 30%); }
@supports (overflow-y: overlay)
	{ .container-panel { overflow-y: overlay; }; }
.container-panel > .panel
	{ display: none; flex-direction: column; gap: 1px;
	border-radius: inherit; background: hsl(0 0% 100% / 0.26); box-shadow: 0 0 10px; }
.container-panel > .panel, .brand
	{ margin-inline: max(0px, calc((100vw - 700px)/2)); }
.warning
	{ padding: 4px; border-radius: 2px; background: hsl(60 39% 71%); color: hsl(0 0% 8%); white-space: break-spaces; }
/**/

.panel-sites_search_research .container-tab > .tab.panel-sites_search_research,
.panel-term_lists .container-tab > .tab.panel-term_lists,
.panel-features .container-tab > .tab.panel-features,
.panel-general .container-tab > .tab.panel-general
	{ border-bottom: 2px solid hsl(300 100% 50%); background: hsl(300 30% 32%); }
.panel-sites_search_research .container-panel > .panel.panel-sites_search_research,
.panel-term_lists .container-panel > .panel.panel-term_lists,
.panel-features .container-panel > .panel.panel-features,
.panel-general .container-panel > .panel.panel-general
	{ display: flex; }
/**/

.panel .section
	{ display: flex; flex-direction: column; width: 100%; background: hsl(300 100% 7%); }
.panel .section > .title, .panel .section > .title-row, .panel .section > .title-row > .title
	{ border: none; background: none; text-align: center; font-size: 15px; color: hsl(300 20% 60%); }
.panel .section > .title-row > .title
	{ flex: 1; }
.panel.panel .section > .container
	{ display: flex; flex-direction: column; height: auto; overflow-y: auto; }
@supports (overflow-y: overlay)
	{ .panel.panel .section > .container { overflow-y: overlay; }; }
/**/

.panel .interaction
	{ display: flex; flex-direction: column; padding-inline: 8px; padding-block: 4px; }
.panel .list
	{ display: flex; margin: 0; border: 0; }
.panel .list.column
	{ flex-direction: column; }
.panel .list.row
	{ flex-direction: row; gap: 8px; }
.panel .list.row > *
	{ flex: 1; }
.panel .interaction.option
	{ flex-direction: row; padding-block: 0; user-select: none; }
.panel .interaction > *, .panel .organizer > *, .panel .term
	{ margin-block: 2px; border-radius: 2px; padding-block: 4px; }
.panel .interaction input[type="text"],
.panel .interaction textarea,
.panel .interaction .submitter
	{ border: none; background: hsl(300 60% 16%); color: hsl(0 0% 90%); font-family: inherit; }
.panel .interaction input[type="checkbox"]
	{ align-self: center; }
.panel .interaction:is(.action, .link, .organizer) > *
	{ padding-block: 0; }
.panel .interaction .label, .alert
	{ color: hsl(300 0% 72%); }
.panel .interaction.option label.label[for]:hover
	{ color: hsl(300 0% 66%); }
.panel .interaction .submitter
	{ padding-block: 3px; }
.panel .interaction .submitter:disabled
	{ pointer-events: none; color: hsl(0 0% 60%); }
.panel .interaction .alert,
.panel .interaction .submitter
	{ padding-inline: 2px; }
.panel .interaction .submitter:hover
	{ background: hsl(300 60% 20%); }
.panel .interaction .submitter:active
	{ background: hsl(300 60% 14%); }
.panel .interaction .note
	{ font-size: 14px; color: hsl(300 6% 54%); white-space: break-spaces; }
.panel .interaction.option .label
	{ flex: 1; }
.panel .interaction.link a
	{ color: hsl(200 100% 80%); }
.panel .interaction.link a:visited
	{ color: hsl(260 100% 80%); }
.panel .interaction.link a:active
	{ color: hsl(0 100% 60%); }
/**/

#frame .alert
	{ height: 20px; padding-block: 0;
	transition-property: height, margin; transition-duration: 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#frame .alert:not(.shown)
	{ height: 0; margin-block: 0; }
.alert.success
	{ background: hsl(120 50% 24%); }
.alert.failure
	{ background: hsl(0 50% 24%); }
.alert.pending
	{ background: hsl(60 50% 24%); }
/**/

.panel .section > .title, .panel .section > .title-row > .title
	{ margin: 4px; }
.panel.panel-term_lists .section > .container
	{ padding: 4px; }
.panel.panel-term_lists .container-terms .term
	{ display: flex; background: hsl(300 30% 15%); }
.panel.panel-term_lists .container-terms .term .phrase-input
	{ width: 120px; background: none; }
.panel.panel-term_lists .container-terms .term .phrase-input:not(:focus, :hover, :placeholder-shown)
	{ background-image: linear-gradient(90deg, hsl(0 0% 90%) 85%, transparent);
	-webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.panel.panel-term_lists .container-terms .term .matching
	{ flex: 1; height: auto; overflow-y: auto; }
@supports (overflow-y: overlay)
	{ .panel.panel-term_lists .container-terms .term .matching { overflow-y: overlay; }; }
.panel.panel-term_lists .container-terms .term .matching .type
	{ display: flex; }
.panel.panel-term_lists .container-terms .term .matching .type .label
	{ flex: 1; align-self: center; font-size: 12px; }
.panel.panel-term_lists .container-urls .url-input
	{ border: none; background: none; color: hsl(0 0% 90%); }
/**/

#frame .panel .collapse-toggle
	{ display: none; }
#frame .panel .collapse-toggle + label[tabindex]::before, #frame .panel .collapse-toggle + * > label[tabindex]::before
	{ display: inline-block; vertical-align: middle; translate: 0.3em; content: " ";
	border-top: 5px solid transparent; border-bottom: 5px solid transparent; border-left: 5px solid currentColor;
	rotate: 90deg; transition: rotate .2s ease-out; }
#frame .panel .collapse-toggle:not(:checked) + label[tabindex]::before, #frame .panel .collapse-toggle:not(:checked) + * > label[tabindex]::before
	{ rotate: 0deg; }
#frame .panel .collapse-toggle + label[tabindex], #frame .panel .collapse-toggle + * > label[tabindex]
	{ display: block; align-self: start; background: transparent; color: white; cursor: pointer; width: 1.2em; height: 1.2em; }
#frame .panel .collapse-toggle:not(:checked) + label ~ *
	{ display: none; }

#frame .panel .section > .title-row
	{ display: flex; flex-direction: row; }
#frame .panel .section > .title-row label
	{ position: absolute; align-self: center; }
/**/
		` + additionalStyleText;
        document.head.appendChild(style);
    };
    const classNameIsPanel = (className) => className.split("-")[0] === "panel";
    const getPanelClassName = (classArray) => classArray.find(className => classNameIsPanel(className)) ?? "";
    const focusActivePanel = () => {
        const frame = document.querySelector("#frame");
        const className = getPanelClassName(Array.from(frame.classList));
        const inputFirst = document.querySelector(`.panel.${className} input`);
        if (inputFirst) {
            inputFirst.focus();
            if (inputFirst.type === "text") {
                inputFirst.select();
            }
        }
        else {
            pageFocusScrollContainer();
        }
    };
    const getTabs = () => document.querySelectorAll(".container-tab .tab");
    const shiftTabFromTab = (tabCurrent, toRight, cycle) => {
        const tabNext = ( //
        tabCurrent[toRight ? "nextElementSibling" : "previousElementSibling"] //
            ?? (cycle //
                ? tabCurrent.parentElement[toRight ? "firstElementChild" : "lastElementChild"] //
                : null //
            ));
        if (tabNext) {
            tabNext.focus();
            tabNext.dispatchEvent(new MouseEvent("mousedown"));
        }
    };
    const handleTabs = (shiftModifierIsRequired = true) => {
        const frame = document.querySelector("#frame");
        getTabs().forEach((tab) => {
            const onClick = () => {
                frame.classList.forEach(className => {
                    if (classNameIsPanel(className)) {
                        frame.classList.remove(className);
                    }
                });
                frame.classList.add(getPanelClassName(Array.from(tab.classList)));
            };
            tab.addEventListener("click", onClick);
            tab.addEventListener("mousedown", onClick);
            tab.addEventListener("keydown", event => {
                if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                    shiftTabFromTab(tab, true, true);
                }
                else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                    shiftTabFromTab(tab, false, true);
                }
            });
        });
        document.addEventListener("keydown", event => {
            if (shiftModifierIsRequired && !event.shiftKey) {
                return;
            }
            const shiftTab = (toRight, cycle) => {
                const currentTab = document
                    .querySelector(`.container-tab .${getPanelClassName(Array.from(frame.classList))}`);
                shiftTabFromTab(currentTab, toRight, cycle);
                focusActivePanel();
            };
            if (event.key === "PageDown") {
                shiftTab(true, true);
                event.preventDefault();
            }
            else if (event.key === "PageUp") {
                shiftTab(false, true);
                event.preventDefault();
            }
        });
        getTabs()[0].click();
    };
    const reload = (panelsInfo) => {
        panelsInfo.forEach(panelInfo => {
            panelInfo.sections.forEach(sectionInfo => {
                sectionInfo.interactions.forEach(interactionInfo => {
                    if (interactionInfo.checkbox && interactionInfo.checkbox.autoId) {
                        const checkbox = document.getElementById(interactionInfo.checkbox.autoId);
                        if (interactionInfo.checkbox.onLoad) {
                            interactionInfo.checkbox.onLoad(checked => checkbox.checked = checked, 0, 0);
                        }
                    }
                    (interactionInfo.submitters ?? []).forEach(submitterInfo => {
                        if (submitterInfo.onLoad) {
                            const submitter = document.getElementById(submitterInfo.id ?? "");
                            submitterInfo.onLoad(enabled => submitter.disabled = !enabled);
                        }
                    });
                });
            });
        });
    };
    const insertAlert = (alertType, alertsInfo, previousSibling, timeoutDefault = -1, tooltip = "", formatText = (text) => text) => {
        if (!alertsInfo) {
            return;
        }
        const timeout = alertsInfo[alertType].timeout ?? timeoutDefault;
        const alert = document.createElement("label");
        alert.classList.add("alert", alertType);
        alert.textContent = formatText(alertsInfo[alertType].text);
        alert.title = tooltip;
        previousSibling.insertAdjacentElement("afterend", alert);
        setTimeout(() => {
            if (alert) {
                alert.classList.add("shown");
                if (timeout >= 0) {
                    setTimeout(() => {
                        if (alert) {
                            clearAlert(alert);
                        }
                    }, timeout);
                }
            }
        });
        return alert;
    };
    const clearAlert = (alert) => {
        alert.classList.remove("shown");
        setTimeout(() => {
            if (!alert) {
                return;
            }
            alert.remove();
        }, 1000);
    };
    const clearAlerts = (parent, classNames = []) => parent.querySelectorAll(classNames.length
        ? `.alert:is(${classNames.map(className => `.${className}`).join(", ")})`
        : ".alert").forEach((alert) => clearAlert(alert));
    const createSection = (() => {
        const insertLabel = (container, labelInfo, containerIndex) => {
            if (!labelInfo) {
                return;
            }
            const [label, checkboxId] = (() => {
                if (labelInfo.textbox) {
                    const label = document.createElement("input");
                    label.type = "text";
                    label.placeholder = labelInfo.textbox.placeholder;
                    label.value = labelInfo.text;
                    if (labelInfo.getText) {
                        labelInfo.getText(containerIndex).then(text => label.value = text);
                    }
                    return [label, ""];
                }
                else {
                    const label = document.createElement("label");
                    label.textContent = labelInfo.text;
                    if (labelInfo.getText) {
                        labelInfo.getText(containerIndex).then(text => label.textContent = text);
                    }
                    const checkboxId = getIdSequential.next().value;
                    label.htmlFor = checkboxId;
                    return [label, checkboxId];
                }
            })();
            label.classList.add("label");
            const onChangeInternal = () => {
                labelInfo.setText ? labelInfo.setText(label.value, containerIndex) : undefined;
            };
            if (labelInfo.setText) {
                const labelTextbox = label;
                labelTextbox.addEventListener("input", () => onChangeInternal());
                labelTextbox.addEventListener("blur", () => onChangeInternal());
            }
            container.appendChild(label);
            return checkboxId;
        };
        const insertCheckbox = (container, checkboxInfo, id = "", getObjectIndex, containerIndex) => {
            if (!checkboxInfo) {
                return;
            }
            checkboxInfo.autoId = id;
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = id;
            checkbox.classList.add("checkbox");
            container.appendChild(checkbox);
            if (checkboxInfo.onLoad) {
                checkboxInfo.onLoad(checked => checkbox.checked = checked, getObjectIndex(), containerIndex);
            }
            if (checkboxInfo.onToggle) {
                checkbox.addEventListener("change", () => checkboxInfo.onToggle ? checkboxInfo.onToggle(checkbox.checked, getObjectIndex(), containerIndex) : undefined);
            }
            return checkbox;
        };
        const insertTextbox = (container, textboxInfo, getObjectIndex, containerIndex, containerOverall) => {
            if (!textboxInfo) {
                return;
            }
            const insertTextboxElement = (container, value = "") => {
                const textbox = document.createElement("input");
                textbox.type = "text";
                textbox.classList.add(textboxInfo.className);
                textbox.placeholder = textboxInfo.placeholder;
                textbox.spellcheck = textboxInfo.spellcheck;
                textbox.value = value;
                if (textboxInfo.onLoad) {
                    textboxInfo.onLoad(text => textbox.value = text, getObjectIndex(), containerIndex);
                }
                const onChangeInternal = (commitIfEmpty = false) => {
                    if (textboxInfo.list) {
                        // TODO make function
                        if (textbox.value && container.lastElementChild.value) {
                            insertTextboxElement(container);
                        }
                        else if (!textbox.value && container.lastElementChild !== textbox && commitIfEmpty) {
                            textbox.remove();
                        }
                        if (textbox.parentElement) {
                            // Parent is a list container because getArrayForList exists
                            textboxInfo.list.setArray(Array.from(textbox.parentElement.children)
                                .map((textbox) => textbox.value)
                                .filter(value => !!value), getObjectIndex());
                        }
                    }
                    if (textboxInfo.onChange) {
                        textboxInfo.onChange(textbox.value, getObjectIndex(), containerIndex);
                    }
                };
                textbox.addEventListener("input", () => onChangeInternal());
                textbox.addEventListener("blur", () => onChangeInternal(true));
                textbox.addEventListener("keydown", event => {
                    if (event.key === "Enter") {
                        const textboxes = Array.from((containerOverall ?? container).querySelectorAll("input[type=text]"));
                        const textboxIndex = textboxes.indexOf(textbox) + (event.shiftKey ? -1 : 1);
                        if (textboxIndex < 0 || textboxIndex >= textboxes.length) {
                            onChangeInternal(true);
                            return;
                        }
                        textboxes[textboxIndex].focus();
                        textboxes[textboxIndex].select();
                    }
                });
                container.appendChild(textbox);
                return textbox;
            };
            if (textboxInfo.list) {
                const list = document.createElement("div");
                list.classList.add("organizer", "list", "column");
                textboxInfo.list.getArray(getObjectIndex()).then(array => {
                    array.concat("").forEach(value => {
                        insertTextboxElement(list, value);
                    });
                });
                container.appendChild(list);
                return list;
            }
            else {
                return insertTextboxElement(container);
            }
        };
        const insertObjectList = (container, objectInfo, containerIndex) => {
            if (!objectInfo) {
                return;
            }
            const getArray = () => objectInfo.list.getArray(containerIndex);
            const insertObjectElement = (container, deferContent = false) => {
                const objectElement = document.createElement("div");
                objectElement.classList.add("term");
                container.appendChild(objectElement);
                const getObjectIndex = () => Array.from(container.children).indexOf(objectElement);
                const insertColumn = (columnInfo) => {
                    if (columnInfo.rows.length > 1) {
                        const checkboxId = getIdSequential.next().value;
                        const toggleCheckbox = document.createElement("input");
                        toggleCheckbox.type = "checkbox";
                        toggleCheckbox.id = checkboxId;
                        toggleCheckbox.classList.add("collapse-toggle");
                        const toggleButton = document.createElement("label");
                        toggleButton.htmlFor = checkboxId;
                        toggleButton.tabIndex = 0;
                        toggleButton.addEventListener("keydown", event => {
                            if (event.key === "Enter") {
                                toggleCheckbox.checked = !toggleCheckbox.checked;
                            }
                        });
                        objectElement.appendChild(toggleCheckbox);
                        objectElement.appendChild(toggleButton);
                    }
                    const column = document.createElement("div");
                    column.classList.add(columnInfo.className);
                    const insertRow = (rowInfo) => {
                        const row = document.createElement("div");
                        row.classList.add(rowInfo.className);
                        insertTextbox(row, rowInfo.textbox, getObjectIndex, containerIndex, container);
                        const checkboxId = insertLabel(row, rowInfo.label, containerIndex);
                        insertCheckbox(row, rowInfo.checkbox, checkboxId, getObjectIndex, containerIndex);
                        column.appendChild(row);
                    };
                    columnInfo.rows.forEach(rowInfo => insertRow(rowInfo));
                    objectElement.appendChild(column);
                };
                if (deferContent) {
                    insertColumn(objectInfo.columns[0]);
                }
                else {
                    objectInfo.columns.forEach(columnInfo => insertColumn(columnInfo));
                }
                const inputMain = objectElement.querySelector("input");
                let newElementQueued = false;
                inputMain.addEventListener("input", () => {
                    if (inputMain.value && container.lastElementChild.querySelector("input").value && !newElementQueued) {
                        newElementQueued = true;
                        getArray().then(async (array) => {
                            array.push(objectInfo.list.getNew(inputMain.value));
                            await objectInfo.list.setArray(array, containerIndex);
                            inputMain.dispatchEvent(new Event("input"));
                            if (deferContent) {
                                deferContent = false;
                                objectInfo.columns.slice(1).forEach(columnInfo => insertColumn(columnInfo));
                            }
                            insertObjectElement(container, true);
                            newElementQueued = false;
                        });
                    }
                });
                const onChangeInternal = (commitIfEmpty = false) => {
                    if (!inputMain.value && commitIfEmpty) {
                        getArray().then(array => {
                            const index = getObjectIndex();
                            if (index >= array.length) {
                                return;
                            }
                            array.splice(index, 1);
                            objectInfo.list.setArray(array, containerIndex);
                            objectElement.remove();
                        });
                    }
                };
                inputMain.addEventListener("blur", () => onChangeInternal(container.lastElementChild !== objectElement));
                inputMain.addEventListener("keydown", event => {
                    if (event.key === "Enter") {
                        onChangeInternal(true);
                    }
                });
            };
            const list = document.createElement("div");
            list.classList.add("organizer", "list", "column", "container-terms");
            getArray().then(array => {
                array.forEach(() => {
                    insertObjectElement(list);
                });
                insertObjectElement(list, true);
            });
            container.appendChild(list);
        };
        const insertAnchor = (container, anchorInfo) => {
            if (!anchorInfo) {
                return;
            }
            const anchor = document.createElement("a");
            anchor.href = anchorInfo.url;
            anchor.target = "_blank"; // New tab
            anchor.rel = "noopener noreferrer";
            anchor.textContent = anchorInfo.text ?? anchor.href;
            container.appendChild(anchor);
        };
        const insertSubmitter = (container, submitterInfo, getObjectIndex) => {
            if (!submitterInfo) {
                return;
            }
            let getFormFields = () => [];
            if (submitterInfo.formFields) {
                const list = document.createElement("div");
                list.classList.add("organizer", "list", "column");
                submitterInfo.formFields.forEach(interactionInfo => {
                    insertInteraction(list, interactionInfo);
                });
                container.appendChild(list);
                getFormFields = () => Array.from(list.querySelectorAll("label")).map((label) => {
                    const input = list.querySelector(`input#${label.htmlFor}`);
                    return {
                        question: label.textContent ?? "",
                        response: input
                            ? input.checked === undefined ? input.value ?? "" : input.checked.toString()
                            : "",
                    };
                });
            }
            const button = document.createElement("button");
            button.type = "button";
            button.id = submitterInfo.id ?? "";
            button.classList.add("submitter");
            button.textContent = submitterInfo.text;
            if (submitterInfo.onLoad) {
                submitterInfo.onLoad(enabled => button.disabled = !enabled);
            }
            container.appendChild(button);
            let getMessageText = () => "";
            // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
            let allowInputs = (allowed = true) => { };
            button.addEventListener("click", () => {
                button.disabled = true;
                allowInputs(false);
                clearAlerts(container, [PageAlertType.PENDING, PageAlertType.FAILURE]);
                submitterInfo.onClick(getMessageText(), getFormFields(), () => {
                    if (submitterInfo.alerts) {
                        clearAlerts(container, [PageAlertType.PENDING]);
                        insertAlert(PageAlertType.SUCCESS, //
                        submitterInfo.alerts, //
                        button, //
                        3000);
                    }
                    button.disabled = false;
                    allowInputs(true);
                }, error => {
                    if (submitterInfo.alerts) {
                        clearAlerts(container, [PageAlertType.PENDING]);
                        const errorText = (error ? error.text : "") || "(no error message)";
                        insertAlert(PageAlertType.FAILURE, //
                        submitterInfo.alerts, //
                        button, //
                        -1, //
                        errorText, //
                        //
                        text => text.replace("{status}", error ? error.status.toString() : "-1").replace("{text}", errorText));
                    }
                    button.disabled = false;
                    allowInputs(true);
                }, getObjectIndex());
                insertAlert(PageAlertType.PENDING, //
                submitterInfo.alerts, //
                button);
            });
            if (submitterInfo.message) {
                const messageInfo = submitterInfo.message;
                const messageBox = (messageInfo.singleline
                    ? () => {
                        const box = document.createElement("input");
                        box.type = "text";
                        return box;
                    }
                    : () => {
                        const box = document.createElement("textarea");
                        box.rows = messageInfo.rows;
                        if (messageInfo.required) {
                            allowInputs = (allowed = true) => {
                                box.disabled = !allowed;
                            };
                            button.disabled = true;
                            box.addEventListener("input", () => {
                                button.disabled = box.value === "";
                            });
                        }
                        return box;
                    })();
                messageBox.classList.add("message");
                messageBox.placeholder = submitterInfo.message.placeholder;
                messageBox.spellcheck = true;
                messageBox.addEventListener("keypress", (event) => {
                    if (event.key === "Enter" && (messageInfo.singleline || event.ctrlKey)) {
                        button.click();
                    }
                });
                container.appendChild(messageBox);
                getMessageText = () => messageBox.value;
            }
        };
        const insertSubmitters = (container, submittersInfo, getObjectIndex) => {
            if (!submittersInfo) {
                return;
            }
            const list = document.createElement("div");
            list.classList.add("organizer", "list", submittersInfo.length > 1 ? "row" : "column");
            submittersInfo.forEach(submitterInfo => insertSubmitter(list, submitterInfo, getObjectIndex));
            container.appendChild(list);
        };
        const insertNote = (container, noteInfo) => {
            if (!noteInfo) {
                return;
            }
            const note = document.createElement("div");
            note.classList.add("note");
            note.textContent = noteInfo.text;
            container.appendChild(note);
        };
        const insertInteraction = (container, interactionInfo) => {
            let index = container.childElementCount;
            const interaction = document.createElement("div");
            interaction.classList.add("interaction", interactionInfo.className);
            const checkboxId = insertLabel(interaction, interactionInfo.label, index);
            const insertBody = () => {
                insertObjectList(interaction, interactionInfo.object, index);
                insertAnchor(interaction, interactionInfo.anchor);
                insertSubmitters(interaction, interactionInfo.submitters, () => index);
                insertTextbox(interaction, interactionInfo.textbox, () => index, 0);
                insertNote(interaction, interactionInfo.note);
                insertCheckbox(interaction, interactionInfo.checkbox, checkboxId, () => index, 0);
            };
            const labelTextbox = interaction.querySelector("input");
            if (interactionInfo.list) {
                const listInfo = interactionInfo.list;
                const onChangeInternal = (commitIfEmpty = false) => {
                    index = Array.from(container.children).indexOf(interaction);
                    if (labelTextbox.value && container.lastElementChild.querySelector("input").value) {
                        listInfo.pushWithName(labelTextbox.value).then(() => {
                            insertBody();
                            insertInteraction(container, interactionInfo);
                        });
                    }
                    else if (!labelTextbox.value && container.lastElementChild !== interaction && commitIfEmpty) {
                        interaction.remove();
                        listInfo.removeAt(index);
                    }
                };
                labelTextbox.addEventListener("input", () => onChangeInternal());
                labelTextbox.addEventListener("blur", () => onChangeInternal(true));
                labelTextbox.addEventListener("keydown", event => {
                    if (event.key === "Enter") {
                        const textboxes = Array.from(container.children)
                            .map(child => child.querySelector("input[type=text]"));
                        const textboxIndex = textboxes.indexOf(labelTextbox) + (event.shiftKey ? -1 : 1);
                        if (textboxIndex < 0 || textboxIndex >= textboxes.length) {
                            onChangeInternal(true);
                            return;
                        }
                        textboxes[textboxIndex].focus();
                        textboxes[textboxIndex].select();
                    }
                });
                if (interactionInfo.label && interactionInfo.label.getText) {
                    interactionInfo.label.getText(index).then(text => {
                        if (text) {
                            insertBody();
                        }
                    });
                }
                else {
                    insertBody();
                }
            }
            else {
                insertBody();
            }
            container.appendChild(interaction);
            return interaction;
        };
        return (sectionInfo) => {
            const section = document.createElement("div");
            section.classList.add("section");
            if (sectionInfo.title) {
                const title = document.createElement("div");
                title.classList.add("title");
                title.textContent = sectionInfo.title.text;
                if (sectionInfo.title.expands) {
                    // TODO make function
                    const titleRow = document.createElement("label");
                    titleRow.classList.add("title-row");
                    const checkboxId = getIdSequential.next().value;
                    titleRow.htmlFor = checkboxId;
                    const toggleCheckbox = document.createElement("input");
                    toggleCheckbox.type = "checkbox";
                    toggleCheckbox.id = checkboxId;
                    toggleCheckbox.classList.add("collapse-toggle");
                    const toggleButton = document.createElement("label");
                    toggleButton.htmlFor = checkboxId;
                    toggleButton.tabIndex = 0;
                    toggleButton.addEventListener("keydown", event => {
                        if (event.key === "Enter") {
                            toggleCheckbox.checked = !toggleCheckbox.checked;
                        }
                    });
                    section.appendChild(toggleCheckbox);
                    titleRow.appendChild(toggleButton);
                    titleRow.appendChild(title);
                    section.appendChild(titleRow);
                }
                else {
                    section.appendChild(title);
                }
            }
            const container = document.createElement("div");
            container.classList.add("container");
            sectionInfo.interactions.forEach(async (interactionInfo) => {
                if (interactionInfo.list) {
                    const length = await interactionInfo.list.getLength();
                    for (let i = 0; i < length; i++) {
                        insertInteraction(container, interactionInfo);
                    }
                    insertInteraction(container, interactionInfo);
                }
                else {
                    insertInteraction(container, interactionInfo);
                }
            });
            section.appendChild(container);
            return section;
        };
    })();
    const createBrand = () => {
        const brand = document.createElement("div");
        const name = document.createElement("div");
        const version = document.createElement("div");
        const logo = document.createElement("img");
        name.classList.add("name");
        name.textContent = getName();
        version.classList.add("version");
        version.textContent = `v${chrome.runtime.getManifest().version}`;
        logo.classList.add("logo");
        logo.src = "/icons/mms.svg";
        brand.classList.add("brand");
        brand.appendChild(name);
        brand.appendChild(version);
        brand.appendChild(logo);
        return brand;
    };
    const createFrameStructure = () => {
        const frame = document.createElement("div");
        frame.id = "frame";
        document.body.appendChild(frame);
        frame.appendChild(createBrand());
        const panelContainer = document.createElement("div");
        panelContainer.classList.add("container-panel");
        panelContainer.tabIndex = -1;
        frame.appendChild(panelContainer);
        const tabContainer = document.createElement("div");
        tabContainer.classList.add("container-tab");
        frame.appendChild(tabContainer);
        return frame;
    };
    const insertAndManageContent = (panelsInfo, shiftModifierIsRequired = true) => {
        document.body.appendChild(createFrameStructure());
        const panelContainer = document.querySelector(".container-panel");
        const tabContainer = document.querySelector(".container-tab");
        panelsInfo.forEach(panelInfo => {
            const panel = document.createElement("div");
            panel.classList.add("panel", panelInfo.className);
            panelInfo.sections.forEach(sectionInfo => {
                panel.appendChild(createSection(sectionInfo));
            });
            panelContainer.appendChild(panel);
            const tab = document.createElement("button");
            tab.type = "button";
            tab.classList.add("tab", panelInfo.className);
            tab.textContent = panelInfo.name.text;
            tabContainer.appendChild(tab);
        });
        // TODO handle multiple tabs correctly
        // TODO visual indication of letter
        const lettersTaken = new Set;
        const info = panelsInfo.flatMap(panelInfo => panelInfo.sections.flatMap(sectionInfo => sectionInfo.interactions
            .map(interactionInfo => {
            if (interactionInfo.checkbox && interactionInfo.label) {
                const letter = Array.from(interactionInfo.label.text).find(letter => !lettersTaken.has(letter));
                if (letter) {
                    lettersTaken.add(letter);
                    return { letter, checkboxInfo: interactionInfo.checkbox };
                }
            }
            return { letter: "" };
        })
            .filter(info => info.letter !== "")));
        addEventListener("keydown", event => {
            if (!event.altKey || !event.shiftKey) {
                return;
            }
            info.some(info => {
                if (info.letter !== event.key) {
                    return false;
                }
                if (info.checkboxInfo && info.checkboxInfo.autoId) {
                    const checkbox = document.getElementById(info.checkboxInfo.autoId);
                    checkbox.focus();
                    checkbox.click();
                    event.preventDefault();
                }
                return true;
            });
        });
        handleTabs(shiftModifierIsRequired);
        chrome.storage.onChanged.addListener(() => reload(panelsInfo));
        chrome.tabs.onActivated.addListener(() => reload(panelsInfo));
    };
    return (panelsInfo, additionalStyleText = "", shiftModifierIsRequired = true) => {
        chrome.tabs.query = useChromeAPI()
            ? chrome.tabs.query
            : browser.tabs.query;
        fillAndInsertStylesheet(additionalStyleText);
        insertAndManageContent(panelsInfo, shiftModifierIsRequired);
        pageFocusScrollContainer();
    };
})();
