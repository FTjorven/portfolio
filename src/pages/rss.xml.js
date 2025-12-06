import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
    const projects = await getCollection('projects');

    return rss({
        title: 'FTJORVEN - Projects',
        description: 'Project updates and new work from ftjorven - Web Design student at Devine',
        site: context.site,
        items: projects.map((project) => ({
            title: project.data.title,
            pubDate: project.data.pubDate,
            description: project.data.description,
            link: `${import.meta.env.BASE_URL}projects/${project.id.replace('.md', '')}`,
        })),
        customData: `<language>en-us</language>`,
    });
}
