document.addEventListener("DOMContentLoaded", function () {

    let savedRange = null;

    function restoreSelection() {
        if (savedRange) {
            const selection = window.getSelection();
            selection.removeAllRanges(); 
            selection.addRange(savedRange); 
        } else {
            console.log("No saved range to restore."); 
        }
    }

    const editor = document.getElementById("editor");

    const toolbar = document.createElement("div");
    toolbar.classList.add("text-toolbar");
    toolbar.innerHTML = `
        <button data-action="bold"><b>B</b></button>
        <button data-action="italic"><i>I</i></button>
        <button data-action="underline"><u>U</u></button>
        <button data-action="color">🎨</button>
        <button data-action="highlight">🖍</button>
        <button data-action="link">🔗</button>
        <button data-action="h1">H1</button>
        <button data-action="h2">H2</button>
    `;
    document.body.appendChild(toolbar);
    toolbar.style.display = "none";

    const popup = document.createElement("div");
    popup.classList.add("coloring-custom-popup");
    popup.innerHTML = `<input type="text" id="popup-input"><button id="popup-submit">OK</button>`;
    document.body.appendChild(popup);
    popup.style.display = "none";


    const linkPopup = document.createElement("div");
    linkPopup.classList.add("link-custom-popup");
    linkPopup.innerHTML = `
        <input type="text" id="link-input" placeholder="Enter link URL">
        <button id="link-submit">OK</button>
    `;
    document.body.appendChild(linkPopup);
    linkPopup.style.display = "none";



    function showToolbar() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0 || selection.isCollapsed) {
            toolbar.style.display = "none";
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        toolbar.style.top = `${rect.top + window.scrollY - 50}px`;
        toolbar.style.left = `${rect.left + window.scrollX - 150}px`;
        toolbar.style.display = "flex";

        updateToolbarState();
    }

    function updateToolbarState() {
        const actions = ["bold", "italic", "underline", "h1", "h2", "color", "highlight", "link"];
        actions.forEach(action => {
            const button = toolbar.querySelector(`[data-action="${action}"]`);
            
            if (isActionApplied(action)) {
                button.classList.add("active");
            } else {
                button.classList.remove("active");
            }
        });
    }
    
    function isActionApplied(action) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return false;
    
        const range = selection.getRangeAt(0);
        const commonAncestor = range.commonAncestorContainer;
    
        let hasStyled = false;
        let hasUnstyled = false;
    
        function checkNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                let parent = node.parentElement;
                if (parent) {
                    if (action === "link") {
                        // Special case for links
                        if (parent.closest("a.editor-a")) {
                            hasStyled = true;
                        } else {
                            hasUnstyled = true;
                        }
                    } else if (parent.closest(`.editor-${action}`)) {
                        hasStyled = true;
                    } else {
                        hasUnstyled = true;
                    }
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (action === "link") {
                    // Special case for links
                    if (node.closest("a.editor-a")) {
                        hasStyled = true;
                    } else {
                        hasUnstyled = true;
                    }
                } else if (node.closest(`.editor-${action}`)) {
                    hasStyled = true;
                } else {
                    hasUnstyled = true;
                }
                node.childNodes.forEach(checkNode);
            }
        }
    
        // If a single text node is selected
        if (commonAncestor.nodeType === Node.TEXT_NODE) {
            checkNode(commonAncestor);
        } else {
            // Get all nodes inside the selection
            let selectedNodes = [];
            let treeWalker = document.createTreeWalker(
                range.commonAncestorContainer,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function (node) {
                        return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                    }
                },
                false
            );
    
            while (treeWalker.nextNode()) {
                selectedNodes.push(treeWalker.currentNode);
            }
    
            selectedNodes.forEach(checkNode);
        }
    
        return hasStyled && !hasUnstyled;
    }
    
    editor.addEventListener("mouseup", showToolbar);
    editor.addEventListener("keyup", showToolbar);

    toolbar.addEventListener("click", function (event) {
        const button = event.target.closest("button");
        if (!button) return;
    
        const action = button.dataset.action;
        if (!action) return;
    
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
    
        const range = selection.getRangeAt(0);
        const selectedText = range.toString().trim();
    
        if (["bold", "italic", "underline"].includes(action)) {
            toggleFormat(range, action);
        } else if (["color", "highlight"].includes(action)) {
            if (isActionApplied(action)) {
                toggleFormat(range, action); 
            } else {
                showPopup(button, action); 
            }
        } else if (action === "link") {
            if (isActionApplied("link")) {
                
                toggleFormat(range, "link");
            } else {
                
                showPopup(button, "link");
            }
        } else if (["h1", "h2"].includes(action)) {
            toggleHeading(action);
        }
    
        updateToolbarState();
        toolbar.style.display = "none"; 
    });

    function toggleFormat(range, action) {
        if (action === "link") {
            // Handle link separately
            const container = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
                ? range.commonAncestorContainer
                : range.commonAncestorContainer.parentNode;
    
            const linkElement = container.closest("a.editor-a");
    
            if (linkElement) {
                unwrapSelection(range, linkElement);
            } else {
                showPopup(toolbar.querySelector('[data-action="link"]'), "link");
            }
        } else {
            // Handle other formatting actions
            const tag = getWrapperTag(action);
            const className = `editor-${action}`;
    
            const container = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
                ? range.commonAncestorContainer
                : range.commonAncestorContainer.parentNode;
    
            const elementToUnwrap = container.closest(tag);
    
            if (isActionApplied(action) && elementToUnwrap) {
                unwrapSelection(range, elementToUnwrap);
            } else {
                wrapSelection(range, tag, className);
            }
        }
    }
    
    function getWrapperTag(action) {
        switch (action) {
            case "bold":
                return "strong";
            case "italic":
                return "em";
            case "link":
                return "a";
            case "underline":
                return "u";
            case "highlight":
                return "mark";
            case "color":
                return "span";
            default:
                return "span";
        }
    }

    function wrapSelection(range, tag, className) {
        const selectedNodes = range.cloneContents();
    
        const container = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
            ? range.commonAncestorContainer
            : range.commonAncestorContainer.parentNode;
    
        const existingElement = container.closest(`${tag}.${className}`);
    
        if (existingElement) {
            unwrapSelection(range, existingElement);
            return;
        }
    
        const wrapper = document.createElement(tag);
        wrapper.className = className;
    
        const fragment = document.createDocumentFragment();
        let child = selectedNodes.firstChild;
    
        while (child) {
            if (child.nodeType !== Node.ELEMENT_NODE || !child.children) {
                fragment.appendChild(child);
                child = selectedNodes.firstChild;
                continue;
            }
    
            processDeeplyNestedElements(child, wrapper);
    
            if (wrapper.className === child.className) {
                while (child.firstChild) {
                    fragment.appendChild(child.firstChild); 
                }
                selectedNodes.replaceChild(fragment, child); 
            } else {
                fragment.appendChild(child);
            }
    
            child = selectedNodes.firstChild;
        }
    
        wrapper.appendChild(fragment);
    
        range.deleteContents();
        range.insertNode(wrapper);
    
        if (wrapper.parentNode && wrapper.parentNode.isConnected) {
            wrapper.parentNode.normalize();
        }
        mergeAdjacentElements(container);
        removeEmptyTags(container);
    }
    
    function removeEmptyTags(element) {
        if (!element || !element.childNodes) return;
    
        for (let i = element.childNodes.length - 1; i >= 0; i--) {
            const child = element.childNodes[i];
    
            if (child.nodeType === Node.ELEMENT_NODE) {
                removeEmptyTags(child); 
    
                const isEmpty =
                    child.childNodes.length === 0 ||
                    (child.childNodes.length === 1 &&
                     child.childNodes[0].nodeType === Node.TEXT_NODE &&
                     child.childNodes[0].textContent.trim() === "");
    
                if (isEmpty) {
                    child.remove();
                }
            }
        }
    }
    function processDeeplyNestedElements(node, wrapper) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
    
        for (let child of Array.from(node.children)) {
            if (child.tagName === wrapper.tagName && child.className === wrapper.className) {
                const plainText = child.textContent || child.innerText || '';
                const textNode = document.createTextNode(plainText);
                node.replaceChild(textNode, child);
            } else {
                processDeeplyNestedElements(child, wrapper);
            }
        }
    }

    function mergeAdjacentElements(element) {
        if (!element || !element.isConnected) return;

        let children = Array.from(element.childNodes);
    
        for (let i = 0; i < children.length - 1; i++) {
            let current = children[i];
            let next = children[i + 1];
    
            if (
                current.nodeType === Node.ELEMENT_NODE &&
                next.nodeType === Node.ELEMENT_NODE &&
                current.tagName === next.tagName &&
                next.previousSibling === current
            ) {
    
                while (next.firstChild) {
                    current.appendChild(next.firstChild);
                }
    
                element.removeChild(next);
    
                children = Array.from(element.childNodes);
                i--;
            }
        }
    
        element.normalize();
    
        for (const child of element.children) {
            mergeAdjacentElements(child);
        }
    }
    
    function unwrapSelection(range, parent) {
        if (!parent || !parent.parentNode) return;
    
        const fragment = document.createDocumentFragment();
    
        while (parent.firstChild) {
            fragment.appendChild(parent.firstChild);
        }
    
        const parentNode = parent.parentNode;
        parentNode.replaceChild(fragment, parent);
    
        if (parentNode && parentNode.isConnected) {
            parentNode.normalize();
        }
    }
    
    function toggleHeading(tag) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
    
        const range = selection.getRangeAt(0);
        let container = range.commonAncestorContainer;
    
        if (container.nodeType === Node.TEXT_NODE) {
            container = container.parentNode;
        }
    
        const block = findBlockParent(container);
    
        if (!block) return; 
    
        if (block.tagName.toLowerCase() === tag) {
            convertToParagraph(block); 
        } else {
            convertToHeading(block, tag); 
        }
    }

    function findBlockParent(node) {
        while (node && !isBlockElement(node)) {
            node = node.parentNode;
        }
        return node;
    }
    
    function isBlockElement(node) {
        const blockTags = ["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "LI", "BLOCKQUOTE"];
        return node.nodeType === Node.ELEMENT_NODE && blockTags.includes(node.tagName);
    }
    
    function convertToHeading(block, tag) {
        const heading = document.createElement(tag);
        heading.className = `editor-${tag}`;
        heading.contentEditable = true;
        heading.classList.add("text-block");
    
        while (block.firstChild) {
            heading.appendChild(block.firstChild);
        }
    
        block.replaceWith(heading);
    }
    
    function convertToParagraph(block) {
        const paragraph = document.createElement("p");
        paragraph.className = "editor-p";
        paragraph.contentEditable = true;
        paragraph.classList.add("text-block");
    
        while (block.firstChild) {
            paragraph.appendChild(block.firstChild);
        }
    
        block.replaceWith(paragraph);
    }

    function showPopup(button, type) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            savedRange = selection.getRangeAt(0); 
        }
    
        if (type === "link") {
            linkPopup.style.display = "flex";
    
            const rect = button.getBoundingClientRect();
            linkPopup.style.top = `${rect.top + window.scrollY}px`;
            linkPopup.style.left = `${rect.left + window.scrollX - 50}px`;
    
            linkPopup.innerHTML = `
                <input type="text" id="link-input" placeholder="Enter link URL">
                <div class="rel-buttons">
                    <button id="nofollow" class="rel-button" data-rel="nofollow">No Follow</button>
                    <button id="noopener" class="rel-button" data-rel="noopener">Noopener</button>
                    <button id="ugc" class="rel-button" data-rel="ugc">UGC</button>
                </div>
                <button id="link-submit">OK</button>
            `;
    
            const linkInput = linkPopup.querySelector("#link-input");
            const linkSubmit = linkPopup.querySelector("#link-submit");
            const relButtonsContainer = linkPopup.querySelector(".rel-buttons");
            const relAttributes = new Set();
    
            relButtonsContainer.addEventListener("click", (event) => {
                const relButton = event.target.closest(".rel-button");
                if (relButton) {
                    const rel = relButton.dataset.rel;
                    if (relAttributes.has(rel)) {
                        relAttributes.delete(rel); 
                        relButton.classList.remove("active");
                    } else {
                        relAttributes.add(rel); 
                        relButton.classList.add("active");
                    }
                }
            });
    
            linkSubmit.addEventListener("click", () => {
                const url = linkInput.value.trim();
                if (url) {
                    restoreSelection(); 
                    applyLinkAction(url, Array.from(relAttributes)); 
                }
                linkPopup.style.display = "none";
                updateToolbarState();
                window.getSelection().removeAllRanges();
            });
    
            return; 
        }
    
        popup.style.display = "flex";
        popup.innerHTML = "";
    
        const predefinedColors = [
            "#add8e6", // Pastel Blue
            "#d8bfdb", // Pastel Purple
            "#f08080", // Pastel Red
            "#98fb98", // Pastel Green
        ];
    
        predefinedColors.forEach(color => {
            const colorButton = document.createElement("button");
            colorButton.style.backgroundColor = color;
            colorButton.style.border = "none";
            colorButton.style.width = "30px";
            colorButton.style.height = "30px";
            colorButton.style.marginRight = "5px";
            colorButton.style.cursor = "pointer";
    
            colorButton.addEventListener("click", () => {
                restoreSelection(); 
                applyCustomAction(type, color); 
                popup.style.display = "none";
                updateToolbarState();
                window.getSelection().removeAllRanges(); 
            });
    
            popup.appendChild(colorButton);
        });
    
        const customInputDiv = document.createElement("div");
        popup.appendChild(customInputDiv);
    
        const inputLabel = document.createElement("label");
        inputLabel.htmlFor = "custom-color-input";
        customInputDiv.appendChild(inputLabel);
    
        const customColorInput = document.createElement("input");
        customColorInput.id = "custom-color-input";
        customColorInput.type = "text";
        customColorInput.placeholder = "Enter hex color code";
        customColorInput.style.border = "none"
        customColorInput.style.background = "none"
        customColorInput.style.backgroundColor = "black"
        customColorInput.style.color = "white"
        customInputDiv.appendChild(customColorInput);
    
        const okButton = document.createElement("button");
        okButton.textContent = "OK";
        okButton.style.margin = "0px 10px";
        okButton.style.border = "solid 1px white"
        okButton.style.borderRadius = "5px"
        okButton.style.background = "none"
        okButton.style.backgroundColor = "black"
        okButton.style.color = "white"
        okButton.addEventListener("click", () => {
            const value = customColorInput.value.trim();
            if (value) {
                restoreSelection();
                applyCustomAction(type, value); 
            }
            popup.style.display = "none";
            updateToolbarState();
            window.getSelection().removeAllRanges(); 
        });
    
        customInputDiv.appendChild(okButton);
    
        const rect = button.getBoundingClientRect();
        popup.style.top = `${rect.top + window.scrollY - 15}px`;
        popup.style.left = `${rect.left + window.scrollX - 200}px`;
    }

    function applyCustomAction(type, value) {
        restoreSelection();
    
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            return;
        }
    
        const range = selection.getRangeAt(0); 
        const wrapper = document.createElement(type === "color" ? "span" : "mark");
        wrapper.className = `editor-${type}`;
    
        const validatedColor = validateColor(value);
    
        if (type === "highlight") {
            wrapper.style.backgroundColor = validatedColor; 
        } else if (type === "color") {
            wrapper.style.color = validatedColor; 
        }
    
        const selectedNodes = range.cloneContents();
    
        const container = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
            ? range.commonAncestorContainer
            : range.commonAncestorContainer.parentNode;
    
        const fragment = document.createDocumentFragment();
        let child = selectedNodes.firstChild;
    
        while (child) {
            if (child.nodeType !== Node.ELEMENT_NODE || !child.children) {
                fragment.appendChild(child);
                child = selectedNodes.firstChild;
                continue;
            }
    
            processDeeplyNestedElements(child, wrapper);
    
            if (wrapper.className === child.className) {
                while (child.firstChild) {
                    fragment.appendChild(child.firstChild); 
                }
                selectedNodes.replaceChild(fragment, child); 
            } else {
                fragment.appendChild(child);
            }
    
            child = selectedNodes.firstChild;
        }
    
        wrapper.appendChild(fragment);
    
        range.deleteContents();
        range.insertNode(wrapper);
    
        if (wrapper.parentNode && wrapper.parentNode.isConnected) {
            wrapper.parentNode.normalize();
        }
        mergeAdjacentElements(container);
        removeEmptyTags(container);
    }

    function validateColor(color) {
        const tempElement = document.createElement("div");
        tempElement.style.color = "transparent"; 
        tempElement.style.color = color;
    
        return tempElement.style.color !== "transparent" ? color : "#000000";
    }


    function applyLinkAction(url, relAttributes = []) {
        restoreSelection(); 
    
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            return;
        }
    
        const range = selection.getRangeAt(0);
        const wrapper = document.createElement("a");
        wrapper.href = url;
        wrapper.className = "editor-a";
        wrapper.target = "_blank";
    
        // Add rel attributes
        if (relAttributes.length > 0) {
            wrapper.rel = relAttributes.join(" ");
        }
    
    
        const selectedNodes = range.cloneContents();
        const fragment = document.createDocumentFragment();
        let child = selectedNodes.firstChild;
    
        while (child) {
            if (child.nodeType !== Node.ELEMENT_NODE || !child.children) {
                fragment.appendChild(child);
                child = selectedNodes.firstChild;
                continue;
            }
    
            processDeeplyNestedElements(child, wrapper);
    
            if (wrapper.className === child.className) {
                while (child.firstChild) {
                    fragment.appendChild(child.firstChild); 
                }
                selectedNodes.replaceChild(fragment, child); 
            } else {
                fragment.appendChild(child);
            }
    
            child = selectedNodes.firstChild;
        }
    
        wrapper.appendChild(fragment);
    
        range.deleteContents();
        range.insertNode(wrapper);
    
    
        if (wrapper.parentNode && wrapper.parentNode.isConnected) {
            wrapper.parentNode.normalize();
        }
        mergeAdjacentElements(wrapper.parentNode);
        removeEmptyTags(wrapper.parentNode);
    }

    document.addEventListener("click", function (event) {
        if (!toolbar.contains(event.target) && !editor.contains(event.target)) {
            toolbar.style.display = "none";
        }
        if (!popup.contains(event.target) && !toolbar.contains(event.target)) {
            popup.style.display = "none";
        }
        if (!linkPopup.contains(event.target) && !toolbar.contains(event.target)) {
            linkPopup.style.display = "none";
        }
    });
});