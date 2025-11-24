import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { QrCode, Key, Coins } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { convertWifToIds } from "@/lib/lanaWallet";
import { saveUserSession } from "@/lib/auth";
import { fetchNostrProfile } from "@/lib/nostrProfile";
const Login = () => {
  const navigate = useNavigate();
  const [privateKey, setPrivateKey] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);
  const startScanning = async () => {
    setIsScanning(true);

    // CRITICAL: 100ms delay to ensure DOM is ready
    setTimeout(async () => {
      try {
        // 1. Enumerate cameras
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          toast.error("No camera found on this device");
          setIsScanning(false);
          return;
        }

        // 2. Select camera (priority: back camera)
        let selectedCamera = cameras[0];
        if (cameras.length > 1) {
          const backCamera = cameras.find(camera => camera.label.toLowerCase().includes('back') || camera.label.toLowerCase().includes('rear'));
          if (backCamera) {
            selectedCamera = backCamera;
          }
        }

        // 3. Initialize scanner
        const scanner = new Html5Qrcode("qr-reader-login");
        scannerRef.current = scanner;

        // 4. Start scanner
        await scanner.start(selectedCamera.id, {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250
          }
        }, decodedText => {
          setPrivateKey(decodedText);
          stopScanning();
          toast.success("QR code scanned successfully!");
        }, errorMessage => {
          // Ignore scan errors during operation
        });
      } catch (error: any) {
        console.error("Error starting QR scanner:", error);
        setIsScanning(false);
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          toast.error("Camera permission denied. Please allow camera access in your browser settings.");
        } else if (error.name === "NotFoundError") {
          toast.error("No camera found on this device");
        } else if (error.name === "NotReadableError") {
          toast.error("Camera is already in use by another application");
        } else {
          toast.error(`Error starting camera: ${error.message || "Unknown error"}`);
        }
      }
    }, 100);
  };
  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
    setIsScanning(false);
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const wif = privateKey.trim();
    if (!wif) {
      toast.error("Please enter your LANA private key (WIF)");
      return;
    }
    let loadingToast: string | number | undefined;
    try {
      // Step 1: Convert WIF to wallet and Nostr identifiers
      loadingToast = toast.loading("Validating private key...");
      const result = await convertWifToIds(wif);

      // Step 2: Fetch Nostr profile from relays
      toast.loading("Fetching your profile from Nostr network...", {
        id: loadingToast
      });
      const profileData = await fetchNostrProfile(result.nostrHexId);
      if (!profileData) {
        toast.dismiss(loadingToast);
        toast.error("No profile found for this account. Please create a profile first.");
        return;
      }

      // Step 3: Save session with profile data
      saveUserSession({
        privateKey: wif,
        ...result,
        profile: profileData.profile,
        profileTags: profileData.tags
      });
      toast.dismiss(loadingToast);
      toast.success(`Welcome back, ${profileData.profile.display_name}!`);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      toast.error(`Failed to sign in: ${error.message || "Invalid LANA private key"}`);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-secondary to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <Coins className="h-10 w-10 text-primary" />
              <span className="text-3xl font-bold text-foreground">
                100MillionFund<span className="text-primary">Fun</span>
              </span>
            </div>
          </div>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            Enter your LANA private key (WIF) to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="privateKey">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  LANA Private Key (WIF)
                </div>
              </Label>
              <Input id="privateKey" type="password" placeholder="Enter your WIF private key..." value={privateKey} onChange={e => setPrivateKey(e.target.value)} disabled={isScanning} className="font-mono" />
            </div>

            {!isScanning ? <Button type="button" variant="outline" onClick={startScanning} className="w-full">
                <QrCode className="mr-2 h-4 w-4" />
                Scan QR Code
              </Button> : <div className="space-y-4">
                <div id="qr-reader-login" ref={scannerDivRef} className="rounded-lg overflow-hidden border-2 border-primary" />
                <Button type="button" variant="destructive" onClick={stopScanning} className="w-full">
                  Stop Scanning
                </Button>
              </div>}

            <Button type="submit" className="w-full" size="lg">
              Sign In
            </Button>

            <div className="text-center pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Don't have a LANA wallet?{" "}
                <a href="https://100Million2Everyone.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Get started
                </a>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>;
};
export default Login;