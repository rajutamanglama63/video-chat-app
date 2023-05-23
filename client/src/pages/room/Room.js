import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Icon } from "@iconify/react";
import ReactPlayer from "react-player";
import axios from "axios";
import peer from "../../services/webRTCPeerService";
import { SocketContext } from "../../context/SocketContext";
import "./room.css";

const Room = () => {
  const { socket } = useContext(SocketContext);

  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [userEmail, setUserEmail] = useState("");
  const [caller, setCaller] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState();

  const mediaRecorderRef = useRef(null);

  const handleStartRecording = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const audioChunks = [];

        mediaRecorder.addEventListener("dataavailable", (event) => {
          audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener("stop", () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
          const audioUrl = URL.createObjectURL(audioBlob);
          console.log(audioUrl);
          console.log("chunkS: ", audioChunks);
          console.log("audioBlob: ", audioBlob);

          setRecordedAudio(audioBlob);
        });

        mediaRecorder.start();
        setRecording(true);
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);
      });
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const sendAudioData = (audioBlob) => {
    // const formData = new FormData();
    // formData.append("audio", audioBlob, "recording.webm");
    // console.log(("formData: ", formData));
    console.log(audioBlob);
    axios
      .post("http://localhost:5000/api/audio", { audioData: audioBlob })
      .then((response) => {
        console.log("Audio data sent successfully:", response.data);
      })
      .catch((error) => {
        console.error("Error sending audio data:", error);
      });
  };

  const handleDownload = () => {
    if (recordedAudio) {
      const downloadLink = URL.createObjectURL(recordedAudio);
      const a = document.createElement("a");
      a.href = downloadLink;
      a.download = "recorded_audio.webm";
      a.click();
      URL.revokeObjectURL(downloadLink);
      sendAudioData(downloadLink);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleJoinedUser = useCallback(({ emailId, id }) => {
    console.log(`User with ${emailId} joined the room.`);
    setUserEmail(emailId);
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
        setCaller(from);
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
      <h1>Chatting Room</h1>

      {remoteSocketId ? (
        <h4 className="online">Another user joined the room.</h4>
      ) : (
        <h4 style={{ color: "grey" }}>No one in the room</h4>
      )}

      {/* <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4> */}

      <div className="options">
        {myStream && caller && (
          <>
            <p>Incoming call from {caller}</p>
            <button className="btn-send-stream" onClick={sendStreams}>
              call receive
            </button>
          </>
        )}
        {remoteSocketId && (
          <button className="btn-call" onClick={handleCallUser}>
            {`call ${userEmail}`}
          </button>
        )}
      </div>

      <div className="video-stream">
        <div className="my-stream">
          {myStream && (
            <>
              <h2>my stream</h2>
              <ReactPlayer
                playing
                muted={isMuted}
                width="300px"
                height="200px"
                url={myStream}
              />

              <button onClick={handleMuteToggle}>
                {isMuted ? (
                  <Icon icon="ant-design:audio-muted-outlined" />
                ) : (
                  <Icon icon="ant-design:audio-outlined" />
                )}
              </button>
            </>
          )}
        </div>

        <div className="remote-stream">
          {remoteStream && (
            <>
              <h2>remote stream</h2>
              <ReactPlayer
                playing
                muted={isMuted}
                width="300px"
                height="200px"
                url={remoteStream}
              />
            </>
          )}
        </div>
      </div>

      <div>
        {/* {recording ? ( */}
        <button onClick={handleStartRecording}>start recording</button>
        {/* ) : ( */}
        <button onClick={handleStopRecording}>stop recording</button>
        {/* )} */}
        {recordedAudio && (
          <button onClick={handleDownload}>Download Audio</button>
        )}
      </div>
    </div>
  );
};

export default Room;
