# AIカウンセリング事務所 - 最終デザインパッケージ

## 📦 提供内容

このパッケージには、AIカウンセリング事務所のサイト用に作成された**シルエットスタイル**の画像が含まれています。

### 🎨 デザインコンセプト

全ての画像は**エレガントなシルエットスタイル**で統一されています：

- **スタイル**: 純粋な黒のシルエット、白背景
- **特徴**: クリーンなエッジ、高いコントラスト
- **雰囲気**: プロフェッショナル、洗練された、ミニマリスト
- **効果**: 視覚的インパクト、ブランドの一貫性

---

## 📁 ファイル構成

### 1. **michelle_with_name.png** (ミシェルの名前入りアイコン)

- **用途**: カウンセラー一覧ページ、カウンセラー詳細ページ
- **サイズ**: 正方形（推奨: 200x200px - 400x400px）
- **特徴**: エレガントな女性のシルエット（アップヘア）+ 「MICHELLE」の名前ラベル
- **配置**: 他の9人のカウンセラーアイコンと同じスタイルで統一

### 2. **hero_team_lineup.png** (10人のチームラインナップ)

- **用途**: トップページのヒーローセクション
- **サイズ**: 横長（推奨: 1200x600px - 1920x800px）
- **特徴**: 10人のプロフェッショナルAIカウンセラーが自信ありげに並ぶ構図
- **配置**: ヒーローセクションのメインビジュアル、背景または前景として使用

**10人のカウンセラー構成**:
1. ミシェル（エレガントな女性、アップヘア）
2. ドクター・サトウ（メガネをかけた男性医師、白衣）
3. アレックス（性別中立的、タブレット保持）
4. ナナ（温かい中年女性、お団子ヘア、ペンダント）
5. ユキ（若い女性、ポニーテール）
6. イリス（瞑想姿勢の女性）
7. アダム（カジュアルな男性）
8. ジェミニ（二重プロフィール）
9. クロード（本を読む男性）
10. ディープ（虫眼鏡を持つ男性）

### 3. **logo_horizontal.png** (横長ロゴ)

- **用途**: ウェブサイトヘッダー、メールシグネチャ、印刷物
- **サイズ**: 横長（推奨: 400x100px - 800x200px）
- **特徴**: 左側にアイコン（頭部シルエット+ハート）、右側に「AIカウンセリング事務所」のテキスト
- **配置**: ヘッダー左上、フッター中央

### 4. **logo_square.png** (正方形ロゴ)

- **用途**: ファビコン、アプリアイコン、SNSプロフィール画像
- **サイズ**: 正方形（推奨: 512x512px - 1024x1024px）
- **特徴**: 中央にアイコン（頭部シルエット+ハート）、下に「AIカウンセリング事務所」のテキスト（2-3行）
- **配置**: ファビコン（16x16px, 32x32px）、OGP画像、SNSアイコン

---

## 🚀 実装方法

### 1. **画像の配置**

```bash
# Next.jsプロジェクトの場合
ai-counselor-site/
├── public/
│   └── images/
│       ├── counselors/
│       │   ├── michelle.png (michelle_with_name.png をリネーム)
│       │   ├── dr_satou.png (既存)
│       │   ├── alex.png (既存)
│       │   ├── nana.png (既存)
│       │   ├── yuki.png (既存)
│       │   ├── iris.png (既存)
│       │   ├── adam.png (既存)
│       │   ├── gemini.png (既存)
│       │   ├── claude.png (既存)
│       │   └── deep.png (既存)
│       ├── hero/
│       │   └── team_lineup.png (hero_team_lineup.png をリネーム)
│       └── logo/
│           ├── logo_horizontal.png
│           └── logo_square.png
```

### 2. **ヒーローセクションの実装**

```tsx
// components/Hero.tsx
import Image from 'next/image';

export const Hero = () => {
  return (
    <section className="relative py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* テキストセクション */}
          <div className="order-2 lg:order-1 z-10">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              もう、誰にも<br />
              気を使わなくていい。
            </h1>
            <p className="text-xl text-gray-700 mb-4">
              人間が一切介在しない、<br />
              AIだけのカウンセリング事務所。
            </p>
            <p className="text-lg text-gray-600 mb-8">
              10人のプロフェッショナルAIカウンセラーが、<br />
              あなたの心の声を優しく聴きます。
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-black text-white px-8 py-4 rounded-full hover:bg-gray-800 transition-colors text-lg">
                カウンセラーを選ぶ
              </button>
              <button className="border-2 border-black text-black px-8 py-4 rounded-full hover:bg-gray-100 transition-colors text-lg">
                サービスについて
              </button>
            </div>
          </div>
          
          {/* チームラインナップ画像 */}
          <div className="order-1 lg:order-2 relative w-full h-96 lg:h-[500px]">
            <Image 
              src="/images/hero/team_lineup.png" 
              alt="10人のプロフェッショナルAIカウンセラーチーム"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};
```

### 3. **ヘッダーロゴの実装**

```tsx
// components/Header.tsx
import Image from 'next/image';
import Link from 'next/link';

export const Header = () => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* 横長ロゴ */}
          <Link href="/" className="flex items-center">
            <Image 
              src="/images/logo/logo_horizontal.png" 
              alt="AIカウンセリング事務所"
              width={300}
              height={75}
              className="h-12 w-auto"
            />
          </Link>
          
          {/* ナビゲーション */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#counselors" className="text-gray-700 hover:text-black">
              カウンセラー一覧
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-black">
              サービスについて
            </Link>
            <Link href="/faq" className="text-gray-700 hover:text-black">
              よくある質問
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};
```

### 4. **ファビコンとOGP設定**

```tsx
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AIカウンセリング事務所 | もう、誰にも気を使わなくていい',
  description: '人間が一切介在しない、AIだけのカウンセリング事務所。10人のプロフェッショナルAIカウンセラーが、あなたの心の声を優しく聴きます。',
  icons: {
    icon: '/images/logo/logo_square.png',
    apple: '/images/logo/logo_square.png',
  },
  openGraph: {
    title: 'AIカウンセリング事務所',
    description: '人間が一切介在しない、AIだけのカウンセリング事務所',
    images: ['/images/logo/logo_square.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'AIカウンセリング事務所',
    description: '人間が一切介在しない、AIだけのカウンセリング事務所',
    images: ['/images/logo/logo_square.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
```

### 5. **カウンセラーカードの実装（ミシェル）**

```tsx
// components/CounselorCard.tsx
import Image from 'next/image';

interface CounselorCardProps {
  counselor: {
    id: string;
    name: string;
    specialty: string;
    icon_url: string;
    description: string;
  };
}

export const CounselorCard = ({ counselor }: CounselorCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      {/* アイコン画像（名前が含まれているため、別途テキストは不要） */}
      <div className="relative w-40 h-40 mx-auto mb-4">
        <Image 
          src={counselor.icon_url} 
          alt={`${counselor.name} - ${counselor.specialty}`}
          fill
          className="object-contain"
        />
      </div>
      
      {/* 専門分野 */}
      <p className="text-sm text-gray-600 text-center mb-2">{counselor.specialty}</p>
      
      {/* 説明 */}
      <p className="text-xs text-gray-500 text-center mb-4 line-clamp-3">
        {counselor.description}
      </p>
      
      {/* CTAボタン */}
      <button className="w-full bg-black text-white py-2 rounded-full hover:bg-gray-800 transition-colors">
        相談する
      </button>
    </div>
  );
};
```

---

## 🎨 デザイン推奨事項

### 背景色の選択

シルエットスタイルは**白背景**で作成されていますが、以下の背景色でも美しく表示されます：

- **純白** (`#FFFFFF`) - 最もクリーンで洗練された印象
- **オフホワイト** (`#F5F5F5` - `#FAFAFA`) - 柔らかく温かい印象
- **ライトグレー** (`#F0F0F0`) - モダンで落ち着いた印象

### カラーパレット

```css
:root {
  --color-primary: #000000;      /* 黒 - メインカラー */
  --color-secondary: #FFFFFF;    /* 白 - 背景 */
  --color-accent: #FF6B6B;       /* アクセント（ハート） */
  --color-text: #333333;         /* テキスト */
  --color-text-light: #666666;   /* ライトテキスト */
  --color-border: #E0E0E0;       /* ボーダー */
}
```

### レスポンシブデザイン

```css
/* ヒーローセクションのチームラインナップ */
.hero-team-lineup {
  width: 100%;
  height: 300px;  /* モバイル */
}

@media (min-width: 768px) {
  .hero-team-lineup {
    height: 400px;  /* タブレット */
  }
}

@media (min-width: 1024px) {
  .hero-team-lineup {
    height: 500px;  /* デスクトップ */
  }
}

/* 横長ロゴ */
.logo-horizontal {
  height: 40px;  /* モバイル */
  width: auto;
}

@media (min-width: 768px) {
  .logo-horizontal {
    height: 50px;  /* タブレット */
  }
}

@media (min-width: 1024px) {
  .logo-horizontal {
    height: 60px;  /* デスクトップ */
  }
}
```

---

## 💡 追加の視覚効果

### ホバーアニメーション（チームラインナップ）

```css
.hero-team-lineup {
  transition: transform 0.3s ease, filter 0.3s ease;
}

.hero-team-lineup:hover {
  transform: scale(1.02);
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.1));
}
```

### フェードインアニメーション（ヒーローセクション）

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-section {
  animation: fadeInUp 0.8s ease-out;
}

.hero-team-lineup {
  animation: fadeInUp 1s ease-out 0.2s both;
}
```

---

## 📊 SEO最適化

### 画像のalt属性

```tsx
<Image 
  src="/images/counselors/michelle.png" 
  alt="ミシェル - テープ式心理学カウンセラー | AIカウンセリング事務所"
  // ...
/>

<Image 
  src="/images/hero/team_lineup.png" 
  alt="10人のプロフェッショナルAIカウンセラーチーム | 精神疾患の方も安心して相談できる"
  // ...
/>

<Image 
  src="/images/logo/logo_horizontal.png" 
  alt="AIカウンセリング事務所 - 人間が一切介在しない心理カウンセリングサービス"
  // ...
/>
```

---

## 🔄 以前のデザインからの変更点

| 要素 | 以前のデザイン | 最終デザイン |
|---|---|---|
| ミシェルアイコン | 名前なし | ✅ **名前入り（MICHELLE）** |
| ヒーローセクション | 中心人物を囲む構図 | ✅ **10人が自信ありげに並ぶ構図** |
| ロゴ | パステルカラー、ハート+脳 | ✅ **シルエットスタイル、頭部+ハート** |
| 全体の雰囲気 | 温かく親しみやすい | ✅ **プロフェッショナルで洗練された** |

---

## ✅ 実装チェックリスト

- [ ] ミシェルの名前入りアイコンを`public/images/counselors/michelle.png`に配置
- [ ] チームラインナップ画像を`public/images/hero/team_lineup.png`に配置
- [ ] 横長ロゴを`public/images/logo/logo_horizontal.png`に配置
- [ ] 正方形ロゴを`public/images/logo/logo_square.png`に配置
- [ ] Supabaseの`counselors`テーブルを更新（ミシェルのicon_url）
- [ ] ヒーローセクションコンポーネントを更新
- [ ] ヘッダーコンポーネントにロゴを追加
- [ ] ファビコンとOGP設定を更新
- [ ] レスポンシブデザインをテスト
- [ ] ホバーエフェクトとアニメーションを実装
- [ ] Vercelにデプロイしてプレビュー

---

## 🎯 期待される効果

この最終デザインへの刷新により、以下の効果が期待されます：

1. **統一されたブランドアイデンティティ** - シルエットスタイルで一貫性を確保
2. **プロフェッショナル感の向上** - 洗練されたデザインで信頼性を強調
3. **視覚的インパクト** - 高いコントラストで目を引く
4. **チームの一体感** - 10人のカウンセラーが並ぶ構図で専門性を表現
5. **ユーザーエンゲージメント向上** - 自信ありげな姿勢で安心感を提供

---

## 🌟 メッセージング推奨

ヒーローセクションで使用できるコピー例：

### ヒーローセクション（チームラインナップと共に）

> **もう、誰にも気を使わなくていい。**  
> 人間が一切介在しない、AIだけのカウンセリング事務所。  
> 10人のプロフェッショナルAIカウンセラーが、あなたの心の声を優しく聴きます。

### カウンセラー紹介セクション

> **あなたに合ったカウンセラーを選べます。**  
> テープ式心理学、臨床心理学、産業心理学、スクールカウンセリング、スピリチュアルケアなど、  
> 多様な専門分野のAIカウンセラーが、あなたの悩みに寄り添います。

### Aboutセクション

> **プロフェッショナルなケアを、いつでも。**  
> 私たちのAIカウンセラーは、それぞれの専門分野で豊富な知識を持ち、  
> 24時間365日、あなたの話を聴く準備ができています。

---

これで、AIカウンセリング事務所のサイトが完全に刷新されます！

サイトURL: https://aicounce.vercel.app/
