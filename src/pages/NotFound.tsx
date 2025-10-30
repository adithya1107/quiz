import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="w-full max-w-2xl shadow-colored-xl border-2 border-primary/20 relative z-10 animate-fade-in">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-pulse">
                <AlertCircle className="h-16 w-16 text-primary" />
              </div>
            </div>
          </div>
          
          <h1 className="text-8xl font-bold mb-4 text-gradient-hero">404</h1>
          <h2 className="text-3xl font-bold mb-3">Page Not Found</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              size="lg"
              className="border-2 hover:border-primary/50 hover:shadow-colored-sm transition-all w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              size="lg"
              className="gradient-primary hover:scale-105 shadow-colored-md hover:shadow-colored-lg transition-all w-full sm:w-auto"
            >
              <Home className="mr-2 h-5 w-5" />
              Return Home
            </Button>
          </div>

          <div className="mt-12 p-6 bg-muted/30 rounded-xl border border-border/50">
            <p className="text-sm text-muted-foreground">
              If you believe this is an error, please contact support or try refreshing the page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;