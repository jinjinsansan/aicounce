const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

async function run() {
  const target = `${baseUrl}/api/health`;
  console.log(`Checking health endpoint: ${target}`);

  try {
    const response = await fetch(target, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Health endpoint returned status ${response.status}`);
    }
    const payload = (await response.json()) as {
      status?: string;
      timestamp?: string;
      checks?: Record<string, unknown>;
      details?: Record<string, unknown> | null;
    };

    console.log("Health response:", JSON.stringify(payload, null, 2));

    if (payload.status !== "ok") {
      throw new Error(`Service status is ${payload.status ?? "unknown"}`);
    }

    console.log("Health check passed.");
  } catch (error) {
    console.error("Health check failed:", error);
    process.exit(1);
  }
}

run();

export {};
