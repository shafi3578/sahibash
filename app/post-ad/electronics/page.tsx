import { redirect } from "next/navigation";

export default function ElectronicsPostAdPage() {
  redirect("/post-ad/create?posting=sell&category=mobile-phones-tablets");
  return null;
}
