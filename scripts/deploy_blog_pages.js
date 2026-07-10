#!/usr/bin/env node
'use strict';
/**
 * Deploy redesigned blog pages to nuswalab matching the site theme.
 */
const fs = require('fs');
const path = require('path');

// ── Blog listing page — inside [locale] so next-intl routes correctly ────────
const BLOG_PAGE = "/home/ubuntu/nuswalab/src/app/[locale]/blog/page.tsx";
const BLOG_SLUG_PAGE = "/home/ubuntu/nuswalab/src/app/[locale]/blog/[slug]/page.tsx";

const blogListingContent = `export const revalidate = 3600;

import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts } from '@/lib/blog';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { Calendar, Clock, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';

export const metadata = {
  title: 'Blog | Nuswalab',
  description: 'Artikel terbaru seputar digital marketing, SEO, content marketing, dan strategi bisnis online dari Nuswalab.',
};

export default async function BlogPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const posts = getAllPosts();
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <>
      <Nav />
      <main className="min-h-screen" style={{ background: 'var(--background)' }}>

        {/* Hero */}
        <section className="relative overflow-hidden py-24 md:py-32">
          <div className="bg-aurora" />
          <div className="bg-grid" />
          <div className="orb orb-primary animate-orb" style={{ width: 500, height: 500, top: -100, left: '60%' }} />
          <div className="orb orb-violet animate-orb" style={{ width: 350, height: 350, bottom: -50, left: '5%', animationDelay: '-8s' }} />

          <div className="container-custom relative z-10 text-center">
            <div className="glass inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium" style={{ color: 'var(--color-primary, oklch(0.52 0.22 265))' }}>
              <Sparkles className="w-4 h-4" />
              <span>Blog & Insights</span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
              <span className="text-gradient">Pengetahuan Digital</span>
              <br />
              <span style={{ color: 'var(--foreground)' }}>untuk Bisnis Modern</span>
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: 'var(--muted-foreground)' }}>
              Artikel mendalam seputar SEO, content marketing, dan strategi digital dari tim Nuswalab.
            </p>
          </div>
        </section>

        <div className="container-custom pb-24">

          {/* Featured post */}
          {featured && (
            <div className="mb-16">
              <div className="flex items-center gap-2 mb-6">
                <div style={{ width: 3, height: 20, background: 'var(--gradient-primary)', borderRadius: 2 }} />
                <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Artikel Unggulan</span>
              </div>
              <Link href={\`/blog/\${featured.slug}\`} className="group block">
                <div className="glass rounded-3xl overflow-hidden transition-all duration-300 group-hover:shadow-[var(--shadow-glow)]">
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Image */}
                    <div className="relative aspect-[4/3] md:aspect-auto overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, oklch(0.52 0.22 265 / 0.15), oklch(0.52 0.25 300 / 0.15))' }}>
                      {featured.featuredImage ? (
                        <Image
                          src={featured.featuredImage}
                          alt={featured.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="w-20 h-20" style={{ color: 'oklch(0.52 0.22 265 / 0.3)' }} />
                        </div>
                      )}
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent, oklch(0.99 0.003 265 / 0.1))' }} />
                    </div>
                    {/* Content */}
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {featured.tags?.slice(0, 2).map(tag => (
                          <span key={tag} className="text-xs font-medium px-3 py-1 rounded-full"
                            style={{ background: 'oklch(0.52 0.22 265 / 0.1)', color: 'oklch(0.52 0.22 265)' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h2 className="font-display text-2xl md:text-3xl font-bold mb-4 leading-tight"
                        style={{ color: 'var(--foreground)' }}>
                        {featured.title}
                      </h2>
                      <p className="mb-6 line-clamp-3" style={{ color: 'var(--muted-foreground)' }}>
                        {featured.metaDescription || featured.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(featured.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          {featured.readTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {featured.readTime} menit
                            </span>
                          )}
                        </div>
                        <span className="flex items-center gap-1 text-sm font-semibold transition-gap duration-200 group-hover:gap-2"
                          style={{ color: 'oklch(0.52 0.22 265)' }}>
                          Baca <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Grid */}
          {rest.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-8">
                <div style={{ width: 3, height: 20, background: 'var(--gradient-primary)', borderRadius: 2 }} />
                <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Artikel Terbaru</span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map(post => (
                  <Link key={post.slug} href={\`/blog/\${post.slug}\`} className="group block">
                    <article className="glass rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-glow)]">
                      {/* Thumbnail */}
                      <div className="relative aspect-video overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, oklch(0.52 0.22 265 / 0.1), oklch(0.52 0.25 300 / 0.1))' }}>
                        {post.featuredImage ? (
                          <Image
                            src={post.featuredImage}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="w-12 h-12" style={{ color: 'oklch(0.52 0.22 265 / 0.25)' }} />
                          </div>
                        )}
                      </div>
                      {/* Body */}
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ background: 'oklch(0.52 0.22 265 / 0.1)', color: 'oklch(0.52 0.22 265)' }}>
                            {post.category}
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-lg mb-2 leading-snug line-clamp-2 flex-1"
                          style={{ color: 'var(--foreground)' }}>
                          {post.title}
                        </h3>
                        <p className="text-sm line-clamp-2 mb-4" style={{ color: 'var(--muted-foreground)' }}>
                          {post.metaDescription || post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs mt-auto pt-4"
                          style={{ borderTop: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(post.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {post.wordCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {Math.ceil(post.wordCount / 200)} menit
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </>
          )}

          {posts.length === 0 && (
            <div className="text-center py-24">
              <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
              <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Belum ada artikel</h2>
              <p style={{ color: 'var(--muted-foreground)' }}>Artikel akan segera tersedia.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
`;

const blogSlugContent = `export const revalidate = 3600;

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getPostBySlug, getAllPosts, getRelatedPosts, extractHeadings } from '@/lib/blog';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { Calendar, Clock, ChevronRight, ArrowLeft, BookOpen } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';

interface Props {
  params: { slug: string; locale: string };
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: 'Artikel Tidak Ditemukan' };
  return {
    title: \`\${post.title} | Blog Nuswalab\`,
    description: post.metaDescription,
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  setRequestLocale(params.locale);
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const allPosts = getAllPosts();
  const related = getRelatedPosts ? getRelatedPosts(post, allPosts, 3) : allPosts.filter(p => p.slug !== post.slug).slice(0, 3);
  const headings = extractHeadings ? extractHeadings(post.content) : [];
  const readTime = post.readTime || (post.wordCount ? Math.ceil(post.wordCount / 200) : null);

  return (
    <>
      <Nav />
      <main className="min-h-screen" style={{ background: 'var(--background)' }}>

        {/* Hero */}
        <section className="relative overflow-hidden pt-28 pb-12">
          <div className="bg-aurora" />
          <div className="bg-grid" />
          <div className="orb orb-primary animate-orb" style={{ width: 400, height: 400, top: -80, right: '5%', opacity: 0.5 }} />

          <div className="container-custom relative z-10 max-w-4xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm mb-8" style={{ color: 'var(--muted-foreground)' }}>
              <Link href="/" className="hover:underline" style={{ color: 'var(--muted-foreground)' }}>Beranda</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/blog" className="hover:underline" style={{ color: 'var(--muted-foreground)' }}>Blog</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="line-clamp-1" style={{ color: 'var(--foreground)' }}>{post.title}</span>
            </nav>

            {/* Category + Tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="text-sm font-semibold px-3 py-1 rounded-full"
                style={{ background: 'oklch(0.52 0.22 265 / 0.12)', color: 'oklch(0.52 0.22 265)' }}>
                {post.category}
              </span>
              {post.tags?.slice(0, 3).map(tag => (
                <span key={tag} className="text-sm px-3 py-1 rounded-full"
                  style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="font-display text-3xl md:text-5xl font-bold mb-6 leading-tight"
              style={{ color: 'var(--foreground)' }}>
              {post.title}
            </h1>

            {post.metaDescription && (
              <p className="text-lg md:text-xl mb-8 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                {post.metaDescription}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm pb-8"
              style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(post.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {readTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {readTime} menit baca
                </span>
              )}
              {post.wordCount > 0 && (
                <span>{post.wordCount.toLocaleString('id-ID')} kata</span>
              )}
            </div>
          </div>
        </section>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="container-custom max-w-4xl mb-0 -mt-2">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
              <Image src={post.featuredImage} alt={post.title} fill className="object-cover" priority />
            </div>
          </div>
        )}

        {/* Content area */}
        <div className="container-custom max-w-6xl py-12">
          <div className="grid lg:grid-cols-[1fr_280px] gap-12">

            {/* Article body */}
            <article>
              <div
                className="prose prose-lg max-w-none"
                style={{
                  '--tw-prose-body': 'var(--foreground)',
                  '--tw-prose-headings': 'var(--foreground)',
                  '--tw-prose-links': 'oklch(0.52 0.22 265)',
                  '--tw-prose-bold': 'var(--foreground)',
                  '--tw-prose-counters': 'var(--muted-foreground)',
                  '--tw-prose-bullets': 'oklch(0.52 0.22 265)',
                  '--tw-prose-hr': 'var(--border)',
                  '--tw-prose-quotes': 'var(--foreground)',
                  '--tw-prose-quote-borders': 'oklch(0.52 0.22 265)',
                  '--tw-prose-captions': 'var(--muted-foreground)',
                  '--tw-prose-code': 'var(--foreground)',
                  '--tw-prose-pre-bg': 'var(--muted)',
                } as React.CSSProperties}
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Back link */}
              <div className="mt-12 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
                <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: 'oklch(0.52 0.22 265)' }}>
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke Blog
                </Link>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* TOC */}
              {headings.length > 0 && (
                <div className="glass rounded-2xl p-6 sticky top-24">
                  <h3 className="font-display font-bold text-sm uppercase tracking-widest mb-4"
                    style={{ color: 'var(--muted-foreground)' }}>
                    Daftar Isi
                  </h3>
                  <nav className="space-y-2">
                    {headings.map((h: { id: string; text: string; level: number }, i: number) => (
                      <a key={i} href={\`#\${h.id}\`}
                        className="block text-sm leading-snug hover:opacity-80 transition-opacity"
                        style={{
                          color: h.level === 2 ? 'var(--foreground)' : 'var(--muted-foreground)',
                          paddingLeft: h.level === 3 ? '0.75rem' : '0',
                          borderLeft: h.level === 3 ? '2px solid var(--border)' : 'none',
                        }}>
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* Article info */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-display font-bold text-sm uppercase tracking-widest mb-4"
                  style={{ color: 'var(--muted-foreground)' }}>
                  Info Artikel
                </h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="font-medium mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Kategori</dt>
                    <dd style={{ color: 'var(--foreground)' }}>{post.category}</dd>
                  </div>
                  <div>
                    <dt className="font-medium mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Diterbitkan</dt>
                    <dd style={{ color: 'var(--foreground)' }}>
                      {new Date(post.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </dd>
                  </div>
                  {readTime && (
                    <div>
                      <dt className="font-medium mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Waktu Baca</dt>
                      <dd style={{ color: 'var(--foreground)' }}>{readTime} menit</dd>
                    </div>
                  )}
                  {post.focusKeyword && (
                    <div>
                      <dt className="font-medium mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Topik Utama</dt>
                      <dd style={{ color: 'var(--foreground)' }}>{post.focusKeyword}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </aside>
          </div>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <section className="py-16" style={{ background: 'var(--muted)' }}>
            <div className="container-custom">
              <div className="flex items-center gap-2 mb-8">
                <div style={{ width: 3, height: 20, background: 'var(--gradient-primary)', borderRadius: 2 }} />
                <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Artikel Terkait</span>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {related.map(rel => (
                  <Link key={rel.slug} href={\`/blog/\${rel.slug}\`} className="group block">
                    <article className="glass rounded-2xl overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-glow)]">
                      <div className="relative aspect-video"
                        style={{ background: 'linear-gradient(135deg, oklch(0.52 0.22 265 / 0.1), oklch(0.52 0.25 300 / 0.1))' }}>
                        {rel.featuredImage ? (
                          <Image src={rel.featuredImage} alt={rel.title} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="w-10 h-10" style={{ color: 'oklch(0.52 0.22 265 / 0.25)' }} />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h4 className="font-display font-bold leading-snug line-clamp-2 mb-2" style={{ color: 'var(--foreground)' }}>
                          {rel.title}
                        </h4>
                        <p className="text-sm line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
                          {rel.metaDescription || rel.excerpt}
                        </p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
`;

fs.writeFileSync(BLOG_PAGE, blogListingContent, 'utf8');
console.log('[blog/page.tsx] Written');

// Ensure [slug] directory exists
const slugDir = path.dirname(BLOG_SLUG_PAGE);
fs.mkdirSync(slugDir, { recursive: true });

fs.writeFileSync(BLOG_SLUG_PAGE, blogSlugContent, 'utf8');
console.log('[blog/[slug]/page.tsx] Written');

console.log('Blog pages deployed. Rebuild nuswalab to apply.');
