import {
  Route,
  Routes,
  Link,
  Outlet,
  useParams,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { Button } from "@/components/ui";
import { LikedPosts } from "@/_root/pages";
import { useUserContext } from "@/context/AuthContext";
import { useGetUserById, useFollowUser, useUnfollowUser, useIsFollowing } from "@/lib/react-query/queries";
import { GridPostList, Loader } from "@/components/shared";
import { createOrGetConversation } from "@/lib/appwrite/api";
import { useToast } from "@/components/ui/use-toast";

interface StabBlockProps {
  value: string | number;
  label: string;
}

const StatBlock = ({ value, label }: StabBlockProps) => (
  <div className="flex-center gap-2">
    <p className="small-semibold lg:body-bold text-primary-500">{value}</p>
    <p className="small-medium lg:base-medium text-light-2">{label}</p>
  </div>
);

const Profile = () => {
  const { id } = useParams();
  const { user } = useUserContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: currentUser } = useGetUserById(id || "");
  const { mutateAsync: followUser, status: followStatus } = useFollowUser();
  const { mutateAsync: unfollowUser, status: unfollowStatus } = useUnfollowUser();
  const isFollowPending = followStatus === 'loading';
  const isUnfollowPending = unfollowStatus === 'loading';
  const { data: isFollowingUser, isLoading: isCheckingFollow } = useIsFollowing(user?.id || "", id || "");

  const handleStartChat = async () => {
    try {
      if (currentUser && user.id !== currentUser.$id) {
        const conversation = await createOrGetConversation([user.id, currentUser.$id]);
        if (conversation) {
          navigate(`/chat?conversation=${conversation.$id}`);
        }
      }
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !currentUser) return;
    
    try {
      if (isFollowingUser) {
        await unfollowUser({ followerId: user.id, followingId: currentUser.$id });
        toast({
          title: "Success",
          description: `You unfollowed ${currentUser.name}`,
        });
      } else {
        await followUser({ followerId: user.id, followingId: currentUser.$id });
        toast({
          title: "Success", 
          description: `You are now following ${currentUser.name}`,
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

  if (!currentUser)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  return (
    <div className="profile-container">
      <div className="profile-inner_container">
        <div className="flex xl:flex-row flex-col max-xl:items-center flex-1 gap-7">
          <img
            src={
              currentUser.imageUrl || "/assets/icons/profile-placeholder.svg"
            }
            alt="profile"
            className="w-28 h-28 lg:h-36 lg:w-36 rounded-full"
          />
          <div className="flex flex-col flex-1 justify-between md:mt-2">
            <div className="flex flex-col w-full">
              <h1 className="text-center xl:text-left h3-bold md:h1-semibold w-full">
                {currentUser.name}
              </h1>
              <p className="small-regular md:body-medium text-light-3 text-center xl:text-left">
                @{currentUser.username}
              </p>
            </div>

            <div className="flex gap-8 mt-10 items-center justify-center xl:justify-start flex-wrap z-20">
              <StatBlock value={currentUser.posts.length} label="Posts" />
              <StatBlock value={20} label="Followers" />
              <StatBlock value={20} label="Following" />
            </div>

            <p className="small-medium md:base-medium text-center xl:text-left mt-7 max-w-screen-sm">
              {currentUser.bio}
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <div className={`${user.id !== currentUser.$id && "hidden"}`}>
              <Link
                to={`/update-profile/${currentUser.$id}`}
                className={`h-12 bg-dark-4 px-5 text-light-1 flex-center gap-2 rounded-lg ${
                  user.id !== currentUser.$id && "hidden"
                }`}>
                <img
                  src={"/assets/icons/edit.svg"}
                  alt="edit"
                  width={20}
                  height={20}
                />
                <p className="flex whitespace-nowrap small-medium">
                  Edit Profile
                </p>
              </Link>
            </div>
            <div className={`${user.id === id && "hidden"} flex gap-2`}>
              <Button 
                type="button" 
                className={isFollowingUser ? "shad-button_dark_4 px-8" : "shad-button_primary px-8"}
                onClick={handleFollowToggle}
                disabled={isFollowPending || isUnfollowPending || isCheckingFollow}
              >
                {isFollowPending || isUnfollowPending ? "..." : isFollowingUser ? "Unfollow" : "Follow"}
              </Button>
              <Button 
                type="button" 
                className="shad-button_dark_4 px-8 flex-center gap-2" 
                onClick={handleStartChat}
              >
                <img
                  src={"/assets/icons/chat.svg"}
                  alt="chat"
                  width={20}
                  height={20}
                />
                Chat
              </Button>
            </div>
          </div>
        </div>
      </div>

      {currentUser.$id === user.id && (
        <div className="flex max-w-5xl w-full">
          <Link
            to={`/profile/${id}`}
            className={`profile-tab rounded-l-lg ${
              pathname === `/profile/${id}` && "!bg-dark-3"
            }`}>
            <img
              src={"/assets/icons/posts.svg"}
              alt="posts"
              width={20}
              height={20}
            />
            Posts
          </Link>
          <Link
            to={`/profile/${id}/liked-posts`}
            className={`profile-tab rounded-r-lg ${
              pathname === `/profile/${id}/liked-posts` && "!bg-dark-3"
            }`}>
            <img
              src={"/assets/icons/like.svg"}
              alt="like"
              width={20}
              height={20}
            />
            Liked Posts
          </Link>
        </div>
      )}

      <Routes>
        <Route
          index
          element={<GridPostList posts={currentUser.posts} showUser={false} />}
        />
        {currentUser.$id === user.id && (
          <Route path="/liked-posts" element={<LikedPosts />} />
        )}
      </Routes>
      <Outlet />
    </div>
  );
};

export default Profile;
