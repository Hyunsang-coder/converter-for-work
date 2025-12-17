# converter-for-work

Browser-based converters for:
- HTML → Markdown
- Excel → Markdown
- Markdown → Excel
- Text diff

## Run

Open `index.html` directly in your browser.

## HTML → Markdown notes

The converter is designed to handle messy “copy & paste from web/email” HTML. In particular it tries to be resilient to:
- Pasted plain text that becomes `<div>` per line in `contenteditable`
- Lists that don’t use `<li>` consistently (fallbacks like `role="listitem"` or non-semantic child tags)
- Inline formatting where whitespace-only text nodes can otherwise cause words to join (`are**bold`)

## Tests (local)

There is a small browser-based edge-case runner under `tests/`:
- `tests/run-html-to-markdown-tests.html`

Note: **`tests/` and Playwright artifacts are ignored by `.gitignore`** per project request. If you want to commit/share the test harness, remove `tests/` from `.gitignore`.


