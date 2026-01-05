const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_PROJECT_ID",
  "OPENAI_API_KEY",
  "MICHELLE_ASSISTANT_ID",
  "CLINICAL_ASSISTANT_ID",
  "USE_SINR_RAG",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_SENTRY_DSN",
];

const optionalEnvVars = [
  "ANTHROPIC_API_KEY",
  "GOOGLE_API_KEY",
  "DEEPSEEK_API_KEY",
  "RAG_SOURCE_FOLDER",
  "SENTRY_DSN",
  "MICHELLE_PHASE_MODEL",
  "CLINICAL_PHASE_MODEL",
  "RESEND_FROM_EMAIL",
];

function checkEnv() {
  const missingRequired = requiredEnvVars.filter((key) => !process.env[key]);
  const missingOptional = optionalEnvVars.filter((key) => !process.env[key]);

  if (missingRequired.length > 0) {
    console.error(
      `Missing required environment variables:\n${missingRequired.join("\n")}`,
    );
    process.exit(1);
  }

  if (missingOptional.length > 0) {
    console.warn(
      `Optional environment variables not set:\n${missingOptional.join("\n")}`,
    );
  }

  console.log("All required environment variables are set.");
}

checkEnv();
