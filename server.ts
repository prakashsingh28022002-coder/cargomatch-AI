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

  // Mock Database (In-memory for Vercel compatibility/simplicity)
  let trucks = [
    { id: "T1", driver: "Rajesh Kumar", location: "Jaipur", destination: "Delhi", capacity: 10, status: "unloading", lastUpdated: new Date().toISOString() },
    { id: "T2", driver: "Amit Singh", location: "Gurgaon", destination: "Jaipur", capacity: 8, status: "empty", lastUpdated: new Date().toISOString() },
    { id: "T3", driver: "Suresh Pal", location: "Delhi", destination: "Chandigarh", capacity: 12, status: "en-route", lastUpdated: new Date().toISOString() },
  ];

  let shipments = [
    { id: "S1", origin: "Jaipur", destination: "Delhi", weight: 8, deadline: "2026-03-12", status: "available", price: 15000 },
    { id: "S2", origin: "Jaipur", destination: "Gurgaon", weight: 5, deadline: "2026-03-11", status: "available", price: 12000 },
    { id: "S3", origin: "Delhi", destination: "Jaipur", weight: 10, deadline: "2026-03-13", status: "available", price: 18000 },
  ];

  // API Routes
  app.get("/api/trucks", (req, res) => {
    res.json(trucks);
  });

  app.post("/api/trucks", (req, res) => {
    const newTruck = { 
      id: `T${trucks.length + 1}`, 
      ...req.body, 
      status: "empty", 
      lastUpdated: new Date().toISOString() 
    };
    trucks.push(newTruck);
    res.json(newTruck);
  });

  app.get("/api/shipments", (req, res) => {
    res.json(shipments);
  });

  app.post("/api/shipments", (req, res) => {
    const newShipment = { 
      id: `S${shipments.length + 1}`, 
      ...req.body, 
      status: "available",
      price: parseInt(req.body.price) || 5000
    };
    shipments.push(newShipment);
    res.json(newShipment);
  });

  app.post("/api/match", (req, res) => {
    const { truckId, shipmentId } = req.body;
    const truck = trucks.find(t => t.id === truckId);
    const shipment = shipments.find(s => s.id === shipmentId);

    if (truck && shipment) {
      truck.status = "matched";
      shipment.status = "assigned";
      res.json({ success: true, message: `Truck ${truckId} matched with Shipment ${shipmentId}` });
    } else {
      res.status(404).json({ success: false, message: "Truck or Shipment not found" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
