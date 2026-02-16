const form = document.getElementById("analyze-form");
const output = document.getElementById("output");

function urgencyClass(urgency) {
  if (urgency === "High") return "bg-red-100 text-red-800";
  if (urgency === "Moderate") return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
}

function renderResult(data) {
  const rows = data.flags
    .map(
      (flag) => `<tr class="border-t">
      <td class="px-3 py-2 font-medium">${flag.marker}</td>
      <td class="px-3 py-2">${flag.value ?? "N/A"}</td>
      <td class="px-3 py-2">${flag.range ? `${flag.range.min} - ${flag.range.max}` : "N/A"}</td>
      <td class="px-3 py-2">${flag.unit || ""}</td>
      <td class="px-3 py-2 ${flag.status === "normal" ? "text-emerald-700" : "text-red-700"}">${flag.status}</td>
    </tr>`
    )
    .join("");

  output.innerHTML = `
    <div class="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg px-4 py-3 mb-4 text-sm">
      ${data.disclaimer}
    </div>

    <div class="flex items-center gap-3 mb-4">
      <h2 class="text-xl font-semibold">Urgency</h2>
      <span class="px-3 py-1 rounded-full text-sm font-medium ${urgencyClass(data.urgency)}">${data.urgency}</span>
    </div>

    <div class="bg-white border rounded-xl overflow-hidden mb-4">
      <table class="w-full text-sm">
        <thead class="bg-slate-100 text-left">
          <tr>
            <th class="px-3 py-2">Marker</th>
            <th class="px-3 py-2">Value</th>
            <th class="px-3 py-2">Normal Range</th>
            <th class="px-3 py-2">Unit</th>
            <th class="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="grid md:grid-cols-2 gap-4">
      <article class="bg-white border rounded-xl p-4">
        <h3 class="font-semibold mb-2">Explanation</h3>
        <p class="text-sm text-slate-700">${data.explanation || "No explanation available."}</p>
      </article>
      <article class="bg-white border rounded-xl p-4">
        <h3 class="font-semibold mb-2">Doctor Prep Summary</h3>
        <p class="text-sm text-slate-700">${data.doctorSummary || "No summary available."}</p>
      </article>
    </div>
  `;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  output.innerHTML = "<p class='text-slate-600'>Analyzing report...</p>";

  const formData = new FormData(form);

  try {
    const response = await fetch("http://localhost:4000/api/analyze", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const result = await response.json();
    renderResult(result);
  } catch (error) {
    output.innerHTML = `<p class="text-red-700">${error.message}</p>`;
  }
});
