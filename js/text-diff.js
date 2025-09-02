// --- Text Diff Placeholder Logic ---

function enableTextDiffButtons() {
    const original = document.getElementById('textDiffOriginal');
    const changed = document.getElementById('textDiffChanged');
    const convertBtn = document.getElementById('textDiffConvertBtn');
    const copyBtn = document.getElementById('textDiffCopyBtn');

    const updateState = () => {
        const hasOriginal = original && original.innerText.trim().length > 0;
        const hasChanged = changed && changed.innerText.trim().length > 0;
        const canCompare = hasOriginal && hasChanged;
        if (convertBtn) convertBtn.disabled = !canCompare;
        if (copyBtn) copyBtn.disabled = !document.getElementById('textDiffOutput')?.value;
    };

    original?.addEventListener('input', updateState);
    changed?.addEventListener('input', updateState);
    updateState();
}

document.addEventListener('DOMContentLoaded', enableTextDiffButtons);

function convertTextDiff() {
    const original = (document.getElementById('textDiffOriginal')?.innerText || '').trim();
    const changed = (document.getElementById('textDiffChanged')?.innerText || '').trim();
    const output = document.getElementById('textDiffOutput');

    if (!original || !changed) {
        showStatus('비교할 두 텍스트를 모두 입력해주세요.', 'error');
        return;
    }

    // Placeholder: line count summary until real diff implemented
    const originalLines = original.split(/\r?\n/).length;
    const changedLines = changed.split(/\r?\n/).length;
    const summary = [
        `원문 줄 수: ${originalLines}`,
        `변경본 줄 수: ${changedLines}`,
        '실제 diff 알고리즘은 이후 단계에서 구현됩니다.'
    ].join('\n');

    if (output) {
        output.value = summary;
        showStatus('텍스트 비교(placeholder)가 완료되었습니다.', 'success');
    }

    // update buttons
    const copyBtn = document.getElementById('textDiffCopyBtn');
    if (copyBtn) copyBtn.disabled = !output?.value;
}

function clearTextDiffTool() {
    const original = document.getElementById('textDiffOriginal');
    const changed = document.getElementById('textDiffChanged');
    const output = document.getElementById('textDiffOutput');
    if (original) original.innerHTML = '';
    if (changed) changed.innerHTML = '';
    if (output) output.value = '';
    enableTextDiffButtons();
    showStatus('텍스트 비교 입력이 초기화되었습니다.', 'success');
}


