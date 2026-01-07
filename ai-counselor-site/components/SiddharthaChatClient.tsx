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
    gradientFrom: "#fffbf0",
    gradientVia: "#fef8e7",
    gradientTo: "#fef3c7",
    accent: "#d97706",
    accentMuted: "#92400e",
    cardBorder: "border-amber-100",
    bubbleUser: "bg-[#fef3c7] text-[#92400e]",
    bubbleAssistant: "bg-white",
    assistantText: "text-[#7c2d12]",
    assistantBorder: "border border-amber-100",
    activeBackground: "bg-gradient-to-r from-[#f59e0b] via-[#f97316] to-[#c2410c]",
    newChatButton:
      "bg-gradient-to-r from-[#f59e0b] via-[#f97316] to-[#ea580c] focus-visible:ring-amber-200 shadow-amber-400/30",
    headingText: "text-[#78350f]",
    headerSubtitle: "text-[#b45309]",
    headerDescription: "text-[#92400e]",
    badgeBackground: "bg-[#fff7ed]",
    badgeText: "text-[#92400e]",
    badgeHintText: "text-[#b45309]",
    statsBadgeBackground: "bg-[#fff7ed]",
    statsBadgeText: "text-[#92400e]",
    sectionBorder: "border-amber-50",
    promptBorder: "border-amber-100",
    promptText: "text-[#92400e]",
    promptHoverBorder: "hover:border-amber-300",
    detailBorder: "border-amber-100",
    detailBackground: "bg-[#fff8eb]",
    detailText: "text-[#92400e]",
    emptyBorder: "border-amber-200",
    emptyText: "text-[#92400e]",
    inputBorder: "border-[#fcd34d] focus:border-[#d97706] focus:ring-amber-100",
    inputBg: "bg-[#fff8eb]",
    inputPlaceholder: "placeholder-[#d97706]/60",
    skeletonBorder: "border-amber-100",
    skeletonHighlight: "bg-amber-100/60",
    skeletonShade: "bg-amber-50",
    deleteButtonText: "text-[#b45309]",
    deleteButtonHover: "hover:bg-[#fff0d9]",
  },
  initialPrompts,
  thinkingMessages,
};

export function SiddharthaChatClient() {
  return <GeneralCounselorChatClient config={SIDDHARTHA_CONFIG} />;
}

export default SiddharthaChatClient;
