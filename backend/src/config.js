import "dotenv/config";

const config = {
  port: Number(process.env.PORT),
  dbHost: process.env.DB_HOST,
  dbPort: Number(process.env.DB_PORT),
  dbName: process.env.DB_NAME,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  uploadDir: process.env.UPLOAD_DIR,
  corsOrigin: process.env.CORS_ORIGIN,
  imageBaseUrl: process.env.IMAGE_BASE_URL.replace(/\/$/, ""),
  nodeEnv: process.env.NODE_ENV,
};

export default config;
