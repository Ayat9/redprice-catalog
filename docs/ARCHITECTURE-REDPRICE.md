# Redprice.kz — архитектура fullstack (TailAdmin-оболочка, домены)

Документ описывает **структуру папок**, **схему БД (Prisma)** и **соответствие трём разделам бокового меню**. Реализация UI/API — поэтапно поверх текущего React + Express.

---

## 1. Схема базы данных (Prisma)

Файл: `prisma/schema.prisma` (PostgreSQL).

### Сущности и связи (кратко)

| Модель | Назначение |
|--------|------------|
| **User** | Единый вход; поле `role` (ADMIN, INVESTOR, PROCUREMENT, CONTENT, READER). |
| **Investor** | Профиль инвестора `1:1` к `User`. |
| **Store** | Торговая точка (код 1С `external1cId`). |
| **InvestorStore** | Связь **Investor_ID ↔ Store_ID** (M:N), уникальная пара, опциональные флаги прав (`canViewFinance`, `canViewVideo`). |
| **Product** | Номенклатура 1С (`sku1c`), связь с **Category**, опционально **Supplier**. |
| **StoreProductSnapshot** | По паре (store, product): цена из 1С, цена на ESL, валюта, метки синхронизации. |
| **PriceChangeJob** | Очередь изменения цены: `newPrice`, `scheduledFor`, `status` (в т.ч. отложенная ночная отправка). |
| **EslDisplaySchedule** | Расписание ESL (cron, по точке или глобально). |
| **IntegrationSyncLog** | Статусы обмена с 1С / ESL. |
| **BlogPost** | Новости для главной (slug, body, published). |
| **Supplier** | Поставщики; **Product.supplierId** — связь для модуля закупа. |

### Потоки данных

1. **Инвестор после логина** → `SELECT Store WHERE id IN (InvestorStore WHERE investorId = …)` → список карточек магазинов → дашборд по `storeId` (видео, касса, планограмма — данные в тех же таблицах/интеграциях или отдельные read-модели позже).
2. **Закуп** → одна таблица на экране = join `StoreProductSnapshot` + `Product` (+ при необходимости `Supplier`), редактирование новой цены → создание **PriceChangeJob** с `scheduledFor` на ночь и `status = SCHEDULED`.
3. **Автоматизация** → чтение `EslDisplaySchedule`, `IntegrationSyncLog` по `storeId` или глобально.

После изменений схемы: `npx prisma migrate dev` (или `db push` в прототипе).

---

## 2. Предлагаемая структура папок (frontend)

Цель — убрать «бардак» вкладок: один **layout TailAdmin** с тремя **группами** в сайдбаре, маршруты по доменам.

```
src/
├── app/                          # маршруты (route-level)
│   └── (redprice)/
│       ├── layout.jsx            # общая оболочка (сайдбар: 3 раздела)
│       ├── InvestorPage.jsx      # редирект или оболочка «Инвестор»
│       ├── procurement/          # «Управление товарами»
│       │   └── ProcurementPage.jsx
│       ├── automation/           # «Автоматизация»
│       │   └── AutomationPage.jsx
│       └── blog/                 # CMS новостей (роль CONTENT / ADMIN)
│           └── BlogAdminPage.jsx
├── features/
│   ├── investor/
│   │   ├── components/           # StoreCards, StoreDashboardShell, вкладки Видео/Касса/Планограмма
│   │   ├── hooks/useInvestorStores.ts
│   │   └── api/investor-api.ts
│   ├── procurement/
│   │   ├── components/           # NomenclatureTable, PriceEditor, SuppliersPanel
│   │   └── hooks/usePriceJobs.ts
│   ├── automation/
│   │   ├── components/           # EslScheduleForm, IntegrationStatusList
│   │   └── hooks/
│   └── blog/
│       ├── components/           # PostEditor, PostList
│       └── hooks/
├── components/
│   ├── redprice/                 # текущие виджеты (постепенно перенос в features/*)
│   └── ui/                       # shadcn
├── lib/
│   └── prisma.ts                 # singleton PrismaClient (server)
└── server/                       # или корневой server/ — Express API
    └── routes/
        ├── investor.ts
        ├── procurement.ts
        ├── automation.ts
        └── blog.ts
```

### Соответствие трём разделам сайдбара

| Раздел в боковом меню | Маршруты / экраны | Ключевые модели Prisma |
|----------------------|-------------------|-------------------------|
| **Инвестор** | Список магазинов (карточки) → `/investor/stores/:storeId` (дашборд: видео, касса, планограмма) | `Investor`, `InvestorStore`, `Store` |
| **Управление товарами** | Единая зона: номенклатура 1С, цены, поставщики → `/procurement` (вкладки или один скролл с секциями) | `Product`, `Supplier`, `StoreProductSnapshot`, `PriceChangeJob` |
| **Автоматизация** | ESL расписание + статусы 1С → `/automation` | `EslDisplaySchedule`, `IntegrationSyncLog` |
| **Контент** (опционально 4-й пункт или под ADMIN) | Блог главной → `/blog-admin` | `BlogPost`, `User` (ROLE CONTENT) |

---

## 3. API (Express) — слой маршрутов

Расширение `server/index.js` или отдельные роутеры:

- `GET /api/v1/investor/stores` — магазины текущего пользователя (по JWT/session → `Investor` → `InvestorStore`).
- `GET /api/v1/procurement/snapshots?storeId=` — таблица для закупа.
- `POST /api/v1/procurement/price-jobs` — создать отложенную задачу (ночь).
- `GET/POST /api/v1/automation/esl-schedules`, `GET /api/v1/automation/sync-log`.
- `CRUD /api/v1/blog/posts` — для роли CONTENT.

Авторизация: сессия или JWT с `userId` и проверкой `InvestorStore` для инвестора.

---

## 4. Следующие шаги разработки (рекомендация)

1. Зафиксировать Prisma-миграцию после ревью полей (например, уточнить Decimal vs Int для тенге).
2. Реализовать **сайдбар** в `layout.jsx`: три группы с вложенными пунктами (без дублирования старых «Обзор / Видео / …» в корне).
3. Страница **Инвестор**: список `Store` → выбор → вложенный дашборд по `storeId`.
4. Страница **Закуп**: одна таблица + кнопка «Применить изменения ночью» → `PriceChangeJob`.
5. **Блог**: простой CRUD + публикация на главной (чтение постов из API на `Catalog` или отдельный `/news`).

---

*Документ можно обновлять по мере внедрения.*
