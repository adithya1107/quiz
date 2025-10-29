import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, Trophy, Medal, Award, Users, Target, TrendingUp, Download, Crown } from "lucide-react";

const Leaderboard = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);

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
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select(`
          *,
          profiles:student_id (
            full_name,
            email
          )
        `)
        .eq("quiz_id", quizId)
        .order("score", { ascending: false });

      if (error) throw error;
      setAttempts(data || []);
    } catch (error: any) {
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
        attempt.profiles?.full_name || 'Anonymous',
        attempt.profiles?.email || 'N/A',
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/professor")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                <Trophy className="h-8 w-8 text-primary" />
                {quiz.title}
              </h1>
              <p className="text-muted-foreground mt-2">Quiz Performance & Rankings</p>
            </div>
            {attempts.length > 0 && (
              <Button onClick={downloadCSV} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          {attempts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Students</p>
                      <p className="text-2xl font-bold text-primary">{attempts.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-accent/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Average Score</p>
                      <p className="text-2xl font-bold text-accent">{stats.average}%</p>
                    </div>
                    <Target className="h-8 w-8 text-accent/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-secondary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Highest Score</p>
                      <p className="text-2xl font-bold text-secondary">{stats.highest}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-secondary/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-muted">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Lowest Score</p>
                      <p className="text-2xl font-bold">{stats.lowest}%</p>
                    </div>
                    <Award className="h-8 w-8 text-muted-foreground/60" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top 3 Podium */}
          {attempts.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 items-end">
              {/* 2nd Place */}
              <Card className="border-2 border-gray-400/50 shadow-lg animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <CardContent className="pt-6 text-center">
                  <Medal className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <Badge variant="outline" className="mb-3 border-gray-400 text-gray-700">2nd Place</Badge>
                  <p className="font-semibold text-lg">{attempts[1]?.profiles?.full_name || "Anonymous"}</p>
                  <p className="text-sm text-muted-foreground mb-2">{attempts[1]?.profiles?.email}</p>
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">
                      {Math.round((attempts[1]?.score / attempts[1]?.total_questions) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attempts[1]?.score}/{attempts[1]?.total_questions} correct
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 1st Place */}
              <Card className="border-2 border-yellow-500/50 shadow-xl scale-105 animate-fade-in relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-amber-500/10" />
                <CardContent className="pt-6 text-center relative">
                  <Crown className="h-8 w-8 text-yellow-500 mx-auto mb-1 animate-pulse" />
                  <Trophy className="h-14 w-14 text-yellow-500 mx-auto mb-2" />
                  <Badge className="mb-3 bg-gradient-to-r from-yellow-500 to-amber-500 border-0">1st Place</Badge>
                  <p className="font-bold text-xl">{attempts[0]?.profiles?.full_name || "Anonymous"}</p>
                  <p className="text-sm text-muted-foreground mb-2">{attempts[0]?.profiles?.email}</p>
                  <div className="mt-3 p-4 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-lg">
                    <p className="text-3xl font-bold text-yellow-600">
                      {Math.round((attempts[0]?.score / attempts[0]?.total_questions) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attempts[0]?.score}/{attempts[0]?.total_questions} correct
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 3rd Place */}
              <Card className="border-2 border-amber-700/50 shadow-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <CardContent className="pt-6 text-center">
                  <Medal className="h-12 w-12 text-amber-700 mx-auto mb-2" />
                  <Badge variant="outline" className="mb-3 border-amber-700 text-amber-800">3rd Place</Badge>
                  <p className="font-semibold text-lg">{attempts[2]?.profiles?.full_name || "Anonymous"}</p>
                  <p className="text-sm text-muted-foreground mb-2">{attempts[2]?.profiles?.email}</p>
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">
                      {Math.round((attempts[2]?.score / attempts[2]?.total_questions) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attempts[2]?.score}/{attempts[2]?.total_questions} correct
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Full Leaderboard Table */}
          <Card className="shadow-strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Complete Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attempts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No one has taken this quiz yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">Share the quiz link to get students started!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Rank</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead className="text-center">Performance</TableHead>
                        <TableHead className="text-right">Completed</TableHead>
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
                              ${index < 3 ? 'bg-primary/5' : ''}
                              hover:bg-muted/50 transition-colors
                            `}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getRankIcon(index)}
                                <span className="font-bold text-lg">{index + 1}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                                  {(attempt.profiles?.full_name || "A").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold">
                                    {attempt.profiles?.full_name || "Anonymous"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {attempt.profiles?.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="font-semibold text-lg">
                                {attempt.score} <span className="text-muted-foreground">/ {attempt.total_questions}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <Progress value={percentage} className="flex-1" />
                                  <span className="font-semibold text-sm min-w-[3rem] text-right">
                                    {percentage}%
                                  </span>
                                </div>
                                <Badge 
                                  variant="outline"
                                  className={`
                                    text-xs
                                    ${percentage >= 90 ? 'border-accent text-accent' : ''}
                                    ${percentage >= 70 && percentage < 90 ? 'border-primary text-primary' : ''}
                                    ${percentage >= 50 && percentage < 70 ? 'border-secondary text-secondary' : ''}
                                    ${percentage < 50 ? 'border-destructive text-destructive' : ''}
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