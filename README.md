# DevPulse 🔍🖥️

> Keeps the pulse of your developer environment. 

DevPulse is a modern, fast, and secure Windows desktop application that automatically detects the software development tools installed on your system, checks their versions, and provides easy, one-click updates.

Built with **Electron**, **React**, and **Vite**, DevPulse features a beautiful dark-mode interface and a robust tool detection engine.

Read this in [Türkçe](README_TR.md).

## Features ✨
- **Auto-Detection**: Automatically detects popular tools like Python, Node.js, Java, .NET, npm, yarn, pip, and Chocolatey.
- **Version Checking**: Connects to official APIs and registries to verify the latest stable versions.
- **Visual Dashboard**: Beautiful UI built with React and Tailwind-like custom CSS.
- **One-Click Updates**: Safely updates your tools using trusted package managers (winget, npm, choco).
- **Security First**: Whitelist-based command execution preventing arbitrary command injection (command + allowed subcommand patterns).
- **Live Logs**: Real-time terminal output during updates directly in the app.
- **External Links**: Opens official download pages in your default browser.

## Installation 🚀

### Prerequisites
- Windows 10 or 11
- Node.js (for building from source)

### Building from Source
1. Clone the repository:
   ```bash
   git clone https://github.com/an1lbayram/DevPulse.git
   cd DevPulse
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application in development mode:
   ```bash
   npm start
   ```

### Creating Executables
To create a portable `.zip` or a Windows `.exe` installer:
```bash
npm run make
```
The output files will be in the `out/` directory.

## Security Note 🔐
DevPulse uses `child_process.spawn` to run commands on your system. To ensure safety:
- **No free-text input**: Update commands are predefined in a registry (`src/config/tools.js`) and are not user-entered.
- **Whitelist + subcommands**: A strict validator allows only approved commands and approved subcommand patterns.
- **Admin Rights (UAC)**: Some updates may trigger UAC. DevPulse does not bypass UAC; it requests consent.
- **Renderer isolation**: The UI runs with `contextIsolation` enabled and without Node integration.

## Technologies Used 💻
- **Frontend**: React, Lucide-React
- **Backend / Desktop**: Electron, Node.js
- **Build Tool**: Vite, Electron Forge
- **System**: `child_process`, `electron-store`, `winston`

## Notes
- **Logs**: UI keeps the last ~1000 log entries to avoid unbounded memory growth.
- **Network**: Version checks use a request timeout to avoid hanging on slow endpoints.
- **Dependencies**: `npm audit --omit=dev` is clean; `npm audit` may report issues in development tooling dependencies.
