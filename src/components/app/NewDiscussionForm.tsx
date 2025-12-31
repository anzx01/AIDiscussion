"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronDown, Send, Sparkles } from "lucide-react";

interface NewDiscussionFormProps {
  onDiscussionStarted: (sessionId: string) => void;
}

export function NewDiscussionForm({ onDiscussionStarted }: NewDiscussionFormProps) {
  const [question, setQuestion] = useState("");
  const [pace, setPace] = useState("balanced");
  const [budget, setBudget] = useState("flexible");
  const [focus, setFocus] = useState("experience-first");
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with question:", question);

    if (!question.trim()) {
      console.log("Question is empty, not submitting");
      return;
    }

    setIsLoading(true);
    console.log("Starting API request to /api/discuss");

    try {
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

      console.log("API response status:", response.status);

      const data = await response.json();
      console.log("API response data:", data);

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to start discussion");
      }

      console.log("Discussion started with session ID:", data.sessionId);
      onDiscussionStarted(data.sessionId);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to start discussion. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-900">
      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl space-y-8">
          {/* Hero Text */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50">
                Start a New Discussion
              </h1>
            </div>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Ask a question and let multiple AI agents collaborate on the answer
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Main Input */}
            <div className="relative flex items-center">
              <Input
                type="text"
                placeholder="What would you like to discuss? (e.g., Plan a 2-day trip to Paris)"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
                className="text-lg h-14 pr-16 border-2 border-slate-200 focus:border-blue-500 dark:border-slate-700 dark:focus:border-blue-500"
                disabled={isLoading}
              />
              <Button
                type="button"
                onClick={(e) => {
                  console.log("Button clicked! Question:", question);
                  console.log("Button disabled:", !question.trim() || isLoading);
                  e.preventDefault();
                  handleSubmit(e as any);
                }}
                disabled={!question.trim() || isLoading}
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Options Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
              >
                <span>Advanced Options</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
              </button>

              {/* Collapsible Options */}
              {showOptions && (
                <div className="mt-4 space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  {/* Pace */}
                  <div>
                    <Label className="mb-2 block text-sm font-semibold">Pace</Label>
                    <RadioGroup value={pace} onValueChange={setPace} disabled={isLoading}>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fast" id="pace-fast" />
                          <Label htmlFor="pace-fast" className="cursor-pointer font-normal text-sm">
                            Fast
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="balanced" id="pace-balanced" />
                          <Label htmlFor="pace-balanced" className="cursor-pointer font-normal text-sm">
                            Balanced
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="relaxed" id="pace-relaxed" />
                          <Label htmlFor="pace-relaxed" className="cursor-pointer font-normal text-sm">
                            Relaxed
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Budget */}
                  <div>
                    <Label className="mb-2 block text-sm font-semibold">Budget</Label>
                    <RadioGroup value={budget} onValueChange={setBudget} disabled={isLoading}>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="budget-conscious" id="budget-conscious" />
                          <Label htmlFor="budget-conscious" className="cursor-pointer font-normal text-sm">
                            Budget-conscious
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="flexible" id="budget-flexible" />
                          <Label htmlFor="budget-flexible" className="cursor-pointer font-normal text-sm">
                            Flexible
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Focus */}
                  <div>
                    <Label className="mb-2 block text-sm font-semibold">Focus</Label>
                    <RadioGroup value={focus} onValueChange={setFocus} disabled={isLoading}>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="experience-first" id="focus-experience" />
                          <Label htmlFor="focus-experience" className="cursor-pointer font-normal text-sm">
                            Experience-first
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="practical" id="focus-practical" />
                          <Label htmlFor="focus-practical" className="cursor-pointer font-normal text-sm">
                            Practical
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* Info Text */}
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Multiple AI agents will collaborate to provide comprehensive answers
          </p>
        </div>
      </div>

      {/* Bottom Bar - Empty for consistency with ActiveDiscussion */}
      <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 h-20">
        {/* This space is reserved for future features or to maintain consistent layout */}
      </div>
    </div>
  );
}
