import { NewPostingFormv2 } from '@/components/posting/NewPostingFormv2';
import type { AppLocale } from '@/lib/i18n/translations';

type PageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export const metadata = {
  title: 'Post a New Ad - v2',
  description: 'Create a new listing on Sahibash with the new form',
};

export default async function PostAdPage({ params }: PageProps) {
  return <NewPostingFormv2 />;
}
