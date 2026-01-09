import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';
import "../../styles/companyPages/c_auctionsStyle.css";
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";
import CompanyNavigationDropdownMenu from "../../dropdown_menus/navigation_menus/company/company_navigation_dropdown_menu";

const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

const inlinePlaceholder =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='90'>
      <rect fill='#ddd' width='100%' height='100%'/><text x='50%' y='50%'
      dominant-baseline='middle' text-anchor='middle' fill='#888'
      font-family='Arial' font-size='12'>No image</text></svg>`
    );

const resolveUrl = (url = "") =>
    !url ? "" : url.startsWith("http") ? url : `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;

const safeJson = (res) => res.json().catch(() => null).then((d) => (d && typeof d === "object" ? d : null));
const fetchMaybe = async (url) => {
    try {
        const r = await fetch(url, { credentials: "same-origin" });
        return r.ok ? safeJson(r) : null;
    } catch {
        return null;
    }
};
const fetchArray = async (url) => {
    const data = await fetchMaybe(url);
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (typeof data === "object" ) return [data];
    return [];
};

const getId = (a) => a?.id ?? a?.auction_id ?? a?.AuctionId ?? `${a?.auctionmaster_id}-${a?.plant_id}-${a?.startDate ?? a?.start_time}`;
const priceOf = (a) => Number(a.startPrice ?? a.minPrice ?? 0);
const dateOf = (a) => a.startDate || a.start_time || null;
const parseUtcDate = (s) => {
    if (!s) return null;
    if (/(?:Z|[+\-]\d{2}:\d{2})$/i.test(s)) return new Date(s);
    return new Date(`${s}Z`);
};

function AuctionCard({ a }) {
    const navigate = useNavigate();
    const [imageIndex, setImageIndex] = useState(0);

    const images = Array.isArray(a.images) && a.images.length > 0 ? a.images : [a.imageUrl || inlinePlaceholder];

    const handleViewAuction = () => {
        navigate(`/ActiveAuction/${a.auction_id || a.id}`);
    };

    const handleSeeInfo = () => {
        navigate(`/cSeeInfoAuction/${a.auction_id || a.id}`);
    };

    const handlePrevImage = (e) => {
        e.stopPropagation();
        setImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleNextImage = (e) => {
        e.stopPropagation();
        setImageIndex((prev) => (prev + 1) % images.length);
    };

    return (
        <div className="c-auctions-auction-card">
            <div className="c-auctions-image-wrapper">
                <img className="c-auctions-thumb" src={images[imageIndex]} alt={a.plantName ?? a.title ?? "image"} />
                {images.length > 1 && (
                    <>
                        <button 
                            className="c-auctions-img-nav-btn left" 
                            onClick={handlePrevImage}
                            aria-label="Previous image"
                        >
                            ‹
                        </button>
                        <button 
                            className="c-auctions-img-nav-btn right" 
                            onClick={handleNextImage}
                            aria-label="Next image"
                        >
                            ›
                        </button>
                        <div className="c-auctions-img-counter">
                            {imageIndex + 1} / {images.length}
                        </div>
                    </>
                )}
            </div>
            <div className="c-auctions-meta-column">
                <div className="c-auctions-title-row">
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>{a.plantName ?? a.title}</div>
                        <div className="c-auctions-small-muted" style={{ marginTop: 6 }}>{a.supplierName}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>€ {priceOf(a).toFixed(2)}</div>
                        <div className="c-auctions-small-muted">
                            Starts: {dateOf(a) ? parseUtcDate(dateOf(a)).toLocaleString() : "—"}
                        </div>
                    </div>
                </div>

                <div className="c-auctions-specs-grid">
                    <div>Category: <strong>{a.category ?? "—"}</strong></div>
                    <div>Form: <strong>{a.form ?? "—"}</strong></div>
                    <div>Quality: <strong>{a.quality ?? "—"}</strong></div>
                    <div>Stems/Bunch: <strong>{a.stemsPerBunch ?? a.stems_bunch ?? "—"}</strong></div>
                    <div>Min Stems: <strong>{a.minStems ?? a.min_stem ?? "—"}</strong></div>
                    <div>Maturity: <strong>{a.maturity ?? "—"}</strong></div>
                    <div>Duration: <strong>{a.durationMinutes ?? a.duration_minutes ?? "—"} min</strong></div>
                </div>

                <div className="c-auctions-description-box">
                    <div className="c-auctions-description-text">
                        {(a.description ?? a.desc ?? "").slice(0, 200)}
                    </div>
                </div>
                <div className="c-auctions-button-box">
                    <button className="c-auctions-cta-wide" onClick={handleSeeInfo}>
                        See info
                    </button>
                    <button className="c-auctions-cta-wide" onClick={handleViewAuction}>
                        Go to auction
                    </button>
                </div>  
            </div>
        </div>
    );
}

export default function CAuctions() {
    const navigate = useNavigate();
    const [active, setActive] = useState([]);
    const [upcoming, setUpcoming] = useState([]);
    const [loading, setLoading] = useState(true);
    const [logo, setLogo] = useState(null);


    // filters & controls
    const [query, setQuery] = useState("");
    const [priceMin, setPriceMin] = useState(0);
    const [priceMax, setPriceMax] = useState(100);
    const [selectedCategories, setSelectedCategories] = useState(new Set());
    const [selectedForms, setSelectedForms] = useState(new Set());
    const [quality, setQuality] = useState("");
    const [minStems, setMinStems] = useState(0);
    const [stemsPerBunch, setStemsPerBunch] = useState(0);
    const [maturity, setMaturity] = useState("");
    const [sort, setSort] = useState("relevance");
    const [page, setPage] = useState(1);
    const perPage = 6;

    useEffect(() => {
        // Top logo (media id 1)
        const mediaId = 1;
        fetch(`/api/Media/${mediaId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch media');
                return res.json();
            })
            .then(m => {
                const normalizedUrl = m.url && !m.url.startsWith('/') ? `/${m.url}` : m.url;
                setLogo({ url: normalizedUrl, alt: m.alt_text });
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const auctions = await fetchArray("/api/auctions");
                if (!mounted || !auctions.length) {
                    if (mounted) { setActive([]); setUpcoming([]); }
                    return;
                }

                const plantIds = [...new Set(auctions.map((a) => a.plant_id ?? a.plantId).filter(Boolean))];
                const supplierIds = [...new Set(auctions.map((a) => a.supplier_id ?? a.supplierId ?? a.auctionmaster_id).filter(Boolean))];

                // plants
                let plants = (await fetchMaybe(`/api/Plants?ids=${plantIds.join(",")}`)) ?? (await fetchMaybe(`/api/Plants/batch?ids=${plantIds.join(",")}`));
                if (!plants || (Array.isArray(plants) && plants.length === 0)) {
                    const r = await Promise.all(plantIds.map((id) => fetchMaybe(`/api/Plants/${id}`)));
                    plants = r.flat().filter(Boolean);
                }
                plants = plants?.flat?.() || [];

                const plantsById = new Map(plants.map((p) => [Number(p?.plant_id ?? p?.id), p]).filter(Boolean));

                // media 
                const mediaPayload = await fetchMaybe("/api/MediaPlant");
                const mediaByPlant = new Map();
                if (Array.isArray(mediaPayload)) {
                    mediaPayload.filter(m => plantIds.includes(Number(m.plant_id))).forEach(m => {
                        const pid = Number(m.plant_id);
                        if (!mediaByPlant.has(pid)) mediaByPlant.set(pid, []);
                        mediaByPlant.get(pid).push(m);
                    });
                    mediaByPlant.forEach((arr, pid) => {
                        arr.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
                        mediaByPlant.set(pid, arr.map(x => resolveUrl(x.url)).filter(Boolean));
                    });
                }

                // suppliers
                let suppliers = (await fetchMaybe(`/api/Suppliers?ids=${supplierIds.join(",")}`)) ?? null;
                if (!suppliers || (Array.isArray(suppliers) && suppliers.length === 0)) {
                    const r = await Promise.all(supplierIds.map((id) => fetchMaybe(`/api/Suppliers/${id}`)));
                    suppliers = r.flat().filter(Boolean);
                }
                suppliers = suppliers?.flat?.() || [];
                const suppliersById = new Map(suppliers.map(s => [String(s?.id ?? s?.supplier_id), s]).filter(Boolean));

                // merge auctions
                const merged = [];
                const mapByKey = new Map();
                for (const a of auctions) {
                    const key = String(getId(a));
                    const pid = a.plant_id ?? a.plantId;
                    const plant = pid ? plantsById.get(Number(pid)) : null;
                    const media = pid ? mediaByPlant.get(Number(pid)) : undefined;
                    const supplierId = plant?.supplier_id ?? a.supplier_id ?? a.supplierId ?? a.auctionmaster_id;
                    const supplier = supplierId ? suppliersById.get(String(supplierId)) : null;

                    const enriched = {
                        ...a,
                        plantName: plant?.productname ?? plant?.productName ?? a.plantName ?? a.title,
                        category: plant?.category ?? a.category,
                        form: plant?.form ?? a.form,
                        quality: plant?.quality ?? a.quality,
                        stemsPerBunch: plant?.stems_bunch ?? a.stemsPerBunch,
                        minStems: plant?.min_stem ?? a.minStems,
                        maturity: plant?.maturity ?? a.maturity,
                        description: plant?.desc ?? a.description,
                        startPrice: plant?.start_price ?? a.startPrice,
                        minPrice: plant?.min_price ?? a.minPrice,
                        durationMinutes: a.duration_minutes ?? a.durationMinutes,
                        images: media && media.length ? media : (a.images ?? (plant ? [resolveUrl(plant.image ?? plant.url)].filter(Boolean) : [])),
                        supplierName: supplier?.name ?? supplier?.displayName ?? a.supplierName,
                    };

                    if (!mapByKey.has(key)) {
                        mapByKey.set(key, enriched);
                        merged.push(enriched);
                    } else {
                        // merge images and fill missing fields
                        const ex = mapByKey.get(key);
                        ex.images = Array.from(new Set([...(ex.images || []), ...(enriched.images || [])]));
                        for (const f of ["plantName", "category", "form", "quality", "description", "startPrice", "minPrice", "supplierName", "startDate", "durationMinutes"]) {
                            if ((ex[f] === undefined || ex[f] === null || ex[f] === "") && enriched[f] != null) ex[f] = enriched[f];
                        }
                    }
                }

                const normalize = (s) => (s?.status ?? s?.Status ?? "").toString().trim().toLowerCase();
                if (mounted) {
                    setActive(merged.filter(e => normalize(e) === "active"));
                    setUpcoming(merged.filter(e => normalize(e) === "upcoming"));
                }
            } catch (err) {
                console.error("Auctions load failed", err);
                if (mounted) { setActive([]); setUpcoming([]); }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => { mounted = false; };
    }, []);

    // filter options
    const options = useMemo(() => {
        const all = [...active, ...upcoming];
        const collect = (k) => [...new Set(all.map(a => a[k]).filter(Boolean))].sort();
        return { categories: collect("category"), forms: collect("form"), qualities: collect("quality"), maturities: collect("maturity") };
    }, [active, upcoming]);

    const toggleSet = (setter, value) => setter(prev => {
        const s = new Set(prev);
        s.has(value) ? s.delete(value) : s.add(value);
        return s;
    });

    // filtered upcoming
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = (upcoming || []).filter(a => {
            if (q) {
                const hay = `${a.title ?? ""} ${a.plantName ?? ""} ${a.supplierName ?? ""}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            const p = priceOf(a);
            if (p < priceMin || p > priceMax) return false;
            if (selectedCategories.size && !selectedCategories.has(a.category)) return false;
            if (selectedForms.size && !selectedForms.has(a.form)) return false;
            if (quality && a.quality !== quality) return false;
            if (maturity && a.maturity !== maturity) return false;
            if (minStems && Number(a.minStems ?? a.min_stem ?? 0) < minStems) return false;
            if (stemsPerBunch && Number(a.stemsPerBunch ?? a.stems_bunch ?? 0) < stemsPerBunch) return false;
            return true;
        });

        list.sort((a, b) => {
            if (sort === "price-asc") return priceOf(a) - priceOf(b);
            if (sort === "price-desc") return priceOf(b) - priceOf(a);
            if (sort === "newest") return (parseUtcDate(dateOf(b))?.getTime() || 0) - (parseUtcDate(dateOf(a))?.getTime() || 0);
            if (sort === "oldest") return (parseUtcDate(dateOf(a))?.getTime() || 0) - (parseUtcDate(dateOf(b))?.getTime() || 0);
            return 0;
        });

        return list;
    }, [upcoming, query, priceMin, priceMax, selectedCategories, selectedForms, quality, maturity, minStems, stemsPerBunch, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    if (page > totalPages) setPage(1);
    const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

    return (
        <div className="c-auctions-page">
            <div className="c-auctions-header"><div className="c-auctions-logo">
                {logo ? (
                    <img src={logo.url} alt={logo.alt} className="top-logo" />
                ) : (
                    <span className="loading-label">Loading…</span>
                )}
            </div></div>

            <section className="c-auctions-welcome-section" role="region" aria-label="browse-auctions-banner">
                <div className="c-auctions-welcome-header">
                    <div className="c-auctions-welcome-text">
                        <p className="c-auctions-welcome-subtitle">
                            Explore available auctions and discover the perfect plants for your needs. Filter by your preferences and place your bids today.
                        </p>
                    </div>
                </div>
            </section>

            <div>
                <div className="c-auctions-section-title"><strong>Active Auctions</strong></div>
                {loading ? <div>Loading...</div> : active.length ? <div className="c-auctions-carousel">{active.map(a => <AuctionCard key={getId(a)} a={a} />)}</div> : <div className="c-auctions-carousel-card c-auctions-carousel-card--empty">No active auctions</div>}
            </div>

            <div style={{ height: 18 }} />

            <div className="c-auctions-section-title"><strong>Upcoming Auctions</strong></div>

            <div className="c-auctions-layout">
                <aside className="c-auctions-left-sidebar">
                    <div className="c-auctions-filter-box">
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Search</div>
                        <input aria-label="Search auctions" className="c-auctions-input" placeholder="Search plant" value={query} onChange={(e) => setQuery(e.target.value)} />
                    </div>

                    <div className="c-auctions-filter-box">
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Start Price (€)</div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <input type="number" className="c-auctions-input" style={{ width: 120 }} value={priceMin} onChange={(e) => setPriceMin(Number(e.target.value || 0))} />
                            <input type="number" className="c-auctions-input" style={{ width: 120 }} value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value || 0))} />
                        </div>
                    </div>

                    <div className="c-auctions-filter-box">
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Category</div>
                        <div className="c-auctions-checkbox-row">{options.categories.length ? options.categories.map(c => (<label key={c}><input type="checkbox" checked={selectedCategories.has(c)} onChange={() => toggleSet(setSelectedCategories, c)} /> {c}</label>)) : <div className="c-auctions-small-muted">No categories found</div>}</div>
                    </div>

                    <div className="c-auctions-filter-box">
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Form</div>
                        <div className="c-auctions-checkbox-row">{options.forms.length ? options.forms.map(f => (<label key={f}><input type="checkbox" checked={selectedForms.has(f)} onChange={() => toggleSet(setSelectedForms, f)} /> {f}</label>)) : <div className="c-auctions-small-muted">No forms</div>}</div>
                    </div>

                    <div className="c-auctions-filter-box">
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Quality</div>
                        <select className="c-auctions-input" value={quality} onChange={(e) => setQuality(e.target.value)}><option value="">Any</option>{options.qualities.map(q => <option key={q} value={q}>{q}</option>)}</select>
                    </div>

                    <div className="c-auctions-filter-box">
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Minimum Stems</div>
                        <input type="number" className="c-auctions-input" value={minStems} onChange={(e) => setMinStems(Number(e.target.value || 0))} />
                    </div>

                    <div className="c-auctions-filter-box">
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Stems per Bunch</div>
                        <input type="number" className="c-auctions-input" value={stemsPerBunch} onChange={(e) => setStemsPerBunch(Number(e.target.value || 0))} />
                    </div>

                    <div className="c-auctions-filter-box">
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Maturity</div>
                        <select className="c-auctions-input" value={maturity} onChange={(e) => setMaturity(e.target.value)}><option value="">Any</option>{options.maturities.map(m => <option key={m} value={m}>{m}</option>)}</select>
                    </div>

                    <div className="c-auctions-filter-box" style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        <button className="c-auctions-btn" onClick={() => { setQuery(""); setPriceMin(0); setPriceMax(100); setSelectedCategories(new Set()); setSelectedForms(new Set()); setQuality(""); setMinStems(0); setStemsPerBunch(0); setMaturity(""); }}>↻ Reset Filters</button>
                    </div>

                    <div className="c-auctions-back-section">
                        <button className="c-auctions-back-btn" onClick={() => navigate("/companydashboard")}>
                            Back to Dashboard
                        </button>
                    </div>
                </aside>

                <main className="c-auctions-main">
                    <div className="c-auctions-controls-row">
                        <div style={{ flex: 1 }} />
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <label style={{ marginRight: 8, fontWeight: 600 }}>Sort</label>
                            <select value={sort} onChange={(e) => setSort(e.target.value)} className="c-auctions-input" style={{ width: 180 }}>
                                <option value="price-asc">Price: Low → High</option>
                                <option value="price-desc">Price: High → Low</option>
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                            </select>
                        </div>
                    </div>

                    <div className="c-auctions-upcoming-list">
                        {loading ? <div>Loading upcoming auctions...</div> : pageItems.length ? pageItems.map(a => <AuctionCard key={getId(a)} a={a} />) : <div>No upcoming auctions matching your filters.</div>}

                        <div className="c-auctions-pager">
                            <button onClick={() => setPage(1)} disabled={page === 1} className="c-auctions-btn c-auctions-pager-btn" title="First page">⟨⟨</button>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="c-auctions-btn c-auctions-pager-btn" title="Previous page">‹</button>
                            <div style={{ margin: "0 12px", fontWeight: 600 }}>{page} / {totalPages}</div>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="c-auctions-btn c-auctions-pager-btn" title="Next page">›</button>
                            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="c-auctions-btn c-auctions-pager-btn" title="Last page">⟩⟩</button>
                        </div>
                    </div>
                </main>
            </div>
            <AccountDropdownMenu />
            <CompanyNavigationDropdownMenu navigateFn={(path) => navigate(path)} />
        </div>
    );
}
