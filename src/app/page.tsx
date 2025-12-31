"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChevronDown, ArrowRight } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [pace, setPace] = useState("balanced");
  const [budget, setBudget] = useState("flexible");
  const [focus, setFocus] = useState("experience-first");
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to start discussion");
      }

      router.push(`/progress/${data.sessionId}`);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to start discussion. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left: Hero/Title Section */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-center px-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
          <div className="space-y-6">
            <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Stop asking the same question to multiple AIs.
            </h1>
            <p className="text-3xl font-semibold text-slate-700 dark:text-slate-300">
              We already did that for you.
            </p>
            <p className="text-2xl font-medium text-blue-600 dark:text-blue-400">
              One decision. Multiple minds.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Designed for decisions you don't want to get wrong.
            </p>
          </div>
        </div>

        {/* Right: Input Section */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-slate-900">
          <div className="w-full max-w-lg space-y-6">
            {/* Mobile Title */}
            <div className="md:hidden text-center mb-8">
              <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
                One decision.
              </h1>
              <p className="text-xl text-blue-600 dark:text-blue-400">Multiple minds.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Main Input */}
              <div>
                <Input
                  type="text"
                  placeholder="Plan a 2-day trip to Paris..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="text-xl h-16 border-2 border-slate-200 focus:border-blue-500 dark:border-slate-700 dark:focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>

              {/* Options Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowOptions(!showOptions)}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                >
                  <span>Options</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
                </button>

                {/* Collapsible Options */}
                {showOptions && (
                  <div className="mt-4 space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
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

              {/* Submit Button - Arrow */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isLoading || !question.trim()}
                  className="h-14 w-14 rounded-full p-0"
                  size="icon"
                >
                  {isLoading ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <ArrowRight className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </form>

            {/* Info Text */}
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              For 2-day trip planning to any destination worldwide
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
