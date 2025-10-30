import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, Trophy, Medal, Award, Users, Target, TrendingUp, Download, Crown, Sparkles } from "lucide-react";

interface AttemptWithProfile {
  id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  student_name: string;
  student_email: string;
}

const Leaderboard = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [attempts, setAttempts] = useState<AttemptWithProfile[]>([]);

  useEffect(() => {
    if (quizId) {
      loadQuiz();
      loadAttempts();
    }
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();

      if (error) throw error;
      setQuiz(data);
    } catch (error: any) {
      toast.error("Failed to load quiz");
    }
  };

  const loadAttempts = async () => {
    try {
      // Get all attempts for this quiz
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", quizId)
        .order("score", { ascending: false });

      if (attemptsError) throw attemptsError;

      // For each attempt, get the user's auth data to retrieve their name
      const attemptsWithNames = await Promise.all(
        (attemptsData || []).map(async (attempt) => {
          // Get user data from auth.users through RPC or by getting current session
          // Since we can't use admin API, we'll use the student_id to fetch from a profiles table
          // OR we can use the auth metadata that was stored during signup
          
          // Try to get user info - this will work for the current user
          const { data: { user } } = await supabase.auth.getUser();
          
          let studentName = "Student";
          let studentEmail = "N/A";
          
          // If this attempt belongs to current user, we can get their info
          if (user && user.id === attempt.student_id) {
            studentName = user.user_metadata?.full_name || "Student";
            studentEmail = user.email || "N/A";
          } else {
            // For other users, we need to store names in the quiz_attempts table
            // or create a public profiles table
            // For now, we'll create a workaround using the database
            
            // Let's try to get from a profile or use a database function
            try {
              const { data: profileData, error: profileError } = await supabase
                .rpc('get_user_profile', { user_id: attempt.student_id });
              
              if (profileData) {
                studentName = profileData.full_name || "Student";
                studentEmail = profileData.email || "N/A";
              }
            } catch (err) {
              // RPC doesn't exist, use stored data from attempt if available
              studentName = attempt.student_name || "Student";
              studentEmail = attempt.student_email || "N/A";
            }
          }

          return {
            id: attempt.id,
            score: attempt.score,
            total_questions: attempt.total_questions,
            completed_at: attempt.completed_at,
            student_name: studentName,
            student_email: studentEmail
          };
        })
      );

      setAttempts(attemptsWithNames);
    } catch (error: any) {
      console.error("Error loading attempts:", error);
      toast.error("Failed to load leaderboard");
    }
  };

  const getStats = () => {
    if (attempts.length === 0) return { average: 0, highest: 0, lowest: 0 };
    
    const scores = attempts.map(a => (a.score / a.total_questions) * 100);
    return {
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      highest: Math.round(Math.max(...scores)),
      lowest: Math.round(Math.min(...scores))
    };
  };

  const stats = getStats();

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <Medal className="h-6 w-6 text-amber-700" />;
    return null;
  };

  const downloadCSV = () => {
    const headers = ['Rank', 'Student Name', 'Email', 'Score', 'Percentage', 'Completed Date'];
    const rows = attempts.map((attempt, index) => {
      const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
      return [
        index + 1,
        attempt.student_name,
        attempt.student_email,
        `${attempt.score}/${attempt.total_questions}`,
        `${percentage}%`,
        new Date(attempt.completed_at).toLocaleDateString()
      ];
    });
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quiz.title}-leaderboard.csv`;
    a.click();
    toast.success("Leaderboard exported successfully!");
  };

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 md:p-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/professor")}
          className="mb-6 hover:bg-primary/10 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-sm bg-card/50 p-6 rounded-3xl border-2 border-primary/10 shadow-colored-lg">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold flex items-center gap-3 text-gradient-hero">
                <Trophy className="h-10 w-10 text-primary" />
                {quiz.title}
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">Quiz Performance & Rankings</p>
            </div>
            {attempts.length > 0 && (
              <Button onClick={downloadCSV} variant="outline" className="gap-2 border-2 hover:border-primary/50 shadow-colored-sm hover:shadow-colored-md transition-all">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          {attempts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-semibold">Total Students</p>
                      <p className="text-3xl font-bold text-primary mt-1">{attempts.length}</p>
                    </div>
                    <Users className="h-10 w-10 text-primary/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-transparent card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-semibold">Average Score</p>
                      <p className="text-3xl font-bold text-accent mt-1">{stats.average}%</p>
                    </div>
                    <Target className="h-10 w-10 text-accent/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-semibold">Highest Score</p>
                      <p className="text-3xl font-bold text-secondary mt-1">{stats.highest}%</p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-secondary/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-muted card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-semibold">Lowest Score</p>
                      <p className="text-3xl font-bold mt-1">{stats.lowest}%</p>
                    </div>
                    <Award className="h-10 w-10 text-muted-foreground/60" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top 3 Podium */}
          {attempts.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 items-end">
              {/* 2nd Place */}
              <Card className="border-2 border-gray-400/50 shadow-colored-lg animate-fade-in card-hover" style={{ animationDelay: '0.1s' }}>
                <CardContent className="pt-6 text-center">
                  <Medal className="h-14 w-14 text-gray-400 mx-auto mb-3" />
                  <Badge variant="outline" className="mb-3 border-gray-400 text-gray-700 text-sm">2nd Place</Badge>
                  <p className="font-bold text-lg">{attempts[1]?.student_name}</p>
                  <p className="text-sm text-muted-foreground mb-3 truncate">{attempts[1]?.student_email}</p>
                  <div className="mt-3 p-4 bg-gradient-to-br from-gray-400/10 to-transparent rounded-xl border border-gray-400/20">
                    <p className="text-3xl font-bold">
                      {Math.round((attempts[1]?.score / attempts[1]?.total_questions) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {attempts[1]?.score}/{attempts[1]?.total_questions} correct
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 1st Place */}
              <Card className="border-2 border-yellow-500/50 shadow-colored-xl scale-105 animate-fade-in relative overflow-hidden card-hover">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-amber-500/10" />
                <CardContent className="pt-6 text-center relative">
                  <Crown className="h-10 w-10 text-yellow-500 mx-auto mb-2 animate-pulse" />
                  <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-3" />
                  <Badge className="mb-3 bg-gradient-to-r from-yellow-500 to-amber-500 border-0 text-white shadow-colored-md">
                    <Sparkles className="h-3 w-3 mr-1" />
                    1st Place
                  </Badge>
                  <p className="font-bold text-xl">{attempts[0]?.student_name}</p>
                  <p className="text-sm text-muted-foreground mb-3 truncate">{attempts[0]?.student_email}</p>
                  <div className="mt-3 p-5 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-xl border-2 border-yellow-500/30 shadow-colored-sm">
                    <p className="text-4xl font-bold text-yellow-600">
                      {Math.round((attempts[0]?.score / attempts[0]?.total_questions) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {attempts[0]?.score}/{attempts[0]?.total_questions} correct
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 3rd Place */}
              <Card className="border-2 border-amber-700/50 shadow-colored-lg animate-fade-in card-hover" style={{ animationDelay: '0.2s' }}>
                <CardContent className="pt-6 text-center">
                  <Medal className="h-14 w-14 text-amber-700 mx-auto mb-3" />
                  <Badge variant="outline" className="mb-3 border-amber-700 text-amber-800 text-sm">3rd Place</Badge>
                  <p className="font-bold text-lg">{attempts[2]?.student_name}</p>
                  <p className="text-sm text-muted-foreground mb-3 truncate">{attempts[2]?.student_email}</p>
                  <div className="mt-3 p-4 bg-gradient-to-br from-amber-700/10 to-transparent rounded-xl border border-amber-700/20">
                    <p className="text-3xl font-bold">
                      {Math.round((attempts[2]?.score / attempts[2]?.total_questions) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {attempts[2]?.score}/{attempts[2]?.total_questions} correct
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Full Leaderboard Table */}
          <Card className="shadow-colored-lg border-2 border-primary/10">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b-2">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Award className="h-6 w-6 text-primary" />
                Complete Rankings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {attempts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Users className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground text-xl font-semibold">No one has taken this quiz yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">Share the quiz link to get students started!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2">
                        <TableHead className="w-24 font-bold">Rank</TableHead>
                        <TableHead className="font-bold">Student</TableHead>
                        <TableHead className="text-center font-bold">Score</TableHead>
                        <TableHead className="text-center font-bold">Performance</TableHead>
                        <TableHead className="text-right font-bold">Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attempts.map((attempt, index) => {
                        const percentage = Math.round(
                          (attempt.score / attempt.total_questions) * 100
                        );
                        
                        return (
                          <TableRow 
                            key={attempt.id} 
                            className={`
                              ${index < 3 ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'}
                              transition-colors border-b
                            `}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {getRankIcon(index)}
                                <span className="font-bold text-xl">{index + 1}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-colored-sm">
                                  {attempt.student_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-base">
                                    {attempt.student_name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {attempt.student_email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="font-bold text-xl">
                                {attempt.score} <span className="text-muted-foreground font-normal">/ {attempt.total_questions}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                  <Progress value={percentage} className="flex-1 h-3" />
                                  <span className="font-bold text-base min-w-[3.5rem] text-right">
                                    {percentage}%
                                  </span>
                                </div>
                                <Badge 
                                  variant="outline"
                                  className={`
                                    text-xs font-semibold
                                    ${percentage >= 90 ? 'border-accent text-accent bg-accent/10' : ''}
                                    ${percentage >= 70 && percentage < 90 ? 'border-primary text-primary bg-primary/10' : ''}
                                    ${percentage >= 50 && percentage < 70 ? 'border-secondary text-secondary bg-secondary/10' : ''}
                                    ${percentage < 50 ? 'border-destructive text-destructive bg-destructive/10' : ''}
                                  `}
                                >
                                  {percentage >= 90 ? 'Excellent' : percentage >= 70 ? 'Good' : percentage >= 50 ? 'Average' : 'Needs Improvement'}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {new Date(attempt.completed_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;