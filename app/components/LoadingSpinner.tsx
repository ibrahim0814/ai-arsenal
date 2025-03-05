import { Loader2 } from "lucide-react";

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  minHeight?: string;
};

export function LoadingSpinner({ 
  size = "md", 
  showText = true, 
  minHeight = "200px" 
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-[${minHeight}]`}>
      <Loader2 className={`${sizeMap[size]} animate-spin text-primary/60`} />
      {showText && <p className="text-sm text-muted-foreground mt-2">Loading...</p>}
    </div>
  );
}
