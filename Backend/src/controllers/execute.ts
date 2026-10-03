import * as os from "node:os";
import * as pty from "@lydell/node-pty";
import { readdirSync, statSync, writeFileSync} from "node:fs";
import {exec} from "node:child_process"
import path from "node:path";

export const createPty = () => {
    const shell =
        os.platform() === "win32"
            ? "powershell.exe"
            : process.env.SHELL || "/bin/bash";

    return pty.spawn(shell, [], {
        name: "xterm-color",
        cols: 80,
        rows: 30,
        cwd: process.cwd(),
        env: {
            ...process.env,
            TERM: "xterm-256color",
        },
    });
};


type FileTree = {
  [name: string]: FileTree | null;
};

export const handleFiles = (): FileTree => {
  const buildTree = (dirPath: string): FileTree => {
    const tree: FileTree = {};

    for (const entry of readdirSync(dirPath)) {
      const absPath = path.join(dirPath, entry);

      if (statSync(absPath).isDirectory()) {
        tree[entry] = buildTree(absPath);
      } else {
        tree[entry] = null;
      }
    }

    return tree;
  };

  return buildTree(process.cwd());
};


export const HandleCodeChange = (code : string, filepath : string) => {
  writeFileSync(filepath, code)
}
