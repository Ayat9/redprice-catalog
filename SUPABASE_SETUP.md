# Supabase setup for price API

Use this to make `/api/price(.json)` truly persistent in production.

## 1) Create table

Run this SQL in Supabase SQL Editor:

```sql
create table if not exists public.electronic_price (
  id int primary key,
  name text not null,
  price text not null,
  updated_at timestamptz not null default now()
);

insert into public.electronic_price (id, name, price)
values (1, '', '')
on conflict (id) do nothing;
```

## 2) Set server environment variables

Set these in your production runtime:

- `SUPABASE_URL=https://<your-project>.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`
- `SUPABASE_PRICE_TABLE=electronic_price` (optional)

## 3) Restart backend

After setting env vars, restart the Node process.

## 4) Verify

- `GET /api/price`
- `GET /api/price.json`
- `POST /api/update-price` with body:
  `{"name":"Товар","price":"1000"}`

All GET endpoints should return updated JSON from Supabase.

