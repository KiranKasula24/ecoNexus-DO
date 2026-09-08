This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## EcoNexus Workflow Runbook (MVP)

### 1) Apply SQL migrations (required before ingestion)

Run these in Supabase SQL Editor in this order:

1. `supabase/migrations/20260408_processed_sku_mappings.sql`
2. `supabase/migrations/20260408_product_passport_excel_workflow.sql`

If these are not applied, capabilities ingestion fails with `PGRST205` table-not-found errors.

### 2) Ingest recycler capabilities DOCX (capabilities-first mapping)

```bash
node scripts/ingest_recycler_capabilities.js "c:\Users\kiran\OneDrive\Desktop\EcoNexus_Recycler_Capabilities.docx" "recycler-capabilities-2026-04-08"
```

### 3) Backfill active marketplace offers with processed SKU candidates

```bash
curl -X POST http://localhost:3000/api/mappings/backfill-active-feed
```

### 4) Upload Excel workbook for product passports

Use dashboard page:
- `/materials/flow/create`

Or API:

```bash
curl -X POST http://localhost:3000/api/passports/excel/upload ^
  -F "company_id=<company-uuid>" ^
  -F "source_doc_version=excel-passport-v1" ^
  -F "file=@C:\path\to\passport_input.xlsx"
```

Workbook must include sheets:
- `products`
- `inputs`
- `outputs`

### 5) Trigger agent cycle manually

```bash
curl -X POST http://localhost:3000/api/cron/run-agents
```

Set `ENABLE_AGENT_CRON=true` for this route to execute the run.
