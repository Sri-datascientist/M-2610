import { createFileRoute } from "@tanstack/react-router";
import { IngredientsDirectory } from "@/features/admin/ingredients-page";

export const Route = createFileRoute("/admin/ingredients")({
  head: () => ({
    meta: [
      { title: "Ingredients — meyveda" },
      {
        name: "description",
        content: "Standard names, synonyms, and source references for the ingredient master.",
      },
    ],
  }),
  component: IngredientsDirectory,
});
