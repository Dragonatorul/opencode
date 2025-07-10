// ==UserScript==
// @name         Claude Project File Manager Helper
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Highlights files suggested for deletion in Claude projects based on AI analysis
// @author       You
// @match        https://claude.ai/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    // CSS for highlighting files
    const css = `
        .claude-file-delete-suggestion {
            border: 2px solid #ff6b6b !important;
            background-color: rgba(255, 107, 107, 0.1) !important;
            position: relative;
        }
        
        .claude-file-delete-suggestion::before {
            content: "🗑️ Suggested for deletion";
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ff6b6b;
            color: white;
            padding: 2px 6px;
            font-size: 11px;
            border-radius: 3px;
            z-index: 1000;
            font-weight: bold;
        }
        
        .claude-file-keep-suggestion {
            border: 2px solid #51cf66 !important;
            background-color: rgba(81, 207, 102, 0.1) !important;
        }
        
        .claude-file-analysis-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
        }
        
        .claude-file-analysis-panel h3 {
            margin: 0 0 10px 0;
            color: #333;
        }
        
        .claude-file-analysis-panel textarea {
            width: 100%;
            height: 200px;
            margin: 10px 0;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
        }
        
        .claude-file-analysis-panel button {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 8px;
        }
        
        .claude-file-analysis-panel button:hover {
            background: #0056b3;
        }
        
        .claude-file-analysis-panel .close-btn {
            background: #6c757d;
        }
        
        .claude-file-analysis-panel .close-btn:hover {
            background: #545b62;
        }
    `;

    // Add CSS to page
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    let analysisPanel = null;
    let currentAnalysis = null;

    // Create analysis panel
    function createAnalysisPanel() {
        if (analysisPanel) {
            analysisPanel.remove();
        }

        analysisPanel = document.createElement('div');
        analysisPanel.className = 'claude-file-analysis-panel';
        analysisPanel.innerHTML = `
            <h3>Claude File Analysis</h3>
            <p>Paste the JSON analysis from Claude here:</p>
            <textarea id="claude-analysis-input" placeholder='Paste JSON like:
{
  "analysis_date": "2025-01-10",
  "project_name": "My Project",
  "files_to_delete": [
    {
      "filename": "old_file.pdf",
      "reason": "Outdated version",
      "confidence": "high"
    }
  ],
  "files_to_keep": [
    {
      "filename": "current_file.pdf", 
      "reason": "Active document"
    }
  ]
}'></textarea>
            <button id="claude-apply-analysis">Apply Analysis</button>
            <button id="claude-clear-analysis">Clear Highlights</button>
            <button id="claude-close-panel" class="close-btn">Close</button>
        `;

        document.body.appendChild(analysisPanel);

        // Event listeners
        document.getElementById('claude-apply-analysis').addEventListener('click', applyAnalysis);
        document.getElementById('claude-clear-analysis').addEventListener('click', clearHighlights);
        document.getElementById('claude-close-panel').addEventListener('click', () => {
            analysisPanel.remove();
            analysisPanel = null;
        });
    }

    // Apply analysis to highlight files
    function applyAnalysis() {
        const input = document.getElementById('claude-analysis-input').value.trim();
        
        if (!input) {
            alert('Please paste the JSON analysis first');
            return;
        }

        try {
            currentAnalysis = JSON.parse(input);
            
            // Save analysis for persistence
            GM_setValue('claude_file_analysis', input);
            GM_setValue('claude_analysis_timestamp', Date.now());
            
            highlightFiles();
            
            alert(`Analysis applied! Highlighted ${currentAnalysis.files_to_delete?.length || 0} files for deletion and ${currentAnalysis.files_to_keep?.length || 0} files to keep.`);
            
        } catch (error) {
            alert('Invalid JSON format. Please check your input.');
            console.error('JSON parse error:', error);
        }
    }

    // Clear all highlights
    function clearHighlights() {
        document.querySelectorAll('.claude-file-delete-suggestion, .claude-file-keep-suggestion').forEach(el => {
            el.classList.remove('claude-file-delete-suggestion', 'claude-file-keep-suggestion');
            el.removeAttribute('title');
        });
        
        GM_setValue('claude_file_analysis', '');
        currentAnalysis = null;
        
        alert('All highlights cleared');
    }

    // Highlight files based on analysis
    function highlightFiles() {
        if (!currentAnalysis) return;

        // Clear existing highlights first
        clearHighlights();

        // Highlight files to delete
        if (currentAnalysis.files_to_delete) {
            currentAnalysis.files_to_delete.forEach(file => {
                highlightFileByName(file.filename, 'delete', file.reason, file.confidence);
            });
        }

        // Highlight files to keep (optional visual confirmation)
        if (currentAnalysis.files_to_keep) {
            currentAnalysis.files_to_keep.forEach(file => {
                highlightFileByName(file.filename, 'keep', file.reason);
            });
        }
    }

    // Find and highlight a specific file by name
    function highlightFileByName(filename, action, reason, confidence) {
        // Multiple selectors to catch different file display formats
        const selectors = [
            `[title*="${filename}"]`,
            `[aria-label*="${filename}"]`,
            `[data-filename*="${filename}"]`,
            `*[class*="file"]:has-text("${filename}")`,
        ];

        // Also search by text content
        const allElements = document.querySelectorAll('*');
        const matchingElements = Array.from(allElements).filter(el => {
            const text = el.textContent || '';
            const title = el.title || '';
            const ariaLabel = el.getAttribute('aria-label') || '';
            
            return (text.includes(filename) || title.includes(filename) || ariaLabel.includes(filename)) &&
                   (el.closest('[class*="file"]') || el.classList.toString().includes('file'));
        });

        // Try CSS selectors first
        selectors.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(el => {
                    applyHighlight(el, action, reason, confidence, filename);
                });
            } catch (e) {
                // Ignore invalid selectors
            }
        });

        // Apply to text-matched elements
        matchingElements.forEach(el => {
            // Find the file container (might be parent element)
            const fileContainer = el.closest('[class*="file"]') || el;
            applyHighlight(fileContainer, action, reason, confidence, filename);
        });
    }

    // Apply highlight styling to element
    function applyHighlight(element, action, reason, confidence, filename) {
        if (!element) return;

        const className = action === 'delete' ? 'claude-file-delete-suggestion' : 'claude-file-keep-suggestion';
        element.classList.add(className);
        
        const confidenceText = confidence ? ` (${confidence} confidence)` : '';
        element.title = `${filename}: ${reason}${confidenceText}`;
    }

    // Load saved analysis on page load
    function loadSavedAnalysis() {
        const savedAnalysis = GM_getValue('claude_file_analysis', '');
        const timestamp = GM_getValue('claude_analysis_timestamp', 0);
        
        // Only auto-apply if analysis is less than 24 hours old
        const isRecent = (Date.now() - timestamp) < (24 * 60 * 60 * 1000);
        
        if (savedAnalysis && isRecent) {
            try {
                currentAnalysis = JSON.parse(savedAnalysis);
                // Wait for page to load before highlighting
                setTimeout(highlightFiles, 2000);
            } catch (error) {
                console.error('Error loading saved analysis:', error);
            }
        }
    }

    // Register menu commands
    GM_registerMenuCommand('Open File Analysis Panel', createAnalysisPanel);
    GM_registerMenuCommand('Clear All Highlights', clearHighlights);

    // Initialize
    console.log('Claude File Manager Helper loaded');
    
    // Load saved analysis when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSavedAnalysis);
    } else {
        loadSavedAnalysis();
    }

    // Re-apply highlights when navigating (for SPAs)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(highlightFiles, 1000);
        }
    }).observe(document, { subtree: true, childList: true });

})();