<template>
  <q-page class="q-pa-md">
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h5 text-weight-bold q-mb-sm">Pagamentos duplicados</div>
        <p class="text-body2 text-grey-7 q-mb-md">
          Transacções <strong>com sucesso</strong> do mesmo telefone e valor num intervalo curto (possível cobrança dupla).
          Os que já têm <strong>reembolso registado</strong> deixam de aparecer nesta lista.
        </p>

        <div class="row items-end q-gutter-md wrap">
          <q-input
            v-model="dateFrom"
            label="Data inicial"
            type="date"
            outlined
            dense
            clearable
            style="min-width: 170px"
            :max="dateTo || undefined"
          />
          <q-input
            v-model="dateTo"
            label="Data final"
            type="date"
            outlined
            dense
            clearable
            style="min-width: 170px"
            :min="dateFrom || undefined"
          />
          <q-input
            v-model.number="minGap"
            label="Min (min)"
            type="number"
            outlined
            dense
            style="width: 100px"
            :min="0"
            :max="maxGap - 1"
          />
          <q-input
            v-model.number="maxGap"
            label="Máx (min)"
            type="number"
            outlined
            dense
            style="width: 100px"
            :min="minGap + 1"
          />
          <q-btn
            color="primary"
            icon="search"
            label="Buscar"
            :loading="loading"
            @click="load"
          />
          <q-btn flat label="Últimos 30 dias" @click="resetDates" />
        </div>
      </q-card-section>
    </q-card>

    <q-card>
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ data.total }} {{ data.total === 1 ? 'par duplicado' : 'pares duplicados' }}
          <span class="text-body2 text-grey-7 q-ml-sm">{{ data.date_from }} → {{ data.date_to }}</span>
        </div>
        <q-space />
        <q-btn flat round dense icon="refresh" :loading="loading" @click="load">
          <q-tooltip>Atualizar</q-tooltip>
        </q-btn>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pa-none">
        <q-table
          :rows="data.results"
          :columns="columns"
          row-key="rowId"
          flat
          bordered
          :loading="loading"
          :rows-per-page-options="[10, 25, 50]"
        >
          <template v-slot:body-cell-phone_number="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.phone_number }}</div>
              <div v-if="props.row.first_account_name" class="text-caption text-grey-7">
                {{ props.row.first_account_name }}
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-first_at="props">
            <q-td :props="props">{{ formatDate(props.row.first_at) }}</q-td>
          </template>
          <template v-slot:body-cell-second_at="props">
            <q-td :props="props">{{ formatDate(props.row.second_at) }}</q-td>
          </template>
          <template v-slot:body-cell-payment_method="props">
            <q-td :props="props">{{ props.row.payment_method === 'mpesa' ? 'M-Pesa' : 'E-Mola' }}</q-td>
          </template>
          <template v-slot:body-cell-app_user="props">
            <q-td :props="props">
              <template v-if="props.row.app_user">
                <div class="text-weight-medium">{{ props.row.app_user.nome || props.row.app_user.label }}</div>
                <div class="text-caption text-grey-7">{{ props.row.app_user.telefone }}</div>
              </template>
              <span v-else class="text-grey-5">—</span>
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                dense
                size="sm"
                color="negative"
                icon="currency_exchange"
                label="Registar reembolso"
                @click="goRefund(props.row)"
              />
            </q-td>
          </template>
          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey-7 q-pa-lg">
              <q-icon name="check_circle" size="2rem" class="q-mr-sm text-positive" />
              Nenhum pagamento duplicado pendente neste período.
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
import { useRouter } from 'vue-router'
import { api } from 'boot/axios'

const columns = [
  { name: 'phone_number', label: 'Telefone', field: 'phone_number', align: 'left', sortable: true },
  { name: 'amount', label: 'Valor (MT)', field: 'amount', align: 'right', sortable: true },
  { name: 'payment_method', label: 'Método', field: 'payment_method', align: 'left' },
  { name: 'first_at', label: '1.º Pagamento', field: 'first_at', align: 'left', sortable: true },
  { name: 'second_at', label: '2.º Pagamento', field: 'second_at', align: 'left', sortable: true },
  { name: 'gap_minutes', label: 'Intervalo (min)', field: 'gap_minutes', align: 'right', sortable: true },
  { name: 'app_user', label: 'Conta na app', field: 'app_user', align: 'left' },
  { name: 'actions', label: 'Acção', field: 'actions', align: 'center' },
]

function toInputDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default {
  name: 'DuplicatePaymentsPage',

  setup() {
    const $q = useQuasar()
    const router = useRouter()
    const loading = ref(false)

    const now = new Date()
    const thirtyAgo = new Date()
    thirtyAgo.setDate(thirtyAgo.getDate() - 30)

    const dateFrom = ref(toInputDate(thirtyAgo))
    const dateTo = ref(toInputDate(now))
    const minGap = ref(0)
    const maxGap = ref(10)
    const data = ref({ total: 0, results: [], date_from: '', date_to: '' })

    function formatDate(val) {
      if (!val) return '—'
      const d = new Date(val)
      if (isNaN(d.getTime())) return String(val)
      return d.toLocaleDateString('pt-PT', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    }

    async function load() {
      loading.value = true
      try {
        const params = {
          date_from: dateFrom.value || undefined,
          date_to: dateTo.value || undefined,
          min_gap: minGap.value,
          max_gap: maxGap.value,
        }
        const res = await api.get('/payments/admin/duplicates/', { params })
        const payload = res.data || {}
        payload.results = (payload.results || []).map((r, i) => ({
          ...r,
          rowId: `${r.phone_number}-${i}`,
        }))
        data.value = payload
      } catch (err) {
        data.value = { total: 0, results: [], date_from: '', date_to: '' }
        const msg = err.response?.data?.error || 'Erro ao carregar duplicados.'
        $q.notify({ type: 'negative', message: msg })
      } finally {
        loading.value = false
      }
    }

    function resetDates() {
      const n = new Date()
      const a = new Date()
      a.setDate(a.getDate() - 30)
      dateFrom.value = toInputDate(a)
      dateTo.value = toInputDate(n)
      load()
    }

    function goRefund(row) {
      const phone = row.phone_number || ''
      const userId = row.app_user?.id
      router.push({
        path: '/reembolsos',
        query: {
          phone,
          amount: row.amount,
          method: row.payment_method,
          ...(userId ? { user_id: userId } : {}),
        },
      })
    }

    onMounted(() => load())

    return {
      loading,
      dateFrom,
      dateTo,
      minGap,
      maxGap,
      data,
      columns,
      formatDate,
      load,
      resetDates,
      goRefund,
    }
  },
}
</script>
