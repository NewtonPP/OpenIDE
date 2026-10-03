# OpenIDE

OpenIDE is a code editor that runs in your web browser. It has a file explorer, a code editor and a working terminal, laid out like VS Code. A small Node.js server does the real work: it lists the files, saves your edits and runs the terminal. The browser and the server talk to each other over Socket.IO.

## Features

- **File explorer**: a folder tree with icons for each file type, a filter box that finds files as you type, expand/collapse all, keyboard navigation and a right-click menu (open, copy path, copy name).
- **Code editor**: the [Monaco](https://microsoft.github.io/monaco-editor/) editor (the one inside VS Code), with syntax highlighting chosen from the file extension, a minimap, colored bracket pairs and sticky scroll. Every change is sent to the server and written to disk.
- **Terminal**: a real shell on the server, shown in the browser with [xterm.js](https://xtermjs.org/). You can resize, maximize, clear and hide it.
- **Layout**: the sidebar and the terminal can be resized by dragging, and the browser remembers their sizes. There is a status bar (connection status, cursor position, language) and keyboard shortcuts.

## Project structure

```
OpenIDE/
├── Backend/                 Node.js + Express + Socket.IO server (TypeScript)
│   ├── index.ts             HTTP server on port 4000, CORS, /health endpoint
│   ├── socket.ts            Socket.IO events (terminal, files, editing)
│   └── src/controllers/
│       └── execute.ts       Starts the shell, builds the file tree, writes files
└── frontend/                React + Vite client
    └── src/
        ├── App.jsx          Page layout, resizable panels, shortcuts, status bar
        ├── components/      FileManager, CodeSpace (editor), Terminal, Icons
        ├── context/         Socket.IO client connection
        └── utils/           File type → icon and language info
```

### How it works

The browser and the server send each other these Socket.IO events:

| Event              | Direction         | Purpose                                        |
| ------------------ | ----------------- | ---------------------------------------------- |
| `files`            | server → client   | The workspace file tree                        |
| `file:select`      | client → server   | Asks for a file's contents                     |
| `file:selected`    | server → client   | Sends back the file's contents and path        |
| `code:changed`     | client → server   | Sends the edited code, which is written to disk |
| `data`             | both ways         | Terminal input and output                      |
| `resize`           | client → server   | Sets the terminal size to match the panel      |

The workspace is the folder you start the backend from (its current working directory). The server re-reads the file tree whenever the terminal prints something, so files you create in the terminal show up in the explorer.

## Running it locally

### Requirements

- [Node.js](https://nodejs.org/) 20 or newer, with npm
- macOS or Linux, or Windows (there the terminal uses PowerShell)
- The backend uses `node-pty`, which ships prebuilt for most platforms. If the install fails, you need build tools: Xcode Command Line Tools on macOS, `build-essential` and `python3` on Linux.

### 1. Start the backend

```bash
cd Backend
npm install
npm run dev
```

The server starts on **http://localhost:4000**. To check that it is running, open http://localhost:4000/health.

### 2. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser. The status bar at the bottom should say **Connected**.

> The ports are fixed in the code. The backend accepts connections only from `http://localhost:5173` (see `Backend/index.ts`), and the frontend connects to `http://localhost:4000` (see `frontend/src/context/SocketContext.jsx`). If you change either port, change both places.

### Other frontend commands

```bash
npm run build     # production build into frontend/dist
npm run preview   # serve the production build locally
npm run lint      # run ESLint
```

## Keyboard shortcuts

| Action           | macOS        | Windows / Linux |
| ---------------- | ------------ | --------------- |
| Search files     | `⌘ P`        | `Ctrl P`        |
| Toggle sidebar   | `⌘ B`        | `Ctrl B`        |
| Toggle terminal  | `` Ctrl ` `` or `⌘ J` | `` Ctrl ` `` or `Ctrl J` |

You can also double-click a resize handle to reset that panel to its default size.

## Security note

The terminal is a real shell on the machine running the backend, and the editor can read and write files there. Anyone who can reach the backend can run commands with your user's permissions. Run it only on your own machine and never expose port 4000 to the internet.

## Tech stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, `@monaco-editor/react`, `@xterm/xterm` + `@xterm/addon-fit`, `socket.io-client`
- **Backend:** Node.js, Express 5, Socket.IO, `@lydell/node-pty`, TypeScript run with `tsx`
