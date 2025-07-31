# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web-based multi-format converter tool for PUBG translation work, providing four conversion utilities:
1. Web content (HTML) to Markdown
2. Excel tables to Markdown tables
3. Markdown tables to Excel format (TSV)
4. PowerPoint presentations to Markdown

The application is a single-page HTML application with vanilla JavaScript modules, no build system required.

## Development Commands

### Local Development Server
```bash
# Python 3 (recommended)
python -m http.server 8000

# Then access at http://localhost:8000
```

### File Structure
- `index.html` - Main application entry point
- `styles.css` - All CSS styling with CSS custom properties
- `js/common.js` - Shared utilities and global functions
- `js/html-to-markdown.js` - HTML to Markdown conversion logic
- `js/excel-to-markdown.js` - Excel to Markdown table conversion
- `js/markdown-to-excel.js` - Markdown to Excel (TSV) conversion
- `js/pptxtojson.min.js` - Third-party PowerPoint parsing library
- `js/ppt-to-markdown.js` - PowerPoint to Markdown conversion (loads after library)
- `asset/icon/pubg_logo.png` - Application logo

## Architecture

### Core Design Patterns
- **Tab-based UI**: Single page with four conversion tools accessed via tabs
- **Modular JavaScript**: Each conversion tool is a separate module with shared utilities
- **Real-time Validation**: Input validation and button state management
- **Clipboard Integration**: All outputs can be copied to clipboard for easy workflow

### JavaScript Module Structure
- `common.js` loads first, provides shared functions:
  - `switchTool()` - Tab navigation
  - `showStatus()` - User feedback system
  - `copyToClipboard()` - Clipboard operations
  - `createHtmlTable()` - HTML table generation
  - `convertToSafeTSV()` - TSV formatting with Excel compatibility
  - `cleanCellContent()` - HTML content sanitization

### Data Flow
1. User inputs content via contentEditable divs, textareas, or file upload
2. JavaScript modules parse and convert data formats
3. Results displayed in readonly textareas or HTML table previews
4. Copy-to-clipboard functionality for seamless workflow integration

### UI State Management
- Each tool has independent state (enabled/disabled buttons based on input)
- Global `currentTool` variable tracks active tab
- Status system provides user feedback with auto-dismissing messages
- Input validation prevents conversion attempts on empty content

## Korean Language Support
The application is designed for Korean PUBG translators with Korean UI text. All user-facing messages, placeholders, and button labels are in Korean.

## File Dependencies
PowerPoint conversion requires `pptxtojson.min.js` to load before `ppt-to-markdown.js`. All other modules can load in any order after `common.js`.