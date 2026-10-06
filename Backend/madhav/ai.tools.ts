import {readFile, writeFile, readdir, stat} from "node:fs/promises"
import fs from "node:fs/promises"
import path from "node:path"


const genAbsPath = (rel_path: string) => {
return path.resolve(rel_path)
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

    if (await isFile(abs_path))
    {
    const file = await readFile(abs_path, 'utf-8')
    return file
    }
    
    const error_message = "Please make sure the file you are looking for exists."
    return error_message
}


export const write_file = async (filepath:string, text:string) => {
    const abs_path = genAbsPath(filepath)
    console.log('Writing in file', filepath)

    const file = await writeFile(filepath, text)

    return file

}

export const read_dir = async (dirpath: string) => {
   const abs_path = genAbsPath(dirpath)
   const isDir = (await fs.stat(abs_path)).isDirectory() 
   if (!isDir) return {"message":"The Provided file is not a directory"}

   const files = await fs.readdir(abs_path)
   return files
}

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
