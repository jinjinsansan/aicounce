import { Metadata } from "next";
import { fetchCounselors } from "@/lib/counselors";
import AiDiscussionView from "@/components/AiDiscussionView";

export const metadata: Metadata = {
  title: "AI議論ライブ | メンタルAIチーム",
  description:
    "2体のAIカウンセラーがリアルタイムで議論し、まとめ役が結論を提示するライブページです。",
};

export default async function AiDiscussionPage() {
  const counselors = await fetchCounselors();
  return <AiDiscussionView counselors={counselors} />;
}
