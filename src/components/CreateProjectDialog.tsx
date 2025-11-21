import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { getUserSession } from "@/lib/auth";
import { publishProjectToNostr, ProjectData, PublishResult } from "@/lib/publishProject";
import type { LanaSystemParameters } from "@/types/nostr";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateProjectDialog = ({ open, onOpenChange }: CreateProjectDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishResults, setPublishResults] = useState<PublishResult[] | null>(null);
  const [eventId, setEventId] = useState<string>("");

  const [formData, setFormData] = useState<ProjectData>({
    title: "",
    shortDesc: "",
    longDesc: "",
    fiatGoal: "",
    currency: "EUR",
    walletId: "",
    responsibilityStatement: "I unconditionally accept full self-responsibility for this project and all related actions in the Lana Reality.",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const session = getUserSession();
    if (!session) {
      toast({ title: "Error", description: "Not authenticated", variant: "destructive" });
      return;
    }

    // Get relays from session storage
    const systemParamsStr = sessionStorage.getItem("lana_system_parameters");
    if (!systemParamsStr) {
      toast({ 
        title: "Error", 
        description: "System parameters not found in session", 
        variant: "destructive" 
      });
      return;
    }

    let relays: string[];
    try {
      const systemParams: LanaSystemParameters = JSON.parse(systemParamsStr);
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

    // Validate form
    if (!formData.title || !formData.shortDesc || !formData.longDesc || 
        !formData.fiatGoal || !formData.walletId) {
      toast({ 
        title: "Validation Error", 
        description: "Please fill in all required fields", 
        variant: "destructive" 
      });
      return;
    }

    // Validate fiatGoal is a number
    if (isNaN(parseFloat(formData.fiatGoal))) {
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
      const result = await publishProjectToNostr(
        formData,
        session.privateKeyHex,
        session.nostrHexId,
        relays
      );

      setEventId(result.eventId);
      setPublishResults(result.results);

      const successCount = result.results.filter(r => r.success).length;
      
      toast({
        title: "Project Created!",
        description: `Project published to ${successCount}/${relays.length} relays`,
      });

      // Reset form after successful publish
      setFormData({
        title: "",
        shortDesc: "",
        longDesc: "",
        fiatGoal: "",
        currency: "EUR",
        walletId: "",
        responsibilityStatement: "I unconditionally accept full self-responsibility for this project and all related actions in the Lana Reality.",
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Publishing Failed",
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
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the project details to publish on LanaCrowd network
          </DialogDescription>
        </DialogHeader>

        {publishResults ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Publishing Report</h3>
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
                  onChange={(e) => setFormData({ ...formData, fiatGoal: e.target.value })}
                  placeholder="10000.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  placeholder="EUR"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="walletId">Project Wallet ID *</Label>
              <Input
                id="walletId"
                value={formData.walletId}
                onChange={(e) => setFormData({ ...formData, walletId: e.target.value })}
                placeholder="LdDJbcCbi4WN5AK1BobQiSJhFdAySTShBv"
                required
              />
              <p className="text-xs text-muted-foreground">
                Lana Wallet ID where project funds will be received
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibility">Statement of Responsibility *</Label>
              <Textarea
                id="responsibility"
                value={formData.responsibilityStatement}
                onChange={(e) => setFormData({ ...formData, responsibilityStatement: e.target.value })}
                rows={3}
                required
              />
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
                    Publishing...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
