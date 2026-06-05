import pytest
from jalgo_editor.sanitizer import sanitize_html

def test_allows_basic_tags():
    html = '<p>Hello <strong>World</strong> <br></p>'
    assert sanitize_html(html) == html

def test_strips_disallowed_tags():
    html = '<p>Test <style>body {}</style> <script>alert(1)</script></p>'
    expected = '<p>Test body {} alert(1)</p>'
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

def test_sanitizes_href_javascript_with_whitespace():
    html = '<a href=" java\nscript:alert(1)">Click</a>'
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

def test_void_elements():
    html = '<p>Test<br /><img src="https://example.com/img.jpg" /></p>'
    expected = '<p>Test<br><img src="https://example.com/img.jpg"></p>'
    assert sanitize_html(html) == expected

def test_allows_data_image_src():
    html = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" alt="test">'
    assert sanitize_html(html) == html

def test_strips_data_non_image_src():
    html = '<img src="data:text/html,<script>alert(1)</script>" alt="test">'
    expected = '<img alt="test">'
    assert sanitize_html(html) == expected

def test_strips_data_href():
    html = '<a href="data:text/html,<script>alert(1)</script>">Click</a>'
    expected = '<a>Click</a>'
    assert sanitize_html(html) == expected
