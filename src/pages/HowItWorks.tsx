import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const HowItWorks = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
          How It Works
        </h1>

        {/* YouTube Video Embed */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/RKz0eM0ReUs"
              title="How It Works"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            What Are the Best Ideas for Lana Crowd Funding Projects?
          </h2>
          
          <p className="text-muted-foreground mb-8">
            If you're thinking about creating a project on Lana Crowd, here are some guiding questions to spark your imagination. These ideas help you look at the Lana World, your community, and the wider society through the lens of opportunity, creativity, and collective abundance.
          </p>

          {/* Section 1 */}
          <div className="mb-8 p-6 rounded-xl bg-card border border-border">
            <h3 className="text-xl font-semibold text-primary mb-3">
              1. Transform What Bothers You Into a Solution
            </h3>
            <p className="text-muted-foreground mb-4">
              Look around the Lana World. What feels incomplete, confusing, or unfair? Very often, the best projects begin exactly there.
            </p>
            <p className="text-muted-foreground">
              If something bothers you, it probably bothers many others too — which makes it a perfect starting point for a meaningful project. Turn your frustration into a clear, practical solution and invite others to support it.
            </p>
          </div>

          {/* Section 2 */}
          <div className="mb-8 p-6 rounded-xl bg-card border border-border">
            <h3 className="text-xl font-semibold text-primary mb-3">
              2. Support Eco-Friendly, Natural & High-Quality Local Products
            </h3>
            <p className="text-muted-foreground mb-4">
              Instead of the old economy of scale, where everything gets cheaper and lower in quality, Lana World supports a shift into the Economy of Abundance. This means:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
              <li>small producers get paid fairly,</li>
              <li>natural and eco-friendly products become the new standard,</li>
              <li>higher-quality items thrive,</li>
              <li>customers receive more value for less money,</li>
              <li>and the entire community prospers.</li>
            </ul>
            <p className="text-muted-foreground">
              Do you have an idea that helps local farmers, artisans, bakers, organic growers, or creators bring their higher-quality products into the Lana ecosystem? Crowd funding can empower these producers and help redefine how we create, sell, and value real quality.
            </p>
          </div>

          {/* Section 3 */}
          <div className="mb-8 p-6 rounded-xl bg-card border border-border">
            <h3 className="text-xl font-semibold text-primary mb-3">
              3. Create Opportunities for People Who Depend on Harmful Systems
            </h3>
            <p className="text-muted-foreground mb-4">
              Many people engage in destructive industries — drugs, politics driven by corruption, or harming nature — simply because they see no alternative path to financial survival.
            </p>
            <p className="text-muted-foreground">
              Can you imagine a project that gives them a better, cleaner way to become wealthy, without harming themselves or the environment? A powerful idea can redirect entire lives by offering a new, ethical economic flow.
            </p>
          </div>

          {/* Section 4 */}
          <div className="mb-8 p-6 rounded-xl bg-card border border-border">
            <h3 className="text-xl font-semibold text-primary mb-3">
              4. Bring an Existing Lana Service Into Your Community
            </h3>
            <p className="text-muted-foreground mb-4">
              Look at the list of Lana services (LanaPays, LanaKnights, 100Million.fun, LanaOwns, LanaRooms, etc.). Can you take one of these and introduce it to your region, city, or country?
            </p>
            <p className="text-muted-foreground">
              Maybe people around you are waiting for exactly this kind of initiative but don't know how to start. Your project can become the bridge that brings the New Lana World Order into their everyday lives.
            </p>
          </div>

          {/* Section 5 */}
          <div className="mb-8 p-6 rounded-xl bg-card border border-border">
            <h3 className="text-xl font-semibold text-primary mb-3">
              5. Present a Wild, Creative Idea That Expands Our Collective Environment
            </h3>
            <p className="text-muted-foreground mb-4">
              Do you carry a bold, unusual, visionary idea? Something that might feel crazy at first, but if realized, could shift how people think, interact, or collaborate?
            </p>
            <p className="text-muted-foreground">
              Lana Crowd is built for innovation — especially for ideas that don't fit into traditional categories. If it expands the collective field, it deserves to be shared.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
