import React, { useCallback, useContext, useEffect, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../../services/webRTCPeerService";
import { SocketContext } from "../../context/SocketContext";
import "./room.css";

const Room = () => {
  const { socket } = useContext(SocketContext);

  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();

  const handleJoinedUser = useCallback(({ emailId, id }) => {
    console.log(`User with ${emailId} joined the room.`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncomingcall = useCallback(
    async ({ from, offer }) => {
      try {
        setRemoteSocketId(from);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        setMyStream(stream);
        console.log("Incoming Call: ", from, offer);

        const ans = await peer.getAnswer(offer);
        socket.emit("call:res:to:caller", { to: from, ans });
      } catch (error) {
        console.log("err: ", error);
      }
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    // this code snippet will help to exchange each others video
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallResponse = useCallback(
    async ({ from, ans }) => {
      try {
        await peer.setLocalDescription(ans);

        console.log("response back from call receiver");
        sendStreams();
      } catch (error) {
        console.log("err: ", error);
      }
    },
    [sendStreams]
  );

  // negotiation is need in webRTC to render each others video in each others browser other wise it will not render each other video
  // to see webRTC connection go to chrome://webrtc-internals/ in chrome browser
  const handleNegotiationNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:negotiation:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  const handleIncomingNegotiationNeeded = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:negotiation:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegotiationNeededFinal = useCallback(async ({ from, ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegotiationNeeded);

    return () => {
      peer.peer.removeEventListener(
        "negotiationneeded",
        handleNegotiationNeeded
      );
    };
  }, [handleNegotiationNeeded]);

  useEffect(() => {
    peer.peer.addEventListener("track", async (e) => {
      const remoteStream = e.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleJoinedUser);
    socket.on("incomming:call", handleIncomingcall);
    socket.on("notify:res:to:caller", handleCallResponse);
    socket.on("incomming:peer:nego:needed", handleIncomingNegotiationNeeded);
    socket.on("peer:negotiation:final", handleNegotiationNeededFinal);

    return () => {
      socket.off("user:joined", handleJoinedUser);
      socket.off("incomming:call", handleIncomingcall);
      socket.off("notify:res:to:caller", handleCallResponse);
      socket.off("incomming:peer:nego:needed", handleIncomingNegotiationNeeded);
      socket.off("peer:negotiation:final", handleNegotiationNeededFinal);
    };
  }, [
    socket,
    handleJoinedUser,
    handleIncomingcall,
    handleCallResponse,
    handleIncomingNegotiationNeeded,
    handleNegotiationNeededFinal,
  ]);
  return (
    <div className="room-container">
      <h1>This is Room for chat.</h1>
      {remoteSocketId ? (
        <h4 className="online">Connected</h4>
      ) : (
        <h4 style={{ color: "grey" }}>No one in room</h4>
      )}
      {/* <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4> */}

      <div className="options">
        {myStream && (
          <button className="btn-send-stream" onClick={sendStreams}>
            send stream
          </button>
        )}
        {remoteSocketId && (
          <button className="btn-call" onClick={handleCallUser}>
            Call
          </button>
        )}
      </div>

      <div className="video-stream">
        {myStream && (
          <>
            <h2>my stream</h2>
            <ReactPlayer
              playing
              muted
              width="300px"
              height="500px"
              url={myStream}
            />
          </>
        )}

        {remoteStream && (
          <>
            <h2>remote stream</h2>
            <ReactPlayer
              playing
              muted
              width="300px"
              height="500px"
              url={remoteStream}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Room;
