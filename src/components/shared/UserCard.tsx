import { Models } from "appwrite";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../ui/button";
import { useCreateOrGetConversation, useFollowUser, useUnfollowUser, useIsFollowing } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

type UserCardProps = {
  user: Models.Document;
};

const UserCard = ({ user }: UserCardProps) => {
  const navigate = useNavigate();
  const { user: currentUser } = useUserContext();
  const { toast } = useToast();
  const { mutateAsync: createOrGetConversation, status } = useCreateOrGetConversation();
  const isCreatingConversation = status === 'loading';
  const { mutateAsync: followUser, status: followStatus } = useFollowUser();
  const { mutateAsync: unfollowUser, status: unfollowStatus } = useUnfollowUser();
  const isFollowPending = followStatus === 'pending';
  const isUnfollowPending = unfollowStatus === 'pending';
  const { data: isFollowingUser, isLoading: isCheckingFollow } = useIsFollowing(currentUser?.id || "", user.$id);

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

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) return;
    
    try {
      if (isFollowingUser) {
        await unfollowUser({ followerId: currentUser.id, followingId: user.$id });
        toast({
          title: "Success",
          description: `You unfollowed ${user.name}`,
        });
      } else {
        await followUser({ followerId: currentUser.id, followingId: user.$id });
        toast({
          title: "Success", 
          description: `You are now following ${user.name}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
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
        <Button 
          type="button" 
          size="sm" 
          className={isFollowingUser ? "shad-button_dark_4 px-3 h-9" : "shad-button_primary px-3 h-9"}
          onClick={handleFollowToggle}
          disabled={isFollowPending || isUnfollowPending || isCheckingFollow || currentUser?.id === user.$id}
        >
          {isFollowPending || isUnfollowPending ? "..." : isFollowingUser ? "Unfollow" : "Follow"}
        </Button>
        <Button 
          type="button" 
          size="sm" 
          className="shad-button_dark_4 px-3 h-9"
          onClick={handleStartChat}
          disabled={isCreatingConversation}
        >
          {isCreatingConversation ? "..." : "Chat"}
        </Button>
      </div>
    </div>
  );
};

export default UserCard;
