const allowedOrigins: string[] = [
  "http://127.0.0.1:5500",
  "http://localhost:5173",
  "http://localhost:8080",
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

export default allowedOrigins;
