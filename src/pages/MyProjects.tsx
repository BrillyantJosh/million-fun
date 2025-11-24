import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ArrowLeft, Loader2, Edit } from "lucide-react";
import { useUserProjects } from "@/hooks/useUserProjects";
import { EditProjectDialog } from "@/components/EditProjectDialog";
import type { NostrProject } from "@/hooks/useUserProjects";

const MyProjects = () => {
  const navigate = useNavigate();
  const { projects, loading, error } = useUserProjects();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<NostrProject | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const handleEditClick = (e: React.MouseEvent, project: NostrProject) => {
    e.stopPropagation(); // Prevent card click navigation
    setSelectedProject(project);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setEditDialogOpen(false);
    setSelectedProject(null);
  };

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button
            onClick={() => navigate('/create-project')}
            className="gap-2"
          >
            <Plus className="h-5 w-5" />
            Create New Project
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Projects</h1>
          <p className="text-muted-foreground">
            Manage and track your crowdfunding projects
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center space-y-4">
              <p className="text-muted-foreground text-lg">
                You haven't created any projects yet
              </p>
              <Button
                onClick={() => navigate('/create-project')}
                size="lg"
                className="gap-2"
              >
                <Plus className="h-5 w-5" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                onClick={() => handleProjectClick(project.id)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={project.coverImage || "/placeholder.svg"}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                      {project.currency}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => handleEditClick(e, project)}
                      className="gap-1.5"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {project.shortDesc}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-foreground">
                        Goal: {parseFloat(project.fiatGoal).toLocaleString()} {project.currency}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Wallet: <span className="font-mono text-xs">{project.walletId.substring(0, 12)}...</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
      
      {selectedProject && (
        <EditProjectDialog 
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          project={selectedProject}
          responsibilityStatement={selectedProject.responsibilityStatement || ""}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default MyProjects;
