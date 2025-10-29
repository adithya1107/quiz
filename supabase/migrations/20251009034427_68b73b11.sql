-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'professor');

-- Create profiles table with user roles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  ai_prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Quiz policies
CREATE POLICY "Anyone can view quizzes"
  ON public.quizzes FOR SELECT
  USING (true);

CREATE POLICY "Professors can create quizzes"
  ON public.quizzes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'professor'
    )
  );

CREATE POLICY "Professors can update their own quizzes"
  ON public.quizzes FOR UPDATE
  USING (professor_id = auth.uid());

CREATE POLICY "Professors can delete their own quizzes"
  ON public.quizzes FOR DELETE
  USING (professor_id = auth.uid());

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  order_number INTEGER NOT NULL
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions"
  ON public.questions FOR SELECT
  USING (true);

CREATE POLICY "Professors can manage questions for their quizzes"
  ON public.questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = questions.quiz_id
      AND quizzes.professor_id = auth.uid()
    )
  );

-- Create quiz attempts table
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quiz_id, student_id)
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Quiz attempts policies
CREATE POLICY "Students can view their own attempts"
  ON public.quiz_attempts FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Professors can view attempts for their quizzes"
  ON public.quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_attempts.quiz_id
      AND quizzes.professor_id = auth.uid()
    )
  );

CREATE POLICY "Students can create their own attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();