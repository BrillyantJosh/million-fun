import { Coins } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-muted border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Coins className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-foreground">
                Lana<span className="text-primary">Fund</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              First Slovenian crowdfunding platform for LANA cryptocurrency.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">All projects</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">How it works</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Help</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Guide</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2024 LanaFund. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
