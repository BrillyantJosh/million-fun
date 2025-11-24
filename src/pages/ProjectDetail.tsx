import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SimplePool } from "nostr-tools/pool";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Wallet, Target, Calendar, Video, User, Shield, Edit } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { EditProjectDialog } from "@/components/EditProjectDialog";
import { getUserSession } from "@/lib/auth";
import type { LanaSystemParameters } from "@/types/nostr";
import type { NostrProject } from "@/hooks/useUserProjects";
import type { NostrProfile } from "@/types/nostrProfile";

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<NostrProject | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<NostrProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responsibilityStatement, setResponsibilityStatement] = useState<string>("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchProjectDetail = async () => {
      if (!projectId) {
        setError("Project ID not provided");
        setLoading(false);
        return;
      }

      const systemParamsStr = sessionStorage.getItem("lana_system_parameters");
      if (!systemParamsStr) {
        setError("System parameters not found");
        setLoading(false);
        return;
      }

      try {
        const raw = JSON.parse(systemParamsStr);
        const systemParams: LanaSystemParameters = raw.parameters ?? raw;
        const relays = systemParams.relays;

        if (!relays || relays.length === 0) {
          setError("No relays configured");
          setLoading(false);
          return;
        }

        const pool = new SimplePool();
        
        try {
          const dTag = `project:${projectId}`;
          console.log('🔍 Fetching project:', dTag);

          const eventPromises = relays.map(async (relay) => {
            return new Promise<any[]>((resolve) => {
              const timeout = setTimeout(() => {
                resolve([]);
              }, 5000);

              try {
                pool.querySync([relay], {
                  kinds: [31234],
                  "#d": [dTag],
                  limit: 1
                }).then((events) => {
                  clearTimeout(timeout);
                  resolve(events);
                }).catch(() => {
                  clearTimeout(timeout);
                  resolve([]);
                });
              } catch {
                clearTimeout(timeout);
                resolve([]);
              }
            });
          });

          const allResults = await Promise.all(eventPromises);
          const allEvents = allResults.flat();
          
          if (allEvents.length === 0) {
            setError("Project not found");
            setLoading(false);
            return;
          }

          // Get most recent event
          const event = allEvents.sort((a, b) => b.created_at - a.created_at)[0];

          const getTag = (name: string) => {
            const tag = event.tags.find((t: string[]) => t[0] === name);
            return tag ? tag[1] : undefined;
          };

          const getAllTags = (name: string, type?: string) => {
            return event.tags
              .filter((t: string[]) => t[0] === name && (!type || t[2] === type))
              .map((t: string[]) => t[1]);
          };

          const coverImages = event.tags.filter(
            (t: string[]) => t[0] === "img" && t[2] === "cover"
          );
          const galleryImages = getAllTags("img", "gallery");
          const ownerTag = event.tags.find(
            (t: string[]) => t[0] === "p" && t[2] === "owner"
          );

          const parsedProject: NostrProject = {
            id: projectId,
            eventId: event.id,
            title: getTag("title") || "Untitled Project",
            shortDesc: getTag("short_desc") || "",
            longDesc: event.content || "",
            fiatGoal: getTag("fiat_goal") || "0",
            currency: getTag("currency") || "EUR",
            walletId: getTag("wallet") || "",
            coverImage: coverImages.length > 0 ? coverImages[0][1] : undefined,
            galleryImages,
            videoUrl: getTag("video"),
            owner: ownerTag ? ownerTag[1] : "",
            createdAt: event.created_at
          };

          const respStatement = getTag("responsibility_statement") || "";
          setResponsibilityStatement(respStatement);
          setProject(parsedProject);

          // Fetch owner profile (KIND 0)
          if (parsedProject.owner) {
            try {
              const profilePromises = relays.map(async (relay) => {
                return new Promise<any[]>((resolve) => {
                  const timeout = setTimeout(() => resolve([]), 3000);
                  
                  pool.querySync([relay], {
                    kinds: [0],
                    authors: [parsedProject.owner],
                    limit: 1
                  }).then((events) => {
                    clearTimeout(timeout);
                    resolve(events);
                  }).catch(() => {
                    clearTimeout(timeout);
                    resolve([]);
                  });
                });
              });

              const profileResults = await Promise.all(profilePromises);
              const profileEvents = profileResults.flat();
              
              if (profileEvents.length > 0) {
                const latestProfile = profileEvents.sort((a, b) => b.created_at - a.created_at)[0];
                const profileData = JSON.parse(latestProfile.content);
                setOwnerProfile(profileData);
              }
            } catch (err) {
              console.error('Failed to fetch owner profile:', err);
            }
          }

          setLoading(false);
        } finally {
          pool.close(relays);
        }
      } catch (err) {
        console.error('❌ Error fetching project:', err);
        setError(err instanceof Error ? err.message : "Failed to fetch project");
        setLoading(false);
      }
    };

    fetchProjectDetail();
  }, [projectId, refreshKey]);

  useEffect(() => {
    const session = getUserSession();
    if (session && project) {
      setIsOwner(session.nostrHexId === project.owner);
    }
  }, [project]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pb-16">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col pb-16">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          {isOwner && (
            <Button onClick={() => setEditDialogOpen(true)} variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Project
            </Button>
          )}
        </div>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-destructive">{error || "Project not found"}</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Cover Image */}
        {project.coverImage && (
          <div className="relative h-96 rounded-lg overflow-hidden mb-8">
            <img
              src={project.coverImage}
              alt={project.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {project.currency}
              </Badge>
            </div>
          </div>
        )}

        {/* Title and Short Description */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">{project.title}</h1>
          <p className="text-xl text-muted-foreground">{project.shortDesc}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Initiator */}
            {ownerProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Project Initiator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={ownerProfile.picture} alt={ownerProfile.name} />
                      <AvatarFallback>{ownerProfile.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{ownerProfile.display_name || ownerProfile.name}</h3>
                      {ownerProfile.about && (
                        <p className="text-sm text-muted-foreground mt-1">{ownerProfile.about}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        {ownerProfile.location && <span>📍 {ownerProfile.location}</span>}
                        {ownerProfile.country && <span>🌍 {ownerProfile.country}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Responsibility Statement */}
            {responsibilityStatement && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Shield className="h-5 w-5" />
                    Statement of Responsibility
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm italic text-foreground">"{responsibilityStatement}"</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Project Description</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-foreground">{project.longDesc}</p>
              </CardContent>
            </Card>

            {/* Video */}
            {project.videoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Project Video
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={project.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-2"
                  >
                    Watch on YouTube →
                  </a>
                </CardContent>
              </Card>
            )}

            {/* Gallery Images */}
            {project.galleryImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Project Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {project.galleryImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Funding Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {parseFloat(project.fiatGoal).toLocaleString()} {project.currency}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Project Wallet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-mono break-all text-muted-foreground">
                  {project.walletId}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Created
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {new Date(project.createdAt * 1000).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>

            <Separator />

            <Button 
              className="w-full" 
              size="lg"
              onClick={() => navigate(`/donate/${projectId}`)}
            >
              Donate with LANA
            </Button>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
      
      {project && (
        <EditProjectDialog 
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          project={project}
          responsibilityStatement={responsibilityStatement}
          onSuccess={() => {
            setRefreshKey(prev => prev + 1);
            setEditDialogOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
