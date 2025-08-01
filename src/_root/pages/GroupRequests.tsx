import { useParams } from "react-router-dom";
import { Models } from "appwrite";

import { useUserContext } from "@/context/AuthContext";
import { 
  useGetGroupById, 
  useGetGroupRequestsForAdmin, 
  useApproveGroupRequest, 
  useRejectGroupRequest,
  useGetUserById 
} from "@/lib/react-query/queries";
import { Loader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const GroupRequests = () => {
  const { id } = useParams();
  const { user } = useUserContext();
  const { toast } = useToast();

  const { data: group, isLoading: isGroupLoading } = useGetGroupById(id || "");
  const { data: requests, isLoading: isRequestsLoading } = useGetGroupRequestsForAdmin(user.id);
  const { mutate: approveRequest, isLoading: isApproving } = useApproveGroupRequest();
  const { mutate: rejectRequest, isLoading: isRejecting } = useRejectGroupRequest();

  // Filter requests for this specific group
  const groupRequests = requests?.documents.filter(request => request.groupId === id) || [];

  const handleApprove = (requestId: string) => {
    approveRequest(
      { requestId, currentUserId: user.id },
      {
        onSuccess: () => {
          toast({
            title: "Request approved!",
            description: "The user has been added to the group.",
          });
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.message || "Failed to approve request.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleReject = (requestId: string) => {
    rejectRequest(
      { requestId, currentUserId: user.id },
      {
        onSuccess: () => {
          toast({
            title: "Request rejected",
            description: "The join request has been declined.",
          });
        },
        onError: (error: any) => {
          toast({
            title: "Error", 
            description: error.message || "Failed to reject request.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isGroupLoading || isRequestsLoading) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex-center w-full h-full">
        <p className="body-medium text-light-1">Group not found</p>
      </div>
    );
  }

  // Check if user is admin of this group
  if (group.adminId !== user.id) {
    return (
      <div className="flex flex-1">
        <div className="common-container">
          <div className="flex flex-col items-center justify-center gap-6 mt-10">
            <div className="text-center">
              <h3 className="h3-bold text-light-1 mb-2">Access Denied</h3>
              <p className="body-medium text-light-3">
                Only group administrators can manage join requests.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <div className="common-container">
        <div className="max-w-5xl flex-start gap-3 justify-start w-full">
          <img
            src="/assets/icons/people.svg"
            width={36}
            height={36}
            alt="requests"
          />
          <h2 className="h3-bold md:h2-bold text-left w-full">
            Join Requests for {group.name}
          </h2>
        </div>

        {groupRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 mt-10">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-dark-4 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-light-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="h3-bold text-light-1 mb-2">No pending requests</h3>
                <p className="body-medium text-light-3">
                  There are no join requests waiting for approval.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-5xl">
            <div className="flex flex-col gap-4">
              {groupRequests.map((request: Models.Document) => (
                <RequestCard 
                  key={request.$id} 
                  request={request}
                  onApprove={() => handleApprove(request.$id)}
                  onReject={() => handleReject(request.$id)}
                  isProcessing={isApproving || isRejecting}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Request Card Component
type RequestCardProps = {
  request: Models.Document;
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
};

const RequestCard = ({ request, onApprove, onReject, isProcessing }: RequestCardProps) => {
  const { data: requester } = useGetUserById(request.userId);

  if (!requester) {
    return (
      <div className="bg-dark-2 rounded-3xl border border-dark-4 p-5">
        <div className="flex items-center justify-center">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-2 rounded-3xl border border-dark-4 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={requester.imageUrl || "/assets/icons/profile-placeholder.svg"}
            alt={requester.name}
            className="w-12 h-12 rounded-full"
          />
          <div>
            <p className="body-bold text-light-1">{requester.name}</p>
            <p className="small-regular text-light-3">@{requester.username}</p>
            <p className="small-regular text-light-3 mt-1">
              Requested {new Date(request.requestedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onReject}
            disabled={isProcessing}
            className="shad-button_ghost border border-red text-red hover:bg-red hover:text-white"
          >
            {isProcessing ? <Loader /> : "Reject"}
          </Button>
          <Button
            onClick={onApprove}
            disabled={isProcessing}
            className="shad-button_primary"
          >
            {isProcessing ? <Loader /> : "Approve"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupRequests;