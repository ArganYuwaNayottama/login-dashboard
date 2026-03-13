// Dashcustomer.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Header from "../components/Header";
import { useDiscounts } from "../store/discountStore";
import ProductModal from "../components/Productmodal";
import "./Dashcustomer.css";

function Dashboard() {
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const categoryRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState(["Semua"]);

  const [showProfile, setShowProfile] = useState(false);
  const [showCategory, setShowCategory] = useState(false);

  useEffect(() => {
    document.title = "Toko Pakaian | Argan Fashion";
  }, []);

  const username = localStorage.getItem("username") || "Guest";

  // ── Diskon dari store (diisi admin, otomatis sync) ──
  const { getDiscount } = useDiscounts();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setShowProfile(false);
      if (categoryRef.current && !categoryRef.current.contains(e.target))
        setShowCategory(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  // Fetch products dari API
  useEffect(() => {
   const fetchProducts = async () => {
  try {
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const response = await fetch("http://localhost:3000/api/products", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    const data = await response.json();

    // ❌ Cek dulu kalau data bukan array
    if (!Array.isArray(data)) {
      console.error("API tidak mengembalikan array:", data);
      setProducts([]);
      return;
    }

    const formattedProducts = data.map(item => ({
      id: item.id,
      title: item.name,
      description: item.description || "Tidak ada deskripsi",
      category: item.category_name || "Lainnya",
      price: item.price,
      originalPrice: item.price,
      size: item.size,
      stock: item.stock,
      image: item.image || null,
      category_id: item.category_id
    }));

    setProducts(formattedProducts);

    const uniqueCategories = [
      "Semua",
      ...new Set(formattedProducts.map(p => p.category).filter(Boolean))
    ];
    setCategories(uniqueCategories);

  } catch (error) {
    console.error("Error fetching products:", error);
    setProducts([]);
  } finally {
    setLoading(false);
  }
};
    
    fetchProducts();
  }, []);

  // Filter produk berdasarkan pencarian dan kategori
  const filteredProducts = products.filter((product) => {
    const matchSearch =
      product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.size && product.size.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchCategory =
      activeCategory === "Semua" || product.category === activeCategory;
    
    return matchSearch && matchCategory;
  });

  return (
    <div className="dashboard-container">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showProfile={showProfile}
        setShowProfile={setShowProfile}
        showCategory={showCategory}
        setShowCategory={setShowCategory}
        profileRef={profileRef}
        categoryRef={categoryRef}
        username={username}
        handleLogout={handleLogout}
      />

      <main className="dashboard-main">
        {/* ── Hero Banner untuk Toko Pakaian ── */}
        <div className="hero-banner" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
          <div className="hero-text">
            <span className="hero-eyebrow">Fashion Collection</span>
            <h1 className="hero-title">
              Tampil Gaya
              <br />
              dengan Koleksi Terbaru
            </h1>
            <p className="hero-sub">
              Dari casual hingga formal, temukan gaya terbaikmu di sini.
            </p>
          </div>
          <div className="hero-decoration">
            <div className="hero-book hero-book--1" style={{ background: "#ff6b6b" }}>👕</div>
            <div className="hero-book hero-book--2" style={{ background: "#4ecdc4" }}>👖</div>
            <div className="hero-book hero-book--3" style={{ background: "#ffe66d" }}>🧥</div>
          </div>
        </div>

        {/* ── Category Filter Tabs ── */}
        {!loading && categories.length > 1 && (
          <div className="category-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`cat-tab ${activeCategory === cat ? "cat-tab--active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* ── Section Header ── */}
        {!loading && (
          <div className="section-header">
            <div>
              <h2 className="section-title">
                {activeCategory === "Semua" ? "Semua Produk" : activeCategory}
              </h2>
              <p className="section-count">
                {filteredProducts.length} produk ditemukan
              </p>
            </div>
          </div>
        )}

        {/* ── Product Grid ── */}
        {loading ? (
          <div className="skeleton-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-cover" />
                <div className="skeleton-line skeleton-line--short" />
                <div className="skeleton-line" />
                <div className="skeleton-line skeleton-line--price" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👕</div>
            <p className="empty-title">Produk tidak ditemukan</p>
            <p className="empty-sub">Coba kata kunci atau kategori lain</p>
          </div>
        ) : (
          <div className="card-container">
            {filteredProducts.map((product, i) => (
              <div
                key={product.id}
                className="card-wrapper"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <ProductCard
                  id={product.id}
                  title={product.title}
                  description={product.description}
                  category={product.category}
                  originalPrice={product.price}
                  size={product.size} // Kirim ukuran ke ProductCard
                  stock={product.stock}
                  image={product.image}
                  discount={getDiscount(product.id)}
                  onClick={() => setSelectedProduct({
                    ...product,
                    mode: 'customer' // Mode untuk modal
                  })}
                />
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Modal untuk detail produk */}
      <ProductModal
        product={selectedProduct}
        mode="customer"
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

export default Dashboard;