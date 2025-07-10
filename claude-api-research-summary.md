# Claude API Research & File Management Tool Development

## Summary

This document summarizes our research into Anthropic's APIs and the development of a compliant tool for managing Claude project files.

## Research Findings

### Available Anthropic APIs

1. **Messages API** (Primary)
   - Endpoint: `https://api.anthropic.com/v1/messages`
   - Features: Text/image content, streaming, tool use, system prompts, token counting
   - Models: Claude 3.5+ with various capabilities

2. **Files API** (Beta)
   - Endpoint: `https://api.anthropic.com/v1/files`
   - Purpose: Upload files once, reference multiple times
   - Supports: PDFs, images, text files, datasets
   - Limits: 500MB per file, 100GB total storage
   - Scope: API workspace only

3. **Message Batches API**
   - Bulk processing for cost-effective operations
   - Same request format as Messages API

4. **Third-party APIs**
   - Amazon Bedrock API
   - Google Vertex AI API

### Key Limitation: API vs Website Separation

**Critical Finding**: The Files API and Claude website (claude.ai) are completely separate systems:

- Files uploaded via API don't appear on the website
- Website projects/artifacts aren't accessible via API
- Different authentication and storage systems
- No official API for website functionality

## Compliance Analysis

### Prohibited Approaches
- **Website automation**: Any automated interaction with claude.ai violates ToS
- **API scraping**: Reverse engineering website APIs is forbidden
- **Bulk automation**: Extensions that auto-download content are risky

### Compliant Approaches
- **Manual enhancement**: Tools that improve user-initiated actions
- **Visual aids**: Highlighting and formatting existing content
- **Local processing**: Working with already-downloaded files
- **Official API usage**: Building tools around the documented APIs

## Developed Solution

### Workflow Design
1. **AI Analysis**: Ask Claude (via web interface) to analyze project files and suggest deletions
2. **JSON Output**: Claude provides structured recommendations
3. **Visual Enhancement**: Userscript highlights suggested files
4. **Manual Action**: User manually clicks delete buttons

### Implementation: Claude File Manager Userscript

**File**: `claude-file-manager.user.js`

**Features**:
- Highlights files suggested for deletion (red border)
- Shows files to keep (green border)
- Displays reasoning tooltips
- Persistent analysis storage (24-hour expiry)
- Manual control panel for JSON input
- Works with Tampermonkey/Greasemonkey

**Key Compliance Elements**:
- No automated actions on Claude's servers
- User maintains full control over deletions
- Visual enhancement only
- Respects user decision-making process

### Technical Architecture

```
User Workflow:
1. Upload files to Claude project
2. Ask Claude: "Analyze files and suggest deletions as JSON"
3. Copy JSON to userscript panel
4. View highlighted files on project page
5. Manually review and delete suggested files
```

**JSON Format**:
```json
{
  "analysis_date": "2025-01-10",
  "project_name": "Project Name",
  "files_to_delete": [
    {
      "filename": "old_file.pdf",
      "reason": "Superseded by newer version",
      "confidence": "high"
    }
  ],
  "files_to_keep": [
    {
      "filename": "current_file.pdf",
      "reason": "Active document in use"
    }
  ]
}
```

## Benefits

1. **Legal Compliance**: Respects Anthropic's Terms of Service
2. **AI-Powered**: Leverages Claude's intelligence for decision support
3. **User Control**: Maintains human oversight of all actions
4. **Visual Clarity**: Makes file management decisions obvious
5. **Audit Trail**: JSON provides reasoning for future reference

## Limitations

1. **Manual Process**: Requires user to click each delete button
2. **Website Only**: Only works with Claude web interface
3. **No API Integration**: Cannot sync with Files API
4. **Browser Dependent**: Requires userscript manager

## Future Considerations

1. **Official Features**: Request bulk management features from Anthropic
2. **API Enhancement**: Hope for future API/website integration
3. **Workflow Optimization**: Improve JSON format and analysis prompts
4. **Cross-Platform**: Develop similar tools for other file management needs

## Conclusion

This approach successfully bridges the gap between AI-powered analysis and practical file management while maintaining full compliance with Anthropic's terms of service. The solution provides genuine value through intelligent suggestions while preserving user agency and respecting platform boundaries.