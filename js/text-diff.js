// Text Diff with side-by-side and unified rendering

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
    const original = (document.getElementById('textDiffOriginal')?.innerText || '').replace(/\r/g, '');
    const changed = (document.getElementById('textDiffChanged')?.innerText || '').replace(/\r/g, '');
    return { original, changed };
}

function splitLines(text) {
    return text.split(/\n/);
}

function computeWordDiff(lineA, lineB) {
    const tokenize = (text) => {
        const tokens = [];
        const regex = /(\S+|\s+)/g;
        let match;
        while ((match = regex.exec(text)) !== null) tokens.push(match[0]);
        return tokens;
    };

    const a = tokenize(lineA || '');
    const b = tokenize(lineB || '');
    const n = a.length, m = b.length;
    const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    const left = []; const right = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
            left.unshift({ type: 'equal', text: a[i - 1] });
            right.unshift({ type: 'equal', text: b[j - 1] });
            i--; j--;
        } else if (i > 0 && (j === 0 || dp[i - 1][j] >= dp[i][j - 1])) {
            left.unshift({ type: 'deleted', text: a[i - 1] });
            i--;
        } else if (j > 0) {
            right.unshift({ type: 'added', text: b[j - 1] });
            j--;
        }
    }
    return { left, right };
}

function computeTextDiff(textA, textB) {
    const linesA = splitLines(textA);
    const linesB = splitLines(textB);
    const result = [];
    let leftLineNum = 1;
    let rightLineNum = 1;
    const maxLines = Math.max(linesA.length, linesB.length);
    for (let i = 0; i < maxLines; i++) {
        const la = linesA[i];
        const lb = linesB[i];
        if (la === undefined && lb !== undefined) {
            result.push({ type: 'added', leftLineNum: null, rightLineNum: rightLineNum++, leftContent: '', rightContent: lb, leftTokens: [], rightTokens: [{ type: 'added', text: lb }] });
        } else if (la !== undefined && lb === undefined) {
            result.push({ type: 'deleted', leftLineNum: leftLineNum++, rightLineNum: null, leftContent: la, rightContent: '', leftTokens: [{ type: 'deleted', text: la }], rightTokens: [] });
        } else if (la === lb) {
            result.push({ type: 'equal', leftLineNum: leftLineNum++, rightLineNum: rightLineNum++, leftContent: la, rightContent: lb, leftTokens: [{ type: 'equal', text: la }], rightTokens: [{ type: 'equal', text: lb }] });
        } else {
            const { left, right } = computeWordDiff(la || '', lb || '');
            result.push({ type: 'modified', leftLineNum: leftLineNum++, rightLineNum: rightLineNum++, leftContent: la, rightContent: lb, leftTokens: left, rightTokens: right });
        }
    }
    return result;
}

function renderToken(token) {
    if (token.type === 'deleted') return `<span class="token-deleted">${escapeHtml(token.text)}</span>`;
    if (token.type === 'added') return `<span class="token-added">${escapeHtml(token.text)}</span>`;
    return `<span>${escapeHtml(token.text)}</span>`;
}

function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function computeStats(diff) {
    let additions = 0, removals = 0, totalLeftLines = 0, totalRightLines = 0;
    diff.forEach(line => {
        if (line.leftLineNum) totalLeftLines++;
        if (line.rightLineNum) totalRightLines++;
        if (line.type === 'added') additions++;
        else if (line.type === 'deleted') removals++;
        else if (line.type === 'modified') {
            const addedWords = line.rightTokens.filter(t => t.type === 'added').length;
            const deletedWords = line.leftTokens.filter(t => t.type === 'deleted').length;
            if (addedWords > 0) additions++;
            if (deletedWords > 0) removals++;
        }
    });
    return { additions, removals, totalLeftLines, totalRightLines };
}

function renderTextDiff() {
    const { original, changed } = getTextInputs();
    const container = document.getElementById('textDiffResult');
    const statsEl = document.getElementById('textDiffStats');
    if (!container) return;

    if (!original && !changed) {
        container.innerHTML = '<div class="empty-state">양쪽 텍스트를 입력하면 차이점이 표시됩니다.</div>';
        if (statsEl) statsEl.textContent = '';
        return;
    }

    const diff = computeTextDiff(original, changed);
    const stats = computeStats(diff);
    if (statsEl) {
        statsEl.innerHTML = `<div>삭제: <strong style="color:#dc2626">${stats.removals}</strong></div><div>추가: <strong style="color:#16a34a">${stats.additions}</strong></div><div>Left: ${stats.totalLeftLines} lines</div><div>Right: ${stats.totalRightLines} lines</div>`;
    }

    if (textDiffViewMode === 'side-by-side') {
        const leftCol = diff.map((line, idx) => {
            const content = (line.leftTokens && line.leftTokens.length > 0)
                ? line.leftTokens.map(renderToken).join('')
                : escapeHtml(line.leftContent || '\u00A0');
            return `<div class="diff-line ${line.type}"><span class="gutter">${line.leftLineNum || ''}</span>${content}</div>`;
        }).join('');

        const rightCol = diff.map((line, idx) => {
            const content = (line.rightTokens && line.rightTokens.length > 0)
                ? line.rightTokens.map(renderToken).join('')
                : escapeHtml(line.rightContent || '\u00A0');
            return `<div class="diff-line ${line.type}"><span class="gutter">${line.rightLineNum || ''}</span>${content}</div>`;
        }).join('');

        container.classList.remove('diff-unified');
        container.innerHTML = `<div class="diff-grid"><div class="diff-col">${leftCol}</div><div class="diff-col">${rightCol}</div></div>`;
    } else {
        const unified = diff.map(line => {
            const leftNum = line.leftLineNum || '';
            const rightNum = line.rightLineNum || '';
            let content;
            if (line.type === 'added') content = line.rightTokens.map(renderToken).join('');
            else if (line.type === 'deleted') content = line.leftTokens.map(renderToken).join('');
            else if (line.type === 'equal') content = escapeHtml(line.leftContent || '');
            else content = `${line.leftTokens.map(renderToken).join('')}\n${line.rightTokens.map(renderToken).join('')}`;
            return `<div class="diff-line ${line.type}"><span class="gutter">${leftNum}</span><span class="gutter">${rightNum}</span><div>${content}</div></div>`;
        }).join('');
        container.classList.add('diff-unified');
        container.innerHTML = unified;
    }
}

function clearTextDiffTool() {
    const original = document.getElementById('textDiffOriginal');
    const changed = document.getElementById('textDiffChanged');
    const container = document.getElementById('textDiffResult');
    const statsEl = document.getElementById('textDiffStats');
    if (original) original.innerHTML = '';
    if (changed) changed.innerHTML = '';
    if (container) container.innerHTML = '<div class="empty-state">양쪽 텍스트를 입력하면 차이점이 표시됩니다.</div>';
    if (statsEl) statsEl.textContent = '';
    showStatus('텍스트 비교 입력이 초기화되었습니다.', 'success');
}
