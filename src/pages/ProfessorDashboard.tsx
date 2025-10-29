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
import { GraduationCap, LogOut, Plus, Trophy } from "lucide-react";

const ProfessorDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");

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
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { title, description, prompt },
      });

      if (error) throw error;

      toast.success("Quiz created successfully!");
      setOpen(false);
      setTitle("");
      setDescription("");
      setPrompt("");
      loadQuizzes();
    } catch (error: any) {
      console.error("Quiz creation error:", error);
      toast.error(error.message || "Failed to create quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Professor Dashboard
            </h1>
          </div>
          <Button onClick={handleSignOut} variant="ghost" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">My Quizzes</h2>
            <p className="text-muted-foreground">Create and manage AI-generated quizzes</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" variant="hero">
                <Plus className="mr-2 h-5 w-5" />
                Create Quiz
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Quiz</DialogTitle>
                <DialogDescription>
                  Use AI to generate quiz questions based on your prompt
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateQuiz} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Introduction to Physics"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Brief description of the quiz"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt">AI Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe what topics the quiz should cover..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Generating..." : "Generate Quiz"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-medium transition-all duration-300 cursor-pointer" onClick={() => navigate(`/quiz/${quiz.id}/leaderboard`)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {quiz.title}
                  <Trophy className="h-5 w-5 text-accent ml-auto" />
                </CardTitle>
                <CardDescription>{quiz.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created {new Date(quiz.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
          {quizzes.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center mb-4">
                  No quizzes yet. Create your first AI-powered quiz!
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