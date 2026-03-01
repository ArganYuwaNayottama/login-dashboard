import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const categoryRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showProfile, setShowProfile] = useState(false);
  const [showCategory, setShowCategory] = useState(false);

  const username = localStorage.getItem("username") || "Guest";

  // POINT SYSTEM (hanya visual, tidak ada auto tambah)
  const points = parseInt(localStorage.getItem("points")) || 0;
  const level = Math.floor(points / 100);
  const progress = points % 100;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setShowCategory(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/products");
        const data = await response.json();
        setProducts(data);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Warna level dinamis
  const getLevelColor = () => {
    if (progress <= 49) return "#22c55e"; // hijau
    if (progress <= 89) return "#facc15"; // kuning
    return "#ef4444"; // merah
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">
         📘 Arbook: Toko Buku 
        </div>

        <div className="header-center">
          <div
            className="category-filter"
            ref={categoryRef}
            onClick={() => setShowCategory(!showCategory)}
          >
            Kategori ▾
            {showCategory && (
              <div className="category-dropdown">
                <div onClick={() => setSearchQuery("Novel")}>Novel</div>
                <div onClick={() => setSearchQuery("Komik")}>Komik</div>
                <div onClick={() => setSearchQuery("Sejarah")}>Sejarah</div>
                <div onClick={() => setSearchQuery("")}>Semua</div>
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder="Cari buku favoritmu..."
            className="search-bar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Keranjang hanya visual */}
          <div className="cart-icon">
            🛒
            <span className="cart-badge-static">0</span>
          </div>
        </div>

        <div
          className="profile-wrapper"
          ref={profileRef}
          onClick={() => setShowProfile(!showProfile)}
        >
          👤
          {showProfile && (
            <div className="profile-dropdown">
              <div className="profile-header">
                <div className="profile-name">{username}</div>
                <div className="profile-level">Level {level}</div>
              </div>

              <div className="level-section">
                <div className="level-bar">
                  <div
                    className="level-progress"
                    style={{
                      width: `${progress}%`,
                      background: getLevelColor(),
                    }}
                  ></div>
                </div>
                <div className="level-points">{progress}/100 XP</div>
              </div>

              <div className="logout-btn" onClick={handleLogout}>
                Logout
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="dashboard-main">
        {loading ? (
          <p className="loading">Memuat produk...</p>
        ) : (
          <div className="card-container">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                title={product.title}
                description={product.description}
                originalPrice={product.price}
                category={product.category}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
} export default Dashboard;
