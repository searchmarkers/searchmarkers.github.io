document.addEventListener("DOMContentLoaded", () => {
	const theme = localStorage.getItem("theme");
	if (theme !== null) {
		const input = document.getElementById("theme-" + theme);
		if (input) {
			input.checked = true;
		} else {
			console.warn("The stored theme '" + theme + "' is not available on this page. Using automatic theme.");
		}
	}
}, { passive: true });

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
