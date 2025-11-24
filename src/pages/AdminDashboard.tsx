import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectGrid } from "@/components/ProjectGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useIsAdmin();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-20 mb-20">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
        <BottomNav />
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-20 mb-20">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Pregled vseh aktivnih projektov</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vsi aktivni projekti</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectGrid />
          </CardContent>
        </Card>
      </main>
      <BottomNav />
      <Footer />
    </div>
  );
};

export default AdminDashboard;
