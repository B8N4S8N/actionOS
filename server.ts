import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { clerkMiddleware, requireAuth } from "@clerk/express";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("actionos.db");

// Initialize DB schema
db.exec(`
  CREATE TABLE IF NOT EXISTS Locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    type TEXT -- Shelter, Office, Mobile, etc.
  );

  CREATE TABLE IF NOT EXISTS Roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_meta INTEGER DEFAULT 0 -- 1 for Admin/Director roles
  );

  CREATE TABLE IF NOT EXISTS User_Access (
    user_id TEXT,
    role_id TEXT,
    location_id TEXT,
    PRIMARY KEY (user_id, role_id, location_id),
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (role_id) REFERENCES Roles(id),
    FOREIGN KEY (location_id) REFERENCES Locations(id)
  );

  CREATE TABLE IF NOT EXISTS Users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    firstName TEXT,
    lastName TEXT,
    status TEXT DEFAULT 'Pending' -- Active, Pending, Disabled
  );

  CREATE TABLE IF NOT EXISTS Inventory (
    id TEXT PRIMARY KEY,
    location_id TEXT,
    category TEXT, -- Facility, Donation, Food
    item_name TEXT NOT NULL,
    quantity REAL DEFAULT 0,
    unit TEXT,
    min_threshold REAL,
    qr_data TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
    FOREIGN KEY (location_id) REFERENCES Locations(id)
  );

  CREATE TABLE IF NOT EXISTS Inventory_Transactions (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    staff_id TEXT NOT NULL,
    client_id TEXT,
    use_case TEXT,
    type TEXT NOT NULL, -- 'IN', 'OUT', 'USE'
    items_json TEXT NOT NULL,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS Maintenance_Requests (
    id TEXT PRIMARY KEY,
    location_id TEXT,
    requester_id TEXT,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'Open', -- Open, In Progress, Resolved, Cancelled
    priority TEXT DEFAULT 'Medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES Locations(id),
    FOREIGN KEY (requester_id) REFERENCES Users(id)
  );

  CREATE TABLE IF NOT EXISTS HMIS_Records (
    id TEXT PRIMARY KEY,
    client_name_hash TEXT, -- For privacy/HIPAA (simplified hash for demo)
    data_json TEXT, -- Encrypted or structured sensitive data
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Users(id)
  );

  CREATE TABLE IF NOT EXISTS Audit_Logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT,
    resource TEXT,
    resource_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id)
  );

  CREATE TABLE IF NOT EXISTS Clients (
    id TEXT PRIMARY KEY,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    image_url TEXT,
    animal_info TEXT,
    summary TEXT,
    dob TEXT,
    gender TEXT,
    identity TEXT,
    phone TEXT,
    email TEXT,
    medical_issues TEXT,
    addictions TEXT,
    medications TEXT,
    hmis_id TEXT,
    roi_status TEXT DEFAULT 'None',
    roi_url TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Outreach_Interactions (
    id TEXT PRIMARY KEY,
    client_id TEXT,
    user_id TEXT,
    location_desc TEXT,
    services_provided TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES Clients(id),
    FOREIGN KEY (user_id) REFERENCES Users(id)
  );

  CREATE TABLE IF NOT EXISTS Rooms (
    id TEXT PRIMARY KEY,
    location_id TEXT,
    room_number TEXT NOT NULL,
    capacity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'Available',
    FOREIGN KEY (location_id) REFERENCES Locations(id)
  );

  CREATE TABLE IF NOT EXISTS Client_Roster (
    id TEXT PRIMARY KEY,
    client_id TEXT,
    location_id TEXT,
    room_id TEXT,
    check_in_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    check_out_date DATETIME,
    FOREIGN KEY (client_id) REFERENCES Clients(id),
    FOREIGN KEY (location_id) REFERENCES Locations(id),
    FOREIGN KEY (room_id) REFERENCES Rooms(id)
  );

  CREATE TABLE IF NOT EXISTS Case_Notes (
    id TEXT PRIMARY KEY,
    client_id TEXT,
    author_id TEXT,
    note TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES Clients(id),
    FOREIGN KEY (author_id) REFERENCES Users(id)
  );
`);

try {
  db.exec("ALTER TABLE Inventory ADD COLUMN brought_by TEXT");
} catch (e) {
  // Column might already exist
}

try {
  db.exec("ALTER TABLE Inventory ADD COLUMN low_stock_limit INTEGER DEFAULT 10");
} catch (e) {}

try {
  db.exec("ALTER TABLE Inventory ADD COLUMN qr_data TEXT");
} catch (e) {}

try {
  const newCols = [
    "dob TEXT", "gender TEXT", "identity TEXT", "phone TEXT", "email TEXT",
    "medical_issues TEXT", "addictions TEXT", "medications TEXT", "hmis_id TEXT",
    "roi_status TEXT DEFAULT 'None'", "roi_url TEXT", "tags TEXT"
  ];
  for (const col of newCols) {
    try { db.exec(`ALTER TABLE Clients ADD COLUMN ${col}`); } catch (e) {}
  }
} catch (e) {}

try {
  db.prepare("INSERT INTO Roles (id, name, is_meta) VALUES (?, ?, ?)").run('outreach', 'Outreach Worker', 0);
} catch (e) {
  // Role might already exist
}

// Seed initial data
const locationCount = db.prepare("SELECT COUNT(*) as count FROM Locations").get() as { count: number };
if (locationCount.count === 0) {
  const locations = [
    { id: 'loc1', name: 'ARCHES Lodge', type: 'Shelter' },
    { id: 'loc2', name: 'Navigation Center', type: 'Service Center' },
    { id: 'loc3', name: 'Mobile Outreach Van', type: 'Mobile' }
  ];
  const insertLoc = db.prepare("INSERT INTO Locations (id, name, type) VALUES (?, ?, ?)");
  locations.forEach(l => insertLoc.run(l.id, l.name, l.type));

  const roles = [
    { id: 'admin', name: 'Super Admin', is_meta: 1 },
    { id: 'director', name: 'Director', is_meta: 1 },
    { id: 'case_manager', name: 'Case Manager', is_meta: 0 },
    { id: 'facilities', name: 'Facilities Manager', is_meta: 0 },
    { id: 'hr', name: 'HR Manager', is_meta: 0 },
    { id: 'outreach', name: 'Outreach Worker', is_meta: 0 }
  ];
  const insertRole = db.prepare("INSERT OR IGNORE INTO Roles (id, name, is_meta) VALUES (?, ?, ?)");
  roles.forEach(r => insertRole.run(r.id, r.name, r.is_meta));

  // Pre-seed the Super Admin
  db.prepare("INSERT INTO Users (id, email, firstName, lastName, status) VALUES (?, ?, ?, ?, ?)").run(
    "super_admin_placeholder", "ryan.fortin@mwvcaa.org", "Ryan", "Fortin", "Active"
  );
  db.prepare("INSERT INTO User_Access (user_id, role_id, location_id) VALUES (?, ?, ?)").run(
    "super_admin_placeholder", "admin", "loc1"
  );
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  
  // Conditionally use Clerk middleware if keys are present
  // We remove this for now since the user only has a publishable key
  // and the secret key is required for backend verification.
  // The frontend will handle auth and pass data to /api/auth/sync.

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Helper for Audit Logging
  const logAction = (user_id: string, action: string, details: string) => {
    db.prepare("INSERT INTO Audit_Logs (user_id, action, details) VALUES (?, ?, ?)").run(user_id, action, details);
  };

  // Sync user from Clerk to local DB
  app.post("/api/auth/sync", (req, res) => {
    try {
      let { id, email, firstName, lastName } = req.body;
      firstName = firstName || null;
      lastName = lastName || null;
      console.log(`[Sync] Attempting sync for ${email} (${id})`);
      
      if (!id || !email) {
        console.error("[Sync] Missing user data");
        return res.status(400).json({ error: "Missing user data" });
      }

      let user = db.prepare("SELECT * FROM Users WHERE email = ?").get(email) as any;
      
      if (!user) {
        console.log(`[Sync] User ${email} not found, checking super admin status`);
        const superAdmins = ["ryan.fortin@mwvcaa.org", "rykwonfeezy@gmail.com"];
        if (superAdmins.includes(email.toLowerCase())) {
          console.log(`[Sync] Provisioning new super admin: ${email}`);
          db.prepare("INSERT INTO Users (id, email, firstName, lastName, status) VALUES (?, ?, ?, ?, ?)").run(
            id, email, firstName, lastName, "Active"
          );
          db.prepare("INSERT INTO User_Access (user_id, role_id, location_id) VALUES (?, ?, ?)").run(
            id, "admin", "loc1"
          );
          user = { id, email, firstName, lastName, status: "Active" };
        } else {
          console.warn(`[Sync] Unauthorized access attempt: ${email}`);
          return res.status(403).json({ error: "Unauthorized. Please contact your administrator to have an account created." });
        }
      } else {
        console.log(`[Sync] User ${email} found with ID: ${user.id}`);
        
        // Update the ID if it was a placeholder
        if (user.id.includes("placeholder")) {
          console.log(`[Sync] Replacing placeholder ID for: ${email}`);
          try {
            db.prepare("DELETE FROM User_Access WHERE user_id = ?").run(user.id);
            db.prepare("DELETE FROM Users WHERE id = ?").run(user.id);
            db.prepare("INSERT INTO Users (id, email, firstName, lastName, status) VALUES (?, ?, ?, ?, ?)").run(id, email, firstName, lastName, "Active");
            db.prepare("INSERT INTO User_Access (user_id, role_id, location_id) VALUES (?, ?, ?)").run(id, "admin", "loc1");
          } catch (e) {
            console.error("[Sync] Error recreating placeholder user:", e);
          }
          user.id = id;
        }

        // Ensure super admin has access even if they already existed
        const superAdmins = ["ryan.fortin@mwvcaa.org", "rykwonfeezy@gmail.com"];
        if (superAdmins.includes(email.toLowerCase())) {
          const hasAdmin = db.prepare("SELECT COUNT(*) as count FROM User_Access WHERE user_id = ? AND role_id = 'admin'").get(user.id) as { count: number };
          if (hasAdmin.count === 0) {
            console.log(`[Sync] Granting missing admin access to: ${email}`);
            try {
              db.prepare("INSERT INTO User_Access (user_id, role_id, location_id) VALUES (?, ?, ?)").run(
                user.id, "admin", "loc1"
              );
            } catch (e) {
              console.error("[Sync] Error granting admin access:", e);
            }
          }
        }
      }

      // Get roles and locations for this user
      const access = db.prepare(`
        SELECT r.id as role_id, r.name as role_name, l.id as location_id, l.name as location_name
        FROM User_Access ua
        JOIN Roles r ON ua.role_id = r.id
        JOIN Locations l ON ua.location_id = l.id
        WHERE ua.user_id = ?
      `).all(user.id) as any[];

      // Bulletproof guarantee for super admins
      const superAdmins = ["ryan.fortin@mwvcaa.org", "rykwonfeezy@gmail.com"];
      if (superAdmins.includes(email.toLowerCase())) {
        if (!access.find(a => a.role_id === 'admin')) {
          access.push({ role_id: 'admin', role_name: 'Super Admin', location_id: 'loc1', location_name: 'ARCHES Lodge' });
        }
      }

      console.log(`[Sync] Sync successful for ${email}. Roles: ${access.map((a: any) => a.role_id).join(", ")}`);
      res.json({ ...user, access });
    } catch (error: any) {
      console.error("[Sync] Critical error:", error);
      res.status(500).json({ error: "Internal server error during synchronization", details: error.message || String(error) });
    }
  });

  // Admin: Manage Users
  app.get("/api/admin/users", (req, res) => {
    const users = db.prepare(`
      SELECT u.*, ua.role_id, ua.location_id, r.name as role_name, l.name as location_name
      FROM Users u
      LEFT JOIN User_Access ua ON u.id = ua.user_id
      LEFT JOIN Roles r ON ua.role_id = r.id
      LEFT JOIN Locations l ON ua.location_id = l.id
    `).all();
    res.json(users);
  });

  app.put("/api/admin/users/:id", (req, res) => {
    const { role_id, location_id, status } = req.body;
    const { id } = req.params;
    try {
      if (status) {
        db.prepare("UPDATE Users SET status = ? WHERE id = ?").run(status, id);
      }
      if (role_id && location_id) {
        // For simplicity, we just update the first access record or insert if none exists
        const hasAccess = db.prepare("SELECT COUNT(*) as count FROM User_Access WHERE user_id = ?").get(id) as { count: number };
        if (hasAccess.count > 0) {
          db.prepare("UPDATE User_Access SET role_id = ?, location_id = ? WHERE user_id = ?").run(role_id, location_id, id);
        } else {
          db.prepare("INSERT INTO User_Access (user_id, role_id, location_id) VALUES (?, ?, ?)").run(id, role_id, location_id);
        }
      }
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.post("/api/admin/users", (req, res) => {
    const { email, firstName, lastName, role_id, location_id } = req.body;
    const id = `user_${Math.random().toString(36).substring(7)}`;
    try {
      db.prepare("INSERT INTO Users (id, email, firstName, lastName, status) VALUES (?, ?, ?, ?, ?)").run(
        id, email, firstName, lastName, "Active"
      );
      db.prepare("INSERT INTO User_Access (user_id, role_id, location_id) VALUES (?, ?, ?)").run(
        id, role_id, location_id
      );
      logAction(id, "USER_CREATED_BY_ADMIN", `User ${email} created with role ${role_id}`);
      res.json({ success: true, id });
    } catch (e) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Admin: Manage Locations
  app.get("/api/admin/locations", (req, res) => {
    const locations = db.prepare("SELECT * FROM Locations").all();
    res.json(locations);
  });

  app.post("/api/admin/locations", (req, res) => {
    const { name, address, type } = req.body;
    const id = `loc_${Math.random().toString(36).substring(7)}`;
    db.prepare("INSERT INTO Locations (id, name, address, type) VALUES (?, ?, ?, ?)").run(
      id, name, address, type
    );
    logAction("system", "LOCATION_CREATED", `Location ${name} (${type}) created`);
    res.json({ success: true, id });
  });

  // Inventory API
  app.get("/api/inventory", (req, res) => {
    const { category, location_id } = req.query;
    let query = "SELECT i.*, l.name as location_name FROM Inventory i JOIN Locations l ON i.location_id = l.id";
    const params: any[] = [];
    if (category || location_id) {
      query += " WHERE";
      if (category) {
        query += " i.category = ?";
        params.push(category);
      }
      if (location_id) {
        if (category) query += " AND";
        query += " i.location_id = ?";
        params.push(location_id);
      }
    }
    const items = db.prepare(query).all(...params);
    res.json(items);
  });

  app.post("/api/inventory", (req, res) => {
    const { location_id, category, item_name, quantity, unit, updated_by, brought_by, low_stock_limit, qr_data } = req.body;
    const id = Math.random().toString(36).substring(7);
    db.prepare("INSERT INTO Inventory (id, location_id, category, item_name, quantity, unit, updated_by, brought_by, low_stock_limit, qr_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      id, location_id, category, item_name, quantity, unit, updated_by, brought_by || null, low_stock_limit || 10, qr_data || null
    );
    res.json({ success: true, id });
  });

  app.put("/api/inventory/:id", (req, res) => {
    const { id } = req.params;
    const { quantity, updated_by } = req.body;
    db.prepare("UPDATE Inventory SET quantity = ?, updated_by = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?").run(
      quantity, updated_by, id
    );
    res.json({ success: true });
  });

  app.post("/api/inventory/transaction", (req, res) => {
    const { staff_id, client_id, use_case, type, items, image_url } = req.body;
    const id = `tx_${Math.random().toString(36).substring(7)}`;
    
    // items is an array of { id, quantity_change }
    const items_json = JSON.stringify(items);
    
    db.transaction(() => {
      db.prepare(`
        INSERT INTO Inventory_Transactions (id, staff_id, client_id, use_case, type, items_json, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, staff_id, client_id || null, use_case || null, type, items_json, image_url || null);
      
      for (const item of items) {
        if (type === 'OUT' || type === 'USE') {
          db.prepare("UPDATE Inventory SET quantity = quantity - ? WHERE id = ?").run(item.quantity_change, item.id);
        } else if (type === 'IN') {
          db.prepare("UPDATE Inventory SET quantity = quantity + ? WHERE id = ?").run(item.quantity_change, item.id);
        }
      }
    })();
    
    res.json({ success: true, id });
  });

  app.get("/api/inventory/transactions", (req, res) => {
    const txs = db.prepare("SELECT * FROM Inventory_Transactions ORDER BY created_at DESC LIMIT 100").all();
    res.json(txs);
  });

  app.post("/api/inventory/vision", async (req, res) => {
    try {
      const { image_base64, location_id } = req.body;
      
      // Get dynamic list of items
      const items = db.prepare("SELECT item_name FROM Inventory WHERE location_id = ?").all(location_id) as any[];
      const dynamicList = items.map(i => i.item_name).join(", ");
      
      const prompt = `You are an inventory specialist. Compare this image to our Master List: [${dynamicList}]. Count the items in this pile. Return ONLY a JSON object: {"recognized": [{"name": "item_name", "qty": count}], "unknown": [{"description": "description"}]}. If an item is not in the list, mark as unknown.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: image_base64.split(",")[1] || image_base64,
                  mimeType: "image/jpeg"
                }
              },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recognized: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    qty: { type: Type.NUMBER }
                  }
                }
              },
              unknown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });
      
      res.json(JSON.parse(response.text));
    } catch (error: any) {
      console.error("Vision API Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/inventory/reorder-intelligence", async (req, res) => {
    try {
      const txs = db.prepare("SELECT * FROM Inventory_Transactions WHERE created_at >= date('now', '-30 days')").all();
      const inventory = db.prepare("SELECT * FROM Inventory").all();
      
      const prompt = `
        Analyze these transaction logs over the last 30 days and current inventory levels.
        Identify any items that will run out soon based on their usage rate and current_stock.
        Return ONLY a JSON array of alerts: [{"item_name": "name", "days_left": number, "message": "Based on current usage, you will run out of [item] in X days. Would you like to generate an order sheet?"}]
        
        Inventory: ${JSON.stringify(inventory)}
        Transactions: ${JSON.stringify(txs)}
      `;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item_name: { type: Type.STRING },
                days_left: { type: Type.NUMBER },
                message: { type: Type.STRING }
              }
            }
          }
        }
      });
      
      res.json(JSON.parse(response.text));
    } catch (error: any) {
      console.error("Reorder Intelligence API Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Clients API
  app.get("/api/clients", (req, res) => {
    const clients = db.prepare(`
      SELECT c.*, r.room_number, l.name as location_name 
      FROM Clients c
      LEFT JOIN Client_Roster cr ON c.id = cr.client_id AND cr.check_out_date IS NULL
      LEFT JOIN Rooms r ON cr.room_id = r.id
      LEFT JOIN Locations l ON cr.location_id = l.id
    `).all();
    res.json(clients);
  });

  app.post("/api/clients", (req, res) => {
    const { 
      firstName, lastName, animal_info, summary,
      dob, gender, identity, phone, email, medical_issues,
      addictions, medications, hmis_id, image_url, roi_status
    } = req.body;
    const id = `client_${Math.random().toString(36).substring(7)}`;
    db.prepare(`
      INSERT INTO Clients (
        id, firstName, lastName, animal_info, summary,
        dob, gender, identity, phone, email, medical_issues,
        addictions, medications, hmis_id, image_url, roi_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, firstName, lastName, animal_info || null, summary || null,
      dob || null, gender || null, identity || null, phone || null, email || null, medical_issues || null,
      addictions || null, medications || null, hmis_id || null, image_url || null, roi_status || 'None'
    );
    res.json({ success: true, id });
  });

  // Outreach API
  app.get("/api/outreach", (req, res) => {
    const interactions = db.prepare(`
      SELECT o.*, c.firstName, c.lastName, u.firstName as user_firstName, u.lastName as user_lastName
      FROM Outreach_Interactions o
      LEFT JOIN Clients c ON o.client_id = c.id
      LEFT JOIN Users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `).all();
    res.json(interactions);
  });

  app.post("/api/outreach/ai-log", async (req, res) => {
    const { note, user_id, location_desc } = req.body;
    try {
      const prompt = `
        You are an AI assistant for a homeless outreach team.
        Extract the following information from the outreach interaction note.
        If a piece of information is not mentioned, leave it null or empty.
        
        Note: "${note}"
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              firstName: { type: Type.STRING, description: "First name of the client" },
              lastName: { type: Type.STRING, description: "Last name of the client" },
              age: { type: Type.STRING, description: "Age or DOB of the client" },
              gender: { type: Type.STRING, description: "Gender of the client" },
              identity: { type: Type.STRING, description: "Identity or pronouns" },
              phone: { type: Type.STRING, description: "Phone number" },
              medical_issues: { type: Type.STRING, description: "Any medical issues or diseases mentioned" },
              addictions: { type: Type.STRING, description: "Any addictions mentioned" },
              medications: { type: Type.STRING, description: "Any medications mentioned" },
              services_provided: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of services provided (e.g., food, shower, kit)"
              },
              tags: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Any relevant tags for the client"
              }
            }
          }
        }
      });

      const extracted = JSON.parse(response.text);
      
      let client_id = null;
      if (extracted.firstName) {
        const existing = db.prepare("SELECT id FROM Clients WHERE LOWER(firstName) = ? AND LOWER(lastName) = ?").get(
          extracted.firstName.toLowerCase(), 
          (extracted.lastName || "").toLowerCase()
        ) as any;

        if (existing) {
          client_id = existing.id;
          // Update existing client with new info
          const updates = [];
          const params = [];
          
          if (extracted.gender) { updates.push("gender = COALESCE(gender, ?)"); params.push(extracted.gender); }
          if (extracted.identity) { updates.push("identity = COALESCE(identity, ?)"); params.push(extracted.identity); }
          if (extracted.phone) { updates.push("phone = COALESCE(phone, ?)"); params.push(extracted.phone); }
          
          if (updates.length > 0) {
            params.push(client_id);
            db.prepare(`UPDATE Clients SET ${updates.join(", ")} WHERE id = ?`).run(...params);
          }
          
          // Append to text fields
          if (extracted.medical_issues) { db.prepare("UPDATE Clients SET medical_issues = COALESCE(medical_issues, '') || ? WHERE id = ?").run(", " + extracted.medical_issues, client_id); }
          if (extracted.addictions) { db.prepare("UPDATE Clients SET addictions = COALESCE(addictions, '') || ? WHERE id = ?").run(", " + extracted.addictions, client_id); }
          if (extracted.medications) { db.prepare("UPDATE Clients SET medications = COALESCE(medications, '') || ? WHERE id = ?").run(", " + extracted.medications, client_id); }
          if (extracted.tags && extracted.tags.length > 0) {
             const tagStr = extracted.tags.join(", ");
             db.prepare("UPDATE Clients SET tags = COALESCE(tags, '') || ? WHERE id = ?").run(", " + tagStr, client_id);
          }
        } else {
          // Create new client
          client_id = `client_${Math.random().toString(36).substring(7)}`;
          db.prepare(`
            INSERT INTO Clients (id, firstName, lastName, gender, identity, phone, medical_issues, addictions, medications, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            client_id, 
            extracted.firstName, 
            extracted.lastName || "Unknown",
            extracted.gender || null,
            extracted.identity || null,
            extracted.phone || null,
            extracted.medical_issues || null,
            extracted.addictions || null,
            extracted.medications || null,
            extracted.tags ? extracted.tags.join(", ") : null
          );
        }
      }

      const interaction_id = `outreach_${Math.random().toString(36).substring(7)}`;
      db.prepare(`
        INSERT INTO Outreach_Interactions (id, client_id, user_id, location_desc, services_provided, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        interaction_id,
        client_id,
        user_id || "system",
        location_desc || "Unknown Location",
        extracted.services_provided ? extracted.services_provided.join(", ") : null,
        note
      );

      res.json({ success: true, client_id, interaction_id, extracted });
    } catch (e: any) {
      console.error("AI Outreach Log Error:", e);
      res.status(500).json({ error: "Failed to process outreach note" });
    }
  });

  // Rooms API
  app.get("/api/locations/:id/rooms", (req, res) => {
    const rooms = db.prepare(`
      SELECT r.*, COUNT(cr.id) as current_occupancy
      FROM Rooms r
      LEFT JOIN Client_Roster cr ON r.id = cr.room_id AND cr.check_out_date IS NULL
      WHERE r.location_id = ?
      GROUP BY r.id
    `).all(req.params.id);
    res.json(rooms);
  });

  app.post("/api/locations/:id/rooms", (req, res) => {
    const { room_number, capacity } = req.body;
    const id = `room_${Math.random().toString(36).substring(7)}`;
    db.prepare("INSERT INTO Rooms (id, location_id, room_number, capacity) VALUES (?, ?, ?, ?)").run(
      id, req.params.id, room_number, capacity || 1
    );
    res.json({ success: true, id });
  });

  // Assign Client to Room
  app.post("/api/clients/:id/assign", (req, res) => {
    const { location_id, room_id } = req.body;
    const client_id = req.params.id;
    const id = `roster_${Math.random().toString(36).substring(7)}`;
    
    // Check out of previous room
    db.prepare("UPDATE Client_Roster SET check_out_date = CURRENT_TIMESTAMP WHERE client_id = ? AND check_out_date IS NULL").run(client_id);
    
    // Assign to new room
    if (location_id && room_id) {
      db.prepare("INSERT INTO Client_Roster (id, client_id, location_id, room_id) VALUES (?, ?, ?, ?)").run(
        id, client_id, location_id, room_id
      );
      db.prepare("UPDATE Rooms SET status = 'Occupied' WHERE id = ?").run(room_id);
    }
    
    res.json({ success: true });
  });

  // Case Notes API
  app.get("/api/clients/:id/notes", (req, res) => {
    const notes = db.prepare(`
      SELECT cn.*, u.firstName, u.lastName 
      FROM Case_Notes cn
      LEFT JOIN Users u ON cn.author_id = u.id
      WHERE cn.client_id = ?
      ORDER BY cn.created_at DESC
    `).all(req.params.id);
    res.json(notes);
  });

  app.post("/api/clients/:id/notes", async (req, res) => {
    const { note, author_id } = req.body;
    const client_id = req.params.id;
    const id = `note_${Math.random().toString(36).substring(7)}`;
    
    db.prepare("INSERT INTO Case_Notes (id, client_id, author_id, note) VALUES (?, ?, ?, ?)").run(
      id, client_id, author_id, note
    );

    // Auto-summarize using Gemini
    try {
      const client = db.prepare("SELECT * FROM Clients WHERE id = ?").get(client_id) as any;
      const allNotes = db.prepare("SELECT note FROM Case_Notes WHERE client_id = ? ORDER BY created_at ASC").all(client_id) as any[];
      const notesText = allNotes.map((n: any) => n.note).join("\n");
      
      const prompt = `Summarize the following case notes for client ${client.firstName} ${client.lastName}. Keep it concise, professional, and highlight key needs or progress:\n\n${notesText}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      const newSummary = response.text;
      db.prepare("UPDATE Clients SET summary = ? WHERE id = ?").run(newSummary, client_id);
    } catch (e) {
      console.error("Failed to generate summary:", e);
    }

    res.json({ success: true, id });
  });

  // Maintenance API
  app.get("/api/maintenance", (req, res) => {
    const requests = db.prepare(`
      SELECT mr.*, l.name as location_name, u.firstName, u.lastName 
      FROM Maintenance_Requests mr
      JOIN Locations l ON mr.location_id = l.id
      JOIN Users u ON mr.requester_id = u.id
    `).all();
    res.json(requests);
  });

  // HMIS API (Simplified for Demo)
  app.get("/api/hmis", (req, res) => {
    const records = db.prepare("SELECT * FROM HMIS_Records ORDER BY created_at DESC").all();
    res.json(records);
  });

  app.post("/api/hmis", (req, res) => {
    const { client_name, data_json, created_by } = req.body;
    const id = Math.random().toString(36).substring(7);
    const client_name_hash = Buffer.from(client_name).toString('base64'); // Simple obfuscation
    db.prepare("INSERT INTO HMIS_Records (id, client_name_hash, data_json, created_by) VALUES (?, ?, ?, ?)").run(
      id, client_name_hash, JSON.stringify(data_json), created_by
    );
    res.json({ success: true, id });
  });

  // Trigger SOS
  app.post("/api/sos", (req, res) => {
    const { site_id, user_id, severity_level } = req.body;
    const id = Math.random().toString(36).substring(7);
    db.prepare("INSERT INTO Incidents_SOS (id, site_id, user_id, status, severity_level) VALUES (?, ?, ?, ?, ?)").run(
      id, site_id || "s1", user_id || "u1", "Active", severity_level || "High"
    );
    res.json({ success: true, id });
  });

  // Action Button - Process via Gemini Flash and Pro
  app.post("/api/action", async (req, res) => {
    try {
      const { text, imageBase64, user_id, site_id } = req.body;
      
      const parts: any[] = [];
      if (text) {
        parts.push({ text });
      }
      if (imageBase64) {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64.split(',')[1] || imageBase64
          }
        });
      }

      // Tier 1: Gemini Flash (The Worker) - Transcribe, parse, extract
      const flashResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: {
          systemInstruction: "You are an AI assistant for MWVCAA ARCHES program. Extract a clear summary, identify any actionable tasks or maintenance issues, and suggest routing tags from the provided text or image."
        }
      });
      
      const flashSummary = flashResponse.text || "";

      // Save log
      const logId = Math.random().toString(36).substring(7);
      db.prepare("INSERT INTO Logs (id, user_id, site_id, raw_content, ai_summary, tags, needs_sync) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        logId, user_id || "u1", site_id || "s1", text || "[Image Data]", flashSummary, "[]", 0
      );

      // Tier 2: Gemini Pro (The Agentic Brain) - Deep reasoning, routing
      const proResponse = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Analyze this log summary and determine if a task/work order needs to be created.
        Summary: ${flashSummary}
        
        If a task is needed, output a JSON object with:
        - needsTask: boolean
        - assigned_to_role: string (e.g., "Facilities", "Director", "Site Lead", "HR")
        - priority: string ("Low", "Medium", "High", "Critical")
        - description: string
        
        If no task is needed, output { "needsTask": false }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              needsTask: { type: Type.BOOLEAN },
              assigned_to_role: { type: Type.STRING },
              priority: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["needsTask"]
          }
        }
      });

      let taskCreated = false;
      try {
        const proResult = JSON.parse(proResponse.text || "{}");
        if (proResult.needsTask) {
          const taskId = Math.random().toString(36).substring(7);
          db.prepare("INSERT INTO Tasks_WorkOrders (id, assigned_to_role, priority, status, description, linked_log_id) VALUES (?, ?, ?, ?, ?, ?)").run(
            taskId, proResult.assigned_to_role || "Facilities", proResult.priority || "Medium", "Open", proResult.description || "Auto-generated task", logId
          );
          taskCreated = true;
        }
      } catch (e) {
        console.error("Failed to parse Pro response:", e);
      }

      res.json({ success: true, logId, summary: flashSummary, taskCreated });
    } catch (error) {
      console.error("Action API Error:", error);
      res.status(500).json({ error: "Failed to process action" });
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
