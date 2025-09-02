# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web-based multi-format converter tool for PUBG translation work, providing four conversion utilities:
1. Web content (HTML) to Markdown
2. Excel tables to Markdown tables
3. Markdown tables to Excel format (TSV)
4. Text comparison with side-by-side and unified diff views

The application is a single-page HTML application with vanilla JavaScript modules, no build system required.

## Development Commands

### Local Development Server
```bash
# Python 3 (recommended)
python -m http.server 8000

# Then access at http://localhost:8000
```

### Development Workflow
- No build system required - direct file editing
- Test changes by refreshing browser
- All code is vanilla JavaScript ES6+ with DOM APIs

### File Structure
- `index.html` - Main application entry point
- `styles.css` - All CSS styling with CSS custom properties
- `js/common.js` - Shared utilities and global functions
- `js/html-to-markdown.js` - HTML to Markdown conversion logic
- `js/excel-to-markdown.js` - Excel to Markdown table conversion
- `js/markdown-to-excel.js` - Markdown to Excel (TSV) conversion
- `js/text-diff.js` - Text comparison with word-level diff visualization
- `js/pptxtojson.min.js` - Third-party PowerPoint parsing library (not currently loaded)
- `js/ppt-to-markdown.js` - PowerPoint to Markdown conversion (not currently used)
- `asset/icon/pubg_logo.png` - Application logo

## Architecture

### Core Design Patterns
- **Tab-based UI**: Single page with four tools accessed via sidebar navigation
- **Modular JavaScript**: Each tool is a separate module with shared utilities in `common.js`
- **Real-time Processing**: Live input validation and immediate diff visualization
- **Clipboard Integration**: All outputs can be copied to clipboard for easy workflow
- **Cross-platform Shortcuts**: Keyboard shortcuts work with both Cmd (Mac) and Ctrl (Windows/Linux)

### JavaScript Module Structure
- `common.js` loads first, provides shared functions:
  - `switchTool()` - Tab navigation
  - `showStatus()` - User feedback system with auto-dismissing messages
  - `copyToClipboard()` - Cross-browser clipboard operations using execCommand
  - `createHtmlTable()` - HTML table generation with optional header support
  - `convertToSafeTSV()` - TSV formatting with Excel compatibility (handles quotes, newlines)
  - `cleanCellContent()` - HTML content sanitization using temporary DOM elements
  - Cross-platform keyboard shortcuts (Cmd/Ctrl + 1/2/3) for conversion, copy, and clear operations

### Data Flow
1. User inputs content via contentEditable divs or textareas with paste handling
2. JavaScript modules parse and convert data formats in real-time
3. Results displayed in readonly textareas, HTML table previews, or diff visualization
4. Copy-to-clipboard functionality for seamless workflow integration

### UI State Management
- Each tool has independent state (enabled/disabled buttons based on input)
- Global `currentTool` variable tracks active tab
- Status system provides user feedback with auto-dismissing messages
- Input validation prevents conversion attempts on empty content

## Korean Language Support
The application is designed for Korean PUBG translators with Korean UI text. All user-facing messages, placeholders, and button labels are in Korean.

## Implementation Details

### HTML to Markdown Conversion
- Uses recursive DOM node processing with `domToMarkdown()` function
- Handles nested structures (lists, tables, formatting) through tree traversal
- Converts HTML elements to corresponding Markdown syntax with proper spacing

### Excel Data Processing
- Parses pasted Excel data using clipboard HTML format detection
- Converts tabular data to 2D arrays for processing
- Generates Markdown tables with configurable header options

### Markdown to Excel Export
- Parses Markdown table syntax using regex patterns
- Converts to TSV format with proper escaping for Excel compatibility
- Provides HTML preview of final table structure

### Text Comparison Engine
- Implements line-based and word-level diff algorithm using dynamic programming
- Supports both side-by-side and unified view modes
- Real-time diff computation with visual highlighting of additions, deletions, and modifications
- Provides diff statistics (additions, deletions, line counts)

### Cross-Platform Considerations
- Keyboard shortcuts work on both Mac (Cmd) and Windows/Linux (Ctrl)
- Clipboard operations use fallback methods for broader browser support
- CSS uses system fonts for native appearance on each platform

## Module Loading Order
- `common.js` must load first as it provides shared utilities for all tools
- `text-diff.js` loads last and sets up real-time diff processing on DOM ready
- All other modules can load in any order after `common.js`
- PowerPoint functionality is present but not currently integrated into the main UI