// --- 전역 변수 ---
let currentTool = 1;
let excelTableData = null;
let markdownTsvData = '';

// --- 탭 전환 ---
function switchTool(toolNumber) {
    document.querySelectorAll('.tool-content').forEach(tool => tool.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(tab => tab.classList.remove('active'));
    document.getElementById(`tool-${toolNumber}`).classList.add('active');
    const activeTab = document.querySelector(`.tab-btn.tab-${toolNumber}`);
    if (activeTab) activeTab.classList.add('active');
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

// --- OS 감지 및 단축키 설정 ---
const isMac = navigator.userAgent.indexOf('Mac') !== -1;
const modifierKey = isMac ? 'metaKey' : 'ctrlKey';

// 페이지 로드 시 단축키 표시 업데이트
document.addEventListener('DOMContentLoaded', function () {
    updateShortcutHints();
    updateLastUpdatedFromGitHub();
});

/**
 * GitHub API를 통해 마지막 커밋 날짜를 가져와 업데이트합니다.
 */
async function updateLastUpdatedFromGitHub() {
    const dateElement = document.getElementById('lastUpdatedDate');
    if (!dateElement) return;

    try {
        const response = await fetch('https://api.github.com/repos/Hyunsang-coder/converter-for-work/commits?per_page=1');
        if (!response.ok) throw new Error('GitHub API response not ok');

        const commits = await response.json();
        if (commits && commits.length > 0) {
            const lastCommitDate = new Date(commits[0].commit.committer.date);
            const formattedDate = lastCommitDate.toISOString().split('T')[0];
            dateElement.textContent = `last updated: ${formattedDate}`;
        }
    } catch (error) {
        console.error('Failed to fetch last updated date from GitHub:', error);
        // API 호출 실패 시 기존에 적혀있는 날짜를 그대로 둡니다.
    }
}

function updateShortcutHints() {
    const shortcuts = document.querySelectorAll('.shortcut-hint');
    shortcuts.forEach((hint, index) => {
        const key = (index % 3) + 1; // 1, 2, 3 순서로 할당
        hint.textContent = `⌘+${key} / Ctrl+${key}`;
    });
}

// --- 키보드 단축키 ---
document.addEventListener('keydown', function (e) {
    // Cmd/Ctrl+1: 현재 도구의 변환 실행
    if ((isMac ? e.metaKey : e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        executeCurrentToolConversion();
    }

    // Cmd/Ctrl+2: 현재 도구의 결과를 클립보드에 복사
    if ((isMac ? e.metaKey : e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        copyCurrentOutput();
    }

    // Cmd/Ctrl+3: 현재 도구 초기화
    if ((isMac ? e.metaKey : e.ctrlKey) && e.key === '3') {
        e.preventDefault();
        clearCurrentTool();
    }
});

// 현재 활성화된 도구의 변환 기능 실행
function executeCurrentToolConversion() {
    switch (currentTool) {
        case 1:
            if (typeof convertHtmlToMarkdown === 'function') {
                convertHtmlToMarkdown();
            }
            break;
        case 2:
            if (typeof convertExcelToMarkdown === 'function') {
                convertExcelToMarkdown();
            }
            break;
        case 3:
            if (typeof convertMarkdownToExcel === 'function') {
                convertMarkdownToExcel();
            }
            break;
        case 4:
            if (typeof renderTextDiff === 'function') {
                renderTextDiff();
            }
            break;
        default:
            showStatus('알 수 없는 도구입니다.', 'error');
    }
}

// 현재 도구의 출력을 클립보드에 복사
function copyCurrentOutput() {
    let outputElement;
    let toolName;

    switch (currentTool) {
        case 1:
            outputElement = document.getElementById('htmlMarkdownOutput');
            toolName = 'HTML → Markdown';
            break;
        case 2:
            outputElement = document.getElementById('excelMarkdownOutput');
            toolName = 'Excel → Markdown';
            break;
        case 3:
            outputElement = document.getElementById('markdownExcelOutput');
            toolName = 'Markdown → Excel';
            break;
        case 4:
            showStatus('텍스트 비교 도구에는 복사 기능이 없습니다.', 'error');
            return;
        default:
            showStatus('현재 도구를 찾을 수 없습니다.', 'error');
            return;
    }

    if (outputElement && outputElement.value) {
        copyToClipboard(outputElement.value);
        showStatus(`📋 ${toolName} 결과가 클립보드에 복사되었습니다!`, 'success');
    } else {
        showStatus('복사할 결과가 없습니다. 먼저 변환을 실행해주세요.', 'error');
    }
}

// 현재 도구 초기화
function clearCurrentTool() {
    switch (currentTool) {
        case 1:
            if (typeof clearHtmlTool === 'function') {
                clearHtmlTool();
            }
            break;
        case 2:
            if (typeof clearExcelTool === 'function') {
                clearExcelTool();
            }
            break;
        case 3:
            if (typeof clearMarkdownTool === 'function') {
                clearMarkdownTool();
            }
            break;
        case 4:
            if (typeof clearTextDiffTool === 'function') {
                clearTextDiffTool();
            }
            break;
        default:
            showStatus('초기화할 도구를 찾을 수 없습니다.', 'error');
    }
}