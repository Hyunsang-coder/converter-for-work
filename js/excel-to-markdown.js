// === 도구 2: 엑셀 -> 마크다운 ===
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('excelInput').addEventListener('paste', function (e) {
        e.preventDefault();
        const clipboardData = e.clipboardData;
        const htmlData = clipboardData.getData('text/html');
        const plainData = clipboardData.getData('text/plain');
        let parsedData = null;

        if (htmlData && htmlData.includes('<table')) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlData;
            const table = tempDiv.querySelector('table');
            if (table) {
                parsedData = Array.from(table.rows).map(row =>
                    Array.from(row.cells).map(cell => cleanCellContent(cell.innerHTML))
                );
            }
        }

        if (!parsedData && plainData) {
            parsedData = plainData.trim().split(/[\r\n]+/).map(row => row.split('\t'));
        }

        if (parsedData && parsedData.length > 0) {
            excelTableData = parsedData;
            this.innerHTML = createHtmlTable(excelTableData);
            document.getElementById('excelConvertBtn').disabled = false;
            showStatus('✨ 테이블 데이터를 성공적으로 붙여넣었습니다!', 'success');
        } else {
            this.textContent = plainData;
            showStatus('테이블 데이터를 찾지 못했습니다.', 'error');
        }
    });
});

function convertExcelToMarkdown() {
    const output = document.getElementById('excelMarkdownOutput');
    const copyBtn = document.getElementById('excelCopyBtn');
    const includeSeparator = document.getElementById('useFirstRowAsHeader')?.checked ?? true;
    if (!excelTableData || excelTableData.length === 0) {
        showStatus('변환할 테이블 데이터가 없습니다.', 'error');
        return;
    }
    try {
        const headerCount = excelTableData[0].length;
        let markdown = '';

        excelTableData.forEach((row, rowIndex) => {
            const processedRow = row.map(cell => String(cell || '').replace(/\n/g, '<br>'));
            while (processedRow.length < headerCount) { processedRow.push(''); }
            markdown += `| ${processedRow.slice(0, headerCount).join(' | ')} |\n`;
            if (includeSeparator && rowIndex === 0) {
                markdown += `|${' --- |'.repeat(headerCount)}\n`;
            }
        });

        output.value = markdown;
        copyBtn.disabled = false;
        showStatus('🎉 마크다운 테이블 변환 완료!', 'success');
    } catch (error) {
        showStatus('변환 중 오류 발생: ' + error.message, 'error');
        copyBtn.disabled = true;
    }
}

function clearExcelTool() {
    document.getElementById('excelInput').innerHTML = '';
    document.getElementById('excelMarkdownOutput').value = '';
    document.getElementById('excelCopyBtn').disabled = true;
    document.getElementById('excelConvertBtn').disabled = true;
    excelTableData = null;
    showStatus('초기화되었습니다.', 'success');
}