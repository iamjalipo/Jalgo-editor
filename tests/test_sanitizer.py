import pytest
from jalgo_editor.sanitizer import sanitize_html

def test_allows_basic_tags():
    html = '<p>Hello <strong>World</strong></p>'
    assert sanitize_html(html) == html

def test_strips_disallowed_tags():
    html = '<p>Test <span>Span</span> <script>alert(1)</script></p>'
    expected = '<p>Test Span alert(1)</p>'
    assert sanitize_html(html) == expected

def test_keeps_allowed_attributes():
    html = '<p dir="rtl">سلام</p>'
    assert sanitize_html(html) == html

def test_strips_disallowed_attributes():
    html = '<p style="color: red;" class="big-text" onclick="alert(1)">Hello</p>'
    expected = '<p>Hello</p>'
    assert sanitize_html(html) == expected

def test_sanitizes_href_javascript():
    html = '<a href="javascript:alert(1)">Click</a>'
    expected = '<a>Click</a>'
    assert sanitize_html(html) == expected

def test_allows_valid_href():
    html = '<a href="https://example.com">Link</a>'
    assert sanitize_html(html) == html

def test_html_entities_escaping():
    html = '<p>A & B < C</p>'
    # The sanitizer escapes text content
    expected = '<p>A &amp; B &lt; C</p>'
    assert sanitize_html(html) == expected

def test_nested_tags():
    html = '<blockquote><p><strong>Quote</strong></p></blockquote>'
    assert sanitize_html(html) == html

def test_disallowed_dir_values():
    html = '<p dir="invalid">Test</p>'
    expected = '<p>Test</p>'
    assert sanitize_html(html) == expected
