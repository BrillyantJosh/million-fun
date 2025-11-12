import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">
              Lana<span className="text-primary">Fund</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-foreground hover:text-primary transition-colors font-medium">
              Projekti
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors font-medium">
              Kako deluje
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors font-medium">
              O nas
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="outline">
              Prijava
            </Button>
            <Button>
              Ustvari projekt
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
