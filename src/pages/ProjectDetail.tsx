import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SimplePool } from "nostr-tools/pool";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Wallet, Target, Calendar, Video } from "lucide-react";
import type { LanaSystemParameters } from "@/types/nostr";
import type { NostrProject } from "@/hooks/useUserProjects";

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<NostrProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

          setProject(parsedProject);
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
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-destructive">{error || "Project not found"}</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
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

            <Button className="w-full" size="lg">
              Donate with LANA
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProjectDetail;
