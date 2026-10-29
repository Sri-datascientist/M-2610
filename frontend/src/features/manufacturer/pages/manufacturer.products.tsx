import { createFileRoute } from "@tanstack/react-router";
import { ProductManagementPage } from "@/features/manufacturer/ProductManagementPage";

export const Route = createFileRoute("/manufacturer/products")({
  head: () => ({
    meta: [
      { title: "Product Management — meyveda" },
      { name: "description", content: "Ayurvedic proprietary and classical medicine dossier management." },
    ],
  }),
  component: ProductManagementPage,
});
