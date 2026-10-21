import type { Metadata } from 'next';
import ProductDetailContainer, { generateProductMetadata } from '../../vot-cau-long/[slug]/ProductDetailContainer';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return generateProductMetadata(params, 'Quấn cán vợt');
}

export default async function GripDetailPage({ params }: PageProps) {
  return (
    <ProductDetailContainer
      params={params}
      categorySlug="cat_grip"
      categoryName="Quấn cán vợt"
      categoryHref="/quan-can"
    />
  );
}
