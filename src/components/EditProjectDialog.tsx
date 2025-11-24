import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { getUserSession } from "@/lib/auth";
import { updateProjectOnNostr, ProjectData, PublishResult } from "@/lib/updateProject";
import type { LanaSystemParameters } from "@/types/nostr";
import type { NostrProject } from "@/hooks/useUserProjects";
import { Loader2, CheckCircle2, XCircle, Plus, X } from "lucide-react";
import { useUserWallets } from "@/hooks/useUserWallets";

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: NostrProject;
  responsibilityStatement: string;
  onSuccess?: () => void;
}

export const EditProjectDialog = ({ 
  open, 
  onOpenChange, 
  project,
  responsibilityStatement,
  onSuccess 
}: EditProjectDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishResults, setPublishResults] = useState<PublishResult[] | null>(null);
  const [eventId, setEventId] = useState<string>("");
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  const { wallets, loading: walletsLoading } = useUserWallets();

  const [formData, setFormData] = useState<ProjectData>({
    title: project.title,
    shortDesc: project.shortDesc,
    longDesc: project.longDesc,
    fiatGoal: project.fiatGoal,
    currency: project.currency,
    walletId: project.walletId,
    responsibilityStatement: responsibilityStatement,
    videoUrl: project.videoUrl || "",
    images: project.galleryImages || []
  });

  useEffect(() => {
    setImages(project.galleryImages || []);
    setFormData({
      title: project.title,
      shortDesc: project.shortDesc,
      longDesc: project.longDesc,
      fiatGoal: project.fiatGoal,
      currency: project.currency,
      walletId: project.walletId,
      responsibilityStatement: responsibilityStatement,
      videoUrl: project.videoUrl || "",
      images: project.galleryImages || []
    });
  }, [project, responsibilityStatement]);

  useEffect(() => {
    const systemParamsStr = sessionStorage.getItem("lana_system_parameters");
    if (systemParamsStr) {
      try {
        const raw = JSON.parse(systemParamsStr);
        const systemParams: LanaSystemParameters = raw.parameters ?? raw;
        const currencies = Object.keys(systemParams.fx ?? {});
        setAvailableCurrencies(currencies);
      } catch (error) {
        console.error("Failed to parse system parameters:", error);
      }
    }
  }, []);

  const formatNumberWithThousands = (value: string): string => {
    const cleanValue = value.replace(/[^\d.]/g, '');
    const parts = cleanValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const handleFiatGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumberWithThousands(e.target.value);
    setFormData({ ...formData, fiatGoal: formatted });
  };

  const addImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const session = getUserSession();
    if (!session) {
      toast({ title: "Error", description: "Not authenticated", variant: "destructive" });
      return;
    }

    const systemParamsStr = sessionStorage.getItem("lana_system_parameters");
    if (!systemParamsStr) {
      toast({ 
        title: "Error", 
        description: "System parameters not found", 
        variant: "destructive" 
      });
      return;
    }

    let relays: string[];
    try {
      const raw = JSON.parse(systemParamsStr);
      const systemParams: LanaSystemParameters = raw.parameters ?? raw;
      relays = systemParams.relays;
      
      if (!relays || relays.length === 0) {
        throw new Error("No relays configured");
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to load relay configuration", 
        variant: "destructive" 
      });
      return;
    }

    if (!formData.title || !formData.shortDesc || !formData.longDesc || 
        !formData.fiatGoal || !formData.walletId) {
      toast({ 
        title: "Validation Error", 
        description: "Please fill in all required fields", 
        variant: "destructive" 
      });
      return;
    }

    const cleanGoal = formData.fiatGoal.replace(/,/g, '');
    if (isNaN(parseFloat(cleanGoal))) {
      toast({ 
        title: "Validation Error", 
        description: "Funding goal must be a valid number", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    setPublishResults(null);

    try {
      const result = await updateProjectOnNostr(
        project.id,
        { ...formData, images },
        session.privateKeyHex,
        session.nostrHexId,
        relays
      );

      setEventId(result.eventId);
      setPublishResults(result.results);

      const successCount = result.results.filter(r => r.success).length;
      
      toast({
        title: "Project Updated!",
        description: `Project updated on ${successCount}/${relays.length} relays`,
      });

      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Update Failed",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPublishResults(null);
    setEventId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update project details. Changes will be published to all relays.
          </DialogDescription>
        </DialogHeader>

        {publishResults ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Update Report</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Event ID: <code className="bg-background px-2 py-1 rounded">{eventId}</code>
              </p>
              
              <div className="space-y-2">
                {publishResults.map((result, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="flex-1">{result.relay}</span>
                    {result.error && (
                      <span className="text-xs text-muted-foreground">{result.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter project title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDesc">Short Description *</Label>
              <Textarea
                id="shortDesc"
                value={formData.shortDesc}
                onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                placeholder="One or two sentence description"
                rows={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longDesc">Full Description *</Label>
              <Textarea
                id="longDesc"
                value={formData.longDesc}
                onChange={(e) => setFormData({ ...formData, longDesc: e.target.value })}
                placeholder="Full project story, use of funds, timeline, rewards, etc."
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fiatGoal">Funding Goal *</Label>
                <Input
                  id="fiatGoal"
                  type="text"
                  value={formData.fiatGoal}
                  onChange={handleFiatGoalChange}
                  placeholder="10,000.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies.map((curr) => (
                      <SelectItem key={curr} value={curr}>
                        {curr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="walletId">Project Wallet ID *</Label>
              <Select
                value={formData.walletId}
                onValueChange={(value) => setFormData({ ...formData, walletId: value })}
                disabled={walletsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={walletsLoading ? "Loading wallets..." : "Select wallet"} />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.walletId} value={wallet.walletId}>
                      <div className="flex flex-col">
                        <span className="font-medium">{wallet.walletId}</span>
                        <span className="text-xs text-muted-foreground">
                          {wallet.walletType} {wallet.note && `• ${wallet.note.substring(0, 30)}${wallet.note.length > 30 ? '...' : ''}`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibility">Statement of Responsibility *</Label>
              <Textarea
                id="responsibility"
                value={formData.responsibilityStatement}
                onChange={(e) => setFormData({ ...formData, responsibilityStatement: e.target.value })}
                rows={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl">YouTube Video (Optional)</Label>
              <Input
                id="videoUrl"
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div className="space-y-2">
              <Label>Project Images (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addImage();
                    }
                  }}
                />
                <Button type="button" onClick={addImage} variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {images.length > 0 && (
                <div className="space-y-2 mt-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <span className="text-xs flex-1 truncate">{img}</span>
                      <Button
                        type="button"
                        onClick={() => removeImage(idx)}
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Project"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
