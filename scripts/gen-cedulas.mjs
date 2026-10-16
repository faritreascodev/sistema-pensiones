function withCheckDigit(nine) {
  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    let product = Number(nine[index]) * coefficients[index];
    if (product > 9) product -= 9;
    sum += product;
  }
  return `${nine}${(10 - (sum % 10)) % 10}`;
}

const bases = [
  "080100001",
  "080100002",
  "080100003",
  "080100004",
  "080100005",
  "080100006",
  "080200001",
  "080200002",
  "080200003",
  "080200004",
  "080200005",
  "080200006",
  "171003406",
];

for (const base of bases) {
  console.log(withCheckDigit(base));
}
