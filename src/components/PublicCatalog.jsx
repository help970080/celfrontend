import React, { useState, useEffect, useMemo } from 'react';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';
const WHATSAPP = '525665489522';

const mx = n => '$' + (Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
const initials = s => (s || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

// Crédito público: 10% enganche, 17 semanas (igual que antes)
function credito(price) {
    const enganche = price * 0.10;
    const semanal = (price - enganche) / 17;
    return { enganche, semanal };
}

function getMediaType(url) {
    if (!url) return { type: 'none' };
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/') || url.includes('youtube.com/shorts')) {
        const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
        return { type: 'youtube', id: m ? m[1] : null };
    }
    if (url.includes('vimeo.com/')) {
        const id = url.split('/').pop().split('?')[0];
        return { type: 'vimeo', id };
    }
    if (url.includes('share.vidnoz.com/aivideo')) {
        const m = url.match(/id=(aishare-[a-zA-Z0-9_-]+)/);
        return { type: 'vidnoz', id: m ? m[1] : null };
    }
    return { type: 'image', url };
}

// Miniatura para la tarjeta (imagen o frame de YouTube). Vimeo/Vidnoz no dan frame directo.
function thumbFor(mt) {
    if (mt.type === 'image') return mt.url;
    if (mt.type === 'youtube' && mt.id) return `https://img.youtube.com/vi/${mt.id}/hqdefault.jpg`;
    return null;
}

function PublicCatalog() {
    const [products, setProducts] = useState([]);
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [category, setCategory] = useState('');
    const [q, setQ] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12);
    const [totalPages, setTotalPages] = useState(1);
    const [videoModal, setVideoModal] = useState(null); // mediaType a reproducir

    useEffect(() => {
        (async () => {
            try {
                const r = await fetch(`${API_BASE_URL}/api/stores/public`);
                if (r.ok) {
                    const data = await r.json();
                    setStores(data);
                    if (data.length > 0) setSelectedStore(data[0].id);
                    else { setStores([{ id: 1, name: 'CelExpress' }]); setSelectedStore(1); }
                } else { setStores([{ id: 1, name: 'CelExpress' }]); setSelectedStore(1); }
            } catch { setStores([{ id: 1, name: 'CelExpress' }]); setSelectedStore(1); }
        })();
    }, []);

    useEffect(() => {
        if (!selectedStore) return;
        (async () => {
            setLoading(true); setError(null);
            try {
                let url = `${API_BASE_URL}/api/products?sortBy=name&order=asc&tiendaId=${selectedStore}`;
                if (category) url += `&category=${encodeURIComponent(category)}`;
                if (q) url += `&search=${encodeURIComponent(q)}`;
                url += `&page=${currentPage}&limit=${itemsPerPage}`;
                const r = await fetch(url);
                if (!r.ok) throw new Error((await r.json()).message || `Error ${r.status}`);
                const data = await r.json();
                setProducts(data.products || []);
                setTotalPages(data.totalPages || 1);
            } catch (err) {
                setError(err.message || 'No se pudieron cargar los productos.');
                setProducts([]);
            } finally { setLoading(false); }
        })();
    }, [selectedStore, category, q, currentPage, itemsPerPage]);

    const storeName = useMemo(() => {
        const s = stores.find(x => x.id === selectedStore);
        return s ? s.name : 'CelExpress';
    }, [stores, selectedStore]);

    const categories = useMemo(() => ['', ...new Set(products.map(p => p.category).filter(Boolean))], [products]);

    const firstUrl = (p) => {
        const arr = Array.isArray(p.imageUrls) ? p.imageUrls
            : (typeof p.imageUrls === 'string' && p.imageUrls ? p.imageUrls.split(/[\n,]/).map(u => u.trim()).filter(Boolean) : []);
        return arr[0] || null;
    };

    return (
        <div className="pc-root">
            <style>{PC_CSS}</style>

            <div className="pc-top">
                <div className="pc-titlebox">
                    <h1>📱 {storeName}</h1>
                    <small>Catálogo — contado o a crédito</small>
                </div>
                <input className="pc-search" placeholder="Buscar producto…" value={q}
                    onChange={e => { setQ(e.target.value); setCurrentPage(1); }} />
            </div>

            {stores.length > 1 && (
                <select className="pc-store" value={selectedStore} onChange={e => { setSelectedStore(parseInt(e.target.value, 10)); setCurrentPage(1); }}>
                    {stores.map(s => <option key={s.id} value={s.id}>🏪 {s.name}</option>)}
                </select>
            )}

            {categories.length > 1 && (
                <div className="pc-chips">
                    {categories.map(c => (
                        <button key={c || 'all'} className={`pc-chip ${category === c ? 'on' : ''}`}
                            onClick={() => { setCategory(c); setCurrentPage(1); }}>
                            {c || 'Todos'}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="pc-state"><div className="pc-spin" /><p>Cargando productos…</p></div>
            ) : error ? (
                <div className="pc-state"><p>❌ {error}</p></div>
            ) : products.length === 0 ? (
                <div className="pc-state"><p>📦 No hay productos en {storeName}.</p></div>
            ) : (
                <div className="pc-grid">
                    {products.map(p => {
                        const url = firstUrl(p);
                        const mt = getMediaType(url);
                        const thumb = thumbFor(mt);
                        const isVideo = mt.type === 'youtube' || mt.type === 'vimeo' || mt.type === 'vidnoz';
                        const { enganche, semanal } = credito(p.price);
                        return (
                            <div key={p.id} className="pc-card">
                                <div className={`pc-thumb ${isVideo ? 'clickable' : ''}`} onClick={() => isVideo && setVideoModal(mt)}>
                                    {thumb
                                        ? <img src={thumb} alt={p.name} loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} />
                                        : (isVideo
                                            ? <div className="pc-initials">🎬</div>
                                            : <div className="pc-initials">{initials(p.name)}</div>)}
                                    {isVideo && <span className="pc-play">▶</span>}
                                </div>
                                <div className="pc-body">
                                    <h3>{p.name}</h3>
                                    {p.brand && <div className="pc-brand">{p.brand}</div>}
                                    <div className="pc-price">{mx(p.price)} <small>contado</small></div>
                                    {p.price > 0 && (
                                        <div className="pc-credit">
                                            <div className="pc-crow"><span>Enganche</span><b>{mx(enganche)}</b></div>
                                            <div className="pc-crow"><span>Semanal · 17 sem</span><b>{mx(semanal)}</b></div>
                                        </div>
                                    )}
                                    <a className="pc-wa" target="_blank" rel="noopener noreferrer"
                                        href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Me interesa: ' + p.name)}`}>
                                        💬 Contactar por WhatsApp
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {totalPages > 1 && (
                <div className="pc-pag">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>← Anterior</button>
                    <span>{currentPage} / {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Siguiente →</button>
                </div>
            )}

            {videoModal && (
                <div className="pc-vbackdrop" onClick={() => setVideoModal(null)}>
                    <div className="pc-vbox" onClick={e => e.stopPropagation()}>
                        <button className="pc-vclose" onClick={() => setVideoModal(null)}>✕</button>
                        {videoModal.type === 'youtube' && (
                            <iframe title="video" src={`https://www.youtube.com/embed/${videoModal.id}?autoplay=1`}
                                allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen frameBorder="0" />
                        )}
                        {videoModal.type === 'vimeo' && (
                            <iframe title="video" src={`https://player.vimeo.com/video/${videoModal.id}?autoplay=1`}
                                allow="autoplay; fullscreen; picture-in-picture" allowFullScreen frameBorder="0" />
                        )}
                        {videoModal.type === 'vidnoz' && (
                            <iframe title="video" src={`https://share.vidnoz.com/embed/${videoModal.id}`}
                                allow="autoplay; fullscreen; picture-in-picture" allowFullScreen frameBorder="0" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const PC_CSS = `
.pc-root{--pri:#667eea;--pri2:#764ba2;--ink:#1f2937;--ink2:#6b7280;--line:#e5e7eb;--bg:#f5f7fa;--money:#0E9F6E;max-width:1300px;margin:0 auto;padding:0 12px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-variant-numeric:tabular-nums}
.pc-top{display:flex;gap:14px;align-items:center;flex-wrap:wrap;padding:18px 4px 12px}
.pc-titlebox h1{margin:0;font-size:22px;color:var(--ink);background:linear-gradient(135deg,var(--pri),var(--pri2));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.pc-titlebox small{color:var(--ink2);font-size:12px;font-weight:600}
.pc-search{flex:1;min-width:200px;border:1.5px solid var(--line);border-radius:12px;padding:12px 14px;font-size:14px;outline:none}
.pc-search:focus{border-color:var(--pri)}
.pc-store{width:100%;max-width:340px;margin:0 4px 12px;padding:11px 14px;border:2px solid var(--pri);border-radius:10px;font-size:14px;font-weight:700;color:var(--pri);background:#fff;cursor:pointer}
.pc-chips{display:flex;gap:8px;overflow-x:auto;padding:0 4px 14px}
.pc-chip{flex:0 0 auto;border:1px solid var(--line);background:#fff;color:var(--ink2);font-size:13px;font-weight:600;padding:8px 15px;border-radius:999px;cursor:pointer}
.pc-chip.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.pc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;padding:4px}
.pc-card{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,.06);display:flex;flex-direction:column;transition:transform .12s,box-shadow .12s}
.pc-card:hover{transform:translateY(-3px);box-shadow:0 12px 26px rgba(0,0,0,.12)}
.pc-thumb{height:170px;position:relative;background:linear-gradient(135deg,var(--pri),var(--pri2));display:grid;place-items:center;overflow:hidden}
.pc-thumb.clickable{cursor:pointer}
.pc-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.pc-initials{font-size:34px;font-weight:800;color:#fff}
.pc-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:48px;height:48px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;font-size:18px;display:grid;place-items:center;padding-left:3px}
.pc-body{padding:14px;display:flex;flex-direction:column;gap:8px;flex:1}
.pc-body h3{margin:0;font-size:15px;line-height:1.3;color:var(--ink)}
.pc-brand{color:var(--pri);font-weight:700;font-size:12px}
.pc-price{font-size:20px;font-weight:800;color:var(--ink)}.pc-price small{font-size:12px;font-weight:600;color:var(--ink2)}
.pc-credit{background:linear-gradient(135deg,#667eea15,#764ba215);border:1px solid #667eea30;border-radius:10px;padding:10px}
.pc-crow{display:flex;justify-content:space-between;font-size:13px;color:var(--ink2);margin-bottom:4px}
.pc-crow:last-child{margin-bottom:0}.pc-crow b{color:var(--ink)}
.pc-wa{margin-top:auto;display:flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#fff;text-decoration:none;border-radius:11px;padding:11px;font-size:14px;font-weight:700}
.pc-wa:active{transform:scale(.97)}
.pc-pag{display:flex;justify-content:center;align-items:center;gap:14px;padding:24px 0 4px}
.pc-pag button{border:2px solid var(--pri);background:#fff;color:var(--pri);border-radius:10px;padding:10px 18px;font-weight:700;cursor:pointer}
.pc-pag button:disabled{opacity:.4;cursor:not-allowed}
.pc-pag span{font-weight:700;color:var(--ink)}
.pc-state{text-align:center;padding:60px 20px;color:var(--ink2)}
.pc-spin{width:46px;height:46px;border:4px solid #eee;border-top-color:var(--pri);border-radius:50%;margin:0 auto 16px;animation:pcspin 1s linear infinite}
@keyframes pcspin{to{transform:rotate(360deg)}}
.pc-vbackdrop{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px}
.pc-vbox{position:relative;width:min(900px,100%);aspect-ratio:16/9;background:#000;border-radius:14px;overflow:hidden}
.pc-vbox iframe{width:100%;height:100%;border:0}
.pc-vclose{position:absolute;top:10px;right:10px;z-index:2;width:38px;height:38px;border:none;border-radius:50%;background:rgba(255,255,255,.9);font-size:16px;font-weight:800;cursor:pointer}
`;

export default PublicCatalog;
