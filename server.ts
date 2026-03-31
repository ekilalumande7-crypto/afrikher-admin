import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Dashboard Stats
  app.get("/api/admin/stats", (req, res) => {
    // Mocked stats
    res.json({
      totalArticles: 124,
      totalOrders: 45,
      revenueMonth: 12500,
      activeSubscribers: 890,
      newUsersWeek: 56,
      pendingPartners: 12,
      revenueHistory: [
        { month: 'Oct', revenue: 8000 },
        { month: 'Nov', revenue: 9500 },
        { month: 'Dec', revenue: 11000 },
        { month: 'Jan', revenue: 10500 },
        { month: 'Feb', revenue: 12000 },
        { month: 'Mar', revenue: 12500 },
      ]
    });
  });

  // Articles
  app.get("/api/admin/articles", (req, res) => {
    res.json([
      { id: 1, title: "L'art du tissage traditionnel", category: "Culture", status: "published", date: "2024-03-20" },
      { id: 2, title: "Nouveautés cosmétiques bio", category: "Beauté", status: "draft", date: "2024-03-22" },
    ]);
  });

  // Mocked image upload
  app.post("/api/admin/upload", (req, res) => {
    res.json({ url: "https://picsum.photos/seed/afrikher/800/600" });
  });

  // Newsletter
  app.post("/api/admin/newsletter/send", (req, res) => {
    const { subject, body } = req.body;
    console.log(`Sending newsletter: ${subject}`);
    res.json({ success: true, message: "Campaign sent successfully via Brevo (Mocked)" });
  });

  // Partners
  app.post("/api/admin/partners/validate", (req, res) => {
    const { partnerId } = req.body;
    res.json({ success: true, message: `Partner ${partnerId} validated` });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
