import React, { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SocketContext } from "../../context/SocketContext";
import "./home.css";

const Home = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    emailId: "",
    roomId: "",
  });
  const { socket } = useContext(SocketContext);

  //   we handle this handler for requesting to join room
  const joinHandler = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("join:room", {
        roomId: userData.roomId,
        emailId: userData.emailId,
      });
    },
    [userData.emailId, userData.roomId, socket]
  );

  // we are going to handle this handler only after we get response of being joined to room from server
  const handleJoinRoom = useCallback((data) => {
    const { emailId, roomId } = data;
    navigate(`/${roomId}`);
  }, []);

  useEffect(() => {
    // this code snippet will run only after "join:room" event handled and send a response from server
    socket.on("join:room", handleJoinRoom);

    // we also need to off the socket so that we can prevent multiple component re-rendering by de-registering the listener
    return () => {
      socket.off("join:room", handleJoinRoom);
    };
  }, [socket]);

  return (
    <div className="home-container">
      <h1 style={{ margin: "2rem" }}>Welcome to Video Chat App</h1>
      <form onSubmit={joinHandler}>
        <input
          className="input-field"
          type="text"
          placeholder="Enter your email"
          value={userData.emailId}
          onChange={(e) =>
            setUserData({ ...userData, emailId: e.target.value })
          }
        />
        <input
          className="input-field"
          type="text"
          placeholder="Enter Room code"
          value={userData.roomId}
          onChange={(e) => setUserData({ ...userData, roomId: e.target.value })}
        />
        <button type="submit" className="btn-primary">
          Join
        </button>
      </form>
    </div>
  );
};

export default Home;
