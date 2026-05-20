import { defineCollection, z } from 'astro:content';
import { fetchAllPosts } from './lib/dato';

const projects = defineCollection({
  loader: async () => {
    const posts = await fetchAllPosts();
    return posts.map((post) => ({
      id: post.slug,
      title: post.title.trim(),
      slug: post.slug,
      abstract: post.abstract ?? null,
      year: post.year ?? null,
      websiteUrl: post.websiteUrl?.trim() ? post.websiteUrl : null,
      publishedAt: post._firstPublishedAt,
      updatedAt: post._updatedAt,
      cover: post.blogImage,
      content: post.content,
    }));
  },
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    abstract: z.string().nullable(),
    year: z.number().int().nullable(),
    websiteUrl: z.string().nullable(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    cover: z
      .object({
        url: z.string(),
        width: z.number(),
        height: z.number(),
        alt: z.string().nullable(),
        title: z.string().nullable(),
        responsiveImage: z
          .object({
            src: z.string(),
            srcSet: z.string(),
            webpSrcSet: z.string(),
            sizes: z.string(),
            base64: z.string().nullable(),
            alt: z.string().nullable(),
            title: z.string().nullable(),
          })
          .nullable(),
      })
      .nullable(),
    content: z
      .object({
        value: z.unknown(),
      })
      .nullable(),
  }),
});

export const collections = { projects };
