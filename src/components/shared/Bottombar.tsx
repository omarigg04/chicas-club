import { Link, useLocation } from "react-router-dom";

import { bottombarLinks } from "@/constants";
import { NotificationBadge } from "@/components/shared";
import { useGetUnreadConversationsCount } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";

const Bottombar = () => {
  const { pathname } = useLocation();
  const { user } = useUserContext();
  const { data: unreadCount = 0 } = useGetUnreadConversationsCount(user.id);

  return (
    <section className="bottom-bar">
      {bottombarLinks.map((link) => {
        const isActive = pathname === link.route;
        return (
          <Link
            key={`bottombar-${link.label}`}
            to={link.route}
            className={`${
              isActive && "rounded-[10px] bg-primary-500 "
            } flex-center flex-col gap-1 p-2 transition relative`}>
            <div className="relative">
              <img
                src={link.imgURL}
                alt={link.label}
                width={16}
                height={16}
                className={`${isActive && "invert-white"}`}
              />
              {link.route === "/chat" && (
                <NotificationBadge count={unreadCount} />
              )}
            </div>

            <p className="tiny-medium text-light-2">{link.label}</p>
          </Link>
        );
      })}
    </section>
  );
};

export default Bottombar;
