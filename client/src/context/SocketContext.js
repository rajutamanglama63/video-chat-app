import { createContext } from "react";
import { io } from "socket.io-client";

export const SocketContext = createContext(null);

const socket = io("http://localhost:5000");

export const SocketContextProvider = ({ children }) => {
  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
