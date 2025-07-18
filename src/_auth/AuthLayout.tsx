import { Outlet, Navigate } from "react-router-dom";

import { useUserContext } from "@/context/AuthContext";

export default function AuthLayout() {
  const { isAuthenticated } = useUserContext();

  return (
    <>
      {isAuthenticated ? (
        <Navigate to="/" />
      ) : (
        <div className="min-h-screen w-full bg-gradient-to-br from-dark-1 via-dark-2 to-dark-3 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-72 h-72 bg-primary-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
          </div>
          
          {/* Main Content */}
          <div className="relative z-10 flex min-h-screen w-full">
            <section className="flex flex-1 justify-center items-center flex-col px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
              <div className="w-full max-w-md">
                {/* Backdrop blur container */}
                <div className="backdrop-blur-sm bg-dark-2/80 border border-dark-4/50 rounded-2xl p-6 sm:p-8 shadow-2xl">
                  <Outlet />
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
