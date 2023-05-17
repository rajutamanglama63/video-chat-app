import React, { useCallback, useContext, useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { SocketContext } from "../../context/SocketContext";

const Room = () => {
  const { socket } = useContext(SocketContext);

  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();

  const handleJoinedUser = useCallback(({ emailId, id }) => {
    console.log(`User with ${emailId} joined the room.`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setMyStream(stream);
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
      <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>
      {remoteSocketId && <button onClick={() => handleCallUser}>Call</button>}

      {myStream && (
        <ReactPlayer
          playing
          muted
          width="200px"
          height="200px"
          url={myStream}
        />
      )}
    </div>
  );
};

export default Room;
