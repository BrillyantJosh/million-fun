import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectGrid } from "@/components/ProjectGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useIsAdmin();
  const { data: settings, refetch } = useAppSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [financingInspirations, setFinancingInspirations] = useState("");
  const [enhancingCurrentSystem, setEnhancingCurrentSystem] = useState("");

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (settings) {
      setFinancingInspirations(settings.financing_inspirations.toString());
      setEnhancingCurrentSystem(settings.enhancing_current_system.toString());
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .update({
          financing_inspirations: parseFloat(financingInspirations),
          enhancing_current_system: parseFloat(enhancingCurrentSystem),
        })
        .eq("id", settings.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-20 mb-20">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
        <BottomNav />
      </div>;
  }
  if (!isAdmin) {
    return null;
  }
  return <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-20 mb-20">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
        </div>

        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <Card>
              <CardContent className="pt-6">
                <ProjectGrid />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="financing">Financing Inspirations (Max Amount)</Label>
                  <Input
                    id="financing"
                    type="number"
                    step="0.01"
                    value={financingInspirations}
                    onChange={(e) => setFinancingInspirations(e.target.value)}
                    placeholder="10000.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enhancing">Enhancing Current System (Max Amount)</Label>
                  <Input
                    id="enhancing"
                    type="number"
                    step="0.01"
                    value={enhancingCurrentSystem}
                    onChange={(e) => setEnhancingCurrentSystem(e.target.value)}
                    placeholder="5000.00"
                  />
                </div>

                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Save className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <BottomNav />
    </div>;
};
export default AdminDashboard;