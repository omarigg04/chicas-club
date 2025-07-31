import { Models } from "appwrite";
import { Link } from "react-router-dom";

import { useUserContext } from "@/context/AuthContext";
import { useIsGroupMember, useGetRequestStatusForGroup, useRequestToJoinGroup } from "@/lib/react-query/queries";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

type GroupCardProps = {
  group: Models.Document;
};

const GroupCard = ({ group }: GroupCardProps) => {
  const { toast } = useToast();
  const { user } = useUserContext();

  const { data: isMember, isLoading: isCheckingMembership } = useIsGroupMember(group.$id, user.id);
  const { data: requestStatus } = useGetRequestStatusForGroup(group.$id, user.id);
  const { mutate: requestToJoin, isPending: isRequestingToJoin } = useRequestToJoinGroup();

  const handleJoinGroup = () => {
    if (!user.id || !group.$id) return;

    requestToJoin(
      { groupId: group.$id, userId: user.id },
      {
        onSuccess: () => {
          toast({
            title: "Request sent!",
            description: "Your request to join this group has been sent to the admin.",
          });
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.message || "Failed to send request. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const getButtonContent = () => {
    if (isCheckingMembership) return "Loading...";
    
    if (isMember) {
      return (
        <Link to={`/groups/${group.$id}`}>
          <Button className="shad-button_primary px-8">
            View Group
          </Button>
        </Link>
      );
    }

    if (requestStatus?.status === "pending") {
      return (
        <Button disabled className="shad-button_ghost px-8">
          Pending
        </Button>
      );
    }

    if (requestStatus?.status === "rejected") {
      return (
        <Button disabled className="shad-button_ghost px-8">
          Request Rejected
        </Button>
      );
    }

    return (
      <Button 
        onClick={handleJoinGroup}
        disabled={isRequestingToJoin}
        className="shad-button_primary px-8"
      >
        {isRequestingToJoin ? "Sending..." : "Join Group"}
      </Button>
    );
  };

  return (
    <div className="group-card">
      <div className="flex-between">
        <div className="flex items-center gap-3">
          <Link to={`/groups/${group.$id}`}>
            <img
              src={
                group.imageUrl || "/assets/icons/profile-placeholder.svg"
              }
              alt="group"
              className="w-14 h-14 rounded-full"
            />
          </Link>

          <div className="flex flex-col">
            <Link to={`/groups/${group.$id}`}>
              <p className="body-bold text-light-1">{group.name}</p>
            </Link>
            <p className="small-regular text-light-3">
              {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>

        {getButtonContent()}
      </div>

      {group.description && (
        <div className="mt-3">
          <p className="small-medium text-light-2 line-clamp-2">
            {group.description}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        <div className="flex items-center gap-1">
          <img
            src="/assets/icons/profile-placeholder.svg"
            alt="admin"
            className="w-4 h-4 rounded-full"
          />
          <p className="tiny-medium text-light-3">
            Private Group
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroupCard;