#!/usr/bin/env node
'use strict';
/**
 * Deploy redesigned blog pages to nuswalab matching the site theme.
 * Improvements: category filter, JSON-LD schema, fixed TOC, CTA, share buttons, sitemap patch,
 * ReadingProgress, AuthorBox, BlogSearch, tag page, next/prev nav, HowTo schema.
 */
const fs = require('fs');
const path = require('path');

const BLOG_PAGE        = "/home/ubuntu/nuswalab/src/app/[locale]/blog/page.tsx";
const BLOG_SLUG_PAGE   = "/home/ubuntu/nuswalab/src/app/[locale]/blog/[slug]/page.tsx";
const BLOG_TAG_PAGE    = "/home/ubuntu/nuswalab/src/app/[locale]/blog/tag/[tag]/page.tsx";
const SHARE_BTN_FILE   = "/home/ubuntu/nuswalab/src/components/blog/ShareButtons.tsx";
const READING_PROGRESS = "/home/ubuntu/nuswalab/src/components/blog/ReadingProgress.tsx";
const AUTHOR_BOX_FILE  = "/home/ubuntu/nuswalab/src/components/blog/AuthorBox.tsx";
const BLOG_SEARCH_FILE = "/home/ubuntu/nuswalab/src/components/blog/BlogSearch.tsx";
const SITEMAP_FILE     = "/home/ubuntu/nuswalab/src/app/sitemap.ts";
const BLOG_LIB         = "/home/ubuntu/nuswalab/src/lib/blog.ts";

// ── 1. Fix extractHeadings in lib/blog.ts to include h2+h3 with level ────────
let blogLib = fs.readFileSync(BLOG_LIB, 'utf8');
const OLD_EXTRACT = `export function extractHeadings(html: string): { id: string; text: string }[] {
  const matches = [...html.matchAll(/<h2[^>]*>(.*?)<\\/h2>/gi)];
  return matches.map(m => {
    const text = m[1].replace(/<[^>]+>/g, '');
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return { id, text };
  });
}`;
const NEW_EXTRACT = `export function extractHeadings(html: string): { id: string; text: string; level: number }[] {
  const matches = [...html.matchAll(/<(h[23])[^>]*>(.*?)<\\/\\1>/gi)];
  return matches.map(m => {
    const level = parseInt(m[1][1]);
    const text = m[2].replace(/<[^>]+>/g, '');
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return { id, text, level };
  });
}`;
if (blogLib.includes(OLD_EXTRACT)) {
  blogLib = blogLib.replace(OLD_EXTRACT, NEW_EXTRACT);
  fs.writeFileSync(BLOG_LIB, blogLib, 'utf8');
  console.log('[lib/blog.ts] extractHeadings patched: h2+h3 with level');
} else if (!blogLib.includes('level: number')) {
  console.log('[lib/blog.ts] extractHeadings: already patched or unexpected format, skipping');
} else {
  console.log('[lib/blog.ts] extractHeadings: already has level field');
}

// ── 2. ShareButtons client component ─────────────────────────────────────────
fs.mkdirSync(path.dirname(SHARE_BTN_FILE), { recursive: true });
fs.writeFileSync(SHARE_BTN_FILE, `'use client';
import { useState } from 'react';
import { Link2, Check, MessageCircle } from 'lucide-react';

interface Props { url: string; title: string; }

export function ShareButtons({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url); } catch { }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const waUrl = \`https://wa.me/?text=\${encodeURIComponent(title + '\\n' + url)}\`;

  return (
    <div className="flex flex-wrap items-center gap-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
      <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Bagikan artikel:</span>
      <a href={waUrl} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full transition-opacity hover:opacity-80"
        style={{ background: '#25D366', color: '#fff' }}>
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </a>
      <button onClick={copyLink}
        className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full glass transition-all"
        style={{ color: copied ? 'oklch(0.52 0.22 265)' : 'var(--foreground)' }}>
        {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
        {copied ? 'Tersalin!' : 'Salin Link'}
      </button>
    </div>
  );
}
`, 'utf8');
console.log('[ShareButtons.tsx] Written');

// ── 3. ReadingProgress client component ──────────────────────────────────────
fs.mkdirSync(path.dirname(READING_PROGRESS), { recursive: true });
fs.writeFileSync(READING_PROGRESS, `'use client';
import { useEffect, useState } from 'react';

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: '3px',
        background: 'var(--muted)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '100%',
          width: \`\${progress}%\`,
          background: 'var(--gradient-primary, oklch(0.52 0.22 265))',
          transition: 'width 0.1s linear',
        }}
      />
    </div>
  );
}
`, 'utf8');
console.log('[ReadingProgress.tsx] Written');

// ── 4. AuthorBox static component ────────────────────────────────────────────
fs.mkdirSync(path.dirname(AUTHOR_BOX_FILE), { recursive: true });
fs.writeFileSync(AUTHOR_BOX_FILE, `import Link from 'next/link';

export function AuthorBox() {
  return (
    <div
      className="glass rounded-2xl p-6 mt-10"
      style={{ background: 'linear-gradient(135deg, oklch(0.52 0.22 265 / 0.06), oklch(0.52 0.25 300 / 0.06))' }}
    >
      <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        {/* Avatar */}
        <div
          className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center font-display font-bold text-lg"
          style={{ background: 'oklch(0.52 0.22 265 / 0.18)', color: 'oklch(0.52 0.22 265)' }}
        >
          NL
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-base mb-0.5" style={{ color: 'var(--foreground)' }}>
            Tim Nuswa Lab
          </p>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Tim ahli digital marketing Nuswa Lab dengan pengalaman membantu ratusan bisnis berkembang secara online di Indonesia.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full glass transition-opacity hover:opacity-80"
              style={{ color: 'var(--foreground)' }}
            >
              Tentang Kami
            </Link>
            <Link href="/contact" className="btn-primary text-sm py-2 px-4">
              Konsultasi Gratis
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
`, 'utf8');
console.log('[AuthorBox.tsx] Written');

// ── 5. BlogSearch client component ───────────────────────────────────────────
fs.mkdirSync(path.dirname(BLOG_SEARCH_FILE), { recursive: true });
fs.writeFileSync(BLOG_SEARCH_FILE, `'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, BookOpen, Calendar, Clock } from 'lucide-react';

export interface PostMeta {
  slug: string;
  title: string;
  metaDescription?: string;
  category?: string;
  tags?: string[];
  featuredImage?: string;
  publishedAt: string;
  wordCount?: number;
  readingTime?: number;
}

interface Props {
  posts: PostMeta[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'SEO':               'oklch(0.52 0.22 265)',
  'Google Ads':        'oklch(0.55 0.20 30)',
  'Social Media':      'oklch(0.52 0.22 300)',
  'Website':           'oklch(0.48 0.18 200)',
  'Digital Marketing': 'oklch(0.50 0.20 160)',
};
const getCatColor = (cat: string) => CATEGORY_COLORS[cat] || 'oklch(0.52 0.22 265)';

export function BlogSearch({ posts }: Props) {
  const [query, setQuery] = useState('');

  if (!query.trim()) {
    return (
      <div className="mb-8">
        <div className="relative max-w-xl">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: 'var(--muted-foreground)' }}
          />
          <input
            type="search"
            placeholder="Cari artikel..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="glass w-full pl-11 pr-4 py-3 rounded-full text-sm outline-none transition-all"
            style={{ color: 'var(--foreground)', background: 'var(--muted)' }}
          />
        </div>
      </div>
    );
  }

  const q = query.toLowerCase();
  const results = posts.filter(p =>
    p.title.toLowerCase().includes(q) ||
    (p.metaDescription || '').toLowerCase().includes(q) ||
    (p.category || '').toLowerCase().includes(q) ||
    (p.tags || []).some(t => t.toLowerCase().includes(q))
  );

  return (
    <div className="mb-10">
      {/* Input */}
      <div className="relative max-w-xl mb-6">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--muted-foreground)' }}
        />
        <input
          type="search"
          placeholder="Cari artikel..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="glass w-full pl-11 pr-4 py-3 rounded-full text-sm outline-none transition-all"
          style={{ color: 'var(--foreground)', background: 'var(--muted)' }}
        />
      </div>

      {/* Result header */}
      <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{results.length} hasil</span>
        {' '}untuk &ldquo;{query}&rdquo;
      </p>

      {/* Empty state */}
      {results.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
          <p className="font-display font-bold text-lg mb-1" style={{ color: 'var(--foreground)' }}>
            Tidak ada hasil
          </p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Coba kata kunci lain atau jelajahi kategori di atas.
          </p>
        </div>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map(post => (
            <Link key={post.slug} href={\`/blog/\${post.slug}\`} className="group block">
              <article className="glass rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-glow)]">
                <div
                  className="relative aspect-video overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, oklch(0.52 0.22 265 / 0.1), oklch(0.52 0.25 300 / 0.1))' }}
                >
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
                <div className="p-6 flex flex-col flex-1">
                  {post.category && (
                    <span
                      className="inline-flex self-start text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3"
                      style={{ background: 'oklch(0.52 0.22 265 / 0.1)', color: getCatColor(post.category) }}
                    >
                      {post.category}
                    </span>
                  )}
                  <h3
                    className="font-display font-bold text-lg mb-2 leading-snug line-clamp-2 flex-1"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {post.title}
                  </h3>
                  <p className="text-sm line-clamp-2 mb-4" style={{ color: 'var(--muted-foreground)' }}>
                    {post.metaDescription}
                  </p>
                  <div
                    className="flex items-center justify-between text-xs mt-auto pt-4"
                    style={{ borderTop: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
                  >
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {(post.readingTime || post.wordCount) && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {post.readingTime || Math.ceil((post.wordCount || 800) / 200)} menit
                      </span>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
`, 'utf8');
console.log('[BlogSearch.tsx] Written');

// ── 6. Blog listing page with BlogSearch + tag links ─────────────────────────
const blogListingContent = `export const revalidate = 3600;

import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts } from '@/lib/blog';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { BlogSearch } from '@/components/blog/BlogSearch';
import { Calendar, Clock, ArrowRight, BookOpen, Sparkles, Tag } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';

export const metadata = {
  title: 'Blog | Nuswalab — Tips Digital Marketing & Strategi Bisnis',
  description: 'Artikel mendalam seputar SEO, Google Ads, Social Media, pembuatan website, dan strategi digital marketing dari tim ahli Nuswalab.',
  openGraph: {
    title: 'Blog Nuswalab — Digital Marketing Insights',
    description: 'Artikel mendalam seputar SEO, Google Ads, Social Media, dan strategi digital marketing.',
    images: [{ url: 'https://nuswalab.com/og-image.jpg', width: 1200, height: 630 }],
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  'SEO':              'oklch(0.52 0.22 265)',
  'Google Ads':       'oklch(0.55 0.20 30)',
  'Social Media':     'oklch(0.52 0.22 300)',
  'Website':          'oklch(0.48 0.18 200)',
  'Digital Marketing':'oklch(0.50 0.20 160)',
};

const getCatColor = (cat: string) => CATEGORY_COLORS[cat] || 'oklch(0.52 0.22 265)';

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { locale } = await params;
  const { cat } = await searchParams;
  setRequestLocale(locale);

  const allPosts   = getAllPosts();
  const categories = [...new Set(allPosts.map(p => p.category).filter(Boolean))] as string[];

  const filtered = cat && cat !== 'Semua'
    ? allPosts.filter(p => p.category === cat)
    : allPosts;

  const featured = filtered[0];
  const rest     = filtered.slice(1);

  const postsMeta = allPosts.map(p => ({
    slug: p.slug,
    title: p.title,
    metaDescription: p.metaDescription || p.excerpt || '',
    category: p.category || '',
    tags: p.tags || [],
    featuredImage: p.featuredImage || '',
    publishedAt: p.publishedAt,
    wordCount: p.wordCount || 0,
    readingTime: p.readingTime || p.readTime || Math.ceil((p.wordCount || 800) / 200),
  }));

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
            <div className="glass inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium"
              style={{ color: 'oklch(0.52 0.22 265)' }}>
              <Sparkles className="w-4 h-4" />
              <span>Blog & Insights</span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
              <span className="text-gradient">Pengetahuan Digital</span>
              <br />
              <span style={{ color: 'var(--foreground)' }}>untuk Bisnis Modern</span>
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }}>
              Artikel mendalam seputar SEO, Google Ads, Social Media, dan strategi digital dari tim Nuswalab.
            </p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {allPosts.length} artikel tersedia
            </p>
          </div>
        </section>

        <div className="container-custom pb-24">

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-10">
            {['Semua', ...categories].map(c => {
              const isActive = (cat === c) || (!cat && c === 'Semua');
              return (
                <Link
                  key={c}
                  href={c === 'Semua' ? '/blog' : \`/blog?cat=\${encodeURIComponent(c)}\`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                  style={isActive ? {
                    background: c === 'Semua' ? 'oklch(0.52 0.22 265)' : getCatColor(c),
                    color: '#fff',
                    boxShadow: '0 2px 12px oklch(0.52 0.22 265 / 0.35)',
                  } : {
                    background: 'var(--muted)',
                    color: 'var(--muted-foreground)',
                  }}>
                  {c !== 'Semua' && <Tag className="w-3 h-3" />}
                  {c}
                  {c !== 'Semua' && (
                    <span className="text-xs opacity-70 ml-0.5">
                      ({allPosts.filter(p => p.category === c).length})
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Blog Search */}
          <BlogSearch posts={postsMeta} />

          {/* Featured post */}
          {featured && (
            <div className="mb-16">
              <div className="flex items-center gap-2 mb-6">
                <div style={{ width: 3, height: 20, background: 'var(--gradient-primary)', borderRadius: 2 }} />
                <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                  {cat ? \`Artikel \${cat} Unggulan\` : 'Artikel Unggulan'}
                </span>
              </div>
              <Link href={\`/blog/\${featured.slug}\`} className="group block">
                <div className="glass rounded-3xl overflow-hidden transition-all duration-300 group-hover:shadow-[var(--shadow-glow)]">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative aspect-[4/3] md:aspect-auto overflow-hidden"
                      style={{ background: \`linear-gradient(135deg, \${getCatColor(featured.category || '')} / 0.15, oklch(0.52 0.25 300 / 0.15))\` }}>
                      {featured.featuredImage ? (
                        <Image src={featured.featuredImage} alt={featured.title} fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="w-20 h-20" style={{ color: 'oklch(0.52 0.22 265 / 0.3)' }} />
                        </div>
                      )}
                    </div>
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                      {featured.category && (
                        <span className="inline-flex self-start text-xs font-semibold px-3 py-1 rounded-full mb-4"
                          style={{ background: \`oklch(from \${getCatColor(featured.category)} l c h / 0.12)\`, color: getCatColor(featured.category) }}>
                          {featured.category}
                        </span>
                      )}
                      <h2 className="font-display text-2xl md:text-3xl font-bold mb-4 leading-tight"
                        style={{ color: 'var(--foreground)' }}>
                        {featured.title}
                      </h2>
                      <p className="mb-4 line-clamp-3" style={{ color: 'var(--muted-foreground)' }}>
                        {featured.metaDescription || featured.excerpt}
                      </p>
                      {/* Tag links */}
                      {featured.tags && featured.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {featured.tags.slice(0, 2).map(tag => (
                            <Link
                              key={tag}
                              href={\`/blog/tag/\${encodeURIComponent(tag)}\`}
                              onClick={e => e.stopPropagation()}
                              className="text-xs px-2.5 py-0.5 rounded-full transition-opacity hover:opacity-80"
                              style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                            >
                              #{tag}
                            </Link>
                          ))}
                        </div>
                      )}
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
                        <span className="flex items-center gap-1 text-sm font-semibold"
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
                      <div className="relative aspect-video overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, oklch(0.52 0.22 265 / 0.1), oklch(0.52 0.25 300 / 0.1))' }}>
                        {post.featuredImage ? (
                          <Image src={post.featuredImage} alt={post.title} fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="w-12 h-12" style={{ color: 'oklch(0.52 0.22 265 / 0.25)' }} />
                          </div>
                        )}
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        {post.category && (
                          <span className="inline-flex self-start text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3"
                            style={{ background: 'oklch(0.52 0.22 265 / 0.1)', color: getCatColor(post.category) }}>
                            {post.category}
                          </span>
                        )}
                        <h3 className="font-display font-bold text-lg mb-2 leading-snug line-clamp-2 flex-1"
                          style={{ color: 'var(--foreground)' }}>
                          {post.title}
                        </h3>
                        <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--muted-foreground)' }}>
                          {post.metaDescription || post.excerpt}
                        </p>
                        {/* Tag links */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {post.tags.slice(0, 2).map(tag => (
                              <Link
                                key={tag}
                                href={\`/blog/tag/\${encodeURIComponent(tag)}\`}
                                onClick={e => e.stopPropagation()}
                                className="text-xs px-2 py-0.5 rounded-full transition-opacity hover:opacity-80"
                                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                              >
                                #{tag}
                              </Link>
                            ))}
                          </div>
                        )}
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

          {filtered.length === 0 && (
            <div className="text-center py-24">
              <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
              <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                Belum ada artikel {cat ? \`kategori \${cat}\` : ''}
              </h2>
              <p className="mb-6" style={{ color: 'var(--muted-foreground)' }}>Artikel akan segera tersedia.</p>
              {cat && (
                <Link href="/blog" className="btn-primary">Lihat Semua Artikel</Link>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
`;

// ── 7. Blog slug page with all improvements ───────────────────────────────────
const blogSlugContent = `export const revalidate = 3600;

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getPostBySlug, getAllPosts, getRelatedPosts, extractHeadings } from '@/lib/blog';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { ReadingProgress } from '@/components/blog/ReadingProgress';
import { AuthorBox } from '@/components/blog/AuthorBox';
import { Calendar, Clock, ChevronRight, ArrowLeft, ArrowRight, BookOpen, Phone } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';

const BASE_URL = 'https://nuswalab.com';

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return ['id', 'en'].flatMap(locale => posts.map(p => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Artikel Tidak Ditemukan' };
  const ogImage = post.featuredImage
    ? post.featuredImage.startsWith('http') ? post.featuredImage : \`\${BASE_URL}\${post.featuredImage}\`
    : \`\${BASE_URL}/og-image.jpg\`;
  return {
    title: \`\${post.title} | Blog Nuswalab\`,
    description: post.metaDescription,
    keywords: post.tags?.join(', '),
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      url: \`\${BASE_URL}/blog/\${post.slug}\`,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      tags: post.tags,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.metaDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: \`\${BASE_URL}/blog/\${post.slug}\`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const allPostsList = getAllPosts();
  const currentIdx   = allPostsList.findIndex(p => p.slug === slug);
  const prevPost     = currentIdx < allPostsList.length - 1 ? allPostsList[currentIdx + 1] : null;
  const nextPost     = currentIdx > 0 ? allPostsList[currentIdx - 1] : null;

  const related  = getRelatedPosts(post.slug, post.focusKeyword || post.category || '', 3);
  const headings = extractHeadings(post.content);
  const readTime = post.readTime || post.readingTime || (post.wordCount ? Math.ceil(post.wordCount / 200) : null);
  const pageUrl  = \`\${BASE_URL}/blog/\${post.slug}\`;
  const ogImage  = post.featuredImage
    ? post.featuredImage.startsWith('http') ? post.featuredImage : \`\${BASE_URL}\${post.featuredImage}\`
    : null;

  // JSON-LD Article schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    image: ogImage ? [ogImage] : [],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: post.author
      ? { '@type': 'Organization', name: post.author.name, url: post.author.url }
      : { '@type': 'Organization', name: 'Nuswalab', url: BASE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Nuswalab',
      logo: { '@type': 'ImageObject', url: \`\${BASE_URL}/logo.png\` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
    keywords: post.focusKeyword || post.tags?.join(', '),
    wordCount: post.wordCount,
    articleSection: post.category,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['article h2:first-of-type', '.article-intro', '.key-takeaways'],
    },
  };

  // FAQPage schema (if article has FAQ items)
  const faqJsonLd = post.faqItems && post.faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faqItems.map((item: { question: string; answer: string }) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  } : null;

  // BreadcrumbList schema
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Beranda', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: \`\${BASE_URL}/blog\` },
      { '@type': 'ListItem', position: 3, name: post.title, item: pageUrl },
    ],
  };

  // HowTo schema — extract first <ol> steps if >= 3 items
  const olMatch = post.content.match(/<ol[^>]*>([\\s\\S]*?)<\\/ol>/i);
  const liMatches = olMatch ? [...olMatch[1].matchAll(/<li[^>]*>([\\s\\S]*?)<\\/li>/gi)] : [];
  const howToSteps = liMatches.map((m: RegExpMatchArray, i: number) => ({
    '@type': 'HowToStep',
    position: i + 1,
    text: m[1].replace(/<[^>]+>/g, '').trim(),
  }));
  const howToJsonLd = howToSteps.length >= 3 ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: post.title,
    description: post.metaDescription,
    step: howToSteps,
  } : null;

  return (
    <>
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      {howToJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />}

      <Nav />
      <main className="min-h-screen" style={{ background: 'var(--background)' }}>

        {/* Hero */}
        <section className="relative overflow-hidden pt-28 pb-12">
          <div className="bg-aurora" />
          <div className="bg-grid" />
          <div className="orb orb-primary animate-orb" style={{ width: 400, height: 400, top: -80, right: '5%', opacity: 0.5 }} />

          <div className="container-custom relative z-10 max-w-4xl">
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="flex items-center gap-2 text-sm mb-8" style={{ color: 'var(--muted-foreground)' }}>
              <Link href="/" className="hover:underline">Beranda</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/blog" className="hover:underline">Blog</Link>
              {post.category && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <Link href={\`/blog?cat=\${encodeURIComponent(post.category)}\`} className="hover:underline">
                    {post.category}
                  </Link>
                </>
              )}
              <ChevronRight className="w-4 h-4" />
              <span className="line-clamp-1" style={{ color: 'var(--foreground)' }}>{post.title}</span>
            </nav>

            {/* Category badge */}
            {post.category && (
              <div className="mb-5">
                <Link href={\`/blog?cat=\${encodeURIComponent(post.category)}\`}
                  className="text-sm font-semibold px-3 py-1 rounded-full transition-opacity hover:opacity-80"
                  style={{ background: 'oklch(0.52 0.22 265 / 0.12)', color: 'oklch(0.52 0.22 265)' }}>
                  {post.category}
                </Link>
              </div>
            )}

            <h1 className="font-display text-3xl md:text-5xl font-bold mb-6 leading-tight"
              style={{ color: 'var(--foreground)' }}>
              {post.title}
            </h1>

            {post.metaDescription && (
              <p className="text-lg md:text-xl mb-6 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                {post.metaDescription}
              </p>
            )}

            {/* Tag pills */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={\`/blog/tag/\${encodeURIComponent(tag)}\`}
                    className="text-xs px-3 py-1 rounded-full transition-opacity hover:opacity-80"
                    style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
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
        {ogImage && (
          <div className="container-custom max-w-4xl mb-0 -mt-2">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
              <Image src={ogImage} alt={post.title} fill className="object-cover" priority />
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

              {/* Share buttons */}
              <ShareButtons url={pageUrl} title={post.title} />

              {/* Author box */}
              <AuthorBox />

              {/* CTA */}
              <div className="mt-10 glass rounded-2xl p-8 text-center"
                style={{ background: 'linear-gradient(135deg, oklch(0.52 0.22 265 / 0.08), oklch(0.52 0.25 300 / 0.08))' }}>
                <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'oklch(0.52 0.22 265 / 0.15)' }}>
                  <Phone className="w-6 h-6" style={{ color: 'oklch(0.52 0.22 265)' }} />
                </div>
                <h3 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                  Butuh Bantuan Digital Marketing?
                </h3>
                <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--muted-foreground)' }}>
                  Tim Nuswalab siap membantu bisnis Anda tumbuh dengan strategi SEO, Google Ads, Social Media, dan Website profesional.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link href="/contact" className="btn-primary">Konsultasi Gratis</Link>
                  <Link href="/service/jasa-digital-marketing-360"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium glass transition-opacity hover:opacity-80"
                    style={{ color: 'var(--foreground)' }}>
                    Lihat Layanan
                  </Link>
                </div>
              </div>

              {/* Prev / Next navigation */}
              {(prevPost || nextPost) && (
                <div className="mt-10 grid sm:grid-cols-2 gap-4">
                  {prevPost ? (
                    <Link href={\`/blog/\${prevPost.slug}\`} className="group block">
                      <div className="glass rounded-2xl p-5 h-full flex items-start gap-3 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-glow)]">
                        <ArrowLeft className="w-5 h-5 mt-0.5 flex-shrink-0 transition-transform duration-200 group-hover:-translate-x-1"
                          style={{ color: 'oklch(0.52 0.22 265)' }} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Artikel Sebelumnya</p>
                          <p className="text-sm font-semibold line-clamp-2" style={{ color: 'var(--foreground)' }}>
                            {prevPost.title}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ) : <div />}
                  {nextPost ? (
                    <Link href={\`/blog/\${nextPost.slug}\`} className="group block sm:text-right">
                      <div className="glass rounded-2xl p-5 h-full flex items-start gap-3 justify-end transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-glow)]">
                        <div className="min-w-0">
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Artikel Berikutnya</p>
                          <p className="text-sm font-semibold line-clamp-2" style={{ color: 'var(--foreground)' }}>
                            {nextPost.title}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 mt-0.5 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                          style={{ color: 'oklch(0.52 0.22 265)' }} />
                      </div>
                    </Link>
                  ) : <div />}
                </div>
              )}

              {/* Back link */}
              <div className="mt-8">
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
                <div className="glass rounded-2xl p-6" style={{ position: 'sticky', top: '100px' }}>
                  <h3 className="font-display font-bold text-sm uppercase tracking-widest mb-4"
                    style={{ color: 'var(--muted-foreground)' }}>
                    Daftar Isi
                  </h3>
                  <nav aria-label="table of contents" className="space-y-2">
                    {headings.map((h, i) => (
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
                  {post.category && (
                    <div>
                      <dt className="font-medium mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Kategori</dt>
                      <dd>
                        <Link href={\`/blog?cat=\${encodeURIComponent(post.category)}\`}
                          className="hover:underline" style={{ color: 'oklch(0.52 0.22 265)' }}>
                          {post.category}
                        </Link>
                      </dd>
                    </div>
                  )}
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

              {/* Mini CTA sidebar */}
              <div className="glass rounded-2xl p-6 text-center"
                style={{ background: 'linear-gradient(135deg, oklch(0.52 0.22 265 / 0.06), oklch(0.52 0.25 300 / 0.06))' }}>
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                  Siap tingkatkan bisnis Anda?
                </p>
                <Link href="/contact" className="btn-primary w-full text-center block text-sm py-2.5">
                  Hubungi Kami
                </Link>
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
                <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                  Artikel Terkait
                </span>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {related.map(rel => (
                  <Link key={rel.slug} href={\`/blog/\${rel.slug}\`} className="group block">
                    <article className="glass rounded-2xl overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-glow)]">
                      <div className="relative aspect-video"
                        style={{ background: 'linear-gradient(135deg, oklch(0.52 0.22 265 / 0.1), oklch(0.52 0.25 300 / 0.1))' }}>
                        {rel.featuredImage ? (
                          <Image src={rel.featuredImage.startsWith('http') ? rel.featuredImage : rel.featuredImage}
                            alt={rel.title} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="w-10 h-10" style={{ color: 'oklch(0.52 0.22 265 / 0.25)' }} />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        {rel.category && (
                          <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded-full mb-2"
                            style={{ background: 'oklch(0.52 0.22 265 / 0.1)', color: 'oklch(0.52 0.22 265)' }}>
                            {rel.category}
                          </span>
                        )}
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

// ── 8. Tag page ───────────────────────────────────────────────────────────────
const blogTagContent = `export const revalidate = 3600;

import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts } from '@/lib/blog';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { Calendar, Clock, BookOpen, ArrowLeft, Tag } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';

const CATEGORY_COLORS: Record<string, string> = {
  'SEO':               'oklch(0.52 0.22 265)',
  'Google Ads':        'oklch(0.55 0.20 30)',
  'Social Media':      'oklch(0.52 0.22 300)',
  'Website':           'oklch(0.48 0.18 200)',
  'Digital Marketing': 'oklch(0.50 0.20 160)',
};
const getCatColor = (cat: string) => CATEGORY_COLORS[cat] || 'oklch(0.52 0.22 265)';

interface Props {
  params: Promise<{ tag: string; locale: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  const allTags = new Set<string>();
  posts.forEach(p => (p.tags || []).forEach((t: string) => allTags.add(t)));
  return ['id', 'en'].flatMap(locale =>
    [...allTags].map(tag => ({ locale, tag: encodeURIComponent(tag) }))
  );
}

export async function generateMetadata({ params }: Props) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  return {
    title: \`Artikel Tag #\${decodedTag} | Blog Nuswalab\`,
    description: \`Kumpulan artikel bertag #\${decodedTag} dari blog Nuswalab. Tips dan strategi digital marketing terpercaya.\`,
  };
}

export default async function TagPage({ params }: Props) {
  const { tag, locale } = await params;
  setRequestLocale(locale);

  const decodedTag = decodeURIComponent(tag);
  const allPosts = getAllPosts();
  const posts = allPosts.filter(p => (p.tags || []).includes(decodedTag));

  return (
    <>
      <Nav />
      <main className="min-h-screen" style={{ background: 'var(--background)' }}>

        {/* Hero */}
        <section className="relative overflow-hidden py-20 md:py-28">
          <div className="bg-aurora" />
          <div className="bg-grid" />
          <div className="orb orb-primary animate-orb" style={{ width: 400, height: 400, top: -80, left: '60%', opacity: 0.5 }} />

          <div className="container-custom relative z-10 text-center">
            <div className="glass inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium"
              style={{ color: 'oklch(0.52 0.22 265)' }}>
              <Tag className="w-4 h-4" />
              <span>Tag</span>
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Artikel Tag:</span>
              <br />
              <span style={{ color: 'var(--foreground)' }}>#{decodedTag}</span>
            </h1>
            <p className="text-base md:text-lg mb-6" style={{ color: 'var(--muted-foreground)' }}>
              {posts.length} artikel ditemukan
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: 'oklch(0.52 0.22 265)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Blog
            </Link>
          </div>
        </section>

        <div className="container-custom pb-24">
          {posts.length === 0 ? (
            <div className="text-center py-24">
              <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
              <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                Belum ada artikel dengan tag ini
              </h2>
              <p className="mb-6" style={{ color: 'var(--muted-foreground)' }}>
                Coba jelajahi kategori atau tag lainnya.
              </p>
              <Link href="/blog" className="btn-primary">Lihat Semua Artikel</Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <Link key={post.slug} href={\`/blog/\${post.slug}\`} className="group block">
                  <article className="glass rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-glow)]">
                    <div className="relative aspect-video overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, oklch(0.52 0.22 265 / 0.1), oklch(0.52 0.25 300 / 0.1))' }}>
                      {post.featuredImage ? (
                        <Image src={post.featuredImage} alt={post.title} fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="w-12 h-12" style={{ color: 'oklch(0.52 0.22 265 / 0.25)' }} />
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      {post.category && (
                        <span className="inline-flex self-start text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3"
                          style={{ background: 'oklch(0.52 0.22 265 / 0.1)', color: getCatColor(post.category) }}>
                          {post.category}
                        </span>
                      )}
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
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
`;

// ── 9. Write all pages ────────────────────────────────────────────────────────
fs.mkdirSync(path.dirname(BLOG_PAGE), { recursive: true });
fs.writeFileSync(BLOG_PAGE, blogListingContent, 'utf8');
console.log('[locale]/blog/page.tsx] Written');

fs.mkdirSync(path.dirname(BLOG_SLUG_PAGE), { recursive: true });
fs.writeFileSync(BLOG_SLUG_PAGE, blogSlugContent, 'utf8');
console.log('[blog/[slug]/page.tsx] Written');

fs.mkdirSync(path.dirname(BLOG_TAG_PAGE), { recursive: true });
fs.writeFileSync(BLOG_TAG_PAGE, blogTagContent, 'utf8');
console.log('[blog/tag/[tag]/page.tsx] Written');

// ── 10. Patch sitemap.ts to read from blog JSON files ────────────────────────
let sitemap = fs.readFileSync(SITEMAP_FILE, 'utf8');
const OLD_SITEMAP_BLOCK = `  // Dynamically add blog articles
  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require(\"better-sqlite3\");
    const db = new Database(DB_PATH, { readonly: true });
    const articles = db.prepare(\`
      SELECT slug, id, updated_at, created_at FROM articles
      WHERE status IN ('draft','published') AND content_html IS NOT NULL AND content_html != ''
      ORDER BY id DESC LIMIT 500
    \`).all() as any[];
    db.close();

    articleRoutes = articles.map(a => ({
      url: \`\${BASE}/blog/\${a.slug || a.id}\`,
      lastModified: new Date(a.updated_at || a.created_at || now),
      changeFrequency: \"monthly\" as const,
      priority: 0.7,
    }));
  } catch { /* DB not available during static build */ }

  return [...staticRoutes, ...articleRoutes];`;

const NEW_SITEMAP_BLOCK = `  // Dynamically add blog articles from JSON files
  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    const BLOG_DIR = path.join(process.cwd(), 'src/data/blog');
    if (fs.existsSync(BLOG_DIR)) {
      const files = fs.readdirSync(BLOG_DIR).filter((f: string) => f.endsWith('.json'));
      articleRoutes = files.map((file: string) => {
        try {
          const post = JSON.parse(fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8'));
          return {
            url: \`\${BASE}/blog/\${post.slug || file.replace('.json','')}\`,
            lastModified: new Date(post.updatedAt || post.publishedAt || now),
            changeFrequency: 'monthly' as const,
            priority: 0.75,
          };
        } catch { return null; }
      }).filter(Boolean) as MetadataRoute.Sitemap;
    }
  } catch { /* ignore */ }

  return [...staticRoutes, ...articleRoutes];`;

if (sitemap.includes(OLD_SITEMAP_BLOCK)) {
  sitemap = sitemap.replace(OLD_SITEMAP_BLOCK, NEW_SITEMAP_BLOCK);
  // Remove unused DB_PATH constant
  sitemap = sitemap.replace('\nconst DB_PATH = "/home/ubuntu/articel generator/data.db";\n', '\n');
  fs.writeFileSync(SITEMAP_FILE, sitemap, 'utf8');
  console.log('[sitemap.ts] Patched: reads from blog JSON files');
} else {
  console.log('[sitemap.ts] Already patched or format changed, skipping');
}

console.log('Blog pages deployed. Rebuild nuswalab to apply.');

// ── Portfolio AI page ──────────────────────────────────────────────────────────
const PORTFOLIO_AI_PAGE = "/home/ubuntu/nuswalab/src/app/[locale]/portofolio/ai-development/page.tsx";
fs.mkdirSync(path.dirname(PORTFOLIO_AI_PAGE), { recursive: true });
fs.writeFileSync(PORTFOLIO_AI_PAGE, `import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portofolio AI Agentic Development & Automation — Nuswa Lab',
  description: 'Lihat portofolio solusi AI kami: multi-agent orchestration, workflow automation, dan AI customer service yang sudah membantu bisnis di Indonesia.',
};

const STATS = [
  { num: '50+', label: 'Proyek AI selesai' },
  { num: '87%', label: 'Rata-rata task terautomasi' },
  { num: '4.8×', label: 'ROI rata-rata klien' },
  { num: '24/7', label: 'Agents berjalan non-stop' },
];

const PROJECTS = [
  {
    tag: 'AI Agentic Development',
    tagColor: 'blue',
    title: 'Multi-Agent Orchestration Platform',
    desc: 'Sistem orkestrasi 12+ AI agent yang berjalan paralel — lead qualifier, email outreach, data analyst, web scraper — dengan monitoring real-time dan auto-recovery.',
    features: [
      'Fleet management: 12 agents, 2.800+ task/hari',
      'Decision latency 1,2 detik, success rate 98,7%',
      'Live log, alerting, dan auto-escalation',
    ],
    tech: ['Claude API', 'GPT-4o', 'Node.js', 'PostgreSQL', 'Redis'],
    image: '/portfolio/portfolio-ai-agent-orchestrator.png',
    imageAlt: 'AI Agent Orchestrator Dashboard',
    reverse: false,
  },
  {
    tag: 'AI Workflow Automation',
    tagColor: 'indigo',
    title: 'Visual AI Automation Builder',
    desc: 'Platform untuk membangun automation workflow bisnis — dari lead nurturing, email sequence, hingga CRM sync — dengan node AI terintegrasi Claude & GPT-4o.',
    features: [
      'Visual flow builder dengan 40+ node siap pakai',
      'Claude & GPT-4o nodes untuk reasoning dalam workflow',
      'Real-time debug, run history, dan retry otomatis',
    ],
    tech: ['n8n', 'Claude Sonnet', 'Webhook', 'Google Sheets', 'WhatsApp API'],
    image: '/portfolio/portfolio-ai-automation-builder.png',
    imageAlt: 'AI Automation Workflow Builder',
    reverse: true,
  },
  {
    tag: 'AI Customer Service',
    tagColor: 'teal',
    title: 'AI-Powered Support Console',
    desc: 'Sistem customer support bertenaga AI yang mampu menangani 87% percakapan secara otonom — dengan lead scoring real-time, sentiment analysis, dan eskalasi cerdas ke agen manusia.',
    features: [
      '87% tiket resolved oleh AI tanpa intervensi manusia',
      'Lead scoring otomatis + kalender booking terintegrasi',
      'CSAT 4,8/5 — respons rata-rata <1,2 detik',
    ],
    tech: ['Claude Sonnet', 'Tool Use', 'CRM API', 'WhatsApp', 'Next.js'],
    image: '/portfolio/portfolio-ai-customer-support.png',
    imageAlt: 'AI Customer Support Console',
    reverse: false,
  },
];

const SERVICES = [
  { icon: '🤖', title: 'Custom AI Agent Development', desc: 'Bangun AI agent yang dapat berpikir, mengambil keputusan, dan mengeksekusi task secara otonom — disesuaikan dengan proses bisnis Anda.' },
  { icon: '⚡', title: 'Business Process Automation', desc: 'Automasi alur kerja manual yang memakan waktu: lead nurturing, laporan, invoice, hingga komunikasi pelanggan — berjalan 24/7 tanpa error.' },
  { icon: '💬', title: 'AI Chatbot & Customer Service', desc: 'Chatbot cerdas yang memahami konteks, terhubung ke sistem Anda, dan mampu menyelesaikan permintaan pelanggan end-to-end.' },
  { icon: '🔗', title: 'AI Integration & API', desc: 'Integrasi Claude, GPT-4o, atau model AI lain ke dalam sistem yang sudah berjalan — ERP, CRM, e-commerce, atau aplikasi custom.' },
  { icon: '📊', title: 'AI Data Pipeline & Analytics', desc: 'Pipeline AI untuk mengekstrak insight dari data bisnis — otomatis, real-time, dan disajikan dalam dashboard yang mudah dibaca.' },
  { icon: '🛡️', title: 'AI Strategy & Consulting', desc: 'Konsultasi roadmap AI untuk bisnis Anda — identifikasi use case tertinggi ROI, pilih teknologi yang tepat, dan rencanakan implementasi bertahap.' },
];

const TAG_COLORS: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 border border-blue-200',
  indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  teal: 'bg-teal-50 text-teal-700 border border-teal-200',
};

export default async function PortfolioAIPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-14 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-widest uppercase mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
          AI Development · Portofolio
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight mb-5">
          Solusi{' '}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
            AI Agentic &<br />AI Automation
          </span>{' '}
          Kami
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto mb-9 leading-relaxed">
          Kami membangun sistem AI yang benar-benar bekerja — dari agent otonom hingga otomasi proses bisnis end-to-end.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/contact" className="px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5">
            Diskusi Proyek Anda →
          </Link>
          <Link href="/services" className="px-7 py-3.5 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 text-slate-600 font-semibold text-sm transition-all">
            Lihat Layanan
          </Link>
        </div>
      </section>

      {/* Stats */}
      <div className="border-y border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="py-5 text-center border-r border-slate-100 last:border-r-0">
              <div className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{s.num}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio Cards */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center gap-4 mb-10">
          <span className="text-xs font-bold tracking-widest uppercase text-slate-400">Portofolio Proyek</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        <div className="flex flex-col gap-8">
          {PROJECTS.map((p) => (
            <div
              key={p.title}
              className={\`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-blue-300 grid \${p.reverse ? 'sm:grid-cols-[1fr_1.4fr]' : 'sm:grid-cols-[1.4fr_1fr]'}\`}
            >
              {p.reverse ? (
                <>
                  {/* Content first when reverse */}
                  <div className="p-8 sm:p-10 flex flex-col justify-center">
                    <span className={\`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-4 w-fit \${TAG_COLORS[p.tagColor]}\`}>
                      {p.tag}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3">{p.title}</h2>
                    <p className="text-sm text-slate-500 leading-relaxed mb-5">{p.desc}</p>
                    <ul className="flex flex-col gap-2 mb-5">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                          <span className="w-4 h-4 rounded bg-blue-50 border border-blue-200 text-blue-600 text-xs grid place-items-center flex-shrink-0 mt-0.5">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {p.tech.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-500 text-xs font-mono">{t}</span>
                      ))}
                    </div>
                    <Link href="/contact" className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:gap-3 transition-all">
                      Bangun sistem serupa →
                    </Link>
                  </div>
                  {/* Image */}
                  <div className="relative bg-slate-900 min-h-[280px]">
                    <Image src={p.image} alt={p.imageAlt} fill className="object-cover object-left-top" sizes="(max-width:768px) 100vw, 57vw" />
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-slate-900/10 pointer-events-none" />
                  </div>
                </>
              ) : (
                <>
                  {/* Image first */}
                  <div className="relative bg-slate-900 min-h-[280px]">
                    <Image src={p.image} alt={p.imageAlt} fill className="object-cover object-left-top" sizes="(max-width:768px) 100vw, 57vw" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/10 pointer-events-none" />
                  </div>
                  {/* Content */}
                  <div className="p-8 sm:p-10 flex flex-col justify-center">
                    <span className={\`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-4 w-fit \${TAG_COLORS[p.tagColor]}\`}>
                      {p.tag}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3">{p.title}</h2>
                    <p className="text-sm text-slate-500 leading-relaxed mb-5">{p.desc}</p>
                    <ul className="flex flex-col gap-2 mb-5">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                          <span className="w-4 h-4 rounded bg-blue-50 border border-blue-200 text-blue-600 text-xs grid place-items-center flex-shrink-0 mt-0.5">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {p.tech.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-500 text-xs font-mono">{t}</span>
                      ))}
                    </div>
                    <Link href="/contact" className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:gap-3 transition-all">
                      Bangun sistem serupa →
                    </Link>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="bg-slate-50 border-y border-slate-100 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3">Layanan AI yang Kami Tawarkan</h2>
            <p className="text-slate-500 text-base max-w-md mx-auto">Dari konsultasi hingga deployment production — kami handle end-to-end.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((s) => (
              <div key={s.title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 grid place-items-center text-xl mb-4 group-hover:bg-blue-100 transition-colors">{s.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2 text-[15px] leading-snug">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-12 sm:p-16 grid sm:grid-cols-[1fr_auto] gap-8 items-center">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',backgroundSize:'28px 28px'}} />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">Siap otomasi bisnis Anda dengan AI?</h2>
            <p className="text-blue-100 text-base leading-relaxed max-w-lg">Konsultasi gratis 30 menit. Kami analisis proses bisnis Anda dan rekomendasikan solusi AI yang paling menguntungkan.</p>
          </div>
          <div className="relative flex flex-col gap-3 flex-shrink-0">
            <Link href="/contact" className="px-7 py-3.5 rounded-xl bg-white text-blue-700 font-bold text-sm text-center hover:-translate-y-0.5 hover:shadow-lg transition-all whitespace-nowrap">
              Konsultasi Gratis →
            </Link>
            <Link href="https://wa.me/6281234567890" className="px-7 py-3.5 rounded-xl border-2 border-white/40 hover:border-white/80 hover:bg-white/10 text-white font-semibold text-sm text-center transition-all whitespace-nowrap">
              WhatsApp Kami
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
`, 'utf8');
console.log('[portofolio/ai-development/page.tsx] Written');
