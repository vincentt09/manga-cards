// ─── Quest Progress Tracker ───────────────────────────────────────────────────
// Call these functions from Boosters, Upgrade, Marketplace pages to update quest progress.
import { appClient } from "@/api/appClient";

async function getActiveQuests() {
  const quests = await appClient.entities.Quest.list("-created_date", 50);
  const now = new Date();
  return quests.filter(q => !q.claimed && !q.completed && new Date(q.expires_at) > now);
}

async function updateQuestProgress(questId, increment = 1) {
  try {
    const active = await getActiveQuests();
    const matching = active.filter(q => q.quest_id === questId);
    for (const quest of matching) {
      const newProgress = Math.min((quest.progress || 0) + increment, quest.target);
      const completed = newProgress >= quest.target;
      await appClient.entities.Quest.update(quest.id, { progress: newProgress, completed });
    }
  } catch (e) {
    // silent fail — quests are a bonus feature
  }
}

// Called when opening a booster
export async function trackBoosterOpened(cardsReceived = []) {
  await updateQuestProgress("open_1_booster", 1);
  await updateQuestProgress("open_3_boosters", 1);
  await updateQuestProgress("w_open_10", 1);

  const count = cardsReceived.length;
  await updateQuestProgress("collect_5_cards", count);
  await updateQuestProgress("w_collect_20", count);

  const hasRare = cardsReceived.some(c => ["rare","ultra_rare","epic","legendary","secret"].includes(c.rarity));
  const hasUltra = cardsReceived.some(c => ["ultra_rare","epic","legendary","secret"].includes(c.rarity));
  const hasEpic = cardsReceived.some(c => ["epic","legendary","secret"].includes(c.rarity));
  const hasLegendary = cardsReceived.some(c => ["legendary","secret"].includes(c.rarity));

  if (hasRare)      await updateQuestProgress("get_rare", 1);
  if (hasUltra)     await updateQuestProgress("get_ultra", 1);
  if (hasEpic)      { await updateQuestProgress("w_get_epic", 1); }
  if (hasLegendary) await updateQuestProgress("w_get_legendary", 1);
}

// Called when upgrading a card
export async function trackCardUpgraded() {
  await updateQuestProgress("upgrade_card", 1);
  await updateQuestProgress("w_upgrade_3", 1);
}

// Called when listing a card on the market
export async function trackCardSold() {
  await updateQuestProgress("sell_1_card", 1);
  await updateQuestProgress("w_sell_3", 1);
}

// Called when coins are spent
export async function trackCoinsSpent(amount) {
  // For "spend 1000 coins" quest — track incrementally
  try {
    const active = await getActiveQuests();
    const quest = active.find(q => q.quest_id === "spend_coins");
    if (quest) {
      const newProgress = Math.min((quest.progress || 0) + amount, quest.target);
      await appClient.entities.Quest.update(quest.id, {
        progress: newProgress,
        completed: newProgress >= quest.target,
      });
    }
  } catch (e) {}
}

// Called when favoriting a card
export async function trackCardFavorited() {
  await updateQuestProgress("fav_1_card", 1);
}