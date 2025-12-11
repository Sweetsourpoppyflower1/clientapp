import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import '../../styles/supplierPages/s_addProductStyle.css';
import SupplierNavigationDropdownMenu from "../../dropdown_menus/navigation_menus/supplier/supplier_navigation_dropdown_menu";
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";

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

  const [logo, setLogo] = useState(null);
  const userName = 'user';
  const userRole = 'Supplier';

  const [startPrice, setStartPrice] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [unitPerContainer, setUnitPerContainer] = useState(1);
  const [minPickup, setMinPickup] = useState(1);
  const [totalQuantity, setTotalQuantity] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

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
    setStartPrice(0);
    setMinPrice(0);
    setUnitPerContainer(1);
    setMinPickup(1);
    setTotalQuantity(1);
  }

  useEffect(() => {
    const mediaId = 1;
    fetch(`/api/Media/${mediaId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch media');
        return res.json();
      })
      .then(m => {
        const normalizedUrl = m.url && !m.url.startsWith('/') ? `/${m.url}` : m.url;
        setLogo({ url: normalizedUrl, alt: m.alt_text || m.altText || '' });
      })
      .catch(() => { /* silent fallback */ });
  }, []);

  async function uploadPlantMedia(file, plantId, isPrimary, token) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("plant_id", String(plantId));
    fd.append("alt_text", file.name || "");
    fd.append("is_primary", isPrimary ? "true" : "false");

    const res = await fetch("/api/MediaPlant/upload", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd,
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => null);
      throw new Error(txt || `MediaPlant upload failed (${res.status})`);
    }

    const json = await res.json().catch(() => null);
    return {
      url: json.url || json.Url || json.imageUrl || json.url_path || (json?.data && json.data.url),
      alt_text: json.alt_text || json.AltText || file.name,
      mediaplant_id: json.mediaplant_id || json.MediaPlantId || json.id,
    };
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
      const userDataStr = localStorage.getItem("user_data");
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      
      if (!userData || !userData.supplierId) {
        setError("User data not found. Please log in again.");
        setLoading(false);
        return;
      }

      const plantPayload = {
        supplier_id: userData.supplierId,
        productname: productName,
        desc: description,
        category: category,
        form: form,
        quality: quality,
        min_stem: String(minStem),
        stems_bunch: String(stemsBunch),
        maturity: maturity,
        start_price: Number(startPrice),
        min_price: Number(minPrice)
      };

      const plantRes = await fetch("/api/Plants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(plantPayload),
      });

      if (!plantRes.ok) {
        const txt = await plantRes.text().catch(() => null);
        throw new Error(txt || `Failed to create plant (${plantRes.status})`);
      }

      const createdPlant = await plantRes.json();
      const plantId = createdPlant.plant_id || createdPlant.PlantId || createdPlant.id;
      if (!plantId) throw new Error("Server did not return a plant id.");

      const lotPayload = {
        plant_id: Number(plantId),
        unit_per_container: Number(unitPerContainer),
        min_pickup: Number(minPickup),
        start_quantity: Number(totalQuantity),
        remaining_quantity: Number(totalQuantity)
      };

      const lotRes = await fetch("/api/AuctionLots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(lotPayload),
      });

      if (!lotRes.ok) {
        const txt = await lotRes.text().catch(() => null);
        throw new Error(txt || `Failed to create auction lot (${lotRes.status})`);
      }

      if (primaryImageFile) {
        await uploadPlantMedia(primaryImageFile, plantId, true, token);
      }

      for (const file of secondaryImages) {
        await uploadPlantMedia(file, plantId, false, token);
      }

      setSuccessMsg("Product, auction lot and media saved successfully.");
      resetForm();

      setTimeout(() => {
        navigate("/supplierDashboard");
      }, 900);
    } catch (err) {
      setError(err.message || "Failed to add product.");
    } finally {
      setLoading(false);
    }
  }

  function handleSecondaryFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setSecondaryImages((prev) => {
      const existingNames = new Set(prev.map(f => f.name));
      const toAdd = files.filter(f => !existingNames.has(f.name));
      return [...prev, ...toAdd];
    });

    e.target.value = "";
  }

  function removeSecondaryAt(index) {
    setSecondaryImages((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="sd-page">
      <header className="sd-topbar">
        <div className="sd-left" aria-hidden>
      
        </div>

        <div className="sd-logo">
          {logo ? (
            <img src={logo.url} alt={logo.alt} className="top-logo" />
          ) : (
            <span className="loading-label">Loading…</span>
          )}
        </div>

        <div className="sd-right" aria-hidden />
      </header>

      <main className="sd-main">
        <section>
          <div className="sd-stock">
            <div className="sd-stock-header">
              <div className="sd-stock-icon">＋</div>
              <div className="sd-stock-title">Add Product</div>
            </div>

            <div className="sd-stock-body" role="region" aria-label="Add product form">
              <form onSubmit={handleSubmit} className="add-product-form">
                
                {/* Column 1: Basic Info */}
                <div className="form-column">
                  <div className="form-group">
                    <label className="form-label form-required">Product name</label>
                    <input
                      type="text"
                      required
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label form-required">Category</label>
                    <input
                      type="text"
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Roses, Succulents"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Form</label>
                    <select
                      value={form}
                      onChange={(e) => setForm(e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select form</option>
                      <option value="cut">Cut</option>
                      <option value="potted">Potted</option>
                      <option value="bare-root">Bare-root</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quality</label>
                    <select
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select quality</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Min stems</label>
                    <input
                      type="number"
                      min="1"
                      value={minStem}
                      onChange={(e) => setMinStem(Math.max(1, Number(e.target.value) || 1))}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stems per bunch</label>
                    <input
                      type="number"
                      min="1"
                      value={stemsBunch}
                      onChange={(e) => setStemsBunch(Math.max(1, Number(e.target.value) || 1))}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Maturity</label>
                    <select
                      value={maturity}
                      onChange={(e) => setMaturity(e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select maturity</option>
                      <option value="bud">Bud</option>
                      <option value="half-open">Half-open</option>
                      <option value="open">Open</option>
                    </select>
                  </div>
                </div>

                {/* Column 2: Pricing & Auction */}
                <div className="form-column">
                  <div className="form-group">
                    <label className="form-label">Start Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={startPrice}
                      onChange={(e) => setStartPrice(Math.max(0, Number(e.target.value) || 0))}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Min Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={minPrice}
                      onChange={(e) => setMinPrice(Math.max(0, Number(e.target.value) || 0))}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unit per container</label>
                    <input
                      type="number"
                      min="1"
                      value={unitPerContainer}
                      onChange={(e) => setUnitPerContainer(Math.max(1, Number(e.target.value) || 1))}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Min pickup</label>
                    <input
                      type="number"
                      min="1"
                      value={minPickup}
                      onChange={(e) => setMinPickup(Math.max(1, Number(e.target.value) || 1))}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Total quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={totalQuantity}
                      onChange={(e) => setTotalQuantity(Math.max(0, Number(e.target.value) || 0))}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Column 3: Description & Media */}
                <div className="form-column">
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="form-textarea"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Primary Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPrimaryImageFile(e.target.files?.[0] ?? null)}
                      className="form-file"
                    />
                    {primaryImageFile && (
                      <div className="file-feedback file-feedback-success">
                        ✓ {primaryImageFile.name}
                        <button type="button" onClick={() => setPrimaryImageFile(null)} className="btn-danger">
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Secondary Images</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleSecondaryFiles}
                      className="form-file"
                    />
                    {secondaryImages.length > 0 && (
                      <div className="file-feedback">
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>({secondaryImages.length}) files:</div>
                        <ul className="file-feedback-list">
                          {secondaryImages.map((f, i) => (
                            <li key={`${f.name}-${i}`} className="file-feedback-item">
                              {f.name}
                              <button type="button" onClick={() => removeSecondaryAt(i)} className="btn-danger">
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Footer with buttons */}
            <div className="form-footer">
              <button onClick={handleSubmit} disabled={loading} className="btn btn-primary">
                {loading ? "Saving..." : "Save product"}
              </button>

              <button type="button" onClick={() => navigate("/supplierDashboard")} className="btn btn-secondary">
                Cancel
              </button>

              {error && (
                <div className="form-footer-status status-error">
                  <span className="status-icon">⚠</span>
                  <span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="form-footer-status status-success">
                  <span className="status-icon">✓</span>
                  <span>{successMsg}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <SupplierNavigationDropdownMenu navigateFn={(p) => navigate(p)} />
      <AccountDropdownMenu userName={userName} userRole={userRole} />
    </div>
  );
}
