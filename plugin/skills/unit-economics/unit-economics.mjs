// Unit economics calculator. Usage: node unit-economics.mjs input.json
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const FIELDS = ['price', 'variableCost', 'paymentFee', 'cac', 'purchasesPerMonth', 'lifetimeMonths', 'fixedCosts'];
const round = (n) => Math.round(n * 100) / 100;

export function unitEconomics(input) {
  for (const key of FIELDS) {
    if (!Number.isFinite(input[key]) || input[key] < 0) throw new Error(`"${key}" must be a number of 0 or more`);
  }
  const { price, variableCost, paymentFee, cac, purchasesPerMonth, lifetimeMonths, fixedCosts } = input;
  if (price === 0) throw new Error('"price" must be greater than 0');
  if (paymentFee >= 1) throw new Error('"paymentFee" is a share, for example 0.03 for 3%');
  const margin = price - variableCost - price * paymentFee;
  const ltv = margin * purchasesPerMonth * lifetimeMonths;
  const monthlyPerCustomer = margin * purchasesPerMonth;
  return {
    marginPerSale: round(margin),
    marginPercent: round((margin / price) * 100),
    ltv: round(ltv),
    ltvToCac: cac > 0 ? round(ltv / cac) : null,
    paybackMonths: monthlyPerCustomer > 0 ? round(cac / monthlyPerCustomer) : null,
    breakEvenSalesPerMonth: margin > 0 ? Math.ceil(fixedCosts / margin) : null,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    console.log(JSON.stringify(unitEconomics(JSON.parse(readFileSync(process.argv[2], 'utf8'))), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
