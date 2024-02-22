import Register from "./Register.jsx";
import {useContext} from "react";
import {UserContext} from "./usercontext.jsx";
import { Chat } from "./chat.jsx";
// import Chat from "./Chat";

export default function Routes() {
  const {username, id} = useContext(UserContext);
    // console.log("routes",username)
    // console.log("routes",id)
  if (username) {
    return <Chat/>
  }

  return (
    <Register />
  );
}