import { Models } from "appwrite";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../ui/button";
import { useCreateOrGetConversation } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

type UserCardProps = {
  user: Models.Document;
};

const UserCard = ({ user }: UserCardProps) => {
  const navigate = useNavigate();
  const { user: currentUser } = useUserContext();
  const { toast } = useToast();
  const { mutateAsync: createOrGetConversation, isPending } = useCreateOrGetConversation();

  const handleStartChat = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) return;
    
    try {
      const conversation = await createOrGetConversation([currentUser.id, user.$id]);
      if (conversation) {
        navigate(`/chat/${conversation.$id}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="user-card">
      <Link to={`/profile/${user.$id}`}>
        <img
          src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
          alt="creator"
          className="rounded-full w-14 h-14"
        />
      </Link>

      <div className="flex-center flex-col gap-1">
        <Link to={`/profile/${user.$id}`}>
          <p className="base-medium text-light-1 text-center line-clamp-1">
            {user.name}
          </p>
          <p className="small-regular text-light-3 text-center line-clamp-1">
            @{user.username}
          </p>
        </Link>
      </div>

      <div className="flex gap-2">
        <Button type="button" size="sm" className="shad-button_primary px-3">
          Follow
        </Button>
        <Button 
          type="button" 
          size="sm" 
          className="shad-button_dark_4 px-3"
          onClick={handleStartChat}
          disabled={isPending}
        >
          {isPending ? "..." : "Chat"}
        </Button>
      </div>
    </div>
  );
};

export default UserCard;
