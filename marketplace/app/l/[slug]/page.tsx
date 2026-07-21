import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { parseLandingBlocks } from "@/lib/landingBlocks";
import { detectSource, trackEvent } from "@/lib/analytics";
import { capiViewContent } from "@/lib/capi";
import { isPaymentoConfigured } from "@/lib/paymento";
import MetaPixel from "@/components/MetaPixel";
import LandingBlockRenderer, { type LandingCtx } from "@/components/landing/LandingBlocks";

export const dynamic = "force-dynamic";

async function loadLanding(slug: string) {
  return db.landingPage.findUnique({
    where: { slug },
    include: {
      store: true,
      product: { include: { variants: true, wholesaleTiers: true, addonLinks: { include: { addonProduct: { select: { name: true, active: true } } } } } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lp = await loadLanding(slug);
  if (!lp) return { title: "Halaman tidak ditemukan" };
  const title = lp.ogTitle || lp.title;
  const description = lp.ogDescription || lp.product.description?.slice(0, 160) || `${lp.product.name} — ${lp.store.name}`;
  const image = lp.ogImageUrl || lp.product.imageUrl || undefined;
  return {
    title,
    description,
    openGraph: { title, description, images: image ? [image] : [], type: "website" },
  };
}

export default async function LandingPageView({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string; utm_source?: string; preview?: string }>;
}) {
  const { slug } = await params;
  const { ref, utm_source } = await searchParams;
  const lp = await loadLanding(slug);
  if (!lp) notFound();

  const user = await currentUser();
  const isOwner = user?.store?.id === lp.storeId;
  if (!lp.published && !isOwner) notFound();

  const source = detectSource(ref ?? utm_source, null);
  db.landingPage.update({ where: { id: lp.id }, data: { views: { increment: 1 } } }).catch(() => {});
  trackEvent({ type: "VIEW", storeId: lp.storeId, productId: lp.productId, source });
  capiViewContent(lp.store, lp.product);

  const blocks = parseLandingBlocks(lp.blocks);
  const ctx: LandingCtx = {
    product: lp.product,
    store: lp.store,
    landingPageId: lp.id,
    refSource: source,
    cryptoEnabled: isPaymentoConfigured(),
    defaultName: user?.name ?? undefined,
    defaultEmail: user?.email,
    userPoints: user?.points ?? 0,
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      {!lp.published && isOwner && (
        <p className="text-center text-xs font-bold bg-amber-100 text-amber-800 rounded-lg px-3 py-2">
          👁 Mode pratinjau — halaman ini belum dipublikasikan, pengunjung lain belum bisa melihatnya.
        </p>
      )}
      {lp.store.metaPixelId && <MetaPixel pixelId={lp.store.metaPixelId} event="ViewContent" value={lp.product.price} />}
      {blocks.map((b) => (
        <LandingBlockRenderer key={b.id} block={b} ctx={ctx} />
      ))}
    </div>
  );
}
