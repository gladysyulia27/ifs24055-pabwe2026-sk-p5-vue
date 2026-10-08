# Delcom Auction (PABWE 2026 - SK P5 Vue)

Aplikasi lelang online berbasis **Vue 3 (JavaScript)**, **Pinia**, **Vue Router**, **Tailwind CSS v4**, dan **bun**,
dengan sumber data Delcom Open API (`https://open-api.delcom.org/api/v1`).

## Menjalankan
```bash
bun install
cp .env.example .env     # VITE_DELCOM_BASEURL, APP_PORT
bun run dev              # http://localhost:$APP_PORT
bun run build
```

## Pengujian
```bash
bun run test             # Vitest + Testing Library
bun run test:coverage    # coverage v8, threshold 100%
```

## Struktur
```
src/
  helpers/      apiHelper.js, toolsHelper.js
  hooks/        useInput.js
  features/
    auth/       api, states (authStore), layouts (AuthLayout), pages (Login, Register)
    users/      api, states (usersStore), pages (Users, Profile)
    aucations/  api, states (aucationsStore), layouts, components (+ modals), pages (Home, Detail)
    common/     pages/NotFoundPage.vue
  router.js, main.js, App.vue, setupTests.js, test-utils.js
```

## Catatan
- Ganti kata sandi memakai `PUT /users/password` sesuai dokumentasi API terbaru.
- Filter `is_closed`: `1` = lelang berlangsung, `0` = lelang ditutup (sesuai dokumentasi).
- Rute `/` dan turunannya butuh token; `/auth/*` hanya untuk pengguna yang belum login.
