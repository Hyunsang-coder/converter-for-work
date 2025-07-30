// === 도구 3: 마크다운 -> 엑셀 ===
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('markdownInput').addEventListener('input', function () {
        document.getElementById('markdownConvertBtn').disabled = !this.value.trim();
    });
});

function convertMarkdownToExcel() {
    const input = document.getElementById('markdownInput').value.trim();
    const preview = document.getElementById('markdownTablePreview');
    const copyBtn = document.getElementById('markdownCopyBtn');
    if (!input) {
        showStatus('변환할 마크다운을 입력해주세요.', 'error');
        return;
    }
    try {
        const lines = input.split('\n');
        let separatorIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (/^\|?\s*([:\-]{3,}\s*\|)+/.test(lines[i].trim())) {
                separatorIndex = i;
                break;
            }
        }

        if (separatorIndex === -1) throw new Error('유효한 마크다운 테이블 구분선을 찾을 수 없습니다.');

        const logicalRows = [];
        let currentRowLines = [];
        const contentLines = lines.filter((_, i) => i !== separatorIndex);

        for (const line of contentLines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('|')) {
                if (currentRowLines.length > 0) {
                    logicalRows.push(currentRowLines.join('\n'));
                }
                currentRowLines = [line];
            } else if (currentRowLines.length > 0) {
                currentRowLines.push(line);
            }
        }
        if (currentRowLines.length > 0) {
            logicalRows.push(currentRowLines.join('\n'));
        }
        if (logicalRows.length === 0) throw new Error('테이블 데이터를 찾을 수 없습니다.');

        const tableData = logicalRows.map(rowStr =>
            rowStr
                .replace(/^\||\|$/g, '')
                .split('|')
                .map(cell => cell.trim().replace(/<br\s*\/?>/gi, '\n'))
        );

        const headers = tableData[0] || [];
        const columnCount = headers.length;
        if (columnCount === 0) throw new Error('테이블 헤더에서 열을 찾을 수 없습니다.');

        const finalTableData = tableData.map(row => {
            while (row.length < columnCount) { row.push(''); }
            return row.slice(0, columnCount);
        });

        markdownTsvData = convertToSafeTSV(finalTableData);
        preview.innerHTML = createHtmlTable(finalTableData);
        copyBtn.disabled = false;
        showStatus(`🎉 ${finalTableData.length}행 ${columnCount}열 변환 완료!`, 'success');

    } catch (error) {
        showStatus('변환 실패: ' + error.message, 'error');
        preview.innerHTML = '<div class="empty-state">변환된 테이블이 여기에 표시됩니다.</div>';
        copyBtn.disabled = true;
        markdownTsvData = '';
    }
}

function clearMarkdownTool() {
    document.getElementById('markdownInput').value = '';
    document.getElementById('markdownTablePreview').innerHTML = '<div class="empty-state">변환된 테이블이 여기에 표시됩니다.</div>';
    document.getElementById('markdownCopyBtn').disabled = true;
    document.getElementById('markdownConvertBtn').disabled = true;
    markdownTsvData = '';
    showStatus('초기화되었습니다.', 'success');
}