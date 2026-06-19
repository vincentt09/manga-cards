import { appClient } from "@/api/appClient";

export async function logTransaction({ type, description, amount, gems_amount = 0, card_name = "", card_rarity = "" }) {
  try {
    await appClient.entities.Transaction.create({
      type,
      description,
      amount,
      gems_amount,
      card_name,
      card_rarity,
    });
  } catch (e) {
    // silent — logging is non-critical
  }
}