import { NewPostingFormv2 } from '@/components/posting/NewPostingFormv2';

export const metadata = {
  title: 'Post a New Ad - v2',
  description: 'Create a new listing on Afghan with the new form',
};

export default async function PostAdPage() {
  return <NewPostingFormv2 />;
}
