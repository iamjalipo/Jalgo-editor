from django.db import models
from jalgo_editor.widgets import FluidTextWidget
from jalgo_editor.sanitizer import sanitize_html

class FluidTextField(models.TextField):
    description = "A bidirectional, secure rich-text field."

    def formfield(self, **kwargs):
        defaults = {'widget': FluidTextWidget}
        defaults.update(kwargs)
        return super().formfield(**defaults)

    def clean(self, value, model_instance):
        value = super().clean(value, model_instance)
        if value:
            value = sanitize_html(value)
        return value
