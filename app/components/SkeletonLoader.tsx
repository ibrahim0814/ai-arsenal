import { Skeleton } from "@/components/ui/skeleton";

type SkeletonLoaderProps = {
  type?:
    | "tab"
    | "content"
    | "tools"
    | "prompts"
    | "media"
    | "searchbar"
    | "tabs-header"
    | "header-buttons";
  isLoggedIn?: boolean;
  isAuthenticating?: boolean;
  activeTab?: string;
};

export function SkeletonLoader({
  type = "content",
  isLoggedIn = false,
  isAuthenticating = false,
  activeTab = "tools",
}: SkeletonLoaderProps) {
  // Use a consistent class for width - parent container should control sizing
  const wrapperClass = "w-full";

  // Combined tabs and search header skeleton
  if (type === "tabs-header") {
    return (
      <div>
        <div className="flex justify-between items-center">
          <div className="flex gap-2 w-full sm:w-fit">
            <div className="flex-1 sm:flex-initial min-w-[100px] px-3 py-2 h-10 bg-muted rounded-md flex items-center animate-pulse">
              <div className="h-4 w-4 mr-2 rounded-full bg-muted-foreground/30"></div>
              <div className="h-5 w-16 rounded-md bg-muted-foreground/30"></div>
            </div>
            <div className="flex-1 sm:flex-initial min-w-[100px] px-3 py-2 h-10 bg-muted rounded-md flex items-center animate-pulse">
              <div className="h-4 w-4 mr-2 rounded-full bg-muted-foreground/30"></div>
              <div className="h-5 w-20 rounded-md bg-muted-foreground/30"></div>
            </div>
            <div className="flex-1 sm:flex-initial min-w-[100px] px-3 py-2 h-10 bg-muted rounded-md flex items-center animate-pulse">
              <div className="h-4 w-4 mr-2 rounded-full bg-muted-foreground/30"></div>
              <div className="h-5 w-14 rounded-md bg-muted-foreground/30"></div>
            </div>
          </div>
          {activeTab === "tools" && (
            <div className="hidden md:block w-[300px]">
              <div className="h-10 w-full rounded-md bg-muted flex items-center px-3 animate-pulse">
                <div className="h-4 w-4 mr-2 rounded-full bg-muted-foreground/30"></div>
                <div className="h-5 w-3/4 rounded-md bg-muted-foreground/30"></div>
              </div>
            </div>
          )}
        </div>
        {activeTab === "tools" && (
          <div className="md:hidden mt-1">
            <div className="h-10 w-full rounded-md bg-muted flex items-center px-3 animate-pulse">
              <div className="h-4 w-4 mr-2 rounded-full bg-muted-foreground/30"></div>
              <div className="h-5 w-3/4 rounded-md bg-muted-foreground/30"></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Tab skeletons
  if (type === "tab") {
    return (
      <div className="flex gap-2 mb-4 w-full sm:w-fit">
        <div className="flex-1 sm:flex-initial min-w-[100px] px-3 py-2 h-10 bg-muted rounded-md flex items-center animate-pulse">
          <div className="h-4 w-4 mr-2 rounded-full bg-muted-foreground/30"></div>
          <div className="h-5 w-16 rounded-md bg-muted-foreground/30"></div>
        </div>
        <div className="flex-1 sm:flex-initial min-w-[100px] px-3 py-2 h-10 bg-muted rounded-md flex items-center animate-pulse">
          <div className="h-4 w-4 mr-2 rounded-full bg-muted-foreground/30"></div>
          <div className="h-5 w-20 rounded-md bg-muted-foreground/30"></div>
        </div>
        <div className="flex-1 sm:flex-initial min-w-[100px] px-3 py-2 h-10 bg-muted rounded-md flex items-center animate-pulse">
          <div className="h-4 w-4 mr-2 rounded-full bg-muted-foreground/30"></div>
          <div className="h-5 w-14 rounded-md bg-muted-foreground/30"></div>
        </div>
      </div>
    );
  }

  // Search bar skeleton
  if (type === "searchbar") {
    return (
      <div className={`${wrapperClass}`}>
        <div className="h-10 w-full rounded-md bg-muted flex items-center px-3 animate-pulse">
          <div className="h-4 w-4 mr-2 rounded-full bg-muted-foreground/30"></div>
          <div className="h-5 w-3/4 rounded-md bg-muted-foreground/30"></div>
        </div>
      </div>
    );
  }

  // Tools content skeleton
  if (type === "tools") {
    return (
      <div className={`space-y-4 ${wrapperClass}`}>
        {/* Tools use a single column layout */}
        <div className="grid grid-cols-1 gap-2.5">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="h-6 w-3/4 rounded-md bg-muted"></div>
                    <div className="h-4 w-full rounded-md bg-muted"></div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <div className="h-5 w-16 rounded-full bg-muted"></div>
                      <div className="h-5 w-20 rounded-full bg-muted"></div>
                      <div className="h-5 w-14 rounded-full bg-muted"></div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-7 w-7 rounded-full bg-muted"></div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  // Prompts content skeleton
  if (type === "prompts") {
    return (
      <div className={`space-y-4 ${wrapperClass}`}>
        {isLoggedIn && (
          <div className="h-9 w-32 mb-4 rounded-md bg-muted animate-pulse"></div>
        )}
        {/* Prompts use a single column layout */}
        <div className="grid grid-cols-1 gap-2">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="border rounded-lg p-4 space-y-2 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex justify-between items-center">
                  <div className="h-6 w-2/3 rounded-md bg-muted"></div>
                  <div className="h-5 w-16 rounded-md bg-muted"></div>
                </div>
                <div className="h-24 w-full rounded-md bg-muted"></div>
                <div className="flex justify-end gap-2">
                  <div className="h-8 w-8 rounded-full bg-muted"></div>
                  <div className="h-8 w-8 rounded-full bg-muted"></div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  // Media content skeleton
  if (type === "media") {
    return (
      <div className={`space-y-4 ${wrapperClass}`}>
        {/* All items tab / Daily summary layout */}
        <div className="space-y-6">
          {Array(2)
            .fill(0)
            .map((_, dateIndex) => (
              <div key={dateIndex} className="space-y-4">
                <div className="grid grid-cols-1 w-full gap-4">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="border rounded-lg overflow-hidden w-full animate-pulse"
                        style={{
                          animationDelay: `${(dateIndex * 3 + i) * 100}ms`,
                        }}
                      >
                        <div className="p-3 space-y-2">
                          <div className="flex justify-between">
                            <div className="h-5 w-3/4 rounded-md bg-muted"></div>
                            <div className="h-5 w-[80px] rounded-md bg-muted"></div>
                          </div>
                          <div className="h-4 w-full rounded-md bg-muted"></div>
                          <div className="h-4 w-full rounded-md bg-muted"></div>
                          <div className="flex justify-between items-center mt-2">
                            <div className="h-4 w-20 rounded-md bg-muted"></div>
                            <div className="flex gap-1">
                              <div className="h-8 w-8 rounded-full bg-muted"></div>
                              <div className="h-8 w-8 rounded-full bg-muted"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  // Header buttons skeleton
  if (type === "header-buttons") {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        {/* Theme toggle skeleton */}
        <div className="h-9 w-9 rounded-md bg-muted"></div>
        
        {/* Admin buttons skeleton - optional based on isLoggedIn */}
        {isLoggedIn && (
          <>
            {/* Add button / dropdown skeleton for small screens */}
            <div className="h-9 w-9 rounded-md bg-muted sm:hidden"></div>
            {/* Note button skeleton for small screens */}
            <div className="h-9 w-9 rounded-md bg-muted sm:hidden"></div>
            {/* Add button skeleton for larger screens */}
            <div className="h-9 w-[70px] rounded-md bg-muted hidden sm:flex"></div>
            {/* Note button skeleton for larger screens */}
            <div className="h-9 w-[80px] rounded-md bg-muted hidden sm:flex"></div>
          </>
        )}
        
        {/* Auth buttons skeleton */}
        <div className="h-9 w-9 rounded-md bg-muted sm:hidden"></div>
        <div className="h-9 w-[90px] rounded-md bg-muted hidden sm:flex"></div>
      </div>
    );
  }
  
  // Default content skeleton
  return (
    <div className={`space-y-4 ${wrapperClass}`}>
      <div className="h-8 w-[200px] mb-4 rounded-md bg-muted animate-pulse"></div>
      <div
        className={`grid grid-cols-1 ${
          isLoggedIn ? "md:grid-cols-2" : "md:grid-cols-3"
        } gap-4`}
      >
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="h-[120px] rounded-lg bg-muted animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
      </div>
    </div>
  );
}
