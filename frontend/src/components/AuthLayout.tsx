import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Logo } from "./shell/Logo";
import triphala from "@/assets/triphala.jpg";

export function AuthLayout({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <img
          src={triphala}
          alt=""
          width={1280}
          height={960}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="absolute inset-x-10 bottom-10 text-ink-foreground">
          <div className="eyebrow text-primary">Doctor Workspace</div>
          <p className="mt-2 max-w-md text-2xl font-bold leading-snug">
            Classical knowledge, quality evidence and pharmacovigilance — in one research desk.
          </p>
        </div>
      </div>
      <div className="flex flex-col p-6 md:p-12">
        <div className="flex items-center justify-between">
          <Link
            to="/doctor"
            className="transition-opacity hover:opacity-90"
            aria-label="Meyveda landing page"
          >
            <Logo />
          </Link>
          <Link to="/doctor" className="text-xs font-semibold text-primary hover:underline">
            ← About Meyveda
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto my-auto w-full max-w-md py-10"
        >
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
          <div className="mt-6">{children}</div>
        </motion.div>
        <p className="text-[11px] text-muted-foreground">
          Prototype — no real credentials are stored.
        </p>
      </div>
    </div>
  );
}
