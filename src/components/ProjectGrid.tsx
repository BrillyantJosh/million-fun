import { PublicProjectCard } from "./PublicProjectCard";
import { useAllProjects } from "@/hooks/useAllProjects";
import { useNostrConnection } from "@/hooks/useNostrConnection";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
export const ProjectGrid = () => {
  const {
    loading: connectionLoading,
    error: connectionError
  } = useNostrConnection();
  const {
    projects,
    loading,
    error
  } = useAllProjects();
  if (connectionLoading || loading) {
    return <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>;
  }
  if (connectionError || error) {
    return <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-destructive">{connectionError || error}</p>
            </CardContent>
          </Card>
        </div>
      </section>;
  }
  return <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          
          
        </div>
        
        {projects.length === 0 ? <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground text-lg">
                No projects available yet. Be the first to create one!
              </p>
            </CardContent>
          </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
            {projects.map(project => <PublicProjectCard key={project.id} project={project} />)}
          </div>}
      </div>
    </section>;
};