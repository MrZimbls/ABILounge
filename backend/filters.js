import { createClient } from "@supabase/supabase-js";

// Map frontend filter keys to database column names
const NUMERIC_FILTER_MAP = {
  vRecoil: "w_vrecoil",
  hRecoil: "w_hrecoil",
  ergo: "w_ergonomics",
  wStab: "w_stability",
  accuracy: "w_accuracy",
  hfStab: "w_hipfire",
  range: "w_range",
  velocity: "w_velocity",
  rpm: "w_rpm",
  price: "w_price",
};

// Known firing modes (used to compute allowed when excluded provided)
const KNOWN_FIRING_MODES = ["semi", "burst", "full"];

// Map frontend weapon type keys to DB values (CSV shows singular names)
const WEAPON_TYPE_MAP = {
  "assault-rifles": "Assault Rifle",
  "submachine-guns": "Submachine Gun",
  carbine: "Carbine",
  "marksman-rifle": "Marksman Rifle",
  "bolt-action-rifle": "Bolt-Action Rifle",
  shotgun: "Shotgun",
  "light-machine-gun": "Light Machine Gun",
  pistol: "Pistol",
};

function getColumnForSort(sortBy) {
  if (!sortBy) return null;
  // Accept either frontend keys or direct DB columns
  if (NUMERIC_FILTER_MAP[sortBy]) return NUMERIC_FILTER_MAP[sortBy];
  if (sortBy.startsWith("w_")) return sortBy;
  if (sortBy === "name") return "w_name";
  if (sortBy === "type") return "w_type";
  return null;
}

export async function queryWeapons(sb, args) {
  const {
    page = 1,
    perPage = 20,
    sortBy,
    sortDir = "asc",
    filters = {},
  } = args || {};

  const start = Math.max(0, (Number(page) - 1) * Number(perPage));
  const end = start + Number(perPage) - 1;

  let query = sb.from("t_weapons").select("*", { count: "exact" });

  // Numeric range filters (XMin/XMax)
  Object.entries(NUMERIC_FILTER_MAP).forEach(([key, column]) => {
    const minVal = filters[`${key}Min`];
    const maxVal = filters[`${key}Max`];
    if (minVal !== undefined && minVal !== null && minVal !== "") {
      query = query.gte(column, Number(minVal));
    }
    if (maxVal !== undefined && maxVal !== null && maxVal !== "") {
      query = query.lte(column, Number(maxVal));
    }
  });

  // Weapon type filtering via excludedWeaponTypes or includedWeaponTypes
  const excludedWeaponTypes = Array.isArray(filters.excludedWeaponTypes)
    ? filters.excludedWeaponTypes
    : [];
  const includedWeaponTypes = Array.isArray(filters.includedWeaponTypes)
    ? filters.includedWeaponTypes
    : null;

  if (includedWeaponTypes && includedWeaponTypes.length > 0) {
    // Accept either mapped keys or raw DB labels
    const allowed = includedWeaponTypes.map((t) => WEAPON_TYPE_MAP[t] || t);
    query = query.in("w_type", allowed);
  } else if (excludedWeaponTypes.length > 0) {
    // Compute allowed by subtracting from known keys if only excluded provided
    const allKnown = Object.values(WEAPON_TYPE_MAP);
    const excluded = excludedWeaponTypes.map((t) => WEAPON_TYPE_MAP[t] || t);
    const allowed = allKnown.filter((t) => !excluded.includes(t));
    if (allowed.length > 0) {
      query = query.in("w_type", allowed);
    }
  }

  // Ammunition filtering
  const ammunitionTypes = Array.isArray(filters.ammunitionTypes)
    ? filters.ammunitionTypes
    : [];
  if (ammunitionTypes.length > 0) {
    query = query.in("w_ammunition", ammunitionTypes);
  }

  // Firing mode filtering (column is comma-separated text; use ilike ORs)
  const excludedFiringModes = Array.isArray(filters.excludedFiringModes)
    ? filters.excludedFiringModes
    : [];
  let allowedModes = KNOWN_FIRING_MODES;
  if (excludedFiringModes.length > 0) {
    allowedModes = KNOWN_FIRING_MODES.filter(
      (m) => !excludedFiringModes.includes(m)
    );
  }
  if (allowedModes.length > 0 && allowedModes.length < KNOWN_FIRING_MODES.length) {
    // Only apply filter if not all modes are allowed
    const orParts = allowedModes.map((m) => `w_firingmode.ilike.%${m}%`);
    query = query.or(orParts.join(","));
  }

  // Sorting
  const sortColumn = getColumnForSort(sortBy);
  if (sortColumn) {
    query = query.order(sortColumn, { ascending: String(sortDir).toLowerCase() !== "desc" });
  }

  // Pagination
  query = query.range(start, end);

  const { data, error, count } = await query;
  return { data: data || [], count: count || 0, error };
}



