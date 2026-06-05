import pytest
from jalgo_editor.fields import FluidTextField

def test_fluid_text_field_clean_strips_styles():
    field = FluidTextField()
    dirty_html = '<p style="color: red;" onclick="alert(1)">Hello <strong>World</strong></p>'
    clean_val = field.clean(dirty_html, None)
    assert clean_val == '<p>Hello <strong>World</strong></p>'

def test_fluid_text_field_clean_empty():
    field = FluidTextField(blank=True, null=True)
    assert field.clean("", None) == ""
    assert field.clean(None, None) is None
