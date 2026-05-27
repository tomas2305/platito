# Platito — Bulk transaction import

Help me generate a JSON to bulk import transactions and/or transfers into Platito.

## Output format

Return ONLY a valid JSON object with this exact structure (omit empty keys):

```json
{
  "transactions": [...],
  "transfers": [...]
}
```

Do not include any additional text, only the JSON.

## Transaction fields

| Field | Type | Required | Description |
|---|---|---|---|
| accountId | number | yes | Account ID |
| categoryId | number | yes | Category ID (type must match) |
| type | "expense" \| "income" | yes | Transaction type |
| amount | number | yes | Positive amount |
| currency | "ARS" \| "USD_BLUE" \| "USD_MEP" \| "USDT" | yes | Must match the account's currency |
| date | string (YYYY-MM-DD) | yes | Date |
| description | string | yes | Description |
| tagIds | number[] | no | Tag IDs (omit or use []) |

## Transfer fields

| Field | Type | Required | Description |
|---|---|---|---|
| fromAccountId | number | yes | Source account |
| toAccountId | number | yes | Destination account (must differ from source) |
| amount | number | yes | Amount in source account currency |
| convertedAmount | number | yes | Amount in destination account currency |
| exchangeRate | number | yes | Exchange rate (convertedAmount / amount) |
| date | string (YYYY-MM-DD) | yes | Date |
| description | string | no | Optional description |

## Important constraints

- `currency` in transactions MUST match the currency of the account (`accountId`)
- The `type` of the category MUST match the `type` of the transaction
- All IDs must exist in the context data below — do not invent IDs
- For transfers between accounts with the same currency, `exchangeRate` is 1 and `convertedAmount` equals `amount`
- All amounts must be positive numbers

---

## Your database context

### Available accounts

{{ACCOUNTS}}

### Available categories

{{CATEGORIES}}

### Available tags

{{TAGS}}
