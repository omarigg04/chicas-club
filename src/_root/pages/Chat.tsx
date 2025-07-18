import { ConversationList, ChatWindow } from "@/components/chat";

const Chat = () => {
  return (
    <div className="flex h-screen max-h-screen overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-dark-4 bg-dark-2 flex flex-col">
        <div className="p-4 border-b border-dark-4">
          <h2 className="text-xl font-bold text-light-1">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList />
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-dark-1 flex flex-col">
        <ChatWindow />
      </div>
    </div>
  );
};

export default Chat;