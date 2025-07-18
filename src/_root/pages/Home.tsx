import { Models } from "appwrite";

// import { useToast } from "@/components/ui/use-toast";
import { Loader, PostCard, UserCard } from "@/components/shared";
import { useGetRecentPosts, useGetUsers, useGetPostsFromFollowedUsers } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";

const Home = () => {
  // const { toast } = useToast();
  const { user: currentUser } = useUserContext();

  const {
    data: followedPosts,
    isLoading: isFollowedPostsLoading,
    isError: isErrorFollowedPosts,
  } = useGetPostsFromFollowedUsers(currentUser?.id || "");
  
  const {
    data: recentPosts,
    isLoading: isRecentPostsLoading,
    isError: isErrorRecentPosts,
  } = useGetRecentPosts();

  // Use followed posts if available, otherwise fallback to recent posts
  const posts = followedPosts && followedPosts.documents.length > 0 ? followedPosts : recentPosts;
  const isPostLoading = isFollowedPostsLoading || isRecentPostsLoading;
  const isErrorPosts = isErrorFollowedPosts || isErrorRecentPosts;
  const {
    data: creators,
    isLoading: isUserLoading,
    isError: isErrorCreators,
  } = useGetUsers(10);

  if (isErrorPosts || isErrorCreators) {
    return (
      <div className="flex flex-1">
        <div className="home-container">
          <p className="body-medium text-light-1">Something bad happened</p>
        </div>
        <div className="home-creators">
          <p className="body-medium text-light-1">Something bad happened</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <div className="home-container">
        <div className="home-posts">
          <h2 className="h3-bold md:h2-bold text-left w-full">
            {followedPosts && followedPosts.documents.length > 0 ? "Following" : "Discover"}
          </h2>
          {isPostLoading && !posts ? (
            <Loader />
          ) : (
            <ul className="flex flex-col flex-1 gap-9 w-full ">
              {posts?.documents.map((post: Models.Document) => (
                <li key={post.$id} className="flex justify-center w-full">
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="home-creators">
        <h3 className="h3-bold text-light-1">Top Creators</h3>
        {isUserLoading && !creators ? (
          <Loader />
        ) : (
          <ul className="grid 2xl:grid-cols-2 gap-6">
            {creators?.documents.map((creator) => (
              <li key={creator?.$id}>
                <UserCard user={creator} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Home;
