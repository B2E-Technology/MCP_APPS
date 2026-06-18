/* ══════════════════════════════════════════════
   api.js — Social Media User Master
   All dynamic API functionality lives here.
   ══════════════════════════════════════════════ */

const API = {
  baseUrl:       "https://api.apistudio.app",
  uid:           "svv0201",

  /* ── Auth endpoints (always fixed) ───────── */
  secretKeyPath: "/auth/api/tbl/svv0201",   // GET  → { secret_key }
  tokenPath:     "/auth/token",             // POST { secret_key } → { access_token }

  /* ── CRUD endpoints ───────────────────────── */
  listPath:      "/getapi/rest/v1/auth/all_fields/svv02_user_master_01/all",
  createPath:    "/postapi/rest/v1/auth/svv02_user_master_01",
  updatePath:    "/updateapi/rest/v1/auth/svv02_user_master_01/{id}/",  // psk_id in URL, NOT body
  deletePath:    "/deleteapi/rest/v1/auth/svv02_user_master_01/{id}/"   // trailing slash required
};

/* ── Editable fields sent in create/update body ───────────
   NEVER include psk_id, psk_uid, or system fields here.   */
const EDITABLE_FIELDS = [
  "firstname",
  "lastname",
  "middlename",
  "username",
  "email",
  "mobile",
  "member_type",
  "user_gender",
  "user_dob",
  "expiry_date",
  "user_profile",
  "user_intro",
  "user_bio",
  "user_address",
  "user_father_name",
  "user_spouse_name",
  "user_marital_status",
  "user_marital_type",
  "user_kyc",
];

/* ── Token cache (55-minute window) ──────────────────────── */
let _token   = null;
let _tokenAt = 0;

async function getSecretKey() {
  const res = await fetch(API.baseUrl + API.secretKeyPath);
  if (!res.ok) throw new Error("Secret key fetch failed: " + res.status);
  const data = await res.json();
  return data.secret_key;
}

async function getAccessToken(secretKey) {
  const res = await fetch(API.baseUrl + API.tokenPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret_key: secretKey })
  });
  if (!res.ok) throw new Error("Token fetch failed: " + res.status);
  const data = await res.json();
  return data.access_token;
}

async function authHeaders() {
  const now = Date.now();
  if (_token && now - _tokenAt < 55 * 60 * 1000) {
    return { "Authorization": "Bearer " + _token, "Content-Type": "application/json" };
  }
  const sk = await getSecretKey();
  _token   = await getAccessToken(sk);
  _tokenAt = now;
  return { "Authorization": "Bearer " + _token, "Content-Type": "application/json" };
}

/* ── List ─────────────────────────────────────────────────── */
async function apiList() {
  const headers = await authHeaders();
  const res = await fetch(API.baseUrl + API.listPath, { headers });
  if (!res.ok) throw new Error("List failed: " + res.status);
  const json = await res.json();
  if (json && json.data && Array.isArray(json.data.data)) return json.data.data;
  if (json && Array.isArray(json.data))                   return json.data;
  if (Array.isArray(json))                                return json;
  throw new Error(json.message || "Unexpected list response");
}

/* ── Create ───────────────────────────────────────────────── */
async function apiCreate(payload) {
  const headers = await authHeaders();
  const body = {};
  EDITABLE_FIELDS.forEach(f => { if (payload[f] !== undefined) body[f] = payload[f]; });
  const res = await fetch(API.baseUrl + API.createPath, {
    method: "POST",
    headers,
    body: JSON.stringify({ data: body })
  });
  if (!res.ok) throw new Error("Create failed: " + res.status);
  return res.json();
}

/* ── Update ───────────────────────────────────────────────── */
async function apiUpdate(id, payload) {
  const headers = await authHeaders();
  /* psk_id goes in URL only — never in body */
  const url = API.baseUrl + API.updatePath.replace("{id}", encodeURIComponent(id));
  const body = {};
  EDITABLE_FIELDS.forEach(f => { if (payload[f] !== undefined) body[f] = payload[f]; });
  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify({ data: body })
  });
  if (!res.ok) throw new Error("Update failed: " + res.status);
  return res.json();
}

/* ── Delete ───────────────────────────────────────────────── */
async function apiDelete(id) {
  const headers = await authHeaders();
  const url = API.baseUrl + API.deletePath.replace("{id}", encodeURIComponent(id));
  const res = await fetch(url, { method: "DELETE", headers });
  if (!res.ok) throw new Error("Delete failed: " + res.status);
  return res.json();
}
