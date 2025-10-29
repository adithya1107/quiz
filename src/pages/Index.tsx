import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap, Sparkles, Trophy, Zap } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              QuizMaster AI
            </span>
          </div>
          <Button onClick={() => navigate("/auth")} variant="outline">
            Sign In
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
              AI-Powered Quiz Creation & Learning
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Generate intelligent quizzes instantly with AI. Perfect for professors who create and students who learn.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="hero" onClick={() => navigate("/auth")}>
              <Sparkles className="mr-2 h-5 w-5" />
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Learn More
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-16">
            <div className="p-6 rounded-2xl bg-card border shadow-soft hover:shadow-medium transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Generation</h3>
              <p className="text-muted-foreground">
                Create comprehensive quizzes instantly using advanced AI technology
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border shadow-soft hover:shadow-medium transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4 mx-auto">
                <Zap className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Results</h3>
              <p className="text-muted-foreground">
                Get immediate feedback and track student performance in real-time
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border shadow-soft hover:shadow-medium transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 mx-auto">
                <Trophy className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Leaderboards</h3>
              <p className="text-muted-foreground">
                Motivate students with competitive leaderboards and achievement tracking
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;