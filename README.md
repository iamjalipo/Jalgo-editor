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
2.  **100% CSP Compliant (Bank-Grade Security)**: Zero inline styles. Formatting is strictly semantic. A robust backend Python parser completely strips bad formatting on save.
3.  **The "Zen" Interface**: Bubble Menus, Slash Commands (`/`), and a beautiful glassmorphism design that fully respects Django's Light/Dark modes.
4.  **Built-in SEO Tools & Code View**: Real-time word counts, reading time, heading hierarchy validators, and a zero-dependency Syntax-Highlighted Code Editor built right in.

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
