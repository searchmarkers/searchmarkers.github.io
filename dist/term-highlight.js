"use strict";
var AtRuleID;
(function (AtRuleID) {
    AtRuleID["FLASH"] = "flash";
    AtRuleID["MARKER_ON"] = "marker-on";
    AtRuleID["MARKER_OFF"] = "marker-off";
})(AtRuleID || (AtRuleID = {}));
var ElementClass;
(function (ElementClass) {
    ElementClass["HIGHLIGHTS_SHOWN"] = "highlights-shown";
    ElementClass["BAR_HIDDEN"] = "bar-hidden";
    ElementClass["CONTROL"] = "control";
    ElementClass["CONTROL_PAD"] = "control-pad";
    ElementClass["CONTROL_CONTENT"] = "control-content";
    ElementClass["CONTROL_BUTTON"] = "control-button";
    ElementClass["CONTROL_REVEAL"] = "control-reveal";
    ElementClass["CONTROL_EDIT"] = "control-edit";
    ElementClass["PIN"] = "pin";
    ElementClass["BAR_CONTROL"] = "bar-control";
    ElementClass["OPTION_LIST"] = "options";
    ElementClass["OPTION"] = "option";
    ElementClass["TERM"] = "term";
    ElementClass["FOCUS"] = "focus";
    ElementClass["FOCUS_CONTAINER"] = "focus-contain";
    ElementClass["FOCUS_REVERT"] = "focus-revert";
    ElementClass["REMOVE"] = "remove";
    ElementClass["DISABLED"] = "disabled";
    ElementClass["MATCH_REGEX"] = "match-regex";
    ElementClass["MATCH_CASE"] = "match-case";
    ElementClass["MATCH_STEM"] = "match-stem";
    ElementClass["MATCH_WHOLE"] = "match-whole";
    ElementClass["MATCH_DIACRITICS"] = "match-diacritics";
    ElementClass["PRIMARY"] = "primary";
    ElementClass["SECONDARY"] = "secondary";
    ElementClass["OVERRIDE_VISIBILITY"] = "override-visibility";
    ElementClass["OVERRIDE_FOCUS"] = "override-focus";
})(ElementClass || (ElementClass = {}));
var ElementID;
(function (ElementID) {
    ElementID["STYLE"] = "style";
    ElementID["BAR"] = "bar";
    ElementID["BAR_OPTIONS"] = "bar-options";
    ElementID["BAR_TERMS"] = "bar-terms";
    ElementID["BAR_CONTROLS"] = "bar-controls";
    ElementID["MARKER_GUTTER"] = "markers";
})(ElementID || (ElementID = {}));
var TermChange;
(function (TermChange) {
    TermChange[TermChange["REMOVE"] = -1] = "REMOVE";
    TermChange[TermChange["CREATE"] = -2] = "CREATE";
})(TermChange || (TermChange = {}));
// Singly linked list implementation for efficient highlight matching of node DOM 'flow' groups
class UnbrokenNodeList {
    push(value) {
        if (this.last) {
            this.last.next = { value, next: null };
            this.last = this.last.next;
        }
        else {
            this.first = { value, next: null };
            this.last = this.first;
        }
    }
    insertAfter(itemBefore, value) {
        if (value) {
            if (itemBefore) {
                itemBefore.next = { next: itemBefore.next, value };
            }
            else {
                this.first = { next: this.first, value };
            }
        }
    }
    getText() {
        let text = "";
        let current = this.first;
        do {
            text += current.value.textContent;
            // eslint-disable-next-line no-cond-assign
        } while (current = current.next);
        return text;
    }
    clear() {
        this.first = null;
        this.last = null;
    }
    *[Symbol.iterator]() {
        let current = this.first;
        do {
            yield current;
            // eslint-disable-next-line no-cond-assign
        } while (current = current.next);
    }
}
/**
 * Gets a selector for selecting by ID or class, or for CSS at-rules. Abbreviated due to prolific use.
 * __Always__ use for ID, class, and at-rule identifiers.
 * @param identifier The extension-level unique ID, class, or at-rule identifier.
 * @param argument An optional secondary component to the identifier.
 * @returns The selector string, being a constant selector prefix and both components joined by hyphens.
 */
const getSel = (identifier, argument) => argument === undefined ? `markmysearch-${identifier}` : `markmysearch-${identifier}-${argument}`;
/**
 * Fills a CSS stylesheet element to style all UI elements we insert.
 * @param terms Terms to account for and style.
 * @param hues Color hues for term styles to cycle through.
 */
const fillStylesheetContent = (terms, hues) => {
    const style = document.getElementById(getSel(ElementID.STYLE));
    const zIndexMax = 2 ** 31 - 1;
    const makeImportant = (styleText) => styleText.replace(/;/g, " !important;"); // Prevent websites from overriding rules with !important;
    style.textContent = makeImportant(`
/* || Term Buttons and Input */
#${getSel(ElementID.BAR)} ::selection
	{ background: Highlight; color: HighlightText; }
#${getSel(ElementID.BAR)} .${getSel(ElementClass.CONTROL_PAD)} input,
#${getSel(ElementID.BAR)} .${getSel(ElementClass.BAR_CONTROL)} input
	{ width: 5em; padding: 0 2px 0 2px; margin-left: 4px; border: none; outline: revert;
	box-sizing: unset; font-family: revert; white-space: pre; color: #000; }
#${getSel(ElementID.BAR)} .${getSel(ElementClass.CONTROL_PAD)} button:disabled,
#${getSel(ElementID.BAR)} .${getSel(ElementClass.CONTROL_PAD)} button:disabled *,
#${getSel(ElementID.BAR)}:not(:hover) .${getSel(ElementClass.CONTROL_PAD)}
input:not(:focus, .${getSel(ElementClass.OVERRIDE_FOCUS)}),
#${getSel(ElementID.BAR)} .${getSel(ElementClass.CONTROL_PAD)}
input:not(:focus, .${getSel(ElementClass.OVERRIDE_VISIBILITY)}),
#${getSel(ElementID.BAR)}:not(:hover) .${getSel(ElementClass.BAR_CONTROL)}
input:not(:focus, .${getSel(ElementClass.OVERRIDE_FOCUS)}),
#${getSel(ElementID.BAR)} .${getSel(ElementClass.BAR_CONTROL)}
input:not(:focus, .${getSel(ElementClass.OVERRIDE_VISIBILITY)})
	{ width: 0; padding: 0; margin: 0; }
#${getSel(ElementID.BAR)} .${getSel(ElementClass.CONTROL_REVEAL)} img
	{ width: 0.5em; }
#${getSel(ElementID.BAR)}
.${getSel(ElementClass.CONTROL_PAD)} .${getSel(ElementClass.CONTROL_EDIT)} .${getSel(ElementClass.PRIMARY)}
	{ display: none; }
#${getSel(ElementID.BAR)}:not(:hover) .${getSel(ElementClass.CONTROL_PAD)} input:not(:focus, .${getSel(ElementClass.OVERRIDE_FOCUS)})
+ .${getSel(ElementClass.CONTROL_EDIT)} .${getSel(ElementClass.PRIMARY)},
#${getSel(ElementID.BAR)} .${getSel(ElementClass.CONTROL_PAD)}
input:not(:focus, .${getSel(ElementClass.OVERRIDE_VISIBILITY)})
+ .${getSel(ElementClass.CONTROL_EDIT)} .${getSel(ElementClass.PRIMARY)}
	{ display: block; }
#${getSel(ElementID.BAR)}:not(:hover) .${getSel(ElementClass.CONTROL_PAD)} input:not(:focus, .${getSel(ElementClass.OVERRIDE_FOCUS)})
+ .${getSel(ElementClass.CONTROL_EDIT)} .${getSel(ElementClass.SECONDARY)},
#${getSel(ElementID.BAR)} .${getSel(ElementClass.CONTROL_PAD)}
input:not(:focus, .${getSel(ElementClass.OVERRIDE_VISIBILITY)})
+ .${getSel(ElementClass.CONTROL_EDIT)} .${getSel(ElementClass.SECONDARY)}
	{ display: none; }
/**/

/* || Term Matching Option Hints */
#${getSel(ElementID.BAR_TERMS)} .${getSel(ElementClass.MATCH_REGEX)} .${getSel(ElementClass.CONTROL_CONTENT)}
	{ font-weight: bold; }
#${getSel(ElementID.BAR_CONTROLS)} .${getSel(ElementClass.BAR_CONTROL)}.${getSel(ElementClass.MATCH_REGEX)}
.${getSel(ElementClass.CONTROL_CONTENT)}::before
	{ content: "(.*)"; margin-right: 2px; font-weight: bold; }
#${getSel(ElementID.BAR_TERMS)} .${getSel(ElementClass.CONTROL)}.${getSel(ElementClass.MATCH_CASE)}
.${getSel(ElementClass.CONTROL_CONTENT)},
#${getSel(ElementID.BAR_CONTROLS)} .${getSel(ElementClass.BAR_CONTROL)}.${getSel(ElementClass.MATCH_CASE)}
.${getSel(ElementClass.CONTROL_CONTENT)}
	{ padding-top: 0; border-top: 1px dashed black; }
#${getSel(ElementID.BAR_TERMS)}
.${getSel(ElementClass.CONTROL)}:not(.${getSel(ElementClass.MATCH_STEM)}, .${getSel(ElementClass.MATCH_REGEX)})
.${getSel(ElementClass.CONTROL_CONTENT)}
	{ text-decoration: underline; }
#${getSel(ElementID.BAR_CONTROLS)}
.${getSel(ElementClass.BAR_CONTROL)}:not(.${getSel(ElementClass.MATCH_STEM)})
.${getSel(ElementClass.CONTROL_CONTENT)}
	{ border-bottom: 3px solid #666; }
#${getSel(ElementID.BAR_TERMS)} .${getSel(ElementClass.CONTROL)}.${getSel(ElementClass.MATCH_WHOLE)}
.${getSel(ElementClass.CONTROL_CONTENT)},
#${getSel(ElementID.BAR_CONTROLS)} .${getSel(ElementClass.BAR_CONTROL)}.${getSel(ElementClass.MATCH_WHOLE)}
.${getSel(ElementClass.CONTROL_CONTENT)}
	{ padding-inline: 2px; border-inline: 2px solid hsl(0 0% 0% / 0.4); }
#${getSel(ElementID.BAR_TERMS)} .${getSel(ElementClass.CONTROL)}.${getSel(ElementClass.MATCH_DIACRITICS)}
.${getSel(ElementClass.CONTROL_CONTENT)}
	{ font-style: italic; }
#${getSel(ElementID.BAR_CONTROLS)} .${getSel(ElementClass.BAR_CONTROL)}.${getSel(ElementClass.MATCH_DIACRITICS)}
.${getSel(ElementClass.CONTROL_CONTENT)}
	{ border-left: 3px dashed black; }
/**/

/* || Bar */
#${getSel(ElementID.BAR)}
	{ all: revert; position: fixed; top: 0; left: 0; z-index: ${zIndexMax};
	color-scheme: light; font-size: 14.6px; line-height: initial; user-select: none; }
#${getSel(ElementID.BAR)}.${getSel(ElementClass.BAR_HIDDEN)}
	{ display: none; }
#${getSel(ElementID.BAR)} *
	{ all: revert; font: revert; font-size: inherit; line-height: 120%; padding: 0; outline: none; }
#${getSel(ElementID.BAR)} img
	{ height: 1.1em; width: 1.1em; object-fit: cover; }
#${getSel(ElementID.BAR)} button
	{ display: flex; align-items: center; padding-inline: 4px; margin-block: 0; border: none; border-radius: inherit;
	background: none; color: hsl(0 0% 0%); cursor: pointer; letter-spacing: normal; transition: unset; }
#${getSel(ElementID.BAR)} > *
	{ display: inline; }
#${getSel(ElementID.BAR)} > * > *
	{ display: inline-block; vertical-align: top; margin-left: 0.5em; }
/**/

/* || Term Pulldown */
#${getSel(ElementID.BAR)} .${getSel(ElementClass.OPTION_LIST)}:is(:focus, :active),
#${getSel(ElementID.BAR)} .${getSel(ElementClass.OPTION_LIST)}.${getSel(ElementClass.OVERRIDE_VISIBILITY)},
#${getSel(ElementID.BAR)} .${getSel(ElementClass.CONTROL_PAD)}:active:not(:hover) + .${getSel(ElementClass.OPTION_LIST)}
	{ display: flex; }
#${getSel(ElementID.BAR)} .${getSel(ElementClass.OPTION_LIST)}:focus .${getSel(ElementClass.OPTION)}::first-letter
	{ text-decoration: underline; }
#${getSel(ElementID.BAR)} .${getSel(ElementClass.OPTION_LIST)}
	{ display: none; position: absolute; flex-direction: column; width: max-content; padding: 0; margin: 0; z-index: 1; }
#${getSel(ElementID.BAR)} .${getSel(ElementClass.OPTION)}
	{ display: block; padding-block: 2px; margin-left: 3px; font-size: small; background: hsl(0 0% 94% / 0.76);
	color: hsl(0 0% 6%); filter: grayscale(100%); width: 100%; text-align: left;
	border-width: 2px; border-color: hsl(0 0% 40% / 0.7); border-left-style: solid; }
#${getSel(ElementID.BAR)} .${getSel(ElementClass.OPTION)}:hover
	{ background: hsl(0 0% 100%); }
/**/

/* || Bar Controls */
#${getSel(ElementID.BAR_TERMS)} .${getSel(ElementClass.CONTROL)}
	{ white-space: pre; }
#${getSel(ElementID.BAR)} .${getSel(ElementClass.CONTROL_PAD)}
	{ display: flex; height: 1.3em; border-style: none; border-radius: 4px; box-shadow: 1px 1px 5px;
	background: hsl(0 0% 90% / 0.8); color: #000; }
#${getSel(ElementID.BAR)}.${getSel(ElementClass.DISABLED)} .${getSel(ElementClass.CONTROL_PAD)}
	{ background: hsl(0 0% 90% / 0.4); }
#${getSel(ElementID.BAR)} .${getSel(ElementClass.CONTROL_PAD)} button:hover
	{ background: hsl(0 0% 65%); }
#${getSel(ElementID.BAR)} .${getSel(ElementClass.CONTROL_PAD)} button:active
	{ background: hsl(0 0% 50%); }
#${getSel(ElementID.BAR)} > :not(#${getSel(ElementID.BAR_TERMS)})
> .${getSel(ElementClass.DISABLED)}:not(:focus-within, .${getSel(ElementClass.OVERRIDE_VISIBILITY)})
	{ display: none; }
#${getSel(ElementID.BAR)} #${getSel(ElementID.BAR_TERMS)}
.${getSel(ElementClass.CONTROL_PAD)}.${getSel(ElementClass.DISABLED)}
	{ display: flex; background: hsl(0 0% 80% / 0.6); }
/**/

/* || Term Scroll Markers */
#${getSel(ElementID.MARKER_GUTTER)}
	{ display: block; position: fixed; right: 0; top: 0; width: 0; height: 100%; z-index: ${zIndexMax}; }
#${getSel(ElementID.MARKER_GUTTER)} *
	{ width: 16px; height: 1px; position: absolute; right: 0; border-left: solid hsl(0 0% 0% / 0.6) 1px; box-sizing: unset;
	padding-right: 0; transition: padding-right 600ms; pointer-events: none; }
#${getSel(ElementID.MARKER_GUTTER)} .${getSel(ElementClass.FOCUS)}
	{ padding-right: 16px; transition: unset; }
/**/

/* || Term Highlights */
mms-h
	{ font: inherit; }
.${getSel(ElementClass.FOCUS_CONTAINER)}
	{ animation: ${getSel(AtRuleID.FLASH)} 1s; }
/**/
	`) + `
/* || Transitions */
@keyframes ${getSel(AtRuleID.MARKER_ON)}
	{ from {} to { padding-right: 16px; }; }
@keyframes ${getSel(AtRuleID.MARKER_OFF)}
	{ from { padding-right: 16px; } to { padding-right: 0; }; }
@keyframes ${getSel(AtRuleID.FLASH)}
	{ from { background-color: hsl(0 0% 65% / 0.8); } to {}; }
	`;
    terms.forEach((term, i) => {
        const hue = hues[i % hues.length];
        const isAboveStyleLevel = (level) => i >= hues.length * level;
        const getBackgroundStyle = (colorA, colorB) => isAboveStyleLevel(1)
            ? `repeating-linear-gradient(${isAboveStyleLevel(3) ? isAboveStyleLevel(4) ? 0 : 90 : isAboveStyleLevel(2) ? 45 : -45}deg, ${colorA}, ${colorA} 2px, ${colorB} 2px, ${colorB} 8px)`
            : colorA;
        style.textContent += makeImportant(`
/* || Term Highlights */
#${getSel(ElementID.BAR)}.${getSel(ElementClass.HIGHLIGHTS_SHOWN)}
~ body mms-h.${getSel(ElementClass.TERM, term.selector)},
#${getSel(ElementID.BAR)}
~ body .${getSel(ElementClass.FOCUS_CONTAINER)} mms-h.${getSel(ElementClass.TERM, term.selector)}
	{ background: ${getBackgroundStyle(`hsl(${hue} 100% 60% / 0.4)`, `hsl(${hue} 100% 84% / 0.4)`)};
	border-radius: 2px; box-shadow: 0 0 0 1px hsl(${hue} 100% 20% / 0.35); }
/**/

/* || Term Scroll Markers */
#${getSel(ElementID.MARKER_GUTTER)} .${getSel(ElementClass.TERM, term.selector)}
	{ background: hsl(${hue} 100% 44%); }
/**/

/* || Term Control Buttons */
#${getSel(ElementID.BAR_TERMS)} .${getSel(ElementClass.TERM, term.selector)}
.${getSel(ElementClass.CONTROL_PAD)}
	{ background: ${getBackgroundStyle(`hsl(${hue} 70% 70% / 0.8)`, `hsl(${hue} 70% 88% / 0.8)`)}; }
#${getSel(ElementID.BAR_TERMS)}.${getSel(ElementClass.DISABLED)} .${getSel(ElementClass.TERM, term.selector)}
.${getSel(ElementClass.CONTROL_PAD)}
	{ background: ${getBackgroundStyle(`hsl(${hue} 70% 70% / 0.4)`, `hsl(${hue} 70% 88% / 0.4)`)}; }
#${getSel(ElementID.BAR_TERMS)} .${getSel(ElementClass.TERM, term.selector)}
.${getSel(ElementClass.CONTROL_BUTTON)}:hover:not(:disabled)
	{ background: hsl(${hue} 70% 80%); }
#${getSel(ElementID.BAR_TERMS)} .${getSel(ElementClass.TERM, term.selector)}
.${getSel(ElementClass.CONTROL_BUTTON)}:active:not(:disabled)
	{ background: hsl(${hue} 70% 70%); }
#${getSel(ElementID.BAR_TERMS)}.${getSel(ElementClass.CONTROL_PAD, i)}
.${getSel(ElementClass.TERM, term.selector)} .${getSel(ElementClass.CONTROL_PAD)}
	{ background: hsl(${hue} 100% 90%); }
/**/
		`);
    });
};
/**
 * Gets a selector string for the container block of an element.
 * @param highlightTags Element tags to reject from highlighting or form blocks of consecutive text nodes.
 * @returns The container block selector corresponding to the highlight tags supplied.
 */
const getContainerBlockSelector = (highlightTags) => `:not(${Array.from(highlightTags.flow).join(", ")})`;
/**
 * Gets the containing block of an element.
 * This is its closest ancestor which has no tag name counted as `flow` in a highlight tags object.
 * @param highlightTags Element tags to reject from highlighting or form blocks of consecutive text nodes.
 * @param element An element to find the first container block of (inclusive).
 * @param selector If supplied, a container block selector.
 * Normally generated by the appropriate function using the highlight tags supplied. This may be used for efficiency.
 * @returns The closest container block above the element (inclusive).
 */
const getContainerBlock = (element, highlightTags, selector = "") => 
// Always returns an element since "body" is not a flow tag.
element.closest(selector ? selector : getContainerBlockSelector(highlightTags));
/**
 * Reverts the focusability of elements made temporarily focusable and marked as such using a class name.
 * Sets their `tabIndex` to -1.
 * @param root If supplied, an element to revert focusability under in the DOM tree (inclusive).
 */
const revertElementsUnfocusable = (root = document.body) => {
    if (!root.parentNode) {
        return;
    }
    root.parentNode.querySelectorAll(`.${getSel(ElementClass.FOCUS_REVERT)}`)
        .forEach((element) => {
        element.tabIndex = -1;
        element.classList.remove(getSel(ElementClass.FOCUS_REVERT));
    });
};
/**
 * Scrolls to the next (downwards) occurrence of a term in the document. Testing begins from the current selection position.
 * @param highlightTags Element tags to reject from highlighting or form blocks of consecutive text nodes.
 * @param reverse Indicates whether elements should be tried in reverse, selecting the previous term as opposed to the next.
 * @param term A term to jump to. If unspecified, the next closest occurrence of any term is jumpted to.
 */
const jumpToTerm = (() => {
    /**
     * Determines heuristically whether or not an element is visible. The element need not be currently scrolled into view.
     * @param element An element.
     * @returns `true` if visible, `false` otherwise.
     */
    const isVisible = (element) => // TODO improve
     (element.offsetWidth || element.offsetHeight || element.getClientRects().length)
        && getComputedStyle(element).visibility !== "hidden";
    /**
     * Focuses an element, preventing immediate scroll-into-view and forcing visible focus where supported.
     * @param element An element.
     */
    const focusElement = (element) => element.focus({
        preventScroll: true,
        focusVisible: true, // Very sparse browser compatibility
    });
    // TODO document
    const jumpToScrollMarker = (term, container) => {
        const scrollMarkerGutter = document.getElementById(getSel(ElementID.MARKER_GUTTER));
        purgeClass(getSel(ElementClass.FOCUS), scrollMarkerGutter);
        // eslint-disable-next-line no-constant-condition
        [6, 5, 4, 3, 2].some(precisionFactor => {
            const precision = 10 ** precisionFactor;
            const scrollMarker = scrollMarkerGutter.querySelector(`${term ? `.${getSel(ElementClass.TERM, term.selector)}` : ""}[top^="${Math.trunc(getElementYRelative(container) * precision) / precision}"]`);
            if (scrollMarker) {
                scrollMarker.classList.add(getSel(ElementClass.FOCUS));
                return true;
            }
            return false;
        });
    };
    // TODO document
    const selectNextElement = (reverse, walker, walkSelectionFocusContainer, highlightTags, elementToSelect) => {
        var _a;
        const nextNodeMethod = reverse ? "previousNode" : "nextNode";
        let elementTerm = walker[nextNodeMethod]();
        if (!elementTerm) {
            let nodeToRemove = null;
            if (!document.body.lastChild || document.body.lastChild.nodeType !== Node.TEXT_NODE) {
                nodeToRemove = document.createTextNode("");
                document.body.appendChild(nodeToRemove);
            }
            walker.currentNode = (reverse && document.body.lastChild)
                ? document.body.lastChild
                : document.body;
            elementTerm = walker[nextNodeMethod]();
            if (nodeToRemove) {
                (_a = nodeToRemove.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(nodeToRemove);
            }
            if (!elementTerm) {
                walkSelectionFocusContainer.accept = true;
                elementTerm = walker[nextNodeMethod]();
                if (!elementTerm) {
                    return { elementSelected: null, container: null };
                }
            }
        }
        const container = getContainerBlock(elementTerm.parentElement, highlightTags);
        container.classList.add(getSel(ElementClass.FOCUS_CONTAINER));
        elementTerm.classList.add(getSel(ElementClass.FOCUS));
        elementToSelect = Array.from(container.getElementsByTagName("mms-h"))
            .every(thisElement => getContainerBlock(thisElement.parentElement, highlightTags) === container)
            ? container
            : elementTerm;
        if (elementToSelect.tabIndex === -1) {
            elementToSelect.classList.add(getSel(ElementClass.FOCUS_REVERT));
            elementToSelect.tabIndex = 0;
        }
        focusElement(elementToSelect);
        if (document.activeElement !== elementToSelect) {
            const element = document.createElement("div");
            element.tabIndex = 0;
            element.classList.add(getSel(ElementClass.REMOVE));
            elementToSelect.insertAdjacentElement(reverse ? "afterbegin" : "beforeend", element);
            elementToSelect = element;
            focusElement(elementToSelect);
        }
        if (document.activeElement === elementToSelect) {
            return { elementSelected: elementToSelect, container };
        }
        return selectNextElement(reverse, walker, walkSelectionFocusContainer, highlightTags, elementToSelect);
    };
    return (highlightTags, reverse, term) => {
        const termSelector = term ? getSel(ElementClass.TERM, term.selector) : "";
        const focusBase = document.body
            .getElementsByClassName(getSel(ElementClass.FOCUS))[0];
        const focusContainer = document.body
            .getElementsByClassName(getSel(ElementClass.FOCUS_CONTAINER))[0];
        const selection = document.getSelection();
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === "INPUT" && activeElement.closest(`#${getSel(ElementID.BAR)}`)) {
            activeElement.blur();
        }
        const selectionFocus = selection && (!activeElement
            || activeElement === document.body || !document.body.contains(activeElement)
            || activeElement === focusBase || activeElement.contains(focusContainer))
            ? selection.focusNode
            : activeElement !== null && activeElement !== void 0 ? activeElement : document.body;
        if (focusBase) {
            focusBase.classList.remove(getSel(ElementClass.FOCUS));
            purgeClass(getSel(ElementClass.FOCUS_CONTAINER));
            revertElementsUnfocusable();
        }
        const selectionFocusContainer = selectionFocus
            ? getContainerBlock(selectionFocus.nodeType === Node.ELEMENT_NODE || !selectionFocus.parentElement
                ? selectionFocus
                : selectionFocus.parentElement, highlightTags)
            : undefined;
        const walkSelectionFocusContainer = { accept: false };
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, (element) => element.tagName === "MMS-H"
            && (termSelector ? element.classList.contains(termSelector) : true)
            && isVisible(element)
            && (getContainerBlock(element, highlightTags) !== selectionFocusContainer || walkSelectionFocusContainer.accept)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP);
        walker.currentNode = selectionFocus ? selectionFocus : document.body;
        const { elementSelected, container } = selectNextElement(reverse, walker, walkSelectionFocusContainer, highlightTags);
        if (!elementSelected || !container) {
            return;
        }
        elementSelected.scrollIntoView({ behavior: "smooth", block: "center" });
        if (selection) {
            selection.setBaseAndExtent(elementSelected, 0, elementSelected, 0);
        }
        document.body.querySelectorAll(`.${getSel(ElementClass.REMOVE)}`).forEach((element) => {
            element.remove();
        });
        jumpToScrollMarker(term, container);
    };
})();
/**
 * Creates an interactive term editing input. Inserts it into a term control.
 * @param terms Terms being controlled and highlighted.
 * @param controlPad The visible pad of the control. Contains the inline buttons and inputs.
 * @param idxCode The append term constant if the control is used to append a term,
 * or the index of a term if used to edit that term.
 * @param insertInput A function accepting the input element that inserts it into its term control.
 * @returns The input element created.
 */
const insertTermInput = (() => {
    /**
     * Focuses and selects the text of a term control input. Note that focus causes a term input to be visible.
     * @param control A term control element.
     * @param shiftCaretRight If supplied, whether to shift the caret to the right or the left. If unsupplied, all text is selected.
     */
    const selectInput = (control, shiftCaretRight) => {
        const input = control.querySelector("input");
        if (!input) {
            assert(false, "term input no select", "required element(s) not found", { control });
            return;
        }
        input.select();
        if (shiftCaretRight !== undefined) {
            const caretPosition = shiftCaretRight ? 0 : -1;
            input.setSelectionRange(caretPosition, caretPosition);
        }
    };
    /**
     * Executes the change indicated by the current input text of a term control.
     * Operates by sending a background message to this effect provided that the text was altered.
     * @param term A term to attempt committing the control input text of.
     * @param terms Terms being controlled and highlighted.
     */
    const commit = (term, terms) => {
        const replaces = !!term; // Whether a commit in this control replaces an existing term or appends a new one.
        const control = getControl(term);
        const termInput = control.querySelector("input");
        const inputValue = termInput.value;
        const idx = getTermIdx(term, terms);
        if (replaces && inputValue === "") {
            if (document.activeElement === termInput) {
                selectInput(getControl(undefined, idx + 1));
                return;
            }
            chrome.runtime.sendMessage({
                terms: terms.slice(0, idx).concat(terms.slice(idx + 1)),
                termChanged: term,
                termChangedIdx: TermChange.REMOVE,
            });
        }
        else if (replaces && inputValue !== term.phrase) {
            const termChanged = new MatchTerm(inputValue, term.matchMode);
            chrome.runtime.sendMessage({
                terms: terms.map((term, i) => i === idx ? termChanged : term),
                termChanged,
                termChangedIdx: idx,
            });
        }
        else if (!replaces && inputValue !== "") {
            const termChanged = new MatchTerm(inputValue, getTermControlMatchModeFromClassList(control.classList), {
                allowStemOverride: true,
            });
            chrome.runtime.sendMessage({
                terms: terms.concat(termChanged),
                termChanged,
                termChangedIdx: TermChange.CREATE,
                toggleAutoOverwritable: false,
            });
        }
    };
    /**
     * Shifts the control focus to another control if the caret is at the input end corresponding to the requested direction.
     * A control is considered focused if its input is focused.
     * @param term The term of the currently focused control.
     * @param idxTarget The index of the target term control to shift to, if no shift direction is passed.
     * @param shiftRight Whether to shift rightwards or leftwards, if no target index is passed.
     * @param onBeforeShift A function to execute once the shift is confirmed but has not yet taken place.
     * @param terms Terms being controlled and highlighted.
     */
    const tryShiftTermFocus = (term, idxTarget, shiftRight, onBeforeShift, terms) => {
        const replaces = !!term; // Whether a commit in this control replaces an existing term or appends a new one.
        const control = getControl(term);
        const termInput = control.querySelector("input");
        const idx = replaces ? getTermIdx(term, terms) : terms.length;
        shiftRight !== null && shiftRight !== void 0 ? shiftRight : (shiftRight = (idxTarget !== null && idxTarget !== void 0 ? idxTarget : idx) > idx);
        if (termInput.selectionStart !== termInput.selectionEnd
            || termInput.selectionStart !== (shiftRight ? termInput.value.length : 0)) {
            return;
        }
        onBeforeShift();
        idxTarget !== null && idxTarget !== void 0 ? idxTarget : (idxTarget = Math.max(0, Math.min(shiftRight ? idx + 1 : idx - 1, terms.length)));
        if (idx === idxTarget) {
            commit(term, terms);
            if (!replaces) {
                termInput.value = "";
            }
        }
        else {
            const controlTarget = getControl(undefined, idxTarget);
            selectInput(controlTarget, shiftRight);
        }
    };
    return (terms, controlPad, idxCode, insertInput) => {
        var _a;
        const controlContent = (_a = controlPad
            .getElementsByClassName(getSel(ElementClass.CONTROL_CONTENT))[0]) !== null && _a !== void 0 ? _a : controlPad;
        const controlEdit = controlPad
            .getElementsByClassName(getSel(ElementClass.CONTROL_EDIT))[0];
        const term = terms[idxCode];
        // Whether a commit in this control replaces an existing term or appends a new one.
        const replaces = idxCode !== TermChange.CREATE;
        const input = document.createElement("input");
        input.type = "text";
        const resetInput = (termText = controlContent.textContent) => {
            input.value = replaces ? termText : "";
        };
        input.addEventListener("focusin", () => {
            if (input.classList.contains(getSel(ElementClass.OVERRIDE_FOCUS))) {
                return; // Focus has been delegated to another element and will be on the input when this class is removed
            }
            resetInput();
            resetTermControlInputsVisibility();
            input.classList.add(getSel(ElementClass.OVERRIDE_VISIBILITY));
        });
        input.addEventListener("focusout", () => {
            if (!input.classList.contains(getSel(ElementClass.OVERRIDE_FOCUS))) {
                // Focus has been lost, not delegated to another element
                commit(term, terms);
            }
        });
        input.addEventListener("keyup", event => {
            if (event.key === "Tab") {
                selectInputTextAll(input);
            }
        });
        const show = (event) => {
            event.preventDefault();
            input.select();
            selectInputTextAll(input);
        };
        const hide = () => {
            input.blur();
        };
        if (controlEdit) {
            controlEdit.onclick = event => {
                if (!input.classList.contains(getSel(ElementClass.OVERRIDE_VISIBILITY)) || getComputedStyle(input).width === "0") {
                    show(event);
                }
                else {
                    input.value = "";
                    commit(term, terms);
                    hide();
                }
            };
            controlEdit.oncontextmenu = event => {
                event.preventDefault();
                input.value = "";
                commit(term, terms);
                hide();
            };
            controlContent.oncontextmenu = show;
        }
        else if (!replaces) {
            const button = controlPad.querySelector("button");
            button.onclick = show;
            button.oncontextmenu = show;
        }
        (new ResizeObserver(entries => entries.forEach(entry => entry.contentRect.width === 0 ? hide() : undefined))).observe(input);
        input.onkeydown = event => {
            switch (event.key) {
                case "Enter": {
                    if (event.shiftKey) {
                        hide();
                        resetTermControlInputsVisibility();
                    }
                    else {
                        commit(term, terms);
                        resetInput(input.value);
                    }
                    return;
                }
                case "Escape": {
                    resetInput();
                    hide();
                    resetTermControlInputsVisibility();
                    return;
                }
                case "ArrowLeft":
                case "ArrowRight": {
                    tryShiftTermFocus(term, undefined, event.key === "ArrowRight", () => event.preventDefault(), terms);
                    return;
                }
                case "ArrowUp":
                case "ArrowDown": {
                    tryShiftTermFocus(term, (event.key === "ArrowUp") ? 0 : terms.length, undefined, () => event.preventDefault(), terms);
                    return;
                }
                case " ": {
                    if (!event.shiftKey) {
                        return;
                    }
                    event.preventDefault();
                    openTermOptionMenu(term);
                    return;
                }
            }
        };
        insertInput(input);
        return input;
    };
})();
/**
 * Gets the index of a term within an array of terms.
 * @param term A term to find.
 * @param terms Terms to search in.
 * @returns The append term constant index if not found, the term's index otherwise.
 */
const getTermIdx = (term, terms) => term ? terms.indexOf(term) : TermChange.CREATE;
/**
 * Gets the control of a term or at an index.
 * @param term A term to identify the control by, if supplied.
 * @param idx An index to identify the control by, if supplied.
 * @returns The control matching `term` if supplied and `idx` is `undefined`,
 * OR the control matching `idx` if supplied and less than the number of terms,
 * OR the append term control otherwise.
 */
const getControl = (term, idx) => {
    var _a;
    const barTerms = document.getElementById(getSel(ElementID.BAR_TERMS));
    return (idx === undefined && term
        ? barTerms.getElementsByClassName(getSel(ElementClass.TERM, term.selector))[0]
        : idx === undefined || idx >= barTerms.children.length
            ? getControlAppendTerm()
            : (_a = Array.from(barTerms.children).at(idx !== null && idx !== void 0 ? idx : -1)) !== null && _a !== void 0 ? _a : null);
};
/**
 * Gets the control for appending a new term.
 * @returns The control if present, `null` otherwise.
 */
const getControlAppendTerm = () => document.getElementById(getSel(ElementID.BAR_CONTROLS)).firstElementChild;
/**
 * Selects all of the text in an input. Does not affect focus.
 * Mainly a helper for mitigating a Chromium bug which causes `select()` for an input's initial focus to not select all text.
 * @param input An input element to select the text of.
 */
const selectInputTextAll = (input) => input.setSelectionRange(0, input.value.length);
/**
 * Updates the look of a term control to reflect whether or not it occurs within the document.
 * @param term A term to update the term control status for.
 */
const updateTermOccurringStatus = (term) => {
    const controlPad = getControl(term)
        .getElementsByClassName(getSel(ElementClass.CONTROL_PAD))[0];
    const hasOccurrences = document.body.getElementsByClassName(getSel(ElementClass.TERM, term.selector)).length !== 0;
    controlPad.classList[hasOccurrences ? "remove" : "add"](getSel(ElementClass.DISABLED));
};
/**
 * Updates the tooltip of a term control to reflect current highlighting or extension information as appropriate.
 * @param term A term to update the tooltip for.
 */
const updateTermTooltip = (() => {
    /**
     * Gets the number of matches for a term in the document.
     * @param term A term to get the occurrence count for.
     * @returns The occurrence count for the term.
     */
    const getOccurrenceCount = (term) => {
        const occurrences = Array.from(document.body.getElementsByClassName(getSel(ElementClass.TERM, term.selector)));
        const matches = occurrences.map(occurrence => occurrence.textContent).join("").match(term.pattern);
        return matches ? matches.length : 0;
    };
    return (term) => {
        const controlPad = getControl(term)
            .getElementsByClassName(getSel(ElementClass.CONTROL_PAD))[0];
        const controlContent = controlPad
            .getElementsByClassName(getSel(ElementClass.CONTROL_CONTENT))[0];
        const occurrenceCount = getOccurrenceCount(term);
        controlContent.title = `${occurrenceCount} ${occurrenceCount === 1 ? "match" : "matches"} in page${!occurrenceCount || !term.command ? ""
            : occurrenceCount === 1 ? `\nJump to: ${term.command} or ${term.commandReverse}`
                : `\nJump to next: ${term.command}\nJump to previous: ${term.commandReverse}`}`;
    };
})();
/**
 * Gets the term match type identifier for a match option.
 * @param text The text of a match option.
 * @returns The corresponding match type identifier string.
 */
const getTermOptionMatchType = (text) => // TODO rework system to not rely on option text
 text.slice(0, text.includes(" ") ? text.indexOf(" ") : undefined).toLowerCase();
/**
 * Transforms the current text of a term match option to reflect whether or not it is currently enabled.
 * @param optionIsEnabled Indicates whether the option text should display enablement.
 * @param title Option text in an unknown previous state.
 * @returns The option text reflecting the given enablement.
 */
const getTermOptionText = (optionIsEnabled, title) => optionIsEnabled
    ? title.includes("🗹") ? title : `${title} 🗹`
    : title.includes("🗹") ? title.slice(0, -2) : title;
/**
 * Updates the class list of a control to reflect the matching options of its term.
 * @param mode An object of term matching mode flags.
 * @param classList The control element class list for a term.
 */
const updateTermControlMatchModeClassList = (mode, classList) => {
    classList[mode.regex ? "add" : "remove"](getSel(ElementClass.MATCH_REGEX));
    classList[mode.case ? "add" : "remove"](getSel(ElementClass.MATCH_CASE));
    classList[mode.stem ? "add" : "remove"](getSel(ElementClass.MATCH_STEM));
    classList[mode.whole ? "add" : "remove"](getSel(ElementClass.MATCH_WHOLE));
    classList[mode.diacritics ? "add" : "remove"](getSel(ElementClass.MATCH_DIACRITICS));
};
/**
 * Gets the matching options of a term from the class list of its control.
 * @param classList The control element class list for a term.
 * @returns The matching options for a term.
 */
const getTermControlMatchModeFromClassList = (classList) => ({
    regex: classList.contains(getSel(ElementClass.MATCH_REGEX)),
    case: classList.contains(getSel(ElementClass.MATCH_CASE)),
    stem: classList.contains(getSel(ElementClass.MATCH_STEM)),
    whole: classList.contains(getSel(ElementClass.MATCH_WHOLE)),
    diacritics: classList.contains(getSel(ElementClass.MATCH_DIACRITICS)),
});
/**
 * Refreshes the control of a term to reflect its current state.
 * @param term A term with an existing control.
 * @param idx The index of the term.
 * @param highlightTags Element tags to reject from highlighting or form blocks of consecutive text nodes.
 */
const refreshTermControl = (term, idx, highlightTags) => {
    const control = getControl(undefined, idx);
    control.className = "";
    control.classList.add(getSel(ElementClass.CONTROL));
    control.classList.add(getSel(ElementClass.TERM, term.selector));
    updateTermControlMatchModeClassList(term.matchMode, control.classList);
    const controlContent = control.getElementsByClassName(getSel(ElementClass.CONTROL_CONTENT))[0];
    controlContent.onclick = () => jumpToTerm(highlightTags, false, term);
    controlContent.textContent = term.phrase;
    // TODO make function
    Array.from(control.getElementsByClassName(getSel(ElementClass.OPTION))).forEach(option => option.textContent = getTermOptionText(term.matchMode[getTermOptionMatchType(option.textContent)], option.textContent));
};
/**
 * Removes a term control element.
 * @param idx The index of an existing control to remove.
 */
const removeTermControl = (idx) => {
    getControl(undefined, idx).remove();
};
/**
 * Creates an clickable element to toggle one of the matching options for a term.
 * @param term The term for which to create a matching option.
 * @param text Text content for the option, which is also used to determine the matching mode it controls.
 * @param onActivated A function, taking the identifier for the match option, to execute each time the option is activated.
 * @returns The resulting option element.
 */
const createTermOption = (term, text, onActivated) => {
    const matchType = getTermOptionMatchType(text);
    const option = document.createElement("button");
    option.type = "button";
    option.classList.add(getSel(ElementClass.OPTION));
    option.tabIndex = -1;
    option.textContent = getTermOptionText(term.matchMode[matchType], text);
    option.onmouseup = () => {
        if (!option.matches(":active")) {
            onActivated(matchType);
        }
    };
    option.onclick = () => onActivated(matchType);
    return option;
};
/**
 * Moves focus temporarily from a term input to a target element. Term inputs normally commit when unfocused,
 * but this method ensures it is considered a delegation of focus so will not cause changes to be committed.
 * Accordingly, focus is returned to the input once lost from the target.
 * @param input The term input from which to delegate focus.
 * @param target The element which will hold focus until returned to the input.
 */
const delegateFocusFromTermInput = (input, target) => {
    if (document.activeElement === input) {
        input.classList.add(getSel(ElementClass.OVERRIDE_FOCUS));
    }
    target.focus();
    if (input.classList.contains(getSel(ElementClass.OVERRIDE_FOCUS))) {
        const returnFocus = () => {
            target.removeEventListener("blur", returnFocus);
            input.focus();
            input.classList.remove(getSel(ElementClass.OVERRIDE_FOCUS));
        };
        target.addEventListener("blur", returnFocus);
    }
};
/**
 * Creates a menu structure containing clickable elements to individually toggle the matching options for a term.
 * @param term The term for which to create a menu.
 * @param terms Terms being controlled and highlighted.
 * @param onActivated A function, taking the identifier for a match option, to execute each time the option is activated.
 * @param controlsInfo Details of controls being inserted.
 * @returns The resulting menu element.
 */
const createTermOptionMenu = (term, terms, controlsInfo, onActivated = (matchType) => {
    const termUpdate = Object.assign({}, term);
    termUpdate.matchMode = Object.assign({}, termUpdate.matchMode);
    termUpdate.matchMode[matchType] = !termUpdate.matchMode[matchType];
    chrome.runtime.sendMessage({
        terms: terms.map(termCurrent => termCurrent === term ? termUpdate : termCurrent),
        termChanged: termUpdate,
        termChangedIdx: getTermIdx(term, terms),
    });
}) => {
    const termIsValid = terms.includes(term); // If virtual and used for appending terms, this will be `false`.
    const optionList = document.createElement("menu");
    optionList.classList.add(getSel(ElementClass.OPTION_LIST));
    optionList.appendChild(createTermOption(term, "Case Sensitive", onActivated));
    optionList.appendChild(createTermOption(term, "Whole Word", onActivated));
    optionList.appendChild(createTermOption(term, "Stem Word", onActivated));
    optionList.appendChild(createTermOption(term, "Diacritics", onActivated));
    optionList.appendChild(createTermOption(term, "Regex Mode", onActivated));
    const handleKeyEvent = (event, executeResult = true) => {
        event.preventDefault();
        if (!executeResult) {
            return;
        }
        if (event.key === "Escape") {
            optionList.blur();
            return;
        }
        else if (event.key === " " || event.key.length !== 1) {
            return;
        }
        Array.from(optionList.querySelectorAll(`.${getSel(ElementClass.OPTION)}`)).some((option) => {
            var _a;
            if (((_a = option.textContent) !== null && _a !== void 0 ? _a : "").toLowerCase().startsWith(event.key)) {
                option.click();
                return true;
            }
            return false;
        });
        optionList.blur();
    };
    optionList.onkeydown = event => handleKeyEvent(event, false);
    optionList.onkeyup = event => handleKeyEvent(event);
    const controlReveal = document.createElement("button");
    controlReveal.type = "button";
    controlReveal.classList.add(getSel(ElementClass.CONTROL_BUTTON));
    controlReveal.classList.add(getSel(ElementClass.CONTROL_REVEAL));
    controlReveal.tabIndex = -1;
    controlReveal.disabled = !controlsInfo.barLook.showRevealIcon;
    controlReveal.addEventListener("click", () => {
        const input = controlReveal.parentElement ? controlReveal.parentElement.querySelector("input") : null;
        const willFocusInput = input ? input.getBoundingClientRect().width > 0 : false;
        resetTermControlInputsVisibility();
        if (input && willFocusInput) {
            input.focus();
        }
        openTermOptionMenu(termIsValid ? term : undefined);
    });
    const controlRevealToggle = document.createElement("img");
    controlRevealToggle.src = chrome.runtime.getURL("/icons/reveal.svg");
    controlReveal.appendChild(controlRevealToggle);
    return { optionList, controlReveal };
};
/**
 * Opens and focuses the menu of matching options for a term, allowing the user to toggle matching modes.
 * @param term The term for which to open a matching options menu.
 */
const openTermOptionMenu = (term) => {
    const control = getControl(term);
    const input = control ? control.querySelector("input") : null;
    const optionList = control ? control.querySelector(`.${getSel(ElementClass.OPTION_LIST)}`) : null;
    if (!input || !optionList) {
        assert(false, "term option menu no open", "required element(s) not found", { term: (term ? term : "term appender") });
        return;
    }
    delegateFocusFromTermInput(input, optionList);
    optionList.classList.add(getSel(ElementClass.OVERRIDE_VISIBILITY));
    optionList.tabIndex = 0;
    optionList.focus();
    optionList.classList.remove(getSel(ElementClass.OVERRIDE_VISIBILITY));
};
/**
 * Inserts an interactive term control element.
 * @param terms Terms being controlled and highlighted.
 * @param idx The index in `terms` of a term to assign.
 * @param command The string of a command to display as a shortcut hint for jumping to the next term.
 * @param commandReverse The string of a command to display as a shortcut hint for jumping to the previous term.
 * @param controlsInfo Details of controls inserted.
 * @param highlightTags Element tags to reject from highlighting or form blocks of consecutive text nodes.
 */
const insertTermControl = (terms, idx, command, commandReverse, controlsInfo, highlightTags) => {
    const term = terms.at(idx);
    const { optionList, controlReveal } = createTermOptionMenu(term, terms, controlsInfo);
    const controlPad = document.createElement("div");
    controlPad.classList.add(getSel(ElementClass.CONTROL_PAD));
    controlPad.classList.add(getSel(ElementClass.DISABLED));
    controlPad.appendChild(controlReveal);
    const controlContent = document.createElement("button");
    controlContent.type = "button";
    controlContent.classList.add(getSel(ElementClass.CONTROL_BUTTON));
    controlContent.classList.add(getSel(ElementClass.CONTROL_CONTENT));
    controlContent.tabIndex = -1;
    controlContent.textContent = term.phrase;
    controlContent.onclick = () => jumpToTerm(highlightTags, false, term);
    controlPad.appendChild(controlContent);
    const controlEdit = document.createElement("button");
    controlEdit.type = "button";
    controlEdit.classList.add(getSel(ElementClass.CONTROL_BUTTON));
    controlEdit.classList.add(getSel(ElementClass.CONTROL_EDIT));
    controlEdit.tabIndex = -1;
    controlEdit.disabled = !controlsInfo.barLook.showEditIcon;
    const controlEditChange = document.createElement("img");
    const controlEditRemove = document.createElement("img");
    controlEditChange.src = chrome.runtime.getURL("/icons/edit.svg");
    controlEditRemove.src = chrome.runtime.getURL("/icons/delete.svg");
    controlEditChange.classList.add(getSel(ElementClass.PRIMARY));
    controlEditRemove.classList.add(getSel(ElementClass.SECONDARY));
    controlEdit.appendChild(controlEditChange);
    controlEdit.appendChild(controlEditRemove);
    controlPad.appendChild(controlEdit);
    insertTermInput(terms, controlPad, idx, input => controlPad.insertBefore(input, controlEdit));
    term.command = command;
    term.commandReverse = commandReverse;
    const control = document.createElement("div");
    control.classList.add(getSel(ElementClass.CONTROL));
    control.classList.add(getSel(ElementClass.TERM, term.selector));
    control.appendChild(controlPad);
    control.appendChild(optionList);
    updateTermControlMatchModeClassList(term.matchMode, control.classList);
    document.getElementById(getSel(ElementID.BAR_TERMS)).appendChild(control);
};
/**
 * Extracts assigned shortcut strings from browser commands.
 * @param commands Commands as returned by the browser.
 * @returns An object containing the extracted command shortcut strings.
 */
const getTermCommands = (commands) => {
    const commandsDetail = commands.map(command => {
        var _a;
        return ({
            info: command.name ? parseCommand(command.name) : { type: CommandType.NONE },
            shortcut: (_a = command.shortcut) !== null && _a !== void 0 ? _a : "",
        });
    });
    return {
        down: commandsDetail
            .filter(commandDetail => commandDetail.info.type === CommandType.SELECT_TERM && !commandDetail.info.reversed)
            .map(commandDetail => commandDetail.shortcut),
        up: commandsDetail
            .filter(commandDetail => commandDetail.info.type === CommandType.SELECT_TERM && commandDetail.info.reversed)
            .map(commandDetail => commandDetail.shortcut),
    };
};
/**
 * Inserts constant bar controls into the toolbar.
 * @param terms Terms highlighted in the page to mark the scroll position of.
 * @param controlsInfo Details of controls to insert.
 * @param commands Browser commands to use in shortcut hints.
 * @param highlightTags Element tags to reject from highlighting or form blocks of consecutive text nodes.
 * @param hues Color hues for term styles to cycle through.
 */
const insertControls = (() => {
    /**
     * Inserts a control.
     * @param terms Terms to be controlled and highlighted.
     * @param barControlName A standard name for the control.
     * @param hideWhenInactive Indicates whether to hide the control while not in interaction.
     * @param controlsInfo Details of controls to insert.
     */
    const insertControl = (() => {
        /**
         * Inserts a control given control button details.
         * @param barControlName A standard name for the control.
         * @param info Details about the control button to create.
         * @param hideWhenInactive Indicates whether to hide the control while not in interaction.
         */
        const insertControlWithInfo = (barControlName, info, hideWhenInactive) => {
            const container = document.createElement("div");
            container.classList.add(getSel(ElementClass.BAR_CONTROL)); // TODO redundant? can use CSS to select partial class
            container.classList.add(getSel(ElementClass.BAR_CONTROL, barControlName));
            container.tabIndex = -1;
            const pad = document.createElement("div");
            pad.classList.add(getSel(ElementClass.CONTROL_PAD));
            pad.tabIndex = -1;
            const button = document.createElement("button");
            button.type = "button";
            button.tabIndex = -1;
            if (info.buttonClass) {
                button.classList.add(getSel(info.buttonClass));
            }
            if (info.path) {
                const image = document.createElement("img");
                image.src = chrome.runtime.getURL(info.path);
                button.appendChild(image);
            }
            if (info.label) {
                const text = document.createElement("div");
                text.tabIndex = -1;
                text.textContent = info.label;
                button.appendChild(text);
            }
            pad.appendChild(button);
            container.appendChild(pad);
            if (hideWhenInactive) {
                container.classList.add(getSel(ElementClass.DISABLED));
            }
            button.onclick = () => { var _a; return ((_a = info.onclick) !== null && _a !== void 0 ? _a : (() => undefined))(container); };
            if (info.setUp) {
                info.setUp(container);
            }
            document.getElementById(getSel(info.containerId)).appendChild(container);
        };
        return (terms, barControlName, hideWhenInactive, controlsInfo) => insertControlWithInfo(barControlName, {
            disableTabResearch: {
                path: "/icons/close.svg",
                containerId: ElementID.BAR_OPTIONS,
                onclick: () => chrome.runtime.sendMessage({
                    disableTabResearch: true,
                }),
            },
            performSearch: {
                path: "/icons/search.svg",
                containerId: ElementID.BAR_OPTIONS,
                onclick: () => chrome.runtime.sendMessage({
                    performSearch: true,
                }),
            },
            toggleHighlights: {
                path: "/icons/show.svg",
                containerId: ElementID.BAR_OPTIONS,
                onclick: () => chrome.runtime.sendMessage({
                    toggleHighlightsOn: !controlsInfo.highlightsShown,
                }),
            },
            appendTerm: {
                buttonClass: ElementClass.CONTROL_CONTENT,
                path: "/icons/create.svg",
                containerId: ElementID.BAR_CONTROLS,
                setUp: container => {
                    const pad = container.querySelector(`.${getSel(ElementClass.CONTROL_PAD)}`);
                    insertTermInput(terms, pad, TermChange.CREATE, input => pad.appendChild(input));
                    updateTermControlMatchModeClassList(controlsInfo.matchMode, container.classList);
                    const { optionList, controlReveal } = createTermOptionMenu(new MatchTerm("_", controlsInfo.matchMode), terms, controlsInfo, matchType => {
                        const matchMode = getTermControlMatchModeFromClassList(container.classList);
                        matchMode[matchType] = !matchMode[matchType];
                        updateTermControlMatchModeClassList(matchMode, container.classList);
                        Array.from(container.getElementsByClassName(getSel(ElementClass.OPTION))).forEach(option => option.textContent = getTermOptionText(matchMode[getTermOptionMatchType(option.textContent)], option.textContent));
                    });
                    pad.appendChild(controlReveal);
                    container.appendChild(optionList);
                },
            },
            pinTerms: {
                buttonClass: ElementClass.PIN,
                path: "/icons/pin.svg",
                containerId: ElementID.BAR_CONTROLS,
                onclick: control => {
                    control.remove();
                    chrome.runtime.sendMessage({
                        toggleAutoOverwritable: false,
                    });
                },
            },
        }[barControlName], hideWhenInactive);
    })();
    return (terms, controlsInfo, commands, highlightTags, hues) => {
        fillStylesheetContent(terms, hues);
        const bar = document.createElement("div");
        bar.id = getSel(ElementID.BAR);
        bar.ondragstart = event => event.preventDefault();
        bar.onmouseenter = () => {
            resetTermControlInputsVisibility();
            const controlInput = document.activeElement;
            if (controlInput && controlInput.tagName === "INPUT"
                && controlInput.closest(`#${getSel(ElementID.BAR)}`)) {
                controlInput.classList.add(getSel(ElementClass.OVERRIDE_VISIBILITY));
            }
        };
        bar.onmouseleave = bar.onmouseenter;
        if (controlsInfo.highlightsShown) {
            bar.classList.add(getSel(ElementClass.HIGHLIGHTS_SHOWN));
        }
        if (!controlsInfo.pageModifyEnabled) {
            bar.classList.add(getSel(ElementClass.DISABLED));
        }
        const barOptions = document.createElement("span");
        barOptions.id = getSel(ElementID.BAR_OPTIONS);
        const barTerms = document.createElement("span");
        barTerms.id = getSel(ElementID.BAR_TERMS);
        const barControls = document.createElement("span");
        barControls.id = getSel(ElementID.BAR_CONTROLS);
        bar.appendChild(barOptions);
        bar.appendChild(barTerms);
        bar.appendChild(barControls);
        document.body.insertAdjacentElement("beforebegin", bar);
        Object.keys(controlsInfo.barControlsShown).forEach((barControlName) => insertControl(terms, barControlName, !controlsInfo.barControlsShown[barControlName], controlsInfo));
        const termCommands = getTermCommands(commands);
        terms.forEach((term, i) => insertTermControl(terms, i, termCommands.down[i], termCommands.up[i], controlsInfo, highlightTags));
        const gutter = document.createElement("div");
        gutter.id = getSel(ElementID.MARKER_GUTTER);
        document.body.insertAdjacentElement("afterend", gutter);
    };
})();
/**
 * Empty the custom stylesheet, remove the control bar and marker gutter, and purge term focus class names.
 */
const removeControls = () => {
    const style = document.getElementById(getSel(ElementID.STYLE));
    if (!style || style.textContent === "") {
        return;
    }
    style.textContent = "";
    const bar = document.getElementById(getSel(ElementID.BAR));
    const gutter = document.getElementById(getSel(ElementID.MARKER_GUTTER));
    if (bar) {
        bar.remove();
    }
    if (gutter) {
        gutter.remove();
    }
    purgeClass(getSel(ElementClass.FOCUS_CONTAINER));
    purgeClass(getSel(ElementClass.FOCUS));
    revertElementsUnfocusable();
};
/**
 * Removes the visibility classes of all term control inputs, resetting their visibility.
 */
const resetTermControlInputsVisibility = () => purgeClass(getSel(ElementClass.OVERRIDE_VISIBILITY), document.getElementById(getSel(ElementID.BAR)), "input", classList => !classList.contains(getSel(ElementClass.OVERRIDE_FOCUS)));
/**
 * Gets the central y-position of the DOM rect of an element, relative to the document scroll container.
 * @param element An element
 * @returns The relative y-position.
 */
const getElementYRelative = (element) => (element.getBoundingClientRect().y + document.documentElement.scrollTop) / document.documentElement.scrollHeight;
/**
 * Inserts markers in the scrollbar to indicate the scroll positions of term highlights.
 * @param terms Terms highlighted in the page to mark the scroll position of.
 * @param highlightTags Element tags to reject from highlighting or form blocks of consecutive text nodes.
 * @param hues Color hues for term styles to cycle through.
 */
const insertScrollMarkers = (() => {
    /**
     * Extracts the selector of a term from its prefixed class name form.
     * @param highlightClassName The single class name of a term highlight.
     * @returns The corresponding term selector.
     */
    const getTermSelector = (highlightClassName) => highlightClassName.slice(getSel(ElementClass.TERM).length + 1);
    return (terms, highlightTags, hues) => {
        if (terms.length === 0) {
            return; // No terms results in an empty selector, which is not allowed.
        }
        const regexMatchTermSelector = new RegExp(`\\b${getSel(ElementClass.TERM)}(?:-\\w+)+\\b`);
        const containerBlockSelector = getContainerBlockSelector(highlightTags);
        const gutter = document.getElementById(getSel(ElementID.MARKER_GUTTER));
        const containersInfo = [];
        let markersHtml = "";
        document.body.querySelectorAll(terms
            .slice(0, hues.length) // The scroll markers are indistinct after the hue limit, and introduce unacceptable lag by ~10 terms
            .map(term => `mms-h.${getSel(ElementClass.TERM, term.selector)}`)
            .join(", ")).forEach((highlight) => {
            const container = getContainerBlock(highlight, highlightTags, containerBlockSelector);
            const containerIdx = containersInfo.findIndex(containerInfo => container.contains(containerInfo.container));
            const className = highlight.className.match(regexMatchTermSelector)[0];
            const yRelative = getElementYRelative(container);
            let markerCss = `top: ${yRelative * 100}%;`;
            if (containerIdx !== -1) {
                if (containersInfo[containerIdx].container === container) {
                    if (containersInfo[containerIdx].termsAdded.has(getTermSelector(className))) {
                        return;
                    }
                    else {
                        const termsAddedCount = Array.from(containersInfo[containerIdx].termsAdded).length;
                        markerCss += `padding-left: ${termsAddedCount * 5}px; z-index: ${termsAddedCount * -1}`;
                        containersInfo[containerIdx].termsAdded.add(getTermSelector(className));
                    }
                }
                else {
                    containersInfo.splice(containerIdx);
                    containersInfo.push({ container, termsAdded: new Set([getTermSelector(className)]) });
                }
            }
            else {
                containersInfo.push({ container, termsAdded: new Set([getTermSelector(className)]) });
            }
            markersHtml += `<div class="${className}" top="${yRelative}" style="${markerCss}"></div>`;
        });
        gutter.replaceChildren(); // Removes children, since inner HTML replacement does not for some reason
        gutter.innerHTML = markersHtml;
    };
})();
/**
 * Finds and highlights occurrences of terms, then marks their positions in the scrollbar.
 * @param terms Terms to find, highlight, and mark.
 * @param rootNode A node under which to find and highlight term occurrences.
 * @param highlightTags Element tags to reject from highlighting or form blocks of consecutive text nodes.
 * @param requestRefreshIndicators A generator function for requesting that term occurrence count indicators be regenerated.
 */
const generateTermHighlightsUnderNode = (() => {
    /**
     * Highlights a term matched in a text node.
     * @param term The term matched.
     * @param textEndNode The text node to highlight inside.
     * @param start The first character index of the match within the text node.
     * @param end The last character index of the match within the text node.
     * @param nodeItems The singly linked list of consecutive text nodes being internally highlighted.
     * @param nodeItemPrevious The previous item in the text node list.
     * @returns The new previous item (the item just highlighted).
     */
    const highlightInsideNode = (term, textEndNode, start, end, nodeItems, nodeItemPrevious) => {
        // TODO add strategy for mitigating damage (caused by programmatic changes by the website)
        const text = textEndNode.textContent;
        const textStart = text.substring(0, start);
        const highlight = document.createElement("mms-h");
        highlight.classList.add(getSel(ElementClass.TERM, term.selector));
        highlight.textContent = text.substring(start, end);
        textEndNode.textContent = text.substring(end);
        textEndNode.parentNode.insertBefore(highlight, textEndNode);
        nodeItems.insertAfter(nodeItemPrevious, highlight.firstChild);
        if (textStart !== "") {
            const textStartNode = document.createTextNode(textStart);
            highlight.parentNode.insertBefore(textStartNode, highlight);
            nodeItems.insertAfter(nodeItemPrevious, textStartNode);
            return (nodeItemPrevious ? nodeItemPrevious.next : nodeItems.first)
                .next;
        }
        return (nodeItemPrevious ? nodeItemPrevious.next : nodeItems.first);
    };
    /**
     * Highlights terms in a block of consecutive text nodes.
     * @param terms Terms to find and highlight.
     * @param nodeItems A singly linked list of consecutive text nodes to highlight inside.
     */
    const highlightInBlock = (terms, nodeItems) => {
        const textFlow = nodeItems.getText();
        for (const term of terms) {
            let nodeItemPrevious = null;
            let nodeItem = nodeItems.first;
            let textStart = 0;
            let textEnd = nodeItem.value.length;
            const matches = textFlow.matchAll(term.pattern);
            for (const match of matches) {
                let highlightStart = match.index;
                const highlightEnd = highlightStart + match[0].length;
                while (textEnd <= highlightStart) {
                    nodeItemPrevious = nodeItem;
                    nodeItem = nodeItem.next;
                    textStart = textEnd;
                    textEnd += nodeItem.value.length;
                }
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    nodeItemPrevious = highlightInsideNode(term, nodeItem.value, highlightStart - textStart, Math.min(highlightEnd - textStart, textEnd), nodeItems, nodeItemPrevious);
                    highlightStart = textEnd;
                    textStart = highlightEnd;
                    if (highlightEnd <= textEnd) {
                        break;
                    }
                    nodeItemPrevious = nodeItem;
                    nodeItem = nodeItem.next;
                    textStart = textEnd;
                    textEnd += nodeItem.value.length;
                }
            }
        }
    };
    /**
     * Highlights occurrences of terms in text nodes under a node in the DOM tree.
     * @param terms Terms to find and highlight.
     * @param node A root node under which to match terms and insert highlights.
     * @param highlightTags Element tags to reject from highlighting or form blocks of consecutive text nodes.
     * @param nodeItems A singly linked list of consecutive text nodes to highlight inside.
     * @param visitSiblings Whether to visit the siblings of the root node.
     */
    const insertHighlights = (terms, node, highlightTags, nodeItems = new UnbrokenNodeList, visitSiblings = true) => {
        // TODO support for <iframe>?
        do {
            switch (node.nodeType) {
                case (1): // Node.ELEMENT_NODE
                case (11): { // Node.DOCUMENT_FRAGMENT_NODE
                    if (!highlightTags.reject.has(node.tagName)) {
                        const breaksFlow = !highlightTags.flow.has(node.tagName);
                        if (breaksFlow && nodeItems.first) {
                            highlightInBlock(terms, nodeItems);
                            nodeItems.clear();
                        }
                        if (node.firstChild) {
                            insertHighlights(terms, node.firstChild, highlightTags, nodeItems);
                            if (breaksFlow && nodeItems.first) {
                                highlightInBlock(terms, nodeItems);
                                nodeItems.clear();
                            }
                        }
                    }
                    break;
                }
                case (3): { // Node.TEXT_NODE
                    nodeItems.push(node);
                    break;
                }
            }
            node = node.nextSibling; // May be null (checked by loop condition)
        } while (node && visitSiblings);
    };
    return (terms, rootNode, highlightTags, requestRefreshIndicators) => {
        if (rootNode.nodeType === Node.TEXT_NODE) {
            const nodeItems = new UnbrokenNodeList;
            nodeItems.push(rootNode);
            highlightInBlock(terms, nodeItems);
        }
        else {
            insertHighlights(terms, rootNode, highlightTags, new UnbrokenNodeList, false);
        }
        requestRefreshIndicators.next();
    };
})();
/**
 * Remove all uses of a class name in elements under a root node in the DOM tree.
 * @param className A class name to purge.
 * @param root A root node under which to purge the class (non-inclusive).
 * @param selectorPrefix A prefix for the selector of elements to purge from. The base selector is the class name supplied.
 * @param predicate A function called for each element, the condition of which must be met in order to purge from that element.
 */
const purgeClass = (className, root = document.body, selectorPrefix = "", predicate) => root.querySelectorAll(`${selectorPrefix}.${className}`).forEach(predicate
    ? element => predicate(element.classList) ? element.classList.remove(className) : undefined
    : element => element.classList.remove(className) // Predicate not called when not supplied, for efficiency (bulk purges)
);
/**
 * Revert all direct DOM tree changes under a root node introduced by the extension.
 * Circumstantial and non-direct alterations may remain.
 * @param classNames Class names of the highlights to remove. If left empty, all highlights are removed.
 * @param root A root node under which to remove highlights.
 */
const restoreNodes = (classNames = [], root = document.body) => {
    const highlights = root.querySelectorAll(classNames.length ? `mms-h.${classNames.join(", mms-h.")}` : "mms-h");
    for (const highlight of Array.from(highlights)) {
        highlight.outerHTML = highlight.innerHTML;
    }
    if (root.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        root = root.getRootNode();
        if (root.nodeType === Node.TEXT_NODE) {
            return;
        }
    }
    purgeClass(getSel(ElementClass.FOCUS_CONTAINER), root);
    purgeClass(getSel(ElementClass.FOCUS), root);
    revertElementsUnfocusable(root);
};
/**
 * Gets a mutation observer which listens to document changes and performs partial highlights where necessary.
 * @param requestRefreshIndicators A generator function for requesting that term occurrence count indicators be regenerated.
 * @param highlightTags Element tags to reject from highlighting or form blocks of consecutive text nodes.
 * @param terms Terms to be continuously found and highlighted within the DOM.
 */
const getObserverNodeHighlighter = (() => {
    /**
     * Determines whether or not the highlighting algorithm should be run on an element.
     * @param rejectSelector A selector string for ancestor tags to cause rejection.
     * @param element An element to test for highlighting viability.
     * @returns `true` if determined highlightable, `false` otherwise.
     */
    const canHighlightElement = (rejectSelector, element) => !element.closest(rejectSelector) && element.tagName !== "MMS-H";
    return (requestRefreshIndicators, highlightTags, terms) => {
        const rejectSelector = Array.from(highlightTags.reject).join(", ");
        return new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of Array.from(mutation.addedNodes)) {
                    // Node.ELEMENT_NODE, Node.DOCUMENT_FRAGMENT_NODE
                    if ((node.nodeType === 1 || node.nodeType === 11) && canHighlightElement(rejectSelector, node)) {
                        restoreNodes([], node);
                        generateTermHighlightsUnderNode(terms, node, highlightTags, requestRefreshIndicators);
                    }
                }
            }
            terms.forEach(term => updateTermOccurringStatus(term));
        });
    };
})();
/**
 * Starts a mutation observer for highlighting, listening for DOM mutations then selectively highlighting under affected nodes.
 * @param observer An observer which selectively performs highlighting on observing changes.
 */
const highlightInNodesOnMutation = (observer) => observer.observe(document.body, { childList: true, subtree: true });
/**
 * Stops a mutation observer for highlighting, thus halting continuous highlighting.
 * @param observer An observer which selectively performs highlighting on observing changes.
 */
const highlightInNodesOnMutationDisconnect = (observer) => observer.disconnect();
/**
 * Removes previous highlighting, then highlights the document using the terms supplied.
 * Disables then restarts continuous highlighting.
 * @param terms Terms to be continuously found and highlighted within the DOM.
 * @param termsToPurge Terms for which to remove previous highlights.
 * @param pageModifyEnabled Indicates whether to modify page content.
 * @param highlightTags Element tags to reject from highlighting or form blocks of consecutive text nodes.
 * @param requestRefreshIndicators A generator function for requesting that term occurrence count indicators be regenerated.
 * @param observer An observer which selectively performs highlighting on observing changes.
 */
const beginHighlighting = (terms, termsToPurge, pageModifyEnabled, highlightTags, requestRefreshIndicators, observer) => {
    highlightInNodesOnMutationDisconnect(observer);
    restoreNodes(termsToPurge.length ? termsToPurge.map(term => getSel(ElementClass.TERM, term.selector)) : []);
    if (pageModifyEnabled) {
        generateTermHighlightsUnderNode(terms, document.body, highlightTags, requestRefreshIndicators);
        terms.forEach(term => updateTermOccurringStatus(term));
        highlightInNodesOnMutation(observer);
    }
};
/**
 * Extracts terms from the currently user-selected string.
 * @returns The extracted terms, split at some separator and some punctuation characters,
 * with some other punctuation characters removed.
 */
const getTermsFromSelection = () => {
    const selection = document.getSelection();
    const terms = [];
    if (selection && selection.anchorNode) {
        const termsAll = selection.toString().split(/\r|\p{Zs}|\p{Po}|\p{Cc}/gu)
            // (carriage return) | Space Separators | Other Punctuation | Control
            .map(phrase => phrase.replace(/\p{Pc}|\p{Ps}|\p{Pe}|\p{Pi}|\p{Pf}/gu, ""))
            // Connector Punctuation | Open Punctuation | Close Punctuation | Initial Punctuation | Final Punctuation
            .filter(phrase => phrase !== "").map(phrase => new MatchTerm(phrase));
        const termSelectors = new Set;
        termsAll.forEach(term => {
            if (!termSelectors.has(term.selector)) {
                termSelectors.add(term.selector);
                terms.push(term);
            }
        });
    }
    return terms;
};
(() => {
    /**
     * Inserts the toolbar with term controls and begins continuously highlighting terms in the document.
     * All controls necessary are first removed. Refreshes executed may be whole or partial according to requirements.
     * @param terms Terms to highlight and display in the toolbar.
     * @param controlsInfo Details of controls to insert.
     * @param commands Browser commands to use in shortcut hints.
     * @param highlightTags Element tags to reject from highlighting or form blocks of consecutive text nodes.
     * @param hues Color hues for term styles to cycle through.
     * @param observer An observer which selectively performs highlighting on observing changes.
     * @param requestRefreshIndicators A generator function for requesting that term occurrence count indicators be regenerated.
     * @param termsUpdate An array of terms to which to update the existing terms, if change is necessary.
     * @param termUpdate A new term to insert, a term to be removed, or a changed version of a term, if supplied.
     * @param termToUpdateIdx The create term constant, the remove term constant, or the index of a term to update, if supplied.
     * The argument type from these determines how the single term update is interpreted.
     */
    const refreshTermControlsAndBeginHighlighting = (() => {
        /**
         * Insert the toolbar and appropriate controls.
         * @param terms Terms to highlight and display in the toolbar.
         * @param controlsInfo Details of controls to insert.
         * @param commands Browser commands to use in shortcut hints.
         * @param highlightTags Element tags to reject from highlighting or form blocks of consecutive text nodes.
         * @param hues Color hues for term styles to cycle through.
         */
        const insertToolbar = (terms, controlsInfo, commands, highlightTags, hues) => {
            const focusingControlAppend = document.activeElement && document.activeElement.tagName === "INPUT"
                && document.activeElement.closest(`#${getSel(ElementID.BAR)}`);
            removeControls();
            insertControls(terms, controlsInfo, commands, highlightTags, hues);
            if (focusingControlAppend) {
                getControl().querySelector("input").select();
            }
        };
        return (terms, controlsInfo, commands, highlightTags, hues, observer, requestRefreshIndicators, termsUpdate, termUpdate, termToUpdateIdx) => {
            const termsToHighlight = [];
            const termsToPurge = [];
            if (termsUpdate !== undefined && termToUpdateIdx !== undefined
                && termToUpdateIdx !== TermChange.REMOVE && termUpdate) {
                if (termToUpdateIdx === TermChange.CREATE) {
                    terms.push(new MatchTerm(termUpdate.phrase, termUpdate.matchMode));
                    const termCommands = getTermCommands(commands);
                    const idx = terms.length - 1;
                    insertTermControl(terms, idx, termCommands.down[idx], termCommands.up[idx], controlsInfo, highlightTags);
                    termsToHighlight.push(terms[idx]);
                    termsToPurge.push(terms[idx]);
                }
                else {
                    const term = terms[termToUpdateIdx];
                    termsToPurge.push(Object.assign({}, term));
                    term.matchMode = termUpdate.matchMode;
                    term.phrase = termUpdate.phrase;
                    term.compile();
                    refreshTermControl(terms[termToUpdateIdx], termToUpdateIdx, highlightTags);
                    termsToHighlight.push(term);
                }
            }
            else if (termsUpdate !== undefined) {
                if (termToUpdateIdx === TermChange.REMOVE && termUpdate) {
                    const termRemovedPreviousIdx = terms.findIndex(term => JSON.stringify(term) === JSON.stringify(termUpdate));
                    if (assert(termRemovedPreviousIdx !== -1, "term not deleted", "not stored in this page", { term: termUpdate })) {
                        removeTermControl(termRemovedPreviousIdx);
                        terms.splice(termRemovedPreviousIdx, 1);
                        restoreNodes([getSel(ElementClass.TERM, termUpdate.selector)]);
                        fillStylesheetContent(terms, hues);
                        requestRefreshIndicators.next();
                        return;
                    }
                }
                else {
                    terms.splice(0);
                    termsUpdate.forEach(term => terms.push(new MatchTerm(term.phrase, term.matchMode)));
                    insertToolbar(terms, controlsInfo, commands, highlightTags, hues);
                }
            }
            else {
                return;
            }
            fillStylesheetContent(terms, hues);
            beginHighlighting(termsToHighlight.length ? termsToHighlight : terms, termsToPurge, controlsInfo.pageModifyEnabled, highlightTags, requestRefreshIndicators, observer);
        };
    })();
    /**
     * Inserts a uniquely identified CSS stylesheet to perform all extension styling.
     */
    const insertStyleElement = () => {
        let style = document.getElementById(getSel(ElementID.STYLE));
        if (!style) {
            style = document.createElement("style");
            style.id = getSel(ElementID.STYLE);
            document.head.appendChild(style);
        }
    };
    /**
     * Returns a generator function to consume empty requests for reinserting term scrollbar markers.
     * Request fulfillment may be variably delayed based on activity.
     * @param terms Terms being highlighted and marked.
     * @param highlightTags Element tags to reject from highlighting or form blocks of consecutive text nodes.
     * @param hues Color hues for term styles to cycle through.
     */
    const requestRefreshIndicatorsFn = function* (terms, highlightTags, hues) {
        const requestWaitDuration = 1000;
        const reschedulingDelayMax = 5000;
        const reschedulingRequestCountMargin = 1;
        let timeRequestAcceptedLast = 0;
        let requestCount = 0;
        const scheduleRefresh = () => setTimeout(() => {
            const dateMs = Date.now();
            if (requestCount > reschedulingRequestCountMargin
                && dateMs < timeRequestAcceptedLast + reschedulingDelayMax) {
                requestCount = 0;
                scheduleRefresh();
                return;
            }
            requestCount = 0;
            insertScrollMarkers(terms, highlightTags, hues);
            terms.forEach(term => updateTermTooltip(term));
        }, requestWaitDuration + 50); // Arbitrary small amount added to account for lag (preventing lost updates).
        while (true) {
            requestCount++;
            const dateMs = Date.now();
            if (dateMs > timeRequestAcceptedLast + requestWaitDuration) {
                timeRequestAcceptedLast = dateMs;
                scheduleRefresh();
            }
            yield;
        }
    };
    /**
     * Returns a generator function to consume individual command objects and produce their desired effect.
     * @param highlightTags Element tags to reject from highlighting or form blocks of consecutive text nodes.
     * @param terms Terms being controlled, highlighted, and jumped to.
     */
    const produceEffectOnCommandFn = function* (terms, highlightTags) {
        var _a, _b;
        let selectModeFocus = false;
        let focusedIdx = 0;
        while (true) {
            const commandInfo = yield;
            if (!commandInfo) {
                continue; // Requires an initial empty call before working (TODO solve this issue).
            }
            const getFocusedIdx = (idx) => Math.min(terms.length - 1, idx);
            focusedIdx = getFocusedIdx(focusedIdx);
            switch (commandInfo.type) {
                case CommandType.TOGGLE_BAR: {
                    const bar = document.getElementById(getSel(ElementID.BAR));
                    bar.classList.toggle(getSel(ElementClass.BAR_HIDDEN));
                    break;
                }
                case CommandType.TOGGLE_SELECT: {
                    selectModeFocus = !selectModeFocus;
                    break;
                }
                case CommandType.ADVANCE_GLOBAL: {
                    if (selectModeFocus) {
                        jumpToTerm(highlightTags, (_a = commandInfo.reversed) !== null && _a !== void 0 ? _a : false, terms[focusedIdx]);
                    }
                    else {
                        jumpToTerm(highlightTags, (_b = commandInfo.reversed) !== null && _b !== void 0 ? _b : false);
                    }
                    break;
                }
                case CommandType.FOCUS_TERM_INPUT: {
                    const control = getControl(undefined, commandInfo.termIdx);
                    const input = control ? control.querySelector("input") : null;
                    if (!control || !input) {
                        break;
                    }
                    const selection = getSelection();
                    const focusReturnElement = document.activeElement;
                    const selectionReturnRanges = selection
                        ? Array(selection.rangeCount).fill(null).map((v, i) => selection.getRangeAt(i))
                        : null;
                    control.classList.add(getSel(ElementClass.OVERRIDE_VISIBILITY));
                    input.select();
                    control.classList.remove(getSel(ElementClass.OVERRIDE_VISIBILITY));
                    selectInputTextAll(input);
                    const bar = document.getElementById(getSel(ElementID.BAR));
                    const returnSelection = (event) => {
                        if (event.relatedTarget) {
                            setTimeout(() => {
                                if (!document.activeElement || !document.activeElement.closest(`#${getSel(ElementID.BAR)}`)) {
                                    bar.removeEventListener("focusout", returnSelection);
                                }
                            });
                            return; // Focus is being moved, not lost.
                        }
                        if (document.activeElement && document.activeElement.closest(`#${getSel(ElementID.BAR)}`)) {
                            return;
                        }
                        bar.removeEventListener("focusout", returnSelection);
                        if (focusReturnElement && focusReturnElement["focus"]) {
                            focusReturnElement.focus({ preventScroll: true });
                        }
                        if (selection && selectionReturnRanges !== null) {
                            selection.removeAllRanges();
                            selectionReturnRanges.forEach(range => selection.addRange(range));
                        }
                    };
                    bar.addEventListener("focusout", returnSelection);
                    break;
                }
                case CommandType.SELECT_TERM: {
                    const barTerms = document.getElementById(getSel(ElementID.BAR_TERMS));
                    barTerms.classList.remove(getSel(ElementClass.CONTROL_PAD, focusedIdx));
                    focusedIdx = getFocusedIdx(commandInfo.termIdx);
                    barTerms.classList.add(getSel(ElementClass.CONTROL_PAD, focusedIdx));
                    if (!selectModeFocus) {
                        jumpToTerm(highlightTags, commandInfo.reversed, terms[focusedIdx]);
                    }
                    break;
                }
            }
        }
    };
    /**
     * Gets a set of highlight tags in all forms reasonably required.
     * @param tagsLower An array of tag names in their lowercase form.
     * @returns The corresponding set of tag names in all forms necessary.
     */
    const getHighlightTagsSet = (tagsLower) => new Set(tagsLower.flatMap(tagLower => [tagLower, tagLower.toUpperCase()]));
    return () => {
        window[WindowFlag.EXECUTION_UNNECESSARY] = true;
        const commands = [];
        const terms = [];
        const hues = [];
        const controlsInfo = {
            pageModifyEnabled: false,
            highlightsShown: false,
            barControlsShown: {
                disableTabResearch: true,
                performSearch: false,
                toggleHighlights: true,
                appendTerm: true,
                pinTerms: true,
            },
            barLook: {
                showEditIcon: true,
                showRevealIcon: true,
            },
            matchMode: {
                regex: false,
                case: false,
                stem: false,
                whole: false,
                diacritics: false,
            },
        };
        const highlightTags = {
            reject: getHighlightTagsSet(["meta", "style", "script", "noscript", "title"]),
            flow: getHighlightTagsSet(["b", "i", "u", "strong", "em", "cite", "span", "mark", "wbr", "code", "data", "dfn", "ins",
                "mms-h"]),
            // break: any other class of element
        };
        const requestRefreshIndicators = requestRefreshIndicatorsFn(terms, highlightTags, hues);
        const produceEffectOnCommand = produceEffectOnCommandFn(terms, highlightTags);
        const observer = getObserverNodeHighlighter(requestRefreshIndicators, highlightTags, terms);
        produceEffectOnCommand.next(); // Requires an initial empty call before working (TODO otherwise mitigate).
        insertStyleElement();
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            var _a, _b;
            if (message.getDetails) {
                const details = {};
                if (message.getDetails.termsFromSelection) {
                    details.terms = getTermsFromSelection();
                }
                if (message.getDetails.highlightsShown) {
                    details.highlightsShown = controlsInfo.highlightsShown;
                }
                sendResponse(details);
            }
            if (message.extensionCommands) {
                commands.splice(0);
                message.extensionCommands.forEach(command => commands.push(command));
            }
            Object.entries((_a = message.barControlsShown) !== null && _a !== void 0 ? _a : {}).forEach(([key, value]) => {
                if (key !== "pinTerms") {
                    controlsInfo.barControlsShown[key] = value;
                }
            });
            if (message.autoOverwritable !== undefined) {
                controlsInfo.barControlsShown.pinTerms = message.autoOverwritable;
            }
            Object.entries((_b = message.barLook) !== null && _b !== void 0 ? _b : {}).forEach(([key, value]) => {
                controlsInfo.barLook[key] = value;
            });
            if (message.highlightLook) {
                hues.splice(0);
                message.highlightLook.hues.forEach(hue => hues.push(hue));
            }
            if (message.matchMode) {
                Object.assign(controlsInfo.matchMode, message.matchMode);
            }
            if (message.toggleHighlightsOn !== undefined) {
                controlsInfo.highlightsShown = message.toggleHighlightsOn;
            }
            if (message.deactivate) {
                terms.splice(0);
                removeControls();
                restoreNodes();
            }
            if (message.enablePageModify !== undefined) {
                controlsInfo.pageModifyEnabled = message.enablePageModify;
            }
            if (message.termUpdate
                || (message.terms !== undefined && (!itemsMatch(terms, message.terms, (a, b) => a.phrase === b.phrase)
                    || (!terms.length && !document.getElementById(ElementID.BAR))))) {
                refreshTermControlsAndBeginHighlighting(terms, //
                controlsInfo, commands, //
                highlightTags, hues, //
                observer, requestRefreshIndicators, //
                message.terms, message.termUpdate, message.termToUpdateIdx);
            }
            if (message.command) {
                produceEffectOnCommand.next(message.command);
            }
            const bar = document.getElementById(getSel(ElementID.BAR));
            if (bar) {
                bar.classList[controlsInfo.highlightsShown ? "add" : "remove"](getSel(ElementClass.HIGHLIGHTS_SHOWN));
            }
            const pinSelector = `.${getSel(ElementClass.PIN)}`;
            if (!controlsInfo.barControlsShown.pinTerms
                && document.querySelector(pinSelector)) {
                document.querySelector(pinSelector).remove();
            }
            sendResponse({}); // Mitigates manifest V3 bug which otherwise logs an error message.
        });
    };
})()();
