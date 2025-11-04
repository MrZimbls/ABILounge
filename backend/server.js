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
    const sb = sbAsUser(req);
    const { data, error } = await sb
      .from("t_ammunition_types")
      .select("*, t_ammunition(a_id, a_caliber)");
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (e) {
    console.error(e);
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

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
