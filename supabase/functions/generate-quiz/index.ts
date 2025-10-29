import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, title, description } = await req.json();
    
    if (!prompt || !title) {
      return new Response(
        JSON.stringify({ error: "Prompt and title are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not found");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User authentication error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating quiz for user:", user.id);
    console.log("Prompt:", prompt);

    console.log("Calling Lovable AI...");
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { 
              role: "system", 
              content: "You are a quiz generator that creates educational multiple-choice questions." 
            },
            { 
              role: "user", 
              content: `Generate a quiz with 5 multiple-choice questions based on: ${prompt}\n\nEach question should have 4 options and one correct answer.` 
            }
          ],
          tools: [{
            type: "function",
            function: {
              name: "generate_quiz",
              description: "Generate quiz questions with multiple choice options",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        options: {
                          type: "array",
                          items: { type: "string" },
                          minItems: 4,
                          maxItems: 4
                        },
                        correct_answer: { type: "string" }
                      },
                      required: ["question", "options", "correct_answer"],
                      additionalProperties: false
                    },
                    minItems: 5,
                    maxItems: 5
                  }
                },
                required: ["questions"],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "generate_quiz" } }
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Lovable AI error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to generate quiz content", 
          details: `AI API returned ${aiResponse.status}: ${errorText}`
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_quiz") {
      console.error("No tool call in AI response");
      return new Response(
        JSON.stringify({ error: "Invalid AI response format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const quizData = JSON.parse(toolCall.function.arguments);
    
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      console.error("Invalid quiz data structure");
      return new Response(
        JSON.stringify({ error: "Invalid quiz structure" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Quiz data parsed successfully, creating quiz in database...");

    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        professor_id: user.id,
        title,
        description: description || "",
        ai_prompt: prompt,
      })
      .select()
      .single();

    if (quizError) {
      console.error("Error creating quiz:", quizError);
      return new Response(
        JSON.stringify({ error: "Failed to create quiz" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Quiz created:", quiz.id);

    const questionsToInsert = quizData.questions.map((q: any, index: number) => ({
      quiz_id: quiz.id,
      question_text: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      order_number: index + 1,
    }));

    const { error: questionsError } = await supabase
      .from("questions")
      .insert(questionsToInsert);

    if (questionsError) {
      console.error("Error creating questions:", questionsError);
      await supabase.from("quizzes").delete().eq("id", quiz.id);
      return new Response(
        JSON.stringify({ error: "Failed to create questions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Questions created successfully");

    return new Response(
      JSON.stringify({ quiz }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-quiz function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});