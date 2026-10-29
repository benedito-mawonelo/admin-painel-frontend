<template>
  <q-page class="q-pa-md">
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h5 text-weight-bold q-mb-md">Utilizadores com pagamento activo</div>
        <p class="text-body2 text-grey-7 q-mb-md">
          Utilizadores com pelo menos um pagamento concluído que ainda não terminou. A lista está ordenada
          pelo pacote que termina primeiro.
        </p>

        <div class="row items-end q-gutter-md wrap">
          <q-select
            v-model="category"
            :options="categoryOptions"
            label="Categoria"
            outlined
            dense
            clearable
            emit-value
            map-options
            style="min-width: 220px"
          />
          <q-select
            v-model="subcategoria"
            :options="subcategoriaOptions"
            label="Subcategoria"
            outlined
            dense
            clearable
            emit-value
            map-options
            style="min-width: 240px"
          />
          <q-btn color="primary" icon="search" label="Filtrar" :loading="loading" @click="loadUsers" />
          <q-btn flat label="Limpar filtros" @click="clearFilters" />
        </div>
      </q-card-section>
    </q-card>

    <q-card>
      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-h6">Resultados ({{ filteredRows.length }} utilizadores)</div>
        <q-space />
        <q-input
          v-model="search"
          dense
          outlined
          clearable
          placeholder="Pesquisar nome ou telefone"
          style="min-width: 240px"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-btn
          outline
          color="secondary"
          icon="download"
          label="Exportar CSV"
          no-caps
          :disable="loading || !filteredRows.length"
          @click="exportarCsv"
        />
        <q-btn flat round dense icon="refresh" :loading="loading" @click="loadUsers">
          <q-tooltip>Atualizar lista</q-tooltip>
        </q-btn>
      </q-card-section>
      <q-separator />

      <q-card-section class="q-pa-none">
        <q-table
          :rows="filteredRows"
          :columns="columns"
          row-key="id"
          :loading="loading"
          v-model:pagination="pagination"
          flat
          bordered
          :rows-per-page-options="[10, 25, 50, 100]"
          class="sticky-header-table"
        >
          <template v-slot:body-cell-nome="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.name }}</div>
              <div v-if="props.row.username && props.row.username !== props.row.name" class="text-caption text-grey-7">
                {{ props.row.username }}
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-pacotes="props">
            <q-td :props="props">
              <div class="column q-gutter-xs">
                <div v-for="payment in props.row.payments" :key="payment.id" class="row items-center no-wrap q-gutter-xs">
                  <q-chip dense square :color="categoryColor(payment.category)" text-color="white" class="q-ma-none">
                    {{ categoryLabel(payment.category) }}
                  </q-chip>
                  <span class="text-caption">
                    {{ subcategoriaLabel(payment.subcategoria) }} · até {{ formatDate(payment.end_at) }}
                    ({{ daysLabel(payment.days_left) }})
                  </span>
                </div>
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-termina="props">
            <q-td :props="props">
              <div>{{ formatDate(props.row.ends_at) }}</div>
              <q-badge :color="props.row.days_left <= 3 ? 'negative' : 'positive'" :label="daysLabel(props.row.days_left)" />
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
              Nenhum utilizador com pagamento activo para estes filtros.
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

const columns = [
  { name: 'nome', label: 'Nome', field: 'name', align: 'left', sortable: true },
  { name: 'telefone', label: 'Telefone', field: 'telefone', align: 'left' },
  { name: 'pacotes', label: 'Pacotes activos', field: 'payments', align: 'left' },
  { name: 'termina', label: 'Termina em', field: 'ends_at', align: 'left', sortable: true },
  { name: 'actions', label: 'Ações', align: 'center' },
]

const CATEGORIES = {
  ligeiro_pesado: { label: 'Pacote Básico (Ligeiro e Pesado)', color: 'blue-7' },
  'ganha-facil': { label: 'Ultra Pro Max', color: 'green-8' },
  profissional: { label: 'Profissional', color: 'brown-6' },
  videos: { label: 'Vídeo-aulas teóricas', color: 'purple-6' },
  'videos-practical-ligeiro': { label: 'Vídeo-aulas práticas · Ligeiro', color: 'deep-purple-6' },
  'videos-practical-pesado': { label: 'Vídeo-aulas práticas · Pesado', color: 'deep-purple-8' },
  'video-pratical': { label: 'Vídeo prático', color: 'deep-purple-4' },
}

const SUBCATEGORIAS = {
  exames_inatro: 'Exame INATRO',
  material_basico: 'Novos alunos',
  preparacao: 'Preparação para os testes',
  pre_escola: 'Pré-escola',
  profissional: 'Profissional',
  video_aulas: 'Aulas teóricas',
  video_aulas_praticas: 'Aulas práticas',
}

const categoryOptions = Object.entries(CATEGORIES).map(([value, c]) => ({ label: c.label, value }))
const subcategoriaOptions = [
  { label: 'Sem subcategoria (app antiga)', value: 'sem' },
  ...Object.entries(SUBCATEGORIAS).map(([value, label]) => ({ label, value })),
]

export default {
  name: 'ActivePaymentsUsersPage',

  setup() {
    const router = useRouter()
    const $q = useQuasar()
    const loading = ref(false)
    const rows = ref([])
    const category = ref(null)
    const subcategoria = ref(null)
    const search = ref('')
    const pagination = ref({ sortBy: 'termina', descending: false, page: 1, rowsPerPage: 25 })

    const filteredRows = computed(() => {
      const term = (search.value || '').trim().toLowerCase()
      if (!term) return rows.value
      const digits = term.replace(/\D/g, '')
      return rows.value.filter((row) => {
        if (String(row.name || '').toLowerCase().includes(term)) return true
        if (String(row.username || '').toLowerCase().includes(term)) return true
        return digits && String(row.telefone || '').replace(/\D/g, '').includes(digits)
      })
    })

    function categoryLabel(value) {
      return CATEGORIES[value]?.label || value || '—'
    }

    function categoryColor(value) {
      return CATEGORIES[value]?.color || 'grey-7'
    }

    function subcategoriaLabel(value) {
      if (!value) return 'Sem subcategoria'
      return SUBCATEGORIAS[value] || value
    }

    function daysLabel(days) {
      const n = Number(days) || 0
      return n === 1 ? '1 dia' : `${n} dias`
    }

    function formatDate(val) {
      if (!val) return '—'
      const d = new Date(val)
      if (isNaN(d.getTime())) return String(val)
      return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    async function loadUsers() {
      loading.value = true
      try {
        const params = {}
        if (category.value) params.category = category.value
        if (subcategoria.value) params.subcategoria = subcategoria.value
        const { data } = await api.get('/payments/admin/active-users/', { params })
        rows.value = Array.isArray(data?.results) ? data.results : []
      } catch (err) {
        console.error('Erro ao carregar utilizadores com pagamento activo:', err)
        rows.value = []
        const msg = err.response?.data?.detail || err.response?.data?.error || 'Erro ao carregar lista'
        $q.notify({ type: 'negative', message: msg })
      } finally {
        loading.value = false
      }
    }

    function clearFilters() {
      category.value = null
      subcategoria.value = null
      search.value = ''
      loadUsers()
    }

    function goToUser(userId) {
      router.push({ path: '/users', query: { user_id: userId } })
    }

    const csvEscape = (value) => {
      if (value === null || value === undefined) return ''
      return `"${String(value).replace(/"/g, '""')}"`
    }

    function exportarCsv() {
      const header = ['ID', 'Nome', 'Telefone', 'Email', 'Categoria', 'Subcategoria', 'Valor', 'Início', 'Termina em', 'Dias restantes']
      const lines = [header.map(csvEscape).join(',')]
      filteredRows.value.forEach((row) => {
        row.payments.forEach((payment) => {
          lines.push([
            row.id,
            row.name,
            row.telefone,
            row.email,
            categoryLabel(payment.category),
            subcategoriaLabel(payment.subcategoria),
            payment.amount,
            formatDate(payment.start_at),
            formatDate(payment.end_at),
            payment.days_left,
          ].map(csvEscape).join(','))
        })
      })

      const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `pagamentos-activos-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      $q.notify({ type: 'positive', message: `${filteredRows.value.length} utilizador(es) exportado(s) para CSV.` })
    }

    onMounted(loadUsers)

    return {
      loading,
      rows,
      filteredRows,
      columns,
      category,
      subcategoria,
      search,
      pagination,
      categoryOptions,
      subcategoriaOptions,
      categoryLabel,
      categoryColor,
      subcategoriaLabel,
      daysLabel,
      formatDate,
      loadUsers,
      clearFilters,
      goToUser,
      exportarCsv,
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
