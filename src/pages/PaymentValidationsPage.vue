<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 text-weight-bold q-mb-md flex items-center">
      <q-icon name="verified_user" size="md" class="q-mr-sm text-primary" />
      Validações de pagamentos externos
    </div>
    <p class="text-body2 text-grey-8 q-mb-lg" style="max-width: 720px">
      Histórico de <strong>vinculações</strong>: cada linha é um pagamento externo que um trabalhador associou a uma
      <strong>conta de utilizador na app</strong> (quando o pagamento existia no gateway mas o desbloqueio não ocorreu sozinho).
      O mesmo movimento <strong>não pode</strong> ser usado para activar duas contas diferentes.
    </p>

    <q-card flat bordered>
      <q-card-section class="row items-center q-pb-none">
        <q-btn
          color="primary"
          outline
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
          <template v-slot:no-data>
            <div class="full-width column items-center q-py-xl text-grey-7">
              <q-icon name="inbox" size="48px" class="q-mb-sm" />
              <div class="text-body1 text-weight-medium">
                {{ loadError ? 'Não foi possível carregar os dados.' : 'Ainda não há validações registadas.' }}
              </div>
              <div class="text-caption q-mt-xs text-center" style="max-width: 420px">
                <template v-if="!loadError">
                  Só aparecem aqui os pagamentos externos já associados a um utilizador em
                  <strong>Pagamentos</strong> (após a migração <code>0010_externalpaymentclaim</code> estar aplicada).
                </template>
                <template v-else>
                  Confirme no servidor: migração aplicada, utilizador com permissão de admin e consola do browser (F12) para detalhes.
                </template>
              </div>
            </div>
          </template>
          <template v-slot:body-cell-payment_method="props">
            <q-td :props="props">
              <q-chip dense :color="props.value === 'mpesa' ? 'teal' : 'orange'" text-color="white">
                {{ String(props.value || '').toUpperCase() }}
              </q-chip>
            </q-td>
          </template>
          <template v-slot:body-cell-amount="props">
            <q-td :props="props">
              <span class="text-weight-medium">{{ formatMoney(props.value) }}</span>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import { date } from 'quasar'

const $q = useQuasar()
const loading = ref(false)
const rows = ref([])
const loadError = ref('')

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'external_paid_at', label: 'Data pagamento (gateway)', field: 'external_paid_at', align: 'left', sortable: true },
  { name: 'phone_number', label: 'Telefone', field: 'phone_number', align: 'left', sortable: true },
  { name: 'amount', label: 'Valor', field: 'amount', align: 'right', sortable: true },
  { name: 'payment_method', label: 'Método', field: 'payment_method', align: 'center', sortable: true },
  { name: 'category', label: 'Plano', field: 'category', align: 'left', sortable: true },
  { name: 'app_user_name', label: 'Conta activada (utilizador)', field: 'app_user_name', align: 'left', sortable: true },
  { name: 'app_user_id', label: 'ID utilizador', field: 'app_user_id', align: 'left', sortable: true },
  { name: 'validated_by_name', label: 'Quem activou (painel)', field: 'validated_by_name', align: 'left', sortable: true },
  { name: 'validated_at', label: 'Dia / hora da activação', field: 'validated_at', align: 'left', sortable: true },
  { name: 'linked_payment_id', label: 'ID pagamento', field: 'linked_payment_id', align: 'left', sortable: true },
]

function formatMoney (v) {
  const n = parseFloat(v)
  if (Number.isNaN(n)) return v
  return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(n)
}

function formatRow (r) {
  return {
    ...r,
    external_paid_at: r.external_paid_at ? date.formatDate(r.external_paid_at, 'DD/MM/YYYY HH:mm') : '-',
    validated_at: r.validated_at ? date.formatDate(r.validated_at, 'DD/MM/YYYY HH:mm') : '-',
  }
}

async function load () {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/payments/admin/external-claims/')
    const list = Array.isArray(data)
      ? data
      : (data && Array.isArray(data.results) ? data.results : [])
    rows.value = list.map(formatRow)
  } catch (e) {
    console.error(e)
    const msg =
      e.response?.data?.detail ||
      e.response?.data?.error ||
      (typeof e.response?.data === 'string' ? e.response.data : null) ||
      e.message ||
      'Erro ao carregar validações'
    loadError.value = String(msg)
    $q.notify({
      type: 'negative',
      message: loadError.value,
    })
    rows.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
})
</script>
