import type { Metadata } from 'next';
import ProductDetailContainer, { generateProductMetadata } from './ProductDetailContainer';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return generateProductMetadata(params, 'Vợt cầu lông');
}

export default async function RacketDetailPage({ params }: PageProps) {
  return (
    <ProductDetailContainer
      params={params}
      categorySlug="cat_racket"
      categoryName="Vợt cầu lông"
      categoryHref="/vot-cau-long"
    />
  );
}
