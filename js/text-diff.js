// js/text-diff.js

let textDiffViewMode = 'side-by-side'; // 'side-by-side' | 'unified'

function toggleTextDiffView() {
    textDiffViewMode = textDiffViewMode === 'side-by-side' ? 'unified' : 'side-by-side';
    const toggleBtn = document.getElementById('textDiffViewToggle');
    if (toggleBtn) toggleBtn.textContent = textDiffViewMode === 'side-by-side' ? 'Side by Side' : 'Unified View';
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
        unifiedDiff.forEach(part => {
            if (part.added) {
                part.value.forEach(line => {
                    html += `
                        <div class="diff-line diff-line-added">
                            <div class="gutter"></div> <div class="content"></div>
                        </div>
                        <div class="diff-line diff-line-added">
                            <div class="gutter">${j + 1}</div> <div class="content"><span class="token-added">${escapeHtml(line)}</span></div>
                        </div>
                    `;
                    j++;
                    added++;
                });
            } else if (part.removed) {
                part.value.forEach(line => {
                    html += `
                        <div class="diff-line diff-line-deleted">
                            <div class="gutter">${i + 1}</div> <div class="content"><span class="token-deleted">${escapeHtml(line)}</span></div>
                        </div>
                        <div class="diff-line diff-line-deleted">
                            <div class="gutter"></div> <div class="content"></div>
                        </div>
                    `;
                    i++;
                    removed++;
                });
            } else {
                part.value.forEach(line => {
                    const originalLine = original.split('\n')[i];
                    const changedLine = changed.split('\n')[j];
                    let originalContent = escapeHtml(originalLine);
                    let changedContent = escapeHtml(changedLine);
                    let lineClass = '';

                    if (originalLine !== changedLine) {
                        lineClass = 'diff-line-modified';
                        const wordDiff = Diff.diffWords(originalLine, changedLine);
                        originalContent = '';
                        changedContent = '';
                        wordDiff.forEach(word => {
                            if (word.added) {
                                changedContent += `<span class="token-added">${escapeHtml(word.value)}</span>`;
                            } else if (word.removed) {
                                originalContent += `<span class="token-deleted">${escapeHtml(word.value)}</span>`;
                            } else {
                                originalContent += escapeHtml(word.value);
                                changedContent += escapeHtml(word.value);
                            }
                        });
                        added++; 
                        removed++;
                    }

                    html += `
                        <div class="diff-line ${lineClass}">
                            <div class="gutter">${i + 1}</div> <div class="content">${originalContent}</div>
                        </div>
                        <div class="diff-line ${lineClass}">
                            <div class="gutter">${j + 1}</div> <div class="content">${changedContent}</div>
                        </div>
                    `;
                    i++;
                    j++;
                });
            }
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
                
                if(part.added) added++;
                if(part.removed) removed++;

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
