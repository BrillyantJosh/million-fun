import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, Loader2, Home, User, Heart } from "lucide-react";
import { useUserProjects } from "@/hooks/useUserProjects";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MyProjects = () => {
  const navigate = useNavigate();
  const { projects, loading, error } = useUserProjects();

  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Projects</h1>
            <p className="text-muted-foreground mt-2">Manage and track your crowdfunding projects</p>
          </div>
          <Button onClick={() => navigate('/create-project')} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Project
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">You haven't created any projects yet</p>
            <Button onClick={() => navigate('/create-project')} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/project/${project.id}`)}
              >
                <div className="relative h-48 overflow-hidden">
                  {project.coverImage ? (
                    <img
                      src={project.coverImage}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">No image</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary">{project.currency}</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">{project.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.shortDesc}
                  </p>
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="text-muted-foreground">Goal:</span>
                      <span className="font-semibold ml-2">
                        {parseFloat(project.fiatGoal).toLocaleString()} {project.currency}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Wallet: {project.walletId.substring(0, 8)}...
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <TabsList className="w-full h-16 grid grid-cols-3 rounded-none bg-background">
          <TabsTrigger 
            value="all" 
            className="flex flex-col gap-1"
            onClick={() => navigate('/dashboard')}
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
            className="flex flex-col gap-1"
            onClick={() => navigate('/dashboard')}
          >
            <Heart className="h-5 w-5" />
            <span className="text-xs">Donations</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <Footer />
    </div>
  );
};

export default MyProjects;
