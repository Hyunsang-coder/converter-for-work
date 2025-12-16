// === 도구 1: HTML -> 마크다운 (수정됨) ===
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('htmlInput').addEventListener('input', function () {
        document.getElementById('htmlConvertBtn').disabled = this.innerHTML.trim().length === 0;
    });
});

/**
 * HTML 테이블을 rowspan/colspan을 고려하여 2D 그리드 배열로 변환합니다.
 * 병합된 셀 영역은 병합 범위 전체에 동일한 텍스트를 채워, 각 행이 완전한 컨텍스트를 갖도록 합니다.
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

            // 병합 범위 전체에 텍스트를 채워 행/열 정보가 뒤섞이지 않도록 함
            for (let dr = 0; dr < rowSpan; dr++) {
                for (let dc = 0; dc < colSpan; dc++) {
                    const rr = r + dr;
                    if (!grid[rr]) grid[rr] = [];
                    grid[rr][c + dc] = text;
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

function convertHtmlToMarkdown() {
    const inputDiv = document.getElementById('htmlInput');
    const output = document.getElementById('htmlMarkdownOutput');
    const copyBtn = document.getElementById('htmlCopyBtn');
    if (inputDiv.innerHTML.trim().length === 0) {
        showStatus('변환할 내용이 없습니다.', 'error');
        return;
    }
    try {
        const markdown = domToMarkdown(inputDiv);
        output.value = markdown;
        copyBtn.disabled = !markdown;
        showStatus('🎉 마크다운 변환 완료!', 'success');
    } catch (error) {
        showStatus('변환 중 오류 발생: ' + error.message, 'error');
        copyBtn.disabled = true;
    }
}

function domToMarkdown(rootElement) {
    // New recursive parser for handling nested lists
    function processNode(node, depth = 0) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent.replace(/\s+/g, ' ').trim();
        }
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }

        const tagName = node.tagName.toLowerCase();
        let content = '';

        // Process children first
        node.childNodes.forEach(child => {
            content += processNode(child, depth);
        });

        switch (tagName) {
            case 'h1': return '# ' + content.trim() + '\n\n';
            case 'h2': return '## ' + content.trim() + '\n\n';
            case 'h3': return '### ' + content.trim() + '\n\n';
            case 'p': return content.trim() + '\n\n';
            case 'strong': case 'b': return `**${content.trim()}**`;
            case 'em': case 'i': return `*${content.trim()}*`;
            case 'br': return '\n'; // Treat <br> as a hard line break
            case 'ul':
            case 'ol':
                let listContent = '\n';
                Array.from(node.children).forEach((li, index) => {
                    if (li.tagName.toLowerCase() === 'li') {
                        listContent += processListItem(li, depth, tagName === 'ol', index);
                    }
                });
                return listContent;
            case 'table':
                // rowspan/colspan을 포함한 병합 테이블도 열/행이 뒤섞이지 않도록 그리드로 평면화하여 출력
                // (Markdown은 병합 셀을 지원하지 않음)
                {
                    const grid = tableToGrid(node);
                    if (!grid || grid.length === 0) return '\n';

                    const firstTr = node.querySelector('tr');
                    const hasHeader = !!firstTr && Array.from(firstTr.cells).some(c => c.tagName && c.tagName.toLowerCase() === 'th');
                    const colCount = Math.max(...grid.map(r => r.length));

                    const escapeForMarkdownTable = (cell) =>
                        String(cell || '')
                            .replace(/\n/g, '<br>')
                            .replace(/\|/g, '&#124;'); // markdown-to-excel split('|') 호환성

                    let tableMd = '\n';
                    const rowsToRender = grid.map(row => {
                        const normalized = row.slice(0, colCount);
                        while (normalized.length < colCount) normalized.push('');
                        return normalized.map(escapeForMarkdownTable);
                    });

                    const headerRow = rowsToRender[0] || [];
                    if (hasHeader) {
                        tableMd += `| ${headerRow.join(' | ')} |\n`;
                        tableMd += `|${' --- |'.repeat(colCount)}\n`;
                        rowsToRender.slice(1).forEach(r => {
                            tableMd += `| ${r.join(' | ')} |\n`;
                        });
                    } else {
                        rowsToRender.forEach(r => {
                            tableMd += `| ${r.join(' | ')} |\n`;
                        });
                    }

                    return tableMd + '\n';
                }
            default: return content;
        }
    }

    function processListItem(liNode, depth, isOrdered, index) {
        const indent = '  '.repeat(depth);
        const marker = isOrdered ? `${index + 1}. ` : '- ';

        let textContent = '';
        let nestedListContent = '';

        Array.from(liNode.childNodes).forEach(child => {
            if (child.nodeName.toLowerCase() === 'ul' || child.nodeName.toLowerCase() === 'ol') {
                nestedListContent += processNode(child, depth + 1);
            } else {
                textContent += processNode(child, depth);
            }
        });

        return `${indent}${marker}${textContent.trim()}${nestedListContent}\n`;
    }

    // Clean up the final output
    let markdown = processNode(rootElement, 0);
    return markdown.replace(/\n{3,}/g, '\n\n').trim();
}

function clearHtmlTool() {
    document.getElementById('htmlInput').innerHTML = '';
    document.getElementById('htmlMarkdownOutput').value = '';
    document.getElementById('htmlCopyBtn').disabled = true;
    document.getElementById('htmlConvertBtn').disabled = true;
    showStatus('초기화되었습니다.', 'success');
}