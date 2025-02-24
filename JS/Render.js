document.addEventListener("DOMContentLoaded", function () {
    const slug = window.location.pathname.split('/').filter(Boolean).pop(); 
    const postContainer = document.getElementById("inline-editor-content");

    fetch(`{Path To Your Endpoint}`)
        .then(response => response.json())
        .then(data => {
            const posts = data.posts;
            renderPosts(posts);
        })
        .catch(error => {
            console.error("Error fetching posts:", error);
        });

    function applyStyles(element, styles) {
        const colorStyles = styles.filter(style => style.type === "color");
        const highlightStyles = styles.filter(style => style.type === "background-color");
    
        const colorSpans = element.querySelectorAll(".editor-color");
        const highlightSpans = element.querySelectorAll(".editor-highlight");
    
        colorStyles.forEach((style, index) => {
            if (colorSpans[index]) {
                colorSpans[index].style.color = style.value; 
            }
        });
    
        highlightStyles.forEach((style, index) => {
            if (highlightSpans[index]) {
                highlightSpans[index].style.backgroundColor = style.value; 
            }
        });
    
        const underlineElements = element.querySelectorAll(".editor-underline");
        underlineElements.forEach(u => {
            u.style.textDecoration = "underline";
        });
    
        const links = element.querySelectorAll(".editor-a");
        links.forEach(link => {
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noopener");
        });
    }


    function sanitizeContent(content) {
        return content.replace(/style="[^"]*"/g, '');
    }

    function extractStyles(content) {
        const stylesToPreserve = [];
        const colorRegex = /<span\s+class="editor-color"[^>]*style="[^"]*color:\s*(rgb\([^)]+\)|[^;"]+)[^"]*"[^>]*>/g;
        const highlightRegex = /<mark\s+class="editor-highlight"[^>]*style="[^"]*background-color:\s*(rgb\([^)]+\)|[^;"]+)[^"]*"[^>]*>/g;
    
        let match;
        while ((match = colorRegex.exec(content))) {
            stylesToPreserve.push({
                type: "color",
                value: match[1],
                index: stylesToPreserve.length 
            });
        }
    
        // Extract background-color styles
        while ((match = highlightRegex.exec(content))) {
            console.log("Matched background-color:", match[1]);
            stylesToPreserve.push({
                type: "background-color",
                value: match[1], 
                index: stylesToPreserve.length 
            });
        }
    
        console.log(stylesToPreserve);
        return stylesToPreserve;
    }

    function renderPosts(posts) {
        postContainer.innerHTML = "";
    
        posts.forEach(post => {
            const postElement = document.createElement("div");
            postElement.classList.add("inline-editor-post");
    
            const title = document.createElement("h2");
            title.classList.add("editor-h2");
            title.textContent = post.title;
            postElement.appendChild(title);
    

            post.content.forEach(block => {
                if (block.type === "text") {
                    const textBlock = document.createElement("p");
                    textBlock.classList.add("editor-p");

                    const styles = extractStyles(block.content);
                    const sanitizedContent = sanitizeContent(block.content);
                    textBlock.innerHTML = sanitizedContent;

                    applyStyles(textBlock, styles);
                    postElement.appendChild(textBlock);
                } else if (block.type === "image") {
                    const imageBlock = document.createElement("div");
                    imageBlock.classList.add("editor-div");
                    const image = document.createElement("img");
                    image.classList.add("editor-img");
                    const mediaItem = post.media.find(media => media.id === block.id);
    
                    if (mediaItem) {
                        image.src = mediaItem.url; 
                        image.alt = mediaItem.alt_text || "Image";
                    } else {
                        console.error("Media item not found for block ID:", block.id);
                    }
    
                    imageBlock.appendChild(image);
                    postElement.appendChild(imageBlock);
                } else if (block.type === "code") {
                    const codeBlock = document.createElement("pre");
                    codeBlock.classList.add("editor-pre");
                    const code = document.createElement("code");
                    code.classList.add("editor-code");
                    code.textContent = block.content;
                    code.classList.add(block.language); 
                    codeBlock.appendChild(code);
                    postElement.appendChild(codeBlock);
                    HighlightCodeBlock(code)
                    AddCopyToCodeBlock(codeBlock)
                }
            });
    
            postContainer.appendChild(postElement);
        });
    }

    function HighlightCodeBlock(codeElement) {
        console.log(codeElement); 
    
        const languageCommentPatterns = {
            "language-python": /#.*/g,
            "language-javascript": /\/\/.*|\/\*[\s\S]*?\*\//g,
            "language-java": /\/\/.*|\/\*[\s\S]*?\*\//g,
            "language-c": /\/\/.*|\/\*[\s\S]*?\*\//g,
            "language-cpp": /\/\/.*|\/\*[\s\S]*?\*\//g,
            "language-php": /\/\/.*|\/\*[\s\S]*?\*\//g,
            "language-css": /\/\*[\s\S]*?\*\//g,
            "language-sql": /--.*|\/\*[\s\S]*?\*\//g,
            "language-ini": /;.*/g,
            "language-bash": /#.*/g,
            "language-vbscript": /'.*/g,
            "language-html": /<!--[\s\S]*?-->/g,
            "language-xml": /<!--[\s\S]*?-->/g,
            "unknown": /#.*/g 
        };
    
        const commonTokenPatterns = [
            { type: "string", regex: /(["'`])(?:\\.|(?!\1).)*?\1/g },
            { type: "number", regex: /\b\d+(\.\d+)?\b/g }
        ];
    
        const languageKeywords = {
            "language-python": /\b(def|return|if|else|class|import|from|print|for|while|in|as|try|except|finally|raise|with|yield|async|await)\b/g,
            "language-javascript": /\b(function|return|if|else|class|import|export|console|for|while|in|of|async|await|try|catch|finally|new|let|const|var)\b/g,
            "language-java": /\b(public|private|protected|class|static|void|int|double|return|new|if|else|try|catch|finally|import|package)\b/g,
            "language-c": /\b(int|void|return|if|else|switch|case|break|continue|for|while|do|struct|typedef|include|define)\b/g,
            "language-cpp": /\b(int|void|return|if|else|switch|case|break|continue|for|while|do|class|public|private|protected|namespace|include|define|new|delete)\b/g,
            "language-php": /\b(function|return|if|else|class|public|private|protected|new|echo|foreach|switch|case|try|catch|finally|include|require)\b/g,
            "language-sql": /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE|JOIN|GROUP|ORDER|HAVING|DISTINCT|LIMIT|OFFSET|INDEX|PRIMARY|FOREIGN|KEY)\b/g,
            "language-html": /\b(html|head|body|div|span|class|id|title|meta|script|style|link|table|tr|td|ul|li|a|href|img|alt|src|form|input|button|label|name|type|value|action|method)\b/g,
            "language-css": /\b(color|background|font|padding|margin|border|display|flex|grid|align|justify|position|absolute|relative|fixed|static|float|clear|content|width|height|max-width|min-width)\b/g,
            "language-bash": /\b(echo|if|then|else|fi|for|while|do|done|case|esac|function|export|unset|alias|trap|read|exec|shift|break|continue)\b/g,
            "language-ini": /\b(section|true|false|null)\b/g,
            "language-vbscript": /\b(Function|Sub|If|Then|Else|End|Dim|Set|For|Each|While|Do|Loop|Next|Call|Exit|Select|Case|Wend)\b/g,
            "unknown": /\b(return|if|else|class|import|function)\b/g 
        };
    
        const tokenClasses = {
            comment: "editor-code-comment",
            string: "editor-code-string",
            keyword: "editor-code-keyword",
            number: "editor-code-number"
        };
    
        function escapeHTML(html) {
            return html
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        }
    
        function applySyntaxHighlighting(codeElement) {
            let code = codeElement.textContent;
            code = escapeHTML(code);
          
            const languageClass = [...codeElement.classList].find(cls => cls.startsWith("language-")) || "unknown";
          
            const commentRegex = languageCommentPatterns[languageClass] || languageCommentPatterns["unknown"];
            const keywordRegex = languageKeywords[languageClass] || languageKeywords["unknown"];
          
            let comments = [];
            code = code.replace(commentRegex, (match) => {
              comments.push(match);
              return `%%%COMMENT${comments.length - 1}%%%`; 
            });
          
            let strings = [];
            let numbers = [];
            
            code = code.replace(commonTokenPatterns[0].regex, (match) => {
              strings.push(match);
              return `%%%STRING${strings.length - 1}%%%`;
            });
            
            code = code.replace(commonTokenPatterns[1].regex, (match) => {
              numbers.push(match);
              return `%%%NUMBER${numbers.length - 1}%%%`;
            });
          
            code = code.replace(keywordRegex, (match) => {
              return `<span class="${tokenClasses.keyword}">${match}</span>`;
            });
          
            code = code.replace(/%%%COMMENT(\d+)%%%/g, (_, index) => {
              return `<span class="${tokenClasses.comment}">${escapeHTML(comments[index])}</span>`;
            });
          
            code = code.replace(/%%%STRING(\d+)%%%/g, (_, index) => {
              return `<span class="${tokenClasses.string}">${escapeHTML(strings[index])}</span>`;
            });
          
            code = code.replace(/%%%NUMBER(\d+)%%%/g, (_, index) => {
              return `<span class="${tokenClasses.number}">${escapeHTML(numbers[index])}</span>`;
            });
          
            codeElement.innerHTML = code;
            codeElement.style.whiteSpace = "pre-wrap"; 
            codeElement.style.overflowWrap = "break-word"; 
          }
          
        applySyntaxHighlighting(codeElement);
    
    }
    


    function AddCopyToCodeBlock(codeBlock) {
        let code = codeBlock.querySelector("code");
        let languageClass = code.className.match(/language-(\w+)/);
        let language = languageClass ? languageClass[1].toUpperCase() : "Unknown";
    
        let actionContainer = document.createElement("div");
        actionContainer.style.position = "absolute";
        actionContainer.style.top = "5px";
        actionContainer.style.right = "5px"; 
        actionContainer.style.display = "flex";
        actionContainer.style.flexDirection = "row";
        actionContainer.style.justifyContent = "flex-end";
        actionContainer.style.alignItems = "center";
        actionContainer.style.gap = "8px";
        actionContainer.style.zIndex = "10";
    
        if (language !== "Unknown") {
            let langLabel = document.createElement("span");
            langLabel.innerText = language;
            langLabel.style.color = "var(--textblack)";
            langLabel.style.fontSize = "14px";
            langLabel.style.borderRadius = "3px";
            actionContainer.appendChild(langLabel);
        }
    
        let copyButton = document.createElement("button");
        copyButton.innerText = "Copy";
        copyButton.style.padding = "5px 15px";
        copyButton.style.fontSize = "12px";
        copyButton.style.cursor = "pointer";
        copyButton.style.border = "none";
        copyButton.style.borderRadius = "3px";
        copyButton.style.background = "var(--persianblue)";
        copyButton.style.color = "var(--white)";
    
        copyButton.addEventListener("click", () => {
            let codeText = code.innerText;
            navigator.clipboard.writeText(codeText).then(() => {
                copyButton.innerText = "Copied!";
                setTimeout(() => {
                    copyButton.innerText = "Copy";
                }, 1500);
            }).catch(err => {
                console.error("Failed to copy: ", err);
            });
        });
    
        actionContainer.appendChild(copyButton);
    
        codeBlock.style.position = "relative";
        codeBlock.style.paddingTop = "35px";
    

        codeBlock.appendChild(actionContainer);
    }


});
