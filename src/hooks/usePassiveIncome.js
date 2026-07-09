import { useEffect, useRef } from "react";
import { appClient } from "@/api/appClient";
import { useQueryClient } from "@tanstack/react-query";
const TICK_MS = 60000;

export default function usePassiveIncome(profile, cards) {
  const queryClient = useQueryClient();
  const lastTickRef = useRef(null);

  useEffect(() => {
    // Only generate income when user is connected and has cards
    if (!profile?.id || !cards || cards.length === 0) return;

    // Avoid double-ticking across re-renders
    if (lastTickRef.current && Date.now() - lastTickRef.current < TICK_MS * 0.8) return;

    const interval = setInterval(async () => {
      lastTickRef.current = Date.now();

      try {
        const response = await appClient.functions.invoke("claimPassiveIncome", {});
        const data = response?.data || {};
        if (data.profile) queryClient.setQueryData(["profile"], [data.profile]);
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      } catch (e) {
        // silent fail
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [profile?.id, cards?.length, queryClient]);
}
