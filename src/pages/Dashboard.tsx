import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProjectGrid } from "@/components/ProjectGrid";
import { BottomNav } from "@/components/BottomNav";

const Dashboard = () => {
  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Header />
      <main className="flex-1">
        <ProjectGrid />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Dashboard;
