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
              Prva slovenska crowdfunding platforma za LANA kriptovaluto.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Platforma</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Vsi projekti</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Kako deluje</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pogoste FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Podpora</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Kontakt</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pomoč</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Vodič</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Pravno</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Pogoji uporabe</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Zasebnost</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Piškotki</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2024 LanaFund. Vse pravice pridržane.</p>
        </div>
      </div>
    </footer>
  );
};
