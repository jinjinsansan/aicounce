"use client";

import { GeneralCounselorChatClient, type ChatConfig } from "@/components/GeneralCounselorChatClient";

const initialPrompts = [
  "心が落ち着かない...",
  "人間関係に疲れている",
  "執着から離れたい",
  "苦しみの原因を知りたい",
];

const thinkingMessages = [
  "経典の智慧を探しています...",
  "慈悲の心で受け止めています...",
  "中道を照らしています...",
  "仏の教えに耳を傾けています...",
];

const SIDDHARTHA_CONFIG: ChatConfig = {
  counselorId: "siddhartha",
  storageKey: "siddhartha-buddhism-chat-session",
  hero: {
    name: "シッダールタ",
    subtitle: "仏教カウンセリング",
    description: "慈悲と智慧で静かな平安へ導きます",
    iconUrl: "/images/counselors/siddhartha.png",
  },
  theme: {
    gradientFrom: "#f0fdf4",
    gradientVia: "#ecfdf3",
    gradientTo: "#e8f5e9",
    accent: "#22c55e",
    accentMuted: "#15803d",
    cardBorder: "border-emerald-100",
    bubbleUser: "bg-[#ecfdf3] text-[#166534]",
    bubbleAssistant: "bg-white",
    assistantText: "text-[#14532d]",
    assistantBorder: "border border-emerald-100",
    activeBackground: "bg-gradient-to-r from-[#34d399] via-[#22c55e] to-[#16a34a]",
    newChatButton:
      "bg-gradient-to-r from-[#34d399] via-[#22c55e] to-[#16a34a] focus-visible:ring-emerald-200 shadow-emerald-300/40",
    headingText: "text-[#166534]",
    headerSubtitle: "text-[#16a34a]",
    headerDescription: "text-[#15803d]",
    badgeBackground: "bg-[#ecfdf3]",
    badgeText: "text-[#166534]",
    badgeHintText: "text-[#15803d]",
    statsBadgeBackground: "bg-[#ecfdf3]",
    statsBadgeText: "text-[#166534]",
    sectionBorder: "border-emerald-50",
    promptBorder: "border-emerald-100",
    promptText: "text-[#166534]",
    promptHoverBorder: "hover:border-emerald-300",
    detailBorder: "border-emerald-100",
    detailBackground: "bg-[#f0fdf4]",
    detailText: "text-[#14532d]",
    emptyBorder: "border-emerald-200",
    emptyText: "text-[#166534]",
    inputBorder: "border-emerald-200 focus:border-emerald-400 focus:ring-emerald-100",
    inputBg: "bg-white",
    inputPlaceholder: "placeholder-[#16a34a]/70",
    skeletonBorder: "border-emerald-100",
    skeletonHighlight: "bg-emerald-100/60",
    skeletonShade: "bg-emerald-50",
    deleteButtonText: "text-[#166534]",
    deleteButtonHover: "hover:bg-[#ecfdf3]",
  },
  initialPrompts,
  thinkingMessages,
};

export function SiddharthaChatClient() {
  return <GeneralCounselorChatClient config={SIDDHARTHA_CONFIG} />;
}

export default SiddharthaChatClient;
