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
import { useGetUserById } from "@/lib/react-query/queries";
import { GridPostList, Loader } from "@/components/shared";
import { createOrGetConversation } from "@/lib/appwrite/api";
import { useToast } from "@/components/ui/use-toast";
import { useCreateOrGetConversation, useFollowUser, useUnfollowUser, useIsFollowing } from "@/lib/react-query/queries";

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
  const navigate = useNavigate();
  const { id } = useParams();

  // Usuario autenticado
  const { user: authUser } = useUserContext();

  const { pathname } = useLocation();
  const { toast } = useToast();

  // Perfil del usuario que estamos viendo
  const { data: profileUser } = useGetUserById(id || "");

  const { mutateAsync: followUser } = useFollowUser();
  const { mutateAsync: unfollowUser } = useUnfollowUser();

  // Chequea si el authUser ya sigue a este perfil
  const { data: isFollowingUser, isLoading: isCheckingFollow } =
    useIsFollowing(authUser?.id || "", profileUser?.$id || "");

  const getUserId = (user: any) => user.id || user.$id;



  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!authUser || !profileUser) return;

    try {
      if (isFollowingUser) {
        await unfollowUser({ followerId: authUser.id, followingId: profileUser.$id });
        toast({
          title: "Success",
          description: `You unfollowed ${profileUser.name}`,
        });
      } else {
        await followUser({ followerId: authUser.id, followingId: profileUser.$id });
        toast({
          title: "Success",
          description: `You are now following ${profileUser.name}`,
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

  const handleStartChat = async () => {
    if (!authUser || !profileUser) return;

    const authId = getUserId(authUser);
    const profileId = getUserId(profileUser);

    if (authId !== profileId) {
      const conversation = await createOrGetConversation([authId, profileId]);
      if (conversation) navigate(`/chat?conversation=${conversation.$id}`);
    }
  };

  if (!profileUser)
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
            src={profileUser.imageUrl || "/assets/icons/profile-placeholder.svg"}
            alt="profile"
            className="w-28 h-28 lg:h-36 lg:w-36 rounded-full"
          />
          <div className="flex flex-col flex-1 justify-between md:mt-2">
            <div className="flex flex-col w-full">
              <h1 className="text-center xl:text-left h3-bold md:h1-semibold w-full">
                {profileUser.name}
              </h1>
              <p className="small-regular md:body-medium text-light-3 text-center xl:text-left">
                @{profileUser.username}
              </p>
            </div>

            <div className="flex gap-8 mt-10 items-center justify-center xl:justify-start flex-wrap z-20">
              <StatBlock value={profileUser.posts.length} label="Posts" />
              <StatBlock value={20} label="Followers" />
              <StatBlock value={20} label="Following" />
            </div>

            <p className="small-medium md:base-medium text-center xl:text-left mt-7 max-w-screen-sm">
              {profileUser.bio}
            </p>
          </div>

          <div className="flex justify-center gap-4">
            {authUser?.id === profileUser.$id && (
              <Link
                to={`/update-profile/${profileUser.$id}`}
                className="h-12 bg-dark-4 px-5 text-light-1 flex-center gap-2 rounded-lg"
              >
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
            )}

            {authUser?.id !== profileUser.$id && (
              <div className="flex gap-2">
                {/* Botón Follow */}
                <Button
                  type="button"
                  className={isFollowingUser ? "shad-button_dark_4 px-3 h-9" : "shad-button_primary px-3 h-9"}
                  onClick={handleFollowToggle}
                >
                  {isFollowingUser ? "Unfollow" : "Follow"}
                </Button>

                {/* Botón Chat */}
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
            )}
          </div>
        </div>
      </div>

      {profileUser.$id === authUser?.id && (
        <div className="flex max-w-5xl w-full">
          <Link
            to={`/profile/${id}`}
            className={`profile-tab rounded-l-lg ${pathname === `/profile/${id}` && "!bg-dark-3"}`}
          >
            <img src={"/assets/icons/posts.svg"} alt="posts" width={20} height={20} />
            Posts
          </Link>
          <Link
            to={`/profile/${id}/liked-posts`}
            className={`profile-tab rounded-r-lg ${pathname === `/profile/${id}/liked-posts` && "!bg-dark-3"}`}
          >
            <img src={"/assets/icons/like.svg"} alt="like" width={20} height={20} />
            Liked Posts
          </Link>
        </div>
      )}

      <Routes>
        <Route
          index
          element={<GridPostList posts={profileUser.posts} showUser={false} />}
        />
        {profileUser.$id === authUser?.id && (
          <Route path="/liked-posts" element={<LikedPosts />} />
        )}
      </Routes>
      <Outlet />
    </div>
  );
};

export default Profile;
