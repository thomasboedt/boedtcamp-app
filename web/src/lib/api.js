async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    method: options.method || "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Fout (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // trainer auth
  trainerLogin: (username, password) => request("/trainer/login", { method: "POST", body: { username, password } }),
  trainerLogout: () => request("/trainer/logout", { method: "POST" }),
  trainerMe: () => request("/trainer/me"),

  // client auth
  clientLogin: (pin) => request("/client/login", { method: "POST", body: { pin } }),
  clientLogout: () => request("/client/logout", { method: "POST" }),
  clientMe: () => request("/client/me"),

  // trainer: clients
  listClients: () => request("/trainer/clients"),
  createClient: (data) => request("/trainer/clients", { method: "POST", body: data }),
  updateClient: (id, data) => request(`/trainer/clients/${id}`, { method: "PATCH", body: data }),
  setClientPin: (id, pin) => request(`/trainer/clients/${id}/pin`, { method: "POST", body: { pin } }),
  deleteClient: (id) => request(`/trainer/clients/${id}`, { method: "DELETE" }),

  // trainer: program
  getDays: (clientId) => request(`/trainer/clients/${clientId}/days`),
  addDay: (clientId) => request(`/trainer/clients/${clientId}/days`, { method: "POST" }),
  updateDay: (dayId, data) => request(`/trainer/days/${dayId}`, { method: "PATCH", body: data }),
  deleteDay: (dayId) => request(`/trainer/days/${dayId}`, { method: "DELETE" }),
  rerollPool: (dayId) => request(`/trainer/days/${dayId}/reroll-pool`, { method: "POST" }),
  addItem: (dayId, data) => request(`/trainer/days/${dayId}/items`, { method: "POST", body: data }),
  updateItem: (itemId, data) => request(`/trainer/items/${itemId}`, { method: "PATCH", body: data }),
  deleteItem: (itemId) => request(`/trainer/items/${itemId}`, { method: "DELETE" }),
  moveItem: (itemId, direction) => request(`/trainer/items/${itemId}/move`, { method: "POST", body: { direction } }),

  // trainer: library
  library: (params) => request(`/trainer/library?${new URLSearchParams(params).toString()}`),
  libraryMuscles: () => request("/trainer/library/muscles"),

  // trainer: dashboard
  dashboard: (clientId) => request(`/trainer/clients/${clientId}/dashboard`),
  chartExercises: (clientId) => request(`/trainer/clients/${clientId}/chart-exercises`),
  progress: (clientId, exercise) => request(`/trainer/clients/${clientId}/progress?exercise=${encodeURIComponent(exercise)}`),

  // client: nutrition
  nutritionTargets: () => request("/client/nutrition/targets"),
  nutritionDay: (date) => request(`/client/nutrition/day?date=${date}`),
  addFoodEntry: (data) => request("/client/nutrition/entries", { method: "POST", body: data }),
  updateFoodEntry: (id, data) => request(`/client/nutrition/entries/${id}`, { method: "PATCH", body: data }),
  deleteFoodEntry: (id) => request(`/client/nutrition/entries/${id}`, { method: "DELETE" }),
  searchFood: (q) => request(`/client/nutrition/search?q=${encodeURIComponent(q)}`),
  lookupBarcode: (code) => request(`/client/nutrition/barcode/${encodeURIComponent(code)}`),
  recognizeFoodPhoto: (imageBase64) => request("/client/nutrition/photo", { method: "POST", body: { imageBase64 } }),

  // trainer: nutrition
  setNutritionTargets: (clientId, data) => request(`/trainer/clients/${clientId}/nutrition-targets`, { method: "PUT", body: data }),
  clientNutrition: (clientId, period, day) => request(`/trainer/clients/${clientId}/nutrition?period=${period}${day ? `&day=${day}` : ""}`),

  // client app
  clientDays: () => request("/client/days"),
  dayExercises: (dayId) => request(`/client/days/${dayId}/exercises`),
  startSession: (dayId) => request("/client/sessions", { method: "POST", body: { dayId } }),
  putSet: (sessionId, data) => request(`/client/sessions/${sessionId}/sets`, { method: "PUT", body: data }),
  deleteSet: (sessionId, oefeningNaam, setNr) =>
    request(`/client/sessions/${sessionId}/sets/${encodeURIComponent(oefeningNaam)}/${setNr}`, { method: "DELETE" }),
  completeSession: (sessionId, data) => request(`/client/sessions/${sessionId}/complete`, { method: "POST", body: data }),
  clientHistory: () => request("/client/history"),
};
