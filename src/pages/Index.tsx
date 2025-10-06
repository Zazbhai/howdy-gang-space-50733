import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
            Lost & Found
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Find What You've Lost Instantly!
          </p>
          <p className="text-lg text-muted-foreground mb-12">
            Connect people who have lost something with those who found it.
            Secure verification ensures safe exchanges.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/report-lost')}
              className="text-lg"
            >
              <AlertCircle className="mr-2 h-5 w-5" />
              Report Lost Item
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/report-found')}
              className="text-lg"
            >
              <Package className="mr-2 h-5 w-5" />
              Report Found Item
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/search')}
              className="text-lg"
            >
              <Search className="mr-2 h-5 w-5" />
              Search Items
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Three simple steps to reunite with your belongings
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-semibold mb-2">
                1. Report Item
              </h3>
              <p className="text-muted-foreground">
                Report your lost or found item with details and photo
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-heading font-semibold mb-2">
                2. System Matches
              </h3>
              <p className="text-muted-foreground">
                Our system automatically finds potential matches
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-warning" />
              </div>
              <h3 className="text-xl font-heading font-semibold mb-2">
                3. Verify & Connect
              </h3>
              <p className="text-muted-foreground">
                Verify ownership with claim code and reunite!
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
