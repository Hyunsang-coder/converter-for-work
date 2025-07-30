// === 도구 1: HTML -> 마크다운 (수정됨) ===
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('htmlInput').addEventListener('input', function () {
        document.getElementById('htmlConvertBtn').disabled = this.innerHTML.trim().length === 0;
    });
});

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
                let tableMd = '\n';
                const headers = Array.from(node.querySelectorAll('th')).map(th => cleanCellContent(th.innerHTML).replace(/\n/g, '<br>'));
                if (headers.length > 0) {
                    tableMd += `| ${headers.join(' | ')} |\n`;
                    tableMd += `|${' --- |'.repeat(headers.length)}\n`;
                }
                const rows = node.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const cells = Array.from(row.cells).map(td => cleanCellContent(td.innerHTML).replace(/\n/g, '<br>'));
                    tableMd += `| ${cells.join(' | ')} |\n`;
                });
                return tableMd + '\n';
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