import React, {createContext } from 'react'
import {io} from "socket.io-client"

const socket = io('http://localhost:4000');

export const socketCientContext = createContext({socket})

