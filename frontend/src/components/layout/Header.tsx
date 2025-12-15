import { Fragment, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  PlusIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts";
import { cn } from "@/utils";

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        (event.key === "F" || event.key === "f") &&
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey
      ) {
        event.preventDefault();
        toggleFullscreen();
      }
      if (event.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleFullscreen]);

  return (
    <header className="sticky top-0 z-30 px-6 pt-4 pb-2">
      <div
        className={cn(
          "h-16 px-6 flex items-center justify-between gap-4",
          "rounded-2xl glass border border-white/10",
          "shadow-lg shadow-black/5 backdrop-blur-2xl",
          "transition-all duration-300 text-white"
        )}
      >
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className={cn(
              "p-2 rounded-xl text-gray-400 lg:hidden",
              "hover:text-white hover:bg-white/10",
              "transition-colors duration-200"
            )}
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          <div>
            <h1 className="text-lg font-bold tracking-tight text-white/90">
              {title || "Dashboard"}
            </h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/datasets")}
            className={cn(
              "hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl",
              "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500",
              "text-white text-sm font-medium shadow-lg shadow-blue-500/20",
              "transition-all duration-300 hover:scale-105 active:scale-95"
            )}
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Project</span>
          </button>

          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

          <button
            onClick={toggleFullscreen}
            className={cn(
              "p-2 rounded-xl text-gray-400",
              "hover:text-white hover:bg-white/10",
              "transition-colors duration-200"
            )}
            title="Ctrl/Cmd + Shift + F to toggle fullscreen"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="w-5 h-5" />
            ) : (
              <ArrowsPointingOutIcon className="w-5 h-5" />
            )}
          </button>

          {/* User Menu */}
          <Menu as="div" className="relative">
            <Menu.Button
              className={cn(
                "flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl",
                "text-gray-300 hover:text-white",
                "hover:bg-white/5 border border-transparent hover:border-white/10",
                "transition-all duration-200"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-inner">
                <span className="text-xs font-bold text-white">
                  {user?.first_name?.[0] ||
                    user?.email?.[0]?.toUpperCase() ||
                    "U"}
                </span>
              </div>
              <span className="text-sm font-medium hidden md:inline">
                {user?.full_name || user?.email || "User"}
              </span>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95 translate-y-2"
              enterTo="transform opacity-100 scale-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="transform opacity-100 scale-100 translate-y-0"
              leaveTo="transform opacity-0 scale-95 translate-y-2"
            >
              <Menu.Items
                className={cn(
                  "absolute right-0 mt-2 w-64 origin-top-right",
                  "rounded-2xl glass-card",
                  "border border-white/10",
                  "shadow-2xl shadow-black/20",
                  "divide-y divide-white/5",
                  "focus:outline-none z-50 overflow-hidden"
                )}
              >
                {/* User info */}
                <div className="px-5 py-4 bg-white/5">
                  <p className="text-sm font-semibold text-white">
                    {user?.full_name || "User"}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {user?.email}
                  </p>
                </div>

                {/* Menu items */}
                <div className="p-2">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => navigate("/settings")}
                        className={cn(
                          "flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-xl transition-all",
                          active ? "bg-white/10 text-white" : "text-gray-300"
                        )}
                      >
                        <Cog6ToothIcon className="w-4 h-4" />
                        Settings
                      </button>
                    )}
                  </Menu.Item>
                </div>

                <div className="p-2">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={cn(
                          "flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-xl transition-all",
                          active
                            ? "bg-red-500/10 text-red-400"
                            : "text-gray-300"
                        )}
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
}

export default Header;
