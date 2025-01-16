"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TAG_OPTIONS } from "@/lib/constants";

interface MultiSelectProps {
  selected: string[];
  setSelected: (selected: string[]) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function MultiSelect({
  selected,
  setSelected,
  options,
  placeholder = "Select items...",
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = (item: string) => {
    setSelected(selected.filter((i) => i !== item));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "" && selected.length > 0) {
          setSelected(selected.slice(0, -1));
        }
      }
      if (e.key === "Escape") {
        input.blur();
        setOpen(false);
      }
    }
  };

  const selectOption = (value: string) => {
    if (selected.includes(value)) {
      handleUnselect(value);
    } else {
      setSelected([...selected, value]);
    }
  };

  return (
    <div className="relative">
      <div
        className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        onKeyDown={handleKeyDown}
      >
        <div className="flex gap-1 flex-wrap">
          {selected.map((item) => (
            <Badge
              key={item}
              className={`${
                TAG_OPTIONS.find((opt) => opt.value === item)?.color ||
                "bg-gray-100 text-gray-800"
              } px-1.5 py-0.5 rounded-full`}
            >
              {options.find((option) => option.value === item)?.label}
              <button
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUnselect(item);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => handleUnselect(item)}
              >
                <X className="h-3 w-3 hover:text-foreground" />
              </button>
            </Badge>
          ))}
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
          />
        </div>
      </div>
      {open && (
        <div className="absolute w-full z-50 top-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md outline-none">
          <div className="h-full overflow-auto max-h-[200px] p-1">
            {options.map((option) => (
              <div
                key={option.value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  selectOption(option.value);
                }}
                className={`
                  flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer mb-1
                  ${
                    TAG_OPTIONS.find((opt) => opt.value === option.value)
                      ?.color || "bg-gray-100 text-gray-800"
                  }
                  ${
                    selected.includes(option.value)
                      ? "opacity-100"
                      : "opacity-80 hover:opacity-100"
                  }
                `}
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                    selected.includes(option.value)
                      ? "border-current"
                      : "border-primary opacity-50"
                  }`}
                >
                  {selected.includes(option.value) && "✓"}
                </div>
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
