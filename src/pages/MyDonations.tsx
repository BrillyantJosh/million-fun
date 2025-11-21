import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const MyDonations = () => {
  const navigate = useNavigate();

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
          <h1 className="text-3xl font-bold text-foreground mb-2">My Donations</h1>
          <p className="text-muted-foreground">
            Track your contribution history
          </p>
        </div>

        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground text-lg">
              Your donation history will appear here
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default MyDonations;
