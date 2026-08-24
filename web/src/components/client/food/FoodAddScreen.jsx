import { useEffect, useRef, useState } from "react";
import { api } from "../../../lib/api.js";
import Button from "../../../ds/Button.jsx";
import { DEMO_BARCODES, scaleToGrams, suggestMeal } from "./foodShared.js";

const tabStyle = (active) => ({
  flex: 1,
  padding: "10px 4px",
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  border: "1.5px solid " + (active ? "#000" : "#e8ebee"),
  background: active ? "#000" : "#fff",
  color: active ? "#fff" : "#7c8794",
  textAlign: "center",
});

function productToDraft(product, grams) {
  const g = Math.max(1, Math.round(grams || product.defaultGrams || 100));
  const per100 = { kcal100: product.kcal100, carbs100: product.carbs100, protein100: product.protein100, fat100: product.fat100 };
  return { naam: product.naam, merk: product.merk || "", barcode: product.code || "", per100, grams: g, meal: suggestMeal(), bron: product.bron, ...scaleToGrams(per100, g) };
}

function aiItemToDraft(item) {
  const g = Math.max(1, Math.round(Number(item.gram) || 100));
  const per100 = {
    kcal100: ((Number(item.kcal) || 0) * 100) / g,
    carbs100: ((Number(item.koolhydraten) || 0) * 100) / g,
    protein100: ((Number(item.eiwitten) || 0) * 100) / g,
    fat100: ((Number(item.vetten) || 0) * 100) / g,
  };
  return { naam: item.naam || "Onbekend gerecht", merk: "Geschat uit je foto", barcode: "", per100, grams: g, meal: suggestMeal(), bron: "foto-herkenning", ...scaleToGrams(per100, g) };
}

function resizeToBase64(file, maxSize) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.8), previewUrl: canvas.toDataURL("image/jpeg", 0.6) });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("kon foto niet lezen"));
    };
    img.src = url;
  });
}

export default function FoodAddScreen({ initialMode, initialPhotoFile, onBack, onPick, onAddAll }) {
  const [mode, setMode] = useState(initialMode || "search");

  // search
  const [query, setQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState("idle"); // idle | loading | ok | empty | short
  const [results, setResults] = useState([]);
  const [source, setSource] = useState("");

  // scan
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanStatus, setScanStatus] = useState("idle"); // idle | starting | live | looking | unavailable
  const [barcodeMsg, setBarcodeMsg] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  // photo
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoMsg, setPhotoMsg] = useState("");
  const [aiStatus, setAiStatus] = useState("idle"); // idle | busy | ok | fail
  const [aiItems, setAiItems] = useState([]);
  const [aiConfidence, setAiConfidence] = useState("");
  const [aiMsg, setAiMsg] = useState("");

  useEffect(() => {
    if (mode === "scan") startScan();
    else stopScan();
    return stopScan;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (initialPhotoFile) handlePhotoFile(initialPhotoFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopScan() {
    clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function startScan() {
    setScanStatus("starting");
    setBarcodeMsg("");
    if (!navigator.mediaDevices?.getUserMedia || typeof window.BarcodeDetector === "undefined") {
      setScanStatus("unavailable");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } } })
      .then((stream) => {
        streamRef.current = stream;
        setScanStatus("live");
        requestAnimationFrame(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        });
        let detector;
        try {
          detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
        } catch {
          setScanStatus("unavailable");
          return;
        }
        timerRef.current = setInterval(() => {
          const v = videoRef.current;
          if (!v || v.readyState < 2) return;
          detector
            .detect(v)
            .then((codes) => {
              if (codes.length) {
                stopScan();
                submitBarcode(codes[0].rawValue);
              }
            })
            .catch(() => {});
        }, 600);
      })
      .catch(() => setScanStatus("unavailable"));
  }

  async function submitBarcode(code) {
    const clean = String(code || "").replace(/\D/g, "");
    if (!clean) {
      setBarcodeMsg("Vul een geldige barcode in.");
      return;
    }
    setScanStatus("looking");
    setBarcodeMsg("");
    try {
      const product = await api.lookupBarcode(clean);
      onPick(productToDraft(product));
    } catch {
      setScanStatus("idle");
      setBarcodeMsg(`Barcode ${clean} niet gevonden. Zoek het product op naam — je kan de waarden daarna zelf aanpassen.`);
    }
  }

  async function runSearch() {
    const q = query.trim();
    if (q.length < 2) {
      setSearchStatus("short");
      return;
    }
    setSearchStatus("loading");
    setResults([]);
    const res = await api.searchFood(q);
    setResults(res.items);
    setSource(res.source);
    setSearchStatus(res.items.length ? "ok" : "empty");
  }

  async function handlePhotoFile(file) {
    if (!file) return;
    setMode("photo");
    setAiStatus("idle");
    setAiItems([]);
    setAiMsg("");
    setPhotoMsg("Barcode zoeken op de verpakking…");
    let resized;
    try {
      resized = await resizeToBase64(file, 1024);
    } catch {
      setPhotoMsg("");
      setAiStatus("fail");
      setAiMsg("De foto kon niet gelezen worden. Zoek het product op naam.");
      return;
    }
    setPhotoUrl(resized.previewUrl);

    const goAi = async () => {
      setPhotoMsg("");
      setAiStatus("busy");
      try {
        const b64 = resized.dataUrl.split(",")[1];
        const result = await api.recognizeFoodPhoto(b64);
        setAiItems(result.items);
        setAiConfidence(result.confidence || "");
        setAiStatus("ok");
      } catch (err) {
        setAiStatus("fail");
        setAiMsg(err.message || "De beeldherkenning gaf geen antwoord. Probeer opnieuw of zoek het product op naam.");
      }
    };

    if (typeof window.BarcodeDetector === "undefined") {
      goAi();
      return;
    }
    try {
      const img = new Image();
      const found = await new Promise((resolve) => {
        img.onload = async () => {
          try {
            const detector = new window.BarcodeDetector();
            const codes = await detector.detect(img);
            resolve(codes.length ? codes[0].rawValue : null);
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = resized.dataUrl;
      });
      if (found) {
        setPhotoMsg("");
        const product = await api.lookupBarcode(found).catch(() => null);
        if (product) {
          onPick(productToDraft(product));
          return;
        }
      }
      goAi();
    } catch {
      goAi();
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 18px 12px", borderBottom: "1px solid #e8ebee" }}>
        <button onClick={onBack} style={{ flex: "none", width: 34, height: 34, border: "1px solid #e8ebee", background: "#fff", borderRadius: 10, fontSize: 15, cursor: "pointer", color: "#454e58" }}>
          ‹
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 17, color: "#000" }}>Product toevoegen</div>
          <div style={{ fontSize: 11.5, color: "#8b8f94" }}>Open Food Facts · open databank</div>
        </div>
      </div>

      <div style={{ padding: "14px 16px 28px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setMode("search")} style={tabStyle(mode === "search")}>
            Zoeken
          </button>
          <button onClick={() => setMode("scan")} style={tabStyle(mode === "scan")}>
            Barcode
          </button>
          <label style={{ ...tabStyle(mode === "photo"), cursor: "pointer" }}>
            <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotoFile(e.target.files?.[0])} style={{ display: "none" }} />
            Foto
          </label>
        </div>

        {mode === "search" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Bv. griekse yoghurt, volkorenbrood"
                style={{ flex: 1, minWidth: 0, height: 48, padding: "0 14px", border: "1.5px solid #e8ebee", borderRadius: 12, fontSize: 15, color: "#000", outline: "none" }}
              />
              <button onClick={runSearch} style={{ flex: "none", height: 48, padding: "0 18px", border: 0, borderRadius: 12, background: "#000", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Zoek
              </button>
            </div>
            {searchStatus === "short" && <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 10 }}>Typ minstens twee letters.</div>}
            {searchStatus === "loading" && <div style={{ fontSize: 13, color: "#1f5dc4", fontWeight: 600, marginTop: 14 }}>Zoeken in Open Food Facts…</div>}
            {searchStatus === "empty" && (
              <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#7c8794", marginTop: 14, background: "#f4f6f8", borderRadius: 12, padding: "12px 14px" }}>
                Geen product gevonden. Probeer een korter woord, of scan de barcode — dan vind je het product bijna altijd.
              </div>
            )}
            {source && <div style={{ fontSize: 11.5, color: "#8b8f94", marginTop: 14 }}>{source}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => onPick(productToDraft(r))}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, border: "1.5px solid #e8ebee", background: "#fff", borderRadius: 14, cursor: "pointer", textAlign: "left" }}
                >
                  <span style={{ flex: "none", width: 40, height: 40, borderRadius: 10, background: "#f4f6f8" }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#000" }}>{r.naam}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "#8b8f94", marginTop: 1 }}>{r.merk}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "#c2c8cf", marginTop: 2 }}>
                      {r.kcal100} kcal · {r.carbs100} kh · {r.protein100} eiw per 100 g
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === "scan" && (
          <div>
            {scanStatus === "live" && (
              <div style={{ marginTop: 14, position: "relative", borderRadius: 14, overflow: "hidden", background: "#000" }}>
                <video ref={videoRef} playsInline muted autoPlay style={{ width: "100%", height: 240, objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", left: "12%", right: "12%", top: "38%", height: "24%", border: "2px solid #2c9dfd", borderRadius: 10 }} />
              </div>
            )}
            {scanStatus === "live" && <div style={{ fontSize: 13, color: "#7c8794", marginTop: 12 }}>Houd de barcode in het kader — we lezen hem automatisch.</div>}
            {scanStatus === "starting" && <div style={{ fontSize: 13, color: "#1f5dc4", fontWeight: 600, marginTop: 14 }}>Camera openen…</div>}
            {scanStatus === "looking" && <div style={{ fontSize: 13, color: "#1f5dc4", fontWeight: 600, marginTop: 14 }}>Barcode gevonden — product ophalen…</div>}
            {scanStatus === "unavailable" && (
              <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#7c8794", marginTop: 14, background: "#f4f6f8", borderRadius: 12, padding: "12px 14px" }}>
                De camera is hier niet beschikbaar. Vul de cijfers onder de barcode in — dat geeft exact hetzelfde resultaat.
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Bv. 5410041000122"
                style={{ flex: 1, minWidth: 0, height: 48, padding: "0 14px", border: "1.5px solid #e8ebee", borderRadius: 12, fontSize: 15, color: "#000", outline: "none" }}
              />
              <button onClick={() => submitBarcode(barcodeInput)} style={{ flex: "none", height: 48, padding: "0 18px", border: 0, borderRadius: 12, background: "#000", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Zoek
              </button>
            </div>
            {barcodeMsg && <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#c9463c", marginTop: 10 }}>{barcodeMsg}</div>}
            <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8f94", marginTop: 18 }}>Voorbeeldbarcodes</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {DEMO_BARCODES.map((c) => (
                <button
                  key={c}
                  onClick={() => submitBarcode(c)}
                  style={{ padding: "9px 14px", border: "1.5px solid #e8ebee", background: "#fff", borderRadius: 999, fontSize: 12.5, color: "#454e58", cursor: "pointer" }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === "photo" && (
          <div>
            {photoUrl && <div style={{ marginTop: 14, height: 160, borderRadius: 14, background: `#000 url(${photoUrl}) center/cover no-repeat` }} />}
            {photoMsg && <div style={{ fontSize: 13, lineHeight: 1.6, color: "#7c8794", marginTop: 12 }}>{photoMsg}</div>}

            {aiStatus === "busy" && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, padding: 14, borderRadius: 14, background: "#000", color: "#fff" }}>
                <span style={{ flex: "none", width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#2c9dfd,#1f5dc4)" }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>De foto wordt bekeken…</span>
                  <span style={{ display: "block", fontSize: 12, color: "#8b8f94", marginTop: 1 }}>We herkennen de gerechten en schatten de portie</span>
                </span>
              </div>
            )}

            {aiStatus === "ok" && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8f94" }}>Herkend op je foto</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                  {aiItems.map((it, i) => (
                    <button
                      key={i}
                      onClick={() => onPick(aiItemToDraft(it))}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, border: "1.5px solid #e8ebee", background: "#fff", borderRadius: 14, cursor: "pointer", textAlign: "left" }}
                    >
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "#000" }}>{it.naam}</span>
                        <span style={{ display: "block", fontSize: 11.5, color: "#8b8f94", marginTop: 2 }}>± {it.gram} g</span>
                      </span>
                      <span style={{ flex: "none", fontSize: 13, fontWeight: 600, color: "#1f5dc4" }}>{it.kcal} kcal</span>
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 12.5, color: "#454e58", marginTop: 12, fontWeight: 600 }}>
                  Samen {Math.round(aiItems.reduce((a, i) => a + (Number(i.kcal) || 0), 0))} kcal
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.6, color: "#8b8f94", marginTop: 4 }}>
                  {aiConfidence ? `Zekerheid: ${aiConfidence}.` : ""} Tik een item aan om de portie en de waarden aan te passen.
                </div>
                <div style={{ marginTop: 14 }}>
                  <Button variant="primary" size="lg" onClick={() => onAddAll(aiItems.map(aiItemToDraft))} style={{ width: "100%", height: 54, fontSize: 16 }}>
                    Alles toevoegen aan mijn dag
                  </Button>
                </div>
              </div>
            )}

            {aiStatus === "fail" && (
              <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#7c8794", marginTop: 14, background: "#f4f6f8", borderRadius: 12, padding: "12px 14px" }}>{aiMsg}</div>
            )}

            <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8f94", marginTop: 20 }}>Of zoek zelf op naam</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Naam van het product"
                style={{ flex: 1, minWidth: 0, height: 48, padding: "0 14px", border: "1.5px solid #e8ebee", borderRadius: 12, fontSize: 15, color: "#000", outline: "none" }}
              />
              <button onClick={runSearch} style={{ flex: "none", height: 48, padding: "0 18px", border: 0, borderRadius: 12, background: "#000", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Zoek
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => onPick(productToDraft(r))}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, border: "1.5px solid #e8ebee", background: "#fff", borderRadius: 14, cursor: "pointer", textAlign: "left" }}
                >
                  <span style={{ flex: "none", width: 40, height: 40, borderRadius: 10, background: "#f4f6f8" }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#000" }}>{r.naam}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "#c2c8cf", marginTop: 2 }}>
                      {r.kcal100} kcal per 100 g
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
