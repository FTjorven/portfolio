import { defineCollection, z } from "astro:content";

const writingCollection = defineCollection({
    type: "content",
    schema: z.object({
        title: z.string(),
        pubDate: z.coerce.date(),
        lang: z.enum(["en", "nl"]).optional(),
        description: z.string().optional(),
        author: z.string().optional(),
        tags: z.array(z.string()).default([]),
        image: z
            .object({
                url: z.string(),
                alt: z.string().optional(),
            })
            .optional(),
        link: z.string().optional(),
    }),
});

const projectsCollection = defineCollection({
    type: "content",
    schema: z.object({
        title: z.string(),
        pubDate: z.coerce.date(),
        description: z.string().optional(),
        author: z.string().optional(),
        tags: z.array(z.string()).default([]),
        image: z
            .object({
                url: z.string(),
                alt: z.string().optional(),
            })
            .optional(),
        link: z.string().optional(),
    }),
});

export const collections = {
    'projects': projectsCollection,
    'writing': writingCollection,
};
