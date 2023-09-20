import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/ChatHome';
import ChatPage from './components/ChatPage';
import socketIO from 'socket.io-client';

const socket = socketIO.connect('http://localhost:3001');
function App() {
  return (
    <BrowserRouter>
      <div>
        <Routes>
          <Route path="/" element={<Home socket={socket} />}></Route>
          <Route path="/the-chat" element={<ChatPage socket={socket} />}></Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;