<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import NavbarComponent from '../components/NavbarComponent.vue'
import SidebarComponent from '../components/SidebarComponent.vue'
import { useUsersStore } from '../../users/states/usersStore'
import { useAuthStore } from '../../auth/states/authStore'

const router = useRouter()
const users = useUsersStore()
const auth = useAuthStore()
const sidebarOpen = ref(false)

onMounted(async () => {
  const result = await users.fetchProfile()
  if (!result.ok && result.statusCode === 401) {
    auth.clearSession()
    router.replace('/auth/login')
  }
})
</script>

<template>
  <div class="min-h-screen">
    <NavbarComponent @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    <SidebarComponent :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="px-4 pb-10 pt-20 lg:ml-64 lg:px-8"><RouterView /></div>
  </div>
</template>
