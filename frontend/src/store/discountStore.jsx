import { createContext, useContext, useState, useCallback } from "react";

const DiscountContext = createContext(null);

export function DiscountProvider({ children }) {
  // { [productId]: { percent: number } }
  const [discounts, setDiscounts] = useState({});

  const setDiscount = useCallback((productId, percent) => {
    const p = Number(percent);
    if (!productId || isNaN(p) || p < 0 || p > 100) return;
    setDiscounts((prev) => ({ ...prev, [productId]: { percent: p } }));
  }, []);

  const removeDiscount = useCallback((productId) => {
    setDiscounts((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }, []);

  const clearAllDiscounts = useCallback(() => setDiscounts({}), []);

  const getDiscount = useCallback(
    (productId) => discounts[productId] ?? null,
    [discounts]
  );

  return (
    <DiscountContext.Provider
      value={{ discounts, setDiscount, removeDiscount, clearAllDiscounts, getDiscount }}
    >
      {children}
    </DiscountContext.Provider>
  );
}

export function useDiscounts() {
  const ctx = useContext(DiscountContext);
  if (!ctx) throw new Error("useDiscounts() harus di dalam <DiscountProvider>");
  return ctx;
}