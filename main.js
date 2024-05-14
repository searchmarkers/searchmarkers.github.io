document.addEventListener("DOMContentLoaded", () => {
	const theme = localStorage.getItem("theme");
	if (theme !== null) {
		const checkbox = document.getElementById("theme-" + theme);
		if (checkbox) {
			checkbox.checked = true;
		} else {
			console.warn("The stored theme '" + theme + "' is not available on this page. Selecting automatic theme.");
		}
	}
	for (const checkbox of document.querySelectorAll("input[name='theme']")) {
		checkbox.addEventListener("change", () => {
			if (checkbox.checked) {
				if (checkbox.id === "theme") {
					localStorage.removeItem("theme");
				} else {
					localStorage.setItem("theme", checkbox.id.slice(checkbox.id.indexOf("-") + 1));
				}
			}
		});
	}
});
