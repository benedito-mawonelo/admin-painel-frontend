<template>
  <q-page class="q-pa-md">
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="text-h5 text-weight-bold">
            {{ viewMode === 'history' ? 'Histórico de pagamentos falhados' : 'Pagamentos falhados' }}
          </div>
          <q-space />
          <q-btn
            v-if="viewMode === 'active'"
            color="secondary"
            outline
            icon="history"
            label="Ver histórico (já com pagamento ativo)"
            @click="switchView('history')"
          />
          <q-btn
            v-else
            color="primary"
            outline
            icon="list"
            label="Voltar à lista activa"
            @click="switchView('active')"
          />
        </div>
        <p class="text-body2 text-grey-7 q-mb-md">
          <template v-if="viewMode === 'active'">
            Tentativas de pagamento que <strong>falharam</strong> na base <strong>external_db</strong> (M-Pesa / E-Mola).
            Cada número aparece só uma vez (tentativa mais recente). Quem já tem pagamento ativo na app é retirado desta lista e guardado no histórico.
            Por defeito mostra os <strong>últimos 30 dias</strong> (mais rápido).
          </template>
          <template v-else>
            Falhas de clientes que <strong>já têm pagamento ativo</strong> na app. Guardadas para análises futuras (não precisam de assistência urgente).
          </template>
        </p>
        <q-banner v-if="viewMode === 'active'" rounded class="bg-teal-1 text-dark q-mb-md">
          <template v-slot:avatar>
            <q-icon name="payments" color="primary" />
          </template>
          <strong>O cliente diz que pagou com sucesso mas a app não desbloqueou?</strong>
          Vá a <strong>Pagamentos</strong> e pesquise o número do comprovativo. Se o movimento existir no gateway, pode
          <strong>vincular esse pagamento à conta</strong> do utilizador na Carta Fácil. Use o botão «Procurar pagamento» na linha.
        </q-banner>

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
            label="Últimos 30 dias"
            @click="clearDates"
          />
        </div>
      </q-card-section>
    </q-card>

    <q-card>
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ viewMode === 'history'
            ? `Histórico (${rows.length} com pagamento ativo)`
            : `Resultados (${rows.length} tentativas falhadas)` }}
        </div>
        <q-space />
        <q-btn flat round dense icon="refresh" :loading="loading" @click="loadFailed">
          <q-tooltip>Atualizar lista</q-tooltip>
        </q-btn>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pa-none">
        <q-table
          :rows="rows"
          :columns="activeColumns"
          row-key="rowId"
          :loading="loading"
          flat
          bordered
          :rows-per-page-options="[10, 25, 50]"
          class="sticky-header-table"
        >
          <template v-slot:body-cell-account_name="props">
            <q-td :props="props">
              <span v-if="props.row.account_name || props.row.user_name" class="text-weight-medium">
                {{ props.row.account_name || props.row.user_name }}
              </span>
              <span v-else class="text-grey-5">—</span>
            </q-td>
          </template>

          <template v-slot:body-cell-account_phone="props">
            <q-td :props="props">
              <span v-if="props.row.account_phone">{{ props.row.account_phone }}</span>
              <span v-else class="text-grey-5">—</span>
            </q-td>
          </template>
          <template v-slot:body-cell-created_at="props">
            <q-td :props="props">{{ formatDate(props.row.created_at) }}</q-td>
          </template>
          <template v-slot:body-cell-archived_at="props">
            <q-td :props="props">{{ formatDate(props.row.archived_at) }}</q-td>
          </template>
          <template v-slot:body-cell-active_end_at="props">
            <q-td :props="props">{{ formatDate(props.row.active_end_at) }}</q-td>
          </template>
          <template v-slot:body-cell-active_category="props">
            <q-td :props="props">{{ formatCategory(props.row.active_category) }}</q-td>
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
          <template v-slot:body-cell-vincular="props">
            <q-td :props="props">
              <q-btn
                dense
                no-caps
                outline
                color="primary"
                icon="link"
                label="Procurar pagamento"
                @click="goVincularPagamento(props.row)"
              >
                <q-tooltip>Pesquisar movimentos com sucesso e vincular à conta do cliente</q-tooltip>
              </q-btn>
            </q-td>
          </template>
          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey-7 q-pa-lg">
              <q-icon name="info" size="2rem" class="q-mr-sm" />
              {{ viewMode === 'history'
                ? 'Nenhum pagamento falhado arquivado no período (ou ainda ninguém com falha passou a ter pagamento ativo).'
                : 'Nenhuma tentativa de pagamento falhada no período selecionado (ou base external_db indisponível).' }}
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { api } from 'boot/axios'

const columnsActive = [
  { name: 'account_name', label: 'Nome da conta', field: 'account_name', align: 'left', sortable: true },
  { name: 'account_phone', label: 'Nº da conta', field: 'account_phone', align: 'left' },
  { name: 'phone_number', label: 'Telefone pagamento', field: 'phone_number', align: 'left', sortable: true },
  { name: 'amount', label: 'Valor (MT)', field: 'amount', align: 'right', sortable: true },
  { name: 'payment_method', label: 'Método', field: 'payment_method', align: 'left' },
  { name: 'created_at', label: 'Data da tentativa', field: 'created_at', align: 'left', sortable: true },
  { name: 'failure_reason', label: 'Motivo da falha', field: 'failure_reason', align: 'left' },
  { name: 'assistencia', label: 'Assistência', field: 'assisted_by_name', align: 'left' },
  { name: 'vincular', label: 'Pagamento OK?', field: 'vincular', align: 'center' },
]

const columnsHistory = [
  { name: 'account_name', label: 'Nome da conta', field: 'account_name', align: 'left', sortable: true },
  { name: 'account_phone', label: 'Nº da conta', field: 'account_phone', align: 'left' },
  { name: 'phone_number', label: 'Telefone pagamento', field: 'phone_number', align: 'left', sortable: true },
  { name: 'amount', label: 'Valor (MT)', field: 'amount', align: 'right', sortable: true },
  { name: 'payment_method', label: 'Método', field: 'payment_method', align: 'left' },
  { name: 'created_at', label: 'Data da falha', field: 'created_at', align: 'left', sortable: true },
  { name: 'failure_reason', label: 'Motivo da falha', field: 'failure_reason', align: 'left' },
  { name: 'active_category', label: 'Plano ativo', field: 'active_category', align: 'left' },
  { name: 'active_end_at', label: 'Válido até', field: 'active_end_at', align: 'left', sortable: true },
  { name: 'archived_at', label: 'Arquivado em', field: 'archived_at', align: 'left', sortable: true },
]

const CATEGORY_LABELS = {
  profissional: 'Profissional',
  ligeiro_pesado: 'Ligeiro/Pesado',
  'ganha-facil': 'Ganha-Fácil',
  'video-pratical': 'Vídeo Prático',
  videos: 'Vídeos',
  'videos-practical-ligeiro': 'Aulas Práticas Ligeiro',
  'videos-practical-pesado': 'Aulas Práticas Pesado',
}

export default {
  name: 'FailedPaymentsPage',

  setup() {
    const $q = useQuasar()
    const router = useRouter()
    const loading = ref(false)
    const rows = ref([])
    const assistingPhone = ref(null)
    const viewMode = ref('active')

    function toInputDate(d) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    function defaultDateRange() {
      const to = new Date()
      const from = new Date()
      from.setDate(from.getDate() - 30)
      return { from: toInputDate(from), to: toInputDate(to) }
    }

    const initialRange = defaultDateRange()
    const dateFrom = ref(initialRange.from)
    const dateTo = ref(initialRange.to)

    const activeColumns = computed(() =>
      viewMode.value === 'history' ? columnsHistory : columnsActive
    )

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

    function formatCategory(cat) {
      if (!cat) return '—'
      return CATEGORY_LABELS[cat] || cat
    }

    async function loadFailed() {
      loading.value = true
      try {
        const params = new URLSearchParams()
        if (dateFrom.value) params.set('date_from', dateFrom.value)
        if (dateTo.value) params.set('date_to', dateTo.value)
        params.set('view', viewMode.value)
        const url = `/payments/admin/failed/?${params.toString()}`
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

    function switchView(mode) {
      viewMode.value = mode
      loadFailed()
    }

    function clearDates() {
      const range = defaultDateRange()
      dateFrom.value = range.from
      dateTo.value = range.to
      loadFailed()
    }

    function goVincularPagamento(row) {
      const phone = (row.phone_number || row.account_phone || '').trim()
      if (!phone) {
        $q.notify({ type: 'warning', message: 'Sem número para pesquisar nesta linha.' })
        return
      }
      router.push({ path: '/payments', query: { phone } })
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
      dateFrom,
      dateTo,
      assistingPhone,
      viewMode,
      activeColumns,
      formatDate,
      formatPaymentMethod,
      formatCategory,
      loadFailed,
      clearDates,
      switchView,
      marcarAssistencia,
      goVincularPagamento,
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
