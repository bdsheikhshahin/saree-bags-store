import type { Metadata } from 'next';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { getBlogPosts } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Blog — Buying Guides & Care Tips',
  description: 'Saree and bag buying guides, how-tos and care tips. Read the blog before you buy.',
};

export default async function BlogPage() {
  const posts = await getBlogPosts();
  return (
    <>
      <h1>Blog</h1>
      <p>Buying guides, how-tos and care tips — each post links to the products it talks about.</p>
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`}><strong>{post.title}</strong></Link>
            <ReactMarkdown>{post.excerpt}</ReactMarkdown>
          </li>
        ))}
      </ul>
    </>
  );
}
