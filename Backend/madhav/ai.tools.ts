import { existsSync } from "node:fs"
import {readFile, writeFile, readdir, stat} from "node:fs/promises"
import fs from "node:fs/promises"
import path from "node:path"


const EXCLUDED_FILES = ['.env', '.log', '.json', '*.pem', '*.key', '*.crt', '*.pfx']
const EXCLUDED_DIRS = ['node_modules/', 'dist/']

const genAbsPath = (rel_path: string) => {
return path.resolve(process.cwd(), rel_path)
}   

const genRelPath = (workspace_path: string, abs_path : string) => {
    return path.relative(workspace_path, abs_path)
}

const getPathExtension = (filename: string) => {
    const path_extension = path.extname(filename)
    if (path_extension === '' && filename.startsWith('.')) {
        return filename
    }
    return path_extension
}

const isFile = async (filepath: string) => {
    try {
    const file_stat = await stat(filepath)
    if (file_stat.isFile()) return true;
    } catch (error) {
        return false
    }
}

export const read_file = async (filepath: string) => {
    const abs_path = genAbsPath(filepath)
    const workspace_path = genAbsPath(process.cwd())
    const relativePath = genRelPath(workspace_path, abs_path)

    const file_ext = getPathExtension(relativePath)

    console.log("The path extension is : ",file_ext)

    if ( EXCLUDED_FILES.includes(file_ext))
    {
        console.log("Reading File: ", file_ext)

        throw new Error("No permission to read this file")
    }
    
    if ( relativePath === ".." ||
        relativePath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativePath)) throw Error("File outside project directory")

    if (!existsSync(relativePath) || !(await stat(relativePath)).isFile())
    {
        throw Error("File Not found")
    }
    
    const file = await readFile(relativePath, 'utf-8')
    return file
}


export const write_file = async (filepath:string, text:string) => {
    const abs_path = genAbsPath(filepath)
    const workspace_path = genAbsPath(process.cwd())
    const relativePath = genRelPath(workspace_path, abs_path)

    const file_ext = getPathExtension(relativePath)

    if (EXCLUDED_FILES.includes(file_ext))
    {
        throw Error("Can't modify this file")
    }

    console.log('Writing in file', relativePath)

    const file = await writeFile(relativePath, text)

    return file

}

export const read_dir = async (dirpath: string) => {
    const abs_path = genAbsPath(dirpath)
    const workspace_path = genAbsPath(process.cwd())
    const relativePath = genRelPath(workspace_path, abs_path)

    if (EXCLUDED_DIRS.includes(relativePath))
    {
        throw new Error("Can't Read this directory")
    }

   const isDir = (await fs.stat(abs_path)).isDirectory() 
   if (!isDir) return {"message":"The Provided file is not a directory"}

   const files = await fs.readdir(abs_path)
   return files
}

export const list_files = async (
    pathname: string
): Promise<string[]> => {
    const absPath = genAbsPath(pathname);
    const entries = await readdir(absPath, { withFileTypes: true });

    const files: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(absPath, entry.name);

        if (entry.isDirectory()) {
            const nestedFiles = await list_files(fullPath);
            files.push(...nestedFiles);
        } else {
            files.push(fullPath);
        }
    }

    return files;
};

export const delete_file = async (filepath: string) => {
    const abs_path = genAbsPath(filepath)
    if (await isFile(abs_path))
    {
    await fs.rm(abs_path)
    }
    else{
        return {"message":"Unable to delete the file"}
    }
}
