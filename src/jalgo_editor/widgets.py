from django.forms import widgets
from jalgo_editor.sanitizer import sanitize_html

class FluidTextWidget(widgets.Textarea):
    template_name = "jalgo_editor/widget.html"

    class Media:
        css = {
            "all": ["jalgo_editor/css/editor.css"]
        }
        js = ["jalgo_editor/js/editor.js"]

    def format_value(self, value):
        value = super().format_value(value)
        if value:
            return sanitize_html(str(value))
        return value
