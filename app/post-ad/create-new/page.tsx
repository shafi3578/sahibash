import { redirect } from "next/navigation";

export default function LegacyCreateNewPage() {
  redirect("/post-ad/create");
}
