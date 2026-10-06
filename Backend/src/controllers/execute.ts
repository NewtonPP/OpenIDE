import * as os from "node:os";
import * as pty from "@lydell/node-pty";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export const DEFAULT_ROOT = path.resolve(process.env.WORKSPACE_ROOT || os.homedir());

const IGNORED = new Set(["node_modules", ".git", ".Trash", ".cache", ".npm", "Library"]);

export const createPty = (cwd: string) => {
    const shell =
        os.platform() === "win32"
            ? "powershell.exe"
            : process.env.SHELL || "/bin/bash";

    return pty.spawn(shell, [], {
        name: "xterm-color",
        cols: 80,
        rows: 30,
        cwd,
        env: {
            ...process.env,
            TERM: "xterm-256color",
        },
    });
};


export const resolveInWorkspace = (root: string, relPath: unknown): string => {
  if (typeof relPath !== "string" || !relPath.trim()) {
    throw new Error("Invalid path");
  }
  const absPath = path.resolve(root, relPath);
  const rel = path.relative(root, absPath);
  if (rel === "" || rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new Error(`Path is outside the workspace: ${relPath}`);
  }
  return absPath;
};


export type FileTree = {
  [name: string]: FileTree | null;
};

export const handleFiles = async (root: string): Promise<FileTree> => {
  const buildTree = async (dirPath: string): Promise<FileTree> => {
    const tree: FileTree = {};

    let entries;
    try {
      entries = await readdir(dirPath, { withFileTypes: true });
    } catch {
      return tree;
    }

    const subtrees = await Promise.all(
      entries.map(async (entry) => {
        if (IGNORED.has(entry.name)) return null;
        const subtree = entry.isDirectory()
          ? await buildTree(path.join(dirPath, entry.name))
          : null;
        return [entry.name, subtree] as const;
      })
    );

    for (const item of subtrees) {
      if (item) tree[item[0]] = item[1];
    }
    return tree;
  };

  return buildTree(root);
};


export const readWorkspaceFile = (root: string, filepath: unknown) =>
  readFile(resolveInWorkspace(root, filepath), "utf8");

export const HandleCodeChange = (root: string, code: unknown, filepath: unknown) => {
  if (typeof code !== "string") throw new Error("Invalid file contents");
  return writeFile(resolveInWorkspace(root, filepath), code);
};

export const createFile = async (root: string, filepath: unknown) => {
  const absPath = resolveInWorkspace(root, filepath);
  await mkdir(path.dirname(absPath), { recursive: true });
  // "wx" fails if the file already exists instead of truncating it.
  await writeFile(absPath, "", { flag: "wx" });
};

export const createFolder = async (root: string, folderpath: unknown) => {
  await mkdir(resolveInWorkspace(root, folderpath), { recursive: true });
};

// Deletes a file, or a folder with everything in it. Symlinks are removed, never followed.
export const deleteEntry = async (root: string, entryPath: unknown) => {
  await rm(resolveInWorkspace(root, entryPath), { recursive: true });
};


const toAbsoluteDir = (dirPath: unknown): string => {
  if (typeof dirPath !== "string" || !dirPath.trim()) return os.homedir();
  const trimmed = dirPath.trim();
  const expanded = trimmed === "~" || trimmed.startsWith("~/")
    ? path.join(os.homedir(), trimmed.slice(1))
    : trimmed;
  if (!path.isAbsolute(expanded)) throw new Error(`Not an absolute path: ${trimmed}`);
  return path.resolve(expanded);
};

export const openDirectory = async (dirPath: unknown): Promise<string> => {
  const absPath = toAbsoluteDir(dirPath);
  if (!(await stat(absPath)).isDirectory()) throw new Error(`Not a folder: ${absPath}`);
  return absPath;
};

export const listDirectories = async (dirPath: unknown) => {
  const absPath = await openDirectory(dirPath);
  const entries = await readdir(absPath, { withFileTypes: true });
  const dirs = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
  const parent = path.dirname(absPath);
  return { path: absPath, parent: parent === absPath ? null : parent, dirs };
};

export const createDirectory = async (parentPath: unknown, name: unknown): Promise<string> => {
  if (typeof name !== "string" || !name.trim() || name.trim() === "." || name.trim() === ".." || /[\\/]/.test(name)) {
    throw new Error("Folder name must not be empty or contain slashes");
  }
  const absPath = path.join(await openDirectory(parentPath), name.trim());
  try {
    await mkdir(absPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "EEXIST") throw new Error(`“${name.trim()}” already exists`);
    throw err;
  }
  return absPath;
};
