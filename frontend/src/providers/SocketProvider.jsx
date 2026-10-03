import React, { useContext } from 'react'
import { socketCientContext } from '../context/SocketContext'

export const SocketProvider = ({children}) => {
    const {socket} = useContext(socketCientContext)

  return (
   <socketCientContext.Provider value = {{socket}}>
    {children}
   </socketCientContext.Provider>
  )
}
