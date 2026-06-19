export const hasTalent = (unlocked, id) => unlocked.has(id);

export const getBoosterDiscount = (unlocked) => hasTalent(unlocked, "economy_2") ? 0.05 : 0;

export const getPassiveIncomeBonus = (unlocked) =>
  (hasTalent(unlocked, "economy_1") ? 0.05 : 0)
  + (hasTalent(unlocked, "economy_3") ? 0.10 : 0)
  + (hasTalent(unlocked, "economy_4") ? 0.10 : 0);

export const getXpBonusMultiplier = (unlocked) => 1
  + (hasTalent(unlocked, "collection_1") ? 0.05 : 0)
  + (hasTalent(unlocked, "collection_2") ? 0.10 : 0)
  + (hasTalent(unlocked, "collection_3") ? 0.10 : 0);

export const getCoinBonusMultiplier = () => 1;
export const getBoosterLuckBonus = () => 0;
