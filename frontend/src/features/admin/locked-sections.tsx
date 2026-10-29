import { createContext, useContext, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moduleByPath } from "@/features/admin/modules";
import { isSectionRouteLocked } from "@/features/admin/locked-sections-config";
import { cn } from "@/lib/utils";

type LockedContextType = {
  isRouteLocked: (route: string) => boolean;
};

const LockedContext = createContext<LockedContextType>({
  isRouteLocked: isSectionRouteLocked,
});

export function LockedSectionsProvider({
  children,
  isRouteLocked = isSectionRouteLocked,
}: {
  children: ReactNode;
  isRouteLocked?: (route: string) => boolean;
}) {
  return (
    <LockedContext.Provider value={{ isRouteLocked }}>
      {children}
    </LockedContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLockedSections() {
  return useContext(LockedContext);
}

export function LockedRouteOverlay({
  pathname,
  children,
}: {
  pathname: string;
  children: ReactNode;
}) {
  const { isRouteLocked } = useLockedSections();
  const locked = isRouteLocked(pathname);
  const currentModule = moduleByPath(pathname);
  const title = currentModule?.title ?? currentModule?.label ?? "This Section";

  return (
    <div
      className={cn(
        "relative min-h-[60vh]",
        locked && "min-h-[560px] overflow-hidden rounded-2xl",
      )}
    >
      {/* Real section content — preserved underneath, completely shielded & hidden when locked */}
      <div
        className={cn(
          "transition-all duration-300",
          locked && "pointer-events-none select-none invisible opacity-0 filter blur-3xl",
        )}
        aria-hidden={locked ? true : undefined}
        inert={locked ? true : undefined}
      >
        {children}
      </div>

      {/* Temporary Lock Layer — full-coverage blocking barrier that obstructs visibility */}
      {locked && (
        <div
          className="absolute inset-0 z-20 flex min-h-[560px] flex-col items-center justify-center rounded-2xl border border-border/80 bg-white/95 p-6 text-center shadow-xs backdrop-blur-2xl sm:p-10"
          role="region"
          aria-label={`${title} is temporarily locked`}
        >
          {/* Subtle decorative privacy shield backdrop watermark */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.03]"
            aria-hidden="true"
          >
            <Lock className="h-96 w-96 -rotate-12" />
          </div>

          <div className="card-surface relative z-10 mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lift">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-xs ring-8 ring-primary/5">
              <Lock className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-bold tracking-tight text-foreground">
              {title} is Temporarily Locked
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This section is temporarily locked. All underlying data, records, and configurations
              are securely preserved in the codebase.
            </p>
            <div className="mt-6 flex justify-center">
              <Button asChild variant="default" className="font-semibold shadow-xs">
                <Link to="/admin/home">
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <p className="mt-5 text-[11px] text-muted-foreground">
              All contents remain intact and will be displayed as before when unlocked.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
