import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, XCircle, Award } from "lucide-react";

const QuizReview = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [attempt, setAttempt] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (!user) {
        navigate("/auth");
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (quizId && user) {
      loadQuiz();
      loadQuestions();
      loadAttempt();
    }
  }, [quizId, user]);

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

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_number");

      if (error) throw error;
      setQuestions(data || []);
    } catch (error: any) {
      toast.error("Failed to load questions");
    }
  };

  const loadAttempt = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", quizId)
        .eq("student_id", user?.id)
        .single();

      if (error) throw error;
      setAttempt(data);
    } catch (error: any) {
      toast.error("Failed to load your attempt");
      navigate("/student");
    }
  };

  if (!quiz || !attempt || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Loading review...</p>
        </div>
      </div>
    );
  }

  const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
  const answersMap = attempt.answers.reduce((acc: any, ans: any) => {
    acc[ans.question_id] = ans;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-accent/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto max-w-4xl py-8 relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/student")}
          className="mb-6 hover:bg-primary/10 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Results Summary */}
        <Card className="mb-6 border-2 border-primary/20 shadow-colored-lg">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gradient-hero">{quiz.title}</h2>
                  <p className="text-muted-foreground mt-1">Review your answers and see what you got right</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-4xl font-bold text-primary">{percentage}%</div>
                  <div className="text-sm text-muted-foreground">
                    {attempt.score}/{attempt.total_questions} correct
                  </div>
                </div>
              </div>
              <Progress value={percentage} className="h-3" />
              <Badge 
                variant="outline"
                className={`text-sm font-semibold ${
                  percentage >= 90 ? 'border-accent text-accent bg-accent/10' :
                  percentage >= 70 ? 'border-primary text-primary bg-primary/10' :
                  percentage >= 50 ? 'border-secondary text-secondary bg-secondary/10' :
                  'border-destructive text-destructive bg-destructive/10'
                }`}
              >
                {percentage >= 90 ? 'Excellent!' : percentage >= 70 ? 'Good Job!' : percentage >= 50 ? 'Keep Practicing' : 'Needs Improvement'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Questions Review */}
        <div className="space-y-6">
          {questions.map((question, index) => {
            const userAnswer = answersMap[question.id];
            const isCorrect = userAnswer?.correct;
            
            return (
              <Card 
                key={question.id} 
                className={`border-2 shadow-colored-md ${
                  isCorrect 
                    ? 'border-accent/30 bg-gradient-to-br from-accent/5 to-transparent' 
                    : 'border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent'
                }`}
              >
                <CardHeader className={`border-b ${
                  isCorrect ? 'bg-accent/5' : 'bg-destructive/5'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <span className="text-muted-foreground">Q{index + 1}.</span>
                        {question.question_text}
                      </CardTitle>
                    </div>
                    <div className="flex-shrink-0">
                      {isCorrect ? (
                        <div className="flex items-center gap-2 text-accent">
                          <CheckCircle className="h-6 w-6" />
                          <span className="font-semibold">Correct</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-destructive">
                          <XCircle className="h-6 w-6" />
                          <span className="font-semibold">Incorrect</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Options */}
                  <div className="space-y-3">
                    {question.options.map((option: string, optIndex: number) => {
                      const isUserAnswer = userAnswer?.selected_answer === option;
                      const isCorrectAnswer = option === question.correct_answer;
                      
                      return (
                        <div
                          key={optIndex}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            isCorrectAnswer
                              ? 'border-accent bg-accent/10'
                              : isUserAnswer && !isCorrect
                              ? 'border-destructive bg-destructive/10'
                              : 'border-border bg-muted/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-sm min-w-[24px]">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <span className="flex-1">{option}</span>
                            <div className="flex items-center gap-2">
                              {isCorrectAnswer && (
                                <Badge className="bg-accent text-white border-0">
                                  Correct Answer
                                </Badge>
                              )}
                              {isUserAnswer && !isCorrect && (
                                <Badge variant="outline" className="border-destructive text-destructive bg-destructive/10">
                                  Your Answer
                                </Badge>
                              )}
                              {isUserAnswer && isCorrect && (
                                <Badge variant="outline" className="border-accent text-accent bg-accent/10">
                                  Your Answer
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation for incorrect answers */}
                  {!isCorrect && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-xl border-2 border-muted">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Note: </span>
                        You selected "{userAnswer?.selected_answer}", but the correct answer is "{question.correct_answer}".
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Final Summary */}
        <Card className="mt-8 border-2 border-primary/20 shadow-colored-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">Quiz Summary</h3>
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="p-4 bg-accent/10 rounded-xl border-2 border-accent/20">
                  <div className="text-3xl font-bold text-accent">{attempt.score}</div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div className="p-4 bg-destructive/10 rounded-xl border-2 border-destructive/20">
                  <div className="text-3xl font-bold text-destructive">
                    {attempt.total_questions - attempt.score}
                  </div>
                  <div className="text-sm text-muted-foreground">Incorrect</div>
                </div>
                <div className="p-4 bg-primary/10 rounded-xl border-2 border-primary/20">
                  <div className="text-3xl font-bold text-primary">{percentage}%</div>
                  <div className="text-sm text-muted-foreground">Score</div>
                </div>
              </div>
              <p className="text-muted-foreground">
                Completed on {new Date(attempt.completed_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuizReview;