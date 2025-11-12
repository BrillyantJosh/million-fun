import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-crowdfunding.jpg";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary to-background py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-foreground">
              Podpri projekte s{" "}
              <span className="text-primary">Lana</span> kripto valuto
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Prva slovenska crowdfunding platforma, ki omogoča donacije izključno z Lana kriptovaluto. 
              Podprite projekte, ki vam veliko pomenijo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg">
                Razišči Projekte
              </Button>
              <Button size="lg" variant="outline" className="text-lg">
                Kako deluje?
              </Button>
            </div>
          </div>
          <div className="relative">
            <img
              src={heroImage}
              alt="Lana crowdfunding platforma"
              className="rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
