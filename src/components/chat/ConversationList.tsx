import { useGetUserConversations, useGetUserById } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";
import { useRealtimeConversations } from "@/hooks/useRealtimeMessages";
import { IConversation } from "@/types";
import ConversationItem from "./ConversationItem";
import Loader from "@/components/shared/Loader";

interface ConversationListProps {
  onConversationSelect?: () => void;
}

const ConversationList = ({ onConversationSelect }: ConversationListProps) => {
  const { user } = useUserContext();
  
  // Enable realtime updates for conversations
  useRealtimeConversations(user?.id);
  
  const { data: conversationsData, isLoading } = useGetUserConversations(user?.id || "");
  
  const conversations = conversationsData?.documents || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center">
        <h3 className="text-light-1 font-medium mb-2">No conversations yet</h3>
        <p className="text-light-3 text-sm">
          Start a conversation by visiting someone's profile
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation: any) => {
        // Get the other user's ID
        const otherUserId = conversation.participants?.find(
          (participant: string) => participant !== user?.id
        );
        
        return (
          <ConversationItemWithUser
            key={conversation.$id}
            conversation={conversation as IConversation}
            currentUserId={user?.id || ""}
            otherUserId={otherUserId || ""}
            onSelect={onConversationSelect}
          />
        );
      })}
    </div>
  );
};

// Helper component to fetch other user data
const ConversationItemWithUser = ({ 
  conversation, 
  currentUserId, 
  otherUserId,
  onSelect
}: {
  conversation: IConversation;
  currentUserId: string;
  otherUserId: string;
  onSelect?: () => void;
}) => {
  const { data: otherUser } = useGetUserById(otherUserId);
  
  if (!otherUser) {
    return (
      <div className="p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-dark-3 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-dark-3 rounded w-24 mb-2" />
            <div className="h-3 bg-dark-3 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ConversationItem
      conversation={conversation}
      currentUserId={currentUserId}
      otherUser={otherUser as any}
      onSelect={onSelect}
    />
  );
};

export default ConversationList;