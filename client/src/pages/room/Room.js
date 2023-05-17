import React, { useCallback, useContext, useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { WebRTCPeerService } from "../../services/webRTCPeerService";
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

    const peer = new WebRTCPeerService();

    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncomingcall = useCallback(({ from, offer }) => {
    console.log("Incoming Call: ", from, offer);
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleJoinedUser);
    socket.on("incomming:call", handleIncomingcall);

    return () => {
      socket.off("user:joined", handleJoinedUser);
      socket.off("incomming:call", handleIncomingcall);
    };
  }, [socket, handleJoinedUser, handleIncomingcall]);
  return (
    <div>
      <h1>This is Room for chat.</h1>
      <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>
      {remoteSocketId && <button onClick={handleCallUser}>Call</button>}

      {myStream && (
        <>
          <h2>my stream</h2>
          <ReactPlayer
            playing
            muted
            width="100px"
            height="200px"
            url={myStream}
          />
        </>
      )}
    </div>
  );
};

export default Room;
