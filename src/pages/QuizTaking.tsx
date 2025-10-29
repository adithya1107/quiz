import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle } from "lucide-react";

const QuizTaking = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
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
    if (quizId) {
      loadQuiz();
      loadQuestions();
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

      const { error } = await supabase.from("quiz_attempts").upsert({
        quiz_id: quizId,
        student_id: user?.id,
        score,
        total_questions: questions.length,
        answers,
      });

      if (error) throw error;

      toast.success(`Quiz submitted! You scored ${score}/${questions.length}`);
      navigate("/student");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit quiz");
    } finally {
      setLoading(false);
    }
  };

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading quiz...</p>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="container mx-auto max-w-3xl py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/student")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="shadow-strong">
          <CardHeader>
            <CardTitle>{quiz.title}</CardTitle>
            <CardDescription>
              Question {currentQuestion + 1} of {questions.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">{question.question_text}</h3>
              <RadioGroup
                value={selectedAnswers[currentQuestion]}
                onValueChange={handleAnswerSelect}
              >
                {question.options.map((option: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/5 transition-colors"
                  >
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="cursor-pointer flex-1">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>

              <div className="flex gap-2">
                {questions.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      index === currentQuestion
                        ? "bg-primary"
                        : selectedAnswers[index]
                        ? "bg-accent"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              {currentQuestion < questions.length - 1 ? (
                <Button onClick={handleNext}>Next</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading} variant="hero">
                  <CheckCircle className="mr-2 h-4 w-4" />
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