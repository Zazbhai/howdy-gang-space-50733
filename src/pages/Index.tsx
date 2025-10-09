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
      <section className="container mx-auto px-4 py-16 md:py-24 pt-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold mb-6 tracking-tighter">
            <span className="text-gradient-primary">LOST & FOUND</span>
          </h1>
          <p className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
            Find What You've Lost Instantly
          </p>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Connect people who have lost something with those who found it.
            Secure verification ensures safe exchanges.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/report-lost')}
              className="text-lg font-bold px-8 py-6 hover:scale-105 transition-transform shadow-modern-lg"
            >
              <AlertCircle className="mr-2 h-6 w-6" />
              REPORT LOST
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/report-found')}
              className="text-lg font-bold px-8 py-6 hover:scale-105 transition-transform shadow-modern-md border-2"
            >
              <Package className="mr-2 h-6 w-6" />
              REPORT FOUND
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/search')}
              className="text-lg font-bold px-8 py-6 hover:scale-105 transition-transform"
            >
              <Search className="mr-2 h-6 w-6" />
              SEARCH
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-heading font-bold mb-4 tracking-tighter">
            HOW IT WORKS
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground font-medium">
            Three simple steps to reunite with your belongings
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="text-center hover-lift border-2 shadow-modern-md hover:shadow-modern-xl transition-all">
            <CardContent className="pt-8 pb-8">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-modern-lg">
                <AlertCircle className="h-10 w-10 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-heading font-bold mb-3 tracking-tight">
                1. REPORT
              </h3>
              <p className="text-muted-foreground font-medium">
                Report your lost or found item with details and photo
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover-lift border-2 shadow-modern-md hover:shadow-modern-xl transition-all">
            <CardContent className="pt-8 pb-8">
              <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-modern-lg">
                <Search className="h-10 w-10 text-success-foreground" />
              </div>
              <h3 className="text-2xl font-heading font-bold mb-3 tracking-tight">
                2. MATCH
              </h3>
              <p className="text-muted-foreground font-medium">
                Our system automatically finds potential matches
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover-lift border-2 shadow-modern-md hover:shadow-modern-xl transition-all">
            <CardContent className="pt-8 pb-8">
              <div className="w-20 h-20 bg-foreground rounded-full flex items-center justify-center mx-auto mb-6 shadow-modern-lg">
                <CheckCircle2 className="h-10 w-10 text-background" />
              </div>
              <h3 className="text-2xl font-heading font-bold mb-3 tracking-tight">
                3. CONNECT
              </h3>
              <p className="text-muted-foreground font-medium">
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
