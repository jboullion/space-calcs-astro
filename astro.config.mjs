import { defineConfig } from "astro/config";
import vue from "@astrojs/vue";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig(
  {
    site: "https://spacecalcs.com",
    integrations: [vue(), sitemap()],
  } //   site: "https://jboullion.github.io",
  //   base: "/space-calcs-astro",
);
