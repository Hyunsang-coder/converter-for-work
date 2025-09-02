// js/text-diff.js

let textDiffViewMode = 'side-by-side'; // 'side-by-side' | 'unified'

function toggleTextDiffView() {
    textDiffViewMode = textDiffViewMode === 'side-by-side' ? 'unified' : 'side-by-side';
    const toggleBtn = document.getElementById('textDiffViewToggle');
    // Button label shows the opposite of current mode (action to switch to)
    if (toggleBtn) toggleBtn.textContent = textDiffViewMode === 'side-by-side' ? 'Unified View' : 'Side by Side';
    renderTextDiff();
}

function enableTextDiffButtons() {
    const original = document.getElementById('textDiffOriginal');
    const changed = document.getElementById('textDiffChanged');

    const updateState = () => {
        renderTextDiff();
    };

    original?.addEventListener('input', updateState);
    changed?.addEventListener('input', updateState);
    // Initialize toggle button label correctly on load
    const toggleBtn = document.getElementById('textDiffViewToggle');
    if (toggleBtn) toggleBtn.textContent = textDiffViewMode === 'side-by-side' ? 'Unified View' : 'Side by Side';
    updateState();
}

document.addEventListener('DOMContentLoaded', enableTextDiffButtons);

function getTextInputs() {
    const originalEl = document.getElementById('textDiffOriginal');
    const changedEl = document.getElementById('textDiffChanged');
    const original = (originalEl?.value || '').replace(/\r/g, '');
    const changed = (changedEl?.value || '').replace(/\r/g, '');
    return { original, changed };
}

function renderTextDiff() {
    const { original, changed } = getTextInputs();
    const diffResult = document.getElementById('textDiffResult');
    const diffStats = document.getElementById('textDiffStats');

    if (!original && !changed) {
        clearTextDiffTool();
        return;
    }

    const unifiedDiff = Diff.diffArrays(original.split('\n'), changed.split('\n'));

    let html = '';
    let added = 0;
    let removed = 0;
    let i = 0, j = 0;

    if (textDiffViewMode === 'side-by-side') {
        html = '<div class="diff-grid">';

        // Build a side-by-side diff with proper alignment/pairing of removed/added blocks
        const lineDiff = Diff.diffLines(original, changed);
        let originalLineNum = 1;
        let changedLineNum = 1;

        const rows = [];
        let removedBuffer = [];
        let addedBuffer = [];

        const flushBuffers = () => {
            if (removedBuffer.length === 0 && addedBuffer.length === 0) return;
            const maxLen = Math.max(removedBuffer.length, addedBuffer.length);
            for (let idx = 0; idx < maxLen; idx++) {
                const left = removedBuffer[idx];
                const right = addedBuffer[idx];

                if (left !== undefined && right !== undefined) {
                    // Replacement: do word-level diff highlighting
                    const wordDiff = Diff.diffWords(left, right);
                    let leftHtml = '';
                    let rightHtml = '';
                    wordDiff.forEach(word => {
                        if (word.added) {
                            rightHtml += `<span class="token-added">${escapeHtml(word.value)}</span>`;
                        } else if (word.removed) {
                            leftHtml += `<span class="token-deleted">${escapeHtml(word.value)}</span>`;
                        } else {
                            const safe = escapeHtml(word.value);
                            leftHtml += safe;
                            rightHtml += safe;
                        }
                    });
                    rows.push({
                        original: { num: originalLineNum, content: leftHtml, class: 'diff-line-modified' },
                        changed: { num: changedLineNum, content: rightHtml, class: 'diff-line-modified' }
                    });
                    originalLineNum++;
                    changedLineNum++;
                    added++;
                    removed++;
                } else if (left !== undefined) {
                    rows.push({
                        original: { num: originalLineNum, content: `<span class=\"token-deleted\">${escapeHtml(left)}</span>`, class: 'diff-line-deleted' },
                        changed: { num: '', content: '', class: '' }
                    });
                    originalLineNum++;
                    removed++;
                } else if (right !== undefined) {
                    rows.push({
                        original: { num: '', content: '', class: '' },
                        changed: { num: changedLineNum, content: `<span class=\"token-added\">${escapeHtml(right)}</span>`, class: 'diff-line-added' }
                    });
                    changedLineNum++;
                    added++;
                }
            }
            removedBuffer = [];
            addedBuffer = [];
        };

        lineDiff.forEach(part => {
            const lines = part.value.split('\n');
            for (let index = 0; index < lines.length; index++) {
                const line = lines[index];
                if (index === lines.length - 1 && line === '') continue;

                if (part.removed) {
                    removedBuffer.push(line);
                } else if (part.added) {
                    addedBuffer.push(line);
                } else {
                    // Unchanged block: flush any pending edits, then add identical lines
                    flushBuffers();
                    rows.push({
                        original: { num: originalLineNum, content: escapeHtml(line), class: '' },
                        changed: { num: changedLineNum, content: escapeHtml(line), class: '' }
                    });
                    originalLineNum++;
                    changedLineNum++;
                }
            }
            // When the part boundary changes, we might have completed a removed/added pair
            if (!part.added && !part.removed) {
                flushBuffers();
            }
        });

        // Flush any remaining buffered lines at the end
        flushBuffers();

        // Generate HTML for each row
        rows.forEach(row => {
            html += `
                <div class="diff-row">
                    <div class="diff-line ${row.original.class}">
                        <div class="gutter">${row.original.num}</div>
                        <div class="content">${row.original.content}</div>
                    </div>
                    <div class="diff-line ${row.changed.class}">
                        <div class="gutter">${row.changed.num}</div>
                        <div class="content">${row.changed.content}</div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
    } else { // Unified View
        html = '<div class="diff-unified">';
        const lineDiff = Diff.diffLines(original, changed);
        lineDiff.forEach(part => {
            const lines = part.value.split('\n');
            lines.forEach((line, index) => {
                if (index === lines.length - 1 && line === '') return;

                let sign = part.added ? '+' : part.removed ? '-' : ' ';
                let lineClass = part.added ? 'diff-line-added' : part.removed ? 'diff-line-deleted' : '';

                if (part.added) added++;
                if (part.removed) removed++;

                html += `
                    <div class="diff-line ${lineClass}">
                        <div class="gutter">${sign}</div>
                        <div class="content">${escapeHtml(line)}</div>
                    </div>
                `;
            });
        });
        html += '</div>';
    }

    diffResult.innerHTML = html;
    diffStats.innerHTML = `<strong>${added + removed} changes:</strong> <span class="stats-added">${added} additions</span> & <span class="stats-deleted">${removed} deletions</span>`;
}

function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function clearTextDiffTool() {
    const original = document.getElementById('textDiffOriginal');
    const changed = document.getElementById('textDiffChanged');
    const container = document.getElementById('textDiffResult');
    const statsEl = document.getElementById('textDiffStats');
    if (original) original.value = '';
    if (changed) changed.value = '';
    if (container) container.innerHTML = '<div class="empty-state">양쪽 텍스트를 입력하면 차이점이 표시됩니다.</div>';
    if (statsEl) statsEl.innerHTML = '';
    showStatus('텍스트 비교 입력이 초기화되었습니다.', 'success');
}
