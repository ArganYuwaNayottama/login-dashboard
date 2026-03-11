import { useState } from "react";
import "./Header.css";
import logo from "../assets/Logo.png";

function Header({
  searchQuery,
  setSearchQuery,
  showProfile,
  setShowProfile,
  showCategory,
  setShowCategory,
  profileRef,
  categoryRef,
  username,
  handleLogout,
  activeTab,
  setActiveTab,
}) {
  const points = parseInt(localStorage.getItem("points")) || 0;
  const level = Math.floor(points / 100);
  const progress = points % 100;
  const role = localStorage.getItem("role");

  const [label, setLabel] = useState(
    activeTab === "kelola" ? "Kelola" : "Lihat",
  );

  const getLevelColor = () => {
    if (progress <= 49) return "#22c55e";
    if (progress <= 89) return "#facc15";
    return "#ef4444";
  };

  const handleToggle = () => {
    const next = activeTab === "kelola" ? "lihat" : "kelola";
    setActiveTab(next);
    setTimeout(() => {
      setLabel(next === "kelola" ? "Kelola" : "Lihat");
    }, 200);
  };

  return (
    <header className="dashboard-header">
      <div className="logo">
        <img src={logo} alt="Arbook Logo" className="logo-img" />
        <span className="brand-name">Arbook</span>
      </div>

      <div className="header-center">
        <div
          className="category-filter"
          ref={categoryRef}
          onClick={() => setShowCategory(!showCategory)}
        >
        </div>

        <input
          type="text"
          placeholder="Cari buku favoritmu..."
          className="search-bar"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {role === "cashier" || role === "admin" ? (
          <div
            className={`mode-toggle ${activeTab === "kelola" ? "mode-kelola" : "mode-lihat"}`}
            onClick={handleToggle}
          >
            <div className="mode-thumb">
              <span className="mode-label">{label}</span>
            </div>
          </div>
        ) : (
          <div className="cart-icon">
            🛒
            <span className="cart-badge-static">0</span>
          </div>
        )}
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
                  style={{ width: `${progress}%`, background: getLevelColor() }}
                />
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
  );
}

export default Header;
