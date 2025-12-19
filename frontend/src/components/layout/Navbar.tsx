import React from "react";
import { useAuthStore } from "../../features/auth/store";
import {
  LogOut,
  User,
  Bell,
  Sun,
  Moon,
  Monitor,
  Search,
  ChevronRight,
  Home,
  CreditCard,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useTheme } from "../theme-provider";
import { Input } from "../ui/input";
import { useLocation, Link } from "react-router-dom";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  // Simple breadcrumb logic
  const pathnames = location.pathname.split("/").filter((x) => x);
  const breadcrumbs = pathnames.map((name, index) => {
    const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
    const isLast = index === pathnames.length - 1;
    const label = name.charAt(0).toUpperCase() + name.slice(1);

    if (name === "app") return null;

    return (
      <React.Fragment key={routeTo}>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        {isLast ? (
          <span className="text-sm font-bold text-foreground">{label}</span>
        ) : (
          <Link
            to={routeTo}
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            {label}
          </Link>
        )}
      </React.Fragment>
    );
  });

  return (
    <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-xl px-6 flex items-center justify-between shrink-0 z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Link
            to="/app/dashboard"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
          {breadcrumbs}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search anything..."
            className="pl-9 w-64 h-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 rounded-full text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-9 w-9"
              >
                {theme === "light" ? (
                  <Sun className="h-4 w-4" />
                ) : theme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl">
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                className="rounded-lg"
              >
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className="rounded-lg"
              >
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("system")}
                className="rounded-lg"
              >
                <Monitor className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-9 w-9 relative"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full border-2 border-card" />
          </Button>

          <div className="h-6 w-px bg-border/50 mx-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 px-2 rounded-full hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Avatar className="h-7 w-7 border border-border shadow-sm">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                    {user?.first_name?.[0] || user?.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left hidden sm:flex">
                  <span className="text-xs font-bold leading-none">
                    {user?.first_name || "User"}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                    Pro Plan
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 rounded-2xl p-2 shadow-xl border-border/50"
            >
              <DropdownMenuLabel className="p-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground mt-1">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-2" />
              <div className="p-1">
                <DropdownMenuItem className="rounded-xl py-2.5">
                  <User className="mr-3 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl py-2.5">
                  <CreditCard className="mr-3 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Billing & Subscription</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl py-2.5">
                  <Shield className="mr-3 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Security Settings</span>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="mx-2" />
              <div className="p-1">
                <DropdownMenuItem
                  onClick={logout}
                  className="rounded-xl py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="font-bold">Sign out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
