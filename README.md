# xandriaai README

XandriaAI is an AI-powered code snippet generator for VS Code.  
It analyzes your code and provides context-aware improvements using the Gemini API.

## Features

Generate and optimize code snippets.
- Inline suggestions and documentation lookup.
- Secure backend hosted on Render.

## Requirements

To use XandriaAI in Visual Studio Code, you’ll need:

- **Visual Studio Code** version 1.80.0 or later  
- **An active internet connection** (for cloud-based AI suggestions) 

## Extension Settings

XandriaAI includes a few optional settings you can customize from  
**File → Preferences → Settings → Extensions → XandriaAI**.

This extension contributes the following settings:

* `xandriaai.enable`: Enable or disable XandriaAI suggestions globally.  
* `xandriaai.theme`: Choose between `"dark"` and `"light"` themes for the suggestion panel.  
* `xandriaai.showLogs`: Show or hide diagnostic logs in the VS Code console.  
* `xandriaai.languageSupport`: Specify which programming languages XandriaAI will analyze  
  (e.g., `"python"`, `"typescript"`, `"javascript"`).

By default, XandriaAI is enabled with dark theme and supports Python and TypeScript.

## Known Issues

- The first AI response may take a few seconds if the backend server is waking from idle on Render’s free tier.  
- Occasionally, long code inputs may cause delayed or incomplete AI suggestions.  
- Switching VS Code themes while the XandriaAI panel is open can cause minor visual misalignment.  
- Internet connection loss will prevent snippet generation until reconnected.  

We’re actively improving performance and stability in upcoming releases.

## Release Notes

1.0.0
Initial public release of **XandriaAI**.  
- Added AI-powered code snippet generation using the Gemini API.  
- Introduced the Snippet Panel with input/output views.  
- Enabled secure backend hosting on Render for independent operation.

1.1.0
- Added feedback and inline suggestion features.  
- Improved UI responsiveness and theme support.  
- Enhanced backend stability and startup performance.

1.2.0
- Optimized API request handling for faster responses.  
- Minor UI refinements and bug fixes.

### 1.0.0

Initial public release of **XandriaAI**.  
- Added AI-powered code snippet generation using the Gemini API.  
- Introduced the Snippet Panel with input/output views.  
- Enabled secure backend hosting on Render for independent operation.

### 1.0.0

Fixed issue #.

### 1.1.0

 Added feedback and inline suggestion features.  
- Improved UI responsiveness and theme support.  
- Enhanced backend stability and startup performance.


---

## Following extension guidelines

XandriaAI was built in accordance with Visual Studio Code’s official

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
The extension follows best practices for:
- Non-blocking, responsive UI design  
- Secure API communication with the backend  
- Consistent VS Code theming and accessibility support

## Working with Markdown

This section is primarily for reference.

XandriaAI’s documentation and release notes are written in Markdown format,  
which allows clear formatting and easy updates.  
If you wish to contribute to documentation, you can edit Markdown files directly in Visual Studio Code and preview your changes using `Ctrl+Shift+V`.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
