import React, { useEffect } from "react";

function Dashadmin() {
  useEffect(() => {
    document.title = "Website Toko Buku | Arbook.com";
  }, []);

  return <div>Admin Dashboard</div>;
}

export default Dashadmin;
