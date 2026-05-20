import { executeQuery } from '@datocms/cda-client';

const DATOCMS_TOKEN = import.meta.env.DATOCMS_READONLY_TOKEN;

if (!DATOCMS_TOKEN) {
  throw new Error(
    'DATOCMS_READONLY_TOKEN non è settato. Aggiungilo a .env prima del build.',
  );
}

export async function datoQuery<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  return executeQuery<T>(query, {
    token: DATOCMS_TOKEN,
    variables,
  });
}

export type DatoImage = {
  url: string;
  width: number;
  height: number;
  alt: string | null;
  title: string | null;
  responsiveImage: {
    src: string;
    srcSet: string;
    webpSrcSet: string;
    sizes: string;
    base64: string | null;
    alt: string | null;
    title: string | null;
  } | null;
};

export type DatoStructuredText = {
  value: unknown;
};

export type DatoPost = {
  id: string;
  title: string;
  slug: string;
  abstract: string | null;
  year: number | null;
  websiteUrl: string | null;
  blogImage: DatoImage | null;
  content: DatoStructuredText | null;
  _firstPublishedAt: string;
  _updatedAt: string;
};

const POST_FRAGMENT = `
  id
  title
  slug
  abstract
  year
  websiteUrl
  _firstPublishedAt
  _updatedAt
  blogImage {
    url
    width
    height
    alt
    title
    responsiveImage(imgixParams: { auto: format, fit: max, w: 1600, q: 82 }) {
      src
      srcSet
      webpSrcSet
      sizes
      base64
      alt
      title
    }
  }
  content {
    value
  }
`;

export async function fetchAllPosts(): Promise<DatoPost[]> {
  const data = await datoQuery<{ allPosts: DatoPost[] }>(`
    query AllPosts {
      allPosts(first: 100, orderBy: _firstPublishedAt_DESC) {
        ${POST_FRAGMENT}
      }
    }
  `);
  return data.allPosts;
}
