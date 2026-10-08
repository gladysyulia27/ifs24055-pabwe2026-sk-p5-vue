<script setup>
import { Gavel } from 'lucide-vue-next'
</script>

<template>
  <div class="grid min-h-screen lg:grid-cols-2">
    <aside class="hidden flex-col justify-between bg-gradient-to-br from-brand-700 to-brand-500 p-12 text-white lg:flex">
      <div class="flex items-center gap-3 text-xl font-extrabold"><Gavel class="h-7 w-7" /> Delcom Auction</div>
      <div>
        <h1 class="text-4xl font-extrabold leading-tight">Tawar, menang, dan miliki barang impianmu.</h1>
        <p class="mt-4 max-w-md text-brand-100">Platform lelang online untuk komunitas Delcom: pasang barang, ajukan tawaran, pantau hingga lelang ditutup.</p>
      </div>
      <p class="text-sm text-brand-100">&copy; Delcom Auction</p>
    </aside>
    <main class="flex items-center justify-center p-6">
      <div class="w-full max-w-md"><RouterView /></div>
    </main>
  </div>
</template>
