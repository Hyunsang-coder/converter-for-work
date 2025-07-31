// === 도구 4: PPT -> 마크다운 ===
document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('pptFileInput');
    const convertBtn = document.getElementById('pptConvertBtn');
    const fileInfo = document.getElementById('pptFileInfo');

    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            fileInfo.textContent = `선택된 파일: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            convertBtn.disabled = false;
        } else {
            fileInfo.textContent = '';
            convertBtn.disabled = true;
        }
    });
});

async function convertPptToMarkdown() {
    const fileInput = document.getElementById('pptFileInput');
    const output = document.getElementById('pptMarkdownOutput');
    const copyBtn = document.getElementById('pptCopyBtn');
    
    if (!fileInput.files[0]) {
        showStatus('PPT 파일을 선택해주세요.', 'error');
        return;
    }

    const file = fileInput.files[0];
    
    // 파일 형식 확인
    if (!file.name.toLowerCase().endsWith('.pptx')) {
        showStatus('현재 .pptx 파일만 지원됩니다.', 'error');
        return;
    }

    try {
        showStatus('PPT 파일을 분석하고 있습니다...', 'info');
        
        // pptxtojson 라이브러리 사용 가능 여부 확인
        if (typeof pptxtojson === 'undefined') {
            throw new Error('PPT 파서 라이브러리가 로드되지 않았습니다.');
        }

        // 파일을 ArrayBuffer로 읽기
        const arrayBuffer = await readFileAsArrayBuffer(file);
        
        // pptxtojson으로 PPT 파싱 - 라이브러리 API에 맞게 수정
        let slideData;
        
        // 다양한 가능한 API 패턴 시도
        if (typeof pptxtojson.parse === 'function') {
            slideData = await pptxtojson.parse(arrayBuffer);
        } else if (typeof pptxtojson.default === 'function') {
            slideData = await pptxtojson.default(arrayBuffer);
        } else if (typeof pptxtojson === 'function') {
            slideData = await pptxtojson(arrayBuffer);
        } else if (pptxtojson.fromArrayBuffer && typeof pptxtojson.fromArrayBuffer === 'function') {
            slideData = await pptxtojson.fromArrayBuffer(arrayBuffer);
        } else if (pptxtojson.convert && typeof pptxtojson.convert === 'function') {
            slideData = await pptxtojson.convert(arrayBuffer);
        } else {
            // 라이브러리 구조 확인을 위한 디버깅
            const availableMethods = Object.keys(pptxtojson).filter(key => typeof pptxtojson[key] === 'function');
            throw new Error(`PPT 파서 라이브러리의 올바른 함수를 찾을 수 없습니다. 사용 가능한 메소드: ${availableMethods.join(', ')}`);
        }
        
        // 슬라이드 데이터를 마크다운으로 변환
        const markdown = convertSlidesToMarkdown(slideData);
        
        output.value = markdown;
        copyBtn.disabled = false;
        showStatus(`✅ PPT 파일이 성공적으로 변환되었습니다.`, 'success');
        
    } catch (error) {
        console.error('PPT 변환 오류:', error);
        
        // 에러 발생 시 대안 방법 안내
        const errorMessage = `# PPT 변환 중 오류 발생

**오류 내용:** ${error.message}

## 🎯 **대안 방법들**

### **1) PowerPoint에서 직접 복사 (가장 간단)**
1. PowerPoint에서 슬라이드 내용 선택 (Ctrl+A)
2. 복사 (Ctrl+C) 
3. 아래 '웹페이지 → 마크다운' 탭에서 붙여넣기
4. 마크다운으로 변환

### **2) PowerPoint → 텍스트 파일 저장**
1. PowerPoint에서 '파일' → '다른 이름으로 저장'
2. 파일 형식: '일반 텍스트 (*.txt)' 선택
3. 저장된 텍스트를 수동으로 마크다운 형식으로 정리

### **3) 온라인 변환 서비스 이용**
- **Pandoc** (pandoc.org): 명령줄 도구
- **CloudConvert**: 온라인 PPT → 텍스트 변환
- **Zamzar**: PPT → TXT 변환 후 수동 정리

### **4) PowerPoint → Word → 마크다운**
1. PowerPoint에서 '파일' → '내보내기' → 'Word 문서로 내보내기'
2. Word에서 텍스트만 복사
3. '웹페이지 → 마크다운' 탭에서 변환

## 🔧 **개발자용 서버 솔루션**
\`\`\`python
# Python + python-pptx 라이브러리 사용
from pptx import Presentation

def ppt_to_markdown(ppt_file):
    prs = Presentation(ppt_file)
    markdown = "# PowerPoint 변환 결과\\n\\n"
    
    for i, slide in enumerate(prs.slides, 1):
        markdown += f"## 슬라이드 {i}\\n\\n"
        for shape in slide.shapes:
            if hasattr(shape, "text") and shape.text:
                markdown += f"{shape.text}\\n\\n"
        markdown += "---\\n\\n"
    
    return markdown
\`\`\`

**가장 빠른 해결책은 PowerPoint에서 직접 텍스트를 복사해서 '웹페이지 → 마크다운' 탭을 이용하는 것입니다.**
`;

        output.value = errorMessage;
        copyBtn.disabled = false;
        showStatus('❌ PPT 변환 실패 - 대안 방법을 확인하세요', 'error');
    }
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('파일 읽기 실패'));
        reader.readAsArrayBuffer(file);
    });
}

function convertSlidesToMarkdown(slideData) {
    // 다양한 데이터 구조 처리
    let slides = [];
    
    if (Array.isArray(slideData)) {
        slides = slideData;
    } else if (slideData && slideData.slides && Array.isArray(slideData.slides)) {
        slides = slideData.slides;
    } else if (slideData && slideData.presentation && Array.isArray(slideData.presentation.slides)) {
        slides = slideData.presentation.slides;
    } else if (slideData && typeof slideData === 'object') {
        // 객체에서 슬라이드 배열 찾기
        const keys = Object.keys(slideData);
        for (const key of keys) {
            if (Array.isArray(slideData[key]) && slideData[key].length > 0) {
                slides = slideData[key];
                break;
            }
        }
    }

    if (!Array.isArray(slides) || slides.length === 0) {
        throw new Error('PPT 파일에서 슬라이드를 찾을 수 없습니다.');
    }

    let markdown = `# PowerPoint 변환 결과\n\n`;
    markdown += `총 ${slides.length}개의 슬라이드\n\n`;
    markdown += `---\n\n`;

    slides.forEach((slide, index) => {
        markdown += `## 슬라이드 ${index + 1}\n\n`;
        
        // 제목 추출 (다양한 필드명 지원)
        const title = slide.title || slide.name || slide.slideTitle || slide.header;
        if (title && typeof title === 'string' && title.trim()) {
            markdown += `### ${title.trim()}\n\n`;
        }
        
        // 텍스트 콘텐츠 추출
        let textContent = [];
        
        // 다양한 텍스트 필드 확인
        if (slide.content && Array.isArray(slide.content)) {
            slide.content.forEach(item => {
                textContent.push(...extractTextFromItem(item));
            });
        } else if (slide.textContent && Array.isArray(slide.textContent)) {
            slide.textContent.forEach(item => {
                textContent.push(...extractTextFromItem(item));
            });
        } else if (slide.shapes && Array.isArray(slide.shapes)) {
            slide.shapes.forEach(shape => {
                textContent.push(...extractTextFromItem(shape));
            });
        } else if (slide.text && typeof slide.text === 'string') {
            textContent.push(slide.text);
        } else if (slide.texts && Array.isArray(slide.texts)) {
            textContent = textContent.concat(slide.texts.filter(t => typeof t === 'string'));
        }
        
        // 텍스트가 없으면 객체의 모든 문자열 값 수집
        if (textContent.length === 0 && typeof slide === 'object') {
            textContent = extractAllStrings(slide);
        }
        
        // 마크다운으로 변환
        if (textContent.length > 0) {
            textContent.forEach(text => {
                if (text && typeof text === 'string' && text.trim()) {
                    const cleanText = text.trim();
                    // 간단한 목록 처리
                    if (cleanText.includes('\n• ') || cleanText.includes('\n- ')) {
                        const lines = cleanText.split('\n');
                        lines.forEach(line => {
                            const trimmedLine = line.trim();
                            if (trimmedLine.startsWith('• ') || trimmedLine.startsWith('- ')) {
                                markdown += `- ${trimmedLine.substring(2)}\n`;
                            } else if (trimmedLine) {
                                markdown += `${trimmedLine}\n\n`;
                            }
                        });
                    } else {
                        markdown += `${cleanText}\n\n`;
                    }
                }
            });
        } else {
            markdown += `_이 슬라이드에는 텍스트 내용이 없습니다._\n\n`;
        }
        
        // 슬라이드 구분선
        if (index < slides.length - 1) {
            markdown += `---\n\n`;
        }
    });

    return markdown.trim();
}

function extractTextFromItem(item) {
    const texts = [];
    
    if (typeof item === 'string') {
        // 이상한 문자들 필터링
        const cleanText = cleanTextContent(item);
        if (cleanText) {
            texts.push(cleanText);
        }
    } else if (item && typeof item === 'object') {
        // 테이블 처리 (다양한 형태 지원)
        if (isTableObject(item)) {
            const markdownTable = convertToMarkdownTable(item);
            if (markdownTable) {
                texts.push(markdownTable);
                return texts; // 테이블을 찾았으면 다른 텍스트는 무시
            }
        }
        
        // 다양한 텍스트 필드 확인
        if (item.text && typeof item.text === 'string') {
            const cleanText = cleanTextContent(item.text);
            if (cleanText) texts.push(cleanText);
        }
        if (item.content && typeof item.content === 'string') {
            const cleanText = cleanTextContent(item.content);
            if (cleanText) texts.push(cleanText);
        }
        if (item.value && typeof item.value === 'string') {
            const cleanText = cleanTextContent(item.value);
            if (cleanText) texts.push(cleanText);
        }
        
        // 목록 처리
        if (item.type === 'list' && item.items && Array.isArray(item.items)) {
            item.items.forEach(listItem => {
                if (typeof listItem === 'string') {
                    const cleanText = cleanTextContent(listItem);
                    if (cleanText) texts.push(`• ${cleanText}`);
                } else if (listItem && listItem.text) {
                    const cleanText = cleanTextContent(listItem.text);
                    if (cleanText) texts.push(`• ${cleanText}`);
                }
            });
        }
        
        // 중첩된 배열 처리
        if (item.texts && Array.isArray(item.texts)) {
            item.texts.forEach(subItem => {
                texts.push(...extractTextFromItem(subItem));
            });
        }
        
        // shapes 배열 처리 (테이블이 여기 있을 수 있음)
        if (item.shapes && Array.isArray(item.shapes)) {
            item.shapes.forEach(shape => {
                texts.push(...extractTextFromItem(shape));
            });
        }
    }
    
    return texts;
}

// 텍스트 내용 정리 함수 - HTML 태그 제거 및 정리
function cleanTextContent(text) {
    if (!text || typeof text !== 'string') return '';
    
    // HTML 태그에서 텍스트만 추출
    let cleaned = extractTextFromHTML(text);
    
    // 이미지 관련 텍스트 무시
    const imagePatterns = [
        /^image\d+/i,
        /\.jpg$/i, /\.jpeg$/i, /\.png$/i, /\.gif$/i, /\.bmp$/i,
        /picture\d+/i,
        /^rId\d+$/,
        /^slide\d+\.xml$/i
    ];
    
    for (const pattern of imagePatterns) {
        if (pattern.test(cleaned.trim())) {
            return '';
        }
    }
    
    // SVG Path 데이터 제거 (가장 흔한 노이즈)
    const svgPathPatterns = [
        /^M\s*[\d\s.,L]+$/i, // SVG path commands (M, L 등)
        /^M\s*[\d\s.,LQZ]+$/i, // 더 복잡한 SVG path (Q, Z 포함)
        /^M[\d\s.,LQCZ]+z?$/i, // 완전한 SVG path
        /^[MLQ]\s*[\d\s.,]+[Zz]?$/i // 간단한 SVG 명령어들
    ];
    
    for (const pattern of svgPathPatterns) {
        if (pattern.test(cleaned.trim())) {
            return '';
        }
    }
    
    // PowerPoint 도형 및 스타일/메타데이터 제거
    const metadataPatterns = [
        /^color$/i,
        /^solid$/i,
        /^shape$/i,
        /^rect$/i,
        /^line$/i,
        /^text$/i,
        /^up$/i,
        /^mid$/i,
        /^roundRect$/i, // PowerPoint 도형 타입
        /^chevron$/i, // PowerPoint 도형 타입
        /^arrow$/i, // PowerPoint 도형 타입
        /^oval$/i, // PowerPoint 도형 타입
        /^table$/i, // 테이블 메타데이터 (실제 테이블 데이터와 구분)
        /^#[0-9a-f]{6,8}$/i, // 색상 코드
        /^TextBox\s+\d+$/i,
        /^직사각형\s*:?\s*(둥근\s*모서리\s*\d+)?$/i, // 한국어 도형 설명
        /^화살표\s*:?\s*(갈매기형\s*수장\s*\d+)?$/i, // 한국어 화살표 설명
        /^직선\s+연결선\s+\d+$/i,
        /^사각형\s*:?\s*둥근\s*모서리\s*\d+$/i
    ];
    
    for (const pattern of metadataPatterns) {
        if (pattern.test(cleaned.trim())) {
            return '';
        }
    }
    
    // 이상한 숫자/문자 조합 제거 (PowerPoint 내부 코드)
    cleaned = cleaned
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 제어 문자 제거
        .replace(/^[a-zA-Z]\d+$/g, '') // 단일 문자 + 숫자 (예: a1, B23)
        .replace(/^\d+[a-zA-Z]+\d*$/g, '') // 숫자 + 문자 조합
        .replace(/^[0-9a-fA-F]{8,}$/g, '') // 긴 16진수 문자열
        .replace(/^_x[0-9a-fA-F]+_$/g, '') // PowerPoint 내부 참조
        .replace(/&nbsp;/g, ' ') // HTML non-breaking space
        .replace(/\s+/g, ' ') // 여러 공백을 하나로
        .trim();
    
    // 너무 짧은 의미없는 텍스트 제거
    if (cleaned.length < 3) return '';
    
    // 숫자만 있는 경우도 제거 (테이블 데이터가 아닌 경우)
    if (/^\d+\.?\d*$/.test(cleaned) && cleaned.length < 4) return '';
    
    // 의미 있는 퍼센트 값은 유지 (예: 14%, 15%)
    if (/^\d{1,3}%$/.test(cleaned)) return cleaned;
    
    return cleaned;
}

// HTML 태그에서 텍스트만 추출
function extractTextFromHTML(htmlString) {
    if (!htmlString || typeof htmlString !== 'string') return '';
    
    // HTML 태그가 없으면 그대로 반환
    if (!htmlString.includes('<')) return htmlString;
    
    try {
        // 임시 DOM 요소 생성해서 텍스트만 추출
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
        
        // 모든 텍스트 노드에서 텍스트 추출
        let textContent = tempDiv.textContent || tempDiv.innerText || '';
        
        // <br>, <p> 태그를 줄바꿈으로 처리
        textContent = htmlString
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<[^>]*>/g, ' ') // 모든 HTML 태그 제거
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, ' ')
            .trim();
        
        return textContent;
    } catch (error) {
        // HTML 파싱 실패시 태그만 간단히 제거
        return htmlString
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
}

// 테이블 객체인지 확인
function isTableObject(item) {
    if (!item || typeof item !== 'object') return false;
    
    // 다양한 테이블 형태 확인
    return (
        (item.type === 'table') ||
        (item.table && typeof item.table === 'object') ||
        (item.rows && Array.isArray(item.rows)) ||
        (item.tbl && typeof item.tbl === 'object') ||
        (item.grid && Array.isArray(item.grid)) ||
        (item.cells && Array.isArray(item.cells))
    );
}

// 테이블을 마크다운으로 변환
function convertToMarkdownTable(tableObj) {
    let rows = [];
    
    // 다양한 테이블 구조에서 행 데이터 추출
    if (tableObj.rows && Array.isArray(tableObj.rows)) {
        rows = tableObj.rows;
    } else if (tableObj.table && tableObj.table.rows) {
        rows = tableObj.table.rows;
    } else if (tableObj.tbl && tableObj.tbl.rows) {
        rows = tableObj.tbl.rows;
    } else if (tableObj.grid && Array.isArray(tableObj.grid)) {
        rows = tableObj.grid;
    } else if (tableObj.cells && Array.isArray(tableObj.cells)) {
        // cells 배열을 행으로 재구성
        const cellsPerRow = Math.ceil(Math.sqrt(tableObj.cells.length));
        for (let i = 0; i < tableObj.cells.length; i += cellsPerRow) {
            rows.push(tableObj.cells.slice(i, i + cellsPerRow));
        }
    }
    
    if (!rows || rows.length === 0) return null;
    
    // 테이블 데이터 처리
    const processedRows = [];
    let maxCols = 0;
    
    rows.forEach(row => {
        let cells = [];
        
        if (Array.isArray(row)) {
            cells = row;
        } else if (row.cells && Array.isArray(row.cells)) {
            cells = row.cells;
        } else if (row.c && Array.isArray(row.c)) {
            cells = row.c;
        } else if (typeof row === 'object') {
            // 객체의 값들을 셀로 처리
            cells = Object.values(row);
        }
        
        const processedCells = cells.map(cell => {
            let cellText = '';
            
            if (typeof cell === 'string') {
                cellText = cleanTextContent(cell);
            } else if (cell && typeof cell === 'object') {
                // 셀 내 텍스트 추출
                if (cell.text) cellText = cleanTextContent(cell.text);
                else if (cell.value) cellText = cleanTextContent(cell.value);
                else if (cell.content) cellText = cleanTextContent(cell.content);
                else if (cell.v) cellText = cleanTextContent(cell.v);
                else {
                    // 객체의 문자열 값들 수집
                    const strings = extractAllStrings(cell).filter(s => cleanTextContent(s));
                    cellText = strings.join(' ');
                }
            }
            
            return cellText || '';
        });
        
        if (processedCells.some(cell => cell.length > 0)) {
            processedRows.push(processedCells);
            maxCols = Math.max(maxCols, processedCells.length);
        }
    });
    
    if (processedRows.length === 0 || maxCols === 0) return null;
    
    // 모든 행을 같은 열 수로 맞춤
    processedRows.forEach(row => {
        while (row.length < maxCols) {
            row.push('');
        }
    });
    
    // 마크다운 테이블 생성
    let markdownTable = '\n';
    
    // 첫 번째 행 (헤더로 처리)
    if (processedRows.length > 0) {
        const headerRow = processedRows[0].map(cell => cell || '').join(' | ');
        markdownTable += `| ${headerRow} |\n`;
        
        // 구분선
        const separator = Array(maxCols).fill('---').join(' | ');
        markdownTable += `| ${separator} |\n`;
        
        // 나머지 행들
        for (let i = 1; i < processedRows.length; i++) {
            const dataRow = processedRows[i].map(cell => cell || '').join(' | ');
            markdownTable += `| ${dataRow} |\n`;
        }
    }
    
    markdownTable += '\n';
    return markdownTable;
}

function extractAllStrings(obj) {
    const strings = [];
    
    if (typeof obj === 'string') {
        const cleanText = cleanTextContent(obj);
        if (cleanText) {
            strings.push(cleanText);
        }
    } else if (Array.isArray(obj)) {
        obj.forEach(item => {
            strings.push(...extractAllStrings(item));
        });
    } else if (obj && typeof obj === 'object') {
        // 이미지 관련 객체는 건너뛰기
        if (obj.type === 'image' || obj.image || obj.picture || obj.blip) {
            return strings;
        }
        
        Object.values(obj).forEach(value => {
            strings.push(...extractAllStrings(value));
        });
    }
    
    return strings;
}

function clearPptTool() {
    const fileInput = document.getElementById('pptFileInput');
    const output = document.getElementById('pptMarkdownOutput');
    const copyBtn = document.getElementById('pptCopyBtn');
    const convertBtn = document.getElementById('pptConvertBtn');
    const fileInfo = document.getElementById('pptFileInfo');
    
    fileInput.value = '';
    output.value = '';
    fileInfo.textContent = '';
    copyBtn.disabled = true;
    convertBtn.disabled = true;
    clearStatus();
}