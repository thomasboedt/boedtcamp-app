import { useEffect, useState } from "react";
import { api } from "../../../lib/api.js";
import FoodDiary from "./FoodDiary.jsx";
import FoodAddScreen from "./FoodAddScreen.jsx";
import FoodEditScreen from "./FoodEditScreen.jsx";
import CopyDayScreen from "./CopyDayScreen.jsx";
import { isoAdd, isoToday } from "./foodShared.js";

const DEFAULT_TARGETS = { kcal: 2000, carbs: 220, protein: 120, fat: 70 };

export default function FoodApp({ onBack }) {
  const [screen, setScreen] = useState("diary"); // diary | add | edit | copy
  const [copying, setCopying] = useState(false);
  const [addMode, setAddMode] = useState("search");
  const [addPhotoFile, setAddPhotoFile] = useState(null);
  const [date, setDate] = useState(isoToday());
  const [targets, setTargets] = useState(DEFAULT_TARGETS);
  const [entries, setEntries] = useState([]);
  const [totals, setTotals] = useState({ kcal: 0, carbs: 0, protein: 0, fat: 0 });
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    api.nutritionTargets().then(setTargets);
  }, []);

  useEffect(() => {
    loadDay(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function loadDay(iso) {
    const res = await api.nutritionDay(iso);
    setEntries(res.entries);
    setTotals(res.totals);
  }

  function openAdd(mode, file) {
    setAddMode(mode);
    setAddPhotoFile(file || null);
    setSaveError("");
    setScreen("add");
  }

  function openEdit(entry) {
    const g = entry.grams || 100;
    setDraft({
      editing: entry.id,
      naam: entry.naam,
      merk: entry.merk || "",
      barcode: entry.barcode || "",
      bron: entry.bron,
      meal: entry.meal,
      grams: entry.grams,
      unit: entry.unit ?? entry.grams,
      count: entry.count || 1,
      kcal: entry.kcal,
      carbs: entry.carbs,
      protein: entry.protein,
      fat: entry.fat,
      per100: {
        kcal100: (entry.kcal * 100) / g,
        carbs100: (entry.carbs * 100) / g,
        protein100: (entry.protein * 100) / g,
        fat100: (entry.fat * 100) / g,
      },
    });
    setScreen("edit");
  }

  function pickDraft(d) {
    setDraft(d);
    setSaveError("");
    setScreen("edit");
  }

  async function saveDraft() {
    setSaving(true);
    setSaveError("");
    try {
      if (draft.editing) {
        await api.updateFoodEntry(draft.editing, {
          meal: draft.meal,
          grams: draft.grams,
          unit: draft.unit,
          count: draft.count,
          kcal: Math.round(draft.kcal),
          carbs: draft.carbs,
          protein: draft.protein,
          fat: draft.fat,
        });
      } else {
        await api.addFoodEntry({
          dateIso: date,
          meal: draft.meal,
          naam: draft.naam,
          merk: draft.merk || null,
          barcode: draft.barcode || null,
          grams: draft.grams,
          unit: draft.unit,
          count: draft.count,
          kcal: Math.round(draft.kcal),
          carbs: draft.carbs,
          protein: draft.protein,
          fat: draft.fat,
          bron: draft.bron,
        });
      }
      setDraft(null);
      setScreen("diary");
      await loadDay(date);
    } catch (err) {
      setSaveError(err.message || "Opslaan is niet gelukt. Probeer opnieuw.");
    } finally {
      setSaving(false);
    }
  }

  async function addAll(drafts) {
    setSaving(true);
    setSaveError("");
    try {
      await Promise.all(
        drafts.map((d) =>
          api.addFoodEntry({
            dateIso: date,
            meal: d.meal,
            naam: d.naam,
            merk: d.merk || null,
            barcode: d.barcode || null,
            grams: d.grams,
            unit: d.unit,
            count: d.count,
            kcal: Math.round(d.kcal),
            carbs: d.carbs,
            protein: d.protein,
            fat: d.fat,
            bron: d.bron,
          })
        )
      );
      setScreen("diary");
      await loadDay(date);
    } catch (err) {
      setSaveError(err.message || "Opslaan is niet gelukt. Probeer opnieuw.");
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(entry) {
    setEntries((list) => list.filter((e) => e.id !== entry.id));
    await api.deleteFoodEntry(entry.id);
    await loadDay(date);
  }

  async function copyEntries(picked) {
    setCopying(true);
    try {
      await Promise.all(
        picked.map((e) =>
          api.addFoodEntry({
            dateIso: date,
            meal: e.meal,
            naam: e.naam,
            merk: e.merk || null,
            barcode: e.barcode || null,
            grams: e.grams,
            unit: e.unit,
            count: e.count,
            kcal: e.kcal,
            carbs: e.carbs,
            protein: e.protein,
            fat: e.fat,
            bron: e.bron,
          })
        )
      );
      setScreen("diary");
      await loadDay(date);
    } finally {
      setCopying(false);
    }
  }

  if (screen === "copy") {
    return <CopyDayScreen targetDate={date} copying={copying} onBack={() => setScreen("diary")} onCopy={copyEntries} />;
  }

  if (screen === "add") {
    return (
      <FoodAddScreen
        initialMode={addMode}
        initialPhotoFile={addPhotoFile}
        saving={saving}
        saveError={saveError}
        onBack={() => setScreen("diary")}
        onPick={pickDraft}
        onAddAll={addAll}
      />
    );
  }

  if (screen === "edit" && draft) {
    return (
      <FoodEditScreen
        draft={draft}
        setDraft={setDraft}
        saving={saving}
        saveError={saveError}
        onCancel={() => {
          setDraft(null);
          setScreen(addMode === "photo" || addMode === "voice" ? "add" : "diary");
        }}
        onSave={saveDraft}
      />
    );
  }

  return (
    <FoodDiary
      date={date}
      entries={entries}
      totals={totals}
      targets={targets}
      canGoNext={date < isoToday()}
      onPrevDay={() => setDate((d) => isoAdd(d, -1))}
      onNextDay={() => setDate((d) => isoAdd(d, 1))}
      onPhotoFile={(file) => file && openAdd("photo", file)}
      onOpenScan={() => openAdd("scan")}
      onOpenSearch={() => openAdd("search")}
      onOpenVoice={() => openAdd("voice")}
      onOpenCopy={() => setScreen("copy")}
      onEditEntry={openEdit}
      onRemoveEntry={removeEntry}
      onBack={onBack}
    />
  );
}
