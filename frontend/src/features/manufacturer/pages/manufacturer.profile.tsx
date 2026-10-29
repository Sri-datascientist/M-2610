import { createFileRoute } from "@tanstack/react-router";
import { ManufacturerProfilePage } from "@/features/manufacturer/ManufacturerProfilePage";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/manufacturer/profile")({
  head: () =>
    seo(
      "Company Profile — Manufacturer",
      "Corporate, licensing, and compliance profile for Ayurvedic manufacturer."
    ),
  component: ManufacturerProfilePage,
});
