import { useState } from "react";
import { ConversationList, ChatWindow, UserSearch } from "@/components/chat";
import { useParams, useSearchParams } from "react-router-dom";

const Chat = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { conversationId: paramConversationId } = useParams();
  const [searchParams] = useSearchParams();
  
  // Check if there's an active conversation
  const hasActiveConversation = paramConversationId || searchParams.get('conversation');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleConversationSelect = () => {
    // Auto-hide sidebar on mobile when conversation is selected
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen max-h-screen overflow-hidden relative">
      {/* Sidebar Toggle Button - Solo mostrar cuando sidebar está oculto */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-20 left-4 z-50 p-2 bg-dark-3 border border-dark-4 rounded-lg hover:bg-dark-2 transition-all duration-300"
        >
          <div className="w-5 h-5 flex flex-col justify-center gap-1">
            <div className="w-full h-0.5 bg-white rounded"></div>
            <div className="w-full h-0.5 bg-white rounded"></div>
            <div className="w-full h-0.5 bg-white rounded"></div>
          </div>
        </button>
      )}

      {/* Conversations Sidebar */}
      <div className={`
        w-80 border-r border-dark-4 bg-dark-2 flex flex-col transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isSidebarOpen 
          ? 'fixed inset-y-0 left-0 z-[100] translate-x-0' 
          : 'fixed inset-y-0 left-0 z-[100] -translate-x-full lg:w-0 lg:border-r-0'
        }
      `}>
        <div className="p-4 border-b border-dark-4">
          <h2 className="text-xl font-bold text-light-1 mb-4">Messages</h2>
          <UserSearch onUserSelect={handleConversationSelect} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList onConversationSelect={handleConversationSelect} />
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[90] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Chat Window */}
      <div className={`
        flex-1 bg-dark-1 flex flex-col transition-all duration-300
        ${isSidebarOpen ? 'lg:ml-0' : 'lg:ml-0'}
      `}>
        {hasActiveConversation ? (
          <ChatWindow />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-light-3">
              <img
                src="/assets/icons/chat.svg"
                alt="No conversation"
                width={80}
                height={80}
                className="mx-auto mb-4 opacity-50 filter brightness-0 invert"
              />
              <h3 className="text-xl font-semibold mb-2">Selecciona una conversación</h3>
              <p className="text-sm">Elige una conversación del sidebar o busca un usuario para empezar a chatear</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;