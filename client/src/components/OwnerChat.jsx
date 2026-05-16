import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { Search, Info, X, Send, ArrowLeft, MessageCircle } from 'lucide-react';

const OwnerChat = () => {
  const { user } = useContext(AuthContext);
  const [chatRooms, setChatRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('booked'); // 'booked' or 'unbooked'
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const activeChatRef = useRef(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    fetchChats();
    const newSocket = io();
    setSocket(newSocket);
    
    newSocket.on('receive_message', (data) => {
      setMessages((prev) => {
        // Use activeChatRef.current to avoid closure trapping null
        if (data.roomId === activeChatRef.current?._id) {
          return [...prev, data];
        }
        return prev;
      });
      fetchChats(); // Refresh chat list for unread counts & latest message
    });

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (socket && activeChat) {
      socket.emit('join_room', activeChat._id);
      fetchMessages(activeChat._id);
    }
  }, [activeChat, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/chats/owner', config);
      setChatRooms(data);
    } catch (err) {
      console.error('Error fetching chats', err);
    }
  };

  const fetchMessages = async (roomId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`/api/chats/room/${roomId}/messages`, config);
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !activeChat) return;

    const messageData = {
      chatroomId: activeChat._id,
      receiverId: activeChat.userId, // Sending to user
      messageText: newMessage
    };

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data: savedMessage } = await axios.post('/api/chats/message', messageData, config);
      
      socket.emit('send_message', { ...savedMessage, roomId: activeChat._id });
      setMessages((prev) => [...prev, savedMessage]);
      setNewMessage('');
      fetchChats();
    } catch (err) {
      console.error('Error sending message', err);
    }
  };

  const bookedChats = chatRooms.filter(c => c.isBooked);
  const unbookedChats = chatRooms.filter(c => !c.isBooked);
  const currentList = activeTab === 'booked' ? bookedChats : unbookedChats;

  const totalBookedUnread = bookedChats.reduce((acc, curr) => acc + curr.unreadCount, 0);
  const totalUnbookedUnread = unbookedChats.reduce((acc, curr) => acc + curr.unreadCount, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[600px] flex overflow-hidden">
      
      {/* Left Sidebar (Chat List) */}
      <div className={`w-full md:w-1/3 border-r border-gray-100 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50">
          <button 
            onClick={() => setActiveTab('booked')}
            className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition ${activeTab === 'booked' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}
          >
            BOOKED [{bookedChats.length}]
            {totalBookedUnread > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{totalBookedUnread}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('unbooked')}
            className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition ${activeTab === 'unbooked' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}
          >
            UNBOOKED [{unbookedChats.length}]
            {totalUnbookedUnread > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{totalUnbookedUnread}</span>}
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {currentList.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No chats in this section.</div>
          ) : (
            currentList.map(chat => (
              <div 
                key={chat._id} 
                onClick={() => { setActiveChat(chat); setShowUserInfo(false); }}
                className={`flex items-center gap-3 p-4 cursor-pointer border-b border-gray-50 hover:bg-gray-50 transition ${activeChat?._id === chat._id ? 'bg-primary-50' : ''}`}
              >
                <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold flex-shrink-0">
                  {chat.userName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-gray-900 truncate">{chat.userName}</h4>
                    <span className="text-[10px] text-gray-400">{new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500 truncate pr-2">{chat.lastMessage || 'Started a chat'}</p>
                    {chat.unreadCount > 0 && (
                      <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">{chat.unreadCount}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-primary-600 mt-1 font-medium truncate">{chat.vehicleId?.name}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Side (Active Chat / User Info) */}
      <div className={`flex-1 flex flex-col relative ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
            <p>Select a chat to start messaging</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden text-gray-400 hover:text-gray-600">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                  {activeChat.userName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{activeChat.userName}</h3>
                  <p className="text-xs text-gray-500">{activeChat.vehicleId?.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowUserInfo(!showUserInfo)} 
                className={`p-2 rounded-full transition ${showUserInfo ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <Info className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50 flex flex-col gap-4">
              {messages.map((msg, idx) => {
                const isMine = msg.senderId === user?._id;
                return (
                  <div key={idx} className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${isMine ? 'bg-primary-600 text-white self-end rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 self-start rounded-tl-none'}`}>
                    <p>{msg.messageText}</p>
                    <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-primary-200' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-3">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..." 
                className="flex-1 bg-gray-100 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button type="submit" disabled={!newMessage.trim()} className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center disabled:opacity-50 hover:bg-primary-700 transition flex-shrink-0 shadow-md">
                <Send className="h-5 w-5 ml-1" />
              </button>
            </form>

            {/* User Info Sliding Panel */}
            <div className={`absolute top-0 right-0 bottom-0 w-[300px] bg-white border-l border-gray-100 shadow-2xl transition-transform duration-300 ease-in-out z-20 ${showUserInfo ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <button onClick={() => setShowUserInfo(false)} className="text-gray-400 hover:text-gray-600">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="font-bold text-gray-900">User Details</h3>
              </div>
              
              <div className="p-6 flex flex-col items-center border-b border-gray-50">
                <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl mb-4">
                  {activeChat.userName.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{activeChat.userName}</h3>
                <p className="text-sm text-gray-500">Member</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">Contact Info</p>
                  <p className="text-sm text-gray-900 font-medium">📱 {activeChat.userContact}</p>
                  <p className="text-sm text-gray-900 font-medium">📧 {activeChat.userEmail}</p>
                </div>
                
                <div className="pt-4 border-t border-gray-50">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-2">Booking Details</p>
                  {!activeChat.isBooked ? (
                    <p className="text-sm text-gray-500 italic">No booking yet</p>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-sm font-bold text-gray-900 mb-1">{activeChat.vehicleId?.name}</p>
                      <p className="text-xs text-gray-600">
                        {activeChat.bookingId ? `${new Date(activeChat.bookingId.pickupDate).toLocaleDateString()} - ${new Date(activeChat.bookingId.returnDate).toLocaleDateString()}` : 'Dates not available'}
                      </p>
                      <span className="mt-2 inline-block px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-md">
                        {activeChat.bookingId?.bookingStatus || 'Confirmed'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default OwnerChat;
