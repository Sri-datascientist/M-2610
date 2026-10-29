import { cn } from "@/lib/utils";

const FULL_LOGO = "/brand/meyveda-logo.png";
const MARK = "/brand/meyveda-mark.png";

export function Logo({ compact, className }: { compact?: boolean; className?: string }) {
  if (compact) {
    return (
      <img
        src={MARK}
        alt="Meyveda"
        width={512}
        height={512}
        decoding="async"
        className={cn("h-11 w-11 object-contain", className)}
      />
    );
  }

  return (
    <img
      src={FULL_LOGO}
      alt="Meyveda — reinvent you"
      width={1095}
      height={850}
      decoding="async"
      className={cn("h-auto w-[9.75rem] max-w-full object-contain", className)}
    />
  );
}
