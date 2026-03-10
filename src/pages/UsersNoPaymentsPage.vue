<template>
  <q-page class="q-pa-md">
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h5 text-weight-bold q-mb-md">Utilizadores sem pagamento</div>
        <p class="text-body2 text-grey-7 q-mb-md">
          Lista de utilizadores registados que ainda não têm nenhum pagamento associado. Use os filtros por data para limitar ao período de registo.
        </p>

        <div class="row items-end q-gutter-md wrap">
          <q-input
            v-model="dateFrom"
            label="Data inicial (registo)"
            type="date"
            outlined
            dense
            clearable
            style="min-width: 180px"
            :max="dateTo || undefined"
          />
          <q-input
            v-model="dateTo"
            label="Data final (registo)"
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
            @click="loadUsers"
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
        <div class="text-h6">Resultados ({{ rows.length }} utilizadores)</div>
        <q-space />
        <q-btn flat round dense icon="refresh" :loading="loading" @click="loadUsers">
          <q-tooltip>Atualizar lista</q-tooltip>
        </q-btn>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pa-none">
        <q-table
          :rows="rows"
          :columns="columns"
          row-key="id"
          :loading="loading"
          flat
          bordered
          :rows-per-page-options="[10, 25, 50]"
          class="sticky-header-table"
        >
          <template v-slot:body-cell-nome="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.name }}</div>
              <div v-if="props.row.username" class="text-caption text-grey-7">{{ props.row.username }}</div>
            </q-td>
          </template>
          <template v-slot:body-cell-data_registo="props">
            <q-td :props="props">{{ formatDate(props.row.date_joined) }}</q-td>
          </template>
          <template v-slot:body-cell-ligacoes="props">
            <q-td :props="props">
              <div class="row items-center no-wrap q-gutter-xs">
                <template v-for="call in (props.row.follow_up_calls || [])" :key="call.id">
                  <q-btn
                    flat
                    dense
                    no-caps
                    size="sm"
                    color="primary"
                    class="chip-date-btn"
                    :label="formatDate(call.called_at)"
                  >
                    <q-menu anchor="bottom start" self="top start">
                      <q-card class="q-pa-sm" flat bordered>
                        <div class="text-caption text-grey-7">Data da ligação</div>
                        <div class="text-body2">{{ formatDate(call.called_at) }}</div>
                        <div class="text-caption text-grey-7 q-mt-xs">Registado por</div>
                        <div class="text-body2 text-weight-medium">{{ call.staff_name || '—' }}</div>
                      </q-card>
                    </q-menu>
                  </q-btn>
                </template>
                <q-btn
                  v-if="!(props.row.follow_up_calls && props.row.follow_up_calls.length)"
                  flat
                  dense
                  size="sm"
                  icon="add_circle"
                  color="primary"
                  label="Registar ligação"
                  @click="openRegistarLigacao(props.row)"
                />
                <span v-else class="text-caption text-grey-7">Já registada</span>
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                dense
                color="primary"
                icon="person"
                size="sm"
                label="Ver em Usuários"
                @click="goToUser(props.row.id)"
              />
            </q-td>
          </template>
          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey-7 q-pa-lg">
              <q-icon name="info" size="2rem" class="q-mr-sm" />
              Nenhum utilizador sem pagamento no período selecionado. Ajuste as datas ou remova os filtros.
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <q-dialog v-model="dialogRegistarLigacao" persistent>
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">Registar ligação</div>
          <p class="text-caption text-grey-7">
            Marque que ligou a {{ targetUserForCall?.name || 'este utilizador' }} na data abaixo.
          </p>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="novaLigacaoData"
            label="Data da ligação"
            type="date"
            outlined
            dense
            class="full-width"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey" v-close-popup />
          <q-btn
            unelevated
            label="Guardar"
            color="primary"
            :loading="savingCall"
            @click="guardarLigacao"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

const columns = [
  { name: 'nome', label: 'Nome', field: 'name', align: 'left', sortable: true },
  { name: 'telefone', label: 'Telefone', field: 'telefone', align: 'left' },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'data_registo', label: 'Data de registo', field: 'date_joined', align: 'left', sortable: true },
  { name: 'ligacoes', label: 'Ligações', field: 'follow_up_calls', align: 'left' },
  { name: 'actions', label: 'Ações', align: 'center' },
]

export default {
  name: 'UsersNoPaymentsPage',

  setup() {
    const router = useRouter()
    const $q = useQuasar()
    const loading = ref(false)
    const rows = ref([])
    const dateFrom = ref('')
    const dateTo = ref('')
    const dialogRegistarLigacao = ref(false)
    const targetUserForCall = ref(null)
    const savingCall = ref(false)
    const novaLigacaoData = ref('')

    function formatDate(val) {
      if (!val) return '—'
      const d = new Date(val)
      if (isNaN(d.getTime())) return String(val)
      return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    async function loadUsers() {
      loading.value = true
      try {
        const params = new URLSearchParams()
        params.set('no_payments', '1')
        if (dateFrom.value) params.set('date_from', dateFrom.value)
        if (dateTo.value) params.set('date_to', dateTo.value)
        const response = await api.get(`/users/list/?${params.toString()}`)
        const list = Array.isArray(response.data) ? response.data : []
        rows.value = list.map((u) => ({
          ...u,
          name: [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.username || '—',
          follow_up_calls: u.follow_up_calls || [],
        }))
      } catch (err) {
        console.error('Erro ao carregar utilizadores sem pagamento:', err)
        rows.value = []
        const msg = err.response?.data?.detail || err.response?.data?.error || 'Erro ao carregar lista'
        $q.notify({ type: 'negative', message: msg })
      } finally {
        loading.value = false
      }
    }

    function clearDates() {
      dateFrom.value = ''
      dateTo.value = ''
      loadUsers()
    }

    function goToUser(userId) {
      router.push({ path: '/users', query: { user_id: userId } })
    }

    function openRegistarLigacao(row) {
      targetUserForCall.value = row
      novaLigacaoData.value = new Date().toISOString().slice(0, 10)
      dialogRegistarLigacao.value = true
    }

    async function guardarLigacao() {
      const target = targetUserForCall.value
      if (!target?.id || !novaLigacaoData.value) {
        $q.notify({ type: 'warning', message: 'Seleccione a data da ligação.' })
        return
      }
      savingCall.value = true
      try {
        await api.post(`/users/${target.id}/follow-up-calls/`, {
          called_at: novaLigacaoData.value,
        })
        $q.notify({ type: 'positive', message: 'Ligação registada.' })
        dialogRegistarLigacao.value = false
        targetUserForCall.value = null
        await loadUsers()
      } catch (err) {
        $q.notify({
          type: 'negative',
          message: err.response?.data?.error || err.response?.data?.detail || 'Erro ao guardar ligação',
        })
      } finally {
        savingCall.value = false
      }
    }

    onMounted(() => {
      loadUsers()
    })

    return {
      loading,
      rows,
      columns,
      dateFrom,
      dateTo,
      formatDate,
      loadUsers,
      clearDates,
      goToUser,
      dialogRegistarLigacao,
      targetUserForCall,
      savingCall,
      novaLigacaoData,
      openRegistarLigacao,
      guardarLigacao,
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

.chip-date-btn {
  border-radius: 16px;
  background: rgba(25, 118, 210, 0.2);
}
.chip-date-btn:hover {
  background: rgba(25, 118, 210, 0.35);
}
</style>
