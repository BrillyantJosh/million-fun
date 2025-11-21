import { ProjectCard } from "./ProjectCard";
import { mockProjects } from "@/data/mockProjects";
import { useToast } from "@/hooks/use-toast";

export const ProjectGrid = () => {
  const { toast } = useToast();

  const handleDonate = (projectId: string) => {
    const project = mockProjects.find(p => p.id === projectId);
    toast({
      title: "Donation with LANA",
      description: `Selected project: ${project?.title}. Donation functionality will be added in the next version.`,
    });
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Active Projects
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover projects that need your support. Every LANA donation counts!
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
          {mockProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onDonate={handleDonate}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
