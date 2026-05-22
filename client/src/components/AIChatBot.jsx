import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  MessageSquare, 
  Send, 
  X, 
  Sparkles, 
  Car, 
  Trash2, 
  Bot, 
  User, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';

const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Dragging State
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, posX: 0, posY: 0 });

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('a')) return;

    dragRef.current.isDragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.posX = position.x;
    dragRef.current.posY = position.y;
    
    setIsDragging(true);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e) => {
    if (!dragRef.current.isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    setPosition({
      x: dragRef.current.posX + dx,
      y: dragRef.current.posY + dy
    });
  };

  const handleMouseUp = () => {
    dragRef.current.isDragging = false;
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Initialize/Retrieve chat history from sessionStorage so it persists per tab session
  useEffect(() => {
    const savedMessages = sessionStorage.getItem('auto_book_ai_chat');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Error parsing saved chat history:", e);
      }
    } else {
      // Set a nice default welcome message
      const defaultWelcome = {
        role: 'assistant',
        content: `👋 **Hello! I am AutoBook AI, your dedicated Vehicle Rental Assistant.** 

How can I help you today? You can ask me about:
- Available **cars, bikes, or SUVs** in our database
- **Prices and locations** for rentals
- How to **book** a vehicle on our platform

Feel free to type a question below or tap one of the suggested questions!`
      };
      setMessages([defaultWelcome]);
      sessionStorage.setItem('auto_book_ai_chat', JSON.stringify([defaultWelcome]));
    }
  }, []);

  // Sync scroll to bottom when messages list updates or chat opens
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when chat window is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    if (!textToSend) {
      setInputValue('');
    }

    const newUserMessage = { role: 'user', content: query };
    const updatedMessages = [...messages, newUserMessage];
    
    setMessages(updatedMessages);
    sessionStorage.setItem('auto_book_ai_chat', JSON.stringify(updatedMessages));
    setIsLoading(true);

    try {
      // Send chat history to backend endpoint
      const response = await axios.post('/api/ai/chat', {
        messages: updatedMessages
      });

      const reply = response.data.message;
      setDemoMode(response.data.demoMode || false);

      const nextMessages = [...updatedMessages, reply];
      setMessages(nextMessages);
      sessionStorage.setItem('auto_book_ai_chat', JSON.stringify(nextMessages));
    } catch (error) {
      console.error("Error contacting AI chatbot backend:", error);
      const errorMessage = {
        role: 'assistant',
        content: "⚠️ **Oops! I ran into an error connecting to the server.** Please ensure your server is running and try again in a few moments."
      };
      const nextMessages = [...updatedMessages, errorMessage];
      setMessages(nextMessages);
      sessionStorage.setItem('auto_book_ai_chat', JSON.stringify(nextMessages));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your conversation history?")) {
      const defaultWelcome = {
        role: 'assistant',
        content: `👋 **Hello! I am AutoBook AI, your dedicated Vehicle Rental Assistant.** 

How can I help you today? You can ask me about:
- Available **cars, bikes, or SUVs** in our database
- **Prices and locations** for rentals
- How to **book** a vehicle on our platform

Feel free to type a question below or tap one of the suggested questions!`
      };
      setMessages([defaultWelcome]);
      sessionStorage.setItem('auto_book_ai_chat', JSON.stringify([defaultWelcome]));
      setDemoMode(false);
    }
  };

  const suggestionChips = [
    "What cars are available?",
    "Show me bikes for rent",
    "How do I book a vehicle?",
    "Where can I rent vehicles?"
  ];

  // Helper function to format basic markdown-like text in messages
  const formatMessageContent = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let formattedLine = line;
      
      // Bold formatting: **text** -> <strong>text</strong>
      formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic formatting: *text* -> <em>text</em>
      formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Bullet list items
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        const cleanText = line.trim().replace(/^[-•]\s+/, '');
        const htmlText = cleanText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
        return (
          <li key={idx} className="ml-5 list-disc mb-1.5 text-sm" dangerouslySetInnerHTML={{ __html: htmlText }} />
        );
      }
      
      return (
        <p key={idx} className="mb-2 leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: formattedLine }} />
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] font-sans">
      {/* 1. FLOATING LAUNCHER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 transform cursor-pointer relative hover:scale-110 active:scale-95 ${
          isOpen 
            ? 'bg-gray-800 hover:bg-gray-900 rotate-90' 
            : 'bg-gradient-to-tr from-primary-600 to-indigo-600 shadow-primary-500/20 hover:shadow-primary-500/40'
        }`}
        title={isOpen ? "Close AI Assistant" : "Chat with AI Assistant"}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageSquare className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 flex items-center justify-center text-[9px] text-white font-bold">ai</span>
            </span>
          </>
        )}
      </button>

      <div
        className={`fixed bottom-24 right-0 md:right-0 w-[350px] max-w-[calc(100vw-2rem)] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right z-50 ${
          isOpen 
            ? 'scale-100 opacity-100 translate-y-0 visible' 
            : 'scale-90 opacity-0 translate-y-10 invisible'
        }`}
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s, opacity 0.3s, scale 0.3s'
        }}
      >
        {/* Header Section */}
        <div 
          className="bg-gradient-to-r from-primary-600 to-indigo-600 p-4 text-white flex justify-between items-center shadow-md cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/10 rounded-xl backdrop-blur-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                AutoBook Assistant
                <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-normal">Groq</span>
              </h3>
              <p className="text-[11px] text-primary-100">Live Vehicle Rental Guide</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClearHistory}
              className="p-1.5 hover:bg-white/10 rounded-lg text-primary-100 hover:text-white transition-colors cursor-pointer"
              title="Clear Chat History"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-primary-100 hover:text-white transition-colors cursor-pointer"
              title="Minimize Chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Demo Mode Banner Indicator */}
        {demoMode && (
          <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-start gap-2 text-amber-800 text-[11px] leading-normal animate-fadeIn">
            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Demo Mode:</strong> Server is running without a configured <code>GROQ_API_KEY</code>. Utilizing local database search engine instead.
            </div>
          </div>
        )}

        {/* Message Container Area */}
        <div className="flex-grow p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4 scroll-smooth">
          {messages.map((msg, index) => {
            const isAI = msg.role === 'assistant';
            return (
              <div 
                key={index} 
                className={`flex gap-2 max-w-[85%] ${isAI ? 'self-start' : 'self-end flex-row-reverse'}`}
              >
                {/* Avatar Icon */}
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                  isAI 
                    ? 'bg-indigo-50 border border-indigo-100 text-indigo-600' 
                    : 'bg-primary-600 text-white'
                }`}>
                  {isAI ? <Bot className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                </div>

                {/* Message Bubble content */}
                <div className={`p-3 rounded-2xl shadow-sm text-gray-800 text-sm leading-relaxed border ${
                  isAI 
                    ? 'bg-white rounded-tl-sm border-gray-100 text-left' 
                    : 'bg-primary-50 border-primary-100 rounded-tr-sm text-left'
                }`}>
                  {formatMessageContent(msg.content)}
                </div>
              </div>
            );
          })}

          {/* Typing Loading Indicator */}
          {isLoading && (
            <div className="flex gap-2 max-w-[80%] self-start animate-pulse">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-50 border border-indigo-100 text-indigo-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
              </div>
              <div className="p-3 bg-white rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips Area (Only shown when not loading and when chat is at bottom) */}
        {!isLoading && (
          <div className="px-4 py-2 bg-white border-t border-gray-100 flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="text-[11px] bg-indigo-50/60 hover:bg-indigo-50 text-indigo-700 font-medium px-2.5 py-1 rounded-full border border-indigo-100/40 transition hover:border-indigo-100 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Message Input Form area */}
        <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            placeholder="Ask about cars, bikes, bookings..."
            className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all disabled:opacity-50"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputValue.trim()}
            className="p-2.5 bg-gradient-to-tr from-primary-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none cursor-pointer flex items-center justify-center flex-shrink-0"
            title="Send Message"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatBot;
