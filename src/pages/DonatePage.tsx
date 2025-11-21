import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { getUserSession } from "@/lib/auth";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useUserWallets } from "@/hooks/useUserWallets";
import type { LanaSystemParameters } from "@/types/nostr";
import { SimplePool, type Filter } from "nostr-tools";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  } | null>(null);

  const { wallets, loading: walletsLoading } = useUserWallets();

  const [donationAmount, setDonationAmount] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [message, setMessage] = useState("");
  const [lanaAmount, setLanaAmount] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [fxRate, setFxRate] = useState<number | null>(null);

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
          fiatGoal: getTag("fiat_goal") || "0"
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

      // Convert FIAT to LANA
      const lana = fiatAmount * fxRate;
      setLanaAmount(Math.round(lana * 100) / 100);

      // Check wallet balance
      setCheckingBalance(true);
      try {
        const systemParamsStr = sessionStorage.getItem("lana_system_parameters");
        if (!systemParamsStr) return;

        const raw = JSON.parse(systemParamsStr);
        const systemParams: LanaSystemParameters = raw.parameters ?? raw;
        
        const electrumServers = (systemParams.electrum || []).map((server: any) => ({
          host: server.host,
          port: server.port.toString()
        }));

        const { data, error } = await supabase.functions.invoke('check-wallet-balance', {
          body: {
            wallet_addresses: [selectedWalletId],
            electrum_servers: electrumServers
          }
        });

        if (error) {
          console.error('Error checking balance:', error);
          setWalletBalance(null);
          return;
        }

        if (data?.wallets?.[0]) {
          setWalletBalance(data.wallets[0].balance);
          console.log(`Wallet ${selectedWalletId} balance: ${data.wallets[0].balance} LANA`);
        }
      } catch (error) {
        console.error('Failed to check balance:', error);
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
    
    const session = getUserSession();
    if (!session || !projectData) {
      return;
    }

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

    setIsSubmitting(true);

    try {
      // TODO: Implement actual donation logic
      // This would involve creating a KIND 60200 event or triggering the transaction
      console.log("Donation details:", {
        projectId,
        fromWallet: selectedWalletId,
        toWallet: projectData.walletId,
        amount: cleanAmount,
        currency: projectData.currency,
        message
      });

      toast({
        title: "Donation Submitted!",
        description: `Donation of ${cleanAmount} ${projectData.currency} initiated`,
      });

      navigate(`/project/${projectId}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Donation Failed",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Donation"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default DonatePage;
