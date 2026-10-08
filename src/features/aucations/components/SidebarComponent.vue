<script setup>
import { LayoutDashboard, Package, UserRound, Users } from 'lucide-vue-next'

defineProps({ open: { type: Boolean, default: false } })
defineEmits(['close'])

const menus = [
  { to: '/', label: 'Dashboard Lelang', icon: LayoutDashboard },
  { to: '/?tab=mine', label: 'Lelang Saya', icon: Package },
  { to: '/users', label: 'Daftar Pengguna', icon: Users },
  { to: '/profile', label: 'Profil Saya', icon: UserRound },
]
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" data-testid="backdrop" @click="$emit('close')" />
  <aside
    class="fixed bottom-0 left-0 top-16 z-40 w-64 border-r border-slate-200 bg-white p-4 transition-transform lg:translate-x-0"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
  >
    <nav class="space-y-1">
      <RouterLink
        v-for="m in menus" :key="m.label" :to="m.to"
        class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-brand-50 hover:text-brand-700"
        @click="$emit('close')"
      >
        <component :is="m.icon" class="h-4 w-4" /> {{ m.label }}
      </RouterLink>
    </nav>
  </aside>
</template>
