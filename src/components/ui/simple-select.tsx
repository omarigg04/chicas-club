import * as React from "react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
  content?: React.ReactNode;
}

interface SimpleSelectProps {
  options: Option[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SimpleSelect: React.FC<SimpleSelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  className,
}) => {
  return (
    <select
      value={value || ""}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-dark-4 bg-dark-3 px-3 py-2 text-sm ring-offset-background placeholder:text-light-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-light-1",
        className
      )}
    >
      <option value="" className="bg-dark-3 text-light-1">
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-dark-3 text-light-1">
          {option.label}
        </option>
      ))}
    </select>
  );
};