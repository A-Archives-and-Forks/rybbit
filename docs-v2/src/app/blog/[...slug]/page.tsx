import { notFound } from 'next/navigation';
import { blogSource } from '@/lib/blog-source';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { Metadata } from 'next';

interface BlogPostPageProps {
  params: {
    slug: string[];
  };
}

export function generateStaticParams() {
  return blogSource.getPages().map((page) => ({
    slug: page.slugs,
  }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const params = await props.params;
  const page = blogSource.getPage(params.slug);
  if (!page) return {};

  return {
    title: page.data.title,
    description: page.data.description,
  };
}

export default async function BlogPostPage(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params;
  const page = blogSource.getPage(params.slug);
  
  if (!page) {
    notFound();
  }

  const MDXContent = page.data.body;
  const date = page.data.date ? new Date(page.data.date) : null;

  return (
    <article className="max-w-4xl mx-auto px-4 py-16">
      <Link 
        href="/blog" 
        className="inline-flex items-center text-neutral-400 hover:text-white transition-colors mb-8"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Blog
      </Link>

      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {page.data.title}
        </h1>
        
        {page.data.description && (
          <p className="text-xl text-neutral-400 mb-6">
            {page.data.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-neutral-500 pb-6 border-b border-neutral-800">
          {date && (
            <time dateTime={date.toISOString()}>
              {date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          )}
          
          {page.data.author && (
            <>
              <span>•</span>
              <span>By {page.data.author}</span>
            </>
          )}

          {page.data.tags && page.data.tags.length > 0 && (
            <>
              <span>•</span>
              <div className="flex gap-2">
                {page.data.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs rounded-full bg-neutral-800 text-neutral-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      {page.data.image && (
        <img 
          src={page.data.image} 
          alt={page.data.title}
          className="w-full h-96 object-cover rounded-lg mb-8"
        />
      )}

      <div className="prose prose-invert prose-lg max-w-none">
        <MDXContent />
      </div>
    </article>
  );
}