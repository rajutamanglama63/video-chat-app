import React, { useCallback, useContext, useEffect, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../../services/webRTCPeerService";
import { SocketContext } from "../../context/SocketContext";

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

    // const peer = new WebRTCPeerService();

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

        // const peer = new WebRTCPeerService();

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
    // const peer = new WebRTCPeerService();
    // this code snippet will help to exchange each others video
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallResponse = useCallback(
    async ({ from, ans }) => {
      try {
        // const peer = new WebRTCPeerService();
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
    // const peer = new WebRTCPeerService();
    const offer = await peer.getOffer();
    socket.emit("peer:negotiation:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  const handleIncomingNegotiationNeeded = useCallback(
    async ({ from, offer }) => {
      // const peer = new WebRTCPeerService();
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:negotiation:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegotiationNeededFinal = useCallback(async ({ from, ans }) => {
    // const peer = new WebRTCPeerService();
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    // const peer = new WebRTCPeerService();
    peer.peer.addEventListener("negotiationneeded", handleNegotiationNeeded);

    return () => {
      peer.peer.removeEventListener(
        "negotiationneeded",
        handleNegotiationNeeded
      );
    };
  }, [handleNegotiationNeeded]);

  useEffect(() => {
    // const peer = new WebRTCPeerService();
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
    <div>
      <h1>This is Room for chat.</h1>
      <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>
      {myStream && <button onClick={sendStreams}>send stream</button>}
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

      {remoteStream && (
        <>
          <h2>remote stream</h2>
          <ReactPlayer
            playing
            muted
            width="100px"
            height="200px"
            url={remoteStream}
          />
        </>
      )}
    </div>
  );
};

export default Room;
