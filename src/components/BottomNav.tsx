import { Home, User, Heart } from "lucide-react";
import { NavLink } from "./NavLink";
import { cn } from "@/lib/utils";
export const BottomNav = () => {
  return <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <nav className="w-full h-16 grid grid-cols-3">
        <NavLink to="/dashboard" className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-primary">
          <Home className="h-5 w-5" />
          <span className="text-xs">All Projects </span>
        </NavLink>
        <NavLink to="/my-projects" className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-primary">
          <User className="h-5 w-5" />
          <span className="text-xs">My Projects </span>
        </NavLink>
        <NavLink to="/my-donations" className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-primary">
          <Heart className="h-5 w-5" />
          <span className="text-xs">Donations</span>
        </NavLink>
      </nav>
    </div>;
};