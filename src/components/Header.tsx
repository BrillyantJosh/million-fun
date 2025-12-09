import { Button } from "@/components/ui/button";
import { Coins, Menu, LogOut, Network } from "lucide-react";
import { NostrDataDialog } from "./NostrDataDialog";
import { NostrNetworkStatus } from "./NostrNetworkStatus";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getUserSession, clearUserSession } from "@/lib/auth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Shield } from "lucide-react";
export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getUserSession();
  const {
    isAdmin
  } = useIsAdmin();
  const isAuthenticated = !!session;
  const isLandingPage = location.pathname === "/";
  const handleSignOut = () => {
    clearUserSession();
    navigate("/");
  };
  return <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
            <Coins className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">
              100Million.<span className="text-green-500">Fun</span>
            </span>
          </Link>

          {/* Navigation - only on landing page */}
          <nav className="hidden md:flex items-center gap-8">
            {isLandingPage && !isAuthenticated && (
              <a href="#projects" className="text-foreground hover:text-primary transition-colors font-medium">
                Projects
              </a>
            )}
            <Link to="/how-it-works" className="text-foreground hover:text-primary transition-colors font-medium">
              How it works
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <NostrDataDialog />
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Network className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nostr Network Status</DialogTitle>
                </DialogHeader>
                <NostrNetworkStatus />
              </DialogContent>
            </Dialog>
            
            {isAuthenticated ? <>
                <span className="text-sm text-muted-foreground hidden md:block">
                  Hello, <span className="font-medium text-foreground">{session?.profile?.display_name || session?.profile?.name || 'User'}</span>
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-background">
                    {isAdmin && <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>}
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </> : <Link to="/login">
                <Button variant="outline">
                  Sign in
                </Button>
              </Link>}
          </div>
        </div>
      </div>
    </header>;
};