const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const endpoints = ["/", "/api/health", "/api/counselors"];

async function run() {
  try {
    for (const path of endpoints) {
      const target = `${baseUrl}${path}`;
      const response = await fetch(target, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`${target} returned ${response.status}`);
      }
      console.log(`✔ ${target}`);
    }

    console.log("Smoke tests passed.");
  } catch (error) {
    console.error("Smoke tests failed:", error);
    process.exit(1);
  }
}

run();
