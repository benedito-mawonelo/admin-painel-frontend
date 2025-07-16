<template>
  <q-table
    :rows="transactions"
    :columns="columns"
    row-key="id"
    flat
    bordered
    :loading="loading"
    :pagination="pagination"
  >
    <template v-slot:body-cell-status="props">
      <q-td :props="props">
        <q-badge
          :color="getStatusColor(props.row.status)"
          :label="formatStatus(props.row.status)"
        />
      </q-td>
    </template>

    <template v-slot:body-cell-amount="props">
      <q-td :props="props">
        {{ formatCurrency(props.row.amount) }}
      </q-td>
    </template>

    <template v-slot:body-cell-created_at="props">
      <q-td :props="props">
        {{ formatDate(props.row.created_at) }}
      </q-td>
    </template>

    <template v-slot:body-cell-actions="props">
      <q-td :props="props">
        <q-btn
          flat
          round
          color="primary"
          icon="visibility"
          @click="$emit('view', props.row)"
        />
      </q-td>
    </template>
  </q-table>
</template>

<script setup>
import { ref } from 'vue'

// const props = defineProps({
//   transactions: {
//     type: Array,
//     default: () => []
//   },
//   loading: {
//     type: Boolean,
//     default: false
//   }
// })

// const emit = defineEmits(['view'])

const pagination = ref({
  sortBy: 'created_at',
  descending: true,
  page: 1,
  rowsPerPage: 10
})

const columns = [
  {
    name: 'id',
    required: true,
    label: 'ID',
    align: 'left',
    field: 'id',
    sortable: true
  },
  {
    name: 'reference',
    label: 'Reference',
    align: 'left',
    field: 'reference',
    sortable: true
  },
  {
    name: 'amount',
    label: 'Amount',
    align: 'right',
    field: 'amount',
    sortable: true
  },
  {
    name: 'provider',
    label: 'Provider',
    align: 'left',
    field: 'provider',
    sortable: true
  },
  {
    name: 'phone',
    label: 'Phone',
    align: 'left',
    field: 'phone',
    sortable: true
  },
  {
    name: 'status',
    label: 'Status',
    align: 'left',
    field: 'status',
    sortable: true
  },
  {
    name: 'created_at',
    label: 'Date',
    align: 'left',
    field: 'created_at',
    sortable: true
  },
  {
    name: 'actions',
    label: 'Actions',
    align: 'center'
  }
]

const getStatusColor = (status) => {
  switch (status) {
    case 'pago': return 'positive'
    case 'pendente': return 'warning'
    case 'falha': return 'negative'
    default: return 'grey'
  }
}

const formatStatus = (status) => {
  switch (status) {
    case 'pago': return 'Paid'
    case 'pendente': return 'Pending'
    case 'falha': return 'Failed'
    default: return status
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN'
  }).format(amount)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}
</script>
