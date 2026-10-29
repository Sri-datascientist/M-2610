export const seo = (title: string, description: string) => ({
  meta: [
    { title: `${title} · Mey Veda Grantha` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · Mey Veda Grantha` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
