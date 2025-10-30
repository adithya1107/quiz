import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BookOpen, LogOut, CheckCircle2, Clock, Target, Play, Eye } from "lucide-react";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (!user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadQuizzes();
      loadAttempts();
    }
  }, [user]);

  const loadQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error: any) {
      toast.error("Failed to load quizzes");
    }
  };

  const loadAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("student_id", user?.id);

      if (error) throw error;
      setAttempts(data || []);
    } catch (error: any) {
      console.error("Error loading attempts:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const hasAttempted = (quizId: string) => {
    return attempts.some((attempt) => attempt.quiz_id === quizId);
  };

  const getAttemptScore = (quizId: string) => {
    const attempt = attempts.find((a) => a.quiz_id === quizId);
    return attempt ? `${attempt.score}/${attempt.total_questions}` : null;
  };

  const getScorePercentage = (quizId: string) => {
    const attempt = attempts.find((a) => a.quiz_id === quizId);
    if (!attempt) return 0;
    return Math.round((attempt.score / attempt.total_questions) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-primary/5 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-20 shadow-colored-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center shadow-colored-sm">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient-hero">
                Student Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">Welcome back, {user?.user_metadata?.full_name || 'Student'}</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive transition-colors">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Stats Overview */}
        {attempts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold">Quizzes Completed</p>
                    <p className="text-3xl font-bold text-accent mt-1">{attempts.length}</p>
                  </div>
                  <Target className="h-12 w-12 text-accent/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold">Average Score</p>
                    <p className="text-3xl font-bold text-primary mt-1">
                      {Math.round(attempts.reduce((acc, a) => acc + (a.score / a.total_questions) * 100, 0) / attempts.length)}%
                    </p>
                  </div>
                  <CheckCircle2 className="h-12 w-12 text-primary/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold">Best Score</p>
                    <p className="text-3xl font-bold text-secondary mt-1">
                      {Math.max(...attempts.map(a => Math.round((a.score / a.total_questions) * 100)))}%
                    </p>
                  </div>
                  <CheckCircle2 className="h-12 w-12 text-secondary/60" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2 text-gradient-hero">Available Quizzes</h2>
          <p className="text-muted-foreground text-lg">Take quizzes and test your knowledge</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
            const attempted = hasAttempted(quiz.id);
            const score = getAttemptScore(quiz.id);
            const percentage = getScorePercentage(quiz.id);

            return (
              <Card
                key={quiz.id}
                className={`border-2 transition-all duration-300 ${
                  attempted 
                    ? "border-accent/30 bg-gradient-to-br from-accent/5 to-transparent" 
                    : "border-primary/10 hover:border-primary/30 card-hover cursor-pointer"
                }`}
                onClick={() => !attempted && navigate(`/quiz/${quiz.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl transition-colors">
                    <span className="flex-1">{quiz.title}</span>
                    {attempted && (
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                    )}
                  </CardTitle>
                  <CardDescription className="text-base">{quiz.description || "No description"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(quiz.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                  
                  {attempted && score && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-muted-foreground">Your Score</span>
                        <Badge 
                          variant="outline"
                          className={`font-semibold ${
                            percentage >= 90 ? 'border-accent text-accent bg-accent/10' :
                            percentage >= 70 ? 'border-primary text-primary bg-primary/10' :
                            percentage >= 50 ? 'border-secondary text-secondary bg-secondary/10' :
                            'border-destructive text-destructive bg-destructive/10'
                          }`}
                        >
                          {score} ({percentage}%)
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  {!attempted ? (
                    <Button 
                      className="w-full gradient-primary hover:scale-105 shadow-colored-sm hover:shadow-colored-md transition-all" 
                      onClick={() => navigate(`/quiz/${quiz.id}`)}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Take Quiz
                    </Button>
                  ) : (
                    <Button 
                      className="w-full gradient-accent hover:scale-105 shadow-colored-sm hover:shadow-colored-md transition-all" 
                      onClick={() => navigate(`/quiz/${quiz.id}/review`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Review Answers
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {quizzes.length === 0 && (
            <Card className="col-span-full border-2 border-dashed border-accent/20">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-10 w-10 text-accent" />
                </div>
                <p className="text-muted-foreground text-center text-lg mb-2">
                  No quizzes available yet
                </p>
                <p className="text-muted-foreground text-center text-sm">
                  Check back later for new quizzes!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;