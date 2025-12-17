# Progress Log

## 2025-09-02
- Add new tab: 🧾 텍스트 비교 (placeholder) to `index.html`
- Wire shared handlers in `js/common.js` for tool 4 (텍스트 비교)
- Create `js/text-diff.js` with placeholder enable/clear/compare logic
- Next: Design and implement real diff (line/word/char) and UI rendering

## 2025-12-17
- Fix: Preserve pasted plain-text line breaks in HTML → Markdown converter by normalizing TEXT_NODE whitespace without collapsing `\n` (and treating pasted `<div>`-per-line as line breaks) in `js/html-to-markdown.js`
- Fix: More robust list parsing in HTML → Markdown when pages don't use `<li>` (fallback to `role="listitem"` / other child tags) and preserve whitespace-only inline text nodes to avoid word-joining in `js/html-to-markdown.js`
- Add: Browser-based test harness for HTML → Markdown edge cases (`tests/run-html-to-markdown-tests.html`) with fixtures in `tests/html-to-markdown-cases.js`
