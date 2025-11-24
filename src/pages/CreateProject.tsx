import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { getUserSession } from "@/lib/auth";
import { publishProjectToNostr, ProjectData, PublishResult } from "@/lib/publishProject";
import type { LanaSystemParameters } from "@/types/nostr";
import { Loader2, CheckCircle2, XCircle, Plus, X, ArrowLeft, Upload, Image as ImageIcon } from "lucide-react";
import { useUserWallets } from "@/hooks/useUserWallets";
import { uploadProjectImage } from "@/lib/uploadImage";

const CreateProject = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishResults, setPublishResults] = useState<PublishResult[] | null>(null);
  const [eventId, setEventId] = useState<string>("");
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const { wallets, loading: walletsLoading } = useUserWallets();

  const [formData, setFormData] = useState<ProjectData>({
    title: "",
    shortDesc: "",
    longDesc: "",
    fiatGoal: "",
    currency: "EUR",
    walletId: "",
    responsibilityStatement: "",
    videoUrl: "",
    images: []
  });

  useEffect(() => {
    const systemParamsStr = sessionStorage.getItem("lana_system_parameters");
    if (systemParamsStr) {
      try {
        const raw = JSON.parse(systemParamsStr);
        const systemParams: LanaSystemParameters = raw.parameters ?? raw;
        const currencies = Object.keys(systemParams.fx ?? {});
        setAvailableCurrencies(currencies);
        console.log('✅ Loaded currencies:', currencies);
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

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { url } = await uploadProjectImage(file, 'cover');
      setCoverImage(url);
      toast({ title: "Success", description: "Cover image uploaded successfully" });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { url } = await uploadProjectImage(file, 'gallery');
      setImages([...images, url]);
      toast({ title: "Success", description: "Gallery image uploaded successfully" });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
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
        description: "System parameters not found in session", 
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
      console.log('✅ Publishing to relays:', relays);
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
      const result = await publishProjectToNostr(
        { ...formData, images, coverImage },
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

      // Reset form
      setFormData({
        title: "",
        shortDesc: "",
        longDesc: "",
        fiatGoal: "",
        currency: "EUR",
        walletId: "",
        responsibilityStatement: "",
        videoUrl: "",
        images: []
      });
      setImages([]);
      setCoverImage("");

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

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {publishResults ? (
          <Card>
            <CardHeader>
              <CardTitle>Publishing Report</CardTitle>
              <CardDescription>
                Event ID: <code className="bg-muted px-2 py-1 rounded text-xs">{eventId}</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>
                Fill in the project details to publish on LanaCrowd network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                  <p className="text-xs text-muted-foreground">
                    Select the Lana Wallet where project funds will be received
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsibility">Statement of Responsibility *</Label>
                  <p className="text-sm text-muted-foreground">
                    Please type: "I unconditionally accept full self-responsibility for this project and all related actions in the Lana Reality."
                  </p>
                  <Textarea
                    id="responsibility"
                    value={formData.responsibilityStatement}
                    onChange={(e) => setFormData({ ...formData, responsibilityStatement: e.target.value })}
                    rows={2}
                    placeholder="Type the statement above"
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
                  <Label htmlFor="coverImage">Cover Image *</Label>
                  <p className="text-sm text-muted-foreground">
                    Main project image (displayed in lists and on project page)
                  </p>
                  <div className="space-y-2">
                    {coverImage ? (
                      <div className="relative">
                        <img 
                          src={coverImage} 
                          alt="Cover preview" 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setCoverImage("")}
                          className="absolute top-2 right-2"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleCoverImageUpload}
                          className="hidden"
                          id="cover-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => coverInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="w-full"
                        >
                          {uploadingImage ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Cover Image
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Gallery Images (Optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    Additional images shown on the project page
                  </p>
                  <div>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleGalleryImageUpload}
                      className="hidden"
                      id="gallery-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-full"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Add Gallery Image
                        </>
                      )}
                    </Button>
                  </div>
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img 
                            src={img} 
                            alt={`Gallery ${idx + 1}`} 
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            onClick={() => removeImage(idx)}
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1"
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
                    onClick={() => navigate('/dashboard')}
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
            </CardContent>
          </Card>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default CreateProject;
