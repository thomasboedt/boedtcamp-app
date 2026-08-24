import { useEffect, useState } from "react";
import { api } from "../../../lib/api.js";
import FoodDiary from "./FoodDiary.jsx";
import FoodAddScreen from "./FoodAddScreen.jsx";
import FoodEditScreen from "./FoodEditScreen.jsx";
import { isoAdd, isoToday } from "./foodShared.js";

const DEFAULT_TARGETS = { kcal: 2000, carbs: 220, protein: 120, fat: 70 };

export default function FoodApp({ onBack }) {
  const [screen, setScreen] = useState("diary"); // diary | add | edit
  const [addMode, setAddMode] = useState("search");
  const [addPhotoFile, setAddPhotoFile] = useState(null);
  const [date, setDate] = useState(isoToday());
  const [targets, setTargets] = useState(DEFAULT_TARGETS);
  const [entries, setEntries] = useState([]);
  const [totals, setTotals] = useState({ kcal: 0, carbs: 0, protein: 0, fat: 0 });
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

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
    setScreen("edit");
  }

  async function saveDraft() {
    setSaving(true);
    try {
      if (draft.editing) {
        await api.updateFoodEntry(draft.editing, {
          meal: draft.meal,
          grams: draft.grams,
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
    } finally {
      setSaving(false);
    }
  }

  async function addAll(drafts) {
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(entry) {
    setEntries((list) => list.filter((e) => e.id !== entry.id));
    await api.deleteFoodEntry(entry.id);
    await loadDay(date);
  }

  if (screen === "add") {
    return (
      <FoodAddScreen
        initialMode={addMode}
        initialPhotoFile={addPhotoFile}
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
        onCancel={() => {
          setDraft(null);
          setScreen(addMode === "photo" ? "add" : "diary");
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
      onEditEntry={openEdit}
      onRemoveEntry={removeEntry}
      onBack={onBack}
    />
  );
}
