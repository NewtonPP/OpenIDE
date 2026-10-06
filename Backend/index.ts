import express, {Router} from "express"
import cors from "cors"

import {Server} from "socket.io"
import "./socket.js"
import { setupSocket } from "./socket.js"

import "./madhav/ai.orchestrator.js"
import { run_agent } from "./madhav/ai.orchestrator.js"

const PORT = 4000

const app = express()

// const router = Router()


app.use(cors({origin:'http://localhost:5173'}))
app.use(express.json())
// app.use("/", router)

app.post('/agent_input', run_agent)


app.get("/health",(req, res)=>{
    res.status(200).json({status:"healthy"})
})


export const expressServer = app.listen(PORT, ()=>{
    console.log(`Server listening to port ${PORT}`)
})

export const io = new Server(expressServer, {cors:{origin: 'http://localhost:5173'}})

setupSocket(io)


