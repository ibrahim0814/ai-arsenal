import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  LogOut,
  Wrench,
  FileText,
  Newspaper,
  StickyNote,
  LogIn,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { SkeletonLoader } from "./SkeletonLoader";

interface HeaderProps {
  isUserAdmin: boolean;
  user: any;
  onSignOut: () => void;
  onOpenLogin: () => void;
  onOpenAddModal: (tab: string) => void;
  onOpenAddNote: () => void;
  isLoading?: boolean;
}

export function Header({
  isUserAdmin,
  user,
  onSignOut,
  onOpenLogin,
  onOpenAddModal,
  onOpenAddNote,
  isLoading = false,
}: HeaderProps) {
  return (
    <div className="flex justify-between items-center gap-4 mb-6">
      <div className="flex items-center ml-2">
        <h1 className="text-xl sm:text-2xl font-bold">AI Arsenal</h1>
        <span className="text-2xl sm:text-3xl ml-1.5 sm:ml-2 -mt-1">⚔️</span>
      </div>
      {isLoading ? (
        <SkeletonLoader type="header-buttons" isLoggedIn={true} />
      ) : (
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isUserAdmin && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="sm:hidden"
                    title="Add"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onOpenAddModal("tools")}>
                    <Wrench className="h-4 w-4 mr-2" />
                    Tool
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenAddModal("prompts")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Prompt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenAddModal("media")}>
                    <Newspaper className="h-4 w-4 mr-2" />
                    Media
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {user && (
                <Button
                  variant="secondary"
                  onClick={onOpenAddNote}
                  size="icon"
                  className="sm:hidden"
                  title="Quick Note"
                >
                  <StickyNote className="h-4 w-4" />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="hidden sm:flex">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onOpenAddModal("tools")}>
                    <Wrench className="h-4 w-4 mr-2" />
                    Tool
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenAddModal("prompts")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Prompt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenAddModal("media")}>
                    <Newspaper className="h-4 w-4 mr-2" />
                    Media
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {user && (
                <Button
                  variant="secondary"
                  onClick={onOpenAddNote}
                  className="hidden sm:flex"
                >
                  <StickyNote className="h-4 w-4 mr-2" />
                  Note
                </Button>
              )}
            </>
          )}
          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={onSignOut}
                className="sm:hidden"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={onSignOut}
                className="hidden sm:flex"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Off
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={onOpenLogin}
                className="sm:hidden"
                title="Sign In"
              >
                <LogIn className="h-4 w-4 rotate-180" />
              </Button>
              <Button
                variant="outline"
                onClick={onOpenLogin}
                className="hidden sm:flex"
              >
                Sign In
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
