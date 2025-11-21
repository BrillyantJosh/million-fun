import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { getUserSession } from "@/lib/auth";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, Camera, X } from "lucide-react";
import { useUserWallets } from "@/hooks/useUserWallets";
import type { LanaSystemParameters } from "@/types/nostr";
import { SimplePool, type Filter } from "nostr-tools";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Html5Qrcode } from "html5-qrcode";

const DonatePage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectData, setProjectData] = useState<{
    title: string;
    currency: string;
    walletId: string;
    fiatGoal: string;
    ownerHex: string;
  } | null>(null);

  const { wallets, loading: walletsLoading } = useUserWallets();

  const [donationAmount, setDonationAmount] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [message, setMessage] = useState("");
  const [lanaAmount, setLanaAmount] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [fxRate, setFxRate] = useState<number | null>(null);
  const [showWifDialog, setShowWifDialog] = useState(false);
  const [wifKey, setWifKey] = useState("");
  const [showQrScanner, setShowQrScanner] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const session = getUserSession();
    if (!session) {
      toast({ 
        title: "Authentication Required", 
        description: "Please log in to donate", 
        variant: "destructive" 
      });
      navigate("/login");
      return;
    }

    const fetchProjectData = async () => {
      const systemParamsStr = sessionStorage.getItem("lana_system_parameters");
      if (!systemParamsStr || !projectId) {
        toast({ 
          title: "Error", 
          description: "Missing system configuration", 
          variant: "destructive" 
        });
        navigate("/dashboard");
        return;
      }

      try {
        const raw = JSON.parse(systemParamsStr);
        const systemParams: LanaSystemParameters = raw.parameters ?? raw;
        const relays = systemParams.relays;

        const pool = new SimplePool();
        const filter: Filter = {
          kinds: [31234],
          "#d": [`project:${projectId}`],
          limit: 1
        };

        const events = await pool.querySync(relays, filter);
        pool.close(relays);

        if (events.length === 0) {
          toast({ 
            title: "Project Not Found", 
            description: "Unable to load project details", 
            variant: "destructive" 
          });
          navigate("/dashboard");
          return;
        }

        const event = events[0];
        const getTag = (name: string) => {
          const tag = event.tags.find((t: string[]) => t[0] === name);
          return tag ? tag[1] : undefined;
        };

        setProjectData({
          title: getTag("title") || "Untitled Project",
          currency: getTag("currency") || "EUR",
          walletId: getTag("wallet") || "",
          fiatGoal: getTag("fiat_goal") || "0",
          ownerHex: event.pubkey
        });
      } catch (error) {
        console.error("Error fetching project:", error);
        toast({ 
          title: "Error", 
          description: "Failed to load project", 
          variant: "destructive" 
        });
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId, navigate]);

  // Load FX rate from session
  useEffect(() => {
    const systemParamsStr = sessionStorage.getItem("lana_system_parameters");
    if (systemParamsStr && projectData) {
      try {
        const raw = JSON.parse(systemParamsStr);
        const systemParams: LanaSystemParameters = raw.parameters ?? raw;
        const rate = systemParams.fx?.[projectData.currency];
        if (rate) {
          setFxRate(rate);
          console.log(`FX Rate for ${projectData.currency}: ${rate}`);
        }
      } catch (error) {
        console.error("Failed to load FX rate:", error);
      }
    }
  }, [projectData]);

  // Convert FIAT to LANA and check balance
  useEffect(() => {
    const checkWalletBalance = async () => {
      if (!donationAmount || !selectedWalletId || !fxRate) {
        setLanaAmount(null);
        setWalletBalance(null);
        return;
      }

      const cleanAmount = donationAmount.replace(/,/g, '');
      const fiatAmount = parseFloat(cleanAmount);
      
      if (isNaN(fiatAmount) || fiatAmount <= 0) {
        setLanaAmount(null);
        setWalletBalance(null);
        return;
      }

      // Convert FIAT to LANA (divide by FX rate)
      const lana = fiatAmount / fxRate;
      setLanaAmount(Math.round(lana * 100) / 100);
      
      console.log(`Converting ${fiatAmount} FIAT to LANA: ${fiatAmount} / ${fxRate} = ${lana} LANA`);

      // Check wallet balance
      setCheckingBalance(true);
      try {
        const systemParamsStr = sessionStorage.getItem("lana_system_parameters");
        if (!systemParamsStr) {
          console.error('System parameters not found in session');
          setWalletBalance(null);
          return;
        }

        const raw = JSON.parse(systemParamsStr);
        const systemParams: LanaSystemParameters = raw.parameters ?? raw;
        
        console.log('System parameters:', systemParams);
        console.log('Electrum servers raw:', systemParams.electrum);
        
        if (!systemParams.electrum || systemParams.electrum.length === 0) {
          console.error('No Electrum servers configured in system parameters');
          toast({
            title: "Configuration Error",
            description: "Electrum servers not configured. Cannot check wallet balance.",
            variant: "destructive"
          });
          setWalletBalance(null);
          return;
        }

        const electrumServers = systemParams.electrum.map((server: any) => ({
          host: server.host,
          port: server.port.toString()
        }));

        console.log('Calling edge function with:', {
          wallet_addresses: [selectedWalletId],
          electrum_servers: electrumServers
        });

        const { data, error } = await supabase.functions.invoke('check-wallet-balance', {
          body: {
            wallet_addresses: [selectedWalletId],
            electrum_servers: electrumServers
          }
        });

        if (error) {
          console.error('Error checking balance:', error);
          toast({
            title: "Balance Check Failed",
            description: "Unable to check wallet balance. Please try again.",
            variant: "destructive"
          });
          setWalletBalance(null);
          return;
        }

        console.log('Balance check response:', data);

        if (data?.wallets?.[0]) {
          setWalletBalance(data.wallets[0].balance);
          console.log(`Wallet ${selectedWalletId} balance: ${data.wallets[0].balance} LANA`);
        }
      } catch (error) {
        console.error('Failed to check balance:', error);
        toast({
          title: "Balance Check Failed",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive"
        });
        setWalletBalance(null);
      } finally {
        setCheckingBalance(false);
      }
    };

    const timeoutId = setTimeout(checkWalletBalance, 500);
    return () => clearTimeout(timeoutId);
  }, [donationAmount, selectedWalletId, fxRate]);

  const formatNumberWithThousands = (value: string): string => {
    const cleanValue = value.replace(/[^\d.]/g, '');
    const parts = cleanValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumberWithThousands(e.target.value);
    setDonationAmount(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWalletId) {
      toast({ 
        title: "Validation Error", 
        description: "Please select a wallet", 
        variant: "destructive" 
      });
      return;
    }

    const cleanAmount = donationAmount.replace(/,/g, '');
    if (!cleanAmount || isNaN(parseFloat(cleanAmount)) || parseFloat(cleanAmount) <= 0) {
      toast({ 
        title: "Validation Error", 
        description: "Please enter a valid donation amount", 
        variant: "destructive" 
      });
      return;
    }

    if (walletBalance !== null && lanaAmount !== null && walletBalance < lanaAmount) {
      toast({ 
        title: "Insufficient Funds", 
        description: "Your wallet does not have enough LANA for this donation", 
        variant: "destructive" 
      });
      return;
    }

    // Open WIF dialog
    setShowWifDialog(true);
  };

  const handleConfirmWithWif = async () => {
    if (!wifKey.trim()) {
      toast({ 
        title: "WIF Key Required", 
        description: "Please enter your WIF private key to sign the transaction", 
        variant: "destructive" 
      });
      return;
    }

    if (!projectData || !lanaAmount) {
      return;
    }

    setIsSubmitting(true);

    try {
      const systemParamsStr = sessionStorage.getItem("lana_system_parameters");
      if (!systemParamsStr) {
        throw new Error("System parameters not found");
      }

      const raw = JSON.parse(systemParamsStr);
      const systemParams: LanaSystemParameters = raw.parameters ?? raw;
      
      const electrumServers = systemParams.electrum.map((server: any) => ({
        host: server.host,
        port: server.port
      }));

      // Derive private key hex from WIF
      const base58Decode = (str: string): Uint8Array => {
        const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        if (str.length === 0) return new Uint8Array(0);
        let bytes = [0];
        for (let i = 0; i < str.length; i++) {
          const c = str[i];
          const p = ALPHABET.indexOf(c);
          if (p < 0) throw new Error('Invalid base58 character');
          let carry = p;
          for (let j = 0; j < bytes.length; j++) {
            carry += bytes[j] * 58;
            bytes[j] = carry & 0xff;
            carry >>= 8;
          }
          while (carry > 0) {
            bytes.push(carry & 0xff);
            carry >>= 8;
          }
        }
        let leadingOnes = 0;
        for (let i = 0; i < str.length && str[i] === '1'; i++) {
          leadingOnes++;
        }
        const result = new Uint8Array(leadingOnes + bytes.length);
        bytes.reverse();
        result.set(bytes, leadingOnes);
        return result;
      };
      
      const privateKeyBytes = base58Decode(wifKey);
      const privateKeyHex = Array.from(privateKeyBytes.slice(1, 33))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Calculate fiat amount
      const cleanAmount = donationAmount.replace(/,/g, '');
      const fiatAmount = parseFloat(cleanAmount).toFixed(2);

      console.log("Processing donation:", {
        recipient: projectData.walletId,
        amountLana: lanaAmount,
        electrumServers: electrumServers.length,
        projectId,
        projectOwnerHex: projectData.ownerHex
      });

      const { data, error } = await supabase.functions.invoke('process-lana-donation', {
        body: {
          recipient_address: projectData.walletId,
          amount_lana: lanaAmount,
          private_key: wifKey,
          electrum_servers: electrumServers,
          project_id: projectId,
          project_owner_hex: projectData.ownerHex,
          supporter_private_key_hex: privateKeyHex,
          amount_fiat: fiatAmount,
          currency: projectData.currency,
          message: message,
          relays: systemParams.relays
        }
      });

      if (error) {
        console.error('Donation error:', error);
        throw new Error(error.message || "Failed to process donation");
      }

      if (!data || !data.success) {
        throw new Error(data?.error || "Transaction failed");
      }

      console.log("Transaction successful:", data);

      // Navigate to result page with detailed report
      navigate('/donation-result', { state: { result: data } });
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("Donation failed:", errorMsg);
      toast({
        title: "Donation Failed",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup scanner on unmount or dialog close
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startQrScanner = async () => {
    setShowQrScanner(true);
    
    // 100ms delay to ensure DOM is ready
    setTimeout(async () => {
      try {
        // 1. Enumerate cameras
        const cameras = await Html5Qrcode.getCameras();
        
        if (!cameras || cameras.length === 0) {
          toast({
            title: "No Camera Found",
            description: "No camera found on this device",
            variant: "destructive"
          });
          setShowQrScanner(false);
          return;
        }

        // 2. Select camera (priority: back camera)
        let selectedCamera = cameras[0];
        if (cameras.length > 1) {
          const backCamera = cameras.find(camera => 
            camera.label.toLowerCase().includes('back') || 
            camera.label.toLowerCase().includes('rear')
          );
          if (backCamera) {
            selectedCamera = backCamera;
          }
        }

        // 3. Initialize scanner
        const scanner = new Html5Qrcode("qr-reader-wif");
        scannerRef.current = scanner;

        // 4. Start scanner
        await scanner.start(
          selectedCamera.id,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            setWifKey(decodedText);
            stopQrScanner();
            toast({
              title: "QR Code Scanned",
              description: "WIF key loaded successfully"
            });
          },
          () => {
            // Ignore scan errors during operation
          }
        );
      } catch (error: any) {
        console.error("Error starting QR scanner:", error);
        setShowQrScanner(false);
        
        let errorMessage = "Unknown error";
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          errorMessage = "Camera permission denied. Please allow camera access in your browser settings.";
        } else if (error.name === "NotFoundError") {
          errorMessage = "No camera found on this device";
        } else if (error.name === "NotReadableError") {
          errorMessage = "Camera is already in use by another application";
        } else {
          errorMessage = error.message || "Unknown error occurred";
        }
        
        toast({
          title: "Scanner Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }, 100);
  };

  const stopQrScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
    setShowQrScanner(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col pb-16">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  if (!projectData) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate(`/project/${projectId}`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Donate with LANA</CardTitle>
            <CardDescription>
              Support: {projectData.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Project Wallet (TO)</Label>
                <Input
                  value={projectData.walletId}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Funds will be sent to this wallet
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromWallet">Your Wallet (FROM) *</Label>
                <Select
                  value={selectedWalletId}
                  onValueChange={setSelectedWalletId}
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
                  Select the wallet to send funds from
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Donation Amount ({projectData.currency}) *</Label>
                <Input
                  id="amount"
                  type="text"
                  value={donationAmount}
                  onChange={handleAmountChange}
                  placeholder="100.00"
                  required
                />
                {lanaAmount !== null && (
                  <p className="text-sm text-muted-foreground">
                    ≈ {lanaAmount.toLocaleString()} LANA
                  </p>
                )}
              </div>

              {walletBalance !== null && lanaAmount !== null && (
                <Alert variant={walletBalance >= lanaAmount ? "default" : "destructive"}>
                  <div className="flex items-center gap-2">
                    {walletBalance >= lanaAmount ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      Wallet balance: {walletBalance.toLocaleString()} LANA
                      {walletBalance < lanaAmount && (
                        <span className="block mt-1">
                          Insufficient funds. You need {(lanaAmount - walletBalance).toLocaleString()} more LANA.
                        </span>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {checkingBalance && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking wallet balance...
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Input
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Leave a message for the project creator"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/project/${projectId}`)}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || 
                    walletsLoading || 
                    checkingBalance || 
                    (walletBalance !== null && lanaAmount !== null && walletBalance < lanaAmount)
                  }
                  className="flex-1"
                >
                  Continue to Sign
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* WIF Dialog */}
        <Dialog open={showWifDialog} onOpenChange={setShowWifDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sign Transaction</DialogTitle>
              <DialogDescription>
                Enter your WIF private key to sign and broadcast the donation transaction
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Alert>
                <AlertDescription className="text-sm">
                  <div className="font-semibold mb-1">Transaction Details:</div>
                  <div className="space-y-1">
                    <div>From: <span className="font-mono text-xs">{selectedWalletId}</span></div>
                    <div>To: <span className="font-mono text-xs">{projectData?.walletId}</span></div>
                    <div>Amount: {lanaAmount?.toLocaleString()} LANA ({donationAmount} {projectData?.currency})</div>
                  </div>
                </AlertDescription>
              </Alert>

              {!showQrScanner ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="wif">WIF Private Key</Label>
                    <Input
                      id="wif"
                      type="password"
                      value={wifKey}
                      onChange={(e) => setWifKey(e.target.value)}
                      placeholder="Enter WIF key (e.g., K...)"
                      className="font-mono"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={startQrScanner}
                    className="w-full"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Scan QR Code
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div
                    id="qr-reader-wif"
                    ref={scannerDivRef}
                    className="rounded-lg overflow-hidden border-2 border-primary"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={stopQrScanner}
                    className="w-full"
                  >
                    Stop Scanning
                  </Button>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowWifDialog(false);
                    setWifKey("");
                    stopQrScanner();
                  }}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmWithWif}
                  disabled={isSubmitting || !wifKey.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm & Send"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default DonatePage;
