import { AdminProjectCard } from "./AdminProjectCard";
import { useAllProjects } from "@/hooks/useAllProjects";
import { useNostrConnection } from "@/hooks/useNostrConnection";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const AdminProjectsGrid = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: settings } = useAppSettings();
  const {
    loading: connectionLoading,
    error: connectionError
  } = useNostrConnection();
  const {
    projects,
    loading,
    error
  } = useAllProjects();

  const handleStatusChange = () => {
    // Trigger refresh
    setRefreshKey(prev => prev + 1);
  };

  if (connectionLoading || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (connectionError || error) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-4">
          <p className="text-muted-foreground">
            Unable to connect to the network. This may be temporary.
          </p>
          <p className="text-sm text-destructive">{connectionError || error}</p>
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!settings?.nostr_key || !settings?.nostr_hex_id) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-2">
            Authority Nostr credentials not configured
          </p>
          <p className="text-sm text-destructive">
            Please configure Authority Nostr Private Key and Hex ID in the Settings tab to manage project visibility.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">All Projects ({projects.length})</h2>
        <p className="text-sm text-muted-foreground">
          Block projects to hide them from public view
        </p>
      </div>
      
      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground text-lg">
              No projects available yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {projects.map(project => (
            <AdminProjectCard 
              key={`${project.id}-${refreshKey}`} 
              project={project}
              onStatusChange={handleStatusChange}
              authorityNostrKey={settings.nostr_key!}
              authorityNostrHexId={settings.nostr_hex_id!}
            />
          ))}
        </div>
      )}
    </div>
  );
};
