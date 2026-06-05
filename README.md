# Jalgo-editor

A zero-dependency, CSP-strict, bidirectional rich-text editor that feels like Notion but lives natively inside the Django Admin.

## Why Jalgo?

Right now, if a Django developer wants a rich-text editor, they have to compromise:
*   **CKEditor / TinyMCE**: Bloated, and fails strict Content Security Policies (CSP) because they inject `style="..."` everywhere.
*   **Editor.js**: Block-based, making mixed-language typing (Persian and English in the same article) a frustrating experience.
*   **Tiptap/ProseMirror**: Requires NPM, React/Vue, and complex build pipelines.

**Jalgo-editor** is the anti-bloat editor. It is a pure Python and Vanilla JavaScript package that drops into any Django project instantly. **No NPM, no build steps, no external CSS frameworks required.**

## Killer Features

1.  **Smart Bi-Directional (Bidi) Engine**: Users don't click an "RTL" or "LTR" button. The editor automatically detects the language of every new paragraph natively applying `dir="rtl"` to Persian/Arabic blocks, and `dir="ltr"` to English.
2.  **Bank-Grade Security (Double Sanitization)**: 100% CSP compliant with zero inline styles. A rigorous frontend DOM sanitizer prevents client-side XSS during copy-paste, while a robust backend Python parser provides defense-in-depth Stored XSS protection. Safely handles Base64 image embedding while aggressively stripping malicious data URIs.
3.  **The "Zen" Interface & Dynamic Themes**: Notion-like Bubble Menus, fully keyboard-navigable Slash Commands (`/`), and a beautiful premium glassmorphism design. Instantly switch between multiple themes including Default, Dark, Retro, and an 8-Bit pixel aesthetic!
4.  **Live Syntax Highlighting**: A lightweight, zero-dependency generic syntax highlighter automatically colorizes programming languages (keywords, strings, comments) in `<pre>` code blocks as you type—even adapting to your chosen theme.
5.  **Built-in SEO Tools & Code View**: Real-time word counts, reading time, heading hierarchy validators, and a robust HTML Code View editor.
6.  **Seamless Admin Integration**: Automatically initializes in Django Admin, fully supporting dynamic Inline Formsets without any configuration.
7.  **Drag & Drop Images**: Works out-of-the-box using local Base64 embedding with secure validation.

## Installation

Install using pip:

```bash
pip install jalgo-editor
```

Add to your `INSTALLED_APPS` in `settings.py`:

```python
INSTALLED_APPS = [
    # ...
    "jalgo_editor",
]
```

## Usage

Simply swap your standard `models.TextField` with `FluidTextField`:

```python
from django.db import models
from jalgo_editor.fields import FluidTextField

class Article(models.Model):
    title = models.CharField(max_length=200)
    content = FluidTextField() # Automatically renders the Notion-style editor
```

No widget configuration needed! It will seamlessly appear in your Django Admin with beautiful Glassmorphism styling and dark-mode support.

## Monetizable Extensions (Premium API)

Jalgo-editor includes configuration hooks for premium integrations:
*   `JALGO_AI_LICENSE_KEY`: Unlocks the `/ai` autocomplete translation and phrasing engine inside the bubble menu.
*   `JALGO_CDN_TOKEN`: Bypasses your local media storage to automatically drag-and-drop upload and WebP-optimize images to the Jalgo CDN.

## License
MIT License
