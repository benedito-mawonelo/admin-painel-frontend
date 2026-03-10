<template>
  <q-page class="q-pa-md">
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h5 text-weight-bold q-mb-md">Pagamentos falhados</div>
        <p class="text-body2 text-grey-7 q-mb-md">
          Tentativas de pagamento que falharam (base <strong>external_db</strong> – M-Pesa / E-Mola). Cada número aparece só uma vez (tentativa mais recente). Pode marcar que já deu assistência ao utilizador; fica guardado qual admin registou.
        </p>

        <div class="row items-end q-gutter-md wrap">
          <q-input
            v-model="dateFrom"
            label="Data inicial"
            type="date"
            outlined
            dense
            clearable
            style="min-width: 180px"
            :max="dateTo || undefined"
          />
          <q-input
            v-model="dateTo"
            label="Data final"
            type="date"
            outlined
            dense
            clearable
            style="min-width: 180px"
            :min="dateFrom || undefined"
          />
          <q-btn
            color="primary"
            icon="search"
            label="Filtrar"
            :loading="loading"
            @click="loadFailed"
          />
          <q-btn
            flat
            label="Limpar datas"
            @click="clearDates"
          />
        </div>
      </q-card-section>
    </q-card>

    <q-card>
      <q-card-section class="row items-center">
        <div class="text-h6">Resultados ({{ rows.length }} tentativas falhadas)</div>
        <q-space />
        <q-btn flat round dense icon="refresh" :loading="loading" @click="loadFailed">
          <q-tooltip>Atualizar lista</q-tooltip>
        </q-btn>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pa-none">
        <q-table
          :rows="rows"
          :columns="columns"
          row-key="rowId"
          :loading="loading"
          flat
          bordered
          :rows-per-page-options="[10, 25, 50]"
          class="sticky-header-table"
        >
          <template v-slot:body-cell-created_at="props">
            <q-td :props="props">{{ formatDate(props.row.created_at) }}</q-td>
          </template>
          <template v-slot:body-cell-failure_reason="props">
            <q-td :props="props">
              <div class="failure-reason-cell text-body2">
                {{ props.row.failure_reason || '—' }}
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-payment_method="props">
            <q-td :props="props">{{ formatPaymentMethod(props.row.payment_method) }}</q-td>
          </template>
          <template v-slot:body-cell-assistencia="props">
            <q-td :props="props">
              <template v-if="props.row.assisted_by_name">
                <div class="text-caption text-grey-7">Assistido por</div>
                <div class="text-weight-medium">{{ props.row.assisted_by_name }}</div>
                <div class="text-caption text-grey-7">{{ formatDate(props.row.assisted_at) }}</div>
              </template>
              <q-btn
                v-else
                flat
                dense
                size="sm"
                color="primary"
                label="Marcar assistência"
                icon="check_circle"
                :loading="assistingPhone === props.row.phone_number"
                @click="marcarAssistencia(props.row)"
              />
            </q-td>
          </template>
          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey-7 q-pa-lg">
              <q-icon name="info" size="2rem" class="q-mr-sm" />
              Nenhuma tentativa de pagamento falhada no período selecionado (ou base external_db indisponível).
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

const columns = [
  { name: 'phone_number', label: 'Telefone', field: 'phone_number', align: 'left', sortable: true },
  { name: 'amount', label: 'Valor (MT)', field: 'amount', align: 'right', sortable: true },
  { name: 'payment_method', label: 'Método', field: 'payment_method', align: 'left' },
  { name: 'created_at', label: 'Data da tentativa', field: 'created_at', align: 'left', sortable: true },
  { name: 'failure_reason', label: 'Motivo da falha', field: 'failure_reason', align: 'left' },
  { name: 'assistencia', label: 'Assistência', field: 'assisted_by_name', align: 'left' },
]

export default {
  name: 'FailedPaymentsPage',

  setup() {
    const $q = useQuasar()
    const loading = ref(false)
    const rows = ref([])
    const dateFrom = ref('')
    const dateTo = ref('')
    const assistingPhone = ref(null)

    function formatDate(val) {
      if (!val) return '—'
      const d = new Date(val)
      if (isNaN(d.getTime())) return String(val)
      return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    function formatPaymentMethod(method) {
      if (method === 'mpesa') return 'M-Pesa'
      if (method === 'emola') return 'E-Mola'
      return method || '—'
    }

    async function loadFailed() {
      loading.value = true
      try {
        const params = new URLSearchParams()
        if (dateFrom.value) params.set('date_from', dateFrom.value)
        if (dateTo.value) params.set('date_to', dateTo.value)
        const url = `/payments/admin/failed/${params.toString() ? '?' + params.toString() : ''}`
        const response = await api.get(url)
        const list = Array.isArray(response.data) ? response.data : []
        rows.value = list.map((r, i) => ({ ...r, rowId: (r.phone_number || '') + '-' + String(i) }))
      } catch (err) {
        console.error('Erro ao carregar pagamentos falhados:', err)
        rows.value = []
        const msg = err.response?.data?.error || err.response?.data?.detail || 'Erro ao carregar lista (verifique a conexão à base external_db).'
        $q.notify({ type: 'negative', message: msg })
      } finally {
        loading.value = false
      }
    }

    function clearDates() {
      dateFrom.value = ''
      dateTo.value = ''
      loadFailed()
    }

    async function marcarAssistencia(row) {
      const phone = row.phone_number
      if (!phone) {
        $q.notify({ type: 'warning', message: 'Número indisponível.' })
        return
      }
      assistingPhone.value = phone
      try {
        await api.post('/payments/admin/failed/assist/', { phone_number: phone })
        $q.notify({ type: 'positive', message: 'Assistência registada.' })
        await loadFailed()
      } catch (err) {
        const msg = err.response?.data?.error || err.response?.data?.detail || 'Erro ao registar assistência.'
        $q.notify({ type: 'negative', message: msg })
      } finally {
        assistingPhone.value = null
      }
    }

    onMounted(() => {
      loadFailed()
    })

    return {
      loading,
      rows,
      columns,
      dateFrom,
      dateTo,
      assistingPhone,
      formatDate,
      formatPaymentMethod,
      loadFailed,
      clearDates,
      marcarAssistencia,
    }
  },
}
</script>

<style scoped>
.sticky-header-table :deep(thead tr th) {
  position: sticky;
  top: 0;
  z-index: 1;
  background: white;
}
.body--dark .sticky-header-table :deep(thead tr th) {
  background: #1e1e1e;
}

.failure-reason-cell {
  max-width: 360px;
  color: #c62828;
  font-weight: 500;
}
.body--dark .failure-reason-cell {
  color: #ef5350;
}
</style>
