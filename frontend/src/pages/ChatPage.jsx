import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { apiUrl, socketUrl } from '../URL\'s/BaseUrl';

function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [room, setRoom] = useState('default');
    const [socket, setSocket] = useState(null);
    const [userToken, setUserToken] = useState('');
    const [userName, setUserName] = useState('');
    const [isNameSet, setIsNameSet] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]); // New state for tracking typing users
   

    const generateAnonymousUserId = () => {
      return uuidv4();
    };

    const fetchChatHistory = async () => {
        try {
            const response = await axios.get(`${apiUrl}/api/messages/${room}`);
            if (Array.isArray(response.data)) {
                 setMessages(response.data);
            } else {
               console.error('Error: Expected an array of messages');
            }
       } catch (error) {
         console.error('Error fetching chat history:', error);
        }
    };


    const fetchUserName = async (token) => {
       try {
          const response = await axios.post(`${apiUrl}/api/users/get-user-data`, { token });
          if (response.data.userName) {
             setUserName(response.data.userName);
               setIsNameSet(true);
           }
       } catch (error) {
            console.error('Error fetching user data', error);
       }
   };

    useEffect(() => {
      const storedToken = localStorage.getItem('userToken');
      if (storedToken) {
           setUserToken(storedToken);
           fetchUserName(storedToken);
        }


       const newSocket = io(`${socketUrl}`);
      setSocket(newSocket);

       return () => {
          if (newSocket) {
              newSocket.disconnect();
          }
       };
    }, []);

   useEffect(() => {
     if (socket) {
       socket.emit("join_room", room);
       fetchChatHistory();
       socket.on("receive_message", (data) => {
          setMessages((prevMessages) => [...prevMessages, data]);
      });
         socket.on("user_typing", (data) => { // New event listener
            if (data.senderName) { // Make sure data has senderName
                setTypingUsers((prevTypingUsers) => {
                     if (!prevTypingUsers.includes(data.senderName)) {
                           return [...prevTypingUsers, data.senderName];
                        }
                     return prevTypingUsers;
                 });
            }
       });
       }

       return () => {
           if (socket) {
              socket.emit("leave_room", room);
            }
         };
   }, [socket, room]);



   useEffect(() => {
      let timeout;
       if (typingUsers.length > 0) {
         timeout = setTimeout(() => {
           setTypingUsers([]);
          }, 3000);
        }
        return () => clearTimeout(timeout);
      }, [typingUsers]);

     const sendMessage = async () => {
       const senderId = userToken || generateAnonymousUserId();

      if (newMessage.trim() !== '') {
          const messageData = {
              room: room,
              sender: senderId,
              senderName: userName,
              message: newMessage,
           };
           setMessages((prevMessages) => [...prevMessages, messageData]);
           socket.emit('send_message', messageData);
           try {
             await axios.post(`${apiUrl}/api/messages/add`, messageData);
           } catch (error) {
                console.error('Error sending message:', error);
            }
            setNewMessage('');
       }
     };

    const handleTyping = () => {
       socket.emit("typing", { room: room, senderName: userName });
    };

     const handleNameSubmit = async (e) => {
         e.preventDefault();

      if (userName.trim() !== '') {
         try {
           const response = await axios.post(`${apiUrl}/api/users/update-name`, {
              userName: userName,
           });

           if (response.data.token) {
               localStorage.setItem('userToken', response.data.token);
                setUserToken(response.data.token);
                setIsNameSet(true);
               console.log('User name updated and token set');
            } else {
              console.error('Failed to create user');
           }
      } catch (error) {
            console.error('Error updating user name:', error);
          }
        } else {
          console.error("Error: User name is empty");
        }
   };

  if (!isNameSet) {
     return (
       <div className="flex flex-col items-center justify-center h-screen">
         <h1 className="text-2xl font-bold mb-4">Enter Your Name</h1>
         <form onSubmit={handleNameSubmit} className="flex flex-col space-y-4">
           <input
              type="text"
             placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500"
            />
            <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300">Submit</button>
          </form>
       </div>
     );
    }
    return (
       <div className="flex flex-col h-screen bg-gray-100">
            <div className="container mx-auto p-4 flex-1 flex flex-col">
              <h1 className="text-2xl font-bold mb-4">Chat Room</h1>
              <input
                  type="text"
                  placeholder="Enter room name"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="mb-4 border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500"
              />
              <div
                  className="flex-1 overflow-y-auto border rounded p-4 bg-white mb-4"
                  style={{ maxHeight: 'calc(100vh - 200px)' }}
               >
               {messages.map((msg, index) => (
                    <div
                      key={index}
                       className={`mb-2 p-2 rounded ${
                             msg.sender === userToken ? 'bg-green-100 text-right ml-auto' : 'bg-gray-100 text-left mr-auto'
                        }`}
                     >
                          <strong className="block font-medium">{msg.sender === userToken ? "You" : msg.senderName} : </strong>
                        <span className="block">{msg.message}</span>
                     </div>
               ))}
               {typingUsers.length > 0 && (
                  <div className="text-gray-500 italic">
                    {typingUsers.join(', ')} is typing...
                 </div>
                )}
            </div>
          <div className="flex space-x-2">
             <input
               type="text"
               placeholder="Enter message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleTyping} // Call handleTyping on input change
               className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500"
             />
            <button onClick={sendMessage} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300">Send</button>
          </div>
       </div>
    </div>
   );
}
export default ChatPage