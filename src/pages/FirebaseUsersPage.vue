<template>
  <q-page class="q-pa-md">
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h5 text-weight-bold q-mb-md">Utilizadores Firebase</div>
        <p class="text-body2 text-grey-7 q-mb-md">
          Lista de utilizadores que existem no Firebase e ainda não existem no Django.
        </p>

        <div class="row items-end q-gutter-md wrap">
          <q-input
            v-model="search"
            outlined
            dense
            clearable
            label="Pesquisar (nome, telefone, email, uid)"
            style="min-width: 280px"
            @keyup.enter="applyFilters"
          />
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
          <q-btn color="primary" icon="search" label="Filtrar" :loading="loading" @click="applyFilters" />
          <q-btn flat label="Limpar" @click="clearFilters" />
        </div>
      </q-card-section>
    </q-card>

    <q-card>
      <q-card-section class="row items-center">
        <div class="text-h6">Resultados ({{ pagination.rowsNumber }} utilizadores)</div>
        <q-space />
        <q-btn flat round dense icon="refresh" :loading="loading" @click="loadRows">
          <q-tooltip>Atualizar lista</q-tooltip>
        </q-btn>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pa-none">
        <q-table
          :rows="rows"
          :columns="columns"
          row-key="uid"
          :loading="loading"
          flat
          bordered
          v-model:pagination="pagination"
          @request="onRequest"
          :rows-per-page-options="[10, 25, 50, 100]"
          class="sticky-header-table"
        >
          <template v-slot:body-cell-nome="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.name || '—' }}</div>
              <div v-if="props.row.apelido" class="text-caption text-grey-7">{{ props.row.apelido }}</div>
              <div v-if="props.row.username" class="text-caption text-grey-7">@{{ props.row.username }}</div>
            </q-td>
          </template>
          <template v-slot:body-cell-created_at="props">
            <q-td :props="props">{{ formatDate(props.row.created_at) }}</q-td>
          </template>
          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey-7 q-pa-lg">
              <q-icon name="info" size="2rem" class="q-mr-sm" />
              Não há utilizadores Firebase pendentes para este filtro.
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
  { name: 'uid', label: 'UID Firebase', field: 'uid', align: 'left' },
  { name: 'nome', label: 'Nome', field: 'name', align: 'left' },
  { name: 'telefone', label: 'Telefone', field: 'telefone', align: 'left' },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'social_network', label: 'Origem', field: 'social_network', align: 'left' },
  { name: 'created_at', label: 'Data registo', field: 'created_at', align: 'left', sortable: true },
]

export default {
  name: 'FirebaseUsersPage',
  setup() {
    const $q = useQuasar()
    const loading = ref(false)
    const rows = ref([])
    const search = ref('')
    const dateFrom = ref('')
    const dateTo = ref('')
    const pagination = ref({
      page: 1,
      rowsPerPage: 25,
      rowsNumber: 0,
      sortBy: 'created_at',
      descending: true,
    })

    function formatDate(val) {
      if (!val) return '—'
      const d = new Date(val)
      if (isNaN(d.getTime())) return String(val)
      return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    async function loadRows() {
      loading.value = true
      try {
        const params = new URLSearchParams()
        params.set('page', String(pagination.value.page))
        params.set('per_page', String(pagination.value.rowsPerPage))
        if (search.value) params.set('q', search.value)
        if (dateFrom.value) params.set('date_from', dateFrom.value)
        if (dateTo.value) params.set('date_to', dateTo.value)

        const { data } = await api.get(`/users/firebase-only/?${params.toString()}`)
        rows.value = Array.isArray(data?.results) ? data.results : []
        pagination.value.rowsNumber = Number(data?.total || 0)
      } catch (err) {
        rows.value = []
        pagination.value.rowsNumber = 0
        $q.notify({
          type: 'negative',
          message: err.response?.data?.error || err.response?.data?.detail || 'Erro ao carregar utilizadores Firebase',
        })
      } finally {
        loading.value = false
      }
    }

    function applyFilters() {
      pagination.value.page = 1
      loadRows()
    }

    function clearFilters() {
      search.value = ''
      dateFrom.value = ''
      dateTo.value = ''
      pagination.value.page = 1
      loadRows()
    }

    function onRequest(props) {
      pagination.value.page = props.pagination.page
      pagination.value.rowsPerPage = props.pagination.rowsPerPage
      loadRows()
    }

    onMounted(() => {
      loadRows()
    })

    return {
      loading,
      rows,
      columns,
      search,
      dateFrom,
      dateTo,
      pagination,
      formatDate,
      loadRows,
      applyFilters,
      clearFilters,
      onRequest,
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
</style>
