import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  PlusIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 px-6 pt-4 pb-2">
      <div
        className={cn(
          "h-14 px-4 flex items-center justify-between gap-4",
          "rounded-2xl bg-white/80 backdrop-blur-xl",
          "border border-white/20 shadow-sm",
          "transition-all duration-200"
        )}
      >
        {/* Left side */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className={cn(
              "p-2 rounded-lg text-muted lg:hidden",
              "hover:text-primary hover:bg-sunken",
              "transition-colors duration-200"
            )}
          >
            <Bars3Icon className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-sm font-semibold text-primary">
              {title || "Dashboard"}
            </h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Quick Upload Button */}
          <button
            onClick={() => navigate("/datasets")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg",
              "bg-primary-500 text-white",
              "hover:bg-primary-600",
              "transition-all duration-200 shadow-sm"
            )}
          >
            <PlusIcon className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:inline">
              New Dataset
            </span>
          </button>

          {/* User Menu */}
          <Menu as="div" className="relative">
            <Menu.Button
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-lg",
                "text-secondary hover:text-primary",
                "hover:bg-sunken",
                "transition-colors duration-200"
              )}
            >
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-xs font-medium text-primary-600">
                  {user?.first_name?.[0] ||
                    user?.email?.[0]?.toUpperCase() ||
                    "U"}
                </span>
              </div>
              <span className="text-xs font-medium hidden md:inline">
                {user?.full_name || user?.email || "User"}
              </span>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items
                className={cn(
                  "absolute right-0 mt-2 w-56 origin-top-right",
                  "rounded-xl bg-surface",
                  "border border-subtle",
                  "shadow-lg",
                  "divide-y divide-subtle",
                  "focus:outline-none z-50"
                )}
              >
                {/* User info */}
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-primary">
                    {user?.full_name || "User"}
                  </p>
                  <p className="text-xs text-muted truncate">{user?.email}</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => navigate("/settings")}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-2 text-sm",
                          active ? "bg-sunken text-primary" : "text-secondary"
                        )}
                      >
                        <Cog6ToothIcon className="w-4 h-4" />
                        Settings
                      </button>
                    )}
                  </Menu.Item>
                </div>

                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-2 text-sm",
                          active
                            ? "bg-error-50 text-error-600"
                            : "text-secondary"
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
