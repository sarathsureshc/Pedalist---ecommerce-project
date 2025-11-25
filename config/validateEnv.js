const requiredEnvVars = [
  "MONGODB_URI",
  "SESSION_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "RAZORPAY_ID_KEY",
  "RAZORPAY_SECRET_KEY",
  "NODEMAILER_EMAIL",
  "NODEMAILER_PASSWORD",
];

function validateEnv() {
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((varName) => console.error(`  - ${varName}`));
    console.error("\nPlease check your .env file against .env.example");
    console.error(
      "Copy .env.example to .env and fill in the required values.\n"
    );
    process.exit(1);
  }

  console.log("✅ All required environment variables are set");
}

module.exports = validateEnv;
