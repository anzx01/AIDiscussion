"use client";

import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Pause, Play, Plus } from "lucide-react";

interface ControlButtonProps {
  status: "idle" | "processing" | "completed";
  isPaused: boolean;
  isLoading?: boolean;
  onSubmit?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onNew?: () => void;
}

export function ControlButton({
  status,
  isPaused,
  isLoading = false,
  onSubmit,
  onPause,
  onResume,
  onNew,
}: ControlButtonProps) {
  // 未开始状态 - 显示箭头按钮
  if (status === "idle") {
    return (
      <Button
        onClick={onSubmit}
        disabled={isLoading}
        className="h-14 w-14 rounded-full p-0"
        size="icon"
      >
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <ArrowRight className="h-6 w-6" />
        )}
      </Button>
    );
  }

  // 进行中且未暂停 - 显示暂停按钮
  if (status === "processing" && !isPaused) {
    return (
      <Button
        onClick={onPause}
        variant="outline"
        className="h-14 w-14 rounded-full p-0 border-2"
        size="icon"
      >
        <Pause className="h-6 w-6" />
      </Button>
    );
  }

  // 进行中但已暂停 - 显示继续按钮
  if (status === "processing" && isPaused) {
    return (
      <Button
        onClick={onResume}
        className="h-14 w-14 rounded-full p-0 bg-green-600 hover:bg-green-700"
        size="icon"
      >
        <Play className="h-6 w-6 fill-white" />
      </Button>
    );
  }

  // 已完成状态 - 显示新建按钮
  if (status === "completed") {
    return (
      <Button
        onClick={onNew}
        className="h-14 w-14 rounded-full p-0"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    );
  }

  return null;
}
