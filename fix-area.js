const fs = require('fs');
const path = './src/components/product/ProductConfigurator.tsx';
let content = fs.readFileSync(path, 'utf8');

// Find the calculation of area in calculateRealPrintCost
// if (pricingType === "AreaRange" || pricingType === "ColourAreaRange") {
//   const area = printAreaMm2 || 0;
content = content.replace(
  'const area = printAreaMm2 || 0;',
  'const area = (printAreaMm2 || 0) / 100; // Convert mm2 to cm2 for Midocean pricing ranges'
);

// We should also make sure that if area falls out of bounds (larger than max), it uses the MOST EXPENSIVE range, not the cheapest!
/*
    // If no match (e.g. area is too small), use the first (cheapest) range
    if (!selectedRange && pricing.varCosts?.length) {
      selectedRange = pricing.varCosts[0];
    }
*/
content = content.replace(
  'if (!selectedRange && pricing.varCosts?.length) {\n      selectedRange = pricing.varCosts[0];\n    }',
  `if (!selectedRange && pricing.varCosts?.length) {
      // If no match, check if area is larger than all ranges. If so, use the last (most expensive) range.
      const lastRange = pricing.varCosts[pricing.varCosts.length - 1];
      if (area > lastRange.areaTo) {
        selectedRange = lastRange;
      } else {
        selectedRange = pricing.varCosts[0];
      }
    }`
);

fs.writeFileSync(path, content);
console.log("Fixed area logic in ProductConfigurator.tsx");
