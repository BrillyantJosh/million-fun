import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ban, CheckCircle, Loader2, Shield, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { NostrProject } from "@/hooks/useAllProjects";
import { publishProjectVisibility } from "@/lib/blockProject";
import { toast } from "@/hooks/use-toast";
import type { LanaSystemParameters } from "@/types/nostr";
import { SimplePool } from 'nostr-tools/pool';

interface AdminProjectCardProps {
  project: NostrProject;
  onStatusChange?: () => void;
  authorityNostrKey: string;
  authorityNostrHexId: string;
}

export const AdminProjectCard = ({ project, onStatusChange, authorityNostrKey, authorityNostrHexId }: AdminProjectCardProps) => {
  const navigate = useNavigate();
  const [isBlocking, setIsBlocking] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);
  const [visibilityStatus, setVisibilityStatus] = useState<'visible' | 'blocked' | 'loading'>('loading');

  useEffect(() => {
    const fetchVisibilityStatus = async () => {
      try {
        const systemParamsStr = sessionStorage.getItem("lana_system_parameters");
        if (!systemParamsStr) {
          setVisibilityStatus('visible');
          return;
        }

        const raw = JSON.parse(systemParamsStr);
        const systemParams: LanaSystemParameters = raw.parameters ?? raw;
        const relays = systemParams.relays;

        if (!relays || relays.length === 0) {
          setVisibilityStatus('visible');
          return;
        }

        const pool = new SimplePool();
        
        const events = await pool.querySync(relays, {
          kinds: [31235],
          authors: [authorityNostrHexId],
          "#d": [`project:${project.id}`],
          limit: 1
        });

        pool.close(relays);

        if (events.length > 0) {
          const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];
          const statusTag = latestEvent.tags.find(tag => tag[0] === 'status');
          setVisibilityStatus(statusTag?.[1] === 'blocked' ? 'blocked' : 'visible');
        } else {
          setVisibilityStatus('visible');
        }
      } catch (error) {
        console.error('Error fetching visibility status:', error);
        setVisibilityStatus('visible');
      }
    };

    fetchVisibilityStatus();
  }, [project.id, authorityNostrHexId]);

  const handleBlockProject = async () => {
    setIsBlocking(true);
    try {
      const systemParamsStr = sessionStorage.getItem("lana_system_parameters");
      if (!systemParamsStr) {
        throw new Error('System parameters not found');
      }

      const raw = JSON.parse(systemParamsStr);
      const systemParams: LanaSystemParameters = raw.parameters ?? raw;
      const relays = systemParams.relays;

      if (!relays || relays.length === 0) {
        throw new Error('No relays configured');
      }

      const result = await publishProjectVisibility(
        project.id,
        'blocked',
        'Blocked by admin',
        authorityNostrKey,
        relays
      );

      const successCount = result.results.filter(r => r.success).length;

      toast({
        title: "Project Blocked",
        description: `Project visibility status published to ${successCount}/${relays.length} relays`,
      });

      setVisibilityStatus('blocked');

      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to block project",
        variant: "destructive",
      });
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblockProject = async () => {
    setIsUnblocking(true);
    try {
      const systemParamsStr = sessionStorage.getItem("lana_system_parameters");
      if (!systemParamsStr) {
        throw new Error('System parameters not found');
      }

      const raw = JSON.parse(systemParamsStr);
      const systemParams: LanaSystemParameters = raw.parameters ?? raw;
      const relays = systemParams.relays;

      if (!relays || relays.length === 0) {
        throw new Error('No relays configured');
      }

      const result = await publishProjectVisibility(
        project.id,
        'visible',
        'Unblocked by admin',
        authorityNostrKey,
        relays
      );

      const successCount = result.results.filter(r => r.success).length;

      toast({
        title: "Project Unblocked",
        description: `Project visibility status published to ${successCount}/${relays.length} relays`,
      });

      setVisibilityStatus('visible');

      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unblock project",
        variant: "destructive",
      });
    } finally {
      setIsUnblocking(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
      <div onClick={() => navigate(`/project/${project.id}`)}>
        <div className="relative h-64">
          {project.coverImage ? (
            <img
              src={project.coverImage}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-4xl text-muted-foreground">📦</span>
            </div>
          )}
          <div className="absolute top-4 right-4 flex gap-2">
            <Badge variant="secondary" className="font-semibold">
              {project.currency}
            </Badge>
          </div>
          <div className="absolute top-4 left-4">
            {visibilityStatus === 'loading' ? (
              <Badge variant="outline" className="bg-background/80 backdrop-blur">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Loading...
              </Badge>
            ) : visibilityStatus === 'blocked' ? (
              <Badge variant="destructive" className="bg-destructive/90 backdrop-blur">
                <Ban className="h-3 w-3 mr-1" />
                Blocked
              </Badge>
            ) : (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700 backdrop-blur">
                <Eye className="h-3 w-3 mr-1" />
                Visible
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-2 text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
            {project.shortDesc}
          </p>
          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-muted-foreground">
              Goal: {parseFloat(project.fiatGoal).toLocaleString()} {project.currency}
            </span>
            {project.projectType && (
              <Badge variant="outline">{project.projectType}</Badge>
            )}
          </div>
          {project.ownerProfile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>by {project.ownerProfile.display_name || project.ownerProfile.name}</span>
            </div>
          )}
        </CardContent>
      </div>
      
      <CardContent className="pt-0 pb-6 px-6">
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBlockProject}
            disabled={isBlocking || isUnblocking}
            className="flex-1"
          >
            {isBlocking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Blocking...
              </>
            ) : (
              <>
                <Ban className="h-4 w-4 mr-2" />
                Block Project
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnblockProject}
            disabled={isBlocking || isUnblocking}
            className="flex-1"
          >
            {isUnblocking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Unblocking...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Unblock
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
