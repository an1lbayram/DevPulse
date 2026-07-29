# DevPulse 🔍🖥️

![Electron](https://img.shields.io/badge/Electron-Latest-47848F?logo=electron)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-Ready-646CFF?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)

> **Keeps the pulse of your developer environment.**

DevPulse is a modern, fast, and secure Windows desktop application that automatically detects software development tools installed on your system (Python, Node.js, Java, .NET, npm, yarn, pip, Chocolatey, etc.), checks their latest versions, and provides easy, one-click updates.

Built with **Electron**, **React**, and **Vite**, DevPulse features a beautiful dark-mode interface and a robust tool detection engine.

🌐 *Türkçe dökümantasyon için [tıklayın](README_TR.md).*

---

## ✨ Features

- 🔍 **Auto-Detection:** Automatically detects installed dev tools (Python, Node.js, Java, .NET, npm, yarn, pip, Chocolatey, etc.).
- 🔄 **Version Checking:** Connects to official APIs and registries to verify latest stable/LTS releases.
- 🎨 **Visual Dashboard:** Beautiful UI built with React and custom CSS (Glassmorphism & Dark Mode).
- 🚀 **One-Click Updates:** Safely updates your tools using trusted package managers (`winget`, `npm`, `choco`).
- 🛡️ **Security First:** Whitelist-based command execution preventing arbitrary command injection.
- 📜 **Live Logs:** Real-time terminal output during updates directly inside the application.
- 🔗 **External Links:** Opens official documentation and download pages in your default browser.

---

## 💻 System Requirements

1. **Windows 10 or Windows 11**
2. **Node.js** (v18.0.0 or higher): [Download Node.js](https://nodejs.org/)
3. **Git**: [Download Git](https://git-scm.com/)

---

## 🚀 Installation & Getting Started

### ⚡ One-Liner Quick Start

Open PowerShell or Terminal and run the single command below to clone, install, and run DevPulse instantly:

```bash
git clone https://github.com/an1lbayram/DevPulse.git && cd DevPulse && npm install && npm start
```

---

### 📋 Step-by-Step Installation (For Beginners)

#### 1️⃣ Open Terminal / Command Prompt
Press the Windows Key, type `PowerShell` or `cmd`, and press Enter.

#### 2️⃣ Clone the Repository
Run the following command to download the source code:
```bash
git clone https://github.com/an1lbayram/DevPulse.git
```

#### 3️⃣ Navigate to Project Directory
```bash
cd DevPulse
```

#### 4️⃣ Install Dependencies
```bash
npm install
```

#### 5️⃣ Start the Application
```bash
npm start
```
The Electron desktop window will open automatically and begin scanning your system!

---

## 📦 Building Executables (.exe)

To package DevPulse into a portable `.zip` or Windows `.exe` installer:

```bash
npm run make
```

The output files will be saved in the **`out/`** directory.

---

## 🔐 Security Note

DevPulse enforces strict security measures when running system commands:
- **Predefined Commands:** Update commands are strictly mapped in a internal registry (`src/config/tools.js`); no free-text input is allowed.
- **Whitelist Validator:** Only approved commands and subcommand patterns are executed.
- **UAC Consent:** Admin privileges trigger standard Windows UAC prompts.
- **Renderer Isolation:** UI runs with `contextIsolation` enabled and Node integration disabled.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

**Developer:** [Anıl Bayram](https://github.com/an1lbayram)
