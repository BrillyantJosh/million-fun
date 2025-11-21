import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProjectGrid } from "@/components/ProjectGrid";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Home, User, Heart, Plus } from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Header />
      <main className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="all" className="mt-0">
            <ProjectGrid />
          </TabsContent>
          <TabsContent value="my" className="mt-0">
            <div className="container mx-auto px-4 py-16">
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">My Projects</h2>
                  <p className="text-muted-foreground">
                    Projects you've created will appear here
                  </p>
                </div>
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  size="lg"
                  className="gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Create New Project
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="donations" className="mt-0">
            <div className="container mx-auto px-4 py-16">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-4">My Donations</h2>
                <p className="text-muted-foreground">
                  Your donation history will appear here
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
            <TabsList className="w-full h-16 grid grid-cols-3 rounded-none bg-background">
              <TabsTrigger 
                value="all" 
                className="flex flex-col gap-1 data-[state=active]:text-primary"
              >
                <Home className="h-5 w-5" />
                <span className="text-xs">All</span>
              </TabsTrigger>
              <TabsTrigger 
                value="my" 
                className="flex flex-col gap-1 data-[state=active]:text-primary"
              >
                <User className="h-5 w-5" />
                <span className="text-xs">My</span>
              </TabsTrigger>
              <TabsTrigger 
                value="donations" 
                className="flex flex-col gap-1 data-[state=active]:text-primary"
              >
                <Heart className="h-5 w-5" />
                <span className="text-xs">Donations</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </main>
      <Footer />
      
      <CreateProjectDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
};

export default Dashboard;
