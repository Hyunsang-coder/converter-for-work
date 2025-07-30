// --- 전역 변수 ---
let currentTool = 1;
let excelTableData = null;
let markdownTsvData = '';

// --- 탭 전환 ---
function switchTool(toolNumber) {
    document.querySelectorAll('.tool-content').forEach(tool => tool.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(tab => tab.classList.remove('active'));
    document.getElementById(`tool-${toolNumber}`).classList.add('active');
    document.querySelector(`.tab-btn.tab-${toolNumber}`).classList.add('active');
    currentTool = toolNumber;
    clearStatus();
}

// --- 공용 함수 ---
function showStatus(message, type = 'info', duration = 3000) {
    const statusDiv = document.getElementById('status');
    if (!statusDiv) return;
    statusDiv.textContent = message;
    statusDiv.className = `status ${type} show`;
    setTimeout(() => statusDiv.classList.remove('show'), duration);
}

function clearStatus() {
    const statusDiv = document.getElementById('status');
    if (statusDiv) statusDiv.classList.remove('show');
}

function copyToClipboard(textToCopy) {
    if (!textToCopy) {
        showStatus('복사할 내용이 없습니다.', 'error');
        return;
    }
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand('copy');
        const msg = successful ? '📋 클립보드에 복사되었습니다!' : '복사에 실패했습니다.';
        const type = successful ? 'success' : 'error';
        showStatus(msg, type);
    } catch (err) {
        showStatus('복사에 실패했습니다.', 'error');
    }
    document.body.removeChild(textArea);
}

function createHtmlTable(data, hasHeader = true) {
    if (!data || data.length === 0) return '<div class="empty-state">테이블 데이터 없음</div>';
    let table = '<table>';
    const headerCount = data[0].length;

    if (hasHeader) {
        // 헤더가 있는 경우: 첫 번째 행을 헤더로 처리
        table += '<thead><tr>';
        data[0].forEach(header => table += `<th>${(header || '').replace(/\n/g, '<br>')}</th>`);
        table += '</tr></thead><tbody>';
        data.slice(1).forEach(row => {
            table += '<tr>';
            for (let i = 0; i < headerCount; i++) {
                table += `<td>${(row[i] || '').replace(/\n/g, '<br>')}</td>`;
            }
            table += '</tr>';
        });
        table += '</tbody>';
    } else {
        // 헤더가 없는 경우: 모든 행을 데이터로 처리
        table += '<tbody>';
        data.forEach(row => {
            table += '<tr>';
            for (let i = 0; i < headerCount; i++) {
                table += `<td>${(row[i] || '').replace(/\n/g, '<br>')}</td>`;
            }
            table += '</tr>';
        });
        table += '</tbody>';
    }

    table += '</table>';
    return table;
}

/**
 * 데이터를 Excel에 안전하게 붙여넣을 수 있는 TSV 형식으로 변환합니다.
 * 셀에 줄바꿈이나 큰따옴표가 있으면 셀을 큰따옴표로 감쌉니다.
 * @param {string[][]} data - 2D 배열 형태의 테이블 데이터
 * @returns {string} TSV 형식의 문자열
 */
function convertToSafeTSV(data) {
    return data.map(row => {
        return row.map(cell => {
            let cellStr = String(cell || '');
            if (cellStr.includes('\n') || cellStr.includes('\t') || cellStr.includes('"')) {
                cellStr = cellStr.replace(/"/g, '""');
                return `"${cellStr}"`;
            }
            return cellStr;
        }).join('\t');
    }).join('\n');
}

/**
 * HTML 셀 내용에서 순수 텍스트와 줄바꿈만 추출하는 정제 함수 (수정됨)
 * @param {string} html - 셀의 innerHTML
 * @returns {string} 정제된 텍스트
 */
function cleanCellContent(html) {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.whiteSpace = 'nowrap';
    html = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);

    let text = tempDiv.innerText || tempDiv.textContent;

    document.body.removeChild(tempDiv);
    return text.trim();
}