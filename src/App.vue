<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

onMounted(() => {
  $q.dark.set(false) // Garante que o modo dark está desativado
})
</script>
