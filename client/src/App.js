import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/home/Home";
import Room from "./pages/room/Room";

function App() {
  const [userList, setUserList] = useState([]);
  return (
    <div>
      <Routes>
        <Route
          path="/"
          element={<Home userList={userList} setUserList={setUserList} />}
        />
        <Route
          path="/:roomId"
          element={<Room userList={userList} setUserList={setUserList} />}
        />
      </Routes>
    </div>
  );
}

export default App;
