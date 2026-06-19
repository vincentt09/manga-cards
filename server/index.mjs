import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GridFSBucket, MongoClient, ObjectId } from "mongodb";
import { BOOSTER_TYPES, CARD_POOL, getCoinReward, getDuplicatesForUpgrade, getLevelFromXp, getTotalIncome, getXpReward } from "../src/lib/gameData.js";
import { getTalent } from "../src/lib/talentData.js";
import { LEVEL_REWARDS } from "../src/lib/levelRewards.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}
const dataDir = path.join(root, "data");
const dbFile = path.join(dataDir, "database.json");
const port = Number(process.env.PORT || 8787);
const frontendUrl = process.env.APP_URL || "http://127.0.0.1:5173";
const mongoUri = process.env.MONGODB_URI;
const mongoDatabaseName = process.env.MONGODB_DATABASE || "manga_cards";
let mongoClient;
let warnedAboutMongo = false;
let dbCache = null;

const EXTRA_CHARACTERS = {
  Naruto: ["Gaara", "Jiraiya", "Tsunade", "Orochimaru", "Minato Namikaze"],
  "One Piece": ["Usopp", "Nico Robin", "Tony Tony Chopper", "Trafalgar Law", "Portgas D. Ace", "Boa Hancock"],
  "Dragon Ball": ["Piccolo", "Trunks", "Krillin", "Android 18", "Beerus", "Broly"],
  "Attack on Titan": ["Armin Arlert", "Erwin Smith", "Hange Zoe", "Reiner Braun", "Annie Leonhart", "Jean Kirstein", "Sasha Blouse"],
  "Demon Slayer": ["Inosuke Hashibira", "Giyu Tomioka", "Shinobu Kocho", "Tengen Uzui", "Mitsuri Kanroji", "Muichiro Tokito"],
  "Jujutsu Kaisen": ["Nobara Kugisaki", "Yuta Okkotsu", "Maki Zenin", "Toge Inumaki", "Kento Nanami", "Toji Fushiguro"],
  "My Hero Academia": ["Shoto Todoroki", "Ochaco Uraraka", "Tenya Iida", "Endeavor", "Hawks", "Tomura Shigaraki", "Dabi"],
};
const rarityTemplates = {
  normale: { suffix: "n", power: 45, attack: 42, defense: 40, speed: 44 },
  legendaire: { suffix: "l", power: 92, attack: 90, defense: 84, speed: 90 },
  "secrète": { suffix: "s", power: 108, attack: 106, defense: 97, speed: 105 },
  manga_god: { suffix: "mg", power: 121, attack: 118, defense: 105, speed: 115 },
};
const slug = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const generatedCatalogCards = Object.entries(EXTRA_CHARACTERS).flatMap(([anime, names]) => names.flatMap((name, characterIndex) =>
  Object.entries(rarityTemplates).map(([rarity, template]) => ({
    id: `catalog_${slug(anime)}_${slug(name)}_${template.suffix}`,
    name, anime, rarity, edition: "standard", is_collector: false, is_active: true,
    basePower: template.power + characterIndex, baseAttack: template.attack + characterIndex,
    baseDefense: template.defense + characterIndex, baseSpeed: template.speed + characterIndex, image_url: null,
  })),
));
const baseCardCatalog = [
  ...CARD_POOL.map((card) => ({ ...card, edition: "standard", is_collector: false, is_active: true })),
  ...generatedCatalogCards,
];
const ENDGAME_FRAME_ID = "frame_legend_sakura";
const baseFrameCatalog = [{
  id: ENDGAME_FRAME_ID,
  name: "Relique Sakura — Légende",
  description: "Un cadre ultime réservé aux collectionneurs ayant achevé le contenu end-game.",
  rarity: "manga_god",
  effect: "shimmer",
  source_type: "endgame",
  image_url: "/assets/frames/legend-sakura.png?v=2",
  is_active: true,
  is_endgame: true,
  price_coins: 5_000_000,
  price_gems: 500,
  requirements: { min_level: 75, manga_god_cards: 10, level_100_cards: 1 },
}];
const FUSION_RECIPES = {
  normale: { count: 5, copiesEach: 5, result: "legendaire", cost: 50_000, minLevel: 10, xp: 1_000 },
  legendaire: { count: 5, copiesEach: 3, result: "secrète", cost: 250_000, minLevel: 15, xp: 5_000 },
  "secrète": { count: 5, copiesEach: 2, result: "manga_god", cost: 1_000_000, minLevel: 25, xp: 25_000, weekly: true },
};
const weekKey = (date = new Date()) => {
  const value = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((value - yearStart) / 86_400_000) + 1) / 7);
  return `${value.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

const emptyDb = () => ({ users: [], sessions: [], resetTokens: [], oauthStates: [], entities: {} });
const localDb = () => {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbFile)) return emptyDb();
  try { return { ...emptyDb(), ...JSON.parse(fs.readFileSync(dbFile, "utf8")) }; }
  catch { return emptyDb(); }
};
const mongoDb = async () => {
  if (!mongoUri) return null;
  if (!mongoClient) {
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    console.log(`MongoDB connecte : ${mongoDatabaseName}`);
  }
  return mongoClient.db(mongoDatabaseName);
};
const syncMongoCollection = async (collection, rows) => {
  const ids = rows.map((row) => row.id);
  if (rows.length) {
    await collection.bulkWrite(rows.map((row) => ({
      replaceOne: { filter: { id: row.id }, replacement: row, upsert: true },
    })));
  }
  await collection.deleteMany(ids.length ? { id: { $nin: ids } } : {});
};
const entityCollectionName = (name) => name === "Card" ? "cards" : `entity_${name}`;
const stackOwnedCards = (cards = []) => {
  const stacked = new Map();
  let changed = false;
  for (const card of cards) {
    const identity = card.card_definition_id || `${card.anime || ""}:${card.name || ""}:${card.rarity || ""}`;
    const key = `${card.created_by_id || card.created_by || ""}:${identity}`;
    const current = stacked.get(key);
    if (!current) {
      stacked.set(key, { ...card, duplicates: Math.max(1, Number(card.duplicates || 1)), level: Math.min(100, Math.max(1, Number(card.level || 1))) });
      continue;
    }
    changed = true;
    current.duplicates += Math.max(1, Number(card.duplicates || 1));
    current.level = Math.max(current.level, Math.min(100, Number(card.level || 1)));
    current.power = Math.max(Number(current.power || 0), Number(card.power || 0));
    current.attack = Math.max(Number(current.attack || 0), Number(card.attack || 0));
    current.defense = Math.max(Number(current.defense || 0), Number(card.defense || 0));
    current.speed = Math.max(Number(current.speed || 0), Number(card.speed || 0));
    current.is_favorite = Boolean(current.is_favorite || card.is_favorite);
    current.updated_date = new Date().toISOString();
  }
  return { cards: [...stacked.values()], changed };
};
const readDb = async () => {
  if (dbCache) return dbCache;
  const db = localDb();
  const remote = await mongoDb();
  if (!remote) {
    if (!warnedAboutMongo) { console.warn("MongoDB non configure : stockage JSON local actif."); warnedAboutMongo = true; }
    dbCache = db;
    return dbCache;
  }
  const collectionNames = (await remote.listCollections({}, { nameOnly: true }).toArray()).map((item) => item.name);
  const [users, cards] = await Promise.all([remote.collection("users").find({}).toArray(), remote.collection("cards").find({}).toArray()]);
  if (!users.length && db.users.length) await remote.collection("users").insertMany(db.users);
  else db.users = users.map(({ _id, ...user }) => user);
  db.entities.Card ||= [];
  if (!cards.length && db.entities.Card.length) await remote.collection("cards").insertMany(db.entities.Card);
  else db.entities.Card = cards.map(({ _id, ...card }) => card);
  const stackedCards = stackOwnedCards(db.entities.Card);
  db.entities.Card = stackedCards.cards;
  if (stackedCards.changed) await syncMongoCollection(remote.collection("cards"), db.entities.Card);
  const remoteEntityNames = collectionNames.filter((name) => name.startsWith("entity_")).map((name) => name.slice(7));
  const entityNames = new Set([...Object.keys(db.entities), ...remoteEntityNames]);
  entityNames.delete("Card");
  await Promise.all([...entityNames].map(async (name) => {
    const collection = remote.collection(entityCollectionName(name));
    const rows = await collection.find({}).toArray();
    if (!rows.length && db.entities[name]?.length) await collection.insertMany(db.entities[name]);
    else db.entities[name] = rows.map(({ _id, ...row }) => row);
  }));
  db.entities.CardDefinition ||= [];
  const definitionIds = new Set(db.entities.CardDefinition.map((card) => card.id));
  const missingDefinitions = baseCardCatalog.filter((card) => !definitionIds.has(card.id));
  if (missingDefinitions.length) {
    db.entities.CardDefinition.push(...missingDefinitions);
    await remote.collection(entityCollectionName("CardDefinition")).insertMany(missingDefinitions);
  }
  db.entities.CardFrame ||= [];
  const frameIds = new Set(db.entities.CardFrame.map((frame) => frame.id));
  const missingFrames = baseFrameCatalog.filter((frame) => !frameIds.has(frame.id));
  if (missingFrames.length) {
    db.entities.CardFrame.push(...missingFrames);
    await remote.collection(entityCollectionName("CardFrame")).insertMany(missingFrames);
  }
  let framesChanged = false;
  for (const baseFrame of baseFrameCatalog) {
    const existingFrame = db.entities.CardFrame.find((frame) => frame.id === baseFrame.id);
    if (existingFrame && JSON.stringify(existingFrame) !== JSON.stringify({ ...existingFrame, ...baseFrame })) {
      Object.assign(existingFrame, baseFrame);
      framesChanged = true;
    }
  }
  if (framesChanged) await syncMongoCollection(remote.collection(entityCollectionName("CardFrame")), db.entities.CardFrame);
  dbCache = db;
  return dbCache;
};
const writeDb = async (db) => {
  dbCache = db;
  fs.mkdirSync(dataDir, { recursive: true });
  const remote = await mongoDb();
  if (remote) {
    await Promise.all([
      syncMongoCollection(remote.collection("users"), db.users),
      ...Object.entries(db.entities).map(([name, rows]) => syncMongoCollection(remote.collection(entityCollectionName(name)), rows || [])),
    ]);
    const local = structuredClone(db);
    local.users = [];
    local.entities = {};
    fs.writeFileSync(dbFile, JSON.stringify(local, null, 2));
    return;
  }
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
};

const json = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
};
const body = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { return {}; }
};
const id = () => crypto.randomUUID();
const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => ({
  salt,
  hash: crypto.scryptSync(password, salt, 64).toString("hex"),
});
const validPassword = (password, user) => {
  const candidate = Buffer.from(hashPassword(password, user.password_salt).hash, "hex");
  const expected = Buffer.from(user.password_hash, "hex");
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
};
const publicUser = ({ password_hash, password_salt, ...user }) => user;
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000;
const createSession = (db, userId) => {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  db.sessions = db.sessions.filter((session) => !session.expires_at || session.expires_at > now);
  db.sessions.push({ token, user_id: userId, created_at: new Date(now).toISOString(), expires_at: now + SESSION_DURATION });
  return token;
};
const currentUser = (req, db) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  const session = db.sessions.find((item) => item.token === token && (!item.expires_at || item.expires_at > Date.now()));
  return session ? db.users.find((user) => user.id === session.user_id) : null;
};
const sortRows = (rows, sort) => {
  if (!sort) return rows;
  const descending = sort.startsWith("-");
  const field = descending ? sort.slice(1) : sort;
  return [...rows].sort((a, b) => {
    const result = (a[field] ?? "") > (b[field] ?? "") ? 1 : -1;
    return descending ? -result : result;
  });
};
const resolvedCard = (db, card) => {
  const definitions = db.entities.CardDefinition || [];
  const definition = definitions.find((item) => item.id === card.card_definition_id)
    || definitions.find((item) => item.name === card.name && item.anime === card.anime && item.rarity === card.rarity);
  const override = definition && (db.entities.CardImageOverride || []).find((item) => item.card_id === definition.id);
  return {
    ...card,
    card_definition_id: card.card_definition_id || definition?.id,
    collection_id: card.collection_id || definition?.collection_id || null,
    edition: card.edition || definition?.edition || "standard",
    is_collector: Boolean(card.is_collector || definition?.is_collector),
    image_url: override?.image_url || definition?.image_url || card.image_url || null,
  };
};
const seedProfile = (db, user) => {
  db.entities.PlayerProfile ||= [];
  db.entities.PlayerProfile.push({
    id: id(), created_by_id: user.id, created_by: user.email,
    created_date: new Date().toISOString(), updated_date: new Date().toISOString(),
    display_name: user.full_name || user.email.split("@")[0], level: 1, xp: 0,
    coins: 2500, gems: 100, talent_points: 0,
  });
};

async function authRoutes(req, res, pathname, db) {
  if (pathname === "/api/auth/register" && req.method === "POST") {
    const input = await body(req);
    const email = input.email?.trim().toLowerCase();
    if (!email || !input.password || input.password.length < 6) return json(res, 400, { message: "E-mail valide et mot de passe de 6 caractères minimum requis." });
    if (db.users.some((user) => user.email === email)) return json(res, 409, { message: "Un compte existe déjà avec cet e-mail." });
    const password = hashPassword(input.password);
    const user = { id: id(), email, full_name: input.full_name || "", role: db.users.length ? "user" : "admin", password_hash: password.hash, password_salt: password.salt, created_date: new Date().toISOString() };
    db.users.push(user); seedProfile(db, user);
    const token = createSession(db, user.id); await writeDb(db);
    return json(res, 201, { access_token: token, user: publicUser(user) });
  }
  if (pathname === "/api/auth/login" && req.method === "POST") {
    const input = await body(req);
    const user = db.users.find((item) => item.email === input.email?.trim().toLowerCase());
    if (!user || !user.password_hash || !validPassword(input.password || "", user)) return json(res, 401, { message: "E-mail ou mot de passe incorrect." });
    const token = createSession(db, user.id); await writeDb(db);
    return json(res, 200, { access_token: token, user: publicUser(user) });
  }
  if (pathname === "/api/auth/me") {
    const user = currentUser(req, db);
    if (!user) return json(res, 401, { message: "Authentification requise." });
    if (req.method === "GET") return json(res, 200, publicUser(user));
    if (req.method === "PUT") {
      const input = await body(req);
      if ("full_name" in input) {
        const fullName = String(input.full_name || "").trim();
        if (fullName.length < 3 || fullName.length > 24) return json(res, 400, { message: "Le pseudo doit contenir entre 3 et 24 caractères." });
        const alreadyUsed = db.users.some((candidate) => candidate.id !== user.id && String(candidate.full_name || "").trim().toLocaleLowerCase("fr") === fullName.toLocaleLowerCase("fr"));
        if (alreadyUsed) return json(res, 409, { message: "Ce pseudo est déjà utilisé par un autre joueur." });
        user.full_name = fullName;
        const playerProfile = (db.entities.PlayerProfile || []).find((item) => item.created_by_id === user.id);
        if (playerProfile) playerProfile.display_name = fullName;
      }
      if ("avatar_url" in input) {
        const avatarUrl = input.avatar_url ? String(input.avatar_url).slice(0, 2048) : null;
        user.avatar_url = avatarUrl;
        const playerProfile = (db.entities.PlayerProfile || []).find((item) => item.created_by_id === user.id);
        if (playerProfile) playerProfile.avatar_url = avatarUrl;
      }
      await writeDb(db); return json(res, 200, publicUser(user));
    }
  }
  if (pathname === "/api/auth/logout" && req.method === "POST") {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    db.sessions = db.sessions.filter((session) => session.token !== token);
    await writeDb(db); return json(res, 200, { success: true });
  }
  if (pathname === "/api/auth/forgot-password" && req.method === "POST") {
    const input = await body(req); const user = db.users.find((item) => item.email === input.email?.trim().toLowerCase());
    if (!user) return json(res, 200, { success: true });
    const token = crypto.randomBytes(24).toString("hex");
    db.resetTokens = db.resetTokens.filter((item) => item.user_id !== user.id);
    db.resetTokens.push({ token, user_id: user.id, expires_at: Date.now() + 3600000 }); await writeDb(db);
    return json(res, 200, { success: true, reset_url: `${frontendUrl}/reset-password?token=${token}` });
  }
  if (pathname === "/api/auth/reset-password" && req.method === "POST") {
    const input = await body(req); const reset = db.resetTokens.find((item) => item.token === input.resetToken && item.expires_at > Date.now());
    if (!reset || !input.newPassword || input.newPassword.length < 6) return json(res, 400, { message: "Lien invalide ou mot de passe trop court." });
    const user = db.users.find((item) => item.id === reset.user_id); const password = hashPassword(input.newPassword);
    user.password_hash = password.hash; user.password_salt = password.salt; db.resetTokens = db.resetTokens.filter((item) => item !== reset); await writeDb(db);
    return json(res, 200, { success: true });
  }
  if (pathname === "/api/auth/google" && req.method === "GET") {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return redirect(res, `${frontendUrl}/login?error=google_not_configured`);
    const state = crypto.randomBytes(16).toString("hex");
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const requestedPath = requestUrl.searchParams.get("from_url") || "/";
    const returnPath = requestedPath.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/";
    db.oauthStates = db.oauthStates.filter((item) => item.expires_at > Date.now());
    db.oauthStates.push({ state, return_path: returnPath, expires_at: Date.now() + 10 * 60 * 1000 });
    await writeDb(db);
    const callback = `${process.env.API_URL || `http://127.0.0.1:${port}`}/api/auth/google/callback`;
    const target = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    target.search = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: callback, response_type: "code", scope: "openid email profile", state }).toString();
    return redirect(res, target.toString());
  }
  if (pathname === "/api/auth/google/callback" && req.method === "GET") {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`); const code = requestUrl.searchParams.get("code");
    const state = requestUrl.searchParams.get("state");
    const oauthState = db.oauthStates.find((item) => item.state === state && item.expires_at > Date.now());
    db.oauthStates = db.oauthStates.filter((item) => item.state !== state && item.expires_at > Date.now());
    if (!code || !oauthState) { await writeDb(db); return redirect(res, `${frontendUrl}/login?error=google_invalid_state`); }
    const callback = `${process.env.API_URL || `http://127.0.0.1:${port}`}/api/auth/google/callback`;
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: callback, grant_type: "authorization_code" }) });
    if (!tokenResponse.ok) return redirect(res, `${frontendUrl}/login?error=google_failed`);
    const googleToken = await tokenResponse.json(); const infoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${googleToken.access_token}` } }); const info = await infoResponse.json();
    let user = db.users.find((item) => item.email === info.email);
    if (!user) { user = { id: id(), email: info.email, full_name: info.name || "", avatar_url: info.picture, role: db.users.length ? "user" : "admin", provider: "google", created_date: new Date().toISOString() }; db.users.push(user); seedProfile(db, user); }
    const token = createSession(db, user.id); await writeDb(db);
    const target = new URL(oauthState.return_path, frontendUrl); target.searchParams.set("access_token", token);
    return redirect(res, target.toString());
  }
  return false;
}

const redirect = (res, location) => { res.writeHead(302, { Location: location }); res.end(); };

async function uploadRoutes(req, res, pathname, user) {
  const remote = await mongoDb();
  if (!remote) return json(res, 503, { message: "Stockage MongoDB indisponible." });
  const bucket = new GridFSBucket(remote, { bucketName: "card_images" });
  if (pathname === "/api/uploads" && req.method === "POST") {
    if (!user || user.role !== "admin") return json(res, 403, { message: "Acces administrateur requis." });
    const input = await body(req);
    const match = String(input.data_url || "").match(/^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/s);
    if (!match) return json(res, 400, { message: "Format d'image invalide." });
    const buffer = Buffer.from(match[2], "base64");
    if (!buffer.length || buffer.length > 8 * 1024 * 1024) return json(res, 400, { message: "L'image doit faire moins de 8 Mo." });
    const stream = bucket.openUploadStream(input.name || `card-${Date.now()}`, {
      contentType: match[1], metadata: { uploaded_by: user.id, uploaded_at: new Date().toISOString() },
    });
    await new Promise((resolve, reject) => { stream.on("finish", resolve); stream.on("error", reject); stream.end(buffer); });
    return json(res, 201, { file_url: `/api/uploads/${stream.id}` });
  }
  const match = pathname.match(/^\/api\/uploads\/([a-f0-9]{24})$/i);
  if (match && req.method === "GET") {
    const fileId = new ObjectId(match[1]);
    const file = await remote.collection("card_images.files").findOne({ _id: fileId });
    if (!file) return json(res, 404, { message: "Image introuvable." });
    res.writeHead(200, { "Content-Type": file.contentType || "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" });
    return bucket.openDownloadStream(fileId).pipe(res);
  }
  return false;
}

async function entityRoutes(req, res, pathname, searchParams, db, user) {
  const match = pathname.match(/^\/api\/entities\/([^/]+)(?:\/(.+))?$/); if (!match) return false;
  const [, name, action] = match;
  if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name)) return json(res, 400, { message: "Nom d'entite invalide." });
  if (name === "ChatMessage") {
    db.entities.ChatMessage ||= [];
    const messages = db.entities.ChatMessage;
    if (req.method === "GET" && !action) {
      const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") || 100)));
      const sorted = sortRows(messages, searchParams.get("sort") || "-created_date");
      return json(res, 200, sorted.slice(0, limit));
    }
    if (req.method === "POST" && !action) {
      const input = await body(req);
      const message = String(input.message || "").replace(/\s+/g, " ").trim();
      if (!message || message.length > 300) return json(res, 400, { message: "Le message doit contenir entre 1 et 300 caractères." });
      const lastMessage = messages.filter((item) => item.created_by_id === user.id).sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
      if (lastMessage && Date.now() - new Date(lastMessage.created_date).getTime() < 2000) return json(res, 429, { message: "Attends 2 secondes avant d'envoyer un autre message." });
      const profile = (db.entities.PlayerProfile || []).find((item) => item.created_by_id === user.id);
      const created = {
        id: id(), message, created_by_id: user.id,
        display_name: profile?.display_name || user.full_name || "Joueur",
        avatar_url: profile?.avatar_url || user.avatar_url || null,
        created_date: new Date().toISOString(), updated_date: new Date().toISOString(),
      };
      messages.push(created); await writeDb(db); return json(res, 201, created);
    }
    if (req.method === "DELETE" && action) {
      const found = messages.find((item) => item.id === action);
      if (!found) return json(res, 404, { message: "Message introuvable." });
      if (user.role !== "admin" && found.created_by_id !== user.id) return json(res, 403, { message: "Tu ne peux supprimer que tes messages." });
      db.entities.ChatMessage = messages.filter((item) => item.id !== action); await writeDb(db); return json(res, 200, { success: true });
    }
    return json(res, 405, { message: "Opération interdite sur le chat." });
  }
  if (name === "User") {
    const visibleUser = (item) => user.role === "admin"
      ? publicUser(item)
      : { id: item.id, full_name: item.full_name, avatar_url: item.avatar_url, created_date: item.created_date };
    if (req.method === "GET" && !action) return json(res, 200, db.users.map(visibleUser));
    if (req.method === "GET" && action) {
      const found = db.users.find((item) => item.id === action);
      return found ? json(res, 200, visibleUser(found)) : json(res, 404, { message: "Utilisateur introuvable." });
    }
    if (req.method === "PUT" && action) {
      if (user.role !== "admin") return json(res, 403, { message: "Acces administrateur requis." });
      const found = db.users.find((item) => item.id === action); if (!found) return json(res, 404, { message: "Utilisateur introuvable." });
      const input = await body(req); for (const field of ["role", "full_name", "avatar_url"]) if (field in input) found[field] = input[field];
      await writeDb(db); return json(res, 200, publicUser(found));
    }
    return json(res, 403, { message: "Operation interdite sur les utilisateurs." });
  }
  db.entities[name] ||= []; const rows = db.entities[name];
  const privateEntities = new Set(["Card", "PlayerFrame", "PlayerTalent", "Quest", "Transaction", "UserCosmetic", "ProfileCustomization"]);
  const adminManagedEntities = new Set(["AnimeCollection", "CardDefinition", "CardFrame", "CosmeticItem", "CardImageOverride", "DropEvent", "EconomyStats"]);
  const collaborativeEntities = new Set(["MarketListing", "FrameListing", "Auction"]);
  const canAccess = (row) => user.role === "admin" || !privateEntities.has(name) || row.created_by_id === user.id;
  const canWrite = (row) => user.role === "admin" || collaborativeEntities.has(name) || row.created_by_id === user.id;
  const visibleRows = rows.filter(canAccess);
  const present = (row) => name === "Card" ? resolvedCard(db, row) : row;
  if (req.method === "GET" && !action) {
    let result = sortRows(visibleRows, searchParams.get("sort")); const skip = Number(searchParams.get("skip") || 0); const limit = Number(searchParams.get("limit") || result.length);
    return json(res, 200, result.slice(skip, skip + limit).map(present));
  }
  if (req.method === "POST" && action === "filter") {
    const input = await body(req); let result = visibleRows.filter((row) => Object.entries(input.query || {}).every(([key, value]) => row[key] === value)); result = sortRows(result, input.sort);
    return json(res, 200, result.slice(Number(input.skip || 0), input.limit ? Number(input.skip || 0) + Number(input.limit) : undefined).map(present));
  }
  if (req.method === "POST" && action === "bulk") {
    if (name === "PlayerTalent" && user.role !== "admin") return json(res, 403, { message: "Les talents doivent être débloqués depuis l'arbre de talents." });
    if (adminManagedEntities.has(name) && user.role !== "admin") return json(res, 403, { message: "Acces administrateur requis." });
    const input = await body(req);
    if (name === "PlayerFrame" && user.role !== "admin" && input.some((item) => (db.entities.CardFrame || []).some((frame) => frame.id === item.frame_id && ["endgame", "gift", "event"].includes(frame.source_type)))) return json(res, 403, { message: "Ce cadre doit être obtenu par sa méthode officielle." });
    const created = input.map((item) => ({ ...item, id: id(), created_by_id: user.id, created_by: user.email, created_date: new Date().toISOString() })); rows.push(...created); await writeDb(db); return json(res, 201, created);
  }
  if (req.method === "POST" && !action) {
    if (name === "PlayerTalent" && user.role !== "admin") return json(res, 403, { message: "Les talents doivent être débloqués depuis l'arbre de talents." });
    if (adminManagedEntities.has(name) && user.role !== "admin") return json(res, 403, { message: "Acces administrateur requis." });
    const input = await body(req);
    if (name === "PlayerFrame" && user.role !== "admin" && (db.entities.CardFrame || []).some((frame) => frame.id === input.frame_id && ["endgame", "gift", "event"].includes(frame.source_type))) return json(res, 403, { message: "Ce cadre doit être obtenu par sa méthode officielle." });
    const created = { ...input, id: id(), created_by_id: user.id, created_by: user.email, created_date: new Date().toISOString(), updated_date: new Date().toISOString() }; rows.push(created); await writeDb(db); return json(res, 201, created);
  }
  const item = rows.find((row) => row.id === action); if (!item || !canAccess(item)) return json(res, 404, { message: `${name} introuvable.` });
  if (req.method === "GET") return json(res, 200, present(item));
  if (req.method === "PUT") {
    if (!canWrite(item)) return json(res, 403, { message: "Modification interdite." });
    const input = await body(req); delete input.id; delete input.created_by_id; delete input.created_by; delete input.created_date;
    if (name === "PlayerTalent" && user.role !== "admin") return json(res, 403, { message: "Modification de talent interdite." });
    if (name === "PlayerProfile" && user.role !== "admin") { delete input.talent_points; delete input.claimed_rewards; }
    Object.assign(item, input, { id: item.id, updated_date: new Date().toISOString() }); await writeDb(db); return json(res, 200, present(item));
  }
  if (req.method === "DELETE") {
    if (!canWrite(item) || (name === "PlayerTalent" && user.role !== "admin")) return json(res, 403, { message: "Suppression interdite." });
    if (name === "PlayerFrame" && item.frame_id === ENDGAME_FRAME_ID && user.role !== "admin") return json(res, 403, { message: "Une relique ultime ne peut être vendue ni supprimée." });
    db.entities[name] = rows.filter((row) => row.id !== action); await writeDb(db); return json(res, 200, { success: true });
  }
  return false;
}

async function runFunction(req, res, name, db, user) {
  const input = await body(req);
  const entities = db.entities;
  const profile = (entities.PlayerProfile || []).find((item) => item.created_by_id === user.id);
  let result;

  if (name === "unlockTalent") {
    if (!profile) return json(res, 404, { message: "Profil joueur introuvable." });
    const talent = getTalent(input.talent_id);
    if (!talent) return json(res, 400, { message: "Talent inconnu." });
    const unlocked = new Set((entities.PlayerTalent || [])
      .filter((item) => item.created_by_id === user.id && item.is_unlocked)
      .map((item) => item.talent_id));
    if (unlocked.has(talent.id)) return json(res, 409, { message: "Ce talent est déjà débloqué." });
    const playerLevel = getLevelFromXp(Number(profile.xp || 0)).level;
    if (playerLevel < talent.minLevel) return json(res, 403, { message: `Niveau ${talent.minLevel} requis.` });
    if (!talent.prerequisites.every((id) => unlocked.has(id))) return json(res, 403, { message: "Débloque d'abord le talent précédent." });
    if (Number(profile.talent_points || 0) < talent.cost) return json(res, 400, { message: "Points de talent insuffisants." });
    const now = new Date().toISOString();
    profile.talent_points = Number(profile.talent_points || 0) - talent.cost;
    profile.updated_date = now;
    entities.PlayerTalent ||= [];
    entities.PlayerTalent.push({ id: id(), talent_id: talent.id, is_unlocked: true, unlock_date: now, created_by_id: user.id, created_by: user.email, created_date: now, updated_date: now });
    result = { talent_id: talent.id, talent_points: profile.talent_points };
  } else if (name === "claimLevelReward") {
    if (!profile) return json(res, 404, { message: "Profil joueur introuvable." });
    const reward = LEVEL_REWARDS.find((item) => item.level === Number(input.level));
    if (!reward) return json(res, 400, { message: "Récompense inconnue." });
    const playerLevel = getLevelFromXp(Number(profile.xp || 0)).level;
    if (playerLevel < reward.level) return json(res, 403, { message: `Niveau ${reward.level} requis.` });
    const claimed = Array.isArray(profile.claimed_rewards) ? profile.claimed_rewards : [];
    if (claimed.includes(reward.level)) return json(res, 409, { message: "Récompense déjà réclamée." });
    profile.coins = Number(profile.coins || 0) + reward.coins;
    profile.gems = Number(profile.gems || 0) + reward.gems;
    profile.talent_points = Number(profile.talent_points || 0) + reward.talentPoints;
    profile.claimed_rewards = [...claimed, reward.level];
    profile.updated_date = new Date().toISOString();
    result = { level: reward.level, coins: profile.coins, gems: profile.gems, talent_points: profile.talent_points };
  } else if (name === "fuseCards") {
    if (!profile) return json(res, 404, { message: "Profil joueur introuvable." });
    const recipe = FUSION_RECIPES[input.rarity];
    if (!recipe) return json(res, 400, { message: "Recette de fusion invalide." });
    const cardIds = [...new Set(Array.isArray(input.card_ids) ? input.card_ids : [])];
    if (cardIds.length !== recipe.count) return json(res, 400, { message: `${recipe.count} cartes différentes sont requises.` });
    const selectedCards = cardIds.map((cardId) => (entities.Card || []).find((card) => card.id === cardId && card.created_by_id === user.id));
    if (selectedCards.some((card) => !card)) return json(res, 403, { message: "Une carte sélectionnée ne t'appartient pas." });
    if (selectedCards.some((card) => card.rarity !== input.rarity)) return json(res, 400, { message: "Toutes les cartes doivent avoir la rareté demandée." });
    if (selectedCards.some((card) => Number(card.duplicates || 1) < recipe.copiesEach)) {
      return json(res, 400, { message: `Chaque carte doit posséder au moins ${recipe.copiesEach} exemplaires.` });
    }
    if (selectedCards.some((card) => Number(card.level || 1) < recipe.minLevel)) {
      return json(res, 400, { message: `Chaque carte doit être au niveau ${recipe.minLevel} minimum.` });
    }
    if (Number(profile.coins || 0) < recipe.cost) return json(res, 400, { message: `${recipe.cost.toLocaleString("fr-FR")} pièces sont requises.` });
    const currentWeek = weekKey();
    if (recipe.weekly && profile.manga_god_fusion_week === currentWeek) {
      return json(res, 429, { message: "Une seule fusion Manga God est autorisée par semaine. Réinitialisation lundi." });
    }

    const resultPool = (entities.CardDefinition || []).filter((definition) => definition.is_active !== false && !definition.is_collector && definition.rarity === recipe.result);
    if (!resultPool.length) return json(res, 409, { message: "Aucune carte résultat n'est disponible." });
    const definition = resultPool[crypto.randomInt(0, resultPool.length)];

    for (const card of selectedCards) {
      card.duplicates = Number(card.duplicates || 1) - recipe.copiesEach;
      if (card.duplicates <= 0) entities.Card = entities.Card.filter((owned) => owned.id !== card.id);
      else card.updated_date = new Date().toISOString();
    }

    let resultCard = (entities.Card || []).find((card) => card.created_by_id === user.id && card.card_definition_id === definition.id);
    if (resultCard) {
      resultCard.duplicates = Number(resultCard.duplicates || 1) + 1;
      resultCard.upgrade_progress = Number(resultCard.upgrade_progress || 0) + 1;
      while (Number(resultCard.level || 1) < 100) {
        const required = getDuplicatesForUpgrade(Number(resultCard.level || 1));
        if (resultCard.upgrade_progress < required) break;
        resultCard.upgrade_progress -= required;
        resultCard.level = Number(resultCard.level || 1) + 1;
        resultCard.power = Number(resultCard.power || 0) + 3;
        resultCard.attack = Number(resultCard.attack || 0) + 2;
        resultCard.defense = Number(resultCard.defense || 0) + 2;
        resultCard.speed = Number(resultCard.speed || 0) + 1;
      }
      resultCard.updated_date = new Date().toISOString();
    } else {
      const now = new Date().toISOString();
      resultCard = {
        id: id(), card_definition_id: definition.id, name: definition.name, anime: definition.anime, rarity: definition.rarity,
        power: definition.basePower, attack: definition.baseAttack, defense: definition.baseDefense, speed: definition.baseSpeed,
        image_url: definition.image_url || null, collection_id: definition.collection_id || null, edition: definition.edition || "standard",
        is_collector: Boolean(definition.is_collector), level: 1, duplicates: 1, upgrade_progress: 0, is_favorite: false,
        created_by_id: user.id, created_by: user.email, created_date: now, updated_date: now,
      };
      entities.Card ||= [];
      entities.Card.push(resultCard);
    }

    profile.coins = Number(profile.coins || 0) - recipe.cost;
    profile.xp = Number(profile.xp || 0) + recipe.xp;
    profile.level = getLevelFromXp(profile.xp).level;
    if (recipe.weekly) profile.manga_god_fusion_week = currentWeek;
    profile.updated_date = new Date().toISOString();
    entities.Transaction ||= [];
    entities.Transaction.push({
      id: id(), type: "fusion", description: `Fusion → ${definition.name} (${recipe.result})`, amount: -recipe.cost,
      gems_amount: 0, card_name: definition.name, card_rarity: definition.rarity,
      created_by_id: user.id, created_by: user.email, created_date: new Date().toISOString(),
    });
    result = { card: resolvedCard(db, resultCard), cost: recipe.cost, weekly_key: recipe.weekly ? currentWeek : null };
  } else if (name === "claimPassiveIncome") {
    if (!profile) return json(res, 404, { message: "Profil joueur introuvable." });
    const now = Date.now();
    const lastClaim = profile.passive_income_last_claim ? new Date(profile.passive_income_last_claim).getTime() : 0;
    if (lastClaim && now - lastClaim < 55_000) {
      result = { amount: 0, coins: Number(profile.coins || 0), next_claim_at: new Date(lastClaim + 60_000).toISOString() };
    } else {
      const unlocked = new Set((entities.PlayerTalent || [])
        .filter((talent) => talent.created_by_id === user.id && talent.is_unlocked)
        .map((talent) => talent.talent_id));
      const incomeBonus = (unlocked.has("economy_1") ? 0.05 : 0)
        + (unlocked.has("economy_3") ? 0.10 : 0)
        + (unlocked.has("economy_4") ? 0.10 : 0);
      const playerCards = (entities.Card || []).filter((card) => card.created_by_id === user.id);
      const playerLevel = getLevelFromXp(Number(profile.xp || 0)).level;
      const incomePerMinute = getTotalIncome(playerCards, incomeBonus, playerLevel);
      const elapsedTicks = lastClaim ? Math.max(1, Math.floor((now - lastClaim) / 60_000)) : 1;
      const paidTicks = Math.min(elapsedTicks, 5);
      const amount = incomePerMinute * paidTicks;
      profile.coins = Number(profile.coins || 0) + amount;
      profile.passive_income_last_claim = new Date(now).toISOString();
      profile.updated_date = new Date(now).toISOString();
      result = { amount, income_per_minute: incomePerMinute, paid_minutes: paidTicks, coins: profile.coins };
    }
  } else if (name === "openBooster") {
    if (!profile) return json(res, 404, { message: "Profil joueur introuvable." });
    const requestTime = Date.now();
    const fallback = BOOSTER_TYPES.find((item) => item.id === input.booster_id);
    const configuredCandidate = (entities.AnimeCollection || []).find((item) => item.id === input.booster_id && item.is_active !== false);
    const configured = configuredCandidate
      && (!configuredCandidate.starts_at || new Date(configuredCandidate.starts_at).getTime() <= requestTime)
      && (!configuredCandidate.ends_at || new Date(configuredCandidate.ends_at).getTime() > requestTime)
      ? configuredCandidate : null;
    if (!fallback && !configured) return json(res, 404, { message: "Ce booster n'est plus disponible." });
    const booster = configured ? {
      id: configured.id, name: configured.name, anime: configured.is_premium ? null : configured.anime,
      cards: Math.max(1, Math.min(10, Number(configured.cards_count || 10))), price: configured.is_free ? 0 : Number(configured.base_price || 0), currency: configured.currency || "coins",
      guaranteed: configured.guaranteed_rarity, unlockLevel: Number(configured.unlock_level || 1),
      collectionId: configured.id, collectorOnly: Boolean(configured.collector_only), limited: Boolean(configured.is_limited),
      isFree: Boolean(configured.is_free), maxClaimsPerPlayer: Math.max(1, Math.min(100, Number(configured.max_claims_per_player || 1))),
    } : { ...fallback, price: Number(fallback.basePrice || 0), collectionId: null, collectorOnly: false };
    const level = getLevelFromXp(Number(profile.xp || 0)).level;
    if (level < booster.unlockLevel) return json(res, 403, { message: `Niveau ${booster.unlockLevel} requis pour ce booster.` });
    const talents = entities.PlayerTalent || [];
    const unlocked = new Set(talents.filter((item) => item.created_by_id === user.id && item.is_unlocked).map((item) => item.talent_id));
    const standardBoosterIds = new Set(BOOSTER_TYPES.filter((item) => item.currency === "coins").map((item) => item.id));
    const openedCount = Object.entries(profile.boosters_count || {}).reduce((sum, [boosterId, count]) => (
      sum + (standardBoosterIds.has(boosterId) ? Number(count || 0) : 0)
    ), 0);
    const beginnerDiscount = fallback && booster.currency === "coins"
      ? (openedCount < 5 ? 0.60 : openedCount < 15 ? 0.30 : 0)
      : 0;
    const talentDiscount = unlocked.has("economy_2") ? 0.05 : 0;
    const discount = Math.min(0.70, beginnerDiscount + talentDiscount);
    const price = Math.round(booster.price * (1 - discount));
    if (booster.isFree && Number(profile.boosters_count?.[booster.id] || 0) >= booster.maxClaimsPerPlayer) {
      return json(res, 409, { message: "Tu as déjà récupéré tous les exemplaires offerts de ce booster." });
    }
    if (Number(profile[booster.currency] || 0) < price) return json(res, 400, { message: booster.currency === "gems" ? "Gemmes insuffisantes." : "Pieces insuffisantes." });

    const now = requestTime;
    const activeEvent = (entities.DropEvent || []).find((event) => event.is_active !== false && new Date(event.start_date).getTime() <= now && new Date(event.end_date).getTime() > now);
    const eventRarity = { legendary_boost: "legendaire", secret_boost: "secrète", god_boost: "manga_god" }[activeEvent?.event_type];
    const rates = { normale: 0.944, legendaire: 0.05, "secrète": 0.005, manga_god: 0.001 };
    if (eventRarity) rates[eventRarity] *= Math.max(1, Math.min(Number(activeEvent.multiplier || 1), 20));
    if (unlocked.has("chance_1")) rates.legendaire *= 1.05;
    if (unlocked.has("chance_2")) rates["secrète"] *= 1.08;
    if (unlocked.has("chance_3")) rates.manga_god *= 1.10;
    const pity = Number(profile.pity_counter || 0);
    const pityBonus = Math.min(pity * 0.001 * (unlocked.has("chance_4") ? 1.25 : 1), 0.1);
    rates.normale = Math.max(0, rates.normale - pityBonus);
    rates.legendaire += pityBonus;
    const rateTotal = Object.values(rates).reduce((sum, value) => sum + value, 0);
    for (const key of Object.keys(rates)) rates[key] /= rateTotal;
    const random = () => crypto.randomInt(0, 1_000_000) / 1_000_000;
    const rollRarity = () => {
      const value = random(); let cursor = 0;
      for (const rarity of ["manga_god", "secrète", "legendaire", "normale"]) { cursor += rates[rarity]; if (value < cursor) return rarity; }
      return "normale";
    };
    const order = ["normale", "legendaire", "secrète", "manga_god"];
    const definitions = (entities.CardDefinition || []).filter((card) => {
      if (card.is_active === false) return false;
      if (booster.collectorOnly && !card.is_collector) return false;
      if (booster.collectionId) return card.collection_id === booster.collectionId;
      return !booster.anime || card.anime === booster.anime;
    });
    const availableCharacters = new Set(definitions.map((card) => card.name));
    if (configured && availableCharacters.size < booster.cards) return json(res, 409, { message: `Ce booster doit contenir au moins ${booster.cards} personnages differents (${availableCharacters.size}/${booster.cards} configures).` });
    if (!definitions.length) return json(res, 409, { message: "Aucune carte n'est configuree pour ce booster." });
    const talentBonusCard = unlocked.has("collection_4") && price > 0 && (Number(profile.boosters_opened || 0) + 1) % 25 === 0;
    const cardsToDrop = booster.cards + (talentBonusCard ? 1 : 0);
    const guaranteedIndex = booster.guaranteed ? crypto.randomInt(0, Math.max(1, booster.cards)) : -1;
    const dropped = [];
    const usedCharacters = new Set();
    for (let index = 0; index < cardsToDrop; index++) {
      let rarity = rollRarity();
      if (index === guaranteedIndex && order.indexOf(rarity) < order.indexOf(booster.guaranteed)) rarity = booster.guaranteed;
      let pool = definitions.filter((card) => card.rarity === rarity && (!configured || !usedCharacters.has(card.name)));
      if (!pool.length) pool = definitions.filter((card) => !configured || !usedCharacters.has(card.name));
      if (!pool.length) pool = definitions.filter((card) => card.rarity === rarity);
      if (!pool.length) pool = definitions;
      const definition = pool[crypto.randomInt(0, pool.length)];
      usedCharacters.add(definition.name);
      const existing = (entities.Card || []).find((card) => card.created_by_id === user.id && (card.card_definition_id === definition.id || (!card.card_definition_id && card.name === definition.name && card.rarity === definition.rarity)));
      if (existing) {
        existing.duplicates = Number(existing.duplicates || 1) + 1;
        existing.upgrade_progress = Number(existing.upgrade_progress || 0) + 1;
        let levelsGained = 0;
        while (Number(existing.level || 1) < 100) {
          const required = getDuplicatesForUpgrade(Number(existing.level || 1));
          if (existing.upgrade_progress < required) break;
          existing.upgrade_progress -= required;
          existing.level = Number(existing.level || 1) + 1;
          existing.power = Number(existing.power || 0) + 3;
          existing.attack = Number(existing.attack || 0) + 2;
          existing.defense = Number(existing.defense || 0) + 2;
          existing.speed = Number(existing.speed || 0) + 1;
          levelsGained += 1;
        }
        existing.last_levels_gained = levelsGained;
        if (levelsGained > 0) {
          for (const quest of (entities.Quest || []).filter((item) => (
            item.created_by_id === user.id
            && !item.claimed
            && !item.completed
            && ["upgrade_card", "w_upgrade_3"].includes(item.quest_id)
          ))) {
            quest.progress = Math.min(Number(quest.target || 1), Number(quest.progress || 0) + levelsGained);
            quest.completed = quest.progress >= Number(quest.target || 1);
            quest.updated_date = new Date().toISOString();
          }
        }
        existing.updated_date = new Date().toISOString();
      } else {
        entities.Card ||= [];
        entities.Card.push({ id: id(), card_definition_id: definition.id, name: definition.name, anime: definition.anime, rarity: definition.rarity,
          power: definition.basePower, attack: definition.baseAttack, defense: definition.baseDefense, speed: definition.baseSpeed,
          image_url: definition.image_url || null, collection_id: definition.collection_id || null, edition: definition.edition || "standard",
          is_collector: Boolean(definition.is_collector), level: 1, duplicates: 1, upgrade_progress: 0, is_favorite: false,
          created_by_id: user.id, created_by: user.email, created_date: new Date().toISOString(), updated_date: new Date().toISOString() });
      }
      dropped.push(resolvedCard(db, {
        ...definition,
        card_definition_id: definition.id,
        power: existing?.power ?? definition.basePower,
        attack: existing?.attack ?? definition.baseAttack,
        defense: existing?.defense ?? definition.baseDefense,
        speed: existing?.speed ?? definition.baseSpeed,
        level: existing?.level ?? 1,
        upgrade_progress: existing?.upgrade_progress ?? 0,
        isDuplicate: Boolean(existing),
        ...(existing ? { stackCount: existing.duplicates, levelsGained: existing.last_levels_gained || 0 } : {}),
      }));
    }
    const xpBonus = (unlocked.has("collection_1") ? 0.05 : 0) + (unlocked.has("collection_2") ? 0.10 : 0) + (unlocked.has("collection_3") ? 0.10 : 0);
    const totalXp = dropped.reduce((sum, card) => sum + getXpReward(card.rarity, xpBonus), 0);
    const totalCoins = dropped.reduce((sum, card) => sum + getCoinReward(card.rarity), 0);
    profile[booster.currency] = Number(profile[booster.currency] || 0) - price;
    profile.coins = Number(profile.coins || 0) + totalCoins;
    profile.xp = Number(profile.xp || 0) + totalXp;
    profile.boosters_opened = Number(profile.boosters_opened || 0) + 1;
    profile.total_cards = Number(profile.total_cards || 0) + dropped.length;
    profile.boosters_count = { ...(profile.boosters_count || {}), [booster.id]: Number(profile.boosters_count?.[booster.id] || 0) + 1 };
    profile.pity_counter = dropped.some((card) => card.rarity !== "normale") ? 0 : pity + 1;
    profile.level = getLevelFromXp(profile.xp).level; profile.updated_date = new Date().toISOString();
    entities.Transaction ||= [];
    entities.Transaction.push({ id: id(), type: "booster", description: `Ouverture : ${booster.name}`, amount: booster.currency === "coins" ? -price : 0,
      gems_amount: booster.currency === "gems" ? -price : 0, created_by_id: user.id, created_by: user.email, created_date: new Date().toISOString() });
    let frameDrop = null;
    if (activeEvent) {
      entities.PlayerFrame ||= [];
      const ownedFrameIds = new Set(entities.PlayerFrame.filter((item) => item.created_by_id === user.id && item.is_unlocked).map((item) => item.frame_id));
      const eventFrames = (entities.CardFrame || []).filter((frame) => frame.is_active !== false && frame.source_type === "event" && frame.event_id === activeEvent.id && !ownedFrameIds.has(frame.id));
      for (const frame of eventFrames) {
        const chance = Math.max(0.001, Math.min(100, Number(frame.drop_chance || 0))) / 100;
        if (random() < chance) {
          const obtainedAt = new Date().toISOString();
          entities.PlayerFrame.push({ id: id(), frame_id: frame.id, is_unlocked: true, unlocked_date: obtainedAt, created_by_id: user.id, created_by: user.email, created_date: obtainedAt, updated_date: obtainedAt });
          frameDrop = { id: frame.id, name: frame.name, rarity: frame.rarity, image_url: frame.image_url };
          break;
        }
      }
    }
    const rare = dropped.filter((card) => card.rarity !== "normale");
    const messages = rare.length
      ? rare.map((card) => ({ type: card.rarity, title: card.rarity === "manga_god" ? "MANGA GOD !" : card.rarity === "secrète" ? "CARTE SECRETE !" : "CARTE LEGENDAIRE !", description: `${card.name} rejoint ta collection.` }))
      : [{ type: "info", title: "Booster ouvert", description: `${dropped.length} cartes obtenues et +${totalCoins} pieces.` }];
    result = { cards: dropped, profile, event: activeEvent ? { id: activeEvent.id, name: activeEvent.name, multiplier: activeEvent.multiplier, rarity: eventRarity } : null,
      drop_rates: Object.fromEntries(Object.entries(rates).map(([key, value]) => [key, Number((value * 100).toFixed(3))])), messages, rewards: { xp: totalXp, coins: totalCoins }, price, talent_bonus_card: talentBonusCard, frame_drop: frameDrop };
  } else if (name === "cleanupDuplicateCards") {
    const seen = new Set(); const before = (entities.Card || []).length;
    entities.Card = (entities.Card || []).filter((card) => {
      const key = `${card.created_by_id}:${card.original_card_id || card.name}:${card.level || 1}`;
      if (seen.has(key)) return false; seen.add(key); return true;
    });
    result = { removed: before - entities.Card.length, message: "Doublons supprimés." };
  } else if (name === "resetAllCards") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    const removed = (entities.Card || []).length; entities.Card = [];
    result = { removed, message: `${removed} cartes supprimées.` };
  } else if (name === "applyCardFrame") {
    const card = (entities.Card || []).find((item) => item.id === input.card_id && item.created_by_id === user.id);
    const frame = (entities.CardFrame || []).find((item) => item.id === input.frame_id && item.is_active !== false);
    const owned = (entities.PlayerFrame || []).find((item) => item.frame_id === input.frame_id && item.created_by_id === user.id && item.is_unlocked);
    if (!card || !frame || !owned) return json(res, 404, { message: "Carte ou cadre possédé introuvable." });
    card.applied_frame_id = input.frame_id; card.updated_date = new Date().toISOString(); result = { card: resolvedCard(db, card) };
  } else if (name === "purchaseFrame") {
    const frameId = input.frameId || input.frame_id; const frame = (entities.CardFrame || []).find((item) => item.id === frameId && item.is_active !== false);
    if (!frame || !profile) return json(res, 404, { message: "Cadre ou profil introuvable." });
    if (frame.source_type === "event") return json(res, 403, { message: "Ce cadre peut uniquement tomber pendant son événement." });
    if (Number(frame.price_eur || 0) > 0) return json(res, 501, { message: "Le paiement réel doit être validé par un prestataire de paiement sécurisé." });
    entities.PlayerFrame ||= [];
    if (entities.PlayerFrame.some((item) => item.frame_id === frameId && item.created_by_id === user.id && item.is_unlocked)) return json(res, 409, { message: "Tu possèdes déjà ce cadre." });
    const requirements = frame.requirements || {};
    const playerLevel = getLevelFromXp(Number(profile.xp || 0)).level;
    const playerCards = (entities.Card || []).filter((card) => card.created_by_id === user.id);
    const mangaGodCount = playerCards.filter((card) => card.rarity === "manga_god").length;
    const level100Count = playerCards.filter((card) => Number(card.level || 1) >= 100).length;
    if (playerLevel < Number(requirements.min_level || 1)) return json(res, 403, { message: `Niveau ${requirements.min_level} requis.` });
    if (mangaGodCount < Number(requirements.manga_god_cards || 0)) return json(res, 403, { message: `${requirements.manga_god_cards} cartes Manga God différentes sont requises.` });
    if (level100Count < Number(requirements.level_100_cards || 0)) return json(res, 403, { message: `Au moins ${requirements.level_100_cards} carte niveau 100 est requise.` });
    const coinPrice = Number(frame.price_coins ?? (frame.currency === "coins" ? frame.price : 0) ?? 0);
    const gemPrice = Number(frame.price_gems ?? (frame.currency === "gems" ? frame.price : 0) ?? 0);
    if (Number(profile.coins || 0) < coinPrice || Number(profile.gems || 0) < gemPrice) return json(res, 400, { message: "Ressources insuffisantes pour cette relique." });
    profile.coins = Number(profile.coins || 0) - coinPrice;
    profile.gems = Number(profile.gems || 0) - gemPrice;
    profile.updated_date = new Date().toISOString();
    const now = new Date().toISOString();
    const owned = { id: id(), frame_id: frameId, created_by_id: user.id, created_by: user.email, is_unlocked: true, unlocked_date: now, created_date: now, updated_date: now };
    entities.PlayerFrame.push(owned); result = { frame: owned, profile, message: `${frame.name} est désormais dans ta collection.` };
  } else if (name === "purchaseCosmetic") {
    const item = (entities.CosmeticItem || []).find((entry) => entry.id === input.item_id);
    if (!item || !profile) return json(res, 404, { message: "Objet ou profil introuvable." });
    const currency = item.currency || "coins"; const price = Number(item.price || 0);
    if (Number(profile[currency] || 0) < price) return json(res, 400, { message: "Solde insuffisant." });
    profile[currency] -= price; entities.UserCosmetic ||= [];
    const owned = { id: id(), item_id: item.id, item_type: item.type, created_by_id: user.id, user_id: user.id, is_equipped: false, created_date: new Date().toISOString() };
    entities.UserCosmetic.push(owned); result = { cosmetic: owned, profile };
  } else if (name === "equipCosmetic") {
    const items = entities.UserCosmetic || []; const owned = items.find((item) => item.item_id === input.item_id && item.created_by_id === user.id);
    if (!owned) return json(res, 404, { message: "Objet non possédé." });
    items.filter((item) => item.created_by_id === user.id && item.item_type === input.item_type).forEach((item) => { item.is_equipped = false; });
    owned.is_equipped = true; result = { cosmetic: owned };
  } else if (name === "createLimitedListing") {
    entities.LimitedCardListing ||= [];
    const listing = { ...input, id: id(), created_by_id: user.id, created_by: user.email, status: input.status || "active", created_date: new Date().toISOString() };
    entities.LimitedCardListing.push(listing); result = listing;
  } else if (name === "collectPassiveIncome") {
    return json(res, 410, { message: "Utilise le revenu passif sécurisé." });
  } else {
    return json(res, 501, { message: `La fonction ${name} doit encore être adaptée.` });
  }
  await writeDb(db);
  return json(res, 200, { data: result });
}

const serveStatic = (req, res, pathname) => {
  const dist = path.join(root, "dist"); if (!fs.existsSync(dist)) return json(res, 404, { message: "Interface non compilée." });
  const requested = pathname === "/" ? "index.html" : pathname.slice(1); let file = path.resolve(dist, requested);
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, "index.html");
  const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" }); fs.createReadStream(file).pipe(res);
};

const handleRequest = async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/uploads/") && req.method === "GET") {
      if (await uploadRoutes(req, res, url.pathname, null) !== false) return;
    }
    const db = await readDb();
    if (url.pathname.startsWith("/api/auth/")) { const handled = await authRoutes(req, res, url.pathname, db); if (handled !== false) return; }
    if (url.pathname.startsWith("/api/")) {
      const user = currentUser(req, db); if (!user) return json(res, 401, { message: "Authentification requise." });
      if (await uploadRoutes(req, res, url.pathname, user) !== false) return;
      if (await entityRoutes(req, res, url.pathname, url.searchParams, db, user) !== false) return;
      if (url.pathname.startsWith("/api/functions/") && req.method === "POST") return runFunction(req, res, url.pathname.split("/").pop(), db, user);
      return json(res, 404, { message: "Route API inconnue." });
    }
    serveStatic(req, res, url.pathname);
  } catch (error) { console.error(error); if (!res.headersSent) json(res, 500, { message: "Erreur interne du serveur." }); }
};

let apiQueue = Promise.resolve();
const server = http.createServer((req, res) => {
  if (req.url?.startsWith("/api/") && !(req.method === "GET" && req.url.startsWith("/api/uploads/"))) {
    apiQueue = apiQueue.then(() => handleRequest(req, res), () => handleRequest(req, res));
    return;
  }
  handleRequest(req, res);
});

server.listen(port, "127.0.0.1", () => console.log(`API Manga Cards : http://127.0.0.1:${port}`));
