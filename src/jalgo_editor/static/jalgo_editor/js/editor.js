class JalgoEditor {
    constructor(wrapper) {
        this.wrapper = wrapper;
        this.container = wrapper.querySelector('.jalgo-editor-container');
        this.canvas = wrapper.querySelector('.jalgo-editor-canvas');
        
        const targetId = this.container.getAttribute('data-target-id');
        this.hiddenInput = document.getElementById(targetId);

        if (!this.hiddenInput || !this.canvas) return;

        this.init();
    }

    init() {
        // Build Toolbar & Code View DOM
        this.buildToolbarAndCodeView();
        
        // Build SEO Panel
        this.buildSeoPanel();

        // Enforce basic block formatting (p tag default)
        document.execCommand('defaultParagraphSeparator', false, 'p');

        // If canvas is completely empty, initialize it with a paragraph
        if (this.canvas.innerHTML.trim() === '') {
            this.canvas.innerHTML = '<p><br></p>';
        }

        // Event Listeners
        this.canvas.addEventListener('input', () => this.syncAndAnalyze());
        this.canvas.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Bubble Menu Initialization
        this.createBubbleMenu();
        this.createSlashMenu();
        
        document.addEventListener('selectionchange', () => this.handleSelection());
        document.addEventListener('mousedown', (e) => {
            if (this.bubbleMenu && !this.bubbleMenu.contains(e.target) && !this.canvas.contains(e.target)) {
                this.hideBubbleMenu();
            }
            if (this.slashMenu && !this.slashMenu.contains(e.target)) {
                this.hideSlashMenu();
            }
        });
        
        // Handle Paste intercepting
        this.canvas.addEventListener('paste', (e) => this.handlePaste(e));
        
        // Handle Drag & Drop for Premium CDN Integration
        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.container.classList.add('drag-over');
        });
        this.container.addEventListener('dragleave', () => this.container.classList.remove('drag-over'));
        this.container.addEventListener('drop', (e) => this.handleDrop(e));

        // Add keyboard listener for slash menu
        this.canvas.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Initial analysis
        this.syncAndAnalyze();
    }

    buildSeoPanel() {
        this.seoPanel = document.createElement('div');
        this.seoPanel.className = 'jalgo-seo-panel';
        
        this.seoStats = document.createElement('div');
        this.seoStats.className = 'jalgo-seo-stats';
        
        this.seoWarnings = document.createElement('div');
        this.seoWarnings.className = 'jalgo-seo-warnings';

        this.seoPanel.appendChild(this.seoStats);
        this.seoPanel.appendChild(this.seoWarnings);
        this.wrapper.appendChild(this.seoPanel);
    }

    buildToolbarAndCodeView() {
        // Toolbar
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'jalgo-editor-toolbar';
        
        // Theme Selector
        this.themeSelect = document.createElement('select');
        this.themeSelect.className = 'jalgo-editor-theme-select';
        this.themeSelect.innerHTML = `
            <option value="default">Default Theme</option>
            <option value="retro">Retro</option>
            <option value="8bit">8-Bit</option>
        `;
        this.themeSelect.addEventListener('change', (e) => {
            this.container.setAttribute('data-jalgo-theme', e.target.value);
        });
        this.toolbar.appendChild(this.themeSelect);

        this.toggleBtn = document.createElement('button');
        this.toggleBtn.type = 'button';
        this.toggleBtn.textContent = '</> Code View';
        this.toolbar.appendChild(this.toggleBtn);
        this.container.insertBefore(this.toolbar, this.canvas);

        // Code Wrapper (Dual-layer textarea + pre)
        this.codeWrapper = document.createElement('div');
        this.codeWrapper.className = 'jalgo-code-wrapper';
        
        this.codeTextarea = document.createElement('textarea');
        this.codeTextarea.className = 'jalgo-code-textarea';
        this.codeTextarea.spellcheck = false;
        
        this.codeHighlight = document.createElement('pre');
        this.codeHighlight.className = 'jalgo-code-highlight';

        this.codeWrapper.appendChild(this.codeHighlight);
        this.codeWrapper.appendChild(this.codeTextarea);
        this.container.insertBefore(this.codeWrapper, this.canvas.nextSibling);

        // Toggle Logic
        this.isCodeView = false;
        this.toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleCodeView();
        });

        // Sync Code View -> Visual
        this.codeTextarea.addEventListener('input', () => {
            this.updateSyntaxHighlighting();
            this.canvas.innerHTML = this.sanitizeFrontend(this.codeTextarea.value);
            this.syncAndAnalyze();
        });
    }

    toggleCodeView() {
        this.isCodeView = !this.isCodeView;
        if (this.isCodeView) {
            this.canvas.classList.add('hidden');
            this.codeWrapper.classList.add('active');
            this.toggleBtn.textContent = 'Visual View';
            // Format HTML for better editing
            this.codeTextarea.value = this.canvas.innerHTML.replace(/></g, '>\n<');
            this.updateSyntaxHighlighting();
        } else {
            this.canvas.classList.remove('hidden');
            this.codeWrapper.classList.remove('active');
            this.toggleBtn.textContent = '</> Code View';
            // Clean up missing blocks
            if (this.canvas.innerHTML.trim() === '') this.canvas.innerHTML = '<p><br></p>';
            this.syncAndAnalyze();
        }
    }

    updateSyntaxHighlighting() {
        let text = this.codeTextarea.value;
        // Simple HTML syntax highlighting regex
        // Escape standard HTML first so it renders in <pre>
        let safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Highlight Tags: &lt;tagname and &lt;/tagname&gt;
        safeText = safeText.replace(/(&lt;\/?[a-z0-9]+)(.*?)(&gt;)/gi, (match, p1, p2, p3) => {
            // Process attributes inside tags
            let attrs = p2.replace(/([a-z-]+)=(&quot;.*?&quot;|&#39;.*?&#39;|".*?"|'.*?')/gi, 
                '<span class="token-attr">$1</span>=<span class="token-string">$2</span>');
            return `<span class="token-tag">${p1}</span>${attrs}<span class="token-tag">${p3}</span>`;
        });

        this.codeHighlight.innerHTML = safeText;
    }

    sanitizeFrontend(html) {
        if (!html) return '';
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const allowedTags = [
            "p", "strong", "em", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6",
            "ul", "ol", "li", "pre", "code", "a", "img", "br", "hr", "b", "i", "span"
        ];
        const allowedAttrs = ["dir", "href", "src", "alt", "title"];
        
        const sanitizeNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.cloneNode(true);
            }
            if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
                if (tagName === 'br') return document.createElement('br');
                if (tagName === 'hr') return document.createElement('hr');
                
                if (!allowedTags.includes(tagName)) {
                    if (['script', 'style', 'iframe', 'object', 'embed', 'noscript'].includes(tagName)) {
                        return null;
                    }
                    const frag = document.createDocumentFragment();
                    node.childNodes.forEach(child => {
                        const cleanChild = sanitizeNode(child);
                        if (cleanChild) frag.appendChild(cleanChild);
                    });
                    return frag;
                }
                
                const newEl = document.createElement(tagName);
                Array.from(node.attributes).forEach(attr => {
                    const name = attr.name.toLowerCase();
                    if (allowedAttrs.includes(name)) {
                        let val = attr.value;
                        if (name === 'href' || name === 'src') {
                            const cleanVal = val.replace(/[\s\x00-\x1F\x7F-\x9F]/g, '');
                            const lowerVal = cleanVal.toLowerCase();
                            
                            if (lowerVal.startsWith('javascript:') || lowerVal.startsWith('vbscript:')) {
                                return;
                            }
                            if (lowerVal.startsWith('data:')) {
                                if (name !== 'src' || !lowerVal.startsWith('data:image/')) {
                                    return;
                                }
                            }
                        }
                        newEl.setAttribute(name, val);
                    }
                });
                
                node.childNodes.forEach(child => {
                    const cleanChild = sanitizeNode(child);
                    if (cleanChild) newEl.appendChild(cleanChild);
                });
                return newEl;
            }
            return null;
        };
        
        const fragment = document.createDocumentFragment();
        doc.body.childNodes.forEach(child => {
            const cleanChild = sanitizeNode(child);
            if (cleanChild) fragment.appendChild(cleanChild);
        });
        
        const temp = document.createElement('div');
        temp.appendChild(fragment);
        return temp.innerHTML;
    }

    handlePaste(e) {
        e.preventDefault();
        const textHTML = e.clipboardData.getData('text/html');
        const textPlain = e.clipboardData.getData('text/plain');

        if (textHTML) {
            const cleanHTML = this.sanitizeFrontend(textHTML);
            document.execCommand('insertHTML', false, cleanHTML);
        } else if (textPlain) {
            document.execCommand('insertText', false, textPlain);
        }
        this.syncAndAnalyze();
    }

    handleDrop(e) {
        e.preventDefault();
        this.container.classList.remove('drag-over');
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64Src = event.target.result;
                    const img = document.createElement('img');
                    img.src = base64Src;
                    img.alt = file.name;
                    this.insertNodeAtCursor(img);
                    this.syncAndAnalyze();
                };
                reader.readAsDataURL(file);
            }
        }
    }

    insertNodeAtCursor(node) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(node);
            range.setStartAfter(node);
            range.setEndAfter(node);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            this.canvas.appendChild(node);
        }
    }

    syncAndAnalyze() {
        // 1. Sync content to hidden textarea
        this.sync();

        // 2. Perform Bidi directional analysis on current blocks
        this.analyzeDirection();
        
        // 3. Highlight Code Blocks in Visual Mode
        this.highlightCodeBlocks();
        
        // 4. Update SEO Stats & Outline Validator
        this.updateSeoStats();
    }

    highlightCodeBlocks() {
        const preBlocks = this.canvas.querySelectorAll('pre');
        preBlocks.forEach(pre => {
            // Only process text nodes inside pre, skip already highlighted
            if (pre.querySelector('.jalgo-token-keyword')) return; 

            let text = pre.textContent;
            
            // Basic regex syntax highlighting for python/js
            let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

            // Keywords
            const keywords = ['def ', 'class ', 'return ', 'import ', 'from ', 'function ', 'const ', 'let ', 'var ', 'if ', 'else ', 'for ', 'while '];
            keywords.forEach(kw => {
                const regex = new RegExp(`\\b(${kw.trim()})\\b `, 'g');
                html = html.replace(regex, '<span class="jalgo-token-keyword">$1</span> ');
            });

            // Strings (single and double quotes)
            html = html.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|".*?"|'.*?')/g, '<span class="jalgo-token-string">$1</span>');

            // Numbers
            html = html.replace(/\b(\d+)\b/g, '<span class="jalgo-token-number">$1</span>');

            // Comments (Python # or JS //)
            html = html.replace(/(#.*|\/\/.*)$/gm, '<span class="jalgo-token-comment">$1</span>');

            // Only update if it changed
            if (pre.innerHTML !== html) {
                pre.innerHTML = html;
                // Place cursor at end of pre to avoid annoying cursor jumping
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(pre);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });
    }

    updateSeoStats() {
        if (!this.seoStats) return;

        const text = this.canvas.textContent || '';
        const charCount = text.length;
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;
        
        // Assume avg reading speed is 225 words per minute
        const readingTimeMins = Math.max(1, Math.ceil(wordCount / 225));

        this.seoStats.innerHTML = `
            <div class="jalgo-seo-stat">Words: <strong>${wordCount}</strong></div>
            <div class="jalgo-seo-stat">Chars: <strong>${charCount}</strong></div>
            <div class="jalgo-seo-stat">Read time: <strong>~${readingTimeMins} min</strong></div>
        `;

        this.validateOutline();
    }

    validateOutline() {
        const headings = this.canvas.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let warningMessage = '';
        let lastLevel = 1; // Assume document starts effectively at H1 boundary

        for (let i = 0; i < headings.length; i++) {
            const level = parseInt(headings[i].tagName.substring(1));
            if (level > lastLevel + 1) {
                warningMessage = `⚠️ SEO Outline Warning: Skipped from H${lastLevel} to H${level}`;
                break;
            }
            lastLevel = level;
        }

        this.seoWarnings.textContent = warningMessage;
    }

    sync() {
        // Strip trailing <br> if it's the only thing in a p tag before syncing, optional optimization
        let content = this.canvas.innerHTML;
        if (content === '<p><br></p>') {
            content = '';
        }
        this.hiddenInput.value = content;
    }

    handleKeyUp(e) {
        // Analyze direction when typing space, enter, or character
        if (e.key === 'Enter') {
            this.analyzeDirection();
        }
        
        // Handle slash menu popups
        this.handleSlashInput(e);
    }

    analyzeDirection() {
        // Find all top-level block nodes inside canvas
        const blocks = this.canvas.querySelectorAll('p, h2, h3, blockquote, li');
        
        blocks.forEach(block => {
            const text = block.textContent.trim();
            if (text.length === 0) return;

            // Regex checking for Persian, Arabic, Hebrew, etc.
            // Ranges: \u0590-\u05FF (Hebrew), \u0600-\u06FF (Arabic/Persian), \u0750-\u077F, \u08A0-\u08FF, \uFB50-\uFDFF, \uFE70-\uFEFF
            const rtlRegex = /^[^a-zA-Z]*[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
            const hasRTL = rtlRegex.test(text);

            if (hasRTL) {
                if (block.getAttribute('dir') !== 'rtl') {
                    block.setAttribute('dir', 'rtl');
                }
            } else {
                // If it starts with English/Numbers, default to ltr
                const ltrRegex = /^[^a-zA-Z]*[a-zA-Z]/;
                if (ltrRegex.test(text)) {
                    if (block.getAttribute('dir') !== 'ltr') {
                        block.setAttribute('dir', 'ltr');
                    }
                } else if (!block.hasAttribute('dir')) {
                    // For blocks that are only numbers/symbols, inherit or set auto
                    block.setAttribute('dir', 'auto');
                }
            }
        });
    }

    createBubbleMenu() {
        this.bubbleMenu = document.createElement('div');
        this.bubbleMenu.className = 'jalgo-bubble-menu';
        
        const tools = [
            { label: 'B', command: 'bold' },
            { label: 'I', command: 'italic' },
            { label: 'Link', command: 'createLink' },
            { label: '✨ AI', command: 'ai', className: 'premium' }
        ];

        tools.forEach(tool => {
            const btn = document.createElement('button');
            btn.className = `jalgo-menu-btn ${tool.className || ''}`;
            btn.type = 'button';
            btn.textContent = tool.label;
            
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Prevent losing selection
                this.executeCommand(tool.command);
            });
            
            this.bubbleMenu.appendChild(btn);
        });

        document.body.appendChild(this.bubbleMenu);
    }

    handleSelection() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            this.hideBubbleMenu();
            return;
        }

        // Only show if selection is inside our canvas
        if (!this.canvas.contains(selection.anchorNode)) {
            this.hideBubbleMenu();
            return;
        }

        const text = selection.toString().trim();
        if (text.length === 0) {
            this.hideBubbleMenu();
            return;
        }

        this.showBubbleMenu(selection.getRangeAt(0));
    }

    showBubbleMenu(range) {
        const rect = range.getBoundingClientRect();
        
        this.bubbleMenu.classList.add('active');
        
        // Position menu above the selection
        const menuWidth = this.bubbleMenu.offsetWidth || 150;
        const menuHeight = this.bubbleMenu.offsetHeight || 40;
        
        // Account for scrolling
        const top = rect.top + window.scrollY - menuHeight - 10;
        const left = rect.left + window.scrollX + (rect.width / 2) - (menuWidth / 2);

        this.bubbleMenu.style.top = `${Math.max(10, top)}px`;
        this.bubbleMenu.style.left = `${Math.max(10, left)}px`;
    }

    hideBubbleMenu() {
        if (this.bubbleMenu) {
            this.bubbleMenu.classList.remove('active');
        }
    }

    executeCommand(command) {
        if (command === 'createLink') {
            const url = prompt('Enter link URL:');
            if (url) {
                document.execCommand(command, false, url);
            }
        } else if (command === 'ai') {
            alert('AI Assistant is a premium feature. Please configure JALGO_AI_LICENSE_KEY to unlock smart completions and translations.');
        } else {
            document.execCommand(command, false, null);
        }
        
        this.syncAndAnalyze();
    }

    /* --- Slash Menu Logic --- */
    createSlashMenu() {
        this.slashMenu = document.createElement('div');
        this.slashMenu.className = 'jalgo-slash-menu';
        
        const commands = [
            { id: 'h2', title: 'Heading 1', desc: 'Big section heading', tag: 'H2' },
            { id: 'h3', title: 'Heading 2', desc: 'Medium section heading', tag: 'H3' },
            { id: 'blockquote', title: 'Quote', desc: 'Capture a quote', tag: 'BLOCKQUOTE' },
            { id: 'pre', title: 'Code Block', desc: 'Add formatted code', tag: 'PRE' }
        ];

        commands.forEach(cmd => {
            const btn = document.createElement('button');
            btn.className = 'jalgo-slash-menu-item';
            btn.type = 'button';
            btn.innerHTML = `<strong>${cmd.title}</strong><small>${cmd.desc}</small>`;
            
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.executeSlashCommand(cmd.tag);
            });
            
            this.slashMenu.appendChild(btn);
        });

        document.body.appendChild(this.slashMenu);
    }

    handleSlashInput(e) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        
        const node = selection.anchorNode;
        if (!this.canvas.contains(node)) return;

        // Check if the current block text is strictly "/"
        const block = this.getParentBlock(node);
        if (block && block.textContent.trim() === '/') {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            this.showSlashMenu(rect);
        } else {
            this.hideSlashMenu();
        }
    }

    getParentBlock(node) {
        while (node && node !== this.canvas) {
            if (node.nodeType === 1 && ['P', 'H2', 'H3', 'BLOCKQUOTE', 'PRE', 'DIV', 'LI'].includes(node.tagName)) {
                return node;
            }
            node = node.parentNode;
        }
        return null;
    }

    handleKeyDown(e) {
        if (this.slashMenu && this.slashMenu.classList.contains('active')) {
            const items = this.slashMenu.querySelectorAll('.jalgo-slash-menu-item');
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.slashMenuSelectedIndex = (this.slashMenuSelectedIndex + 1) % items.length;
                this.updateSlashMenuSelection();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.slashMenuSelectedIndex = (this.slashMenuSelectedIndex - 1 + items.length) % items.length;
                this.updateSlashMenuSelection();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selectedBtn = items[this.slashMenuSelectedIndex];
                if (selectedBtn) {
                    selectedBtn.dispatchEvent(new MouseEvent('mousedown'));
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.hideSlashMenu();
            }
        }
    }

    updateSlashMenuSelection() {
        const items = this.slashMenu.querySelectorAll('.jalgo-slash-menu-item');
        items.forEach((item, index) => {
            if (index === this.slashMenuSelectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    showSlashMenu(rect) {
        this.slashMenu.classList.add('active');
        this.slashMenuSelectedIndex = 0;
        this.updateSlashMenuSelection();
        const top = rect.top + window.scrollY + 25; // slightly below the slash
        const left = rect.left + window.scrollX;
        this.slashMenu.style.top = `${top}px`;
        this.slashMenu.style.left = `${left}px`;
    }

    hideSlashMenu() {
        if (this.slashMenu) {
            this.slashMenu.classList.remove('active');
        }
    }

    executeSlashCommand(tag) {
        const selection = window.getSelection();
        const block = this.getParentBlock(selection.anchorNode);
        
        if (block) {
            block.textContent = ''; // clear the slash
            document.execCommand('formatBlock', false, tag);
        }
        
        this.hideSlashMenu();
        this.syncAndAnalyze();
        this.canvas.focus();
    }
}

// Auto-initialize all editors on page load and on Django admin inline additions
document.addEventListener("DOMContentLoaded", () => {
    const initEditors = () => {
        const wrappers = document.querySelectorAll('.jalgo-editor-wrapper:not([data-initialized])');
        wrappers.forEach(wrapper => {
            wrapper.setAttribute('data-initialized', 'true');
            new JalgoEditor(wrapper);
        });
    };

    initEditors();

    // Support Django Admin Dynamic Inlines
    if (typeof jQuery !== 'undefined') {
        jQuery(document).on('formset:added', () => {
            initEditors();
        });
    }
});
