<template>
  <q-badge
    :color="getStatusColor(status)"
    class="status-badge"
  >
    {{ getStatusText(status) }}
  </q-badge>
</template>

<script>
export default {
  props: {
    status: {
      type: String,
      required: true
    }
  },
  methods: {
    getStatusColor(status) {
      const colors = {
        pago: 'positive',
        paid: 'positive',
        pendente: 'warning',
        pending: 'warning',
        falha: 'negative',
        failed: 'negative',
        active: 'positive',
        inactive: 'grey'
      }
      return colors[status] || 'grey'
    },
    getStatusText(status) {
      const texts = {
        pago: 'Pago',
        paid: 'Pago',
        pendente: 'Pendente',
        pending: 'Pendente',
        falha: 'Falha',
        failed: 'Falha',
        active: 'Ativo',
        inactive: 'Inativo'
      }
      return texts[status] || status
    }
  }
}
</script>

<style lang="scss">
.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: capitalize;
}
</style>
