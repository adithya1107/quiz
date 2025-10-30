import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ArrowLeft, Save, Plus, Trash2, Edit } from "lucide-react";

const QuizEdit = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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

  const handleUpdateQuestion = async (index: number) => {
    setLoading(true);
    try {
      const question = questions[index];
      const { error } = await supabase
        .from("questions")
        .update({
          question_text: question.question_text,
          options: question.options,
          correct_answer: question.correct_answer,
        })
        .eq("id", question.id);

      if (error) throw error;
      toast.success("Question updated successfully!");
      setEditingIndex(null);
    } catch (error: any) {
      toast.error("Failed to update question");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string, index: number) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId);

      if (error) throw error;

      toast.success("Question deleted successfully!");
      setQuestions(questions.filter((_, i) => i !== index));
    } catch (error: any) {
      toast.error("Failed to delete question");
    }
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    const newOptions = [...updated[questionIndex].options];
    newOptions[optionIndex] = value;
    updated[questionIndex] = { ...updated[questionIndex], options: newOptions };
    setQuestions(updated);
  };

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Loading quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-secondary/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto max-w-5xl py-8 relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/professor")}
          className="mb-6 hover:bg-primary/10 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="mb-6 border-2 border-primary/20 shadow-colored-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
            <CardTitle className="text-3xl text-gradient-hero">
              Edit Quiz: {quiz.title}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Modify questions, answers, and options below
            </p>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          {questions.map((question, index) => (
            <Card key={question.id} className="border-2 border-primary/10 shadow-colored-md">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Question {index + 1}</CardTitle>
                  <div className="flex gap-2">
                    {editingIndex === index ? (
                      <Button
                        onClick={() => handleUpdateQuestion(index)}
                        disabled={loading}
                        className="gradient-primary hover:scale-105 transition-all"
                        size="sm"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setEditingIndex(index)}
                        variant="outline"
                        className="border-2 hover:border-primary/50"
                        size="sm"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDeleteQuestion(question.id, index)}
                      variant="outline"
                      className="border-2 border-destructive/20 text-destructive hover:bg-destructive/10"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Question Text */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Question Text</Label>
                  {editingIndex === index ? (
                    <Textarea
                      value={question.question_text}
                      onChange={(e) => updateQuestion(index, "question_text", e.target.value)}
                      className="border-2 focus:border-primary/50 transition-all"
                      rows={3}
                    />
                  ) : (
                    <p className="p-4 bg-muted/30 rounded-xl border text-base">
                      {question.question_text}
                    </p>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Answer Options</Label>
                  {editingIndex === index ? (
                    <div className="space-y-3">
                      {question.options.map((option: string, optIndex: number) => (
                        <div key={optIndex} className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-muted-foreground min-w-[20px]">
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          <Input
                            value={option}
                            onChange={(e) => updateOption(index, optIndex, e.target.value)}
                            className="border-2 focus:border-primary/50 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {question.options.map((option: string, optIndex: number) => (
                        <div
                          key={optIndex}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            option === question.correct_answer
                              ? "border-accent bg-accent/10"
                              : "border-border bg-muted/20"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-sm">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <span className="flex-1">{option}</span>
                            {option === question.correct_answer && (
                              <span className="text-xs font-semibold text-accent bg-accent/20 px-2 py-1 rounded-full">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Correct Answer Selection */}
                {editingIndex === index && (
                  <div className="space-y-3 pt-2 border-t">
                    <Label className="text-sm font-semibold">Select Correct Answer</Label>
                    <RadioGroup
                      value={question.correct_answer}
                      onValueChange={(value) => updateQuestion(index, "correct_answer", value)}
                    >
                      {question.options.map((option: string, optIndex: number) => (
                        <div
                          key={optIndex}
                          className="flex items-center space-x-3 p-3 rounded-lg border-2 hover:border-primary/50 transition-all cursor-pointer"
                        >
                          <RadioGroupItem value={option} id={`correct-${index}-${optIndex}`} />
                          <Label
                            htmlFor={`correct-${index}-${optIndex}`}
                            className="cursor-pointer flex-1 font-medium"
                          >
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {questions.length === 0 && (
            <Card className="border-2 border-dashed border-primary/20">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground text-center text-lg">
                  No questions found for this quiz.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizEdit;