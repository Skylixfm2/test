const inputs = document.querySelectorAll("[data-autocomplete]");
inputs.forEach((input) => {
  const list = document.createElement("datalist");
  list.id = `auto-${Math.random().toString(36).slice(2)}`;
  input.setAttribute("list", list.id);
  input.after(list);
  input.addEventListener("input", async () => {
    if (input.value.length < 2) return;
    const root = location.pathname.split("/")[1] ? `/${location.pathname.split("/")[1]}` : "";
    const response = await fetch(`${root}/api/autocomplete?q=${encodeURIComponent(input.value)}`);
    if (!response.ok) return;
    const items = await response.json();
    list.replaceChildren(...items.map((item) => {
      const option = document.createElement("option");
      option.value = item;
      return option;
    }));
  });
});

document.querySelectorAll("[data-person-autocomplete]").forEach((input) => {
  const list = document.createElement("datalist");
  list.id = `people-${Math.random().toString(36).slice(2)}`;
  input.setAttribute("list", list.id);
  input.after(list);
  input.addEventListener("input", async () => {
    if (input.value.length < 2) return;
    const root = location.pathname.split("/")[1] ? `/${location.pathname.split("/")[1]}` : "";
    const response = await fetch(`${root}/api/people/autocomplete?q=${encodeURIComponent(input.value)}`);
    if (!response.ok) return;
    const items = await response.json();
    list.replaceChildren(...items.map((item) => {
      const option = document.createElement("option");
      option.value = item;
      return option;
    }));
  });
});
