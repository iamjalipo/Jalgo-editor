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
        this.canvas.addEventListener('mouseup', () => this.updateToolbarState());
        
        // Bubble Menu Initialization
        this.createBubbleMenu();
        this.createSlashMenu();
        this.buildImageMenu();
        this.buildCodeLangOverlay();
        
        document.addEventListener('selectionchange', () => this.handleSelection());
        document.addEventListener('mousedown', (e) => {
            if (this.bubbleMenu && !this.bubbleMenu.contains(e.target) && !this.canvas.contains(e.target)) {
                this.hideBubbleMenu();
            }
            if (this.slashMenu && !this.slashMenu.contains(e.target)) {
                this.hideSlashMenu();
            }
            if (this.imageMenu && !this.imageMenu.contains(e.target) && (!this.selectedImage || e.target !== this.selectedImage)) {
                this.hideImageMenu();
                if (this.selectedImage) {
                    this.selectedImage.classList.remove('selected');
                    this.selectedImage = null;
                }
            }
            if (this.codeLangOverlay && !this.codeLangOverlay.contains(e.target) && (!this.currentPreBlock || !this.currentPreBlock.contains(e.target))) {
                this.hideCodeLangOverlay();
            }
        });
        
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
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
        
        // Formatting Group
        this.formatGroup = document.createElement('div');
        this.formatGroup.className = 'jalgo-format-group';
        
        const formats = [
            { icon: '<b>B</b>', command: 'bold', arg: null, tooltip: 'Bold' },
            { icon: '<i>I</i>', command: 'italic', arg: null, tooltip: 'Italic' },
            { divider: true },
            { icon: '<span style="font-weight:900;font-size:14px;letter-spacing:-1px;">H1</span>', command: 'formatBlock', arg: 'H1', tooltip: 'Heading 1' },
            { icon: '<span style="font-weight:700;font-size:13px;letter-spacing:-0.5px;">H2</span>', command: 'formatBlock', arg: 'H2', tooltip: 'Heading 2' },
            { icon: '<span style="font-weight:600;font-size:12px;">H3</span>', command: 'formatBlock', arg: 'H3', tooltip: 'Heading 3' },
            { divider: true },
            { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" transform="scale(1.2)"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>', command: 'formatBlock', arg: 'PRE', tooltip: 'Code Block' },
            { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" transform="scale(1.2)" stroke-linecap="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>', command: 'formatBlock', arg: 'BLOCKQUOTE', tooltip: 'Quote' },
            { divider: true },
            { icon: '<span style="font-weight:900;font-size:16px;">•</span>', command: 'insertUnorderedList', arg: null, tooltip: 'Bullet List' },
            { icon: '<span style="font-weight:700;font-size:14px;">1.</span>', command: 'insertOrderedList', arg: null, tooltip: 'Numbered List' },
            { divider: true },
            { 
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>', 
                command: 'uploadImage', 
                arg: null, 
                tooltip: 'Upload Image' 
            }
        ];

        this.formatButtons = [];

        formats.forEach(fmt => {
            if (fmt.divider) {
                const div = document.createElement('div');
                div.className = 'jalgo-divider';
                this.formatGroup.appendChild(div);
                return;
            }
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'jalgo-format-btn';
            btn.innerHTML = fmt.icon;
            btn.setAttribute('data-jalgo-tooltip', fmt.tooltip);
            btn.dataset.command = fmt.command;
            btn.dataset.arg = fmt.arg || '';
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault(); 
                if (fmt.command === 'uploadImage') {
                    this.triggerImageUpload();
                } else if (btn.classList.contains('active') && fmt.command === 'formatBlock') {
                    document.execCommand('formatBlock', false, 'P');
                } else {
                    document.execCommand(fmt.command, false, fmt.arg);
                }
                this.syncAndAnalyze();
                this.updateToolbarState();
            });
            this.formatButtons.push(btn);
            this.formatGroup.appendChild(btn);
        });

        // Actions Group
        this.actionGroup = document.createElement('div');
        this.actionGroup.className = 'jalgo-action-group';
        
        // Theme Selector (Custom Dropdown)
        this.themeSelectWrapper = document.createElement('div');
        this.themeSelectWrapper.className = 'jalgo-custom-select';
        
        this.themeSelectBtn = document.createElement('button');
        this.themeSelectBtn.className = 'jalgo-custom-select-btn';
        this.themeSelectBtn.type = 'button';
        this.themeSelectBtn.innerHTML = '<span>Default Theme</span> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; margin-left: 4px;"><polyline points="6 9 12 15 18 9"></polyline></svg>';
        
        this.themeSelectMenu = document.createElement('div');
        this.themeSelectMenu.className = 'jalgo-custom-select-menu';
        
        const themes = [
            { value: 'default', label: 'Default Theme' },
            { value: 'retro', label: 'Retro' },
            { value: '8bit', label: '8-Bit' }
        ];

        themes.forEach((theme, index) => {
            const option = document.createElement('button');
            option.type = 'button';
            option.className = 'jalgo-custom-select-option';
            if (index === 0) option.classList.add('active');
            option.dataset.value = theme.value;
            option.textContent = theme.label;
            
            option.addEventListener('click', () => {
                this.container.dataset.jalgoTheme = theme.value;
                this.themeSelectBtn.querySelector('span').textContent = theme.label;
                this.themeSelectMenu.classList.remove('active');
                this.themeSelectMenu.querySelectorAll('.jalgo-custom-select-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
            });
            this.themeSelectMenu.appendChild(option);
        });

        this.themeSelectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.themeSelectMenu.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            if (this.themeSelectMenu.classList.contains('active')) {
                this.themeSelectMenu.classList.remove('active');
            }
        });

        this.themeSelectWrapper.appendChild(this.themeSelectBtn);
        this.themeSelectWrapper.appendChild(this.themeSelectMenu);

        this.dirBtn = document.createElement('button');
        this.dirBtn.type = 'button';
        this.dirBtn.className = 'jalgo-action-btn rtl-btn';
        this.dirBtn.textContent = 'RTL ⮂';
        this.dirBtn.title = 'Toggle Text Direction';
        this.dirBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleDirection();
        });

        this.toggleBtn = document.createElement('button');
        this.toggleBtn.type = 'button';
        this.toggleBtn.className = 'jalgo-action-btn code-view-btn';
        this.toggleBtn.textContent = '</> Code View';

        this.actionGroup.appendChild(this.themeSelectWrapper);
        this.actionGroup.appendChild(this.dirBtn);
        this.actionGroup.appendChild(this.toggleBtn);
        
        this.toolbar.appendChild(this.formatGroup);
        this.toolbar.appendChild(this.actionGroup);
        this.container.insertBefore(this.toolbar, this.canvas);

        // Code Wrapper (Solid Textarea)
        this.codeWrapper = document.createElement('div');
        this.codeWrapper.className = 'jalgo-code-wrapper';
        
        this.codeTextarea = document.createElement('textarea');
        this.codeTextarea.className = 'jalgo-code-textarea';
        this.codeTextarea.spellcheck = false;
        
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
            let html = this.codeTextarea.value;
            if (this.imageBase64Map) {
                html = html.replace(/src="(jalgo-img-\d+)"/g, (match, id) => {
                    return this.imageBase64Map[id] ? `src="${this.imageBase64Map[id]}"` : match;
                });
            }
            this.canvas.innerHTML = this.sanitizeFrontend(html);
            this.syncAndAnalyze();
            this.adjustCodeTextareaHeight();
        });
    }

    toggleCodeView() {
        this.isCodeView = !this.isCodeView;
        if (this.isCodeView) {
            this.container.classList.add('code-view-active');
            // Store canvas height before hiding
            this.lastCanvasHeight = this.canvas.offsetHeight;
            this.canvas.classList.add('hidden');
            this.codeWrapper.classList.add('active');
            this.toggleBtn.textContent = 'Visual View';
            
            // Extract base64 images and replace with placeholder
            let html = this.canvas.innerHTML;
            this.imageBase64Map = this.imageBase64Map || {};
            let counter = Object.keys(this.imageBase64Map).length;
            html = html.replace(/src="(data:image\/[^;]+;base64,[^"]+)"/g, (match, base64) => {
                counter++;
                let id = 'jalgo-img-' + counter;
                this.imageBase64Map[id] = base64;
                return `src="${id}"`;
            });
            
            // Format HTML for better editing
            this.codeTextarea.value = html.replace(/></g, '>\n<');
            // Auto-adjust height after DOM reflow
            setTimeout(() => this.adjustCodeTextareaHeight(), 0);
        } else {
            this.container.classList.remove('code-view-active');
            
            let html = this.codeTextarea.value;
            if (this.imageBase64Map) {
                html = html.replace(/src="(jalgo-img-\d+)"/g, (match, id) => {
                    return this.imageBase64Map[id] ? `src="${this.imageBase64Map[id]}"` : match;
                });
            }
            this.canvas.innerHTML = this.sanitizeFrontend(html);
            
            this.canvas.classList.remove('hidden');
            this.codeWrapper.classList.remove('active');
            this.toggleBtn.textContent = '</> Code View';
            // Clean up missing blocks
            if (this.canvas.innerHTML.trim() === '') this.canvas.innerHTML = '<p><br></p>';
            this.syncAndAnalyze();
        }
    }

    adjustCodeTextareaHeight() {
        this.codeTextarea.style.height = 'auto';
        const scrollHeight = this.codeTextarea.scrollHeight;
        const minHeight = Math.max(380, this.lastCanvasHeight || 380);
        this.codeTextarea.style.height = `${Math.max(minHeight, scrollHeight)}px`;
    }

    triggerImageUpload() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64Src = event.target.result;
                    const img = document.createElement('img');
                    img.src = base64Src;
                    img.alt = file.name;
                    img.classList.add('align-center');
                    if (this.isCodeView) {
                        this.toggleCodeView();
                    }
                    this.canvas.focus();
                    this.insertNodeAtCursor(img);
                    this.syncAndAnalyze();
                };
                reader.readAsDataURL(file);
            }
        });
        fileInput.click();
    }

    toggleDirection() {
        const currentDir = this.container.getAttribute('dir') || 'auto';
        if (currentDir === 'rtl') {
            this.container.setAttribute('dir', 'ltr');
            this.dirBtn.textContent = 'RTL ⮂';
        } else {
            this.container.setAttribute('dir', 'rtl');
            this.dirBtn.textContent = 'LTR ⮂';
        }
        
        // Also force all blocks that were auto-detected to update to the new base
        // Or we can just let them keep their individual dirs. 
        // We'll remove individual block dirs so they inherit the new container dir.
        const blocks = this.canvas.querySelectorAll('[dir]');
        blocks.forEach(block => block.removeAttribute('dir'));
        
        this.syncAndAnalyze();
        this.canvas.focus();
    }



    sanitizeFrontend(html) {
        if (!html) return '';
        // As requested: bypass frontend sanitization to allow custom code tweaking.
        // The backend will handle the final sanitization.
        return html;
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
                    img.classList.add('align-center');
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
        
        // Apply syntax highlighting to code blocks
        const preBlocks = this.canvas.querySelectorAll('pre');
        preBlocks.forEach(pre => this.highlightPreBlock(pre));

        // 3. Update SEO Stats & Outline Validator
        this.updateSeoStats();
    }

    updateToolbarState() {
        if (!this.formatButtons) return;
        this.formatButtons.forEach(btn => {
            const cmd = btn.dataset.command;
            const arg = btn.dataset.arg;
            let isActive = false;
            
            try {
                if (cmd === 'formatBlock') {
                    const currentBlock = document.queryCommandValue('formatBlock');
                    if (currentBlock && currentBlock.toLowerCase() === arg.toLowerCase()) {
                        isActive = true;
                    }
                } else {
                    isActive = document.queryCommandState(cmd);
                }
            } catch (e) {
                // Ignore queryCommandState errors in unsupported browsers
            }
            
            if (isActive) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
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
        this.updateToolbarState();
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

        this.bubbleToolsContainer = document.createElement('div');
        this.bubbleToolsContainer.style.display = 'flex';
        this.bubbleToolsContainer.style.alignItems = 'center';

        tools.forEach(tool => {
            const btn = document.createElement('button');
            btn.className = `jalgo-menu-btn ${tool.className || ''}`;
            btn.type = 'button';
            btn.textContent = tool.label;
            
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Prevent losing selection
                if (tool.command === 'createLink') {
                    this.showLinkInput();
                } else {
                    this.executeCommand(tool.command);
                }
            });
            
            this.bubbleToolsContainer.appendChild(btn);
        });

        this.bubbleMenu.appendChild(this.bubbleToolsContainer);

        this.linkContainer = document.createElement('div');
        this.linkContainer.style.display = 'none';
        this.linkContainer.style.alignItems = 'center';
        this.linkContainer.style.padding = '0 4px';
        
        this.linkInput = document.createElement('input');
        this.linkInput.type = 'url';
        this.linkInput.placeholder = 'Paste or type link...';
        this.linkInput.style.background = 'transparent';
        this.linkInput.style.border = '1px solid var(--jalgo-border)';
        this.linkInput.style.color = 'var(--jalgo-text)';
        this.linkInput.style.borderRadius = '4px';
        this.linkInput.style.padding = '4px 8px';
        this.linkInput.style.fontSize = '12px';
        this.linkInput.style.outline = 'none';
        this.linkInput.style.width = '150px';

        this.linkInput.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });

        this.linkInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.applyLink(this.linkInput.value);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.hideLinkInput();
            }
        });

        const applyBtn = document.createElement('button');
        applyBtn.className = 'jalgo-menu-btn';
        applyBtn.textContent = 'Add';
        applyBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.applyLink(this.linkInput.value);
        });

        this.linkContainer.appendChild(this.linkInput);
        this.linkContainer.appendChild(applyBtn);

        this.bubbleMenu.appendChild(this.linkContainer);

        document.body.appendChild(this.bubbleMenu);
    }
    
    showLinkInput() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            this.savedLinkRange = selection.getRangeAt(0);
        }
        this.bubbleToolsContainer.style.display = 'none';
        this.linkContainer.style.display = 'flex';
        setTimeout(() => this.linkInput.focus(), 0);
    }

    hideLinkInput() {
        if (this.bubbleToolsContainer) {
            this.bubbleToolsContainer.style.display = 'flex';
            this.linkContainer.style.display = 'none';
            this.linkInput.value = '';
        }
    }

    applyLink(url) {
        if (url && this.savedLinkRange) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(this.savedLinkRange);
            document.execCommand('createLink', false, url);
            this.syncAndAnalyze();
        }
        this.hideLinkInput();
        this.hideBubbleMenu();
    }

    handleSelection() {
        const selection = window.getSelection();
        
        // Don't mess with selection if we are interacting inside the menus
        if (this.bubbleMenu && this.bubbleMenu.contains(document.activeElement)) {
            return;
        }
        if (this.codeLangOverlay && this.codeLangOverlay.contains(document.activeElement)) {
            return;
        }

        if (!selection || selection.rangeCount === 0) {
            this.hideBubbleMenu();
            this.hideCodeLangOverlay();
            return;
        }

        // Handle code language overlay regardless of selection collapse
        if (selection.anchorNode && this.canvas.contains(selection.anchorNode)) {
            const block = this.getParentBlock(selection.anchorNode);
            if (block && block.tagName === 'PRE') {
                this.showCodeLangOverlay(block);
            } else {
                this.hideCodeLangOverlay();
            }
        } else {
            this.hideCodeLangOverlay();
        }

        if (selection.isCollapsed) {
            this.hideBubbleMenu();
            return;
        }

        // Only show if selection is inside our canvas
        if (!this.canvas.contains(selection.anchorNode) && !(this.bubbleMenu && this.bubbleMenu.contains(selection.anchorNode))) {
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

    showCodeLangOverlay(preBlock) {
        this.currentPreBlock = preBlock;
        if (this.codeLangOverlay) {
            this.codeLangOverlay.style.display = 'block';
            const lang = preBlock.getAttribute('data-lang') || 'plaintext';
            const select = this.codeLangOverlay.querySelector('select');
            if (select) select.value = lang;
            
            // Wait for display:block to calculate width
            setTimeout(() => {
                const rect = preBlock.getBoundingClientRect();
                const top = rect.top + window.scrollY + 8;
                const left = rect.right + window.scrollX - this.codeLangOverlay.offsetWidth - 16;
                
                this.codeLangOverlay.style.top = `${top}px`;
                this.codeLangOverlay.style.left = `${left}px`;
            }, 0);
        }
    }

    hideCodeLangOverlay() {
        if (this.codeLangOverlay) {
            this.codeLangOverlay.style.display = 'none';
        }
        this.currentPreBlock = null;
    }

    buildCodeLangOverlay() {
        this.codeLangOverlay = document.createElement('div');
        this.codeLangOverlay.className = 'jalgo-code-lang-overlay';
        this.codeLangOverlay.style.padding = '4px';
        this.codeLangOverlay.contentEditable = false;
        
        const select = document.createElement('select');
        select.style.background = 'transparent';
        select.style.border = 'none';
        select.style.color = 'var(--jalgo-text)';
        select.style.outline = 'none';
        select.style.cursor = 'pointer';
        select.style.fontSize = '12px';
        select.style.fontWeight = '600';
        
        select.innerHTML = `
            <option value="plaintext">Plain Text</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="html">HTML/XML</option>
            <option value="css">CSS</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="php">PHP</option>
            <option value="ruby">Ruby</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="sql">SQL</option>
            <option value="json">JSON</option>
            <option value="bash">Bash</option>
        `;
        
        select.addEventListener('change', (e) => {
            if (this.currentPreBlock) {
                this.currentPreBlock.setAttribute('data-lang', e.target.value);
                this.highlightPreBlock(this.currentPreBlock);
                this.syncAndAnalyze();
            }
        });
        
        this.codeLangOverlay.appendChild(select);
        document.body.appendChild(this.codeLangOverlay);
    }

    highlightText(text, lang) {
        let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        if (!lang || lang === 'plaintext') return html;
        
        if (lang === 'python') {
            const keywords = ['def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'with', 'as', 'pass', 'True', 'False', 'None'];
            html = html.replace(/(#.*$)/gm, '<span class="jalgo-token-comment">$1</span>');
            html = html.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|"[^"]*"|'[^']*')/g, '<span class="jalgo-token-string">$1</span>');
            const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b(?![^<]*>)`, 'g');
            html = html.replace(kwRegex, '<span class="jalgo-token-keyword">$1</span>');
            html = html.replace(/\b(\d+)\b(?![^<]*>)/g, '<span class="jalgo-token-number">$1</span>');
        } else if (lang === 'javascript') {
            const keywords = ['const', 'let', 'var', 'function', 'class', 'import', 'export', 'return', 'if', 'else', 'for', 'while', 'try', 'catch', 'true', 'false', 'null', 'undefined', 'new', 'this'];
            html = html.replace(/(\w+)(?=\s*\()/g, '<span class="jalgo-token-function">$1</span>');
            html = html.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="jalgo-token-comment">$1</span>');
            html = html.replace(/("[^"]*"|'[^']*'|`[^`]*`)/g, '<span class="jalgo-token-string">$1</span>');
            const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b(?![^<]*>)`, 'g');
            html = html.replace(kwRegex, '<span class="jalgo-token-keyword">$1</span>');
            html = html.replace(/\b(\d+)\b(?![^<]*>)/g, '<span class="jalgo-token-number">$1</span>');
        } else if (lang === 'html' || lang === 'xml') {
            html = html.replace(/(&lt;\/?\w+)/g, '<span class="jalgo-token-keyword">$1</span>');
            html = html.replace(/([\w-]+)(?=\s*=\s*(&quot;|&#39;|"|'))/g, '<span class="jalgo-token-attr">$1</span>');
            html = html.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|"[^"]*"|'[^']*')/g, '<span class="jalgo-token-string">$1</span>');
        } else if (lang === 'css') {
            html = html.replace(/(\/\*[\s\S]*?\*\/)/gm, '<span class="jalgo-token-comment">$1</span>');
            html = html.replace(/([\w-]+)(?=\s*:)/g, '<span class="jalgo-token-keyword">$1</span>');
        } else if (['cpp', 'java', 'php', 'ruby', 'go', 'rust', 'sql', 'bash', 'json'].includes(lang)) {
            // Generic fallback highlighter for expanded languages
            const genericKeywords = ['int', 'float', 'double', 'char', 'void', 'public', 'private', 'class', 'struct', 'if', 'else', 'for', 'while', 'return', 'function', 'fn', 'let', 'var', 'const', 'import', 'include', 'use', 'namespace', 'select', 'from', 'where', 'echo'];
            html = html.replace(/(\w+)(?=\s*\()/g, '<span class="jalgo-token-function">$1</span>');
            html = html.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm, '<span class="jalgo-token-comment">$1</span>');
            html = html.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|"[^"]*"|'[^']*'|`[^`]*`)/g, '<span class="jalgo-token-string">$1</span>');
            const kwRegex = new RegExp(`\\b(${genericKeywords.join('|')})\\b(?![^<]*>)`, 'gi');
            html = html.replace(kwRegex, '<span class="jalgo-token-keyword">$1</span>');
            html = html.replace(/\b(\d+)\b(?![^<]*>)/g, '<span class="jalgo-token-number">$1</span>');
        }
        return html;
    }

    highlightPreBlock(pre) {
        const lang = pre.getAttribute('data-lang') || 'plaintext';
        const text = pre.innerText || pre.textContent;
        const newHtml = this.highlightText(text, lang);
        
        if (pre.innerHTML !== newHtml && newHtml !== '') {
            const sel = window.getSelection();
            let savedOffset = 0;
            if (sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                if (pre.contains(range.startContainer)) {
                    const preRange = document.createRange();
                    preRange.selectNodeContents(pre);
                    preRange.setEnd(range.startContainer, range.startOffset);
                    savedOffset = preRange.toString().length;
                }
            }
            
            pre.innerHTML = newHtml;
            
            if (savedOffset > 0) {
                this.restoreCursor(pre, savedOffset);
            }
        }
    }

    restoreCursor(node, offset) {
        const sel = window.getSelection();
        const range = document.createRange();
        let currentOffset = 0;
        let found = false;
        
        function traverse(currentNode) {
            if (found) return;
            if (currentNode.nodeType === Node.TEXT_NODE) {
                const len = currentNode.textContent.length;
                if (currentOffset + len >= offset) {
                    range.setStart(currentNode, offset - currentOffset);
                    range.collapse(true);
                    found = true;
                } else {
                    currentOffset += len;
                }
            } else {
                for (let i = 0; i < currentNode.childNodes.length; i++) {
                    traverse(currentNode.childNodes[i]);
                }
            }
        }
        
        traverse(node);
        if (found) {
            sel.removeAllRanges();
            sel.addRange(range);
        }
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
            if (this.hideLinkInput) this.hideLinkInput();
        }
    }

    executeCommand(command) {
        if (command === 'ai') {
            alert('AI Assistant is a premium feature. Please configure JALGO_AI_LICENSE_KEY to unlock smart completions and translations.');
        } else {
            document.execCommand(command, false, null);
        }
        
        this.syncAndAnalyze();
    }

    buildImageMenu() {
        this.imageMenu = document.createElement('div');
        this.imageMenu.className = 'jalgo-bubble-menu';
        
        const alignments = [
            { label: 'Left', value: 'align-left' },
            { label: 'Center', value: 'align-center' },
            { label: 'Right', value: 'align-right' }
        ];

        alignments.forEach(align => {
            const btn = document.createElement('button');
            btn.className = 'jalgo-menu-btn';
            btn.textContent = align.label;
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (this.selectedImage) {
                    this.selectedImage.classList.remove('align-left', 'align-center', 'align-right');
                    this.selectedImage.classList.add(align.value);
                    this.syncAndAnalyze();
                }
            });
            this.imageMenu.appendChild(btn);
        });

        const altContainer = document.createElement('div');
        altContainer.style.display = 'flex';
        altContainer.style.alignItems = 'center';
        altContainer.style.marginLeft = '8px';
        altContainer.style.paddingLeft = '8px';
        altContainer.style.borderLeft = '1px solid var(--jalgo-menu-border)';

        this.altInput = document.createElement('input');
        this.altInput.type = 'text';
        this.altInput.placeholder = 'Alt text...';
        this.altInput.style.background = 'transparent';
        this.altInput.style.border = '1px solid var(--jalgo-border)';
        this.altInput.style.color = 'var(--jalgo-text)';
        this.altInput.style.borderRadius = '4px';
        this.altInput.style.padding = '4px 8px';
        this.altInput.style.fontSize = '12px';
        this.altInput.style.outline = 'none';
        this.altInput.style.width = '100px';
        this.altInput.style.transition = 'width 0.2s, border-color 0.2s';
        
        this.altInput.addEventListener('focus', () => {
            this.altInput.style.width = '150px';
            this.altInput.style.borderColor = '#6366f1';
        });
        
        this.altInput.addEventListener('blur', () => {
            this.altInput.style.width = '100px';
            this.altInput.style.borderColor = 'var(--jalgo-border)';
        });
        
        this.altInput.addEventListener('input', (e) => {
            if (this.selectedImage) {
                this.selectedImage.alt = e.target.value;
                this.syncAndAnalyze();
            }
        });
        
        this.altInput.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });

        altContainer.appendChild(this.altInput);
        this.imageMenu.appendChild(altContainer);

        document.body.appendChild(this.imageMenu);
    }

    handleCanvasClick(e) {
        if (e.target.tagName === 'IMG') {
            if (this.selectedImage) {
                this.selectedImage.classList.remove('selected');
            }
            this.selectedImage = e.target;
            this.selectedImage.classList.add('selected');
            if (this.altInput) {
                this.altInput.value = this.selectedImage.alt || '';
            }
            this.showImageMenu(e.target);
        } else if (e.target.closest('a')) {
            const link = e.target.closest('a');
            
            const range = document.createRange();
            range.selectNodeContents(link);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            this.showBubbleMenu(range);
            this.showLinkInput(link.href);
            
            if (this.selectedImage) {
                this.selectedImage.classList.remove('selected');
                this.selectedImage = null;
            }
            this.hideImageMenu();
        } else {
            if (this.selectedImage) {
                this.selectedImage.classList.remove('selected');
                this.selectedImage = null;
            }
            this.hideImageMenu();
        }
    }

    showImageMenu(img) {
        const rect = img.getBoundingClientRect();
        this.imageMenu.classList.add('active');
        
        const menuWidth = this.imageMenu.offsetWidth || 200;
        const menuHeight = this.imageMenu.offsetHeight || 40;
        
        const top = rect.top + window.scrollY - menuHeight - 10;
        const left = rect.left + window.scrollX + (rect.width / 2) - (menuWidth / 2);

        this.imageMenu.style.top = `${Math.max(10, top)}px`;
        this.imageMenu.style.left = `${Math.max(10, left)}px`;
    }

    hideImageMenu() {
        if (this.imageMenu) {
            this.imageMenu.classList.remove('active');
        }
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
        if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedImage) {
            e.preventDefault();
            this.selectedImage.remove();
            this.selectedImage = null;
            this.hideImageMenu();
            this.syncAndAnalyze();
            return;
        }

        if (e.key === 'Enter') {
            const block = this.getParentBlock(window.getSelection().anchorNode);
            if (block && (block.tagName === 'PRE' || block.tagName === 'BLOCKQUOTE')) {
                if (this.lastEnterBlock === block && this.lastEnterText === block.textContent) {
                    // Double enter detected! Break out of the block.
                    e.preventDefault();
                    const p = document.createElement('p');
                    p.innerHTML = '<br>';
                    block.parentNode.insertBefore(p, block.nextSibling);
                    
                    // Clean up the block if it was completely empty
                    block.innerHTML = block.innerHTML.replace(/(<br>|\n)$/i, '');
                    if (block.textContent.trim() === '') {
                        block.remove();
                    }
                    
                    // Move cursor to the new paragraph
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    const range = document.createRange();
                    range.setStart(p, 0);
                    range.collapse(true);
                    sel.addRange(range);
                    
                    this.lastEnterBlock = null;
                    return; // Stop processing this event
                } else {
                    this.lastEnterBlock = block;
                    this.lastEnterText = block.textContent;
                }
            } else {
                this.lastEnterBlock = null;
            }
        } else {
            // Reset state if they type any other key
            this.lastEnterBlock = null;
        }

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
