import { Header } from "@/components/Header";
import { ProjectGrid } from "@/components/ProjectGrid";
import { BottomNav } from "@/components/BottomNav";

const Dashboard = () => {
  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Header />
      <main className="flex-1">
        <ProjectGrid />
      </main>
      <BottomNav />
    </div>
  );
};

export default Dashboard;
