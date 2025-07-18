import { Link, useParams } from "react-router-dom";
import { IConversation, IUser } from "@/types";
import { multiFormatDateString } from "@/lib/utils";

type ConversationItemProps = {
  conversation: IConversation;
  currentUserId: string;
  otherUser: IUser;
};

const ConversationItem = ({ conversation, currentUserId, otherUser }: ConversationItemProps) => {
  const { conversationId } = useParams();
  const isUnread = conversation.lastMessageSender !== currentUserId && conversation.lastMessage;
  const isActive = conversationId === conversation.id;

  return (
    <Link
      to={`/chat/${conversation.id}`}
      className={`flex items-center gap-3 p-4 hover:bg-dark-3 rounded-lg transition-colors ${
        isActive ? "bg-dark-3 border-l-4 border-primary-500" : ""
      }`}
    >
      <div className="relative">
        <img
          src={otherUser.imageUrl || "/assets/icons/profile-placeholder.svg"}
          alt={otherUser.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        {isUnread && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-white text-sm font-medium truncate">
            {otherUser.name}
          </h3>
          {conversation.lastMessageTime && (
            <span className="text-light-3 text-xs">
              {multiFormatDateString(conversation.lastMessageTime)}
            </span>
          )}
        </div>
        
        <p className={`text-sm truncate mt-1 ${
          isUnread ? "text-white font-medium" : "text-light-3"
        }`}>
          {conversation.lastMessage || "Start a conversation"}
        </p>
      </div>
    </Link>
  );
};

export default ConversationItem;