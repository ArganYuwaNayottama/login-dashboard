import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./Productmodal.css";

function ProductModal({ product, mode: initialMode, onClose }) {
  const [mode, setMode] = useState("detail");
  const [flow, setFlow] = useState("cart"); // "cart" | "buy"
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQty(1);
    setMode("detail");
    setFlow("cart");
  }, [product]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!product) return null;

  const {
    title,
    description,
    originalPrice,
    category,
    image,
    stock,
    discount,
    id,
  } = product;

  const hasDiscount = discount && discount.percent > 0;
  const discountedPrice = hasDiscount
    ? Math.round(originalPrice * (1 - discount.percent / 100))
    : null;
  const finalPrice = hasDiscount ? discountedPrice : originalPrice;

  const formatRp = (val) =>
    "Rp" + Number(val).toLocaleString("id-ID", { maximumFractionDigits: 0 });

  const token = localStorage.getItem("token");

  const Cover = () =>
    image ? (
      <img src={image} alt={title} className="pm-cover-img" />
    ) : (
      <div className="pm-cover-placeholder">
        <svg
          width="48"
          height="48"
          fill="none"
          stroke="rgba(139,94,42,0.3)"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <p>{title}</p>
      </div>
    );

  // ── Masuk Keranjang ──
  const handleAddToCart = () => {
    const existing = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx = existing.findIndex((item) => item.title === title);
    if (idx !== -1) {
      existing[idx].qty = Math.min(stock, existing[idx].qty + qty);
    } else {
      existing.push({
        id,
        title,
        image,
        category,
        price: finalPrice,
        qty,
        stock,
      });
    }
    localStorage.setItem("cart", JSON.stringify(existing));
    window.dispatchEvent(new Event("cartUpdated"));
    onClose();
  };

  // ── Beli Sekarang → kurangi stok di DB ──
  const handleBuyNow = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://arbook-backend-v1.onrender.com/api/products/${id}/buy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ qty }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Gagal membeli produk");
        return;
      }
      alert(
        `✅ Berhasil membeli ${qty} "${title}"!\nTotal: ${formatRp(finalPrice * qty)}`,
      );
      onClose();
    } catch {
      alert("Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-box" onClick={(e) => e.stopPropagation()}>
        <button className="pm-close" onClick={onClose}>
          ✕
        </button>

        {/* ── MODE DETAIL ── */}
        {mode === "detail" && (
          <div className="pm-detail">
            <div className="pm-detail-cover">
              <Cover />
            </div>
            <div className="pm-detail-info">
              {category && <span className="pm-category">{category}</span>}
              <h2 className="pm-title">{title}</h2>
              <div className="pm-price-row">
                {hasDiscount ? (
                  <>
                    <span className="pm-price">
                      {formatRp(discountedPrice)}
                    </span>
                    <span className="pm-price-old">
                      {formatRp(originalPrice)}
                    </span>
                    <span className="pm-badge">{discount.percent}% OFF</span>
                  </>
                ) : (
                  <span className="pm-price">{formatRp(originalPrice)}</span>
                )}
              </div>
              <div className="pm-meta">
                <div className="pm-meta-item">
                  <span className="pm-meta-label">Stok</span>
                  <span
                    className={`pm-meta-value ${stock === 0 ? "out" : stock < 5 ? "low" : ""}`}
                  >
                    {stock === 0
                      ? "Habis"
                      : stock < 5
                        ? `Sisa ${stock}`
                        : `${stock} tersedia`}
                  </span>
                </div>
                <div className="pm-meta-item">
                  <span className="pm-meta-label">Kategori</span>
                  <span className="pm-meta-value">{category || "-"}</span>
                </div>
              </div>
              {description && (
                <div className="pm-desc">
                  <p className="pm-desc-label">Deskripsi</p>
                  <p className="pm-desc-text">{description}</p>
                </div>
              )}

              {/* ── 2 TOMBOL ── */}
              <div className="pm-detail-actions">
                <button
                  className="pm-cart-btn"
                  disabled={stock === 0}
                  onClick={() => {
                    setFlow("cart");
                    setQty(1);
                    setMode("qty");
                  }}
                >
                  🛒 Keranjang
                </button>
                <button
                  className="pm-buy-btn"
                  disabled={stock === 0}
                  onClick={() => {
                    setFlow("buy");
                    setQty(1);
                    setMode("qty");
                  }}
                >
                  {stock === 0 ? "Stok Habis" : "Beli Sekarang"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODE QTY (pilih jumlah) ── */}
        {mode === "qty" && (
          <div className="pm-cart">
            <h3 className="pm-cart-title">
              {flow === "cart" ? "Masuk Keranjang" : "Beli Sekarang"}
            </h3>

            <div className="pm-cart-preview">
              <div className="pm-cart-thumb">
                {image ? (
                  <img src={image} alt={title} />
                ) : (
                  <div className="pm-cart-thumb-placeholder">📚</div>
                )}
              </div>
              <div className="pm-cart-preview-info">
                <p className="pm-cart-name">{title}</p>
                <p className="pm-cart-cat">{category}</p>
                <p className="pm-cart-price">{formatRp(finalPrice)}</p>
              </div>
            </div>

            <div className="pm-qty-row">
              <span className="pm-qty-label">Jumlah</span>
              <div className="pm-qty-picker">
                <button
                  className="pm-qty-btn"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  className="pm-qty-input"
                  value={qty}
                  min={1}
                  max={stock}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) setQty(Math.min(stock, Math.max(1, val)));
                  }}
                />
                <button
                  className="pm-qty-btn"
                  onClick={() => setQty((q) => Math.min(stock, q + 1))}
                  disabled={qty >= stock}
                >
                  +
                </button>
              </div>
              <span className="pm-qty-stock">Stok: {stock}</span>
            </div>

            <div className="pm-total-row">
              <span className="pm-total-label">Estimasi Total</span>
              <span className="pm-total-val">{formatRp(finalPrice * qty)}</span>
            </div>

            {hasDiscount && (
              <div className="pm-saving">
                Hemat {formatRp((originalPrice - finalPrice) * qty)} (
                {discount.percent}% off)
              </div>
            )}

            <div className="pm-cart-actions">
              <button className="pm-back-btn" onClick={() => setMode("detail")}>
                ← Kembali
              </button>
              {flow === "cart" ? (
                <button className="pm-confirm-btn" onClick={handleAddToCart}>
                  🛒 Masuk Keranjang
                </button>
              ) : (
                <button
                  className="pm-confirm-btn pm-confirm-btn--buy"
                  onClick={handleBuyNow}
                  disabled={loading}
                >
                  {loading ? "Memproses..." : "💳 Beli Sekarang"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default ProductModal;
