---
name: unit-economics
description: "Margin, break-even, LTV and CAC computed from the business's numbers by a script, not in your head. Use for prices, discounts and profitability. Расчёт маржи, точки безубыточности, LTV и CAC по цифрам бизнеса скриптом, без счёта в уме."
---

# Unit economics
1. Collect: price, variable cost per sale, payment fee as a share, customer acquisition cost, purchases per customer per month, customer lifetime in months, fixed costs per month.
2. Write them as JSON and run the script from this skill's folder:
```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/unit-economics/unit-economics.mjs" input.json
```
Example `input.json`:
```json
{"price": 100, "variableCost": 35, "paymentFee": 0.03, "cac": 40, "purchasesPerMonth": 1, "lifetimeMonths": 6, "fixedCosts": 3000}
```
3. Explain the result plainly: does a sale earn money, does a customer pay back, how many sales a month are needed.
4. Show what happens with a price 10% lower and acquisition cost 30% higher.
Mark assumptions separately from facts. This is a calculation, not investment or tax advice.

Answer in the user's language.
