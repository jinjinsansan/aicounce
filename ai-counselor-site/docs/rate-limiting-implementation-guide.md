# レートリミット実装ガイド

## 概要
API乱用を防ぐため、以下のエンドポイントにレートリミットの実装を推奨します。

## 優先度別エンドポイント

### 🔴 高優先度（P1）
1. **認証系API**
   - `/api/auth/signup` - 大量アカウント作成防止
   - `/api/auth/password-reset` - メール爆撃防止
   - Rate: 5回/時間/IP

2. **チャットAPI**
   - `/api/chat` - 個別カウンセリング
   - `/api/team/respond` - チームカウンセリング
   - Rate: 60回/時間/ユーザー (約1回/分)

### 🟡 中優先度（P2）
3. **支払いAPI**
   - `/api/payments/paypal/*` - 不正決済試行防止
   - Rate: 10回/時間/ユーザー

4. **管理者API**
   - `/api/admin/*` - 管理画面の過負荷防止
   - Rate: 100回/分/管理者

## 実装オプション

### オプション1: Vercel Edge Middleware（推奨）
- ✅ Vercelネイティブサポート
- ✅ グローバルエッジで高速
- ✅ 追加料金なし（Proプラン以上）
- ❌ 設定が複雑

```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return new Response("Too Many Requests", { status: 429 });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/auth/:path*', '/api/chat/:path*'],
};
```

### オプション2: Upstash Rate Limit（推奨）
- ✅ 簡単に導入可能
- ✅ Redisベースで高速
- ✅ 無料枠あり（10,000リクエスト/日）
- ❌ 外部サービス依存

**導入手順**:
```bash
npm install @upstash/ratelimit @upstash/redis
```

**環境変数**:
```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

**実装例**:
```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const authRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "auth",
});

export const chatRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, "1 h"),
  analytics: true,
  prefix: "chat",
});

// Usage in API route
import { authRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success, limit, reset, remaining } = await authRateLimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: "レート制限を超えました。しばらくしてから再試行してください。" },
      { 
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": new Date(reset).toISOString(),
        }
      }
    );
  }
  
  // Continue with API logic...
}
```

### オプション3: インメモリ実装（簡易版）
- ✅ 追加依存なし
- ✅ 無料
- ❌ 単一インスタンスのみ（Vercelの複数インスタンスで不一致）
- ❌ サーバー再起動でリセット

```typescript
// lib/simple-rate-limit.ts
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = requestCounts.get(key);
  
  if (!record || now > record.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetAt) {
      requestCounts.delete(key);
    }
  }
}, 60000); // Every minute
```

## 推奨実装プラン

### Phase 1: 認証系（即時実装推奨）
1. Upstash Redisアカウント作成（無料）
2. `/api/auth/signup`, `/api/auth/password-reset` にレートリミット追加
3. Rate: 5回/時間/IP

### Phase 2: チャット系（運用開始後1週間以内）
1. ユーザー行動分析
2. 適切なレート設定（60回/時間が目安）
3. `/api/chat`, `/api/team/respond` にレートリミット追加

### Phase 3: その他（運用開始後1ヶ月以内）
1. 支払いAPI
2. 管理者API
3. 運用状況に応じて調整

## テスト方法

```bash
# 連続リクエストでレートリミットをテスト
for i in {1..10}; do
  curl -X POST https://www.mentalai.team/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"testtest"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 0.5
done
```

期待される結果:
- 最初の5回: 200 or 400 (validation error)
- 6回目以降: 429 Too Many Requests

## モニタリング

Upstash Dashboardで以下を確認:
- リクエスト数の推移
- ブロックされたリクエスト数
- レートリミット違反のIPアドレス

## 注意事項

1. **プロキシ環境**: `x-forwarded-for` ヘッダーで実IPを取得
2. **ログインユーザー**: IPではなくユーザーIDでレート制限
3. **管理者**: 管理者は別レートリミット設定を推奨
4. **エラーメッセージ**: 日本語で分かりやすく表示
5. **レスポンスヘッダー**: X-RateLimit-* ヘッダーで残り回数を通知
