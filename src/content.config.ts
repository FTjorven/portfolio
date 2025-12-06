import { glob, file } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const writing = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/writing" }),
    schema: () =>
        z.object({
            title: z.string(),
            pubDate: z.coerce.date(),
            lang: z.enum(["en", "nl"]).optional(),
            description: z.string().optional(),
            hideDescription: z.boolean().optional(),
            author: z.string().optional(),
            score: z.string().optional(),
            tags: z.array(z.string()).default([]),
            image: z
                .object({
                    url: z.string(),
                    alt: z.string().optional(),
                    imageClass: z.string().optional(),
                })
                .optional(),
            link: z.string().optional(),
        }),
});

const projects = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
    schema: () =>
        z.object({
            title: z.string(),
            pubDate: z.coerce.date(),
            description: z.string().optional(),
            author: z.string().optional(),
            tags: z.array(z.string()).default([]),
            image: z
                .object({
                    url: z.string(),
                    alt: z.string().optional(),
                    imageClass: z.string().optional(),
                })
                .optional(),
            link: z.string().optional(),
        }),
});

const skills = defineCollection({
    loader: file("src/content/skills.json"),
    schema: () =>
        z.object({
            id: z.string(),
            title: z.string(),
        }),
});

export const collections = {
    writing,
    projects,
    skills
};
