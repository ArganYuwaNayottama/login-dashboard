// Dashcashier.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Header from "../components/Header";
import { useDiscounts } from "../store/discountStore";
import "./Dashcashier.css";

function Dashcashier() {
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const categoryRef = useRef(null);

  const [activeTab, setActiveTab] = useState("kelola");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Semua");

  const [showProfile, setShowProfile] = useState(false);
  const [showCategory, setShowCategory] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    document.title = "Dashboard Kasir - Toko Pakaian";
  }, []);

  // State konfirmasi hapus
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    size: "",
    price: "",
    stock: "",
    description: "",
    category: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const username = localStorage.getItem("username") || "Guest";
  const token = localStorage.getItem("token");

  const { getDiscount } = useDiscounts();

  // Fungsi notifikasi
  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };
  
  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

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
    if (!token) navigate("/login");
    
    // Cek role apakah cashier
    const role = localStorage.getItem("role");
    if (role !== "cashier") {
      navigate("/dashboard");
    }
  }, [navigate, token]);

  // Fetch semua produk
  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Gunakan endpoint yang benar untuk toko pakaian
      const response = await fetch("http://localhost:3000/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching products:", error);
      showError("Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  };

  // Fetch kategori
  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      showError("Gagal memuat kategori");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Filter untuk pencarian di tab kelola
  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.size && p.size.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Daftar kategori untuk tab lihat
  const categoryList = [
    "Semua",
    ...Array.from(
      new Set(
        products
          .map((p) => p.category_name)
          .filter(Boolean)
      ),
    ),
  ];

  // Produk aktif untuk tab lihat
  const activeProducts = products.filter((p) => {
    const matchSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.size && p.size.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchCategory =
      activeCategory === "Semua" || p.category_name === activeCategory;
    
    return matchSearch && matchCategory;
  });

  // Buka modal tambah produk
  const openAddModal = () => {
    setModalMode("add");
    setFormData({ 
      name: "", 
      size: "", 
      price: "", 
      stock: "", 
      description: "", 
      category: "" 
    });
    setSelectedProduct(null);
    setShowModal(true);
  };

  // Buka modal edit produk
  const openEditModal = (product) => {
    setModalMode("edit");
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      size: product.size || "",
      price: product.price,
      stock: product.stock,
      description: product.description || "",
      category: product.category_id,
    });
    setShowModal(true);
  };

  // Submit tambah / edit produk
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi frontend
    if (!formData.name.trim()) {
      showError("Nama produk wajib diisi");
      return;
    }

    if (formData.name.trim().length < 3) {
      showError("Nama produk minimal 3 karakter");
      return;
    }

    if (!formData.category) {
      showError("Kategori wajib dipilih");
      return;
    }

    if (!formData.price || parseInt(formData.price) <= 0) {
      showError("Harga harus lebih dari 0");
      return;
    }

    if (parseInt(formData.stock) < 0) {
      showError("Stok tidak boleh negatif");
      return;
    }

    // Cek duplikat nama (khusus mode tambah)
    if (modalMode === "add") {
      const isDuplicate = products.some(
        (p) => p.name?.toLowerCase().trim() === formData.name.toLowerCase().trim()
      );
      if (isDuplicate) {
        showError("Produk dengan nama ini sudah ada!");
        return;
      }
    }

    const url = modalMode === "add"
      ? "http://localhost:3000/api/products"
      : `http://localhost:3000/api/products/${selectedProduct.id}`;
    
    const method = modalMode === "add" ? "POST" : "PUT";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          size: formData.size.trim() || null,
          price: parseInt(formData.price),
          stock: parseInt(formData.stock) || 0,
          description: formData.description.trim() || null,
          category: parseInt(formData.category),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        showError(err.message || "Gagal menyimpan produk");
        return;
      }

      showSuccess(
        modalMode === "add"
          ? "Produk berhasil ditambahkan! ✅"
          : "Produk berhasil diupdate! ✅"
      );
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      showError("Terjadi kesalahan, coba lagi");
    }
  };

  // Hapus produk
  const handleDelete = (product) => {
    setConfirmDelete(product);
  };

  const confirmDeleteProduct = async () => {
    const product = confirmDelete;
    setConfirmDelete(null);
    
    try {
      const response = await fetch(
        `http://localhost:3000/api/products/${product.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (!response.ok) {
        showError("Gagal menghapus produk");
        return;
      }
      
      showSuccess(`Produk "${product.name}" berhasil dihapus! 🗑️`);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      showError("Terjadi kesalahan, coba lagi");
    }
  };

  return (
    <div className="dashboard-container">
      {/* Notifikasi */}
      {error && <div className="error-popup">{error}</div>}
      {success && <div className="success-popup">{success}</div>}

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
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="dashboard-main">
        <div className="tab-content" key={activeTab}>
          
          {/* TAB KELOLA - Manajemen Produk */}
          {activeTab === "kelola" && (
            <>
              <div className="cashier-toolbar">
                <h2 className="section-title">Manajemen Produk</h2>
                <button className="btn-add" onClick={openAddModal}>
                  + Tambah Produk
                </button>
              </div>

              {loading ? (
                <p className="loading">Memuat produk...</p>
              ) : filteredProducts.length === 0 ? (
                <div className="empty-state">
                  <span>👕</span>
                  <p>Tidak ada produk ditemukan.</p>
                </div>
              ) : (
                <table className="product-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama Produk</th>
                      <th>Kategori</th>
                      <th>Ukuran</th>
                      <th>Harga</th>
                      <th>Stok</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product, index) => (
                      <tr key={product.id}>
                        <td>{index + 1}</td>
                        <td>{product.name}</td>
                        <td>{product.category_name || "-"}</td>
                        <td>{product.size || "-"}</td>
                        <td>Rp {product.price?.toLocaleString("id-ID")}</td>
                        <td>{product.stock}</td>
                        <td className="action-btns">
                          <button
                            className="btn-edit"
                            onClick={() => openEditModal(product)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(product)}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* TAB LIHAT - Tampilan Customer */}
          {activeTab === "lihat" && (
            <>
              {!loading && categoryList.length > 1 && (
                <div className="category-tabs">
                  {categoryList.map((cat) => (
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

              <div className="section-header">
                <div>
                  <h2 className="section-title">
                    {activeCategory === "Semua" ? "Semua Produk" : activeCategory}
                  </h2>
                  <p className="section-count">
                    {activeProducts.length} produk
                  </p>
                </div>
              </div>

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
              ) : activeProducts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👕</div>
                  <p className="empty-title">Tidak ada produk</p>
                  <p className="empty-sub">Tambah produk di tab Kelola</p>
                </div>
              ) : (
                <div className="card-container">
                  {activeProducts.map((product, i) => (
                    <div
                      key={product.id}
                      className="card-wrapper"
                      style={{ animationDelay: `${i * 0.06}s` }}
                    >
                      <ProductCard
                        id={product.id}
                        title={product.name}
                        description={product.description}
                        originalPrice={product.price}
                        category={product.category_name || "Lainnya"}
                        size={product.size}
                        stock={product.stock}
                        image={product.image}
                        discount={getDiscount(product.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* MODAL KONFIRMASI HAPUS */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 380, textAlign: "center" }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ marginBottom: 10 }}>Hapus Produk?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 28 }}>
              Produk <strong>"{confirmDelete.name}"</strong> akan dihapus
              permanen dan tidak bisa dikembalikan.
            </p>
            <div
              className="modal-actions"
              style={{ justifyContent: "center", gap: 12 }}
            >
              <button
                className="btn-cancel"
                onClick={() => setConfirmDelete(null)}
              >
                Batal
              </button>
              <button className="btn-delete" onClick={confirmDeleteProduct}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRUD - Tambah / Edit Produk */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>
              {modalMode === "add" ? "➕ Tambah Produk" : "✏️ Edit Produk"}
            </h3>
            <form onSubmit={handleSubmit} noValidate>
              {/* Nama Produk */}
              <div className="modal-input-group floating">
                <input
                  type="text"
                  placeholder=" "
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
                <label>Nama Produk *</label>
              </div>

              {/* Ukuran */}
              <div className="modal-input-group floating">
                <input
                  type="text"
                  placeholder=" "
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                />
                <label>Ukuran (S/M/L/XL atau kosongkan)</label>
              </div>

              {/* Kategori */}
              <div className="modal-input-group">
                <label className="select-label">Kategori *</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Harga & Stok */}
              <div className="modal-row">
                <div className="modal-input-group floating">
                  <input
                    type="number"
                    placeholder=" "
                    min="1"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                  />
                  <label>Harga (Rp) *</label>
                </div>
                <div className="modal-input-group floating">
                  <input
                    type="number"
                    placeholder=" "
                    min="0"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    required
                  />
                  <label>Stok *</label>
                </div>
              </div>

              {/* Deskripsi */}
              <div className="modal-input-group floating">
                <textarea
                  placeholder=" "
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="3"
                />
                <label>Deskripsi</label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-save">
                  {modalMode === "add" ? "Tambah" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashcashier;