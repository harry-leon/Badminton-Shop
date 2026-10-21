import type { Metadata } from 'next';
import ProductDetailContainer, { generateProductMetadata } from '../../vot-cau-long/[slug]/ProductDetailContainer';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return generateProductMetadata(params, 'Phụ kiện cầu lông');
}

export default async function AccessoryDetailPage({ params }: PageProps) {
  return (
    <ProductDetailContainer
      params={params}
      categorySlug="cat_accessory"
      categoryName="Phụ kiện"
      categoryHref="/phu-kien"
    />
  );
}
