// Auth.tsx - Enhanced Version with Improved Styling
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "professor">("student");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const userRole = session.user.user_metadata?.role || "student";
        navigate(userRole === "professor" ? "/professor" : "/student");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const userRole = session.user.user_metadata?.role || "student";
        navigate(userRole === "professor" ? "/professor" : "/student");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      if (!fullName.trim()) {
        throw new Error("Please enter your full name");
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      if (data.user && !data.session) {
        toast.success("Check your email to confirm your account!");
      } else {
        toast.success("Account created successfully!");
      }
      
    } catch (error: any) {
      toast.error(error.message || "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      toast.success("Signed in successfully!");
      
    } catch (error: any) {
      toast.error(error.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-secondary/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <Card className="w-full max-w-md shadow-colored-xl relative backdrop-blur-sm bg-card/95 border-2 border-primary/10 animate-fade-in">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center mb-3 shadow-colored-lg animate-float">
            <span className="text-4xl">🎓</span>
          </div>
          <CardTitle className="text-5xl font-bold text-gradient-hero">
            QuizMaster AI
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Create and take AI-powered quizzes with ease
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1.5 bg-muted/50 mb-8">
              <TabsTrigger 
                value="signin" 
                className="data-[state=active]:shadow-colored-md transition-all duration-300 data-[state=active]:scale-105"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="data-[state=active]:shadow-colored-md transition-all duration-300 data-[state=active]:scale-105"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="mt-0">
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-sm font-semibold">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="h-12 transition-all duration-300 focus:shadow-colored-sm border-2 focus:border-primary/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-sm font-semibold">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="h-12 transition-all duration-300 focus:shadow-colored-sm border-2 focus:border-primary/50"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 shadow-colored-md hover:shadow-colored-xl transition-all duration-300 gradient-primary hover:scale-105 font-semibold text-base" 
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="mt-0">
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullname" className="text-sm font-semibold">Full Name</Label>
                  <Input
                    id="fullname"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    className="h-12 transition-all duration-300 focus:shadow-colored-sm border-2 focus:border-primary/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-semibold">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="h-12 transition-all duration-300 focus:shadow-colored-sm border-2 focus:border-primary/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-semibold">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    className="h-12 transition-all duration-300 focus:shadow-colored-sm border-2 focus:border-primary/50"
                    required
                  />
                  <p className="text-xs text-muted-foreground pl-1">
                    Must be at least 6 characters
                  </p>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">I am a...</Label>
                  <RadioGroup value={role} onValueChange={(value) => setRole(value as "student" | "professor")}>
                    <div className="flex items-center space-x-3 p-4 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:shadow-colored-sm">
                      <RadioGroupItem value="student" id="student" />
                      <Label htmlFor="student" className="cursor-pointer flex-1 font-medium text-base flex items-center gap-2">
                        <span className="text-2xl">🎓</span>
                        Student
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:shadow-colored-sm">
                      <RadioGroupItem value="professor" id="professor" />
                      <Label htmlFor="professor" className="cursor-pointer flex-1 font-medium text-base flex items-center gap-2">
                        <span className="text-2xl">👨‍🏫</span>
                        Professor
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 shadow-colored-md hover:shadow-colored-xl transition-all duration-300 gradient-primary hover:scale-105 font-semibold text-base" 
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;