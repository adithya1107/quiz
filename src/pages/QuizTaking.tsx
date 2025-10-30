import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

const QuizTaking = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);

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
      checkExistingAttempt();
      loadQuiz();
      loadQuestions();
    }
  }, [quizId, user]);

  const checkExistingAttempt = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", quizId)
        .eq("student_id", user?.id)
        .single();

      if (data) {
        setAlreadyAttempted(true);
        toast.error("You have already taken this quiz!");
        navigate(`/quiz/${quizId}/review`);
      }
    } catch (error: any) {
      // No existing attempt found, user can proceed
      setAlreadyAttempted(false);
    }
  };

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

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: answer,
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    // Final confirmation
    if (!confirm("Are you sure you want to submit? You can only take this quiz once!")) {
      return;
    }

    setLoading(true);

    try {
      let score = 0;
      const answers = questions.map((q, index) => {
        const isCorrect = selectedAnswers[index] === q.correct_answer;
        if (isCorrect) score++;
        return {
          question_id: q.id,
          selected_answer: selectedAnswers[index],
          correct: isCorrect,
        };
      });

      // Store student name and email along with the attempt
      const { error } = await supabase.from("quiz_attempts").insert({
        quiz_id: quizId,
        student_id: user?.id,
        score,
        total_questions: questions.length,
        answers,
        student_name: user?.user_metadata?.full_name || "Student",
        student_email: user?.email || "N/A"
      });

      if (error) throw error;

      toast.success(`Quiz submitted! You scored ${score}/${questions.length}`);
      navigate(`/quiz/${quizId}/review`);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit quiz");
    } finally {
      setLoading(false);
    }
  };

  if (alreadyAttempted) {
    return null; // Will redirect in useEffect
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Loading quiz...</p>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(selectedAnswers).length;

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
          onClick={() => {
            if (confirm("Are you sure you want to leave? Your progress will be lost.")) {
              navigate("/student");
            }
          }}
          className="mb-6 hover:bg-primary/10 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Warning Banner */}
        <Card className="mb-6 border-2 border-secondary/50 bg-gradient-to-r from-secondary/10 to-accent/10 shadow-colored-md">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-secondary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-lg mb-1">Important Notice</h3>
                <p className="text-sm text-muted-foreground">
                  You can only take this quiz <span className="font-bold text-foreground">once</span>. 
                  Make sure to review your answers carefully before submitting!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Header */}
        <Card className="mb-6 border-2 border-primary/20 shadow-colored-md">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gradient-hero">{quiz.title}</h2>
                  <p className="text-muted-foreground mt-1">
                    Question {currentQuestion + 1} of {questions.length}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">Progress</div>
                  <div className="text-2xl font-bold text-primary">{Math.round(progress)}%</div>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Answered: {answeredCount}/{questions.length}
                </span>
                <span className="text-muted-foreground">
                  Remaining: {questions.length - answeredCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card className="shadow-colored-lg border-2 border-primary/10">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
            <CardTitle className="text-xl md:text-2xl">{question.question_text}</CardTitle>
            <CardDescription className="text-base">Select the correct answer</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 pb-8 space-y-6">
            <RadioGroup
              value={selectedAnswers[currentQuestion]}
              onValueChange={handleAnswerSelect}
              className="space-y-4"
            >
              {question.options.map((option: string, index: number) => (
                <div
                  key={index}
                  className={`flex items-start space-x-4 p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer group ${
                    selectedAnswers[currentQuestion] === option
                      ? "border-primary bg-primary/10 shadow-colored-sm"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <RadioGroupItem 
                    value={option} 
                    id={`option-${index}`}
                    className="mt-1"
                  />
                  <Label 
                    htmlFor={`option-${index}`} 
                    className="cursor-pointer flex-1 text-base leading-relaxed font-medium"
                  >
                    {option}
                  </Label>
                  {selectedAnswers[currentQuestion] === option && (
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  )}
                </div>
              ))}
            </RadioGroup>

            {/* Question Navigation Dots */}
            <div className="flex justify-center gap-2 pt-6">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`h-3 w-3 rounded-full transition-all duration-300 ${
                    index === currentQuestion
                      ? "bg-primary scale-125 shadow-colored-sm"
                      : selectedAnswers[index]
                      ? "bg-accent hover:scale-110"
                      : "bg-muted hover:bg-muted-foreground/30 hover:scale-110"
                  }`}
                  aria-label={`Go to question ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 gap-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="border-2 hover:border-primary/50 transition-all"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentQuestion < questions.length - 1 ? (
                <Button 
                  onClick={handleNext}
                  className="gradient-primary hover:scale-105 shadow-colored-sm hover:shadow-colored-md transition-all"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || Object.keys(selectedAnswers).length < questions.length} 
                  className="gradient-accent hover:scale-105 shadow-colored-md hover:shadow-colored-lg transition-all px-8"
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  {loading ? "Submitting..." : "Submit Quiz"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuizTaking;