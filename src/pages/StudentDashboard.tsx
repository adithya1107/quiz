import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BookOpen, LogOut, CheckCircle2 } from "lucide-react";

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
        .select("*");

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-accent" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Student Dashboard
            </h1>
          </div>
          <Button onClick={handleSignOut} variant="ghost" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Available Quizzes</h2>
          <p className="text-muted-foreground">Take quizzes and test your knowledge</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
            const attempted = hasAttempted(quiz.id);
            const score = getAttemptScore(quiz.id);

            return (
              <Card
                key={quiz.id}
                className={`hover:shadow-medium transition-all duration-300 cursor-pointer ${
                  attempted ? "border-accent/50" : ""
                }`}
                onClick={() => navigate(`/quiz/${quiz.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {quiz.title}
                    {attempted && <CheckCircle2 className="h-5 w-5 text-accent ml-auto" />}
                  </CardTitle>
                  <CardDescription>{quiz.description || "No description"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </p>
                    {attempted && score && (
                      <p className="text-sm font-semibold text-accent">Score: {score}</p>
                    )}
                  </div>
                  {!attempted && (
                    <Button className="w-full mt-4" variant="secondary">
                      Take Quiz
                    </Button>
                  )}
                  {attempted && (
                    <Button className="w-full mt-4" variant="outline">
                      Retake Quiz
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {quizzes.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">
                  No quizzes available yet. Check back later!
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