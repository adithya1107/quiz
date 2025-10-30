import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { GraduationCap, LogOut, Plus, Trophy, Sparkles, Clock, Edit, Trash2 } from "lucide-react";

const ProfessorDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [lastCreateTime, setLastCreateTime] = useState<number>(0);
  const COOLDOWN_MS = 10000;

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = Date.now();
    const timeSinceLastCreate = now - lastCreateTime;
    if (timeSinceLastCreate < COOLDOWN_MS) {
      const waitSeconds = Math.ceil((COOLDOWN_MS - timeSinceLastCreate) / 1000);
      toast.error(`Please wait ${waitSeconds} more second${waitSeconds !== 1 ? 's' : ''} before creating another quiz.`);
      return;
    }
    
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { title, description, prompt },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      setLastCreateTime(now);
      toast.success("Quiz created successfully!");
      setOpen(false);
      setTitle("");
      setDescription("");
      setPrompt("");
      loadQuizzes();
    } catch (error: any) {
      console.error("Quiz creation error:", error);
      
      const errorMessage = error?.message || "";
      const errorName = error?.name || "";
      
      if (errorName === "FunctionsHttpError" || errorMessage.includes("non-2xx status code")) {
        toast.error("Service is temporarily busy. Please wait a moment and try again.", {
          duration: 5000,
        });
      } else if (errorMessage.includes("Rate limit") || errorMessage.includes("429")) {
        toast.error("Too many requests. Please wait before creating another quiz.", {
          duration: 5000,
        });
      } else if (errorMessage.includes("timeout")) {
        toast.error("Request timed out. Please try again.", {
          duration: 5000,
        });
      } else {
        toast.error(errorMessage || "Failed to create quiz. Please try again.", {
          duration: 5000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this quiz? This will delete all questions and student attempts. This action cannot be undone.")) {
      return;
    }

    try {
      // Delete quiz attempts first
      const { error: attemptsError } = await supabase
        .from("quiz_attempts")
        .delete()
        .eq("quiz_id", quizId);

      if (attemptsError) {
        console.error("Error deleting attempts:", attemptsError);
        // Continue anyway as there might not be any attempts
      }

      // Delete questions
      const { error: questionsError } = await supabase
        .from("questions")
        .delete()
        .eq("quiz_id", quizId);

      if (questionsError) {
        console.error("Error deleting questions:", questionsError);
        throw questionsError;
      }

      // Delete quiz
      const { error: quizError } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", quizId);

      if (quizError) {
        console.error("Error deleting quiz:", quizError);
        throw quizError;
      }

      toast.success("Quiz deleted successfully!");
      loadQuizzes();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete quiz: " + error.message);
    }
  };

  const handleEditClick = (quizId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/quiz/${quizId}/edit`);
  };

  const handleLeaderboardClick = (quizId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/quiz/${quizId}/leaderboard`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-20 shadow-colored-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-colored-sm">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient-hero">
                Professor Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">Welcome back, {user?.user_metadata?.full_name || 'Professor'}</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive transition-colors">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-4xl font-bold mb-2 text-gradient-hero">My Quizzes</h2>
            <p className="text-muted-foreground text-lg">Create and manage AI-generated quizzes</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gradient-primary hover:scale-105 shadow-colored-md hover:shadow-colored-lg transition-all duration-300 h-12 px-6">
                <Plus className="mr-2 h-5 w-5" />
                <span className="font-semibold">Create Quiz</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] bg-white border-2 border-primary/10">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  Create New Quiz
                </DialogTitle>
                <DialogDescription className="text-base">
                  Use AI to generate quiz questions based on your prompt
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateQuiz} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold">Quiz Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Introduction to Physics"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 border-2 focus:border-primary/50 transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Brief description of the quiz"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-11 border-2 focus:border-primary/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-sm font-semibold">AI Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe what topics the quiz should cover..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={5}
                    className="border-2 focus:border-primary/50 transition-all resize-none"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-12 gradient-primary hover:scale-105 transition-all font-semibold" disabled={loading}>
                  {loading ? (
                    <>
                      <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Quiz
                    </>
                  )}
                </Button>
                {lastCreateTime > 0 && (
                  <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    Please wait at least 10 seconds between quiz creations
                  </p>
                )}
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card 
              key={quiz.id} 
              className="border-2 border-primary/10 hover:border-primary/30 transition-all duration-300 shadow-colored-md hover:shadow-colored-lg" 
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl transition-colors">
                  <span className="flex-1">{quiz.title}</span>
                  <Trophy className="h-5 w-5 text-accent" />
                </CardTitle>
                <CardDescription className="text-base">{quiz.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Created {new Date(quiz.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}</span>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={(e) => handleEditClick(quiz.id, e)}
                    className="flex-1 gradient-secondary hover:scale-105 shadow-colored-sm transition-all"
                    size="sm"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    onClick={(e) => handleLeaderboardClick(quiz.id, e)}
                    className="flex-1 gradient-accent hover:scale-105 shadow-colored-sm transition-all"
                    size="sm"
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </div>
                
                <Button 
                  onClick={(e) => handleDeleteQuiz(quiz.id, e)}
                  variant="outline"
                  className="w-full border-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all"
                  size="sm"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Quiz
                </Button>
              </CardContent>
            </Card>
          ))}
          {quizzes.length === 0 && (
            <Card className="col-span-full border-2 border-dashed border-primary/20">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <p className="text-muted-foreground text-center text-lg mb-2">
                  No quizzes yet
                </p>
                <p className="text-muted-foreground text-center text-sm">
                  Create your first AI-powered quiz to get started!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfessorDashboard;