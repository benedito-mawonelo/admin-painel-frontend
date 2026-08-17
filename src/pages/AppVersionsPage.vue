<template>
  <q-page class="q-pa-md">
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div>
            <div class="text-h5 text-weight-bold">Versões da app</div>
            <p class="text-body2 text-grey-7 q-mb-none q-mt-xs">
              Utilizadores na versão actual vs versões antigas, por produto e província.
            </p>
          </div>
          <q-space />
          <q-btn flat round dense icon="refresh" :loading="loading" @click="loadAll">
            <q-tooltip>Atualizar</q-tooltip>
          </q-btn>
        </div>

        <div class="row q-gutter-md items-end wrap">
          <q-select
            v-model="product"
            :options="productOptions"
            label="Produto"
            outlined
            dense
            emit-value
            map-options
            style="min-width: 220px"
            @update:model-value="onProductChange"
          />
          <q-select
            v-model="statusFilter"
            :options="statusOptions"
            label="Estado da versão"
            outlined
            dense
            emit-value
            map-options
            clearable
            style="min-width: 200px"
            @update:model-value="loadUsers"
          />
          <q-select
            v-model="provinciaFilter"
            :options="provinciaOptions"
            label="Província"
            outlined
            dense
            emit-value
            map-options
            clearable
            style="min-width: 220px"
            @update:model-value="loadUsers"
          />
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7">Versão oficial</div>
            <div class="text-h5 text-weight-bold text-primary">{{ stats.official_version || '—' }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7">App actualizada</div>
            <div class="text-h5 text-weight-bold text-positive">
              {{ stats.summary.current }}
              <span class="text-body2 text-grey-7">({{ stats.summary.current_pct }}%)</span>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7">Versão antiga</div>
            <div class="text-h5 text-weight-bold text-negative">
              {{ stats.summary.outdated }}
              <span class="text-body2 text-grey-7">({{ stats.summary.outdated_pct }}%)</span>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7">Sem versão reportada</div>
            <div class="text-h5 text-weight-bold text-grey-8">{{ stats.summary.unknown }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-lg-7">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-sm">Províncias</div>
            <div class="text-caption text-grey-7 q-mb-md">
              Onde há mais utilizadores actualizados vs desactualizados
            </div>
            <q-table
              :rows="stats.by_provincia"
              :columns="provinciaColumns"
              row-key="provincia"
              flat
              bordered
              :loading="loading"
              :rows-per-page-options="[10, 25, 50]"
            >
              <template v-slot:body-cell-current="props">
                <q-td :props="props">
                  <span class="text-positive text-weight-medium">{{ props.row.current }}</span>
                  <span class="text-caption text-grey-7 q-ml-xs">({{ props.row.current_pct }}%)</span>
                </q-td>
              </template>
              <template v-slot:body-cell-outdated="props">
                <q-td :props="props">
                  <span class="text-negative text-weight-medium">{{ props.row.outdated }}</span>
                  <span class="text-caption text-grey-7 q-ml-xs">({{ props.row.outdated_pct }}%)</span>
                </q-td>
              </template>
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn
                    flat
                    dense
                    size="sm"
                    color="primary"
                    label="Ver users"
                    @click="filterByProvincia(props.row.provincia)"
                  />
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-lg-5">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-sm">Distribuição por versão</div>
            <q-table
              :rows="stats.by_version"
              :columns="versionColumns"
              row-key="version"
              flat
              bordered
              :loading="loading"
              hide-pagination
              :pagination="{ rowsPerPage: 0 }"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6 q-mb-sm">Utilizadores ({{ users.count }})</div>
        <q-table
          :rows="users.results"
          :columns="userColumns"
          row-key="id"
          flat
          bordered
          :loading="loadingUsers"
          :rows-per-page-options="[25, 50, 100]"
        >
          <template v-slot:body-cell-version_status="props">
            <q-td :props="props">
              <q-badge
                :color="statusColor(props.row.version_status)"
                :label="statusLabel(props.row.version_status)"
              />
            </q-td>
          </template>
          <template v-slot:body-cell-app_version_seen_at="props">
            <q-td :props="props">{{ formatDate(props.row.app_version_seen_at) }}</q-td>
          </template>
          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey-7 q-pa-lg">
              Nenhum utilizador encontrado com estes filtros.
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

const productOptions = [
  { label: 'Carta Fácil (V3)', value: 'cartafacil' },
  { label: 'Carta Fácil Lite', value: 'cartafacil-lite' },
]

const statusOptions = [
  { label: 'Actualizada', value: 'current' },
  { label: 'Antiga', value: 'outdated' },
  { label: 'Sem versão', value: 'unknown' },
]

const provinciaColumns = [
  { name: 'provincia', label: 'Província', field: 'provincia', align: 'left', sortable: true },
  { name: 'total_with_version', label: 'Com versão', field: 'total_with_version', align: 'right', sortable: true },
  { name: 'current', label: 'Actualizada', field: 'current', align: 'right', sortable: true },
  { name: 'outdated', label: 'Antiga', field: 'outdated', align: 'right', sortable: true },
  { name: 'actions', label: '', field: 'actions', align: 'center' },
]

const versionColumns = [
  { name: 'version', label: 'Versão', field: 'version', align: 'left', sortable: true },
  { name: 'count', label: 'Utilizadores', field: 'count', align: 'right', sortable: true },
]

const userColumns = [
  { name: 'name', label: 'Nome', field: 'name', align: 'left', sortable: true },
  { name: 'telefone', label: 'Telefone', field: 'telefone', align: 'left' },
  { name: 'provincia', label: 'Província', field: 'provincia', align: 'left', sortable: true },
  { name: 'app_version', label: 'Versão', field: 'app_version', align: 'left', sortable: true },
  { name: 'app_platform', label: 'Plataforma', field: 'app_platform', align: 'left' },
  { name: 'version_status', label: 'Estado', field: 'version_status', align: 'left' },
  { name: 'app_version_seen_at', label: 'Visto em', field: 'app_version_seen_at', align: 'left', sortable: true },
]

const emptyStats = () => ({
  official_version: '',
  summary: {
    total_users: 0,
    total_with_version: 0,
    current: 0,
    outdated: 0,
    unknown: 0,
    current_pct: 0,
    outdated_pct: 0,
  },
  by_provincia: [],
  by_version: [],
})

export default {
  name: 'AppVersionsPage',

  setup() {
    const $q = useQuasar()
    const loading = ref(false)
    const loadingUsers = ref(false)
    const product = ref('cartafacil')
    const statusFilter = ref(null)
    const provinciaFilter = ref(null)
    const stats = ref(emptyStats())
    const users = ref({ count: 0, results: [] })
    const provinciaOptions = ref([])

    function formatDate(val) {
      if (!val) return '—'
      const d = new Date(val)
      if (isNaN(d.getTime())) return String(val)
      return d.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    function statusColor(status) {
      if (status === 'current') return 'positive'
      if (status === 'outdated') return 'negative'
      return 'grey'
    }

    function statusLabel(status) {
      if (status === 'current') return 'Actualizada'
      if (status === 'outdated') return 'Antiga'
      return 'Sem versão'
    }

    async function loadStats() {
      loading.value = true
      try {
        const res = await api.get('/users/app-versions/stats/', {
          params: { product: product.value },
        })
        stats.value = res.data || emptyStats()
        provinciaOptions.value = (stats.value.by_provincia || []).map((row) => ({
          label: row.provincia,
          value: row.provincia,
        }))
      } catch (err) {
        stats.value = emptyStats()
        const msg = err.response?.data?.error || err.response?.data?.detail || 'Erro ao carregar estatísticas.'
        $q.notify({ type: 'negative', message: msg })
      } finally {
        loading.value = false
      }
    }

    async function loadUsers() {
      loadingUsers.value = true
      try {
        const params = { product: product.value, limit: 200 }
        if (statusFilter.value) params.status = statusFilter.value
        if (provinciaFilter.value) params.provincia = provinciaFilter.value
        const res = await api.get('/users/app-versions/users/', { params })
        users.value = res.data || { count: 0, results: [] }
      } catch (err) {
        users.value = { count: 0, results: [] }
        const msg = err.response?.data?.error || err.response?.data?.detail || 'Erro ao carregar utilizadores.'
        $q.notify({ type: 'negative', message: msg })
      } finally {
        loadingUsers.value = false
      }
    }

    async function loadAll() {
      await loadStats()
      await loadUsers()
    }

    function onProductChange() {
      provinciaFilter.value = null
      loadAll()
    }

    function filterByProvincia(provincia) {
      provinciaFilter.value = provincia
      loadUsers()
    }

    onMounted(() => {
      loadAll()
    })

    return {
      loading,
      loadingUsers,
      product,
      productOptions,
      statusFilter,
      statusOptions,
      provinciaFilter,
      provinciaOptions,
      stats,
      users,
      provinciaColumns,
      versionColumns,
      userColumns,
      formatDate,
      statusColor,
      statusLabel,
      loadAll,
      loadUsers,
      onProductChange,
      filterByProvincia,
    }
  },
}
</script>

<style scoped>
</style>
