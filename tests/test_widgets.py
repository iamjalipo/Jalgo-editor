from jalgo_editor.widgets import FluidTextWidget

def test_fluid_text_widget_media():
    widget = FluidTextWidget()
    assert 'jalgo_editor/css/editor.css' in widget.media._css['all']
    assert 'jalgo_editor/js/editor.js' in widget.media._js

def test_fluid_text_widget_template():
    widget = FluidTextWidget()
    assert widget.template_name == "jalgo_editor/widget.html"
