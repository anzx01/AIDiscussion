import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const options = [
  { id: "male", label: "Male", value: false },
  { id: "female", label: "Female", value: true },
];

export function GenderRadioGroup({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <RadioGroup
      value={String(value)}
      onValueChange={(val) => onChange(val === "true")}
      className="grid grid-cols-3 gap-4"
    >
      {options.map((opt) => (
        <div
          key={opt.id}
          className={cn(
            "mt-2 flex items-center space-x-2 rounded-lg px-4 py-2 ring transition-all duration-300",
            value === opt.value
              ? "ring-primary/10 bg-muted text-foreground"
              : "ring-muted hover:bg-muted text-muted-foreground",
          )}
        >
          <RadioGroupItem
            id={opt.id}
            value={String(opt.value)}
            className="peer sr-only"
          />
          <Label
            htmlFor={opt.id}
            className="mx-auto flex w-full cursor-pointer items-center justify-center text-sm font-medium transition-all duration-300"
          >
            {opt.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
