// === 도구 2: 엑셀 -> 마크다운 ===

/**
 * HTML 테이블을 rowspan/colspan을 고려하여 2D 그리드 배열로 변환합니다.
 * 병합된 셀 영역은 첫 번째 셀에만 텍스트가 들어가고 나머지는 빈 문자열로 채워집니다.
 * @param {HTMLTableElement} table - 변환할 HTML 테이블 요소
 * @returns {string[][]} 2D 배열 형태의 테이블 데이터
 */
function tableToGrid(table) {
    const grid = [];
    const rows = Array.from(table.rows);

    for (let r = 0; r < rows.length; r++) {
        if (!grid[r]) grid[r] = [];
        let c = 0;

        for (const cell of rows[r].cells) {
            // 이전 rowspan으로 점유된 칸이면 다음 빈 칸으로 이동
            while (grid[r][c] !== undefined) c++;

            const text = cleanCellContent(cell.innerHTML);
            const rowSpan = cell.rowSpan || 1;
            const colSpan = cell.colSpan || 1;

            // 병합 영역을 그리드에 채움
            for (let dr = 0; dr < rowSpan; dr++) {
                for (let dc = 0; dc < colSpan; dc++) {
                    const rr = r + dr;
                    if (!grid[rr]) grid[rr] = [];
                    // 병합된 첫 칸만 text, 나머지는 빈칸으로 자리 예약 (열 shift 방지)
                    grid[rr][c + dc] = (dr === 0 && dc === 0) ? text : '';
                }
            }
            c += colSpan;
        }
    }

    // 행 길이 정규화
    const maxCols = Math.max(...grid.map(row => row.length));
    for (const row of grid) {
        while (row.length < maxCols) row.push('');
    }
    return grid;
}

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
                parsedData = tableToGrid(table);
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
            const processedRow = row.map(cell => 
                String(cell || '')
                    .replace(/\n/g, '<br>')
                    .replace(/\|/g, '&#124;')  // 파이프 문자 이스케이프 (markdown-to-excel 호환성)
            );
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