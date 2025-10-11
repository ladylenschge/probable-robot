# Reitstunden Manager (Riding School Manager)

[![Latest Release](https://img.shields.io/github/v/release/ladylenschge/probable-robot)](https://github.com/ladylenschge/probable-robot/releases/latest)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)]()

A robust, offline-first desktop application designed to help riding school owners and managers efficiently handle daily scheduling, student progress tracking, and reporting. Built with a modern tech stack including Electron, React, and TypeScript.

---

## ✨ Core Features

*   **Student & Horse Management:** Full CRUD (Create, Read, Update, Delete) functionality for student and horse records, with safety checks to prevent data corruption.
*   **Member Flag:** Track student membership status to apply dynamic pricing on reports.
*   **Daily Schedule Planner:** An intuitive "Builder/Palette" interface to quickly create daily group and single lessons.
    *   Instantly add riders to a group from a filterable, searchable list.
    *   Assign available horses from a filterable, searchable list.
    *   Smart UI prevents assigning the same student or horse twice in the same group.
    *   Full edit and delete capabilities for scheduled slots and individual participants.
*   **Automated PDF Generation:**
    *   **Daily Schedule:** Print a clean, professionally formatted table of the day's entire schedule, grouped by time.
    *   **10-Card Progress Reports:** Automatically track student progress for billable lessons. A button appears on the "Reports" page when a new 10-lesson milestone is reached, allowing for the printing of a detailed, personalized report with pricing.
*   **Customizable Settings:** A dedicated settings page to store your school's information:
    *   School name, address, and contact details.
    *   Separate pricing for members and non-members.
    *   Bank account information for inclusion in PDF footers.
*   **Offline First:** The application uses a local SQLite database, meaning it works perfectly with or without an internet connection.
*   **Automatic Updates:** When online, the application automatically checks for new versions on GitHub, downloads them in the background, and prompts the user to restart and update.

---

## 🔧 Tech Stack

*   **Framework:** [Electron](https://www.electronjs.org/)
*   **User Interface:** [React](https://reactjs.org/) with [TypeScript](https://www.typescriptlang.org/)
*   **Database:** [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (for local, synchronous database access)
*   **PDF Generation:** [PDFKit](http://pdfkit.org/)
*   **Packaging & Auto-Updates:** [electron-builder](https://www.electron.build/) with [electron-updater](https://www.electron.build/auto-update)

---

## 🚀 Getting Started (For Users)

To install and use the Reitstunden Manager, follow these steps:

1.  **Go to the Releases Page:** Navigate to the [latest release](https://github.com/ladylenschge/probable-robot/releases/latest) of this repository.
2.  **Download the Installer:** Under the "Assets" section, download the `.exe` file (e.g., `Reitstunden-Manager-Setup-1.0.0.exe`).
3.  **Run the Installer:** Double-click the downloaded file and follow the installation instructions. The application will be added to your Start Menu and a desktop shortcut will be created.

The application will automatically check for updates whenever you launch it with an internet connection.

---

## 💻 Development Setup (For Developers)

To clone this repository and run it locally, you will need [Node.js](https://nodejs.org/) installed on your system.

**Important for Windows Users:** This project has native dependencies (`better-sqlite3`). To compile them if necessary, you need the C++ build toolchain and Python. Follow the official guide to set up your environment:
1.  Install **Build Tools for Visual Studio**, making sure to include the "Desktop development with C++" workload.
2.  Install **Python** from the Microsoft Store or python.org.
3.  For more details, see the [node-gyp installation guide](https://github.com/nodejs/node-gyp#on-windows).

**Setup Steps:**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ladylenschge/probable-robot.git
    cd probable-robot
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    This may take a moment as it installs and potentially rebuilds native modules.

3.  **Run the manual rebuild command (if needed):**
    If you encounter "bindings" errors on startup, run this command to force a rebuild of native modules for Electron.
    ```bash
    npm run rebuild
    ```

4.  **Run the application in development mode:**
    ```bash
    npm run electron:dev
    ```
    This will start the React development server and launch the Electron application with hot-reloading enabled.

---

## 📦 Building and Packaging

To package the application into a distributable installer for your current operating system, run the following command:

```bash
npm run electron:build
```
The process will create a final installer and related files in the /dist folder

--- 
## Releasing a New Version

This project is configured for automated releases and updates via GitHub.

1. **Finalize your code changes**.
2. **Bump the version number** using the npm command. This automatically updates package.json, package-lock.json, and creates a git tag.

```bash
# For a small patch/bugfix (e.g., 1.0.0 -> 1.0.1)
npm version patch

# For a new feature (e.g., 1.0.1 -> 1.1.0)
npm version minor
```
3. **Push your changes and the new tag** to GitHub
```bash
# For a small patch/bugfix (e.g., 1.0.0 -> 1.0.1)
npm version patch

# For a new feature (e.g., 1.0.1 -> 1.1.0)
npm version minor
```
4. **Create a new release on GitHub.** You can do this manually by drafting a new release from the new tag and attaching the .exe and latest.yml files from your /dist folder, or by using a GitHub Actions workflow.

---

## 📄 License

This project is proprietary and all rights are reserved. See the [LICENSE.md](LICENSE.md) file for details.