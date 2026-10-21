import type { Metadata } from 'next';
import ProductDetailContainer, { generateProductMetadata } from '../../vot-cau-long/[slug]/ProductDetailContainer';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return generateProductMetadata(params, 'Quần áo thể thao');
}

export default async function ApparelDetailPage({ params }: PageProps) {
  return (
    <ProductDetailContainer
      params={params}
      categorySlug="cat_apparel"
      categoryName="Quần áo thể thao"
      categoryHref="/quan-ao"
    />
  );
}
