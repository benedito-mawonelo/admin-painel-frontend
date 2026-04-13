<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 text-weight-bold q-mb-sm flex items-center">
      <q-icon name="currency_exchange" size="md" class="q-mr-sm text-primary" />
      Reembolsos
    </div>
    <p class="text-body2 text-grey-8 q-mb-lg" style="max-width: 840px">
      Registo de <strong>reembolsos</strong> por utilizador: tipo (parcial, total, taxas, outro), valor opcional,
      <strong>número usado no pagamento</strong> (M-Pesa/e-Mola) quando for diferente do telefone de cadastro,
      <strong>canal</strong> (M-Pesa ou E-Mola, preenchido a partir do último pagamento quando existir),
      <strong>observações</strong> e <strong>data</strong>. Cada linha indica também quem registou no painel.
    </p>

    <q-card flat bordered>
      <q-card-section class="row items-center q-pb-none">
        <q-btn
          color="primary"
          icon="add"
          label="Registar reembolso"
          @click="openDialog"
        />
        <q-space />
        <q-btn
          outline
          color="primary"
          icon="refresh"
          label="Actualizar"
          :loading="loading"
          @click="load"
        />
      </q-card-section>
      <q-card-section>
        <div class="row q-col-gutter-md q-mb-md items-end">
          <div class="col-12 col-md-8">
            <q-input
              v-model="searchQuery"
              outlined
              dense
              clearable
              debounce="200"
              label="Pesquisar reembolsos"
              placeholder="Nome, telefone, observações, ID, tipo…"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-4 text-caption text-grey-7">
            {{ filteredRows.length }} de {{ rows.length }} linha(s)
          </div>
        </div>
        <q-banner v-if="loadError" dense rounded class="bg-negative text-white q-mb-md">
          {{ loadError }}
        </q-banner>
        <q-table
          flat
          bordered
          :rows="filteredRows"
          :columns="columns"
          row-key="id"
          :loading="loading"
          :pagination="{ rowsPerPage: 25 }"
        >
          <template v-slot:body-cell-refund_type_label="props">
            <q-td :props="props">
              <q-chip dense outline color="deep-orange" :label="props.value" />
            </q-td>
          </template>
          <template v-slot:body-cell-payment_phone_number="props">
            <q-td :props="props">
              {{ props.value || '—' }}
            </q-td>
          </template>
          <template v-slot:body-cell-payment_method_label="props">
            <q-td :props="props">
              <q-chip
                v-if="props.row.payment_method === 'mpesa'"
                dense
                color="teal"
                text-color="white"
                icon="smartphone"
                label="M-Pesa"
              />
              <q-chip
                v-else-if="props.row.payment_method === 'emola'"
                dense
                color="orange"
                text-color="white"
                icon="phone_android"
                label="E-Mola"
              />
              <span v-else class="text-grey-6">—</span>
            </q-td>
          </template>
          <template v-slot:body-cell-amount="props">
            <q-td :props="props">
              {{ props.value != null && props.value !== '' ? formatMoney(props.value) : '—' }}
            </q-td>
          </template>
          <template v-slot:body-cell-observation="props">
            <q-td :props="props">
              <div class="obs-cell text-body2">{{ props.value || '—' }}</div>
            </q-td>
          </template>
          <template v-slot:no-data>
            <div class="full-width column items-center q-py-xl text-grey-7">
              <q-icon name="inbox" size="48px" class="q-mb-sm" />
              <div v-if="loadError">Erro ao carregar.</div>
              <div v-else-if="rows.length && !filteredRows.length">Nenhum resultado para «{{ searchQuery }}».</div>
              <div v-else>Ainda não há reembolsos registados.</div>
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 420px; max-width: 560px">
        <q-card-section class="row items-center">
          <div class="text-h6">Registar reembolso</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup :disable="submitting" />
        </q-card-section>
        <q-separator />
        <q-card-section class="q-gutter-md">
          <q-select
            v-model="form.userOption"
            :options="userOptions"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            use-input
            input-debounce="300"
            outlined
            label="Utilizador (pesquise por telefone)"
            :loading="filteringUsers"
            @filter="filterUsers"
            clearable
            :rules="[(v) => !!v || 'Seleccione o utilizador']"
          />
          <q-select
            v-model="form.refund_type"
            :options="refundTypeOptions"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            outlined
            label="Tipo de reembolso"
            :rules="[(v) => !!v || 'Obrigatório']"
          />
          <q-input
            v-model="form.payment_phone_number"
            outlined
            label="Telefone do pagamento (opcional)"
            placeholder="Ex.: número M-Pesa / e-Mola usado no comprovativo"
            hint="Preenchido automaticamente a partir do último pagamento registado (pode editar)"
            maxlength="24"
            clearable
            :loading="loadingUserPayments"
          />
          <q-select
            v-model="form.payment_method"
            :options="paymentMethodOptions"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            outlined
            label="Canal de pagamento"
            hint="O número sozinho não distingue M-Pesa de E-Mola; use o registo do último pagamento ou escolha manualmente"
            :rules="[(v) => !!v || 'Seleccione M-Pesa ou E-Mola']"
          />
          <q-input
            v-model="form.amount"
            outlined
            label="Valor (MZN, opcional)"
            type="number"
            step="0.01"
            min="0"
            hint="Útil para reembolso parcial ou valor exacto"
          />
          <q-input
            v-model="form.observation"
            outlined
            type="textarea"
            autogrow
            label="Observações"
            placeholder="Motivo, referência interna, notas para a equipa…"
            :rules="[(v) => !!(v && String(v).trim()) || 'Indique pelo menos uma observação']"
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" color="grey" v-close-popup :disable="submitting" />
          <q-btn
            unelevated
            label="Guardar"
            color="primary"
            :loading="submitting"
            @click="submit"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import { date } from 'quasar'

const $q = useQuasar()
const loading = ref(false)
const loadError = ref('')
const rows = ref([])
const searchQuery = ref('')

const filteredRows = computed(() => {
  const list = rows.value
  const raw = (searchQuery.value || '').trim().toLowerCase()
  if (!raw) return list
  const parts = raw.split(/\s+/).filter(Boolean)
  return list.filter((row) => {
    const hay = [
      row.id,
      row.user_id,
      row.user_name,
      row.user_telefone,
      row.payment_phone_number,
      row.payment_method,
      row.payment_method_label,
      row.refund_type_label,
      row.refund_type,
      row.amount,
      row.observation,
      row.recorded_by_name,
      row.created_at,
    ]
      .map((x) => String(x ?? '').toLowerCase())
      .join(' ')
    return parts.every((p) => hay.includes(p))
  })
})

const dialogOpen = ref(false)
const submitting = ref(false)
const filteringUsers = ref(false)
const loadingUserPayments = ref(false)
const userOptions = ref([])

const refundTypeOptions = [
  { value: 'partial', label: 'Parcial' },
  { value: 'total', label: 'Total' },
  { value: 'fees', label: 'Taxas / custos' },
  { value: 'other', label: 'Outro' },
]

const paymentMethodOptions = [
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'emola', label: 'E-Mola' },
]

const form = ref({
  userOption: null,
  refund_type: null,
  payment_phone_number: '',
  payment_method: null,
  amount: '',
  observation: '',
})

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'created_at', label: 'Data / hora', field: 'created_at', align: 'left', sortable: true },
  { name: 'user_name', label: 'Conta activada (utilizador)', field: 'user_name', align: 'left', sortable: true },
  { name: 'user_telefone', label: 'Telefone cadastro', field: 'user_telefone', align: 'left', sortable: true },
  { name: 'payment_phone_number', label: 'Telefone pagamento', field: 'payment_phone_number', align: 'left', sortable: true },
  { name: 'payment_method_label', label: 'Carteira', field: 'payment_method_label', align: 'center', sortable: true },
  { name: 'refund_type_label', label: 'Tipo de Reembolso', field: 'refund_type_label', align: 'left', sortable: true },
  { name: 'amount', label: 'Valor', field: 'amount', align: 'right', sortable: true },
  { name: 'observation', label: 'Observações', field: 'observation', align: 'left' },
  { name: 'recorded_by_name', label: 'Registado por', field: 'recorded_by_name', align: 'left', sortable: true },
]

function formatMoney (v) {
  const n = parseFloat(v)
  if (Number.isNaN(n)) return v
  return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(n)
}

function formatRow (r) {
  return {
    ...r,
    created_at: r.created_at ? date.formatDate(r.created_at, 'DD/MM/YYYY HH:mm') : '-',
  }
}

/** Telefone e canal do primeiro pagamento com dados úteis (lista por -end_at no backend). */
function pickLatestPaymentPhoneAndMethod (userData) {
  const payments = userData?.payments
  if (!Array.isArray(payments)) return { phone: '', method: null }
  let fallbackMethod = null
  for (const p of payments) {
    const m = String(p.payment_method || '').trim().toLowerCase()
    const okM = m === 'mpesa' || m === 'emola' ? m : null
    if (!fallbackMethod && okM) fallbackMethod = okM
    const ph = String(p.phone_number || p.payedByNumber || '').trim()
    if (ph) {
      return { phone: ph, method: okM || fallbackMethod }
    }
  }
  return { phone: '', method: fallbackMethod }
}

watch(
  () => form.value.userOption,
  async (userId) => {
    if (!userId) {
      form.value.payment_phone_number = ''
      form.value.payment_method = null
      return
    }
    loadingUserPayments.value = true
    try {
      const { data } = await api.get(`/users/${userId}/`)
      const { phone, method } = pickLatestPaymentPhoneAndMethod(data)
      form.value.payment_phone_number = phone
      form.value.payment_method = method
    } catch (e) {
      console.warn(e)
      form.value.payment_phone_number = ''
      form.value.payment_method = null
    } finally {
      loadingUserPayments.value = false
    }
  }
)

async function load () {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/payments/admin/refunds/')
    const list = Array.isArray(data) ? data : []
    rows.value = list.map(formatRow)
  } catch (e) {
    console.error(e)
    const msg =
      e.response?.data?.detail ||
      e.response?.data?.error ||
      e.message ||
      'Erro ao carregar reembolsos'
    loadError.value = String(msg)
    $q.notify({ type: 'negative', message: loadError.value })
    rows.value = []
  } finally {
    loading.value = false
  }
}

function openDialog () {
  form.value = {
    userOption: null,
    refund_type: null,
    payment_phone_number: '',
    payment_method: null,
    amount: '',
    observation: '',
  }
  userOptions.value = []
  dialogOpen.value = true
}

function filterUsers (val, update) {
  const term = (val || '').trim()
  if (!term || term.length < 2) {
    update(() => {
      userOptions.value = []
    })
    return
  }
  filteringUsers.value = true
  api
    .get(`/users/filter/?q=${encodeURIComponent(term)}`)
    .then((res) => {
      const users = Array.isArray(res.data) ? res.data : []
      update(() => {
        userOptions.value = users.map((u) => ({
          value: u.id,
          label: `${u.telefone || u.username || u.id} — ${[u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.username || 'Sem nome'}`,
        }))
      })
    })
    .catch(() => {
      update(() => {
        userOptions.value = []
      })
    })
    .finally(() => {
      filteringUsers.value = false
    })
}

async function submit () {
  const obs = (form.value.observation || '').trim()
  if (!form.value.userOption || !form.value.refund_type || !obs) {
    $q.notify({ type: 'warning', message: 'Preencha utilizador, tipo e observações.' })
    return
  }
  if (!form.value.payment_method) {
    $q.notify({ type: 'warning', message: 'Seleccione o canal de pagamento (M-Pesa ou E-Mola).' })
    return
  }
  submitting.value = true
  try {
    const payload = {
      user_id: form.value.userOption,
      refund_type: form.value.refund_type,
      payment_method: form.value.payment_method,
      observation: obs,
    }
    const amt = String(form.value.amount || '').trim()
    if (amt !== '') {
      payload.amount = amt
    }
    const payPhone = String(form.value.payment_phone_number || '').trim()
    if (payPhone !== '') {
      payload.payment_phone_number = payPhone
    }
    await api.post('/payments/admin/refunds/', payload)
    $q.notify({ type: 'positive', message: 'Reembolso registado.' })
    dialogOpen.value = false
    await load()
  } catch (e) {
    const msg =
      e.response?.data?.error ||
      e.response?.data?.detail ||
      e.message ||
      'Erro ao guardar'
    $q.notify({ type: 'negative', message: String(msg) })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  load()
})
</script>

<style scoped>
.obs-cell {
  max-width: 280px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
