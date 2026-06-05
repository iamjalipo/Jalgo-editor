from jalgo_editor.widgets import FluidTextWidget

def test_fluid_text_widget_media():
    widget = FluidTextWidget()
    assert 'jalgo_editor/css/editor.css' in widget.media._css['all']
    assert 'jalgo_editor/js/editor.js' in widget.media._js

def test_fluid_text_widget_template():
    widget = FluidTextWidget()
    assert widget.template_name == "jalgo_editor/widget.html"

def test_fluid_text_widget_format_value_sanitizes():
    widget = FluidTextWidget()
    unsafe_html = '<p>Test <script>alert(1)</script></p>'
    safe_html = '<p>Test alert(1)</p>'
    assert widget.format_value(unsafe_html) == safe_html

def test_fluid_text_widget_format_value_none():
    widget = FluidTextWidget()
    assert widget.format_value(None) == None
