import { useState } from "react";
import { Link } from "react-router-dom";
import { Models } from "appwrite";

import { useGetGroups, useSearchGroups } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";
import { Loader } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useDebounce from "@/hooks/useDebounce";
import GroupCard from "@/components/shared/GroupCard";

const Groups = () => {
  const { user } = useUserContext();
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue, 500);

  const { data: groups, isLoading: isGroupsLoading } = useGetGroups();
  const { data: searchResults, isLoading: isSearchLoading } = useSearchGroups(debouncedSearch);


  const shouldShowSearchResults = debouncedSearch !== "";
  const shouldShowResults = shouldShowSearchResults ? searchResults : groups;

  if (!user) {
    return (
      <div className="flex flex-1">
        <div className="common-container">
          <div className="max-w-5xl flex-start gap-3 justify-start w-full">
            <img
              src="/assets/icons/people.svg"
              width={36}
              height={36}
              alt="groups"
            />
            <h2 className="h3-bold md:h2-bold text-left w-full">Groups</h2>
          </div>

          <div className="flex justify-center w-full">
            <Loader />
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
            alt="groups"
          />
          <h2 className="h3-bold md:h2-bold text-left w-full">Groups</h2>
        </div>

        <div className="flex gap-1 px-4 w-full rounded-lg bg-dark-4">
          <img
            src="/assets/icons/search.svg"
            width={24}
            height={24}
            alt="search"
          />
          <Input
            type="text"
            placeholder="Search groups"
            className="explore-search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        <div className="flex justify-between items-center w-full max-w-5xl">
          <h3 className="body-bold md:h3-bold">
            {shouldShowSearchResults ? "Search Results" : "All Groups"}
          </h3>
          
          <Link to="/groups/create">
            <Button className="shad-button_primary">
              <img
                src="/assets/icons/gallery-add.svg"
                width={20}
                height={20}
                alt="create"
                className="invert-white"
              />
              Create Group
            </Button>
          </Link>
        </div>

        {(shouldShowSearchResults ? isSearchLoading : isGroupsLoading) ? (
          <div className="flex-center w-full h-full">
            <Loader />
          </div>
        ) : shouldShowResults && shouldShowResults.documents.length > 0 ? (
          <ul className="grid-container">
            {shouldShowResults.documents.map((group: Models.Document) => (
              <li key={group.$id} className="flex justify-center w-full">
                <GroupCard group={group} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center gap-6 mt-10">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-dark-4 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-light-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="h3-bold text-light-1 mb-2">
                  {shouldShowSearchResults ? "No groups found" : "No groups yet"}
                </h3>
                <p className="body-medium text-light-3 mb-4">
                  {shouldShowSearchResults 
                    ? "Try searching with different keywords" 
                    : "Be the first to create a group and connect with others!"
                  }
                </p>
                {!shouldShowSearchResults && (
                  <Link to="/groups/create">
                    <Button className="shad-button_primary">
                      Create Your First Group
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;