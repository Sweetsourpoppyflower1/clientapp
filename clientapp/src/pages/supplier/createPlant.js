import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreatePlant() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [form, setForm] = useState({
    supplier_id: "",
    plant_name: "",
    description: "",
    quantity: "",
    price: "",
    isAvailable: true,
    status: "draft",
  });

  useEffect(() => {
    const stored = localStorage.getItem("supplier");
    if (!stored) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      const normalized = {
        SupplierId:
          parsed?.SupplierId ??
          parsed?.supplierId ??
          parsed?.supplier_id ??
          parsed?.id ??
          null,
        Name:
          parsed?.Name ?? parsed?.name ?? parsed?.s_name ?? "",
        Email:
          parsed?.Email ?? parsed?.email ?? parsed?.s_email ?? "",
      };

      if (!normalized.SupplierId && !normalized.Email) throw new Error("invalid user");

      setUser(normalized);

      if (normalized.SupplierId) {
        setForm((s) => ({ ...s, supplier_id: String(normalized.SupplierId) }));
      }
    } catch {
      localStorage.removeItem("supplier");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((s) => ({ ...s, [name]: checked }));
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
  }

  function validate() {
    if (!form.supplier_id || isNaN(Number(form.supplier_id))) return "You must be signed in as a supplier.";
    if (!form.plant_name || !form.plant_name.trim()) return "Plant name is required.";
    if (form.price === "" || isNaN(Number(form.price))) return "Price is required and must be a number.";
    if (form.quantity === "" || isNaN(Number(form.quantity)) || !Number.isInteger(Number(form.quantity))) return "Quantity is required and must be an integer.";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    const err = validate();
    if (err) {
      setMessage({ type: "error", text: err });
      return;
    }

    setLoading(true);

    // compute status from availability: available => active, else draft
    const computedStatus = form.isAvailable ? "active" : "draft";

    const payload = {
      supplier_id: Number(form.supplier_id),
      plant_name: form.plant_name.trim(),
      description: form.description?.trim() ?? "",
      quantity: Number(form.quantity),
      price: Number(form.price),
      isAvailable: !!form.isAvailable,
      pl_status: computedStatus,
    };

    try {
      const res = await fetch("/api/Plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`Server error: ${res.status} ${text}`);
      }

      await res.json().catch(() => null);
      setMessage({ type: "success", text: "Plant created successfully." });

      // reset form but keep supplier_id
      setForm((s) => ({
        supplier_id: s.supplier_id,
        plant_name: "",
        description: "",
        quantity: "",
        price: "",
        isAvailable: true,
        status: "draft",
      }));

      // optional: navigate to My Plants after short delay
      setTimeout(() => navigate("/myPlants"), 900);
    } catch (ex) {
      console.error("Failed to create plant:", ex);
      setMessage({ type: "error", text: "Failed to create plant. Check server logs or network." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <header className="header">
        <div className="header-left">
          <h1 className="title">Add Plant</h1>
          <div className="subtitle">
            Signed in as <strong>{user?.Name}</strong> ({user?.Email})
          </div>
        </div>

        <div className="header-actions">
          <button className="button" onClick={() => navigate("/supplierDashboard")} style={{ marginRight: 8 }}>
            Dashboard
          </button>
          <button className="button" onClick={() => { localStorage.removeItem("supplier"); navigate("/login"); }}>
            Logout
          </button>
        </div>
      </header>

      {message && (
        <div className={message.type === "error" ? "alert alert-danger" : "alert alert-success"} style={{ marginTop: 12 }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
        <div className="form-group">
          <label>Plant Name</label>
          <input name="plant_name" value={form.plant_name} onChange={handleChange} className="form-control" type="text" />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="form-control" rows="3" />
        </div>

        <div className="form-group">
          <label>Quantity</label>
          <input name="quantity" value={form.quantity} onChange={handleChange} className="form-control" type="number" step="1" />
        </div>

        <div className="form-group">
          <label>Price</label>
          <input name="price" value={form.price} onChange={handleChange} className="form-control" type="number" step="0.01" />
        </div>

        <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input id="isAvailable" name="isAvailable" type="checkbox" checked={!!form.isAvailable} onChange={handleChange} />
          <label htmlFor="isAvailable">Available / Active</label>
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create Plant"}
          </button>
        </div>
      </form>
    </div>
  );
}