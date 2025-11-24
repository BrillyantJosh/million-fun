import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Heart, Users, User } from "lucide-react";
import { NostrProject } from "@/hooks/useAllProjects";
import { useProjectSupports } from "@/hooks/useProjectSupports";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface PublicProjectCardProps {
  project: NostrProject;
}

export const PublicProjectCard = ({ project }: PublicProjectCardProps) => {
  const navigate = useNavigate();
  const { stats, loading } = useProjectSupports(project.id);

  const goalAmount = parseFloat(project.fiatGoal);
  const raisedAmount = stats?.totalRaised || 0;
  const percentage = goalAmount > 0 ? Math.min((raisedAmount / goalAmount) * 100, 100) : 0;
  const backersCount = stats?.backersCount || 0;

  const handleDonate = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/project/${project.id}`);
  };

  const handleCardClick = () => {
    navigate(`/project/${project.id}`);
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={handleCardClick}
    >
      <div className="relative h-64 overflow-hidden">
        <img
          src={project.coverImage || "/placeholder.svg"}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-4 right-4">
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium shadow-lg">
            {project.currency}
          </span>
        </div>
      </div>

      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
            {project.shortDesc}
          </p>
          
          {/* Project Initiator */}
          {project.ownerProfile && (
            <div className="flex items-center gap-2 mt-3 p-2 bg-muted/50 rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarImage src={project.ownerProfile.picture} alt={project.ownerProfile.name} />
                <AvatarFallback className="text-xs">
                  {project.ownerProfile.name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Project Initiator</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {project.ownerProfile.display_name || project.ownerProfile.name || "Anonymous"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <div>
              <span className="text-2xl font-bold text-foreground">
                {raisedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm text-muted-foreground ml-1">{project.currency}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              goal: {goalAmount.toLocaleString()} {project.currency}
            </span>
          </div>

          <Progress value={percentage} className="h-2" />

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="font-medium">{backersCount}</span>
                <span>backers</span>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium">{percentage.toFixed(0)}%</span> funded
              </div>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleDonate}
          className="w-full gap-2 mt-4"
          size="lg"
        >
          <Heart className="h-4 w-4" />
          Support Project
        </Button>
      </CardContent>
    </Card>
  );
};
