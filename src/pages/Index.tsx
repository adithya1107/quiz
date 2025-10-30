import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap, Sparkles, Trophy, Zap, CheckCircle, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const userRole = session.user.user_metadata?.role || "student";
        navigate(userRole === "professor" ? "/professor" : "/student");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <header className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex items-center justify-between backdrop-blur-sm bg-card/50 rounded-2xl px-6 py-4 shadow-colored-md border border-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-colored-sm">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-gradient-hero">
              QuizMaster AI
            </span>
          </div>
          <Button onClick={() => navigate("/auth")} variant="outline" className="border-2 hover:border-primary/50 hover:shadow-colored-sm transition-all duration-300">
            Sign In
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center space-y-8 mb-20 animate-fade-in">
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold text-sm mb-4 animate-pulse">
                ✨ Powered by Advanced AI Technology
              </div>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight">
                <span className="text-gradient-hero block mb-2">AI-Powered</span>
                <span className="bg-gradient-to-r from-secondary via-accent to-primary bg-clip-text text-transparent">
                  Quiz Creation
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Generate intelligent quizzes instantly with AI. Perfect for professors who create and students who learn.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="h-14 px-8 text-lg font-semibold gradient-primary hover:scale-105 shadow-colored-lg hover:shadow-colored-xl transition-all duration-300"
              >
                <Sparkles className="mr-2 h-6 w-6" />
                Get Started Free
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate("/auth")}
                className="h-14 px-8 text-lg font-semibold border-2 hover:border-primary/50 hover:shadow-colored-md transition-all duration-300"
              >
                Learn More
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                <span>Free forever</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                <span>Setup in 2 minutes</span>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="group p-8 rounded-3xl bg-card border-2 border-primary/10 shadow-colored-md hover:shadow-colored-xl transition-all duration-300 hover:-translate-y-2 card-hover">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-colored-sm">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">AI Generation</h3>
              <p className="text-muted-foreground leading-relaxed">
                Create comprehensive quizzes instantly using advanced AI technology. Just describe your topic and let AI do the work.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-card border-2 border-secondary/10 shadow-colored-md hover:shadow-colored-xl transition-all duration-300 hover:-translate-y-2 card-hover">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-colored-sm">
                <Zap className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Instant Results</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get immediate feedback and track student performance in real-time with detailed analytics and insights.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-card border-2 border-accent/10 shadow-colored-md hover:shadow-colored-xl transition-all duration-300 hover:-translate-y-2 card-hover">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-colored-sm">
                <Trophy className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Leaderboards</h3>
              <p className="text-muted-foreground leading-relaxed">
                Motivate students with competitive leaderboards and achievement tracking. Make learning fun and engaging.
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-24 p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 border-2 border-primary/20 shadow-colored-xl">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-5xl font-bold text-gradient-hero">100%</div>
                <div className="text-muted-foreground font-medium">AI-Powered</div>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-bold text-gradient-hero">
                  <TrendingUp className="inline h-12 w-12" />
                </div>
                <div className="text-muted-foreground font-medium">Smart Analytics</div>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-bold text-gradient-hero">∞</div>
                <div className="text-muted-foreground font-medium">Unlimited Quizzes</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground relative z-10">
        <p className="text-sm">© 2025 QuizMaster AI. Built by MIT students.</p>
      </footer>
    </div>
  );
};

export default Index;