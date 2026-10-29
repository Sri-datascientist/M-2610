import React, { useEffect } from "react";
import { Link, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { useStore, setState } from "@/lib/store";
import { Lock, ShieldAlert } from "lucide-react";
import { apiClient } from "@/services/apiClient";

export const DoctorWorkspaceLayout: React.FC = () => {
  const signedIn = useStore((s) => s.signedIn);
  const token = typeof window !== "undefined" ? localStorage.getItem("meyveda_auth_token") : null;
  const role = typeof window !== "undefined" ? localStorage.getItem("meyveda_user_role") : null;

  useEffect(() => {
    let active = true;
    if (token) {
      apiClient
        .get<{
          id: string;
          email: string;
          role: string;
          doctor_profile?: {
            id: string;
            full_name: string;
            medical_license_number: string;
            specialty?: string;
            verification_status: string;
            invite_code?: string;
          };
        }>("/auth/me")
        .then((res) => {
          if (!active || !res) return;
          if (res.doctor_profile) {
            setState((s) => ({
              signedIn: true,
              doctor: {
                ...s.doctor,
                name: res.doctor_profile?.full_name || s.doctor.name,
                email: res.email || s.doctor.email,
                registrationNo: res.doctor_profile?.medical_license_number || s.doctor.registrationNo,
                qualification: res.doctor_profile?.specialty || s.doctor.qualification,
                inviteCode: res.doctor_profile?.invite_code || (s.doctor as any)?.inviteCode || "",
                verification: (res.doctor_profile?.verification_status as any) || s.doctor.verification,
                initials:
                  res.doctor_profile?.full_name
                    ?.replace(/^Dr\.?\s+/i, "")
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "DR",
              },
            }));
          }
        })
        .catch(() => {
          if (active) {
            localStorage.removeItem("meyveda_auth_token");
            localStorage.removeItem("meyveda_user_role");
            setState(() => ({ signedIn: false }));
          }
        });
    }
    return () => {
      active = false;
    };
  }, [token]);

  if (!signedIn && !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <section className="card-surface mx-auto my-12 max-w-lg p-8 text-center shadow-soft border border-border rounded-2xl bg-card">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Doctor Workspace Session Required
          </h2>
          <p className="mx-auto mt-2 text-sm text-muted-foreground">
            You must be signed in as a verified AYUSH practitioner to access the clinical workspace and invite dashboard.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/login"
              search={{ portal: "doctor" }}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
            >
              Sign in as Doctor
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              Go to Meyveda Home
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (role && role !== "doctor") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <section className="card-surface mx-auto my-12 max-w-lg p-8 text-center shadow-soft border border-destructive/20 rounded-2xl bg-card">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Access Restricted: Doctor Role Required
          </h2>
          <p className="mx-auto mt-2 text-sm text-muted-foreground">
            Your authenticated role is &apos;{role}&apos;. This section is restricted exclusively to registered AYUSH doctors.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/login"
              search={{ portal: "doctor" }}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
            >
              Sign in with Doctor Account
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              Go to Meyveda Home
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
};

export default DoctorWorkspaceLayout;
