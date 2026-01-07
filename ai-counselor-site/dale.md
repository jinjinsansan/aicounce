# デール・カーネギー「道は開ける」RAGシステム 引き継ぎメモ

## 作成日
2026-01-08

## プロジェクト概要
デール・カーネギーの「How to Stop Worrying and Start Living」（1948）をベースにしたRAGカウンセリングシステム。

## 著作権状況
- **カーネギー死去**：1955年11月1日
- **日本の保護期間**：死後70年
- **ステータス**：2026年1月1日よりパブリックドメイン ✅

## テキストソース
Internet Archive（パブリックドメイン版）
- URL: https://archive.org/details/in.ernet.dli.2015.188253
- テキストはweb_fetchツールで取得済み

## ファイル構成

```
carnegie_rag_system/
├── chunks/
│   ├── parent/           # 親チャンク（17ファイル）
│   │   ├── carnegie_001_parent.md  # Day-tight Compartments
│   │   ├── carnegie_002_parent.md  # Magic Formula
│   │   ├── carnegie_003_parent.md  # What Worry May Do to You
│   │   ├── carnegie_004_parent.md  # Analyse and Solve Problems
│   │   ├── carnegie_005_parent.md  # Keep Busy
│   │   ├── carnegie_006_parent.md  # Law of Averages
│   │   ├── carnegie_007_parent.md  # Co-operate with Inevitable
│   │   ├── carnegie_008_parent.md  # Stop-Loss Order
│   │   ├── carnegie_009_parent.md  # Don't Saw Sawdust
│   │   ├── carnegie_010_parent.md  # Count Your Blessings
│   │   ├── carnegie_011_parent.md  # Find Yourself, Be Yourself
│   │   ├── carnegie_012_parent.md  # Make a Lemonade
│   │   ├── carnegie_013_parent.md  # Handling Criticism
│   │   ├── carnegie_014_parent.md  # Fatigue and Worry
│   │   ├── carnegie_015_parent.md  # Cure Melancholy
│   │   ├── carnegie_016_parent.md  # High Cost of Getting Even
│   │   └── carnegie_017_parent.md  # Don't Worry About Ingratitude
│   └── child/            # 子チャンク（17ファイル）
│       ├── carnegie_001a_child.md
│       ├── carnegie_001b_child.md
│       ├── carnegie_002a_child.md
│       ├── ... (各親に対応する子チャンク)
│       └── carnegie_017a_child.md
├── system/
│   └── carnegie_counselor_system_prompt.md
└── HANDOVER_MEMO.md
```

## チャンク構造

### 親チャンク（Parent Chunk）
- **用途**: 詳細な回答生成用
- **トークン数**: 600-750トークン
- **内容**: 日本語要約 + 重要な英語フレーズ

### 子チャンク（Child Chunk）
- **用途**: 検索・マッチング用（ベクトル化対象）
- **トークン数**: 80-100トークン
- **内容**: 親チャンクのエッセンス

## 作成済みチャンク一覧

| ID | テーマ | 日本語タイトル |
|----|--------|---------------|
| 001 | Day-tight Compartments | 今日1日の区切りで生きる |
| 002 | Magic Formula | 心配事を解決する魔法の公式 |
| 003 | Health Effects | 心配が健康に与える影響 |
| 004 | Problem Analysis | 問題を分析し解決する方法 |
| 005 | Keep Busy | 忙しくして心配を追い出す |
| 006 | Law of Averages | 確率の法則で心配を消す |
| 007 | Co-operate with Inevitable | 避けられないことに協力する |
| 008 | Stop-Loss Order | 心配に損切りラインを設定する |
| 009 | Don't Saw Sawdust | 過去のおがくずを挽くな |
| 010 | Count Your Blessings | 恵みを数えよ |
| 011 | Be Yourself | 自分を見つけ、自分であれ |
| 012 | Make a Lemonade | レモンをレモネードにしよう |
| 013 | Handling Criticism | 批判を気にしない方法 |
| 014 | Fatigue and Worry | 疲労と心配の関係 |
| 015 | Cure Melancholy | 14日間で憂鬱を治す方法 |
| 016 | Cost of Getting Even | 復讐の高いコスト |
| 017 | Ingratitude | 感謝されなくても気にしない |

## 主要な名言（英語原文）

- "Live in day-tight compartments."
- "What is the worst that can possibly happen?"
- "Our fatigue is often caused not by work, but by worry."
- "Two men looked out from prison bars, one saw mud, the other saw stars."
- "If you have a lemon, make a lemonade."
- "Remember that no one ever kicks a dead dog."
- "Don't try to saw sawdust."
- "Be willing to have it so."
- "Imitation is suicide."

## 次のステップ

1. **追加チャンクの作成**（オプション）
   - Part Ten「31 True Stories」から代表的なエピソードを抽出
   - 不眠症対策（Chapter 28）
   - 財政的心配（Chapter 30）

2. **RAGシステム構築**
   - Supabase pgvectorでベクトルDB構築
   - 子チャンクのベクトル化
   - 検索API実装

3. **斎藤一人RAGとの統合**
   - 同一インフラで運用可能
   - 将来的にハイブリッドカウンセラーも検討

## 備考

- 斎藤一人RAGプロジェクトと同じ親子チャンク構造を採用
- システムプロンプトはカーネギー特有の「論理的・実践的」なトーンを反映
- 英語原文の名言を積極的に活用し、原著の雰囲気を維持
