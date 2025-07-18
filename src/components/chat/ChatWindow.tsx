import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useGetMessages, useGetUserById } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";
import Loader from "@/components/shared/Loader";

const ChatWindow = () => {
  const { conversationId } = useParams();
  const { user } = useUserContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Enable realtime updates for this conversation
  useRealtimeMessages(conversationId);
  
  const { data: messagesData, isLoading } = useGetMessages(conversationId || "");
  
  const messages = messagesData?.documents || [];
  
  // Get other user info (assuming we have it in first message)
  const otherUserId = messages.find(msg => msg.senderId !== user?.id)?.senderId;
  const { data: otherUser } = useGetUserById(otherUserId || "");

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-light-1 mb-2">
            Welcome to Chat
          </h2>
          <p className="text-light-3">
            Select a conversation to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-dark-4">
        <div className="flex items-center gap-3">
          <img
            src={otherUser?.imageUrl || "/assets/icons/profile-placeholder.svg"}
            alt={otherUser?.name || "User"}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="text-white font-medium">
              {otherUser?.name || "Loading..."}
            </h3>
            <p className="text-light-3 text-sm">
              @{otherUser?.username || "..."}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-light-3 text-center">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message.$id}
              message={message}
              currentUserId={user?.id || ""}
              isOwn={message.senderId === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput conversationId={conversationId} />
    </div>
  );
};

export default ChatWindow;