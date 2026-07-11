// src/components/PosPanel.jsx
// POS unificado (estilo Kyte). Cualquier artículo + ticket mixto (contado/crédito).
// Sin MDM/IMEI. Usa tus endpoints existentes:
//   GET /api/products, /api/clients, /api/users   |   POST /api/sales/checkout
// Aditivo: no toca SaleAdminPanel/SaleForm.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

const mx = n => '$' + Math.round(Number(n) || 0).toLocaleString('es-MX');
const money = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const initials = s => (s || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
const isMostrador = c => /mostrador|p[uú]blico|general/i.test(`${c.name || ''} ${c.lastName || ''}`);

function PosPanel({ authenticatedFetch, userRole, userTiendaId }) {
    const [products, setProducts] = useState([]);
    const [clients, setClients] = useState([]);
    const [collectors, setCollectors] = useState([]);
    const [loading, setLoading] = useState(true);

    const [cat, setCat] = useState('Todos');
    const [q, setQ] = useState('');
    const [cart, setCart] = useState({});

    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [mode, setMode] = useState('credito');
    const [linePlan, setLinePlan] = useState({});
    const [numPagos, setNumPagos] = useState(16);
    const [engPct, setEngPct] = useState(10);
    const [clientId, setClientId] = useState('');
    const [collectorId, setCollectorId] = useState('');
    const [clientQuery, setClientQuery] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ limit: 9999 });
            if (userRole !== 'super_admin' && userTiendaId) p.append('tiendaId', userTiendaId);
            const usersUrl = (userRole !== 'super_admin' && userTiendaId)
                ? `${API_BASE_URL}/api/users?tiendaId=${userTiendaId}`
                : `${API_BASE_URL}/api/users`;

            const [pr, cr, ur] = await Promise.all([
                authenticatedFetch(`${API_BASE_URL}/api/products?${p.toString()}`),
                authenticatedFetch(`${API_BASE_URL}/api/clients?${p.toString()}`),
                authenticatedFetch(usersUrl)
            ]);
            if (pr.ok) setProducts(((await pr.json()).products || []).filter(x => x.stock > 0));
            if (cr.ok) setClients((await cr.json()).clients || []);
            if (ur.ok) setCollectors((await ur.json()).filter(u => u.role === 'collector_agent'));
        } catch (err) {
            toast.error('Error al cargar el catálogo.');
        } finally {
            setLoading(false);
        }
    }, [authenticatedFetch, userRole, userTiendaId]);

    useEffect(() => { load(); }, [load]);

    const categories = useMemo(() => {
        const set = new Set(products.map(p => p.category).filter(Boolean));
        return ['Todos', ...Array.from(set)];
    }, [products]);

    const visible = useMemo(() => {
        const term = q.trim().toLowerCase();
        return products.filter(p =>
            (cat === 'Todos' || p.category === cat) &&
            (!term || (p.name || '').toLowerCase().includes(term)));
    }, [products, cat, q]);

    const cartLines = useMemo(() =>
        Object.keys(cart).map(id => {
            const p = products.find(x => String(x.id) === String(id));
            return p ? { ...p, qty: cart[id] } : null;
        }).filter(Boolean),
        [cart, products]);

    const cartUnits = useMemo(() => cartLines.reduce((s, i) => s + i.qty, 0), [cartLines]);
    const cartTotal = useMemo(() => cartLines.reduce((s, i) => s + i.price * i.qty, 0), [cartLines]);

    const add = (p) => {
        setCart(prev => {
            const cur = prev[p.id] || 0;
            if (cur + 1 > p.stock) { toast.warn(`Solo hay ${p.stock} de ${p.name}.`); return prev; }
            return { ...prev, [p.id]: cur + 1 };
        });
    };
    const removeLine = (id) => setCart(prev => { const n = { ...prev }; delete n[id]; return n; });

    const openCheckout = () => {
        const initPlan = {};
        cartLines.forEach(i => { initPlan[i.id] = 'credito'; });
        setLinePlan(initPlan);
        setMode('credito');
        setNumPagos(16); setEngPct(10);
        setClientId(''); setCollectorId(''); setClientQuery('');
        setCheckoutOpen(true);
    };

    const setMode2 = (m) => {
        setMode(m);
        const plan = {};
        cartLines.forEach(i => { plan[i.id] = (m === 'contado' ? 'contado' : 'credito'); });
        setLinePlan(plan);
    };
    const setLine = (id, plan) => setLinePlan(prev => ({ ...prev, [id]: plan }));

    const calc = useMemo(() => {
        let contado = 0, credito = 0;
        cartLines.forEach(i => {
            const sub = i.price * i.qty;
            if (linePlan[i.id] === 'contado') contado += sub; else credito += sub;
        });
        contado = money(contado); credito = money(credito);
        const enganche = money(credito * engPct / 100);
        const financiado = money(credito - enganche);
        const cuota = financiado > 0 && numPagos > 0 ? money(financiado / numPagos) : 0;
        const pagarHoy = money(contado + enganche);
        return { contado, credito, enganche, financiado, cuota, pagarHoy };
    }, [cartLines, linePlan, engPct, numPagos]);

    const hayCredito = useMemo(() =>
        cartLines.some(i => linePlan[i.id] === 'credito'), [cartLines, linePlan]);

    const mostrador = useMemo(() => clients.find(isMostrador), [clients]);
    const filteredClients = useMemo(() => {
        const term = clientQuery.trim().toLowerCase();
        if (!term) return clients.slice(0, 50);
        return clients.filter(c => `${c.name || ''} ${c.lastName || ''}`.toLowerCase().includes(term)).slice(0, 50);
    }, [clients, clientQuery]);

    const usarMostrador = () => {
        if (!mostrador) {
            toast.info('Crea un cliente llamado "Mostrador" para ventas rápidas de contado.');
            return;
        }
        setClientId(String(mostrador.id));
        setClientQuery(`${mostrador.name} ${mostrador.lastName || ''}`.trim());
    };

    const canSubmit = () => {
        if (cartLines.length === 0) return false;
        if (!clientId) return false;
        if (hayCredito) {
            if (!numPagos || numPagos <= 0) return false;
            if (!collectorId) return false;
        }
        return true;
    };

    const submit = async () => {
        if (!canSubmit() || submitting) return;
        setSubmitting(true);
        try {
            const items = cartLines.map(i => ({
                productId: i.id,
                quantity: i.qty,
                plan: linePlan[i.id] || 'credito'
            }));
            const body = {
                clientId: parseInt(clientId, 10),
                items,
                assignedCollectorId: hayCredito && collectorId ? parseInt(collectorId, 10) : null,
                paymentFrequency: 'weekly',
                numberOfPayments: hayCredito ? parseInt(numPagos, 10) : null,
                downPaymentPct: hayCredito ? engPct : 0
            };
            const r = await authenticatedFetch(`${API_BASE_URL}/api/sales/checkout`, {
                method: 'POST',
                body: JSON.stringify(body)
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.message || 'Error al registrar la venta.');
            toast.success(`Venta #${data.saleId} registrada.`);
            setCart({}); setCheckoutOpen(false);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pos-root">
            <style>{POS_CSS}</style>

            <div className="pos-top">
                <div className="pos-title">
                    <b>Punto de venta</b>
                    <small>{loading ? 'Cargando…' : `${products.length} artículos disponibles`}</small>
                </div>
                <input className="pos-search" placeholder="Buscar artículo…" value={q} onChange={e => setQ(e.target.value)} />
            </div>

            <div className="pos-chips">
                {categories.map(c => (
                    <button key={c} className={`pos-chip ${c === cat ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>
                ))}
            </div>

            <div className="pos-grid">
                {visible.map(p => {
                    const qty = cart[p.id] || 0;
                    return (
                        <div key={p.id} className="pos-card" onClick={() => add(p)}>
                            {qty > 0 && <div className="pos-qtybadge">{qty}</div>}
                            <button className="pos-add" onClick={e => { e.stopPropagation(); add(p); }}>＋</button>
                            {(Array.isArray(p.imageUrls) && p.imageUrls[0])
                                ? <div className="pos-thumb pos-thumb-img"><img src={p.imageUrls[0]} alt={p.name} loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} /></div>
                                : <div className="pos-thumb">{initials(p.name)}</div>}
                            <div className="pos-cbody">
                                <h4>{p.name}</h4>
                                <div className="pos-price">{mx(p.price)} <small>· stock {p.stock}</small></div>
                            </div>
                        </div>
                    );
                })}
                {!loading && visible.length === 0 && <p className="pos-empty">Sin artículos que coincidan.</p>}
            </div>

            {cartUnits > 0 && (
                <div className="pos-cartbar">
                    <div className="pos-cartmeta">
                        <small>{cartUnits} {cartUnits === 1 ? 'artículo' : 'artículos'}</small>
                        <b>{mx(cartTotal)}</b>
                    </div>
                    <button className="pos-cobrar" onClick={openCheckout}>Cobrar →</button>
                </div>
            )}

            {checkoutOpen && (
                <div className="pos-backdrop" onClick={() => setCheckoutOpen(false)}>
                    <div className="pos-sheet" onClick={e => e.stopPropagation()}>
                        <div className="pos-grab" />
                        <h3>Cobrar venta</h3>
                        <p className="pos-sub">{cartUnits} artículos · Total {mx(cartTotal)}</p>

                        <div className="pos-field">
                            <label>Cliente</label>
                            <div className="pos-clientrow">
                                <input className="pos-input" placeholder="Buscar cliente…" value={clientQuery}
                                    onChange={e => { setClientQuery(e.target.value); setClientId(''); }} />
                                <button className="pos-mostrador" onClick={usarMostrador}>Mostrador</button>
                            </div>
                            {clientQuery && !clientId && (
                                <div className="pos-clientlist">
                                    {filteredClients.map(c => (
                                        <div key={c.id} className="pos-clientitem"
                                            onClick={() => { setClientId(String(c.id)); setClientQuery(`${c.name} ${c.lastName || ''}`.trim()); }}>
                                            {c.name} {c.lastName || ''}
                                        </div>
                                    ))}
                                    {filteredClients.length === 0 && <div className="pos-clientitem muted">Sin coincidencias</div>}
                                </div>
                            )}
                            {clientId && <div className="pos-clientok">✓ Cliente seleccionado</div>}
                        </div>

                        <div className="pos-modes">
                            <div className={`pos-mode cash ${mode === 'contado' ? 'sel' : ''}`} onClick={() => setMode2('contado')}>
                                <div className="ic">💵</div><div className="t">Todo contado</div>
                            </div>
                            <div className={`pos-mode credit ${mode === 'credito' ? 'sel' : ''}`} onClick={() => setMode2('credito')}>
                                <div className="ic">📅</div><div className="t">A crédito</div>
                            </div>
                        </div>

                        {mode === 'credito' && (
                            <>
                                <div className="pos-lines">
                                    <div className="pos-lineshd">Cómo se paga cada artículo</div>
                                    {cartLines.map(i => (
                                        <div key={i.id} className="pos-line">
                                            <div className="pos-linenm">
                                                <b>{i.name}</b>
                                                <small>{i.qty}× · {mx(i.price * i.qty)}</small>
                                            </div>
                                            <div className="pos-toggle">
                                                <button className={linePlan[i.id] === 'contado' ? 'oncash' : ''} onClick={() => setLine(i.id, 'contado')}>Contado</button>
                                                <button className={linePlan[i.id] === 'credito' ? 'oncredit' : ''} onClick={() => setLine(i.id, 'credito')}>Crédito</button>
                                            </div>
                                            <button className="pos-rm" onClick={() => removeLine(i.id)}>✕</button>
                                        </div>
                                    ))}
                                </div>

                                {hayCredito && (
                                    <>
                                        <div className="pos-field">
                                            <label>Plazo (pagos semanales)</label>
                                            <div className="pos-seg">
                                                {[12, 16, 17].map(w => (
                                                    <button key={w} className={w === numPagos ? 'on' : ''} onClick={() => setNumPagos(w)}>{w}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="pos-field">
                                            <label>Enganche (sobre lo financiado)</label>
                                            <div className="pos-seg">
                                                {[0, 10, 20, 30].map(e => (
                                                    <button key={e} className={e === engPct ? 'on' : ''} onClick={() => setEngPct(e)}>{e}%</button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pos-quote">
                                            <div><div className="lab">Cuota semanal</div><div className="big">{mx(calc.cuota)}</div></div>
                                            <div className="side">
                                                <div>Pagar hoy<br /><b>{mx(calc.pagarHoy)}</b></div>
                                                <div style={{ marginTop: 8 }}>Financiado<br /><b>{mx(calc.financiado)}</b></div>
                                            </div>
                                        </div>
                                        <div className="pos-sub" style={{ marginTop: -6 }}>
                                            Pagar hoy = contado ({mx(calc.contado)}) + enganche ({mx(calc.enganche)})
                                        </div>

                                        <div className="pos-field">
                                            <label>Gestor asignado</label>
                                            <select className="pos-input" value={collectorId} onChange={e => setCollectorId(e.target.value)}>
                                                <option value="">Seleccionar gestor…</option>
                                                {collectors.map(c => <option key={c.id} value={c.id}>{c.username}</option>)}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {mode === 'contado' && (
                            <div className="pos-quote cashq">
                                <div><div className="lab">Total a cobrar hoy</div><div className="big">{mx(cartTotal)}</div></div>
                                <div className="side"><div>Efectivo<br /><b>{cartUnits} artículos</b></div></div>
                            </div>
                        )}

                        <button className={`pos-go ${hayCredito ? 'credit' : 'cash'}`} disabled={!canSubmit() || submitting} onClick={submit}>
                            {submitting ? 'Registrando…' : (hayCredito ? 'Registrar venta a crédito' : `Cobrar ${mx(cartTotal)} de contado`)}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const POS_CSS = `
.pos-root{--pink:#5B3DF5;--ink:#0F172A;--ink2:#475569;--ink3:#94A3B8;--line:#E7EAF1;--money:#0E9F6E;--credit:#B45309;--danger:#DC2626;--bg:#F1F3F9;max-width:1100px;margin:0 auto;font-variant-numeric:tabular-nums}
.pos-top{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:12px}
.pos-title b{font-size:20px;color:var(--ink)}.pos-title small{display:block;color:var(--ink3);font-size:12px}
.pos-search{flex:1;min-width:200px;border:1.5px solid var(--line);border-radius:12px;padding:11px 14px;font-size:14px;outline:none}
.pos-search:focus{border-color:var(--pink)}
.pos-chips{display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:12px}
.pos-chip{flex:0 0 auto;border:1px solid var(--line);background:#fff;color:var(--ink2);font-size:13px;font-weight:600;padding:8px 14px;border-radius:999px;cursor:pointer}
.pos-chip.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.pos-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;padding-bottom:120px}
.pos-card{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;position:relative;cursor:pointer;transition:transform .1s}
.pos-card:active{transform:scale(.97)}
.pos-thumb{height:88px;display:grid;place-items:center;font-size:26px;font-weight:800;color:#fff;background:linear-gradient(135deg,#5B3DF5,#8A63FF)}
.pos-thumb-img{padding:0;background:#fff}
.pos-thumb-img img{width:100%;height:100%;object-fit:cover;display:block}
.pos-cbody{padding:9px 10px 11px}
.pos-cbody h4{margin:0;font-size:13px;line-height:1.25;color:var(--ink);min-height:32px}
.pos-price{margin-top:5px;font-size:14px;font-weight:800;color:var(--ink)}.pos-price small{font-size:11px;font-weight:600;color:var(--ink3)}
.pos-add{position:absolute;top:8px;right:8px;width:30px;height:30px;border-radius:9px;border:none;background:#fff;color:var(--pink);font-size:18px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(15,23,42,.15)}
.pos-qtybadge{position:absolute;top:8px;left:8px;background:var(--money);color:#fff;font-size:12px;font-weight:800;min-width:22px;height:22px;border-radius:999px;display:grid;place-items:center;z-index:1}
.pos-empty{grid-column:1/-1;text-align:center;color:var(--ink3);padding:40px}
.pos-cartbar{position:fixed;left:50%;transform:translateX(-50%);bottom:18px;width:min(560px,92vw);z-index:30;background:var(--ink);color:#fff;border-radius:16px;padding:12px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 20px 50px rgba(15,23,42,.3)}
.pos-cartmeta{flex:1}.pos-cartmeta small{display:block;font-size:11px;opacity:.7;font-weight:600}.pos-cartmeta b{font-size:19px}
.pos-cobrar{background:var(--money);border:none;color:#fff;font-size:15px;font-weight:800;padding:11px 18px;border-radius:12px;cursor:pointer}
.pos-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:40;display:flex;align-items:flex-end;justify-content:center}
.pos-sheet{background:#fff;border-radius:20px 20px 0 0;width:min(560px,100vw);max-height:92vh;overflow-y:auto;padding:10px 20px 26px}
@media(min-width:640px){.pos-backdrop{align-items:center}.pos-sheet{border-radius:20px}}
.pos-grab{width:38px;height:4px;border-radius:99px;background:var(--line);margin:6px auto 10px}
.pos-sheet h3{margin:0 0 2px;font-size:19px}.pos-sub{margin:0 0 12px;font-size:13px;color:var(--ink2)}
.pos-field{margin:12px 0}.pos-field>label{display:block;font-size:12px;font-weight:700;color:var(--ink2);margin-bottom:7px}
.pos-input{width:100%;border:1.5px solid var(--line);border-radius:12px;padding:11px 12px;font-size:15px;outline:none;font-weight:600;color:var(--ink)}
.pos-input:focus{border-color:var(--pink)}
.pos-clientrow{display:flex;gap:8px}.pos-mostrador{flex:0 0 auto;border:1.5px solid var(--line);background:#fff;border-radius:12px;padding:0 14px;font-size:13px;font-weight:700;color:var(--ink2);cursor:pointer}
.pos-clientlist{border:1px solid var(--line);border-radius:12px;margin-top:6px;max-height:180px;overflow-y:auto}
.pos-clientitem{padding:10px 12px;font-size:14px;cursor:pointer;border-bottom:1px solid var(--line)}
.pos-clientitem:hover{background:var(--bg)}.pos-clientitem.muted{color:var(--ink3);cursor:default}
.pos-clientok{color:var(--money);font-size:12px;font-weight:700;margin-top:6px}
.pos-modes{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}
.pos-mode{border:2px solid var(--line);border-radius:14px;padding:14px;text-align:center;cursor:pointer}
.pos-mode .ic{font-size:24px}.pos-mode .t{font-weight:800;font-size:14px;margin-top:4px}
.pos-mode.cash.sel{border-color:var(--money);background:#E6F6EF}.pos-mode.credit.sel{border-color:var(--credit);background:#FEF3E2}
.pos-lines{margin:8px 0}.pos-lineshd{font-size:12px;font-weight:800;color:var(--ink3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.pos-line{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line)}
.pos-linenm{flex:1;min-width:0}.pos-linenm b{font-size:13px;color:var(--ink);display:block}.pos-linenm small{font-size:11px;color:var(--ink3)}
.pos-toggle{display:flex;background:var(--bg);border-radius:9px;padding:3px}
.pos-toggle button{border:none;background:transparent;font-size:11px;font-weight:700;padding:5px 9px;border-radius:7px;color:var(--ink3);cursor:pointer}
.pos-toggle button.oncash{background:#fff;color:var(--money)}.pos-toggle button.oncredit{background:#fff;color:var(--credit)}
.pos-rm{border:none;background:transparent;color:var(--ink3);font-size:14px;cursor:pointer}
.pos-seg{display:flex;gap:6px;background:var(--bg);padding:4px;border-radius:12px}
.pos-seg button{flex:1;border:none;background:transparent;padding:9px;border-radius:9px;font-size:13px;font-weight:700;color:var(--ink2);cursor:pointer}
.pos-seg button.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(15,23,42,.12)}
.pos-quote{background:linear-gradient(135deg,#0E9F6E,#10B981);color:#fff;border-radius:16px;padding:16px;margin:10px 0;display:flex;align-items:center;justify-content:space-between}
.pos-quote .lab{font-size:12px;opacity:.9;font-weight:600}.pos-quote .big{font-size:28px;font-weight:800;line-height:1}
.pos-quote .side{text-align:right;font-size:12px;line-height:1.5}.pos-quote .side b{font-size:15px}
.pos-go{width:100%;border:none;border-radius:14px;padding:15px;font-size:16px;font-weight:800;color:#fff;background:var(--ink);cursor:pointer;margin-top:10px}
.pos-go:disabled{opacity:.4;cursor:not-allowed}.pos-go.credit{background:var(--credit)}.pos-go.cash{background:var(--money)}
`;

export default PosPanel;
