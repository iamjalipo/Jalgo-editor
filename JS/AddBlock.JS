document.addEventListener("DOMContentLoaded", function () {
    const editor = document.getElementById("editor");
    const saveBtn = document.getElementById("saveBtn");

    const trashcanIconURL = document.getElementById("static-paths").dataset.trashcan;

    function getCSRFToken() {
        return document.cookie.split('; ')
            .find(row => row.startsWith('csrftoken='))?.split('=')[1];
    }

    editor.addEventListener("click", function (event) {
        if (event.target.classList.contains("add-btn")) {
            showBlockOptions(event.target);
        }
    });

    function showBlockOptions(button) {
        document.querySelectorAll(".block-menu").forEach(menu => menu.remove());

        const menu = document.createElement("div");
        menu.classList.add("block-menu");

        const blockTypes = ["text", "image" , "code"];
        blockTypes.forEach(type => {
            const btn = document.createElement("button");
            btn.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            btn.dataset.type = type;
            menu.appendChild(btn);
        });

        menu.style.position = "absolute";
        menu.style.top = `${button.offsetTop}px`;
        menu.style.left = `${button.offsetLeft + button.offsetWidth - 200}px`; 
        menu.style.opacity = "0";  
        menu.style.transform = "translateX(20px)";  
        menu.style.transition = "opacity 0.9s, transform 0.9s"; 

        document.body.appendChild(menu);

        setTimeout(() => {
            menu.style.opacity = "1";
            menu.style.transform = "translateX(0)"; 
        }, 10);

        menu.addEventListener("click", function (event) {
            if (event.target.tagName === "BUTTON") {
                addBlock(event.target.dataset.type, button);
                menu.remove();
            }
        });

        document.addEventListener("click", function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== button) {
                menu.remove();
                document.removeEventListener("click", closeMenu);
            }
        });
    }

    function addBlock(type, button) {
        const block = document.createElement("div");
        block.classList.add("block");
    
        if (type === "text") {
            block.innerHTML = `<p contenteditable="true" class="text-block" data-placeholder="NewText"></p>`;
        } else if (type === "image") {
            const imageInput = document.createElement("input");
            imageInput.type = "file";
            imageInput.accept = "image/*";
            imageInput.classList.add("image-input");
    
            const imagePreview = document.createElement("img");
            imagePreview.classList.add("image-preview", "hidden");
    
            const deleteButton = document.createElement("img");
            deleteButton.src = trashcanIconURL;
            deleteButton.classList.add("trashcan-editor-post");
            deleteButton.style.cursor = "pointer";
            deleteButton.style.display = "none";
    
            const altTextInput = document.createElement("input");
            altTextInput.type = "text";
            altTextInput.classList.add("alt-text-input");
            altTextInput.placeholder = "ALT TEXT...";
            altTextInput.style.display = "none";
    
            const parentDiv = document.createElement("div");
            parentDiv.style.display = "flex";
            parentDiv.style.flexDirection = "row"; 
            parentDiv.style.alignItems = "center";
    
            parentDiv.appendChild(altTextInput);
            parentDiv.appendChild(deleteButton);
    
            block.appendChild(imageInput);
            block.appendChild(imagePreview);
            block.appendChild(parentDiv);
    
            imageInput.addEventListener("change", function () {
                const file = imageInput.files[0];
    
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (event) {
                        imagePreview.src = event.target.result;
                        imagePreview.classList.remove("hidden");
                        imagePreview.classList.add("visible");
                        deleteButton.style.display = "block"; 
                        altTextInput.style.display = "block"; 
                    };
                    reader.readAsDataURL(file);
                }
            });
    
            editor.appendChild(block);
            imageInput.click();
        } else if (type === "code") {
            const codeContainer = document.createElement("div");
            codeContainer.classList.add("code-container");
    
            const codeTextarea = document.createElement("textarea");
            codeTextarea.classList.add("code-block");
            codeTextarea.placeholder = "Insert Your Code Here...";
    
            const languageSelect = document.createElement("select");
            languageSelect.classList.add("language-select");
    
            const languages = {
                "language-python": "Python",
                "language-javascript": "JavaScript",
                "language-java": "Java",
                "language-c": "C",
                "language-cpp": "C++",
                "language-php": "PHP",
                "language-css": "CSS",
                "language-sql": "SQL",
                "language-ini": "INI",
                "language-bash": "Bash",
                "language-vbscript": "VBScript",
                "language-html": "HTML",
                "language-xml": "XML",
                "unknown": "Unknown"
            };
    
            for (const [value, text] of Object.entries(languages)) {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = text;
                languageSelect.appendChild(option);
            }
    
            const languageWrapper = document.createElement("div");
            languageWrapper.classList.add("language-wrapper");
            languageWrapper.appendChild(languageSelect);
    
            const deleteButton = document.createElement("img");
            deleteButton.src = trashcanIconURL;
            deleteButton.classList.add("trashcan-editor-post");
            deleteButton.style.cursor = "pointer";
            deleteButton.style.position = "absolute";
            deleteButton.style.bottom = "20px"; 
            deleteButton.style.right = "10px"; 
            deleteButton.style.zIndex = "1";
    
            codeContainer.appendChild(languageWrapper);
            codeContainer.appendChild(codeTextarea);
            codeContainer.appendChild(deleteButton);
    
            block.appendChild(codeContainer);
        }
    
        editor.appendChild(block);
        updateAddButton();
    }
    


    editor.addEventListener("keydown", function (event) {
        if (event.key === "Backspace") {
            const activeBlock = event.target.closest(".block");

            if (activeBlock) {
                const isTextBlock = event.target.classList.contains("text-block");
                const isImageBlock = event.target.classList.contains("image-preview");

                if (isTextBlock && event.target.innerText === "") {
                    event.preventDefault();
                    removeBlock(activeBlock);
                } else if (isImageBlock) {
                    event.preventDefault();
                    removeBlock(activeBlock);
                }
            }
        }
    });

    function removeBlock(block) {
        block.remove();
        updateAddButton();

        const prevBlock = block.previousElementSibling;
        if (prevBlock) {
            const prevText = prevBlock.querySelector(".text-block");
            if (prevText) {
                prevText.focus();
            }
        }

        updateAddButton();
    }


    editor.addEventListener("click", function (event) {
        if (event.target.classList.contains("trashcan-editor-post")) { 
            const block = event.target.closest(".block"); 
            if (block) {
                block.remove(); 
                updateAddButton(); 
            }
        }
    });

    saveBtn.addEventListener("click", function () {
        const title = document.getElementById("title").value;
        const blocks = [];
        const formData = new FormData();

        document.querySelectorAll(".block").forEach((block) => {
            const textBlock = block.querySelector(".text-block");
            const imageInput = block.querySelector(".image-input");
            const altTextInput = block.querySelector(".alt-text-input");
            const codeTextarea = block.querySelector(".code-block");
            const languageSelect = block.querySelector(".language-select");
    
            if (textBlock && textBlock.innerHTML.trim() !== "") {
                blocks.push({
                    type: "text",
                    content: textBlock.innerHTML,
                });
            }
    
            if (imageInput && imageInput.files.length > 0) {
                const file = imageInput.files[0];
                const altText = altTextInput ? altTextInput.value.trim() : "";
                formData.append("files", file);  
                formData.append("alts", altText); 
                blocks.push({ type: "image" });
            }
    
            if (codeTextarea && codeTextarea.value.trim() !== "") {
                const language = languageSelect ? languageSelect.value : "unknown";
                blocks.push({
                    type: "code",
                    content: codeTextarea.value,
                    language: language,
                });
            }
        });
    
        const hasTextBlock = blocks.some(block => block.type === "text" && block.content.trim() !== "");
        if (!hasTextBlock) {
            alert("❌ You must add at least one text block!");
            return;
        }
    
        // Append title and blocks (as JSON)
        formData.append("title", title);
        formData.append("content", JSON.stringify(blocks));
    
        // Send the FormData to the server via axios
        axios.post("/{Path To Your Endpoint}/", formData, {
            headers: {
                "X-CSRFToken": getCSRFToken(),
                "Content-Type": "multipart/form-data"
            }
        })
        .then(response => {
            alert("✅ Post saved successfully!");
        })
        .catch(error => {
            console.error("❌ Error saving post:", error.response?.data || error.message);
        });
    });
    
    function updateAddButton() {
        document.querySelectorAll(".add-btn").forEach(btn => btn.remove());
        document.querySelectorAll(".block-button").forEach(btn => btn.remove());

        const blockButtonDiv = document.createElement("div");
        blockButtonDiv.classList.add("block-button");

        const addButton = document.createElement("button");
        addButton.classList.add("add-btn");
        addButton.textContent = "+";

        blockButtonDiv.appendChild(addButton);

        editor.appendChild(addButton);
    }

});