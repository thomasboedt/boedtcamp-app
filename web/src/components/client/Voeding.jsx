import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api.js";
import Button from "../../ds/Button.jsx";
import Modal, { fieldLabel, inputStyle } from "../trainer/Modal.jsx";
import { segLight } from "../../lib/styles.js";
import { addDays, dateLabel, fileToCompressedBase64, scalePer100g, todayLocal } from "../../lib/nutrition.js";

const MACROS = [
  { key: "kcal", goalKey: "calorieDoel", label: "Kcal", color: "#000" },
  { key: "eiwit", goalKey: "eiwitDoel", label: "Eiwit", unit: "g", color: "#1f5dc4" },
  { key: "koolhydraten", goalKey: "koolhydratenDoel", label: "Koolhydraten", unit: "g", color: "#2c9dfd" },
  { key: "vet", goalKey: "vetDoel", label: "Vet", unit: "g", color: "#8b8f94" },
];

const navBtnStyle = { flex: "none", width: 34, height: 34, border: "1px solid #e8ebee", background: "#fff", borderRadius: 10, fontSize: 15, cursor: "pointer", color: "#454e58" };

export default function Voeding({ onHome }) {
  const [datum, setDatum] = useState(todayLocal());
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [doelen, setDoelen] = useState({});
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async (d) => {
    setLoading(true);
    try {
      const res = await api.food(d);
      setEntries(res.entries);
      setDoelen(res.doelen);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(datum);
  }, [datum, load]);

  const totals = entries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      eiwit: acc.eiwit + e.eiwit,
      koolhydraten: acc.koolhydraten + e.koolhydraten,
      vet: acc.vet + e.vet,
    }),
    { kcal: 0, eiwit: 0, koolhydraten: 0, vet: 0 }
  );

  async function removeEntry(id) {
    await api.deleteFoodEntry(id);
    load(datum);
  }

  const kcalLeft = doelen.calorieDoel != null ? Math.round(doelen.calorieDoel - totals.kcal) : null;

  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px 12px", borderBottom: "1px solid #e8ebee" }}>
        <button onClick={onHome} style={navBtnStyle} title="Terug">
          ‹
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 17, color: "#000" }}>Voedingsdagboek</div>
          <div style={{ fontSize: 11.5, color: "#8b8f94" }}>{dateLabel(datum)}</div>
        </div>
        <button onClick={() => setDatum(addDays(datum, -1))} style={navBtnStyle} title="Vorige dag">
          ‹
        </button>
        <button
          onClick={() => setDatum(addDays(datum, 1))}
          disabled={datum >= todayLocal()}
          style={{ ...navBtnStyle, opacity: datum >= todayLocal() ? 0.35 : 1, cursor: datum >= todayLocal() ? "default" : "pointer" }}
          title="Volgende dag"
        >
          ›
        </button>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ background: "#fff", border: "1.5px solid #e8ebee", borderRadius: 16, padding: 18, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 38, color: "#000", lineHeight: 1 }}>{Math.round(totals.kcal)}</div>
            <div style={{ fontSize: 13, color: "#8b8f94" }}>{doelen.calorieDoel != null ? `/ ${doelen.calorieDoel} kcal` : "kcal"}</div>
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 4, color: doelen.calorieDoel == null ? "#8b8f94" : kcalLeft >= 0 ? "#1f5dc4" : "#c0392b" }}>
            {doelen.calorieDoel == null ? "Je coach heeft nog geen voedingsdoel ingesteld." : kcalLeft >= 0 ? `nog ${kcalLeft} kcal te gaan` : `${Math.abs(kcalLeft)} kcal boven doel`}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
            {MACROS.slice(1).map((m) => (
              <MacroRow key={m.key} label={m.label} value={totals[m.key]} goal={doelen[m.goalKey]} unit={m.unit} color={m.color} />
            ))}
          </div>
        </div>

        <Button variant="dark" style={{ width: "100%", height: 48 }} onClick={() => setAddOpen(true)}>
          + Voeding toevoegen
        </Button>

        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          {loading && <div style={{ color: "#8b8f94", fontSize: 13.5 }}>Laden…</div>}
          {!loading && entries.length === 0 && <div style={{ color: "#c2c8cf", fontSize: 13.5 }}>Nog niets gelogd.</div>}
          {entries.map((e) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, border: "1px solid #e8ebee", borderRadius: 12, background: "#fff" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#000" }}>{e.naam}</div>
                <div style={{ fontSize: 12, color: "#8b8f94" }}>
                  {e.hoeveelheid}
                  {e.eenheid} · {Math.round(e.kcal)} kcal · E {Math.round(e.eiwit)}g · K {Math.round(e.koolhydraten)}g · V {Math.round(e.vet)}g
                </div>
              </div>
              <button onClick={() => removeEntry(e.id)} style={{ flex: "none", width: 30, height: 30, border: "1px solid #e8ebee", background: "#fff", borderRadius: 9, cursor: "pointer", color: "#8b8f94" }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {addOpen && (
        <AddFoodModal
          datum={datum}
          onClose={() => setAddOpen(false)}
          onAdded={() => {
            setAddOpen(false);
            load(datum);
          }}
        />
      )}
    </div>
  );
}

function MacroRow({ label, value, goal, unit = "", color }) {
  const hasGoal = goal != null;
  const pct = hasGoal ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
        <span style={{ color: "#454e58" }}>{label}</span>
        <span style={{ color: "#8b8f94" }}>
          <span style={{ color: "#000", fontWeight: 600 }}>
            {Math.round(value)}
            {unit}
          </span>
          {hasGoal ? ` / ${goal}${unit}` : ""}
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "#f4f6f8", overflow: "hidden" }}>
        {hasGoal && <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width .2s" }} />}
      </div>
    </div>
  );
}

function AddFoodModal({ datum, onClose, onAdded }) {
  const [tab, setTab] = useState("zoeken");
  const tabs = [
    ["zoeken", "Zoeken"],
    ["barcode", "Barcode"],
    ["foto", "Foto"],
    ["handmatig", "Handmatig"],
  ];
  return (
    <Modal title="Voeding toevoegen" onClose={onClose} width={440}>
      <div style={{ display: "flex", gap: 4, padding: 4, background: "#f4f6f8", borderRadius: 999 }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ ...segLight(tab === id), flex: 1 }}>
            {label}
          </button>
        ))}
      </div>
      {tab === "zoeken" && <SearchTab datum={datum} onAdded={onAdded} />}
      {tab === "barcode" && <BarcodeTab datum={datum} onAdded={onAdded} />}
      {tab === "foto" && <PhotoTab datum={datum} onAdded={onAdded} />}
      {tab === "handmatig" && <ManualTab datum={datum} onAdded={onAdded} />}
    </Modal>
  );
}

const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };
const errorStyle = { color: "#c0392b", fontSize: 12.5 };

function SearchTab({ datum, onAdded }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState(null);
  const [grams, setGrams] = useState(100);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const r = await api.searchFood(q.trim());
        setResults(r.items);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  if (picked) {
    const macros = scalePer100g(picked, grams);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {picked.naam}
          {picked.merk ? ` · ${picked.merk}` : ""}
        </div>
        <div>
          <div style={fieldLabel}>Hoeveelheid (g)</div>
          <input type="number" value={grams} onChange={(e) => setGrams(Number(e.target.value) || 0)} style={inputStyle} />
        </div>
        <div style={{ fontSize: 12.5, color: "#8b8f94" }}>
          {macros.kcal} kcal · E {macros.eiwit}g · K {macros.koolhydraten}g · V {macros.vet}g
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={() => setPicked(null)} style={{ flex: 1 }}>
            Terug
          </Button>
          <Button
            variant="dark"
            disabled={saving}
            style={{ flex: 2 }}
            onClick={async () => {
              setSaving(true);
              try {
                await api.addFoodEntry({ datum, naam: picked.naam, merk: picked.merk, hoeveelheid: grams, eenheid: "g", ...macros, bron: "zoeken", bronRef: picked.code });
                onAdded();
              } catch (e) {
                setError(e.message);
                setSaving(false);
              }
            }}
          >
            Toevoegen
          </Button>
        </div>
        {error && <div style={errorStyle}>{error}</div>}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <input autoFocus placeholder="Zoek een product…" value={q} onChange={(e) => setQ(e.target.value)} style={inputStyle} />
      {loading && <div style={{ fontSize: 13, color: "#8b8f94" }}>Zoeken…</div>}
      {error && <div style={errorStyle}>{error}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
        {results.map((p, i) => (
          <button
            key={i}
            onClick={() => setPicked(p)}
            style={{ textAlign: "left", padding: 12, border: "1px solid #e8ebee", borderRadius: 10, background: "#fff", cursor: "pointer" }}
          >
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#000" }}>{p.naam}</div>
            <div style={{ fontSize: 11.5, color: "#8b8f94" }}>
              {p.merk ? `${p.merk} · ` : ""}
              {p.kcalPer100g} kcal/100g
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function BarcodeTab({ datum, onAdded }) {
  const [supported] = useState(() => typeof window !== "undefined" && "BarcodeDetector" in window);
  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState("");
  const [product, setProduct] = useState(null);
  const [grams, setGrams] = useState(100);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  async function lookup(barcode) {
    setError("");
    try {
      const p = await api.lookupBarcode(barcode);
      setProduct(p);
      setCode(barcode);
    } catch (e) {
      setError(e.message);
    }
  }

  function stopScan() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function startScan() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScanning(true);
      // eslint-disable-next-line no-undef
      const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
      const tick = async () => {
        if (!streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            stopScan();
            await lookup(codes[0].rawValue);
            return;
          }
        } catch {
          // keep trying — a frame without a readable barcode isn't an error
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch (e) {
      setError("Camera niet beschikbaar: " + e.message);
    }
  }

  if (product) {
    const macros = scalePer100g(product, grams);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {product.naam}
          {product.merk ? ` · ${product.merk}` : ""}
        </div>
        <div>
          <div style={fieldLabel}>Hoeveelheid (g)</div>
          <input type="number" value={grams} onChange={(e) => setGrams(Number(e.target.value) || 0)} style={inputStyle} />
        </div>
        <div style={{ fontSize: 12.5, color: "#8b8f94" }}>
          {macros.kcal} kcal · E {macros.eiwit}g · K {macros.koolhydraten}g · V {macros.vet}g
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={() => setProduct(null)} style={{ flex: 1 }}>
            Terug
          </Button>
          <Button
            variant="dark"
            disabled={saving}
            style={{ flex: 2 }}
            onClick={async () => {
              setSaving(true);
              try {
                await api.addFoodEntry({ datum, naam: product.naam, merk: product.merk, hoeveelheid: grams, eenheid: "g", ...macros, bron: "barcode", bronRef: code });
                onAdded();
              } catch (e) {
                setError(e.message);
                setSaving(false);
              }
            }}
          >
            Toevoegen
          </Button>
        </div>
        {error && <div style={errorStyle}>{error}</div>}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      {supported ? (
        <>
          <Button variant={scanning ? "secondary" : "dark"} onClick={scanning ? stopScan : startScan} style={{ width: "100%" }}>
            {scanning ? "Stop scannen" : "Camera starten"}
          </Button>
          <video ref={videoRef} muted playsInline style={{ width: "100%", borderRadius: 12, background: "#000", display: scanning ? "block" : "none" }} />
        </>
      ) : (
        <div style={{ fontSize: 12.5, color: "#8b8f94" }}>Barcode scannen wordt niet ondersteund door deze browser. Voer de code handmatig in.</div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <input placeholder="Barcode-nummer" value={code} onChange={(e) => setCode(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        <Button variant="dark" onClick={() => lookup(code)} disabled={!code}>
          Zoek
        </Button>
      </div>
      {error && <div style={errorStyle}>{error}</div>}
    </div>
  );
}

function PhotoTab({ datum, onAdded }) {
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const base64 = await fileToCompressedBase64(file);
      const result = await api.analyzeFoodPhoto(base64, "image/jpeg");
      setDraft(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function set(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  if (draft) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
        {draft.toelichting && <div style={{ fontSize: 12, color: "#8b8f94" }}>{draft.toelichting}</div>}
        <div>
          <div style={fieldLabel}>Naam</div>
          <input value={draft.naam} onChange={(e) => set("naam", e.target.value)} style={inputStyle} />
        </div>
        <div style={gridStyle}>
          <div>
            <div style={fieldLabel}>Hoeveelheid (g)</div>
            <input type="number" value={draft.hoeveelheid} onChange={(e) => set("hoeveelheid", Number(e.target.value) || 0)} style={inputStyle} />
          </div>
          <div>
            <div style={fieldLabel}>Kcal</div>
            <input type="number" value={draft.kcal} onChange={(e) => set("kcal", Number(e.target.value) || 0)} style={inputStyle} />
          </div>
          <div>
            <div style={fieldLabel}>Eiwit (g)</div>
            <input type="number" value={draft.eiwit} onChange={(e) => set("eiwit", Number(e.target.value) || 0)} style={inputStyle} />
          </div>
          <div>
            <div style={fieldLabel}>Koolhydraten (g)</div>
            <input type="number" value={draft.koolhydraten} onChange={(e) => set("koolhydraten", Number(e.target.value) || 0)} style={inputStyle} />
          </div>
          <div>
            <div style={fieldLabel}>Vet (g)</div>
            <input type="number" value={draft.vet} onChange={(e) => set("vet", Number(e.target.value) || 0)} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={() => setDraft(null)} style={{ flex: 1 }}>
            Terug
          </Button>
          <Button
            variant="dark"
            disabled={saving}
            style={{ flex: 2 }}
            onClick={async () => {
              setSaving(true);
              try {
                await api.addFoodEntry({
                  datum,
                  naam: draft.naam,
                  hoeveelheid: draft.hoeveelheid,
                  eenheid: draft.eenheid || "g",
                  kcal: draft.kcal,
                  eiwit: draft.eiwit,
                  koolhydraten: draft.koolhydraten,
                  vet: draft.vet,
                  bron: "foto",
                });
                onAdded();
              } catch (e) {
                setError(e.message);
                setSaving(false);
              }
            }}
          >
            Toevoegen
          </Button>
        </div>
        {error && <div style={errorStyle}>{error}</div>}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <label
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          height: 140,
          border: "1.5px dashed #c2c8cf",
          borderRadius: 14,
          cursor: busy ? "default" : "pointer",
          color: "#8b8f94",
          fontSize: 13,
          textAlign: "center",
          padding: "0 20px",
        }}
      >
        {busy ? "AI analyseert de foto…" : "Tik om een foto te nemen of te kiezen"}
        <input type="file" accept="image/*" capture="environment" onChange={onFile} disabled={busy} style={{ display: "none" }} />
      </label>
      {error && <div style={errorStyle}>{error}</div>}
    </div>
  );
}

function ManualTab({ datum, onAdded }) {
  const [form, setForm] = useState({ naam: "", hoeveelheid: 100, eenheid: "g", kcal: "", eiwit: "", koolhydraten: "", vet: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    if (!form.naam.trim() || !form.kcal) {
      setError("Naam en kcal zijn verplicht.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.addFoodEntry({
        datum,
        naam: form.naam.trim(),
        hoeveelheid: Number(form.hoeveelheid) || 1,
        eenheid: form.eenheid || "g",
        kcal: Number(form.kcal) || 0,
        eiwit: Number(form.eiwit) || 0,
        koolhydraten: Number(form.koolhydraten) || 0,
        vet: Number(form.vet) || 0,
        bron: "handmatig",
      });
      onAdded();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={fieldLabel}>Naam</div>
        <input value={form.naam} onChange={(e) => set("naam", e.target.value)} style={inputStyle} />
      </div>
      <div style={gridStyle}>
        <div>
          <div style={fieldLabel}>Hoeveelheid</div>
          <input type="number" value={form.hoeveelheid} onChange={(e) => set("hoeveelheid", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={fieldLabel}>Eenheid</div>
          <input value={form.eenheid} onChange={(e) => set("eenheid", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={fieldLabel}>Kcal</div>
          <input type="number" value={form.kcal} onChange={(e) => set("kcal", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={fieldLabel}>Eiwit (g)</div>
          <input type="number" value={form.eiwit} onChange={(e) => set("eiwit", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={fieldLabel}>Koolhydraten (g)</div>
          <input type="number" value={form.koolhydraten} onChange={(e) => set("koolhydraten", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={fieldLabel}>Vet (g)</div>
          <input type="number" value={form.vet} onChange={(e) => set("vet", e.target.value)} style={inputStyle} />
        </div>
      </div>
      <Button variant="dark" disabled={saving} onClick={submit}>
        Toevoegen
      </Button>
      {error && <div style={errorStyle}>{error}</div>}
    </div>
  );
}
