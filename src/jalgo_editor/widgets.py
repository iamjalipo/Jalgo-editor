from django.forms import widgets

class FluidTextWidget(widgets.Textarea):
    template_name = "jalgo_editor/widget.html"

    class Media:
        css = {
            "all": ["jalgo_editor/css/editor.css"]
        }
        js = ["jalgo_editor/js/editor.js"]
