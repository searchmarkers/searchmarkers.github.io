const loadTheme = theme => {
	const input = document.getElementById("theme-" + theme);
	if (!input) return false;
	input.checked = true;
	return true;
};

const storedTheme = localStorage.getItem("theme");

if (storedTheme !== null && !loadTheme(storedTheme)) {
	document.addEventListener("DOMContentLoaded", () => {
		if (!loadTheme(storedTheme)) {
			console.warn("Theme '" + storedTheme + "' is not available on this page. Using automatic theme.");
		}
	}, { passive: true });
}

addEventListener("input", event => {
	const input = event.target;
	if (input instanceof HTMLInputElement && input.getAttribute("name") === "theme") {
		if (input.checked) {
			if (input.id === "theme") {
				localStorage.removeItem("theme");
			} else {
				localStorage.setItem("theme",
					input.id.slice(input.id.indexOf("-") + 1)
				);
			}
		}
	}
}, { passive: true });
