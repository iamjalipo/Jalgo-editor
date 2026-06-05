from html.parser import HTMLParser
from urllib.parse import urlparse

class JalgoSanitizer(HTMLParser):
    ALLOWED_TAGS = {
        "p", "strong", "em", "blockquote", "h2", "h3", 
        "ul", "ol", "li", "pre", "code", "a", "img"
    }
    
    ALLOWED_ATTRIBUTES = {"dir", "href", "src", "alt", "title"}
    
    ALLOWED_DIR_VALUES = {"ltr", "rtl", "auto"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.result = []

    def get_clean_html(self, html_input: str) -> str:
        self.result = []
        if html_input:
            self.feed(html_input)
        return "".join(self.result)

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag not in self.ALLOWED_TAGS:
            return

        clean_attrs = []
        for attr, value in attrs:
            attr = attr.lower()
            if attr not in self.ALLOWED_ATTRIBUTES:
                continue
                
            if value is None:
                continue

            if attr == "dir" and value.lower() not in self.ALLOWED_DIR_VALUES:
                continue

            if attr in ("href", "src"):
                parsed = urlparse(value)
                if parsed.scheme and parsed.scheme.lower() not in ("http", "https", "mailto", "tel"):
                    continue

            clean_attrs.append(f'{attr}="{self._escape_attr(value)}"')

        if clean_attrs:
            self.result.append(f"<{tag} {' '.join(clean_attrs)}>")
        else:
            self.result.append(f"<{tag}>")

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag in self.ALLOWED_TAGS:
            self.result.append(f"</{tag}>")

    def handle_data(self, data):
        self.result.append(self._escape_text(data))
        
    def _escape_attr(self, value):
        return value.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")
        
    def _escape_text(self, text):
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def sanitize_html(html_input: str) -> str:
    sanitizer = JalgoSanitizer()
    return sanitizer.get_clean_html(html_input)
