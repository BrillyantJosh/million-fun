import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-crowdfunding.jpg";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary to-background py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-foreground">
              Support projects with{" "}
              <span className="text-primary">Lana</span> cryptocurrency
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              The first Slovenian crowdfunding platform that enables donations exclusively with Lana cryptocurrency. 
              Support projects that matter to you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg">
                Explore Projects
              </Button>
              <Button size="lg" variant="outline" className="text-lg">
                How does it work?
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
