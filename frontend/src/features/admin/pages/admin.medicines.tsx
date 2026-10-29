import { createFileRoute } from "@tanstack/react-router";
import { MedicinesDirectory } from "@/features/admin/medicines-page";

export const Route = createFileRoute("/admin/medicines")({
  head: () => ({
    meta: [
      { title: "Product management — Meyveda Grantha" },
      {
        name: "description",
        content: "Review medicine submissions, product approvals, and maintain the product catalogue.",
      },
    ],
  }),
  component: MedicinesDirectory,
});
