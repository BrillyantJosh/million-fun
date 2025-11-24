import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { useReceivedDonations } from "@/hooks/useReceivedDonations";
import { useUserProjects } from "@/hooks/useUserProjects";
import { Badge } from "@/components/ui/badge";

const MyDonations = () => {
  const navigate = useNavigate();
  const { donations, loading: donationsLoading, error: donationsError } = useReceivedDonations();
  const { projects } = useUserProjects();

  // Create a map of project IDs to project titles
  const projectTitles = new Map(
    projects.map(p => [p.id, p.title])
  );

  // Calculate total received
  const totalReceived = donations.reduce((sum, d) => sum + parseFloat(d.amountFiat), 0);
  const currency = donations[0]?.currency || "EUR";

  if (donationsLoading) {
    return (
      <div className="min-h-screen flex flex-col pb-16">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <BottomNav />
      </div>
    );
  }

  if (donationsError) {
    return (
      <div className="min-h-screen flex flex-col pb-16">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-8">
              <p className="text-destructive">Error: {donationsError}</p>
            </CardContent>
          </Card>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Received Donations</h1>
          <p className="text-muted-foreground">
            Donations received for your projects
          </p>
        </div>

        {donations.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground text-lg">
                No donations received yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Received</p>
                    <p className="text-2xl font-bold text-foreground">
                      {totalReceived.toFixed(2)} {currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Donations</p>
                    <p className="text-2xl font-bold text-foreground">{donations.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Supported Projects</p>
                    <p className="text-2xl font-bold text-foreground">
                      {new Set(donations.map(d => d.projectId)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {donations.map((donation) => (
                <Card key={donation.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">
                            {projectTitles.get(donation.projectId) || "Project"}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {donation.currency}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          From: {donation.supporterName || `${donation.supporter.slice(0, 16)}...`}
                        </p>
                        {donation.message && (
                          <p className="text-sm text-foreground italic">
                            "{donation.message}"
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-xs text-muted-foreground">
                            {new Date(donation.timestampPaid * 1000).toLocaleDateString()}
                          </p>
                          {donation.tx && (
                            <a
                              href={`https://chainz.cryptoid.info/lana/tx.dws?${donation.tx}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              View TX <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {parseFloat(donation.amountFiat).toFixed(2)} {donation.currency}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(parseInt(donation.amountLanoshis) / 100000000).toFixed(2)} LANA
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default MyDonations;
