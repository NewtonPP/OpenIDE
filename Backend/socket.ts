import { Server } from "socket.io";
import type { IPty } from "@lydell/node-pty";
import path from "node:path";
import {
    createDirectory, createFile, createFolder, createPty, DEFAULT_ROOT, deleteEntry, handleFiles, HandleCodeChange,
    listDirectories, openDirectory, readWorkspaceFile,
} from "./src/controllers/execute.js";

const RESCAN_DELAY_MS = 400;

const RESET_TERMINAL = "\x1bc";

type Ack = (response: { ok: true; [key: string]: unknown } | { ok: false; error: string }) => void;

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

export const setupSocket = (io: Server) => {
    io.on("connection", (socket) => {
        let root = DEFAULT_ROOT;
        let size = { cols: 80, rows: 30 };
        let ptyProcess: IPty;
        let ptyDisposable: { dispose: () => void } | undefined;

        let lastSent = "";
        let rescanTimer: NodeJS.Timeout | undefined;

        const sendFiles = async () => {
            const scannedRoot = root;
            const files = await handleFiles(scannedRoot);
            // The workspace changed while scanning; that switch sends its own tree.
            if (scannedRoot !== root) return;
            const serialized = JSON.stringify(files);
            if (serialized === lastSent) return;
            lastSent = serialized;
            socket.emit("files", files);
        };

        const scheduleRescan = () => {
            clearTimeout(rescanTimer);
            rescanTimer = setTimeout(() => void sendFiles().catch(console.error), RESCAN_DELAY_MS);
        };

        const reportError = (action: string, err: unknown) => {
            console.error(`${action} failed:`, err);
            socket.emit("file:error", `${action} failed: ${errorMessage(err)}`);
        };

        const startPty = () => {
            ptyDisposable?.dispose();
            ptyProcess?.kill();
            ptyProcess = createPty(root);
            ptyProcess.resize(size.cols, size.rows);
            ptyDisposable = ptyProcess.onData((data) => {
                socket.emit("data", data);
                scheduleRescan();
            });
        };

        const emitWorkspace = () => {
            socket.emit("workspace:opened", { path: root, name: path.basename(root) || root });
        };

        const openWorkspace = async (dirPath: string) => {
            root = dirPath;
            lastSent = "";
            clearTimeout(rescanTimer);
            socket.emit("data", RESET_TERMINAL);
            startPty();
            emitWorkspace();
            await sendFiles();
        };

        startPty();
        emitWorkspace();
        sendFiles().catch(console.error);

        socket.on("data", (data) => {
            ptyProcess.write(data);
        });

        socket.on("resize", ({ cols, rows }) => {
            size = { cols, rows };
            ptyProcess.resize(cols, rows);
        });

        socket.on("file:select", async (file) => {
            try {
                socket.emit("file:selected", await readWorkspaceFile(root, file), file);
            } catch (err) {
                reportError("Open file", err);
            }
        });

        socket.on("code:changed", async (code, filepath) => {
            try {
                await HandleCodeChange(root, code, filepath);
            } catch (err) {
                reportError("Save file", err);
            }
        });

        socket.on("file:create", async (file) => {
            try {
                await createFile(root, file);
                await sendFiles();
            } catch (err) {
                reportError("Create file", err);
            }
        });

        socket.on("folder:create", async (folder) => {
            try {
                await createFolder(root, folder);
                await sendFiles();
            } catch (err) {
                reportError("Create folder", err);
            }
        });

        socket.on("file:delete", async (entryPath) => {
            try {
                await deleteEntry(root, entryPath);
                socket.emit("file:deleted", entryPath);
                await sendFiles();
            } catch (err) {
                reportError("Delete", err);
            }
        });

        // "Open Folder" dialog: browse, create and open directories anywhere on the server.
        socket.on("dir:list", async (dirPath, ack: Ack) => {
            try {
                ack({ ok: true, ...(await listDirectories(dirPath ?? root)) });
            } catch (err) {
                ack({ ok: false, error: errorMessage(err) });
            }
        });

        socket.on("dir:create", async (parentPath, name, ack: Ack) => {
            try {
                const created = await createDirectory(parentPath, name);
                await openWorkspace(created);
                ack({ ok: true, path: created });
            } catch (err) {
                ack({ ok: false, error: errorMessage(err) });
            }
        });

        socket.on("workspace:open", async (dirPath, ack?: Ack) => {
            try {
                await openWorkspace(await openDirectory(dirPath));
                ack?.({ ok: true, path: root });
            } catch (err) {
                ack?.({ ok: false, error: errorMessage(err) });
            }
        });

        socket.on("disconnect", () => {
            console.log(`Client ${socket.id} disconnected`);

            clearTimeout(rescanTimer);
            ptyDisposable?.dispose();
            ptyProcess.kill();
        });
    });
};
