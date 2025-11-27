import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateAuctionsMA() {
    const [plantOptions, setPlantOptions] = useState([]);
    const [form, setForm] = useState({
         auctionmaster_id: "",
         plant_id: "",
         au_start_time: "",
         au_end_time: "",
         au_start_price: "",
         au_min_price: "",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem("auctionMaster");
        if (!stored) {
            navigate("/login", { replace: true });
            return;
        }

        try {
            const parsed = JSON.parse(stored);

            const normalized = {
                AuctionMasterId:
                    parsed?.AuctionMasterId ??
                    parsed?.auctionMasterId ??
                    parsed?.auctionmaster_id ??
                    parsed?.id ??
                    null,
                Name:
                    parsed?.Name ??
                    parsed?.name ??
                    parsed?.am_name ??
                    "",
                Email:
                    parsed?.Email ??
                    parsed?.email ??
                    parsed?.am_email ??
                    ""
            };

            if (!normalized.AuctionMasterId && !normalized.Email) throw new Error("invalid user");

            setUser(normalized);

            if (normalized.AuctionMasterId) {
              setForm((s) => ({ ...s, auctionmaster_id: String(normalized.AuctionMasterId) }));
            }
        } catch {
            localStorage.removeItem("auctionMaster");
            navigate("/login", { replace: true });
            return;
        }
    }, [navigate]);

    useEffect(() => {
      let mounted = true;
      fetch("/api/Plants")
        .then((r) => (r.ok ? r.json() : Promise.reject(r)))
        .then((data) => { if (mounted) setPlantOptions(Array.isArray(data) ? data : []); })
        .catch((err) => { console.error("Failed to fetch plants:", err); if (mounted) setPlantOptions([]); });
      return () => { mounted = false; };
    }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function getPlantLabel(p) {
    if (p == null) return "";
    return (
      p.plant_name ??
      p.name ??
      p.plantName ??
      p.p_name ??
      p.displayName ??
      (p.plant_id ? String(p.plant_id) : String(p.id ?? p))
    );
  }

  function getPlantValue(p) {
    if (p == null) return "";
    return String(p.plant_id ?? p.id ?? p);
  }

  function validate() {
    if (!form.auctionmaster_id || isNaN(Number(form.auctionmaster_id))) return "You must be signed in as an auction master.";
    if (!form.plant_id) return "Please select a plant.";
    if (!form.au_start_time || !form.au_end_time) return "Start and end time are required.";
    if (new Date(form.au_start_time) >= new Date(form.au_end_time)) return "Start time must be before end time.";
    if (!form.au_start_price || isNaN(Number(form.au_start_price))) return "Start price is required and must be a number.";
    if (form.au_min_price !== "" && isNaN(Number(form.au_min_price))) return "Min price must be a number if provided.";
    if (form.au_min_price !== "" && Number(form.au_min_price) > Number(form.au_start_price)) return "Min price must not exceed the start price.";
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

    const now = new Date();
    const start = new Date(form.au_start_time);
    const end = new Date(form.au_end_time);
    let computedStatus = "upcoming";
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      computedStatus = "upcoming";
    } else if (now < start) {
      computedStatus = "upcoming";
    } else if (now > end) {
      computedStatus = "completed";
    } else {
      computedStatus = "active";
    }

    const payload = {
      auctionmaster_id: Number(form.auctionmaster_id),
      plant_id: Number(form.plant_id),
      au_start_time: form.au_start_time,
      au_end_time: form.au_end_time,
      au_start_price: Number(form.au_start_price),
      au_status: computedStatus,
    };

    if (form.au_min_price !== "") {
      payload.au_min_price = Number(form.au_min_price);
    }

    try {
      const res = await fetch("/api/Auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`Server error: ${res.status} ${text}`);
      }

      await res.json().catch(() => null);
      setMessage({ type: "success", text: "Auction created successfully." });

      setForm((s) => ({
        auctionmaster_id: s.auctionmaster_id,
        plant_id: "",
        au_start_time: "",
        au_end_time: "",
        au_start_price: "",
        au_min_price: "",
      }));
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to create auction. Check server logs or network." });
    } finally {
      setLoading(false);
    }
  }

  return (
      <div className="master-create-auction container">
          <header className="header">
              <div className="header-left">
                  <h1 className="title">Create Auction</h1>
                  <div className="subtitle">
                      Signed in as <strong>{user?.Name}</strong> ({user?.Email})
                  </div>
              </div>

              <div className="header-actions">
                  <button className="button" onClick={() => navigate("/auctionmasterDashboard")} style={{ marginRight: 8 }}>
                      Dashboard
                  </button>
                  <button className="button" onClick={() => { localStorage.removeItem("auctionMaster"); navigate("/login"); }}>
                      Logout
                  </button>
              </div>
          </header>

      {message && (
        <div className={message.type === "error" ? "alert alert-danger" : "alert alert-success"}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Plant</label>
          <select name="plant_id" value={form.plant_id} onChange={handleChange} className="form-control">
            <option value="">-- select plant --</option>
            {plantOptions.map((p, idx) => {
              const val = getPlantValue(p);
              const label = getPlantLabel(p);
              return (
                <option key={val + "-" + idx} value={val}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>

        <div className="form-group">
          <label>Start Time</label>
          <input name="au_start_time" value={form.au_start_time} onChange={handleChange} className="form-control" type="datetime-local" />
        </div>

        <div className="form-group">
          <label>End Time</label>
          <input name="au_end_time" value={form.au_end_time} onChange={handleChange} className="form-control" type="datetime-local" />
        </div>

        <div className="form-group">
          <label>Start Price</label>
          <input name="au_start_price" value={form.au_start_price} onChange={handleChange} className="form-control" type="number" step="0.01" />
        </div>

        <div className="form-group">
          <label>Min Price (reserve if unsold)</label>
          <input name="au_min_price" value={form.au_min_price} onChange={handleChange} className="form-control" type="number" step="0.01" />
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create Auction"}
          </button>
        </div>
      </form>
    </div>
  );
}