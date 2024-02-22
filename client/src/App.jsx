
import axios from "axios"
import {  UserContextProvider } from "./usercontext";
import Routes from "./Routes";

function App() {
  axios.defaults.baseURL="http://localhost:5100";
  axios.defaults.withCredentials=true;

  // const {Username}=useContext(UserContext)
  return (
    <UserContextProvider>
      <Routes/>
    </UserContextProvider>
    // <Register/>
  )
}

export default App
