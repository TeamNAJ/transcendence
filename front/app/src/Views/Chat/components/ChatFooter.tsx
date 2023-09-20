import React, { useState } from 'react';
import { Socket } from 'socket.io-client';

type ChatFooterProps =
{
  socket?:  SocketIOClient.Socket | null;
}

const ChatFooter = (props: ChatFooterProps) => {
  const [message, setMessage] = useState('');

  const handleSendMessage = (e: any) => {
    e.preventDefault();
    if (message.trim() && localStorage.getItem('userName')) {
     props.socket?.emit('message', {
        text: message,
        name: localStorage.getItem('userName'),
        id: `${props.socket?.id}${Math.random()}`,
        socketID: props.socket?.id,
      });
    }
    setMessage('');
  };
  return <div className="chat__footer">...</div>;
};

export default ChatFooter;