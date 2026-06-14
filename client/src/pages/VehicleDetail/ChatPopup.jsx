import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';

const ChatPopup = ({ isOpen, onClose, chatRoom, vehicle, user, socket, messages, setMessages, newMessage, setNewMessage, onSendMessage }) => {
  // Chat Card Dragging State & Refs
  const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 });
  const [isChatDragging, setIsChatDragging] = useState(false);
  const chatDragRef = useRef({ isDragging: false, startX: 0, startY: 0, posX: 0, posY: 0 });

  const handleChatMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('svg')) return;

    chatDragRef.current.isDragging = true;
    chatDragRef.current.startX = e.clientX;
    chatDragRef.current.startY = e.clientY;
    chatDragRef.current.posX = chatPosition.x;
    chatDragRef.current.posY = chatPosition.y;
    
    setIsChatDragging(true);
    
    document.addEventListener('mousemove', handleChatMouseMove);
    document.addEventListener('mouseup', handleChatMouseUp);
    
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  };

  const handleChatMouseMove = (e) => {
    if (!chatDragRef.current.isDragging) return;
    const dx = e.clientX - chatDragRef.current.startX;
    const dy = e.clientY - chatDragRef.current.startY;
    
    setChatPosition({
      x: chatDragRef.current.posX + dx,
      y: chatDragRef.current.posY + dy
    });
  };

  const handleChatMouseUp = () => {
    chatDragRef.current.isDragging = false;
    setIsChatDragging(false);
    document.removeEventListener('mousemove', handleChatMouseMove);
    document.removeEventListener('mouseup', handleChatMouseUp);
    
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleChatMouseMove);
      document.removeEventListener('mouseup', handleChatMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 md:bottom-10 md:right-10 w-[300px] h-[400px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-200 flex flex-col z-[100] overflow-hidden"
      style={{
        transform: `translate(${chatPosition.x}px, ${chatPosition.y}px)`,
        transition: isChatDragging ? 'none' : 'transform 0.3s'
      }}
    >
      {/* Header */}
      <div 
        className="bg-blue-600 p-3 flex justify-between items-center text-white cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleChatMouseDown}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold text-sm">
            {vehicle?.owner?.name?.charAt(0) || 'O'}
          </div>
          <div>
            <p className="font-bold text-sm leading-tight truncate max-w-[150px]">{vehicle?.owner?.name}</p>
            <p className="text-[10px] text-blue-200">Owner</p>
          </div>
        </div>
        <button onClick={onClose} className="text-blue-200 hover:text-white transition">
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 p-3 overflow-y-auto bg-gray-50 flex flex-col gap-2 custom-scrollbar">
        {messages.length === 0 ? (
          <p className="text-xs text-center text-gray-400 mt-auto mb-auto">Start chatting with {vehicle?.owner?.name}</p>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.senderId === user?._id;
            return (
              <div key={idx} className={`max-w-[85%] p-2.5 rounded-2xl text-sm ${isMine ? 'bg-blue-600 text-white self-end rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 self-start rounded-tl-none shadow-sm'}`}>
                <p>{msg.messageText}</p>
                <p className={`text-[9px] mt-1 text-right ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            );
          })
        )}
      </div>
      
      {/* Input Area */}
      <form onSubmit={onSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type message..." 
          className="flex-1 bg-gray-100 rounded-full px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" disabled={!newMessage.trim()} className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 hover:bg-blue-700 transition flex-shrink-0">
          <Send className="h-4 w-4 -ml-0.5" />
        </button>
      </form>
    </div>
  );
};

export default ChatPopup;
