import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { queryWeapons } from "./filters.js";

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const PUBLIC_KEY   = process.env.SUPABASE_PUBLIC_KEY;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PORT         = process.env.PORT || 8787;

if (!SUPABASE_URL || !PUBLIC_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_PUBLIC_KEY in env");
  process.exit(1);
}

function sbAsUser(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  return createClient(SUPABASE_URL, PUBLIC_KEY, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  });
}

function sbAsService() {
  if (!SERVICE_KEY) throw new Error("SERVICE_ROLE_KEY not set");
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

// Role hierarchy: viewer < developer < admin
const roleHierarchy = {
  viewer: 1,
  developer: 2,
  admin: 3,
};

// Middleware to require at least developer role
async function requireDeveloperRole(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    
    if (!token) {
      return res.status(401).json({ 
        error: "unauthorized", 
        message: "Authentication token required" 
      });
    }

    // Use service role to validate the demo code via RPC
    const sb = sbAsService();
    
    // Call the RPC function to authenticate and get role
    const { data, error } = await sb.rpc("authenticate_demo_code", {
      code_input: token
    });

    if (error) {
      console.error("RPC error in middleware:", error);
      return res.status(401).json({ 
        error: "invalid_token", 
        message: "Invalid or expired authentication token" 
      });
    }

    // Check if code was found and authenticated
    if (!data || data.length === 0 || !data[0]) {
      return res.status(401).json({ 
        error: "invalid_token", 
        message: "Invalid or expired authentication token" 
      });
    }

    const demoCode = data[0];
    const userRole = demoCode.role;
    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy["developer"] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({ 
        error: "insufficient_permissions", 
        message: "Developer role or higher required" 
      });
    }

    // Attach role info to request for use in route handlers
    req.userRole = userRole;
    next();
  } catch (e) {
    console.error("Auth middleware error:", e);
    return res.status(500).json({ 
      error: "server_error", 
      detail: String(e) 
    });
  }
}

// Healthcheck
app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/weapons", async (req, res) => {
    console.log("Handling get weapons")
    try {
        const sb = sbAsUser(req)
        const { data, error } = await sb.from("t_weapons").select();
        if (error) return res.status(400).json({ error: error.message });
        res.json({data});
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "server_error", detail: String(e) });
    }
});

// List ammunition (ids and calibers)
app.get("/api/ammunition", async (req, res) => {
  try {
    const sb = sbAsUser(req);
    const { data, error } = await sb.from("t_ammunition").select("a_id, a_caliber");
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error", detail: String(e) });
  }
});

// List all ammunition types with joined caliber information
app.get("/api/ammunition/types", async (req, res) => {
  try {
    const sb = sbAsService();
    
    // Try relationship query first
    const relationshipResult = await sb
      .from("t_ammunition_types")
      .select("*, t_ammunition(a_id, a_caliber)");
    
    // If relationship query works, use it
    if (!relationshipResult.error && relationshipResult.data) {
      return res.json({ data: relationshipResult.data });
    }
    
    // If relationship query fails, do manual join
    console.log("Relationship query failed, using manual join. Error:", relationshipResult.error?.message);
    
    const typesResult = await sb
      .from("t_ammunition_types")
      .select("*");
    
    if (typesResult.error) {
      console.error("Supabase query error:", typesResult.error);
      return res.status(400).json({ error: typesResult.error.message, code: typesResult.error.code });
    }
    
    if (!typesResult.data) {
      return res.json({ data: [] });
    }
    
    // Manually join with t_ammunition
    const ammoResult = await sb
      .from("t_ammunition")
      .select("a_id, a_caliber");
    
    if (ammoResult.error) {
      console.error("Error fetching ammunition data:", ammoResult.error);
      // Return data without join if ammo fetch fails
      return res.json({ data: typesResult.data });
    }
    
    // Create map for efficient lookup (handle both string and number IDs)
    const ammoMap = new Map();
    if (ammoResult.data) {
      ammoResult.data.forEach(a => {
        // Store with both number and string keys for flexible lookup
        const id = a.a_id;
        ammoMap.set(id, a);
        ammoMap.set(String(id), a);
        ammoMap.set(Number(id), a);
      });
    }
    
    // Join the data
    const joinedData = typesResult.data.map(row => {
      const caliberId = row.at_caliber;
      const ammo = caliberId ? (ammoMap.get(caliberId) || ammoMap.get(String(caliberId)) || ammoMap.get(Number(caliberId)) || null) : null;
      return {
        ...row,
        t_ammunition: ammo
      };
    });
    
    res.json({ data: joinedData });
  } catch (e) {
    console.error("Server error:", e);
    res.status(500).json({ error: "server_error", detail: String(e) });
  }
});

// Search with filters, pagination, and optional sorting
app.post("/api/weapons/search", async (req, res) => {
  try {
    const sb = sbAsUser(req);
    const { page, perPage, sortBy, sortDir, filters } = req.body || {};
    const { data, count, error } = await queryWeapons(sb, {
      page,
      perPage,
      sortBy,
      sortDir,
      filters,
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data, total: count, page: Number(page) || 1, perPage: Number(perPage) || 20 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error", detail: String(e) });
  }
});

// Authenticate with demo code
app.post("/api/auth/demo", async (req, res) => {
  try {
    const { code } = req.body || {};
    
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "code_required", message: "Demo code is required" });
    }

    // Use service role to call RPC function
    const sb = sbAsService();
    
    // Call the RPC function to authenticate and update last_use atomically
    const { data, error } = await sb.rpc("authenticate_demo_code", {
      code_input: code.trim()
    });

    if (error) {
      console.error("RPC error:", error);
      return res.status(500).json({ 
        error: "server_error", 
        message: "Authentication service error",
        detail: error.message 
      });
    }

    // Check if code was found and authenticated
    if (!data || data.length === 0 || !data[0]) {
      return res.status(401).json({ 
        error: "invalid_code", 
        message: "Invalid or expired demo code" 
      });
    }

    const demoCode = data[0];

    // Return success with role information
    res.json({
      success: true,
      role: demoCode.role,
      code: demoCode.code,
      last_use: demoCode.last_use,
    });
  } catch (e) {
    console.error("Demo auth error:", e);
    res.status(500).json({ error: "server_error", detail: String(e) });
  }
});

// Update a specific weapon (requires developer role)
app.put("/api/weapons/:id", requireDeveloperRole, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({ error: "id_required", message: "Weapon ID is required" });
    }

    const sb = sbAsService();
    
    // Update the weapon
    const { data, error } = await sb
      .from("t_weapons")
      .update(updateData)
      .eq("w_id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "not_found", message: "Weapon not found" });
    }

    res.json({ data, message: "Weapon updated successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error", detail: String(e) });
  }
});

// Update a specific ammunition type (requires developer role)
app.put("/api/ammunition/types/:id", requireDeveloperRole, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({ error: "id_required", message: "Ammunition type ID is required" });
    }

    const sb = sbAsService();
    
    // Update the ammunition type
    const { data, error } = await sb
      .from("t_ammunition_types")
      .update(updateData)
      .eq("at_id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "not_found", message: "Ammunition type not found" });
    }

    res.json({ data, message: "Ammunition type updated successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error", detail: String(e) });
  }
});

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
