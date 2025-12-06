---
title: "Building My Portfolio: Extra Features & Technical Deep Dive"
pubDate: 2025-12-06
lang: en
description: "A look at the extra features I added to my portfolio site — dark mode, RSS feeds, search functionality, and more."
author: "ftjorven"
tags: ["english", "web development", "technical", "portfolio", "blog"]
image:
    url: "/portfolio/images/writing/portfolio-header.jpg"
    alt: "Portfolio website features showcase"
---

When building my portfolio site with Astro, I wanted to go beyond the basic requirements and add features that would make the site more engaging and functional. Here's a breakdown of everything I implemented.

## Dark Mode Toggle

One of the first "extra" features I added was a dark/light mode toggle. Instead of a boring button, I made it fun and interactive with animations:

```javascript
// Theme toggle functionality
const themeToggle = document.getElementById("theme-toggle");
const html = document.documentElement;
const themeIcon = document.querySelector(".theme-icon");

// Check for saved theme preference
const currentTheme = localStorage.getItem("theme") || "light";
html.setAttribute("data-theme", currentTheme);
themeIcon.textContent = currentTheme === "dark" ? "🌙" : "☀️";

themeToggle?.addEventListener("click", () => {
    const newTheme = html.getAttribute("data-theme") === "light" ? "dark" : "light";
    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    themeIcon.textContent = newTheme === "dark" ? "🌙" : "☀️";
});
```

The toggle button has playful hover effects — it scales up, rotates, and the icon spins. The theme preference persists across sessions using localStorage, so visitors don't have to toggle it every time they visit.

## Search Functionality

I implemented a real-time search feature for the writing page. It searches through titles, excerpts, and tags as you type, and works seamlessly with the language filter:

**Key features:**
- Instant filtering as you type
- Searches across multiple fields (title, excerpt, tags)
- Case-insensitive matching
- Combines with language filter (English/Dutch/All)

The search input has a clean, minimal design with focus states that match the site's aesthetic.

## RSS Feed

For anyone who wants to stay updated with my project work, I added an RSS feed. The feed is built using Astro's RSS integration and automatically pulls from my projects content collection:

- Accessible at `/portfolio/rss.xml`
- Auto-discoverable through meta tags in the head
- Subscribe button in the footer
- Includes project titles, descriptions, and publication dates

## SEO & Open Graph Tags

I implemented comprehensive SEO optimization:

- **Meta tags**: Title, description, author, robots
- **Open Graph tags**: For Facebook and social media sharing
- **Twitter Card tags**: For Twitter previews
- **Canonical URLs**: Proper URL structure
- **Structured data**: Using proper schema markup

Each page can customize its title, description, and social image for better sharing across platforms.

## Pagination Structure

While I currently have 4 projects, I built in pagination infrastructure for future growth. The system shows "Showing X of Y projects" and includes styled Previous/Next buttons that will activate once I have more than 4 projects.

## Responsive Images

Using Astro's Image component, all images on the site are:
- Automatically optimized for different screen sizes
- Served in modern formats (AVIF)
- Properly sized with explicit dimensions
- Responsive with appropriate `sizes` and `widths` attributes

This dramatically improves load times and performance scores.

## Interactive p5.js Canvas

The homepage features an interactive p5.js sketch — a gradient animation that responds to mouse movement. It's hidden on mobile for performance but creates a dynamic, eye-catching header on desktop.

## Sticky Footer

A small but important detail — the footer always stays at the bottom of the viewport using flexbox, eliminating awkward whitespace on short pages.

## Component Architecture

The entire site is built with reusable Astro components:
- `ProjectCard` for project listings
- `WritingItem` for blog posts
- `Navigation` with mobile menu
- `Footer` with social links
- `Social` for consistent social media links

This makes maintenance easy and code DRY (Don't Repeat Yourself).

## Organized CSS Structure

I reorganized the CSS to be more maintainable:
- Global styles in `global.css` (variables, fonts, component styles)
- Page-specific styles scoped to individual pages
- Removed duplicate media queries
- Consolidated responsive breakpoints

## What I Learned

Building these extra features taught me:
- How to manage theme state with CSS custom properties
- Implementing client-side filtering and search
- Working with RSS in a static site generator
- The importance of proper SEO and metadata
- Balancing features with performance

The end result is a portfolio that's not just functional, but polished and thoughtful in its execution.

---

*All code is available on my GitHub, and the site is built with Astro, deployed via GitHub Pages.*
