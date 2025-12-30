"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Home() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [pace, setPace] = useState("balanced");
  const [budget, setBudget] = useState("flexible");
  const [focus, setFocus] = useState("experience-first");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);

    try {
      // Create a new session
      const response = await fetch("/api/discuss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          pace,
          budget,
          focus,
        }),
      });

      if (!response.ok) throw new Error("Failed to start discussion");

      const data = await response.json();
      // Track first_input_submitted event
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "first_input_submitted",
          sessionId: data.sessionId,
        }),
      });

      // Redirect to results page
      router.push(`/results/${data.sessionId}`);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to start discussion. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          {/* Hero Section */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl md:text-6xl">
              Stop asking the same question to multiple AIs.
            </h1>
            <p className="mb-4 text-2xl font-semibold text-slate-700 dark:text-slate-300 sm:text-3xl">
              We already did that for you.
            </p>
            <p className="mb-6 text-xl font-medium text-blue-600 dark:text-blue-400 sm:text-2xl">
              One decision. Multiple minds.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Designed for decisions you don't want to get wrong.
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900">
            {/* Question Input */}
            <div>
              <Label htmlFor="question" className="mb-2 text-lg font-semibold">
                What decision are you trying to make?
              </Label>
              <Input
                id="question"
                type="text"
                placeholder="Plan a 2-day trip to New York"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="text-lg"
                disabled={isLoading}
              />
            </div>

            {/* Parameters */}
            <div className="space-y-6">
              {/* Pace */}
              <div>
                <Label className="mb-3 block font-semibold">Pace</Label>
                <RadioGroup value={pace} onValueChange={setPace} disabled={isLoading}>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fast" id="pace-fast" />
                      <Label htmlFor="pace-fast" className="cursor-pointer font-normal">
                        Fast
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="balanced" id="pace-balanced" />
                      <Label htmlFor="pace-balanced" className="cursor-pointer font-normal">
                        Balanced
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="relaxed" id="pace-relaxed" />
                      <Label htmlFor="pace-relaxed" className="cursor-pointer font-normal">
                        Relaxed
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Budget */}
              <div>
                <Label className="mb-3 block font-semibold">Budget</Label>
                <RadioGroup value={budget} onValueChange={setBudget} disabled={isLoading}>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="budget-conscious" id="budget-conscious" />
                      <Label htmlFor="budget-conscious" className="cursor-pointer font-normal">
                        Budget-conscious
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="flexible" id="budget-flexible" />
                      <Label htmlFor="budget-flexible" className="cursor-pointer font-normal">
                        Flexible
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Focus */}
              <div>
                <Label className="mb-3 block font-semibold">Focus</Label>
                <RadioGroup value={focus} onValueChange={setFocus} disabled={isLoading}>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="experience-first" id="focus-experience" />
                      <Label htmlFor="focus-experience" className="cursor-pointer font-normal">
                        Experience-first
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="practical" id="focus-practical" />
                      <Label htmlFor="focus-practical" className="cursor-pointer font-normal">
                        Practical
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="w-full text-lg"
              size="lg"
            >
              {isLoading ? "Starting discussion..." : "Get multiple perspectives"}
            </Button>
          </form>

          {/* Info Text */}
          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Only for 2-day New York trip planning
          </p>
        </div>
      </div>
    </div>
  );
}
