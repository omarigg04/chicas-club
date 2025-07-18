import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useGetMessages, useGetUserById } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { IMessage } from "@/types";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";
import Loader from "@/components/shared/Loader";

const ChatWindow = () => {
  const { conversationId } = useParams();
  const { user } = useUserContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [previousConversationId, setPreviousConversationId] = useState<string | undefined>();
  
  console.log("ChatWindow render - conversationId:", conversationId);
  
  // Enable realtime updates for this conversation
  useRealtimeMessages(conversationId);
  
  const { data: messagesData, isLoading } = useGetMessages(conversationId || "");
  
  const messages = messagesData?.documents || [];
  
  // Get other user info from conversation participants or messages
  const [otherUserId, setOtherUserId] = useState<string>("");
  const { data: otherUser } = useGetUserById(otherUserId);

  // Find other user ID when conversation or messages change
  useEffect(() => {
    console.log("ChatWindow useEffect - conversationId:", conversationId, "messages:", messages.length);
    if (conversationId && user?.id) {
      // First try to get from messages
      const messageOtherUserId = messages.find(msg => msg.senderId !== user.id)?.senderId;
      console.log("Found other user ID:", messageOtherUserId);
      if (messageOtherUserId) {
        setOtherUserId(messageOtherUserId);
      }
      // TODO: Could also get from conversation participants when we have that data
    }
  }, [conversationId, messages, user?.id]);

  // Reset scroll when conversation changes
  useEffect(() => {
    if (conversationId !== previousConversationId) {
      setPreviousConversationId(conversationId);
      // Scroll immediately when conversation changes
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 100);
    }
  }, [conversationId, previousConversationId]);

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
    <>
      {/* Chat Header */}
      <div className="p-4 border-b border-dark-4 flex-shrink-0">
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
          messages.map((message: any) => (
            <MessageItem
              key={message.$id}
              message={message as IMessage}
              currentUserId={user?.id || ""}
              isOwn={message.senderId === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0">
        <MessageInput conversationId={conversationId} />
      </div>
    </>
  );
};

export default ChatWindow;