import React, { useContext, useEffect, useState } from "react";
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

  // we are going to handle this handler only after we get response of being joined to room from server
  const joinedRoomHandler = ({ roomId }) => {
    // console.log("Room joined: ", roomId);
    navigate(`/${roomId}`);
  };

  useEffect(() => {
    socket.on("joined-room", joinedRoomHandler);
  }, [socket]);

  //   we handle this handler for requesting to join room
  const joinHandler = (e) => {
    e.preventDefault();
    socket.emit("join-room", {
      roomId: userData.roomId,
      emailId: userData.emailId,
    });
  };

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
