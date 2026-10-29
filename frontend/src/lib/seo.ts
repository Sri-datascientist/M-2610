export const seo = (title: string, description: string) => ({
  meta: [
    { title: `${title} · Meyveda` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · Meyveda` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
