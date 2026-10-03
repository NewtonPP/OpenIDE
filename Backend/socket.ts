import { Server } from "socket.io";
import { createPty, handleFiles, HandleCodeChange } from "./src/controllers/execute.js";
import { exec } from "node:child_process";


let files = handleFiles();

export const setupSocket = (io: Server) => {
    io.on("connection", (socket) => {
        const ptyProcess = createPty();

        const disposable = ptyProcess.onData((data) => {
            process.stdout.write(data)
            files = handleFiles();
            socket.emit("data", data);
            socket.emit('files', files)

        });

        socket.emit('files', files)

        socket.on("data", (data) => {
            ptyProcess.write(data);
        });

        socket.on("resize", ({ cols, rows }) => {
            ptyProcess.resize(cols, rows);
        });

        socket.on("file:select", (file)=>{
            exec(`cat ${file}`, (error, stdout, stderr) => {
                socket.emit('file:selected', stdout, file)
            })

        socket.on('code:changed', (code, filepath) => {
            HandleCodeChange(code, filepath)
        })
            
        })

        socket.on("disconnect", () => {
            console.log(`Client ${socket.id} disconnected`);

            disposable.dispose();
            ptyProcess.kill();
        });
    });
};
