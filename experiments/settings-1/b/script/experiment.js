{
	const input = document.getElementById("setting--highlighting-hues");
	const row = input.closest(".setting-list > *");
	const addPreviewElement = () => {
		const container = document.createElement("div");
		container.classList.add("highlight-colors");
		for (const hue of input.value.split(",").map(hueString => parseInt(hueString))) {
			const colorElement = document.createElement("div");
			colorElement.style.setProperty("--hue", hue.toString());
			container.appendChild(colorElement);
		}
		row.append(container);
		return container;
	};
	let previewElement = addPreviewElement();
	input.addEventListener("input", () => {
		previewElement.remove();
		previewElement = addPreviewElement();
	});
}

document.getElementById("theme-light").click();
