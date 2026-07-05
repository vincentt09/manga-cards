import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gzipSync, gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { GridFSBucket, MongoClient, ObjectId } from "mongodb";
import { BOOSTER_TYPES, CARD_POOL, getCoinReward, getDuplicatesForUpgrade, getLevelFromXp, getTotalIncome, getXpReward } from "../src/lib/gameData.js";
import { getTalent } from "../src/lib/talentData.js";
import { LEVEL_REWARDS } from "../src/lib/levelRewards.js";
import { DAILY_QUESTS_POOL, WEEKLY_QUESTS_POOL, getExpiryDate } from "../src/lib/questData.js";
import { PVE_BOSSES, PVE_DAILY_REPLAY_LIMIT, PVE_ENERGY_REGEN_MS, PVE_MAX_ENERGY } from "../src/lib/pveData.js";
import { getUnlockedProfileBadges } from "../src/lib/profileBadges.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}
const dataDir = process.env.VERCEL ? "/tmp/manga-cards-data" : path.join(root, "data");
const dbFile = path.join(dataDir, "database.json");
const port = Number(process.env.PORT || 8787);
const frontendUrl = process.env.APP_URL || "http://127.0.0.1:5173";
const requestOrigin = (req) => {
  const proto = req.headers["x-forwarded-proto"] || (req.headers.host?.startsWith("127.0.0.1") || req.headers.host?.startsWith("localhost") ? "http" : "https");
  return `${String(proto).split(",")[0]}://${req.headers.host}`;
};
const publicApiUrl = (req) => (process.env.API_URL || requestOrigin(req)).replace(/\/$/, "");
const appUrl = (req) => (process.env.APP_URL || requestOrigin(req)).replace(/\/$/, "");
const mongoUri = process.env.MONGODB_URI;
const mongoDatabaseName = process.env.MONGODB_DATABASE || "manga_cards";
let mongoClient;
let mongoConnectPromise;
let warnedAboutMongo = false;
let dbCache = null;

const EXTRA_CHARACTERS = {
  Naruto: ["Gaara", "Jiraiya", "Tsunade", "Orochimaru", "Minato Namikaze"],
  "One Piece": ["Usopp", "Nico Robin", "Tony Tony Chopper", "Trafalgar Law", "Portgas D. Ace", "Boa Hancock", "Shanks"],
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
const canonicalAnimeNames = [...new Set(CARD_POOL.map((card) => card.anime).filter(Boolean))];
const canonicalAnimeName = (value) => {
  const trimmed = String(value || "").replace(/\s+/g, " ").trim();
  return canonicalAnimeNames.find((name) => name.toLocaleLowerCase("fr") === trimmed.toLocaleLowerCase("fr")) || trimmed;
};
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
const ensureBaseFrameCatalog = (entities) => {
  entities.CardFrame ||= [];
  let changed = false;
  for (const baseFrame of baseFrameCatalog) {
    const existing = entities.CardFrame.find((frame) => frame.id === baseFrame.id);
    if (!existing) {
      const now = new Date().toISOString();
      entities.CardFrame.push({ ...baseFrame, created_date: now, updated_date: now });
      changed = true;
      continue;
    }
    const merged = { ...baseFrame, ...existing, id: baseFrame.id, is_endgame: true };
    if (JSON.stringify(existing) !== JSON.stringify(merged)) {
      Object.assign(existing, merged, { updated_date: new Date().toISOString() });
      changed = true;
    }
  }
  return changed;
};
const repairDuplicateCollections = (db) => {
  const collections = db.entities.AnimeCollection || [];
  const groups = new Map();
  for (const collection of collections) {
    const key = `${String(collection.name || "").trim().toLocaleLowerCase("fr")}|${String(collection.anime || "").trim().toLocaleLowerCase("fr")}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(collection);
  }
  const removedIds = new Set();
  const merged = [];
  for (const duplicates of groups.values()) {
    if (duplicates.length < 2) continue;
    const referenced = id => (db.entities.CardDefinition || []).filter((card) => card.collection_id === id).length;
    const ordered = [...duplicates].sort((a, b) => referenced(b.id) - referenced(a.id) || new Date(a.created_date || 0) - new Date(b.created_date || 0));
    const canonical = ordered[0];
    for (const duplicate of ordered.slice(1)) {
      for (const definition of db.entities.CardDefinition || []) if (definition.collection_id === duplicate.id) definition.collection_id = canonical.id;
      for (const profile of db.entities.PlayerProfile || []) {
        if (!profile.boosters_count?.[duplicate.id]) continue;
        profile.boosters_count[canonical.id] = Number(profile.boosters_count[canonical.id] || 0) + Number(profile.boosters_count[duplicate.id] || 0);
        delete profile.boosters_count[duplicate.id];
      }
      removedIds.add(duplicate.id);
      merged.push({ removed_id: duplicate.id, kept_id: canonical.id, name: canonical.name });
    }
  }
  if (removedIds.size) db.entities.AnimeCollection = collections.filter((collection) => !removedIds.has(collection.id));
  return merged;
};
const repairDuplicatePlayerProfiles = (db) => {
  const profiles = db.entities.PlayerProfile || [];
  const groups = new Map();
  for (const profile of profiles) {
    const ownerKey = profile.created_by_id || `email:${String(profile.created_by || "").toLocaleLowerCase("fr")}`;
    if (!groups.has(ownerKey)) groups.set(ownerKey, []);
    groups.get(ownerKey).push(profile);
  }
  const removedIds = new Set();
  const merged = [];
  const maxFields = ["coins", "gems", "xp", "level", "talent_points", "boosters_opened", "total_cards", "pity_counter", "pve_wins", "pve_losses", "pve_max_stage", "pve_energy"];
  const unionFields = ["claimed_rewards", "pve_cleared_stages", "showcase_card_ids", "selected_badge_ids", "system_market_purchases"];
  const objectMaxFields = ["boosters_count", "pve_stage_stars", "pve_daily_wins"];
  for (const duplicates of groups.values()) {
    if (duplicates.length < 2) continue;
    const ordered = [...duplicates].sort((a, b) => Number(b.xp || 0) - Number(a.xp || 0) || Number(b.boosters_opened || 0) - Number(a.boosters_opened || 0) || Number(b.coins || 0) - Number(a.coins || 0) || new Date(b.updated_date || 0) - new Date(a.updated_date || 0));
    const canonical = ordered[0];
    for (const duplicate of ordered.slice(1)) {
      for (const field of maxFields) canonical[field] = Math.max(Number(canonical[field] || 0), Number(duplicate[field] || 0));
      for (const field of unionFields) canonical[field] = [...new Set([...(canonical[field] || []), ...(duplicate[field] || [])])];
      for (const field of objectMaxFields) {
        const combined = { ...(canonical[field] || {}) };
        for (const [key, value] of Object.entries(duplicate[field] || {})) combined[key] = Math.max(Number(combined[key] || 0), Number(value || 0));
        canonical[field] = combined;
      }
      for (const [field, value] of Object.entries(duplicate)) {
        if (["id", ...maxFields, ...unionFields, ...objectMaxFields].includes(field)) continue;
        if ((canonical[field] === undefined || canonical[field] === null || canonical[field] === "") && value !== undefined && value !== null && value !== "") canonical[field] = value;
      }
      canonical.created_date = [canonical.created_date, duplicate.created_date].filter(Boolean).sort()[0] || canonical.created_date;
      canonical.updated_date = [canonical.updated_date, duplicate.updated_date].filter(Boolean).sort().reverse()[0] || new Date().toISOString();
      removedIds.add(duplicate.id);
      merged.push({ kept_id: canonical.id, removed_id: duplicate.id, user_id: canonical.created_by_id, email: canonical.created_by });
    }
  }
  if (removedIds.size) db.entities.PlayerProfile = profiles.filter(profile => !removedIds.has(profile.id));
  return merged;
};
const FUSION_RECIPES = {
  normale: { count: 5, copiesEach: 5, result: "legendaire", cost: 50_000, minLevel: 10, xp: 1_000 },
  legendaire: { count: 5, copiesEach: 3, result: "secrète", cost: 250_000, minLevel: 15, xp: 5_000 },
  "secrète": { count: 5, copiesEach: 2, result: "manga_god", cost: 1_000_000, minLevel: 25, xp: 25_000, weekly: true },
};
const QUEST_DEFINITIONS = new Map([...DAILY_QUESTS_POOL, ...WEEKLY_QUESTS_POOL].map((quest) => [quest.quest_id, quest]));
const createQuestRow = (item) => {
  const definition = QUEST_DEFINITIONS.get(item.quest_id);
  if (!definition || !["daily", "weekly"].includes(item.type)) return null;
  const loginQuest = item.quest_id === "login_daily";
  return {
    ...definition,
    type: item.type,
    progress: loginQuest ? 1 : 0,
    completed: loginQuest,
    claimed: false,
    expires_at: getExpiryDate(item.type),
  };
};
const advanceQuestProgress = (entities, userId, questIds, increment = 1) => {
  const ids = new Set(questIds);
  const now = Date.now();
  for (const quest of (entities.Quest || []).filter((item) =>
    item.created_by_id === userId
    && ids.has(item.quest_id)
    && !item.claimed
    && !item.completed
    && (!item.expires_at || new Date(item.expires_at).getTime() > now)
  )) {
    quest.progress = Math.min(Number(quest.target || 1), Number(quest.progress || 0) + Number(increment || 0));
    quest.completed = quest.progress >= Number(quest.target || 1);
    quest.updated_date = new Date(now).toISOString();
  }
};
const settleExpiredAuctions = (db) => {
  const entities = db.entities;
  const now = Date.now();
  for (const auction of (entities.Auction || []).filter((item) => item.status === "active" && new Date(item.ends_at).getTime() <= now)) {
    const stamp = new Date(now).toISOString();
    const ownerId = auction.highest_bidder_id || auction.seller_id;
    const owner = db.users.find((candidate) => candidate.id === ownerId);
    entities.Card ||= [];
    const existingCard = entities.Card.find((card) => card.created_by_id === ownerId && card.name === auction.card_name && card.rarity === auction.card_rarity);
    if (existingCard) {
      existingCard.duplicates = Number(existingCard.duplicates || 1) + 1;
      existingCard.updated_date = stamp;
    } else {
      entities.Card.push({
        id: id(), name: auction.card_name, anime: auction.card_anime, rarity: auction.card_rarity,
        power: auction.card_power, attack: auction.card_attack, defense: auction.card_defense, speed: auction.card_speed,
        level: auction.card_level || 1, image_url: auction.card_image_url || null, duplicates: 1, is_favorite: false,
        created_by_id: ownerId, created_by: owner?.email, created_date: stamp, updated_date: stamp,
      });
    }
    if (auction.highest_bidder_id) {
      const sellerProfile = (entities.PlayerProfile || []).find((item) => item.created_by_id === auction.seller_id);
      const fee = Math.max(1, Math.floor(Number(auction.current_bid || 0) * 0.10));
      if (sellerProfile) {
        sellerProfile.coins = Number(sellerProfile.coins || 0) + Number(auction.current_bid || 0) - fee;
        sellerProfile.updated_date = stamp;
      }
      Object.assign(auction, { status: "sold", final_fee: fee, sold_at: stamp, updated_date: stamp });
    } else {
      Object.assign(auction, { status: "expired", updated_date: stamp });
    }
  }
};
const refreshPveEnergy = (profile) => {
  const now = Date.now();
  let energy = Math.max(0, Math.min(PVE_MAX_ENERGY, Number(profile.pve_energy ?? PVE_MAX_ENERGY)));
  const lastUpdate = profile.pve_energy_updated_at ? new Date(profile.pve_energy_updated_at).getTime() : now;
  const gained = Math.max(0, Math.floor((now - lastUpdate) / PVE_ENERGY_REGEN_MS));
  if (gained > 0) energy = Math.min(PVE_MAX_ENERGY, energy + gained);
  profile.pve_energy = energy;
  profile.pve_energy_updated_at = new Date(energy >= PVE_MAX_ENERGY ? now : lastUpdate + gained * PVE_ENERGY_REGEN_MS).toISOString();
  return {
    energy,
    maxEnergy: PVE_MAX_ENERGY,
    nextEnergyAt: energy >= PVE_MAX_ENERGY ? null : new Date(new Date(profile.pve_energy_updated_at).getTime() + PVE_ENERGY_REGEN_MS).toISOString(),
  };
};
const TITLE_REQUIREMENTS = {
  cards_10: ["cards_owned", 10], cards_50: ["cards_owned", 50], cards_100: ["cards_owned", 100], cards_250: ["cards_owned", 250],
  rare_5: ["legendary_cards", 5], rare_25: ["legendary_cards", 25], epic_3: ["secret_cards", 3], epic_15: ["secret_cards", 15],
  legendary_1: ["manga_god_cards", 1], legendary_5: ["manga_god_cards", 5], legendary_15: ["manga_god_cards", 15], secret_1: ["all_rarities", 1],
  level5: ["card_level", 5], level10: ["card_level", 10], level25: ["card_level", 25], level50_card: ["card_level", 50], level100_card: ["card_level", 100],
  boosters_10: ["boosters_opened", 10], boosters_50: ["boosters_opened", 50], boosters_100: ["boosters_opened", 100], boosters_500: ["boosters_opened", 500],
  sell_1: ["cards_sold", 1], sell_10: ["cards_sold", 10], sell_50: ["cards_sold", 50],
  level_10: ["player_level", 10], level_25: ["player_level", 25], level_50: ["player_level", 50], level_75: ["player_level", 75], level_100: ["player_level", 100],
  gems_50: ["gems", 50], gems_250: ["gems", 250], fav_5: ["favorites", 5],
  pve_1: ["pve_wins", 1], pve_25: ["pve_wins", 25], pve_100: ["pve_wins", 100],
  pve_stage_4: ["pve_stage", 5], pve_stage_8: ["pve_stage", 9], pve_stage_12: ["pve_cleared_stage", 12],
};
const CUSTOM_TITLE_REQUIREMENT_TYPES = new Set(["player_level", "cards_owned", "boosters_opened", "card_level", "legendary_cards", "secret_cards", "manga_god_cards", "pve_wins", "pve_stage", "cards_sold", "coins", "gems", "favorites"]);
const titleProgress = (entities, profile, userId, type) => {
  const cards = (entities.Card || []).filter(card => card.created_by_id === userId);
  const rarity = value => cards.filter(card => card.rarity === value).length;
  const values = {
    cards_owned: cards.length,
    legendary_cards: rarity("legendaire"),
    secret_cards: rarity("secrète"),
    manga_god_cards: rarity("manga_god"),
    all_rarities: ["normale", "legendaire", "secrète", "manga_god"].every(value => rarity(value) > 0) ? 1 : 0,
    card_level: cards.reduce((max, card) => Math.max(max, Number(card.level || 1)), 0),
    boosters_opened: Number(profile?.boosters_opened || 0),
    cards_sold: (entities.Transaction || []).filter(row => row.created_by_id === userId && row.type === "sell").length,
    player_level: getLevelFromXp(Number(profile?.xp || 0)).level,
    coins: Number(profile?.coins || 0), gems: Number(profile?.gems || 0),
    favorites: cards.filter(card => card.is_favorite).length,
    pve_wins: Number(profile?.pve_wins || 0), pve_stage: Number(profile?.pve_max_stage || 1),
  };
  if (type === "pve_cleared_stage") return Math.max(0, ...(profile?.pve_cleared_stages || []));
  return Number(values[type] || 0);
};
const customTitleState = (entities, profile, userId, definition) => {
  const required = Math.max(1, Number(definition.requirement_value || 1));
  const progress = titleProgress(entities, profile, userId, definition.requirement_type);
  return { ...definition, progress, required, unlocked: progress >= required };
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
    if (!mongoConnectPromise) {
      mongoConnectPromise = (async () => {
        const client = new MongoClient(mongoUri);
        try {
          await client.connect();
          mongoClient = client;
          console.log(`MongoDB connecte : ${mongoDatabaseName}`);
        } catch (error) {
          await client.close().catch(() => {});
          throw error;
        } finally {
          mongoConnectPromise = null;
        }
      })();
    }
    await mongoConnectPromise;
  }
  return mongoClient.db(mongoDatabaseName);
};
const createDatabaseBackup = async (db, { reason = "manual", actor = null } = {}) => {
  const remote = await mongoDb();
  if (!remote) throw new Error("MongoDB est requis pour créer une sauvegarde.");
  const snapshot = structuredClone(db);
  snapshot.sessions = [];
  snapshot.resetTokens = [];
  snapshot.oauthStates = [];
  const payload = gzipSync(Buffer.from(JSON.stringify(snapshot)));
  if (payload.length > 14 * 1024 * 1024) throw new Error("La sauvegarde dépasse la limite de sécurité de 14 Mo.");
  const now = new Date();
  const result = await remote.collection("admin_backups").insertOne({
    created_at: now, reason, actor_id: actor?.id || null, actor_email: actor?.email || null,
    bytes: payload.length, users_count: snapshot.users.length,
    cards_count: (snapshot.entities.Card || []).length, entities_count: Object.values(snapshot.entities).reduce((sum, rows) => sum + (rows?.length || 0), 0),
    payload,
  });
  const expired = await remote.collection("admin_backups").find({}, { projection: { _id: 1 } }).sort({ created_at: -1 }).skip(14).toArray();
  if (expired.length) await remote.collection("admin_backups").deleteMany({ _id: { $in: expired.map((item) => item._id) } });
  return { id: result.insertedId.toString(), created_at: now.toISOString(), reason, bytes: payload.length, users_count: snapshot.users.length, cards_count: (snapshot.entities.Card || []).length };
};
const listDatabaseBackups = async () => {
  const remote = await mongoDb();
  if (!remote) throw new Error("MongoDB est requis pour consulter les sauvegardes.");
  return (await remote.collection("admin_backups").find({}, { projection: { payload: 0 } }).sort({ created_at: -1 }).limit(50).toArray()).map(({ _id, created_at, ...item }) => ({ id: _id.toString(), created_at: created_at.toISOString(), ...item }));
};
const ensureDailyBackup = async (db) => {
  const remote = await mongoDb();
  if (!remote) return;
  const latest = await remote.collection("admin_backups").findOne({ reason: "automatic" }, { sort: { created_at: -1 }, projection: { created_at: 1 } });
  if (!latest || Date.now() - new Date(latest.created_at).getTime() >= 24 * 60 * 60 * 1000) await createDatabaseBackup(db, { reason: "automatic" });
};
const syncMongoCollection = async (collection, rows, key = "id") => {
  const ids = rows.map((row) => row[key]).filter(Boolean);
  if (rows.length) {
    await collection.bulkWrite(rows.map((row) => ({
      replaceOne: { filter: { [key]: row[key] }, replacement: row, upsert: true },
    })));
  }
  await collection.deleteMany(ids.length ? { [key]: { $nin: ids } } : {});
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
    const repairedProfiles = repairDuplicatePlayerProfiles(db);
    if (repairedProfiles.length) fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
    dbCache = db;
    return dbCache;
  }
  const collectionNames = (await remote.listCollections({}, { nameOnly: true }).toArray()).map((item) => item.name);
  const [users, cards, sessions, resetTokens, oauthStates] = await Promise.all([
    remote.collection("users").find({}).toArray(),
    remote.collection("cards").find({}).toArray(),
    remote.collection("auth_sessions").find({}).toArray(),
    remote.collection("auth_reset_tokens").find({}).toArray(),
    remote.collection("auth_oauth_states").find({}).toArray(),
  ]);
  if (!users.length && db.users.length) await remote.collection("users").insertMany(db.users);
  else db.users = users.map(({ _id, ...user }) => user);
  db.sessions = sessions.map(({ _id, ...session }) => session);
  db.resetTokens = resetTokens.map(({ _id, ...token }) => token);
  db.oauthStates = oauthStates.map(({ _id, ...state }) => state);
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
  const repairedProfiles = repairDuplicatePlayerProfiles(db);
  if (repairedProfiles.length) {
    await syncMongoCollection(remote.collection(entityCollectionName("PlayerProfile")), db.entities.PlayerProfile);
    console.log(`${repairedProfiles.length} profil(s) joueur en double fusionné(s).`);
  }
  db.entities.CardDefinition ||= [];
  const definitionIds = new Set(db.entities.CardDefinition.map((card) => card.id));
  const missingDefinitions = baseCardCatalog.filter((card) => !definitionIds.has(card.id));
  if (missingDefinitions.length) {
    db.entities.CardDefinition.push(...missingDefinitions);
    await remote.collection(entityCollectionName("CardDefinition")).insertMany(missingDefinitions);
  }
  const framesChanged = ensureBaseFrameCatalog(db.entities);
  if (framesChanged) await syncMongoCollection(remote.collection(entityCollectionName("CardFrame")), db.entities.CardFrame);
  dbCache = db;
  await ensureDailyBackup(dbCache).catch((error) => console.error("Sauvegarde automatique impossible :", error.message));
  return dbCache;
};
const writeDb = async (db) => {
  dbCache = db;
  fs.mkdirSync(dataDir, { recursive: true });
  const remote = await mongoDb();
  if (remote) {
    await Promise.all([
      syncMongoCollection(remote.collection("users"), db.users),
      syncMongoCollection(remote.collection("auth_sessions"), db.sessions, "token"),
      syncMongoCollection(remote.collection("auth_reset_tokens"), db.resetTokens, "token"),
      syncMongoCollection(remote.collection("auth_oauth_states"), db.oauthStates, "state"),
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
const recordAdminAudit = (db, admin, action, target, details = {}) => {
  db.entities.AdminAudit ||= [];
  db.entities.AdminAudit.unshift({
    id: id(), action, target_user_id: target?.id || null, target_email: target?.email || null,
    details, created_by_id: admin.id, created_by: admin.email, created_date: new Date().toISOString(),
  });
  db.entities.AdminAudit = db.entities.AdminAudit.slice(0, 1000);
};
const isUserSuspended = (user) => user?.status === "suspended"
  && (!user.suspended_until || new Date(user.suspended_until).getTime() > Date.now());
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
  const user = session ? db.users.find((candidate) => candidate.id === session.user_id) : null;
  return user && !isUserSuspended(user) ? user : null;
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
const rowBelongsToUser = (row, user) => row
  && (row.created_by_id === user.id
    || row.user_id === user.id
    || row.owner_id === user.id
    || row.player_id === user.id
    || row.recipient_id === user.id
    || row.created_by === user.email);
const normalizeOwnedCard = (db, card, user) => {
  const resolved = resolvedCard(db, card);
  const now = new Date().toISOString();
  let changed = false;
  for (const [field, value] of Object.entries({
    created_by_id: user.id,
    created_by: user.email,
    card_definition_id: resolved.card_definition_id,
    collection_id: resolved.collection_id,
    edition: resolved.edition || "standard",
    is_collector: Boolean(resolved.is_collector),
    image_url: resolved.image_url || null,
    level: Math.max(1, Number(card.level || 1)),
    duplicates: Math.max(1, Number(card.duplicates || 1)),
    upgrade_progress: Math.max(0, Number(card.upgrade_progress || 0)),
    is_favorite: Boolean(card.is_favorite),
  })) {
    if (value !== undefined && card[field] !== value) {
      card[field] = value;
      changed = true;
    }
  }
  if (!card.obtained_via && (card.user_id || card.owner_id || card.player_id || card.recipient_id)) {
    card.obtained_via = "external_grant";
    changed = true;
  }
  if (changed) card.updated_date = now;
  return { card, changed };
};
const grantCardToPlayer = (db, target, definition, quantity = 1, obtainedVia = "gift_claim") => {
  const entities = db.entities;
  const safeQuantity = Math.max(1, Math.min(100, Math.floor(Number(quantity || 1))));
  const now = new Date().toISOString();
  entities.Card ||= [];
  let card = entities.Card.find((candidate) => rowBelongsToUser(candidate, target)
    && (candidate.card_definition_id === definition.id
      || (!candidate.card_definition_id && candidate.name === definition.name && candidate.anime === definition.anime && candidate.rarity === definition.rarity)));
  if (card) {
    normalizeOwnedCard(db, card, target);
    card.card_definition_id ||= definition.id;
    card.collection_id ||= definition.collection_id || null;
    card.edition ||= definition.edition || "standard";
    card.is_collector = Boolean(card.is_collector || definition.is_collector);
    card.duplicates = Math.max(1, Number(card.duplicates || 1)) + safeQuantity;
    card.upgrade_progress = Number(card.upgrade_progress || 0) + safeQuantity;
    while (Number(card.level || 1) < 100 && card.upgrade_progress >= getDuplicatesForUpgrade(Number(card.level || 1))) {
      card.upgrade_progress -= getDuplicatesForUpgrade(Number(card.level || 1));
      card.level = Number(card.level || 1) + 1;
      card.power = Number(card.power || definition.basePower || 1) + 3;
      card.attack = Number(card.attack || definition.baseAttack || 1) + 2;
      card.defense = Number(card.defense || definition.baseDefense || 1) + 2;
      card.speed = Number(card.speed || definition.baseSpeed || 1) + 1;
    }
    card.updated_date = now;
  } else {
    card = {
      id: id(), card_definition_id: definition.id, name: definition.name, anime: definition.anime, rarity: definition.rarity,
      power: definition.basePower, attack: definition.baseAttack, defense: definition.baseDefense, speed: definition.baseSpeed,
      image_url: definition.image_url || null, collection_id: definition.collection_id || null, edition: definition.edition || "standard",
      is_collector: Boolean(definition.is_collector), level: 1, duplicates: safeQuantity, upgrade_progress: Math.max(0, safeQuantity - 1), is_favorite: false,
      obtained_via: obtainedVia, created_by_id: target.id, created_by: target.email, created_date: now, updated_date: now,
    };
    entities.Card.push(card);
  }
  return resolvedCard(db, card);
};
const grantFrameToPlayer = (db, target, frame, obtainedVia = "gift_claim") => {
  const entities = db.entities;
  entities.PlayerFrame ||= [];
  const existing = entities.PlayerFrame.find((item) => rowBelongsToUser(item, target) && item.frame_id === frame.id);
  if (existing) {
    existing.created_by_id = target.id;
    existing.created_by = target.email;
    existing.is_unlocked = true;
    existing.updated_date = new Date().toISOString();
    return existing;
  }
  const now = new Date().toISOString();
  const owned = { id: id(), frame_id: frame.id, is_unlocked: true, card_id: null, unlocked_date: now, obtained_via: obtainedVia, created_by_id: target.id, created_by: target.email, created_date: now, updated_date: now };
  entities.PlayerFrame.push(owned);
  return owned;
};
const getSystemMarketOffers = (db, date = new Date()) => {
  const hourStart = new Date(date);
  hourStart.setUTCMinutes(0, 0, 0);
  const hourKey = hourStart.toISOString().slice(0, 13);
  const nextRotationAt = new Date(hourStart.getTime() + 3_600_000).toISOString();
  const basePrices = { normale: 900, legendaire: 18_000, "secrète": 85_000, manga_god: 450_000 };
  const ranked = (db.entities.CardDefinition || [])
    .filter((card) => card.is_active !== false)
    .map((card) => ({ card, rank: crypto.createHash("sha256").update(`${hourKey}:${card.id}`).digest("hex") }))
    .sort((a, b) => a.rank.localeCompare(b.rank));
  const selected = [];
  const characters = new Set();
  for (const entry of ranked) {
    if (characters.has(entry.card.name)) continue;
    characters.add(entry.card.name);
    selected.push(entry);
    if (selected.length === 5) break;
  }
  const offers = selected.map(({ card, rank }) => {
    const priceVariation = 0.90 + (parseInt(rank.slice(0, 4), 16) % 21) / 100;
    const resolved = resolvedCard(db, { ...card, card_definition_id: card.id });
    return {
      id: `system:${hourKey}:${card.id}`,
      card_definition_id: card.id,
      card_name: card.name,
      card_anime: card.anime,
      card_rarity: card.rarity,
      card_power: Number(card.basePower || card.power || 1),
      card_attack: Number(card.baseAttack || card.attack || 1),
      card_defense: Number(card.baseDefense || card.defense || 1),
      card_speed: Number(card.baseSpeed || card.speed || 1),
      card_level: 1,
      card_image_url: resolved.image_url,
      price: Math.max(1, Math.round(Number(basePrices[card.rarity] || 900) * priceVariation / 100) * 100),
      seller_id: "system",
      seller_name: "Boutique du jeu",
      is_system: true,
    };
  });
  return { hourKey, nextRotationAt, offers };
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
const ensureUserProfile = (db, user) => {
  repairDuplicatePlayerProfiles(db);
  let profile = (db.entities.PlayerProfile || []).find((item) => item.created_by_id === user.id);
  if (!profile) {
    seedProfile(db, user);
    profile = db.entities.PlayerProfile.find((item) => item.created_by_id === user.id);
  }
  return profile;
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
    user.last_login_at = new Date().toISOString();
    const token = createSession(db, user.id); await writeDb(db);
    return json(res, 201, { access_token: token, user: publicUser(user) });
  }
  if (pathname === "/api/auth/login" && req.method === "POST") {
    const input = await body(req);
    const user = db.users.find((item) => item.email === input.email?.trim().toLowerCase());
    if (!user || !user.password_hash || !validPassword(input.password || "", user)) return json(res, 401, { message: "E-mail ou mot de passe incorrect." });
    if (isUserSuspended(user)) return json(res, 403, { message: user.suspension_reason || "Ce compte est temporairement suspendu." });
    ensureUserProfile(db, user);
    user.last_login_at = new Date().toISOString();
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
    const requestedOrigin = requestUrl.searchParams.get("origin");
    const allowedOrigins = new Set([frontendUrl, appUrl(req), requestOrigin(req), "http://127.0.0.1:5173", "https://manga-cards.pages.dev", "https://manga-cards-vincentt09.onrender.com"]);
    const returnOrigin = allowedOrigins.has(requestedOrigin) ? requestedOrigin : appUrl(req);
    db.oauthStates = db.oauthStates.filter((item) => item.expires_at > Date.now());
    db.oauthStates.push({ state, return_path: returnPath, return_origin: returnOrigin, expires_at: Date.now() + 10 * 60 * 1000 });
    await writeDb(db);
    const callback = `${publicApiUrl(req)}/api/auth/google/callback`;
    const target = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    target.search = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: callback, response_type: "code", scope: "openid email profile", state, prompt: "select_account" }).toString();
    return redirect(res, target.toString());
  }
  if (pathname === "/api/auth/google/callback" && req.method === "GET") {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`); const code = requestUrl.searchParams.get("code");
    const state = requestUrl.searchParams.get("state");
    const oauthState = db.oauthStates.find((item) => item.state === state && item.expires_at > Date.now());
    db.oauthStates = db.oauthStates.filter((item) => item.state !== state && item.expires_at > Date.now());
    if (!code || !oauthState) { await writeDb(db); return redirect(res, `${appUrl(req)}/login?error=google_invalid_state`); }
    const callback = `${publicApiUrl(req)}/api/auth/google/callback`;
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: callback, grant_type: "authorization_code" }) });
    if (!tokenResponse.ok) { await writeDb(db); return redirect(res, `${oauthState.return_origin || appUrl(req)}/login?error=google_failed`); }
    const googleToken = await tokenResponse.json(); const infoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${googleToken.access_token}` } });
    if (!infoResponse.ok) { await writeDb(db); return redirect(res, `${oauthState.return_origin || appUrl(req)}/login?error=google_profile_failed`); }
    const info = await infoResponse.json();
    const email = String(info.email || "").trim().toLowerCase();
    if (!email) { await writeDb(db); return redirect(res, `${oauthState.return_origin || appUrl(req)}/login?error=google_email_missing`); }
    let user = db.users.find((item) => item.email === email);
    if (!user) { user = { id: id(), email, full_name: info.name || email.split("@")[0], avatar_url: info.picture, role: db.users.length ? "user" : "admin", provider: "google", created_date: new Date().toISOString() }; db.users.push(user); seedProfile(db, user); }
    else {
      user.provider ||= "google";
      user.avatar_url ||= info.picture || null;
      if (!user.full_name) user.full_name = info.name || email.split("@")[0];
    }
    if (isUserSuspended(user)) { await writeDb(db); return redirect(res, `${oauthState.return_origin || appUrl(req)}/login?error=account_suspended`); }
    ensureUserProfile(db, user);
    user.last_login_at = new Date().toISOString();
    const token = createSession(db, user.id); await writeDb(db);
    const target = new URL(oauthState.return_path, oauthState.return_origin || frontendUrl); target.searchParams.set("access_token", token);
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
  if (["AdminAudit", "ChatReport"].includes(name) && user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
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
      if (user.chat_muted_until && new Date(user.chat_muted_until).getTime() > Date.now()) return json(res, 403, { message: `Chat bloqué jusqu’au ${new Date(user.chat_muted_until).toLocaleString("fr-FR")}. ${user.chat_mute_reason || ""}`.trim() });
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
      const input = await body(req);
      const allowedRoles = new Set(["user", "vip", "moderator", "admin"]);
      if ("role" in input && !allowedRoles.has(input.role)) return json(res, 400, { message: "Role invalide." });
      if (found.id === user.id && input.role && input.role !== "admin") return json(res, 400, { message: "Tu ne peux pas retirer ton propre accès administrateur." });
      const adminCount = db.users.filter((candidate) => candidate.role === "admin").length;
      if (found.role === "admin" && input.role && input.role !== "admin" && adminCount <= 1) return json(res, 400, { message: "Le dernier administrateur doit conserver son rôle." });
      for (const field of ["role", "full_name", "avatar_url", "status", "suspended_until", "suspension_reason"]) if (field in input) found[field] = input[field];
      if (found.status !== "suspended") { found.status = "active"; found.suspended_until = null; found.suspension_reason = null; }
      found.updated_date = new Date().toISOString();
      const playerProfile = (db.entities.PlayerProfile || []).find((item) => item.created_by_id === found.id);
      if (playerProfile && "full_name" in input) playerProfile.display_name = String(input.full_name || "").trim();
      recordAdminAudit(db, user, "user_updated", found, {
        fields: Object.keys(input).filter((field) => ["role", "full_name", "status", "suspended_until", "suspension_reason"].includes(field)),
      });
      await writeDb(db); return json(res, 200, publicUser(found));
    }
    if (req.method === "DELETE" && action) {
      if (user.role !== "admin") return json(res, 403, { message: "Acces administrateur requis." });
      const found = db.users.find((item) => item.id === action); if (!found) return json(res, 404, { message: "Utilisateur introuvable." });
      if (found.id === user.id) return json(res, 400, { message: "Tu ne peux pas supprimer ton propre compte administrateur." });
      if (found.role === "admin" && db.users.filter((candidate) => candidate.role === "admin").length <= 1) return json(res, 400, { message: "Le dernier administrateur ne peut pas être supprimé." });
      const belongsToUser = (row) => [row.created_by_id, row.user_id, row.owner_id, row.seller_id, row.requester_id, row.recipient_id, row.sender_id].includes(found.id)
        || row.created_by === found.email;
      const removedByEntity = {};
      for (const [entityName, rows] of Object.entries(db.entities)) {
        if (entityName === "AdminAudit") continue;
        if (entityName === "Auction") {
          for (const auction of rows || []) {
            if (auction.highest_bidder_id === found.id && auction.seller_id !== found.id) {
              auction.highest_bidder_id = null;
              auction.highest_bidder_name = null;
              auction.current_bid = Number(auction.starting_price || 1);
              auction.updated_date = new Date().toISOString();
            }
          }
        }
        for (const row of rows || []) {
          if (row.buyer_id === found.id && !belongsToUser(row)) row.buyer_id = null;
        }
        const kept = (rows || []).filter((row) => !belongsToUser(row));
        removedByEntity[entityName] = (rows || []).length - kept.length;
        db.entities[entityName] = kept;
      }
      db.users = db.users.filter((candidate) => candidate.id !== found.id);
      db.sessions = db.sessions.filter((session) => session.user_id !== found.id);
      db.resetTokens = db.resetTokens.filter((token) => token.user_id !== found.id);
      const removedTotal = Object.values(removedByEntity).reduce((sum, count) => sum + count, 0);
      recordAdminAudit(db, user, "user_deleted", found, { removed_total: removedTotal, removed_by_entity: removedByEntity });
      await writeDb(db); return json(res, 200, { success: true, removed_total: removedTotal, removed: removedByEntity });
    }
    return json(res, 403, { message: "Operation interdite sur les utilisateurs." });
  }
  db.entities[name] ||= []; const rows = db.entities[name];
  const privateEntities = new Set(["PlayerProfile", "Card", "PlayerFrame", "PlayerGift", "PlayerTalent", "Quest", "Transaction", "PveBattle", "Friendship", "DirectMessage", "UserCosmetic", "ProfileCustomization"]);
  const adminManagedEntities = new Set(["AnimeCollection", "CardDefinition", "CardFrame", "CosmeticItem", "CardImageOverride", "DropEvent", "EconomyStats", "TitleDefinition"]);
  const collaborativeEntities = new Set();
  const canAccess = (row) => user.role === "admin" || !privateEntities.has(name) || row.created_by_id === user.id;
  const canWrite = (row) => user.role === "admin" || collaborativeEntities.has(name) || row.created_by_id === user.id;
  const visibleRows = rows.filter(canAccess);
  const present = (row) => name === "Card" ? resolvedCard(db, row) : row;
  if (name === "DirectMessage") return json(res, 405, { message: "Utilise la messagerie privée sécurisée." });
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
    if (name === "PlayerProfile" && user.role !== "admin") return json(res, 403, { message: "Le profil joueur est créé automatiquement avec le compte." });
    if (["MarketListing", "FrameListing"].includes(name) && user.role !== "admin") return json(res, 403, { message: "Utilise la mise en vente sécurisée." });
    if (adminManagedEntities.has(name) && user.role !== "admin") return json(res, 403, { message: "Acces administrateur requis." });
    let input = await body(req);
    if (!Array.isArray(input)) return json(res, 400, { message: "Liste invalide." });
    if (input.length > 100) return json(res, 400, { message: "Maximum 100 éléments par création groupée." });
    if (["AnimeCollection", "CardDefinition"].includes(name)) input = input.map(item => ({ ...item, anime: item.anime ? canonicalAnimeName(item.anime) : item.anime }));
    if (name === "CardDefinition") {
      const allowedRarities = new Set(["normale", "legendaire", "secrète", "manga_god"]);
      const knownKeys = new Set(rows.map(row => `${row.collection_id || ""}:${String(row.anime || "").toLocaleLowerCase("fr")}:${String(row.name || "").toLocaleLowerCase("fr")}:${row.rarity}:${Boolean(row.is_collector)}`));
      const uniqueInput = [];
      for (const item of input) {
        item.name = String(item.name || "").replace(/\s+/g, " ").trim().slice(0, 80);
        item.anime = String(item.anime || "").replace(/\s+/g, " ").trim().slice(0, 80);
        if (!item.name || !item.anime || !allowedRarities.has(item.rarity)) return json(res, 400, { message: "Nom, série ou rareté de carte invalide." });
        const key = `${item.collection_id || ""}:${item.anime.toLocaleLowerCase("fr")}:${item.name.toLocaleLowerCase("fr")}:${item.rarity}:${Boolean(item.is_collector)}`;
        if (knownKeys.has(key)) continue;
        knownKeys.add(key);
        uniqueInput.push(item);
      }
      input = uniqueInput;
      if (!input.length) return json(res, 409, { message: "Toutes les versions sélectionnées existent déjà." });
    }
    if (name === "Quest" && user.role !== "admin") {
      const now = Date.now();
      const requestedTypes = new Set(input.map((item) => item.type));
      const existingTypes = new Set(rows.filter((row) => row.created_by_id === user.id && new Date(row.expires_at).getTime() > now).map((row) => row.type));
      input = input.filter((item) => !existingTypes.has(item.type) && requestedTypes.has(item.type)).map(createQuestRow).filter(Boolean);
    }
    if (name === "PlayerFrame" && user.role !== "admin" && input.some((item) => (db.entities.CardFrame || []).some((frame) => frame.id === item.frame_id && ["endgame", "gift", "event"].includes(frame.source_type)))) return json(res, 403, { message: "Ce cadre doit être obtenu par sa méthode officielle." });
    const created = input.map((item) => ({ ...item, id: id(), created_by_id: user.id, created_by: user.email, created_date: new Date().toISOString() })); rows.push(...created); await writeDb(db); return json(res, 201, created);
  }
  if (req.method === "POST" && !action) {
    if (name === "PlayerTalent" && user.role !== "admin") return json(res, 403, { message: "Les talents doivent être débloqués depuis l'arbre de talents." });
    if (name === "PlayerProfile" && user.role !== "admin") return json(res, 403, { message: "Le profil joueur est créé automatiquement avec le compte." });
    if (name === "Auction" && user.role !== "admin") return json(res, 403, { message: "Utilise la création d’enchère sécurisée." });
    if (["MarketListing", "FrameListing"].includes(name) && user.role !== "admin") return json(res, 403, { message: "Utilise la mise en vente sécurisée." });
    if (adminManagedEntities.has(name) && user.role !== "admin") return json(res, 403, { message: "Acces administrateur requis." });
    let input = await body(req);
    if (name === "TitleDefinition") {
      input.label = String(input.label || "").replace(/\s+/g, " ").trim().slice(0, 50);
      input.description = String(input.description || "").trim().slice(0, 140);
      input.requirement_value = Math.max(1, Math.floor(Number(input.requirement_value || 1)));
      if (input.label.length < 2 || !CUSTOM_TITLE_REQUIREMENT_TYPES.has(input.requirement_type)) return json(res, 400, { message: "Titre ou condition invalide." });
    }
    if (name === "AnimeCollection") {
      const duplicate = rows.some((row) => String(row.name || "").trim().toLocaleLowerCase("fr") === String(input.name || "").trim().toLocaleLowerCase("fr") && String(row.anime || "").trim().toLocaleLowerCase("fr") === String(input.anime || "").trim().toLocaleLowerCase("fr"));
      if (duplicate) return json(res, 409, { message: "Une collection identique existe déjà. Modifie la collection existante." });
    }
    if (name === "Quest" && user.role !== "admin") {
      input = createQuestRow(input);
      if (!input) return json(res, 400, { message: "Quête invalide." });
    }
    if (name === "PlayerFrame" && user.role !== "admin" && (db.entities.CardFrame || []).some((frame) => frame.id === input.frame_id && ["endgame", "gift", "event"].includes(frame.source_type))) return json(res, 403, { message: "Ce cadre doit être obtenu par sa méthode officielle." });
    const created = { ...input, id: id(), created_by_id: user.id, created_by: user.email, created_date: new Date().toISOString(), updated_date: new Date().toISOString() };
    rows.push(created);
    if (name === "MarketListing" && created.status === "active") advanceQuestProgress(db.entities, user.id, ["sell_1_card", "w_sell_3"]);
    await writeDb(db); return json(res, 201, created);
  }
  const item = rows.find((row) => row.id === action); if (!item || !canAccess(item)) return json(res, 404, { message: `${name} introuvable.` });
  if (req.method === "GET") return json(res, 200, present(item));
  if (req.method === "PUT") {
    if (!canWrite(item)) return json(res, 403, { message: "Modification interdite." });
    if (["MarketListing", "FrameListing"].includes(name) && user.role !== "admin") return json(res, 403, { message: "Une annonce active ne peut pas être modifiée directement." });
    const input = await body(req); delete input.id; delete input.created_by_id; delete input.created_by; delete input.created_date;
    if (name === "TitleDefinition") {
      if ("label" in input) input.label = String(input.label || "").replace(/\s+/g, " ").trim().slice(0, 50);
      if ("description" in input) input.description = String(input.description || "").trim().slice(0, 140);
      if ("requirement_value" in input) input.requirement_value = Math.max(1, Math.floor(Number(input.requirement_value || 1)));
      if (("label" in input && input.label.length < 2) || ("requirement_type" in input && !CUSTOM_TITLE_REQUIREMENT_TYPES.has(input.requirement_type))) return json(res, 400, { message: "Titre ou condition invalide." });
    }
    if (["AnimeCollection", "CardDefinition"].includes(name) && input.anime) input.anime = canonicalAnimeName(input.anime);
    if (name === "AnimeCollection" && rows.some((row) => row.id !== item.id && String(row.name || "").trim().toLocaleLowerCase("fr") === String(input.name ?? item.name ?? "").trim().toLocaleLowerCase("fr") && String(row.anime || "").trim().toLocaleLowerCase("fr") === String(input.anime ?? item.anime ?? "").trim().toLocaleLowerCase("fr"))) return json(res, 409, { message: "Une collection identique existe déjà." });
    if (name === "PlayerTalent" && user.role !== "admin") return json(res, 403, { message: "Modification de talent interdite." });
    if (name === "Auction" && user.role !== "admin") return json(res, 403, { message: "Utilise le système d’enchère sécurisé." });
    if (name === "PlayerProfile" && user.role !== "admin") { delete input.talent_points; delete input.claimed_rewards; delete input.equipped_title_id; }
    if (name === "Quest" && user.role !== "admin") {
      delete input.claimed;
      delete input.claimed_at;
      delete input.reward_coins;
      delete input.reward_gems;
    }
    const becameFavorite = name === "Card" && !item.is_favorite && input.is_favorite === true;
    Object.assign(item, input, { id: item.id, updated_date: new Date().toISOString() });
    if (becameFavorite) advanceQuestProgress(db.entities, user.id, ["fav_1_card"]);
    await writeDb(db); return json(res, 200, present(item));
  }
  if (req.method === "DELETE") {
    if (!canWrite(item) || (name === "PlayerTalent" && user.role !== "admin")) return json(res, 403, { message: "Suppression interdite." });
    if (["MarketListing", "FrameListing"].includes(name) && user.role !== "admin") return json(res, 403, { message: "Utilise l’annulation sécurisée pour récupérer l’objet." });
    if (name === "PlayerFrame" && item.frame_id === ENDGAME_FRAME_ID && user.role !== "admin") return json(res, 403, { message: "Une relique ultime ne peut être vendue ni supprimée." });
    db.entities[name] = rows.filter((row) => row.id !== action); await writeDb(db); return json(res, 200, { success: true });
  }
  return false;
}

async function runFunction(req, res, name, db, user) {
  const input = await body(req);
  const entities = db.entities;
  let profile = (entities.PlayerProfile || []).find((item) => item.created_by_id === user.id);
  let result;

  if (name === "ensurePlayerProfile") {
    if (!profile) { seedProfile(db, user); profile = (entities.PlayerProfile || []).find(item => item.created_by_id === user.id); }
    result = profile;
  } else if (name === "getMyCards") {
    entities.Card ||= [];
    let changed = false;
    const owned = entities.Card
      .filter((card) => rowBelongsToUser(card, user))
      .map((card) => {
        const normalized = normalizeOwnedCard(db, card, user);
        if (normalized.changed) changed = true;
        return resolvedCard(db, normalized.card);
      });
    const sort = String(input.sort || "-created_date");
    const skip = Math.max(0, Number(input.skip || 0));
    const limit = Math.max(1, Math.min(2000, Number(input.limit || owned.length || 1000)));
    result = sortRows(owned, sort).slice(skip, skip + limit);
    if (changed) {
      recordAdminAudit(db, { id: "system", email: "system" }, "owned_cards_normalized", user, {
        reason: "inventory_read",
        cards: result.length,
      });
    }
  } else if (name === "getMyGiftInbox") {
    entities.PlayerGift ||= [];
    const gifts = entities.PlayerGift
      .filter((gift) => rowBelongsToUser(gift, user) && gift.status !== "claimed" && gift.status !== "cancelled")
      .map((gift) => {
        const definition = gift.kind === "card" ? (entities.CardDefinition || []).find((card) => card.id === gift.card_definition_id) : null;
        const frame = gift.kind === "frame" ? (entities.CardFrame || []).find((item) => item.id === gift.frame_id) : null;
        return { ...gift, card: definition ? resolvedCard(db, { ...definition, card_definition_id: definition.id }) : null, frame: frame || null };
      })
      .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
    result = { gifts, count: gifts.length };
  } else if (name === "claimPlayerGift") {
    entities.PlayerGift ||= [];
    const gift = entities.PlayerGift.find((item) => item.id === String(input.gift_id || "") && rowBelongsToUser(item, user));
    if (!gift) return json(res, 404, { message: "Cadeau introuvable." });
    if (gift.status === "claimed") return json(res, 409, { message: "Ce cadeau a déjà été réclamé." });
    if (gift.status === "cancelled") return json(res, 410, { message: "Ce cadeau n'est plus disponible." });
    const now = new Date().toISOString();
    let claimed;
    if (gift.kind === "card") {
      const definition = (entities.CardDefinition || []).find((card) => card.id === gift.card_definition_id && card.is_active !== false);
      if (!definition) return json(res, 404, { message: "La carte cadeau n'existe plus." });
      claimed = { kind: "card", card: grantCardToPlayer(db, user, definition, gift.quantity || 1, "gift_claim") };
      entities.Transaction ||= [];
      entities.Transaction.push({ id: id(), type: "gift_claim", description: `Cadeau réclamé : ${definition.name} ×${Math.max(1, Number(gift.quantity || 1))}`, amount: 0, card_name: definition.name, created_by_id: user.id, created_by: user.email, created_date: now });
    } else if (gift.kind === "frame") {
      const frame = (entities.CardFrame || []).find((item) => item.id === gift.frame_id && item.is_active !== false);
      if (!frame) return json(res, 404, { message: "Le cadre cadeau n'existe plus." });
      claimed = { kind: "frame", frame: grantFrameToPlayer(db, user, frame, "gift_claim") };
      entities.Transaction ||= [];
      entities.Transaction.push({ id: id(), type: "gift_claim", description: `Cadre réclamé : ${frame.name}`, amount: 0, created_by_id: user.id, created_by: user.email, created_date: now });
    } else return json(res, 400, { message: "Type de cadeau invalide." });
    Object.assign(gift, { status: "claimed", claimed_at: now, updated_date: now });
    result = { gift, claimed };
  } else if (name === "getFriendsState") {
    const friendships = entities.Friendship || [];
    const decorate = (targetId, relation) => {
      const targetUser = db.users.find(candidate => candidate.id === targetId);
      const targetProfile = (entities.PlayerProfile || []).find(candidate => candidate.created_by_id === targetId);
      if (!targetUser || !targetProfile) return null;
      const unreadCount = (entities.DirectMessage || []).filter(message => message.sender_id === targetId && message.recipient_id === user.id && !message.read_at).length;
      const lastMessage = (entities.DirectMessage || []).filter(message => [message.sender_id, message.recipient_id].includes(user.id) && [message.sender_id, message.recipient_id].includes(targetId)).sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
      return { id: relation.id, user_id: targetId, display_name: targetProfile.display_name || targetUser.full_name || "Joueur", avatar_url: targetProfile.avatar_url || targetUser.avatar_url || null, status_text: targetProfile.status_text || "", status_emoji: targetProfile.status_emoji || "", presence_style: targetProfile.presence_style || "invisible", player_level: getLevelFromXp(Number(targetProfile.xp || 0)).level, since: relation.accepted_at || relation.created_date, unread_count: unreadCount, last_message_at: lastMessage?.created_date || null };
    };
    const accepted = friendships.filter(row => row.status === "accepted" && [row.requester_id, row.recipient_id].includes(user.id));
    const incoming = friendships.filter(row => row.status === "pending" && row.recipient_id === user.id);
    const outgoing = friendships.filter(row => row.status === "pending" && row.requester_id === user.id);
    result = {
      friends: accepted.map(row => decorate(row.requester_id === user.id ? row.recipient_id : row.requester_id, row)).filter(Boolean).sort((a, b) => a.display_name.localeCompare(b.display_name, "fr")),
      incoming: incoming.map(row => decorate(row.requester_id, row)).filter(Boolean),
      outgoing: outgoing.map(row => decorate(row.recipient_id, row)).filter(Boolean),
    };
  } else if (name === "searchFriendPlayers") {
    const query = String(input.query || "").replace(/\s+/g, " ").trim().toLocaleLowerCase("fr");
    if (query.length < 2) return json(res, 400, { message: "Entre au moins 2 caractères." });
    const friendships = entities.Friendship || [];
    result = (entities.PlayerProfile || []).filter(candidate => candidate.created_by_id !== user.id && String(candidate.display_name || "").toLocaleLowerCase("fr").includes(query)).slice(0, 20).map(candidate => {
      const targetUser = db.users.find(row => row.id === candidate.created_by_id);
      const relation = friendships.find(row => [row.requester_id, row.recipient_id].includes(user.id) && [row.requester_id, row.recipient_id].includes(candidate.created_by_id));
      let relationStatus = "none";
      if (relation?.status === "accepted") relationStatus = "friend";
      else if (relation?.status === "blocked") relationStatus = "blocked";
      else if (relation?.status === "pending") relationStatus = relation.requester_id === user.id ? "outgoing" : "incoming";
      return { user_id: candidate.created_by_id, display_name: candidate.display_name || targetUser?.full_name || "Joueur", avatar_url: candidate.avatar_url || targetUser?.avatar_url || null, player_level: getLevelFromXp(Number(candidate.xp || 0)).level, relation_status: relationStatus, friendship_id: relation?.id || null };
    });
  } else if (name === "sendFriendRequest") {
    const targetId = String(input.user_id || "");
    if (!targetId || targetId === user.id) return json(res, 400, { message: "Tu ne peux pas t’ajouter toi-même." });
    if (!db.users.some(candidate => candidate.id === targetId)) return json(res, 404, { message: "Joueur introuvable." });
    entities.Friendship ||= [];
    const existing = entities.Friendship.find(row => [row.requester_id, row.recipient_id].includes(user.id) && [row.requester_id, row.recipient_id].includes(targetId));
    if (existing?.status === "accepted") return json(res, 409, { message: "Vous êtes déjà amis." });
    if (existing?.status === "blocked") return json(res, 403, { message: "Cette demande ne peut pas être envoyée." });
    if (existing?.status === "pending") return json(res, 409, { message: existing.requester_id === user.id ? "Demande déjà envoyée." : "Ce joueur t’a déjà envoyé une demande." });
    const now = new Date().toISOString();
    const friendship = { id: id(), requester_id: user.id, recipient_id: targetId, status: "pending", created_by_id: user.id, created_by: user.email, created_date: now, updated_date: now };
    entities.Friendship.push(friendship); result = friendship;
  } else if (name === "manageFriendship") {
    const friendship = (entities.Friendship || []).find(row => row.id === input.friendship_id && [row.requester_id, row.recipient_id].includes(user.id));
    if (!friendship) return json(res, 404, { message: "Relation introuvable." });
    const action = String(input.action || "");
    if (action === "accept") {
      if (friendship.status !== "pending" || friendship.recipient_id !== user.id) return json(res, 403, { message: "Cette demande ne peut pas être acceptée." });
      friendship.status = "accepted"; friendship.accepted_at = new Date().toISOString(); friendship.updated_date = friendship.accepted_at; result = friendship;
    } else if (["decline", "cancel", "remove"].includes(action)) {
      if (action === "decline" && friendship.recipient_id !== user.id) return json(res, 403, { message: "Action interdite." });
      if (action === "cancel" && friendship.requester_id !== user.id) return json(res, 403, { message: "Action interdite." });
      entities.Friendship = entities.Friendship.filter(row => row.id !== friendship.id); result = { removed: true };
    } else if (action === "block") {
      friendship.status = "blocked"; friendship.blocked_by_id = user.id; friendship.updated_date = new Date().toISOString(); result = friendship;
    } else return json(res, 400, { message: "Action d’amitié invalide." });
  } else if (["getFriendConversation", "sendFriendMessage"].includes(name)) {
    const targetId = String(input.user_id || "");
    const friendship = (entities.Friendship || []).find(row => row.status === "accepted" && [row.requester_id, row.recipient_id].includes(user.id) && [row.requester_id, row.recipient_id].includes(targetId));
    if (!friendship || !targetId || targetId === user.id) return json(res, 403, { message: "Cette conversation est réservée à tes amis." });
    entities.DirectMessage ||= [];
    if (name === "getFriendConversation") {
      const now = new Date().toISOString();
      const conversation = entities.DirectMessage
        .filter(message => [message.sender_id, message.recipient_id].includes(user.id) && [message.sender_id, message.recipient_id].includes(targetId))
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
        .slice(-100);
      let markedRead = false;
      for (const message of conversation) if (message.recipient_id === user.id && !message.read_at) { message.read_at = now; markedRead = true; }
      if (markedRead) await writeDb(db);
      return json(res, 200, { data: { messages: conversation, friend_user_id: targetId } });
    } else {
      if (user.chat_muted_until && new Date(user.chat_muted_until).getTime() > Date.now()) return json(res, 403, { message: "Tu ne peux pas envoyer de message pendant une sanction de chat." });
      const messageText = String(input.message || "").replace(/\s+/g, " ").trim().slice(0, 500);
      if (!messageText) return json(res, 400, { message: "Le message est vide." });
      const lastSent = [...entities.DirectMessage].reverse().find(message => message.sender_id === user.id);
      if (lastSent && Date.now() - new Date(lastSent.created_date).getTime() < 700) return json(res, 429, { message: "Attends un instant avant de renvoyer un message." });
      const targetUser = db.users.find(candidate => candidate.id === targetId);
      const created = { id: id(), sender_id: user.id, recipient_id: targetId, message: messageText, read_at: null, created_by_id: user.id, created_by: user.email, recipient_email: targetUser?.email || null, created_date: new Date().toISOString(), updated_date: new Date().toISOString() };
      entities.DirectMessage.push(created);
      if (entities.DirectMessage.length > 10_000) entities.DirectMessage = entities.DirectMessage.slice(-10_000);
      result = created;
    }
  } else if (name === "deleteFriendMessage") {
    entities.DirectMessage ||= [];
    const messageId = String(input.message_id || "");
    const message = entities.DirectMessage.find(item => item.id === messageId);
    if (!message || (message.sender_id !== user.id && user.role !== "admin")) return json(res, 404, { message: "Message introuvable." });
    entities.DirectMessage = entities.DirectMessage.filter(item => item.id !== messageId);
    result = { removed: true, message_id: messageId };
  } else if (name === "updateProfileCustomization") {
    if (!profile) return json(res, 404, { message: "Profil joueur introuvable." });
    const displayName = String(input.display_name || "").replace(/\s+/g, " ").trim();
    if (displayName.length < 3 || displayName.length > 24) return json(res, 400, { message: "Le pseudo doit contenir entre 3 et 24 caractères." });
    if (db.users.some(candidate => candidate.id !== user.id && String(candidate.full_name || "").trim().toLocaleLowerCase("fr") === displayName.toLocaleLowerCase("fr"))) return json(res, 409, { message: "Ce pseudo est déjà utilisé." });
    const cleanImage = (value, current) => {
      if (!value) return null;
      const url = String(value).slice(0, 2048);
      if (/^\/api\/uploads\/[a-f0-9]{24}$/i.test(url) || url === current) return url;
      return null;
    };
    const allowedThemes = new Set(["midnight", "aurora", "crimson", "sakura", "ocean", "gold"]);
    const allowedBanners = new Set(["purple", "blue", "red", "green", "gold", "dark", "sakura", "ocean"]);
    const allowedPresence = new Set(["online", "idle", "dnd", "invisible"]);
    const allowedEffects = new Set(["none", "glow", "sparkles", "pulse"]);
    const allowedLayouts = new Set(["standard", "compact", "showcase"]);
    const allowedVisibility = new Set(["public", "unlisted", "private"]);
    const accent = /^#[0-9a-f]{6}$/i.test(String(input.accent_color || "")) ? String(input.accent_color) : "#8b5cf6";
    const showcaseIds = [...new Set(Array.isArray(input.showcase_card_ids) ? input.showcase_card_ids.map(String) : [])].slice(0, 6);
    const ownedIds = new Set((entities.Card || []).filter(card => card.created_by_id === user.id).map(card => card.id));
    if (showcaseIds.some(cardId => !ownedIds.has(cardId))) return json(res, 403, { message: "Une carte de la vitrine ne t'appartient pas." });
    const ownedCards = (entities.Card || []).filter(card => card.created_by_id === user.id);
    const playerLevel = getLevelFromXp(Number(profile.xp || 0)).level;
    const unlockedBadgeIds = new Set(getUnlockedProfileBadges({ profile, cards: ownedCards, level: playerLevel }).map(badge => badge.id));
    const selectedBadgeIds = [...new Set(Array.isArray(input.selected_badge_ids) ? input.selected_badge_ids.map(String) : [])].filter(badgeId => unlockedBadgeIds.has(badgeId)).slice(0, 5);
    const socialLinks = (Array.isArray(input.social_links) ? input.social_links : []).slice(0, 4).map(link => {
      try {
        const url = new URL(String(link.url || ""));
        if (url.protocol !== "https:") return null;
        return { label: String(link.label || url.hostname).replace(/\s+/g, " ").trim().slice(0, 24), url: url.toString().slice(0, 300) };
      } catch { return null; }
    }).filter(Boolean);
    const avatarUrl = cleanImage(input.avatar_url, profile.avatar_url || user.avatar_url || null);
    const bannerUrl = cleanImage(input.banner_url, profile.banner_url || null);
    Object.assign(profile, {
      display_name: displayName, avatar_url: avatarUrl, banner_url: bannerUrl,
      banner_id: allowedBanners.has(input.banner_id) ? input.banner_id : "purple",
      profile_theme: allowedThemes.has(input.profile_theme) ? input.profile_theme : "midnight",
      accent_color: accent, profile_effect: allowedEffects.has(input.profile_effect) ? input.profile_effect : "none",
      profile_layout: allowedLayouts.has(input.profile_layout) ? input.profile_layout : "standard",
      bio: String(input.bio || "").trim().slice(0, 190), pronouns: String(input.pronouns || "").trim().slice(0, 30),
      status_text: String(input.status_text || "").trim().slice(0, 80), status_emoji: String(input.status_emoji || "").trim().slice(0, 8),
      presence_style: allowedPresence.has(input.presence_style) ? input.presence_style : "online",
      favorite_anime: String(input.favorite_anime || "").trim().slice(0, 40), location: String(input.location || "").trim().slice(0, 40),
      social_links: socialLinks, showcase_card_ids: showcaseIds, selected_badge_ids: selectedBadgeIds,
      profile_visibility: allowedVisibility.has(input.profile_visibility) ? input.profile_visibility : "public",
      show_stats: input.show_stats !== false, show_badges: input.show_badges !== false, show_activity: input.show_activity === true,
      updated_date: new Date().toISOString(),
    });
    user.full_name = displayName; user.avatar_url = avatarUrl; user.updated_date = profile.updated_date;
    result = { profile, user: publicUser(user) };
  } else if (name === "getPublicProfile") {
    const targetUserId = String(input.user_id || user.id);
    const targetProfile = (entities.PlayerProfile || []).find(item => item.created_by_id === targetUserId);
    const targetUser = db.users.find(item => item.id === targetUserId);
    if (!targetProfile || !targetUser) return json(res, 404, { message: "Profil introuvable." });
    const isOwner = targetUserId === user.id || user.role === "admin";
    if (targetProfile.profile_visibility === "private" && !isOwner) return json(res, 403, { message: "Ce profil est privé." });
    const ownedCards = (entities.Card || []).filter(card => card.created_by_id === targetUserId);
    const ownedById = new Map(ownedCards.map(card => [card.id, card]));
    const showcase = (targetProfile.showcase_card_ids || []).map(cardId => ownedById.get(cardId)).filter(Boolean).map(card => resolvedCard(db, card));
    const badgeCatalog = getUnlockedProfileBadges({ profile: targetProfile, cards: ownedCards, level: getLevelFromXp(Number(targetProfile.xp || 0)).level });
    const badgesById = new Map(badgeCatalog.map(badge => [badge.id, badge]));
    const badges = (targetProfile.selected_badge_ids || []).map(badgeId => badgesById.get(badgeId)).filter(Boolean).map(({ check, ...badge }) => badge);
    const publicFields = ["display_name", "avatar_url", "banner_url", "banner_id", "profile_theme", "accent_color", "profile_effect", "profile_layout", "bio", "pronouns", "status_text", "status_emoji", "presence_style", "favorite_anime", "location", "social_links", "equipped_title_id", "created_date", "show_stats", "show_badges", "show_activity", "pve_wins", "pve_max_stage", "boosters_opened", "xp"];
    const safeProfile = Object.fromEntries(publicFields.map(field => [field, targetProfile[field]]));
    const activity = targetProfile.show_activity === true ? [
      ...(entities.PveBattle || []).filter(row => row.created_by_id === targetUserId).map(row => ({ type: "pve", label: `${row.victory ? "Victoire" : "Défaite"} contre ${row.boss_name}`, created_date: row.created_date })),
      ...(entities.Transaction || []).filter(row => row.created_by_id === targetUserId).map(row => ({ type: row.type, label: String(row.description || row.type || "Activité").slice(0, 100), created_date: row.created_date })),
    ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5) : [];
    const relation = (entities.Friendship || []).find(row => [row.requester_id, row.recipient_id].includes(user.id) && [row.requester_id, row.recipient_id].includes(targetUserId));
    const friendship = !relation ? { status: "none" } : relation.status === "accepted" ? { id: relation.id, status: "friend" } : relation.status === "blocked" ? { id: relation.id, status: "blocked" } : { id: relation.id, status: relation.requester_id === user.id ? "outgoing" : "incoming" };
    result = { user_id: targetUserId, profile: safeProfile, showcase, badges, activity, friendship, is_owner: targetUserId === user.id, collection_size: ownedCards.length };
  } else if (name === "getTitleCatalog") {
    if (!profile) return json(res, 404, { message: "Profil joueur introuvable." });
    result = (entities.TitleDefinition || [])
      .filter(title => title.is_active !== false)
      .map(title => customTitleState(entities, profile, user.id, title))
      .sort((a, b) => Number(a.required) - Number(b.required) || String(a.label).localeCompare(String(b.label), "fr"));
  } else if (name === "equipTitle") {
    if (!profile) return json(res, 404, { message: "Profil joueur introuvable." });
    const titleId = String(input.title_id || "rookie");
    let label = "Nouveau Collectionneur";
    let unlocked = titleId === "rookie";
    if (titleId.startsWith("achievement_")) {
      const requirement = TITLE_REQUIREMENTS[titleId.slice(12)];
      if (requirement) unlocked = titleProgress(entities, profile, user.id, requirement[0]) >= requirement[1];
    } else if (titleId.startsWith("custom_")) {
      const definition = (entities.TitleDefinition || []).find(title => `custom_${title.id}` === titleId && title.is_active !== false);
      if (definition) {
        const state = customTitleState(entities, profile, user.id, definition);
        unlocked = state.unlocked;
        label = definition.label;
      }
    }
    if (!unlocked) return json(res, 403, { message: "Ce titre n'est pas encore débloqué." });
    profile.equipped_title_id = titleId;
    profile.updated_date = new Date().toISOString();
    result = { title_id: titleId, label };
  } else if (name === "getAdminPlayerControl") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    const target = db.users.find((candidate) => candidate.id === String(input.user_id || ""));
    if (!target) return json(res, 404, { message: "Utilisateur introuvable." });
    const targetProfile = (entities.PlayerProfile || []).find((item) => item.created_by_id === target.id);
    const cards = (entities.Card || []).filter((item) => item.created_by_id === target.id).map((item) => resolvedCard(db, item));
    const ownedFrames = (entities.PlayerFrame || []).filter((item) => item.created_by_id === target.id).map((owned) => ({
      ...owned,
      frame: (entities.CardFrame || []).find((frame) => frame.id === owned.frame_id) || null,
    }));
    const pendingGifts = (entities.PlayerGift || []).filter((item) => item.created_by_id === target.id && item.status !== "claimed" && item.status !== "cancelled").map((gift) => ({
      ...gift,
      card: gift.kind === "card" ? resolvedCard(db, { ...((entities.CardDefinition || []).find((card) => card.id === gift.card_definition_id) || {}), card_definition_id: gift.card_definition_id }) : null,
      frame: gift.kind === "frame" ? (entities.CardFrame || []).find((frame) => frame.id === gift.frame_id) || null : null,
    }));
    result = {
      user: publicUser(target), profile: targetProfile || null, cards, frames: ownedFrames, gifts: pendingGifts,
      stats: { unique_cards: cards.length, total_copies: cards.reduce((sum, card) => sum + Math.max(1, Number(card.duplicates || 1)), 0), frames: ownedFrames.length, gifts: pendingGifts.length },
    };
  } else if (name === "adminGrantPlayerCard" && input.delivery_mode !== "direct") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    const target = db.users.find((candidate) => candidate.id === String(input.user_id || ""));
    const definition = (entities.CardDefinition || []).find((item) => item.id === String(input.card_definition_id || "") && item.is_active !== false);
    if (!target || !definition) return json(res, 404, { message: "Joueur ou carte introuvable." });
    const quantity = Math.max(1, Math.min(100, Math.floor(Number(input.quantity || 1))));
    const now = new Date().toISOString();
    entities.PlayerGift ||= [];
    const gift = {
      id: id(), kind: "card", status: "pending", card_definition_id: definition.id, quantity,
      title: `Carte offerte : ${definition.name}`,
      message: String(input.message || "Un cadeau t'attend dans ton coffre.").slice(0, 180),
      created_by_id: target.id, created_by: target.email, granted_by_id: user.id, granted_by: user.email,
      created_date: now, updated_date: now,
    };
    entities.PlayerGift.push(gift);
    recordAdminAudit(db, user, "player_card_gift_created", target, { card_definition_id: definition.id, card_name: definition.name, quantity });
    result = { gift, card: resolvedCard(db, { ...definition, card_definition_id: definition.id }), quantity };
  } else if (name === "adminGrantPlayerCard") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    const target = db.users.find((candidate) => candidate.id === String(input.user_id || ""));
    const definition = (entities.CardDefinition || []).find((item) => item.id === String(input.card_definition_id || "") && item.is_active !== false);
    if (!target || !definition) return json(res, 404, { message: "Joueur ou carte introuvable." });
    const quantity = Math.max(1, Math.min(100, Math.floor(Number(input.quantity || 1))));
    const now = new Date().toISOString();
    entities.Card ||= [];
    let card = entities.Card.find((candidate) => candidate.created_by_id === target.id && (candidate.card_definition_id === definition.id || (!candidate.card_definition_id && candidate.name === definition.name && candidate.anime === definition.anime && candidate.rarity === definition.rarity)));
    if (card) {
      card.card_definition_id ||= definition.id;
      card.collection_id ||= definition.collection_id || null;
      card.edition ||= definition.edition || "standard";
      card.is_collector = Boolean(card.is_collector || definition.is_collector);
      card.duplicates = Math.max(1, Number(card.duplicates || 1)) + quantity;
      card.upgrade_progress = Number(card.upgrade_progress || 0) + quantity;
      while (Number(card.level || 1) < 100 && card.upgrade_progress >= getDuplicatesForUpgrade(Number(card.level || 1))) {
        card.upgrade_progress -= getDuplicatesForUpgrade(Number(card.level || 1));
        card.level = Number(card.level || 1) + 1;
        card.power = Number(card.power || definition.basePower || 1) + 3;
        card.attack = Number(card.attack || definition.baseAttack || 1) + 2;
        card.defense = Number(card.defense || definition.baseDefense || 1) + 2;
        card.speed = Number(card.speed || definition.baseSpeed || 1) + 1;
      }
      card.updated_date = now;
    } else {
      card = {
        id: id(), card_definition_id: definition.id, name: definition.name, anime: definition.anime, rarity: definition.rarity,
        power: definition.basePower, attack: definition.baseAttack, defense: definition.baseDefense, speed: definition.baseSpeed,
        image_url: definition.image_url || null, collection_id: definition.collection_id || null, edition: definition.edition || "standard",
        is_collector: Boolean(definition.is_collector), level: 1, duplicates: quantity, upgrade_progress: Math.max(0, quantity - 1), is_favorite: false,
        obtained_via: "admin_gift", created_by_id: target.id, created_by: target.email, created_date: now, updated_date: now,
      };
      entities.Card.push(card);
    }
    entities.Transaction ||= [];
    entities.Transaction.push({ id: id(), type: "admin_gift", description: `Cadeau admin : ${definition.name} ×${quantity}`, amount: 0, card_name: definition.name, created_by_id: target.id, created_by: target.email, created_date: now });
    recordAdminAudit(db, user, "player_card_granted", target, { card_definition_id: definition.id, card_name: definition.name, quantity });
    result = { card: resolvedCard(db, card), quantity };
  } else if (name === "adminDeleteCardDefinitions") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    const definitionIds = [...new Set(Array.isArray(input.card_definition_ids) ? input.card_definition_ids.map(String) : [])].filter(Boolean).slice(0, 20);
    if (!definitionIds.length) return json(res, 400, { message: "Aucune carte à supprimer." });
    const definitionIdSet = new Set(definitionIds);
    const definitions = (entities.CardDefinition || []).filter((definition) => definitionIdSet.has(definition.id));
    if (!definitions.length) return json(res, 404, { message: "Carte introuvable." });
    const definitionById = new Map(definitions.map((definition) => [definition.id, definition]));
    let preservedOwnedCards = 0;
    for (const owned of entities.Card || []) {
      const definition = definitionById.get(owned.card_definition_id);
      if (!definition) continue;
      owned.name ||= definition.name;
      owned.anime ||= definition.anime;
      owned.rarity ||= definition.rarity;
      owned.image_url ||= definition.image_url || null;
      owned.power ||= definition.basePower || definition.power || 1;
      owned.attack ||= definition.baseAttack || definition.attack || 1;
      owned.defense ||= definition.baseDefense || definition.defense || 1;
      owned.speed ||= definition.baseSpeed || definition.speed || 1;
      owned.card_definition_id = null;
      owned.collection_id = null;
      owned.edition = "legacy";
      owned.updated_date = new Date().toISOString();
      preservedOwnedCards += 1;
    }
    const removedOverrides = (entities.CardImageOverride || []).filter((override) => definitionIdSet.has(override.card_id)).length;
    entities.CardImageOverride = (entities.CardImageOverride || []).filter((override) => !definitionIdSet.has(override.card_id));
    let cancelledGifts = 0;
    for (const gift of entities.PlayerGift || []) {
      if (!definitionIdSet.has(gift.card_definition_id) || ["claimed", "cancelled"].includes(gift.status)) continue;
      gift.status = "cancelled";
      gift.cancelled_reason = "Carte retirée du catalogue par un administrateur.";
      gift.updated_date = new Date().toISOString();
      cancelledGifts += 1;
    }
    const removedListings = (entities.LimitedCardListing || []).filter((listing) => definitionIdSet.has(listing.card_definition_id)).length;
    entities.LimitedCardListing = (entities.LimitedCardListing || []).filter((listing) => !definitionIdSet.has(listing.card_definition_id));
    entities.CardDefinition = (entities.CardDefinition || []).filter((definition) => !definitionIdSet.has(definition.id));
    recordAdminAudit(db, user, "card_definitions_deleted", null, {
      removed_total: definitions.length,
      definition_ids: definitions.map((definition) => definition.id),
      cards: definitions.map((definition) => `${definition.name} · ${definition.rarity}`),
      preserved_owned_cards: preservedOwnedCards,
      removed_overrides: removedOverrides,
      cancelled_gifts: cancelledGifts,
      removed_listings: removedListings,
    });
    result = { removed: definitions.length, preserved_owned_cards: preservedOwnedCards, cancelled_gifts: cancelledGifts, removed_listings: removedListings };
  } else if (name === "adminRevokePlayerCard") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    const target = db.users.find((candidate) => candidate.id === String(input.user_id || ""));
    const card = (entities.Card || []).find((item) => item.id === String(input.card_id || "") && item.created_by_id === target?.id);
    if (!target || !card) return json(res, 404, { message: "Joueur ou carte introuvable." });
    entities.Card = entities.Card.filter((item) => item.id !== card.id);
    for (const playerFrame of entities.PlayerFrame || []) if (playerFrame.card_id === card.id) playerFrame.card_id = null;
    recordAdminAudit(db, user, "player_card_revoked", target, { card_id: card.id, card_name: card.name });
    result = { removed: true };
  } else if (name === "adminGrantPlayerFrame" && input.delivery_mode !== "direct") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    const target = db.users.find((candidate) => candidate.id === String(input.user_id || ""));
    const frame = (entities.CardFrame || []).find((item) => item.id === String(input.frame_id || "") && item.is_active !== false);
    if (!target || !frame) return json(res, 404, { message: "Joueur ou cadre introuvable." });
    const now = new Date().toISOString();
    entities.PlayerGift ||= [];
    const gift = {
      id: id(), kind: "frame", status: "pending", frame_id: frame.id, quantity: 1,
      title: `Cadre offert : ${frame.name}`,
      message: String(input.message || "Un cadre t'attend dans ton coffre.").slice(0, 180),
      created_by_id: target.id, created_by: target.email, granted_by_id: user.id, granted_by: user.email,
      created_date: now, updated_date: now,
    };
    entities.PlayerGift.push(gift);
    recordAdminAudit(db, user, "player_frame_gift_created", target, { frame_id: frame.id, frame_name: frame.name });
    result = { gift, frame };
  } else if (name === "adminGrantPlayerFrame") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    const target = db.users.find((candidate) => candidate.id === String(input.user_id || ""));
    const frame = (entities.CardFrame || []).find((item) => item.id === String(input.frame_id || "") && item.is_active !== false);
    if (!target || !frame) return json(res, 404, { message: "Joueur ou cadre introuvable." });
    entities.PlayerFrame ||= [];
    const existing = entities.PlayerFrame.find((item) => item.created_by_id === target.id && item.frame_id === frame.id);
    if (existing) return json(res, 409, { message: "Ce joueur possède déjà ce cadre." });
    const now = new Date().toISOString();
    const owned = { id: id(), frame_id: frame.id, is_unlocked: true, card_id: null, unlocked_date: now, obtained_via: "admin_gift", created_by_id: target.id, created_by: target.email, created_date: now, updated_date: now };
    entities.PlayerFrame.push(owned);
    recordAdminAudit(db, user, "player_frame_granted", target, { frame_id: frame.id, frame_name: frame.name });
    result = { owned, frame };
  } else if (name === "adminRevokePlayerFrame") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    const target = db.users.find((candidate) => candidate.id === String(input.user_id || ""));
    const owned = (entities.PlayerFrame || []).find((item) => item.id === String(input.player_frame_id || "") && item.created_by_id === target?.id);
    if (!target || !owned) return json(res, 404, { message: "Joueur ou cadre possédé introuvable." });
    entities.PlayerFrame = entities.PlayerFrame.filter((item) => item.id !== owned.id);
    for (const card of entities.Card || []) if (card.created_by_id === target.id && card.applied_frame_id === owned.frame_id) card.applied_frame_id = null;
    recordAdminAudit(db, user, "player_frame_revoked", target, { frame_id: owned.frame_id });
    result = { removed: true };
  } else if (name === "adminRepairPlayerInventory") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    const target = db.users.find((candidate) => candidate.id === String(input.user_id || ""));
    if (!target) return json(res, 404, { message: "Utilisateur introuvable." });
    let repairedCards = 0;
    let repairedFrames = 0;
    let repairedGifts = 0;
    let createdProfile = false;
    if (!(entities.PlayerProfile || []).some((item) => item.created_by_id === target.id)) {
      seedProfile(db, target);
      createdProfile = true;
    }
    for (const card of entities.Card || []) {
      if (!rowBelongsToUser(card, target)) continue;
      const normalized = normalizeOwnedCard(db, card, target);
      if (normalized.changed) repairedCards += 1;
    }
    for (const owned of entities.PlayerFrame || []) {
      if (!rowBelongsToUser(owned, target)) continue;
      let changed = false;
      if (owned.created_by_id !== target.id) { owned.created_by_id = target.id; changed = true; }
      if (owned.created_by !== target.email) { owned.created_by = target.email; changed = true; }
      if (owned.is_unlocked !== true) { owned.is_unlocked = true; changed = true; }
      if (changed) { owned.updated_date = new Date().toISOString(); repairedFrames += 1; }
    }
    for (const gift of entities.PlayerGift || []) {
      if (!rowBelongsToUser(gift, target)) continue;
      let changed = false;
      if (gift.created_by_id !== target.id) { gift.created_by_id = target.id; changed = true; }
      if (gift.created_by !== target.email) { gift.created_by = target.email; changed = true; }
      if (!gift.status) { gift.status = "pending"; changed = true; }
      if (changed) { gift.updated_date = new Date().toISOString(); repairedGifts += 1; }
    }
    const cards = (entities.Card || []).filter((item) => item.created_by_id === target.id).map((item) => resolvedCard(db, item));
    const frames = (entities.PlayerFrame || []).filter((item) => item.created_by_id === target.id);
    const gifts = (entities.PlayerGift || []).filter((item) => item.created_by_id === target.id && item.status !== "claimed" && item.status !== "cancelled");
    recordAdminAudit(db, user, "player_inventory_repaired", target, { repairedCards, repairedFrames, repairedGifts, createdProfile });
    result = { repairedCards, repairedFrames, repairedGifts, createdProfile, cards: cards.length, frames: frames.length, gifts: gifts.length };
  } else if (name === "getAdminCollections") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    let normalizedAnimeNames = 0;
    for (const row of [...(entities.AnimeCollection || []), ...(entities.CardDefinition || [])]) {
      if (!row.anime) continue;
      const canonical = canonicalAnimeName(row.anime);
      if (canonical !== row.anime) { row.anime = canonical; row.updated_date = new Date().toISOString(); normalizedAnimeNames += 1; }
    }
    const merged = repairDuplicateCollections(db);
    let attachedCards = 0;
    for (const definition of entities.CardDefinition || []) {
      if (definition.collection_id || !definition.anime || definition.is_collector) continue;
      const candidates = (entities.AnimeCollection || []).filter((collection) => collection.is_limited !== true && collection.collector_only !== true && String(collection.anime || "").toLocaleLowerCase("fr") === String(definition.anime).toLocaleLowerCase("fr"));
      if (candidates.length === 1) { definition.collection_id = candidates[0].id; attachedCards += 1; }
    }
    if (merged.length) recordAdminAudit(db, user, "duplicate_collections_merged", null, { merged });
    result = { collections: [...(entities.AnimeCollection || [])].sort((a, b) => String(a.name).localeCompare(String(b.name), "fr")), merged, attached_cards: attachedCards, normalized_anime_names: normalizedAnimeNames };
  } else if (name === "adminAddCollectionCharacter") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    const collection = (entities.AnimeCollection || []).find((item) => item.id === input.collection_id);
    if (!collection) return json(res, 404, { message: "Collection introuvable." });
    const characterName = String(input.name || "").replace(/\s+/g, " ").trim();
    if (characterName.length < 2 || characterName.length > 60) return json(res, 400, { message: "Le nom doit contenir entre 2 et 60 caractères." });
    const anime = canonicalAnimeName(collection.anime || input.anime);
    if (!anime) return json(res, 400, { message: "La collection doit avoir une série anime." });
    const isCollector = Boolean(input.is_collector);
    const exists = (entities.CardDefinition || []).some((card) => card.collection_id === collection.id && String(card.name).toLocaleLowerCase("fr") === characterName.toLocaleLowerCase("fr") && Boolean(card.is_collector) === isCollector);
    if (exists) return json(res, 409, { message: "Ce personnage possède déjà ses versions dans cette collection." });
    const templates = {
      normale: { power: 45, attack: 42, defense: 40, speed: 44 },
      legendaire: { power: 92, attack: 90, defense: 84, speed: 90 },
      "secrète": { power: 108, attack: 106, defense: 97, speed: 105 },
      manga_god: { power: 121, attack: 118, defense: 105, speed: 115 },
    };
    const now = new Date().toISOString();
    const created = Object.entries(templates).map(([rarity, stats]) => ({
      id: id(), name: characterName, anime, rarity, collection_id: collection.id,
      edition: isCollector ? "collector" : "standard", edition_label: isCollector ? String(input.edition_label || "Édition Collector").slice(0, 80) : "Standard",
      is_collector: isCollector, is_active: true, image_url: null,
      basePower: stats.power, baseAttack: stats.attack, baseDefense: stats.defense, baseSpeed: stats.speed,
      created_by_id: user.id, created_by: user.email, created_date: now, updated_date: now,
    }));
    entities.CardDefinition ||= [];
    entities.CardDefinition.push(...created);
    recordAdminAudit(db, user, "collection_character_added", null, { collection_id: collection.id, collection_name: collection.name, character: characterName, collector: isCollector });
    result = { collection, cards: created };
  } else if (name === "getAdminFrames") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    ensureBaseFrameCatalog(entities);
    result = [...(entities.CardFrame || [])].sort((a, b) => Number(b.is_endgame) - Number(a.is_endgame) || String(a.name).localeCompare(String(b.name), "fr"));
  } else if (name === "getAdminBackups") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    result = await listDatabaseBackups();
  } else if (name === "createAdminBackup") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    result = await createDatabaseBackup(db, { reason: "manual", actor: user });
    recordAdminAudit(db, user, "backup_created", null, { backup_id: result.id, bytes: result.bytes });
  } else if (name === "restoreAdminBackup") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    if (input.confirmation !== "RESTAURER") return json(res, 400, { message: "Confirmation de restauration invalide." });
    const remote = await mongoDb();
    if (!remote || !ObjectId.isValid(input.backup_id)) return json(res, 404, { message: "Sauvegarde introuvable." });
    const backup = await remote.collection("admin_backups").findOne({ _id: new ObjectId(input.backup_id) });
    if (!backup?.payload) return json(res, 404, { message: "Sauvegarde introuvable." });
    await createDatabaseBackup(db, { reason: "before_restore", actor: user });
    const restored = JSON.parse(gunzipSync(Buffer.from(backup.payload.buffer || backup.payload)).toString("utf8"));
    const activeSessions = db.sessions;
    Object.assign(db, emptyDb(), restored, { sessions: activeSessions, resetTokens: [], oauthStates: [] });
    recordAdminAudit(db, user, "backup_restored", null, { backup_id: input.backup_id, backup_created_at: backup.created_at });
    result = { success: true, backup_id: input.backup_id, users_count: db.users.length, cards_count: (db.entities.Card || []).length };
  } else if (name === "reportChatMessage") {
    const message = (entities.ChatMessage || []).find((item) => item.id === input.message_id);
    if (!message) return json(res, 404, { message: "Message introuvable." });
    if (message.created_by_id === user.id) return json(res, 400, { message: "Tu ne peux pas signaler ton propre message." });
    entities.ChatReport ||= [];
    if (entities.ChatReport.some((item) => item.message_id === message.id && item.reporter_id === user.id && item.status === "pending")) return json(res, 409, { message: "Ce message est déjà signalé." });
    const report = { id: id(), message_id: message.id, message_text: message.message, reported_user_id: message.created_by_id, reported_user_name: message.display_name, reporter_id: user.id, reason: String(input.reason || "contenu_inapproprie").slice(0, 80), status: "pending", created_by_id: user.id, created_by: user.email, created_date: new Date().toISOString() };
    entities.ChatReport.push(report); result = report;
  } else if (name === "adminModerateUser") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    const target = db.users.find((candidate) => candidate.id === input.user_id);
    if (!target || target.id === user.id) return json(res, 400, { message: "Ce compte ne peut pas être modéré ici." });
    const minutes = Math.max(0, Math.min(43_200, Math.floor(Number(input.minutes || 0))));
    if (input.action === "unmute") { target.chat_muted_until = null; target.chat_mute_reason = null; }
    else if (input.action === "mute" && minutes > 0) { target.chat_muted_until = new Date(Date.now() + minutes * 60_000).toISOString(); target.chat_mute_reason = String(input.reason || "Modération du chat").slice(0, 200); }
    else return json(res, 400, { message: "Action de modération invalide." });
    target.updated_date = new Date().toISOString();
    recordAdminAudit(db, user, input.action === "mute" ? "user_muted" : "user_unmuted", target, { minutes, reason: target.chat_mute_reason });
    result = publicUser(target);
  } else if (name === "resolveChatReport") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    const report = (entities.ChatReport || []).find((item) => item.id === input.report_id);
    if (!report) return json(res, 404, { message: "Signalement introuvable." });
    report.status = input.status === "dismissed" ? "dismissed" : "resolved";
    report.resolved_by = user.id; report.resolved_at = new Date().toISOString();
    recordAdminAudit(db, user, "chat_report_resolved", db.users.find((candidate) => candidate.id === report.reported_user_id), { report_id: report.id, status: report.status });
    result = report;
  } else if (name === "getAdminPlayerActivity") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    const target = db.users.find((candidate) => candidate.id === input.user_id);
    if (!target) return json(res, 404, { message: "Utilisateur introuvable." });
    const activity = [
      ...(entities.Transaction || []).filter((item) => item.created_by_id === target.id).map((item) => ({ id: item.id, type: "transaction", label: item.description || item.type || "Transaction", amount: item.amount, created_date: item.created_date })),
      ...(entities.ChatMessage || []).filter((item) => item.created_by_id === target.id).map((item) => ({ id: item.id, type: "chat", label: item.message, created_date: item.created_date })),
      ...(entities.PveBattle || []).filter((item) => item.created_by_id === target.id).map((item) => ({ id: item.id, type: "pve", label: `${item.victory ? "Victoire" : "Défaite"} contre ${item.boss_name}`, created_date: item.created_date })),
      ...(entities.Auction || []).filter((item) => item.seller_id === target.id || item.highest_bidder_id === target.id).map((item) => ({ id: item.id, type: "auction", label: `Enchère ${item.card_name} · ${item.status}`, amount: item.current_bid, created_date: item.updated_date || item.created_date })),
      ...(entities.MarketListing || []).filter((item) => item.seller_id === target.id || item.buyer_id === target.id).map((item) => ({ id: item.id, type: "market", label: `Marché ${item.card_name} · ${item.status}`, amount: item.price, created_date: item.updated_date || item.created_date })),
      ...(entities.AdminAudit || []).filter((item) => item.target_user_id === target.id).map((item) => ({ id: item.id, type: "admin", label: item.action, created_date: item.created_date })),
    ].filter((item) => item.created_date).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 200);
    result = { user: publicUser(target), activity };
  } else if (name === "getAdminSecurityOverview") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const pendingReports = (entities.ChatReport || []).filter((item) => item.status === "pending");
    const players = db.users.map((candidate) => {
      const playerProfile = (entities.PlayerProfile || []).find((item) => item.created_by_id === candidate.id);
      const transactions = (entities.Transaction || []).filter((item) => item.created_by_id === candidate.id && new Date(item.created_date).getTime() >= since);
      const messages = (entities.ChatMessage || []).filter((item) => item.created_by_id === candidate.id && new Date(item.created_date).getTime() >= since);
      const flags = [];
      if (!playerProfile) flags.push("Profil manquant");
      if (Number(playerProfile?.coins || 0) < 0 || Number(playerProfile?.gems || 0) < 0) flags.push("Solde négatif");
      if (Number(playerProfile?.coins || 0) > 10_000_000) flags.push("Solde de pièces très élevé");
      if (Number(playerProfile?.gems || 0) > 10_000) flags.push("Solde de gemmes très élevé");
      if (transactions.length > 200) flags.push("Volume de transactions inhabituel");
      if (messages.length > 150) flags.push("Activité chat très élevée");
      const reports = pendingReports.filter((item) => item.reported_user_id === candidate.id).length;
      if (reports >= 3) flags.push(`${reports} signalements en attente`);
      return { id: candidate.id, email: candidate.email, name: candidate.full_name, role: candidate.role, status: candidate.status || "active", chat_muted_until: candidate.chat_muted_until || null, coins: Number(playerProfile?.coins || 0), gems: Number(playerProfile?.gems || 0), cards: (entities.Card || []).filter((item) => item.created_by_id === candidate.id).length, transactions_24h: transactions.length, messages_24h: messages.length, reports, flags, risk: flags.length >= 2 ? "high" : flags.length ? "medium" : "low" };
    }).sort((a, b) => b.flags.length - a.flags.length || b.transactions_24h - a.transactions_24h);
    result = { players, pending_reports: pendingReports.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 100) };
  } else if (name === "adminCleanupOrphanData") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    const validUserIds = new Set(db.users.map((candidate) => candidate.id));
    const validEmails = new Set(db.users.map((candidate) => candidate.email));
    const playerEntities = new Set(["PlayerProfile", "Card", "PlayerFrame", "PlayerTalent", "Quest", "Transaction", "PveBattle", "Friendship", "DirectMessage", "UserCosmetic", "ProfileCustomization", "MarketListing", "FrameListing", "Auction", "ChatMessage"]);
    const removed = {};
    for (const entityName of playerEntities) {
      const rows = entities[entityName] || [];
      const kept = rows.filter((row) => {
        if (row.created_by_id && !validUserIds.has(row.created_by_id)) return false;
        if (!row.created_by_id && row.created_by && !validEmails.has(row.created_by)) return false;
        if (row.seller_id && row.seller_id !== "system" && !validUserIds.has(row.seller_id)) return false;
        if (row.requester_id && !validUserIds.has(row.requester_id)) return false;
        if (row.recipient_id && !validUserIds.has(row.recipient_id)) return false;
        return true;
      });
      removed[entityName] = rows.length - kept.length;
      entities[entityName] = kept;
    }
    const removedTotal = Object.values(removed).reduce((sum, count) => sum + count, 0);
    recordAdminAudit(db, user, "orphan_cleanup", null, { removed_total: removedTotal, removed_by_entity: removed });
    result = { success: true, removed_total: removedTotal, removed };
  } else if (name === "adminResetPlayer") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    const target = db.users.find((candidate) => candidate.id === input.user_id);
    if (!target) return json(res, 404, { message: "Utilisateur introuvable." });
    if (target.id === user.id) return json(res, 400, { message: "Utilise un compte joueur distinct pour tester une réinitialisation." });
    const targetProfile = (entities.PlayerProfile || []).find((item) => item.created_by_id === target.id);
    if (!targetProfile) return json(res, 404, { message: "Profil joueur introuvable." });
    const playerEntities = new Set(["Card", "PlayerFrame", "PlayerTalent", "Quest", "Transaction", "PveBattle", "DirectMessage", "UserCosmetic", "ProfileCustomization", "MarketListing", "FrameListing", "Auction", "ChatMessage"]);
    const removed = {};
    for (const entityName of playerEntities) {
      const rows = entities[entityName] || [];
      if (entityName === "Auction") {
        for (const auction of rows) {
          if (auction.highest_bidder_id === target.id && auction.seller_id !== target.id) {
            auction.highest_bidder_id = null;
            auction.highest_bidder_name = null;
            auction.current_bid = Number(auction.starting_price || 1);
          }
        }
      }
      const kept = rows.filter((row) => ![row.created_by_id, row.user_id, row.owner_id, row.seller_id].includes(target.id) && row.created_by !== target.email);
      removed[entityName] = rows.length - kept.length;
      entities[entityName] = kept;
    }
    Object.assign(targetProfile, {
      level: 1, xp: 0, coins: 2500, gems: 100, talent_points: 0, boosters_opened: 0,
      total_cards: 0, boosters_count: {}, pity_counter: 0, claimed_rewards: [],
      pve_wins: 0, pve_losses: 0, pve_max_stage: 1, pve_energy: PVE_MAX_ENERGY,
      pve_cleared_stages: [], pve_deck: [], system_market_purchases: [], updated_date: new Date().toISOString(),
    });
    const removedTotal = Object.values(removed).reduce((sum, count) => sum + count, 0);
    recordAdminAudit(db, user, "player_reset", target, { removed_total: removedTotal, removed_by_entity: removed });
    result = { success: true, removed_total: removedTotal, removed, profile: targetProfile };
  } else if (name === "getSystemMarket") {
    if (!profile) return json(res, 404, { message: "Profil joueur introuvable." });
    const market = getSystemMarketOffers(db);
    const purchases = new Set(Array.isArray(profile.system_market_purchases) ? profile.system_market_purchases : []);
    result = { ...market, offers: market.offers.map((offer) => ({ ...offer, purchased: purchases.has(offer.id) })) };
  } else if (name === "buySystemMarketCard") {
    if (!profile) return json(res, 404, { message: "Profil joueur introuvable." });
    const market = getSystemMarketOffers(db);
    const offer = market.offers.find((candidate) => candidate.id === input.offer_id);
    if (!offer) return json(res, 409, { message: "Cette sélection horaire a changé. Actualise le marché." });
    const purchases = Array.isArray(profile.system_market_purchases) ? profile.system_market_purchases : [];
    if (purchases.includes(offer.id)) return json(res, 409, { message: "Tu as déjà acheté cette offre pendant cette rotation." });
    if (Number(profile.coins || 0) < offer.price) return json(res, 400, { message: "Pièces insuffisantes." });
    const definition = (entities.CardDefinition || []).find((card) => card.id === offer.card_definition_id && card.is_active !== false);
    if (!definition) return json(res, 409, { message: "Cette carte n’est plus disponible." });
    const now = new Date().toISOString();
    entities.Card ||= [];
    let card = entities.Card.find((candidate) => candidate.created_by_id === user.id && candidate.card_definition_id === definition.id);
    if (card) {
      card.duplicates = Number(card.duplicates || 1) + 1;
      card.upgrade_progress = Number(card.upgrade_progress || 0) + 1;
      while (Number(card.level || 1) < 100 && card.upgrade_progress >= getDuplicatesForUpgrade(Number(card.level || 1))) {
        card.upgrade_progress -= getDuplicatesForUpgrade(Number(card.level || 1));
        card.level = Number(card.level || 1) + 1;
        card.power = Number(card.power || 0) + 3;
        card.attack = Number(card.attack || 0) + 2;
        card.defense = Number(card.defense || 0) + 2;
        card.speed = Number(card.speed || 0) + 1;
      }
      card.updated_date = now;
    } else {
      card = {
        id: id(), card_definition_id: definition.id, name: definition.name, anime: definition.anime, rarity: definition.rarity,
        power: definition.basePower, attack: definition.baseAttack, defense: definition.baseDefense, speed: definition.baseSpeed,
        image_url: definition.image_url || null, collection_id: definition.collection_id || null, edition: definition.edition || "standard",
        is_collector: Boolean(definition.is_collector), level: 1, duplicates: 1, upgrade_progress: 0, is_favorite: false,
        created_by_id: user.id, created_by: user.email, created_date: now, updated_date: now,
      };
      entities.Card.push(card);
    }
    profile.coins = Number(profile.coins || 0) - offer.price;
    profile.system_market_purchases = [...purchases.slice(-95), offer.id];
    profile.updated_date = now;
    entities.Transaction ||= [];
    entities.Transaction.push({ id: id(), type: "system_market", description: `Boutique horaire : ${offer.card_name}`, amount: -offer.price, card_name: offer.card_name, card_rarity: offer.card_rarity, created_by_id: user.id, created_by: user.email, created_date: now });
    result = { offer: { ...offer, purchased: true }, card: resolvedCard(db, card), coins: profile.coins };
  } else if (name === "getPveState") {
    if (!profile) return json(res, 404, { message: "Profil joueur introuvable." });
    const energy = refreshPveEnergy(profile);
    const deckIds = Array.isArray(profile.pve_deck_ids) ? profile.pve_deck_ids : [];
    const deck = deckIds.map((cardId) => (entities.Card || []).find((card) => card.id === cardId && card.created_by_id === user.id)).filter(Boolean).map((card) => resolvedCard(db, card));
    result = {
      ...energy,
      deck,
      maxStage: Math.max(1, Number(profile.pve_max_stage || 1)),
      clearedStages: Array.isArray(profile.pve_cleared_stages) ? profile.pve_cleared_stages : [],
      wins: Number(profile.pve_wins || 0),
      losses: Number(profile.pve_losses || 0),
      stars: profile.pve_stage_stars || {},
      dailyWins: profile.pve_daily_key === new Date().toISOString().slice(0, 10) ? (profile.pve_daily_wins || {}) : {},
      dailyReplayLimit: PVE_DAILY_REPLAY_LIMIT,
      lossStreak: Number(profile.pve_loss_streak || 0),
    };
  } else if (name === "setPveDeck") {
    if (!profile) return json(res, 404, { message: "Profil joueur introuvable." });
    const cardIds = [...new Set(Array.isArray(input.card_ids) ? input.card_ids : [])];
    if (cardIds.length < 1 || cardIds.length > 5) return json(res, 400, { message: "Ton équipe doit contenir entre 1 et 5 cartes." });
    const ownedCards = cardIds.map((cardId) => (entities.Card || []).find((card) => card.id === cardId && card.created_by_id === user.id));
    if (ownedCards.some((card) => !card)) return json(res, 403, { message: "Une carte sélectionnée ne t’appartient pas." });
    profile.pve_deck_ids = cardIds;
    profile.updated_date = new Date().toISOString();
    result = { deck: ownedCards.map((card) => resolvedCard(db, card)) };
  } else if (name === "fightPveBoss") {
    if (!profile) return json(res, 404, { message: "Profil joueur introuvable." });
    const boss = PVE_BOSSES.find((candidate) => candidate.id === input.boss_id);
    if (!boss) return json(res, 404, { message: "Boss introuvable." });
    const maxStage = Math.max(1, Number(profile.pve_max_stage || 1));
    if (boss.stage > maxStage) return json(res, 403, { message: "Ce palier n’est pas encore débloqué." });
    const energyState = refreshPveEnergy(profile);
    const energyCost = Math.max(1, Number(boss.energyCost || 1));
    if (energyState.energy < energyCost) return json(res, 429, { message: `Il faut ${energyCost} énergies. Une énergie revient toutes les 20 minutes.` });
    const deckIds = Array.isArray(profile.pve_deck_ids) ? profile.pve_deck_ids : [];
    const deck = deckIds.map((cardId) => (entities.Card || []).find((card) => card.id === cardId && card.created_by_id === user.id)).filter(Boolean);
    if (!deck.length) return json(res, 400, { message: "Compose d’abord ton équipe PvE." });
    const dayKey = new Date().toISOString().slice(0, 10);
    if (profile.pve_daily_key !== dayKey) { profile.pve_daily_key = dayKey; profile.pve_daily_wins = {}; }
    const clearedStages = Array.isArray(profile.pve_cleared_stages) ? profile.pve_cleared_stages : [];
    const alreadyCleared = clearedStages.includes(boss.stage);
    const dailyWins = Number(profile.pve_daily_wins?.[boss.id] || 0);
    if (alreadyCleared && dailyWins >= PVE_DAILY_REPLAY_LIMIT) return json(res, 429, { message: `Limite atteinte : ${PVE_DAILY_REPLAY_LIMIT} victoires récompensées par boss et par jour.` });
    profile.pve_energy = energyState.energy - energyCost;
    const levelMultiplier = (card) => 1 + (Math.min(100, Number(card.level || 1)) - 1) * 0.012;
    const teamAttack = deck.reduce((sum, card) => sum + Number(card.attack || 0) * levelMultiplier(card), 0);
    const teamDefense = deck.reduce((sum, card) => sum + Number(card.defense || 0) * levelMultiplier(card), 0);
    const teamSpeed = deck.reduce((sum, card) => sum + Number(card.speed || 0) * levelMultiplier(card), 0);
    const teamPower = deck.reduce((sum, card) => sum + Number(card.power || 0) * levelMultiplier(card), 0);
    const animeCounts = deck.reduce((counts, card) => ({ ...counts, [card.anime]: Number(counts[card.anime] || 0) + 1 }), {});
    const sameAnimeCount = Math.max(0, ...Object.values(animeCounts));
    const uniqueAnimeCount = Object.keys(animeCounts).length;
    const fullTeamBonus = deck.length === 5 ? 0.08 : 0;
    const formationBonus = sameAnimeCount >= 3 ? 0.06 : 0;
    const diversityBonus = uniqueAnimeCount >= 4 ? 0.05 : 0;
    const weaknessBonus = boss.weaknessAnime && Number(animeCounts[boss.weaknessAnime] || 0) >= 2 ? 0.08 : 0;
    const assistBonus = Math.min(0.20, Number(profile.pve_loss_streak || 0) * 0.05);
    const attackMultiplier = 1 + fullTeamBonus + formationBonus + weaknessBonus + assistBonus;
    const speedMultiplier = 1 + diversityBonus;
    let playerHp = Math.round((500 + teamDefense * 6) * (1 + fullTeamBonus));
    let bossHp = boss.hp;
    const playerMaxHp = playerHp;
    const rounds = [];
    const randomFactor = () => 0.9 + crypto.randomInt(0, 201) / 1000;
    for (let round = 1; round <= 20 && playerHp > 0 && bossHp > 0; round++) {
      const effectiveSpeed = teamSpeed * speedMultiplier;
      const critChance = Math.min(0.30, 0.05 + effectiveSpeed / Math.max(1, effectiveSpeed + boss.speed) * 0.18);
      const critical = crypto.randomInt(0, 10_000) / 10_000 < critChance;
      const playerDamage = Math.max(1, Math.round((teamAttack * 0.55 + teamPower * 0.25 - boss.defense * 0.35) * attackMultiplier * randomFactor() * (critical ? 1.65 : 1)));
      const bossDamage = Math.max(1, Math.round((boss.attack * 0.42 - teamDefense * 0.12) * randomFactor()));
      const playerFirst = effectiveSpeed >= boss.speed;
      if (playerFirst) {
        bossHp = Math.max(0, bossHp - playerDamage);
        if (bossHp > 0) playerHp = Math.max(0, playerHp - bossDamage);
      } else {
        playerHp = Math.max(0, playerHp - bossDamage);
        if (playerHp > 0) bossHp = Math.max(0, bossHp - playerDamage);
      }
      rounds.push({ round, playerDamage: playerHp > 0 || playerFirst ? playerDamage : 0, bossDamage: bossHp > 0 || !playerFirst ? bossDamage : 0, critical, playerHp, bossHp });
    }
    const victory = bossHp <= 0 && playerHp > 0;
    const firstClear = victory && !clearedStages.includes(boss.stage);
    const rewardScale = firstClear ? 1 : 0.15;
    const coins = victory ? Math.max(1, Math.round(boss.rewardCoins * rewardScale)) : 0;
    const xp = victory ? Math.max(1, Math.round(boss.rewardXp * rewardScale)) : 0;
    const gems = victory ? Math.round(Number(boss.rewardGems || 0) * rewardScale) : 0;
    let earnedStars = 0;
    if (victory) {
      profile.coins = Number(profile.coins || 0) + coins;
      profile.xp = Number(profile.xp || 0) + xp;
      profile.gems = Number(profile.gems || 0) + gems;
      profile.pve_wins = Number(profile.pve_wins || 0) + 1;
      profile.pve_loss_streak = 0;
      profile.pve_daily_wins = { ...(profile.pve_daily_wins || {}), [boss.id]: dailyWins + 1 };
      if (firstClear) profile.pve_cleared_stages = [...clearedStages, boss.stage].sort((a, b) => a - b);
      profile.pve_max_stage = Math.min(PVE_BOSSES.length, Math.max(maxStage, boss.stage + 1));
      const hpRatio = playerHp / Math.max(1, playerMaxHp);
      earnedStars = hpRatio >= 0.70 && rounds.length <= 8 ? 3 : hpRatio >= 0.35 && rounds.length <= 14 ? 2 : 1;
      profile.pve_stage_stars = { ...(profile.pve_stage_stars || {}), [boss.stage]: Math.max(earnedStars, Number(profile.pve_stage_stars?.[boss.stage] || 0)) };
    } else {
      profile.pve_losses = Number(profile.pve_losses || 0) + 1;
      profile.pve_loss_streak = Math.min(4, Number(profile.pve_loss_streak || 0) + 1);
    }
    profile.level = getLevelFromXp(Number(profile.xp || 0)).level;
    profile.updated_date = new Date().toISOString();
    entities.PveBattle ||= [];
    const synergies = [
      fullTeamBonus ? { id: "full_team", label: "Équipe complète", bonus: "+8 % endurance et dégâts" } : null,
      formationBonus ? { id: "formation", label: "Formation de série", bonus: "+6 % dégâts" } : null,
      diversityBonus ? { id: "diversity", label: "Alliance multivers", bonus: "+5 % vitesse" } : null,
      weaknessBonus ? { id: "weakness", label: "Avantage de série", bonus: "+8 % dégâts" } : null,
      assistBonus ? { id: "assist", label: "Volonté du combattant", bonus: `+${Math.round(assistBonus * 100)} % dégâts` } : null,
    ].filter(Boolean);
    const battle = { id: id(), boss_id: boss.id, boss_name: boss.name, stage: boss.stage, victory, first_clear: firstClear, stars: earnedStars, energy_cost: energyCost, rewards: { coins, xp, gems }, synergies, team_card_ids: deck.map((card) => card.id), team_power: Math.round(teamPower), player_hp: playerHp, player_max_hp: playerMaxHp, boss_hp: bossHp, boss_max_hp: boss.hp, rounds, created_by_id: user.id, created_by: user.email, created_date: new Date().toISOString() };
    entities.PveBattle.push(battle);
    if (entities.PveBattle.length > 1000) entities.PveBattle = entities.PveBattle.slice(-1000);
    result = { ...battle, energy: profile.pve_energy, maxStage: profile.pve_max_stage, profile };
  } else if (name === "getAuctions") {
    settleExpiredAuctions(db);
    result = (entities.Auction || []).sort((a, b) => new Date(a.ends_at) - new Date(b.ends_at));
  } else if (name === "createMarketListing") {
    if (!profile) return json(res, 404, { message: "Profil joueur introuvable." });
    const kind = input.kind === "frame" ? "frame" : "card";
    const rawPrice = Number(input.price);
    if (!Number.isFinite(rawPrice) || rawPrice < 1) return json(res, 400, { message: "Prix invalide." });
    const price = Math.min(1_000_000_000, Math.floor(rawPrice));
    const now = new Date().toISOString();
    let listing;
    if (kind === "card") {
      const card = (entities.Card || []).find((item) => item.id === input.item_id && item.created_by_id === user.id);
      if (!card) return json(res, 404, { message: "Carte introuvable dans ta collection." });
      listing = {
        id: id(), card_id: card.id, seller_id: user.id, seller_name: profile.display_name || user.full_name || "Joueur",
        card_name: card.name, card_anime: card.anime, card_rarity: card.rarity, card_variant: card.variant,
        card_power: card.power, card_attack: card.attack, card_defense: card.defense, card_speed: card.speed,
        card_level: card.level || 1, card_image_url: card.image_url || null, price, status: "active",
        created_by_id: user.id, created_by: user.email, created_date: now, updated_date: now,
      };
      if (Number(card.duplicates || 1) > 1) Object.assign(card, { duplicates: Number(card.duplicates) - 1, updated_date: now });
      else entities.Card = entities.Card.filter((item) => item.id !== card.id);
      entities.MarketListing ||= [];
      entities.MarketListing.push(listing);
    } else {
      const ownedFrame = (entities.PlayerFrame || []).find((item) => item.id === input.item_id && item.created_by_id === user.id);
      if (!ownedFrame) return json(res, 404, { message: "Cadre introuvable dans ton inventaire." });
      const frame = (entities.CardFrame || []).find((item) => item.id === ownedFrame.frame_id);
      if (!frame) return json(res, 404, { message: "Définition du cadre introuvable." });
      if (frame.id === ENDGAME_FRAME_ID || frame.source_type === "endgame") return json(res, 403, { message: "Une relique ultime ne peut pas être vendue." });
      listing = {
        id: id(), frame_id: frame.id, frame_name: frame.name, frame_rarity: frame.rarity, frame_effect: frame.effect,
        seller_id: user.id, seller_name: profile.display_name || user.full_name || "Joueur", price, status: "active",
        created_by_id: user.id, created_by: user.email, created_date: now, updated_date: now,
      };
      entities.PlayerFrame = entities.PlayerFrame.filter((item) => item.id !== ownedFrame.id);
      entities.FrameListing ||= [];
      entities.FrameListing.push(listing);
    }
    advanceQuestProgress(entities, user.id, ["sell_1_card", "w_sell_3"]);
    result = listing;
  } else if (name === "createAuction") {
    if (!profile) return json(res, 404, { message: "Profil joueur introuvable." });
    const card = (entities.Card || []).find((item) => item.id === input.card_id && item.created_by_id === user.id);
    if (!card) return json(res, 404, { message: "Carte introuvable dans ta collection." });
    const startingPrice = Math.max(1, Math.floor(Number(input.starting_price || 0)));
    const buyoutPrice = input.buyout_price ? Math.floor(Number(input.buyout_price)) : null;
    if (buyoutPrice && buyoutPrice <= startingPrice) return json(res, 400, { message: "L’achat immédiat doit dépasser le prix de départ." });
    const durationHours = Math.max(1, Math.min(72, Number(input.duration_hours || 24)));
    const listingFee = Math.max(1, Math.floor(startingPrice * 0.05));
    if (Number(profile.coins || 0) < listingFee) return json(res, 400, { message: "Pièces insuffisantes pour les frais de mise." });
    const now = new Date();
    const auction = {
      id: id(), card_id: card.id, card_name: card.name, card_anime: card.anime, card_rarity: card.rarity,
      card_image_url: card.image_url, card_power: card.power, card_attack: card.attack, card_defense: card.defense,
      card_speed: card.speed, card_level: card.level || 1, seller_id: user.id,
      seller_name: profile.display_name || user.full_name || "Joueur", starting_price: startingPrice,
      current_bid: startingPrice, highest_bidder_id: null, highest_bidder_name: null, status: "active",
      ends_at: new Date(now.getTime() + durationHours * 3_600_000).toISOString(), buyout_price: buyoutPrice,
      listing_fee: listingFee, created_by_id: user.id, created_by: user.email, created_date: now.toISOString(), updated_date: now.toISOString(),
    };
    if (Number(card.duplicates || 1) > 1) {
      card.duplicates = Number(card.duplicates) - 1;
      card.updated_date = now.toISOString();
    } else {
      entities.Card = entities.Card.filter((item) => item.id !== card.id);
    }
    entities.Auction ||= [];
    entities.Auction.push(auction);
    profile.coins = Number(profile.coins || 0) - listingFee;
    profile.updated_date = now.toISOString();
    result = auction;
  } else if (name === "placeAuctionBid") {
    if (!profile) return json(res, 404, { message: "Profil joueur introuvable." });
    settleExpiredAuctions(db);
    const auction = (entities.Auction || []).find((item) => item.id === input.auction_id && item.status === "active");
    if (!auction) return json(res, 409, { message: "Cette enchère est terminée." });
    if (auction.seller_id === user.id) return json(res, 400, { message: "Tu ne peux pas enchérir sur ta propre carte." });
    const amount = Math.floor(Number(input.amount || 0));
    const minimum = Number(auction.current_bid || 0) + Math.max(1, Math.ceil(Number(auction.current_bid || 0) * 0.10));
    if (amount < minimum) return json(res, 409, { message: `La nouvelle mise minimale est ${minimum.toLocaleString("fr-FR")} pièces.` });
    const isSameBidder = auction.highest_bidder_id === user.id;
    const charge = isSameBidder ? amount - Number(auction.current_bid || 0) : amount;
    if (Number(profile.coins || 0) < charge) return json(res, 400, { message: "Pièces insuffisantes." });
    if (auction.highest_bidder_id && !isSameBidder) {
      const previous = (entities.PlayerProfile || []).find((item) => item.created_by_id === auction.highest_bidder_id);
      if (previous) previous.coins = Number(previous.coins || 0) + Number(auction.current_bid || 0);
    }
    profile.coins = Number(profile.coins || 0) - charge;
    profile.updated_date = new Date().toISOString();
    Object.assign(auction, { current_bid: amount, highest_bidder_id: user.id, highest_bidder_name: profile.display_name || user.full_name || "Joueur", updated_date: new Date().toISOString() });
    result = auction;
  } else if (name === "getLeaderboard") {
    const profiles = (entities.PlayerProfile || []).filter(playerProfile => playerProfile.profile_visibility === "public" || !playerProfile.profile_visibility || playerProfile.created_by_id === user.id);
    const cards = entities.Card || [];
    const rarityScore = { normale: 1, legendaire: 25, "secrète": 50, manga_god: 100 };
    result = profiles.map((playerProfile) => {
      const owner = db.users.find((candidate) => candidate.id === playerProfile.created_by_id);
      const playerCards = cards.filter((card) => card.created_by_id === playerProfile.created_by_id);
      const level = getLevelFromXp(Number(playerProfile.xp || 0)).level;
      const collectionPower = playerCards.reduce((sum, card) => sum + Number(card.power || 0), 0);
      const rarityBonus = playerCards.reduce((sum, card) => sum + (rarityScore[card.rarity] || 1), 0);
      return {
        id: playerProfile.id,
        userId: playerProfile.created_by_id,
        name: playerProfile.display_name || owner?.full_name || "Joueur",
        avatarUrl: playerProfile.avatar_url || owner?.avatar_url || null,
        titleId: playerProfile.equipped_title_id || "rookie",
        level,
        collectionSize: playerCards.length,
        collectionPower,
        score: level * 100 + collectionPower + rarityBonus,
        isCurrentUser: playerProfile.created_by_id === user.id,
      };
    }).sort((a, b) => b.score - a.score || b.collectionPower - a.collectionPower).map((player, index) => ({ ...player, rank: index + 1 }));
  } else if (name === "setCardImage") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    const definition = (entities.CardDefinition || []).find((item) => item.id === input.card_id);
    if (!definition) return json(res, 404, { message: "Définition de carte introuvable." });
    const imageUrl = String(input.image_url || "");
    const uploadMatch = imageUrl.match(/^\/api\/uploads\/([a-f0-9]{24})$/i);
    if (!uploadMatch) return json(res, 400, { message: "L’image doit provenir de l’upload sécurisé de l’administration." });
    const remote = await mongoDb();
    if (!remote || !(await remote.collection("card_images.files").findOne({ _id: new ObjectId(uploadMatch[1]) }))) return json(res, 404, { message: "Le fichier uploadé est introuvable." });
    entities.CardImageOverride ||= [];
    const existing = entities.CardImageOverride.find((item) => item.card_id === definition.id);
    const now = new Date().toISOString();
    if (existing) Object.assign(existing, { image_url: imageUrl, card_name: definition.name, updated_date: now });
    else entities.CardImageOverride.push({ id: id(), card_id: definition.id, card_name: definition.name, image_url: imageUrl, created_by_id: user.id, created_by: user.email, created_date: now, updated_date: now });
    entities.CardImageOverride = entities.CardImageOverride.filter((item, index, rows) => item.card_id !== definition.id || rows.findIndex((candidate) => candidate.card_id === definition.id) === index);
    definition.image_url = imageUrl; definition.updated_date = now;
    for (const owned of (entities.Card || []).filter((item) => item.card_definition_id === definition.id)) { owned.image_url = imageUrl; owned.updated_date = now; }
    result = { image_url: imageUrl, card_id: definition.id };
  } else if (name === "clearCardImage") {
    if (user.role !== "admin") return json(res, 403, { message: "Accès administrateur requis." });
    const definition = (entities.CardDefinition || []).find((item) => item.id === input.card_id);
    if (!definition) return json(res, 404, { message: "Définition de carte introuvable." });
    entities.CardImageOverride = (entities.CardImageOverride || []).filter((item) => item.card_id !== definition.id);
    definition.image_url = null; definition.updated_date = new Date().toISOString();
    for (const owned of (entities.Card || []).filter((item) => item.card_definition_id === definition.id)) { owned.image_url = null; owned.updated_date = new Date().toISOString(); }
    result = { card_id: definition.id, image_url: null };
  } else if (name === "unlockTalent") {
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
  } else if (name === "claimQuest") {
    if (!profile) return json(res, 404, { message: "Profil joueur introuvable." });
    const quest = (entities.Quest || []).find((item) => item.id === input.quest_id && item.created_by_id === user.id);
    if (!quest) return json(res, 404, { message: "Quête introuvable." });
    if (quest.claimed) return json(res, 409, { message: "Cette récompense a déjà été récupérée." });
    if (quest.expires_at && new Date(quest.expires_at).getTime() < Date.now()) return json(res, 410, { message: "Cette quête est expirée." });
    if (!quest.completed || Number(quest.progress || 0) < Number(quest.target || 1)) return json(res, 403, { message: "Cette quête n’est pas encore terminée." });
    const definition = QUEST_DEFINITIONS.get(quest.quest_id);
    if (!definition || definition.target !== Number(quest.target)) return json(res, 400, { message: "Définition de quête invalide." });
    const now = new Date().toISOString();
    const duplicateQuests = (entities.Quest || []).filter((item) =>
      item.created_by_id === user.id && item.quest_id === quest.quest_id && item.type === quest.type && item.expires_at === quest.expires_at
    );
    for (const duplicate of duplicateQuests) Object.assign(duplicate, { claimed: true, claimed_at: now, updated_date: now });
    const coins = Number(definition.reward_coins || 0);
    const gems = Number(definition.reward_gems || 0);
    const xp = Math.round(coins / 10);
    profile.coins = Number(profile.coins || 0) + coins;
    profile.gems = Number(profile.gems || 0) + gems;
    profile.xp = Number(profile.xp || 0) + xp;
    profile.updated_date = now;
    result = { quest_id: quest.id, rewards: { coins, gems, xp }, profile };
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
    advanceQuestProgress(entities, user.id, ["open_1_booster", "open_3_boosters", "w_open_10"]);
    const newCardCount = dropped.filter((card) => !card.isDuplicate).length;
    if (newCardCount > 0) advanceQuestProgress(entities, user.id, ["collect_5_cards", "w_collect_20"], newCardCount);
    if (dropped.some((card) => card.rarity !== "normale")) advanceQuestProgress(entities, user.id, ["get_rare"]);
    if (dropped.some((card) => ["secrète", "manga_god"].includes(card.rarity))) advanceQuestProgress(entities, user.id, ["get_ultra", "w_get_epic"]);
    if (dropped.some((card) => card.rarity === "manga_god")) advanceQuestProgress(entities, user.id, ["w_get_legendary"]);
    if (booster.currency === "coins" && price > 0) advanceQuestProgress(entities, user.id, ["spend_coins"], price);
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
      ? rare.map((card) => ({
        type: card.rarity,
        title: card.rarity === "manga_god" ? "MANGA GOD !" : card.rarity === "secrète" ? "CARTE SECRETE !" : "CARTE LEGENDAIRE !",
        description: card.isDuplicate ? `${card.name} renforce ta carte existante (×${card.stackCount || 2}).` : `${card.name} rejoint ta collection.`,
      }))
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
  } else if (name === "buyMarketListing") {
    if (!profile) return json(res, 404, { message: "Profil acheteur introuvable." });
    const kind = input.kind === "frame" ? "frame" : "card";
    const collectionName = kind === "frame" ? "FrameListing" : "MarketListing";
    const listing = (entities[collectionName] || []).find((item) => item.id === input.listing_id);
    if (!listing || listing.status !== "active") return json(res, 409, { message: "Cette annonce n’est plus disponible." });
    if (listing.seller_id === user.id) return json(res, 400, { message: "Tu ne peux pas acheter ta propre annonce." });
    const price = Math.max(1, Number(listing.price || 0));
    if (Number(profile.coins || 0) < price) return json(res, 400, { message: "Pièces insuffisantes." });
    const sellerProfile = (entities.PlayerProfile || []).find((item) => item.created_by_id === listing.seller_id);
    if (!sellerProfile) return json(res, 409, { message: "Le profil du vendeur est introuvable." });
    const tax = Math.max(1, Math.floor(price * 0.05));
    const sellerReceives = price - tax;
    const now = new Date().toISOString();
    profile.coins = Number(profile.coins || 0) - price;
    sellerProfile.coins = Number(sellerProfile.coins || 0) + sellerReceives;
    profile.updated_date = now;
    sellerProfile.updated_date = now;
    if (kind === "card") {
      entities.Card ||= [];
      const existing = entities.Card.find((card) => card.created_by_id === user.id && card.name === listing.card_name && card.rarity === listing.card_rarity);
      if (existing) {
        existing.duplicates = Number(existing.duplicates || 1) + 1;
        existing.updated_date = now;
      } else {
        entities.Card.push({
          id: id(), name: listing.card_name, anime: listing.card_anime, rarity: listing.card_rarity,
          variant: listing.card_variant, power: listing.card_power, attack: listing.card_attack,
          defense: listing.card_defense, speed: listing.card_speed, level: listing.card_level || 1,
          image_url: listing.card_image_url || null, duplicates: 1, is_favorite: false,
          created_by_id: user.id, created_by: user.email, created_date: now, updated_date: now,
        });
      }
    } else {
      entities.PlayerFrame ||= [];
      entities.PlayerFrame.push({ id: id(), frame_id: listing.frame_id, is_unlocked: true, card_id: null, unlocked_date: now, created_by_id: user.id, created_by: user.email, created_date: now, updated_date: now });
    }
    Object.assign(listing, { status: "sold", buyer_id: user.id, sold_at: now, market_tax: tax, seller_received: sellerReceives, updated_date: now });
    entities.Transaction ||= [];
    entities.Transaction.push(
      { id: id(), type: "buy", description: `Achat marché : ${kind === "card" ? listing.card_name : listing.frame_name}`, amount: -price, created_by_id: user.id, created_by: user.email, created_date: now },
      { id: id(), type: "market_sale", description: `Vente marché : ${kind === "card" ? listing.card_name : listing.frame_name}`, amount: sellerReceives, created_by_id: listing.seller_id, created_date: now },
    );
    result = { listing, price, tax, seller_receives: sellerReceives };
  } else if (name === "cancelMarketListing") {
    const kind = input.kind === "frame" ? "frame" : "card";
    const collectionName = kind === "frame" ? "FrameListing" : "MarketListing";
    const listing = (entities[collectionName] || []).find((item) => item.id === input.listing_id && item.seller_id === user.id);
    if (!listing || listing.status !== "active") return json(res, 409, { message: "Cette annonce ne peut plus être annulée." });
    const now = new Date().toISOString();
    if (kind === "card") {
      entities.Card ||= [];
      const existing = entities.Card.find((card) => card.created_by_id === user.id && card.name === listing.card_name && card.rarity === listing.card_rarity);
      if (existing) {
        existing.duplicates = Number(existing.duplicates || 1) + 1;
        existing.updated_date = now;
      } else {
        entities.Card.push({ id: id(), name: listing.card_name, anime: listing.card_anime, rarity: listing.card_rarity, variant: listing.card_variant, power: listing.card_power, attack: listing.card_attack, defense: listing.card_defense, speed: listing.card_speed, level: listing.card_level || 1, image_url: listing.card_image_url || null, duplicates: 1, is_favorite: false, created_by_id: user.id, created_by: user.email, created_date: now, updated_date: now });
      }
    } else {
      entities.PlayerFrame ||= [];
      entities.PlayerFrame.push({ id: id(), frame_id: listing.frame_id, is_unlocked: true, card_id: null, unlocked_date: now, created_by_id: user.id, created_by: user.email, created_date: now, updated_date: now });
    }
    Object.assign(listing, { status: "cancelled", cancelled_at: now, updated_date: now });
    result = { listing };
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

export const handleRequest = async (req, res) => {
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
export const requestHandler = (req, res) => {
  if (req.url?.startsWith("/api/") && !(req.method === "GET" && req.url.startsWith("/api/uploads/"))) {
    apiQueue = apiQueue.then(() => handleRequest(req, res), () => handleRequest(req, res));
    return;
  }
  handleRequest(req, res);
};

if (!process.env.VERCEL) {
  const server = http.createServer(requestHandler);
  const host = process.env.HOST || "0.0.0.0";
  server.listen(port, host, () => console.log(`API Manga Cards : http://${host}:${port}`));
}
