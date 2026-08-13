import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const scripts = defineCollection({
    loader: glob({ base: "./src/content/scripts/", pattern: "**/*.{md,mdx}" }),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        tags: z.array(z.string()),
    }),
});

export const collections = { scripts };