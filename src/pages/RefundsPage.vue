<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 text-weight-bold q-mb-sm flex items-center">
      <q-icon name="currency_exchange" size="md" class="q-mr-sm text-primary" />
      Reembolsos
    </div>
    <p class="text-body2 text-grey-8 q-mb-lg" style="max-width: 840px">
      Registo de <strong>reembolsos</strong> por utilizador: tipo (parcial, total, taxas, outro), valor opcional,
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
        <q-banner v-if="loadError" dense rounded class="bg-negative text-white q-mb-md">
          {{ loadError }}
        </q-banner>
        <q-table
          flat
          bordered
          :rows="rows"
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
              <div>{{ loadError ? 'Erro ao carregar.' : 'Ainda não há reembolsos registados.' }}</div>
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
import { ref, onMounted } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import { date } from 'quasar'

const $q = useQuasar()
const loading = ref(false)
const loadError = ref('')
const rows = ref([])

const dialogOpen = ref(false)
const submitting = ref(false)
const filteringUsers = ref(false)
const userOptions = ref([])

const refundTypeOptions = [
  { value: 'partial', label: 'Parcial' },
  { value: 'total', label: 'Total' },
  { value: 'fees', label: 'Taxas / custos' },
  { value: 'other', label: 'Outro' },
]

const form = ref({
  userOption: null,
  refund_type: null,
  amount: '',
  observation: '',
})

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'created_at', label: 'Data / hora', field: 'created_at', align: 'left', sortable: true },
  { name: 'user_name', label: 'Utilizador', field: 'user_name', align: 'left', sortable: true },
  { name: 'user_telefone', label: 'Telefone', field: 'user_telefone', align: 'left', sortable: true },
  { name: 'user_id', label: 'ID user', field: 'user_id', align: 'left', sortable: true },
  { name: 'refund_type_label', label: 'Tipo', field: 'refund_type_label', align: 'left', sortable: true },
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
  submitting.value = true
  try {
    const payload = {
      user_id: form.value.userOption,
      refund_type: form.value.refund_type,
      observation: obs,
    }
    const amt = String(form.value.amount || '').trim()
    if (amt !== '') {
      payload.amount = amt
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
