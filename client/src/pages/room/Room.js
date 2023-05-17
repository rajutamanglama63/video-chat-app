import React, { useCallback, useContext, useEffect } from "react";
import { SocketContext } from "../../context/SocketContext";

const Room = () => {
  const { socket } = useContext(SocketContext);

  const handleJoinedUser = useCallback(({ emailId, id }) => {
    console.log(`User with ${emailId} joined the room.`);
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleJoinedUser);

    return () => {
      socket.off("user:joined", handleJoinedUser);
    };
  }, [socket, handleJoinedUser]);
  return (
    <div>
      <h1>This is Room for chat.</h1>
    </div>
  );
};

export default Room;
