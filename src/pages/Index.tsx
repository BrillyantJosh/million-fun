import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProjectGrid } from "@/components/ProjectGrid";
import { Footer } from "@/components/Footer";
import { NostrNetworkStatus } from "@/components/NostrNetworkStatus";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <NostrNetworkStatus />
        <ProjectGrid />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
