"use strict";

if (new URL(location.href).searchParams.get("frame") !== null) {
    document.body.classList.add("frame");
}

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

const activateCurrentTab = (currentUrl) => {
    const id = currentUrl.hash.slice(1);
    for (const activeTab of document.querySelectorAll(".tab-list .active")) {
        activeTab.classList.remove("active");
    }
    if (id.length === 0) {
        return;
    }
    const heading = document.getElementById(id)?.closest(".section")?.querySelector("h2");
    if (!heading) {
        return;
    }
    const tab = document.querySelector(`.tab-list a[href="#${heading.id}"]`);
    if (!tab) {
        return;
    }
    tab.classList.add("active");
};

addEventListener("hashchange", () => {
    activateCurrentTab(location);
});

activateCurrentTab(location);
