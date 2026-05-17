const sizes = ["4 Años", "L/XL", "M", "2 Años", "S/M", "10 Años", "XXS/XS", "S", "XL", "XS", "8 Años", "6 Años", "12 Años"];

function getSortIndex(sizeStr) {
  if (!sizeStr) return 999;
  const s = sizeStr.toUpperCase().trim();
  const sizeOrder = ["XXS", "XS", "S", "M", "L", "XL", "2XL", "XXL", "3XL", "XXXL", "4XL", "5XL"];
  let idx = sizeOrder.indexOf(s);
  if (idx !== -1) return idx;
  const parts = s.split(/[\/\-]/);
  if (parts.length > 1) {
     idx = sizeOrder.indexOf(parts[0].trim());
     if (idx !== -1) return idx;
  }
  const numMatch = s.match(/\d+/);
  if (numMatch) return 100 + parseInt(numMatch[0]);
  return 900;
}

sizes.sort((a, b) => {
    const ai = getSortIndex(a);
    const bi = getSortIndex(b);
    if (ai !== bi) return ai - bi;
    return a.localeCompare(b);
});
console.log(sizes);
