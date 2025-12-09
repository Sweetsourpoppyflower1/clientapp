import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../../styles/supplierPages/supplierDashboardStyle.css';

export default function SAddProduct() {
  const navigate = useNavigate();

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [form, setForm] = useState("");
  const [quality, setQuality] = useState("");
  const [minStem, setMinStem] = useState(1);
  const [stemsBunch, setStemsBunch] = useState(10);
  const [maturity, setMaturity] = useState("");
  const [primaryImageFile, setPrimaryImageFile] = useState(null);
  const [secondaryImages, setSecondaryImages] = useState([]);

  // New auction lot fields
  const [unitPerContainer, setUnitPerContainer] = useState(1);
  const [containersInLot, setContainersInLot] = useState(1);
  const [minPickup, setMinPickup] = useState(1);
  const [startQuantity, setStartQuantity] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const API_ENDPOINT = "/api/supplier/products"; // adjust to your backend route

  function resetForm() {
    setProductName("");
    setDescription("");
    setCategory("");
    setForm("");
    setQuality("");
    setMinStem(1);
    setStemsBunch(10);
    setMaturity("");
    setPrimaryImageFile(null);
    setSecondaryImages([]);

    // reset new fields
    setUnitPerContainer(1);
    setContainersInLot(1);
    setMinPickup(1);
    setStartQuantity(1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!productName || !category) {
      setError("Please provide at least a product name and category.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");

      const formData = new FormData();
      formData.append("productname", productName);
      formData.append("desc", description);
      formData.append("category", category);
      formData.append("form", form);
      formData.append("quality", quality);
      formData.append("min_stem", String(minStem));
      formData.append("stems_bunch", String(stemsBunch));
      formData.append("maturity", maturity);

      // append new auction lot fields
      formData.append("UnitPerContainer", String(unitPerContainer));
      formData.append("ContainersInLot", String(containersInLot));
      formData.append("MinPickup", String(minPickup));
      formData.append("StartQuantity", String(startQuantity));

      if (primaryImageFile) {
        // primary image (only one allowed)
        formData.append("image", primaryImageFile);
      }

      // append any secondary images (multiple allowed)
      secondaryImages.forEach((file) => {
        formData.append("secondaryImages", file);
      });

      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(txt || `Request failed (${res.status})`);
      }

      await res.json().catch(() => null);
      setSuccessMsg("Product added successfully.");
      resetForm();

      setTimeout(() => {
        navigate("/supplier/dashboard");
      }, 900);
    } catch (err) {
      setError(err.message || "Failed to add product.");
    } finally {
      setLoading(false);
    }
  }

  // add new secondary files (appends, avoids duplicates by name)
  function handleSecondaryFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setSecondaryImages((prev) => {
      const existingNames = new Set(prev.map(f => f.name));
      const toAdd = files.filter(f => !existingNames.has(f.name));
      return [...prev, ...toAdd];
    });

    // reset input value so same file can be selected again if removed
    e.target.value = "";
  }

  function removeSecondaryAt(index) {
    setSecondaryImages((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="sd-page">
      <header className="sd-topbar" style={{ position: "relative" }}>
        <div className="sd-left" aria-hidden>
          <button aria-label="menu" className="sd-icon-btn sd-hamburger">
            <span />
            <span />
            <span />
          </button>
        </div>

        <div className="sd-logo">Flauction</div>

        <div className="sd-right" aria-hidden />
      </header>

      <main className="sd-main" style={{ gridTemplateColumns: "1fr", paddingTop: 20 }}>
        <section style={{ width: "100%" }}>
          <div className="sd-stock">
            <div className="sd-stock-header">
              <div className="sd-stock-icon">＋</div>
              <div className="sd-stock-title">Add Product</div>
            </div>

            <div className="sd-stock-body" role="region" aria-label="Add product form">
              <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 700 }}>
                <label>
                  Product name
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    style={{ display: "block", width: "100%", marginTop: 6 }}
                  />
                </label>

                <label>
                  Category
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Roses, Succulents"
                    style={{ display: "block", width: "100%", marginTop: 6 }}
                  />
                </label>

                <div style={{ display: "flex", gap: 12 }}>
                  <label style={{ flex: 1 }}>
                    Form
                    <select
                      value={form}
                      onChange={(e) => setForm(e.target.value)}
                      style={{ display: "block", width: "100%", marginTop: 6 }}
                    >
                      <option value="">Select form</option>
                      <option value="cut">Cut</option>
                      <option value="potted">Potted</option>
                      <option value="bare-root">Bare-root</option>
                    </select>
                  </label>

                  <label style={{ flex: 1 }}>
                    Quality
                    <select
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      style={{ display: "block", width: "100%", marginTop: 6 }}
                    >
                      <option value="">Select quality</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </label>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <label style={{ flex: 1 }}>
                    Min stems
                    <input
                      type="number"
                      min="1"
                      value={minStem}
                      onChange={(e) => setMinStem(Math.max(1, Number(e.target.value) || 1))}
                      style={{ display: "block", width: "100%", marginTop: 6 }}
                    />
                  </label>

                  <label style={{ flex: 1 }}>
                    Stems per bunch
                    <input
                      type="number"
                      min="1"
                      value={stemsBunch}
                      onChange={(e) => setStemsBunch(Math.max(1, Number(e.target.value) || 1))}
                      style={{ display: "block", width: "100%", marginTop: 6 }}
                    />
                  </label>
                </div>

                {/* Auction lot fields */}
                <div style={{ display: "flex", gap: 12 }}>
                  <label style={{ flex: 1 }}>
                    Unit per container
                    <input
                      type="number"
                      min="1"
                      value={unitPerContainer}
                      onChange={(e) => setUnitPerContainer(Math.max(1, Number(e.target.value) || 1))}
                      style={{ display: "block", width: "100%", marginTop: 6 }}
                    />
                  </label>

                  <label style={{ flex: 1 }}>
                    Containers in lot
                    <input
                      type="number"
                      min="1"
                      value={containersInLot}
                      onChange={(e) => setContainersInLot(Math.max(1, Number(e.target.value) || 1))}
                      style={{ display: "block", width: "100%", marginTop: 6 }}
                    />
                  </label>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <label style={{ flex: 1 }}>
                    Min pickup
                    <input
                      type="number"
                      min="1"
                      value={minPickup}
                      onChange={(e) => setMinPickup(Math.max(1, Number(e.target.value) || 1))}
                      style={{ display: "block", width: "100%", marginTop: 6 }}
                    />
                  </label>

                  <label style={{ flex: 1 }}>
                    Start quantity
                    <input
                      type="number"
                      min="0"
                      value={startQuantity}
                      onChange={(e) => setStartQuantity(Math.max(0, Number(e.target.value) || 0))}
                      style={{ display: "block", width: "100%", marginTop: 6 }}
                    />
                  </label>
                </div>

                <label>
                  Maturity
                  <select
                    value={maturity}
                    onChange={(e) => setMaturity(e.target.value)}
                    style={{ display: "block", width: "100%", marginTop: 6 }}
                  >
                    <option value="">Select maturity</option>
                    <option value="bud">Bud</option>
                    <option value="half-open">Half-open</option>
                    <option value="open">Open</option>
                  </select>
                </label>

                <label>
                  Description
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    style={{ display: "block", width: "100%", marginTop: 6 }}
                  />
                </label>

                <label>
                  Primary Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPrimaryImageFile(e.target.files?.[0] ?? null)}
                    style={{ display: "block", width: "100%", marginTop: 6 }}
                  />
                  {primaryImageFile && (
                    <div style={{ marginTop: 8 }}>
                      Selected: {primaryImageFile.name}
                      <button type="button" onClick={() => setPrimaryImageFile(null)} style={{ marginLeft: 8 }}>
                        Remove
                      </button>
                    </div>
                  )}
                </label>

                <label>
                  Secondary Images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleSecondaryFiles}
                    style={{ display: "block", width: "100%", marginTop: 6 }}
                  />
                </label>

                {secondaryImages.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Secondary images:</div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {secondaryImages.map((f, i) => (
                        <li key={`${f.name}-${i}`} style={{ marginBottom: 6 }}>
                          {f.name}
                          <button
                            type="button"
                            onClick={() => removeSecondaryAt(i)}
                            style={{ marginLeft: 10 }}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ display: "flex", gap: 12 }}>
                  <button className="sd-logout" type="submit" disabled={loading} style={{ padding: "8px 14px" }}>
                    {loading ? "Saving..." : "Save product"}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/supplier/dashboard")}
                    className="sd-settings"
                    style={{ padding: "8px 14px", background: "transparent", color: "inherit" }}
                  >
                    Cancel
                  </button>
                </div>

                {error && <div style={{ color: "crimson" }}>{error}</div>}
                {successMsg && <div style={{ color: "green" }}>{successMsg}</div>}
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}