import { Project } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, Calendar } from "lucide-react";
import { getCacheBreakingImageUrl } from "@/lib/imageUtils";

interface ProjectCardProps {
  project: Project;
  onDonate: (projectId: string) => void;
}

export const ProjectCard = ({ project, onDonate }: ProjectCardProps) => {
  const percentage = (project.raised / project.goal) * 100;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="relative h-48 overflow-hidden">
          <img
            src={getCacheBreakingImageUrl(project.image)}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute top-3 left-3">
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
              {project.category}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
            {project.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-3">
            {project.description}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-foreground">
              {project.raised.toLocaleString()} LANA
            </span>
            <span className="text-muted-foreground">
              od {project.goal.toLocaleString()} LANA
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="text-sm font-medium text-primary">
            {percentage.toFixed(0)}% achieved
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{project.backers} backers</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{project.daysLeft} days</span>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Created by: <span className="font-medium text-foreground">{project.creator}</span>
          </p>
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button 
          onClick={() => onDonate(project.id)} 
          className="w-full"
          size="lg"
        >
          Donate with LANA
        </Button>
      </CardFooter>
    </Card>
  );
};
