import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  image: {
    domains: ["fakestoreapi.com", "picsum.photos"],
    layout: "constrained",
    responsiveStyles: true,
  },
});
