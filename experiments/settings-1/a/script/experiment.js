for (const input of document.querySelectorAll(".highlightMethod-hues")) {
	const rowContainer = input.closest(".preference-row");
	const previewRow = document.createElement("div");
	const addPreviewElement = () => {
		const container = document.createElement("div");
		container.classList.add("highlight-colors");
		for (const hue of input.value.split(",").map(hueString => parseInt(hueString))) {
			const colorElement = document.createElement("div");
			colorElement.style.setProperty("--hue", hue.toString());
			container.appendChild(colorElement);
		}
		previewRow.append(container);
		rowContainer.insertAdjacentElement("afterend", previewRow);
		return container;
	};
	let previewElement = addPreviewElement();
	input.addEventListener("input", () => {
		previewElement.remove();
		previewElement = addPreviewElement();
	});
}
