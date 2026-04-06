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
          <!-- Nome -->
          <template v-slot:body-cell-nome="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.name || '—' }}</div>
              <div v-if="props.row.apelido" class="text-caption text-grey-7">{{ props.row.apelido }}</div>
              <div v-if="props.row.username" class="text-caption text-grey-7">@{{ props.row.username }}</div>
            </q-td>
          </template>

          <!-- Data -->
          <template v-slot:body-cell-created_at="props">
            <q-td :props="props">{{ formatDate(props.row.created_at) }}</q-td>
          </template>

          <!-- Ações -->
          <template v-slot:body-cell-acoes="props">
            <q-td :props="props" auto-width>
              <div class="row no-wrap q-gutter-xs">
                <!-- Ver detalhes -->
                <q-btn
                  flat
                  round
                  dense
                  icon="visibility"
                  color="primary"
                  @click="openDetail(props.row)"
                >
                  <q-tooltip>Ver detalhes</q-tooltip>
                </q-btn>
                <!-- Criar conta no Django -->
                <q-btn
                  flat
                  round
                  dense
                  icon="person_add"
                  color="positive"
                  :loading="creatingUid === props.row.uid"
                  @click="confirmCreateAccount(props.row)"
                >
                  <q-tooltip>Criar conta no Django</q-tooltip>
                </q-btn>
              </div>
            </q-td>
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

    <!-- Drawer de detalhes do utilizador -->
    <q-drawer
      v-model="drawerOpen"
      side="right"
      :width="400"
      overlay
      behavior="mobile"
      elevated
    >
      <div v-if="selectedUser" class="column full-height">
        <!-- Header do drawer -->
        <div class="bg-primary text-white q-pa-md row items-center">
          <div class="col">
            <div class="text-h6 text-weight-bold">{{ selectedUser.name || 'Sem nome' }}</div>
            <div class="text-caption opacity-80">UID: {{ selectedUser.uid }}</div>
          </div>
          <q-btn flat round dense icon="close" color="white" @click="drawerOpen = false" />
        </div>

        <!-- Avatar -->
        <div class="row justify-center q-py-md bg-primary" style="opacity:0.9">
          <q-avatar size="80px" color="white" text-color="primary" class="text-h4 text-weight-bold">
            {{ avatarLetter(selectedUser) }}
          </q-avatar>
        </div>

        <!-- Dados do utilizador -->
        <q-scroll-area class="col q-pa-md">
          <q-list separator>
            <q-item v-if="selectedUser.name">
              <q-item-section avatar><q-icon name="person" color="primary" /></q-item-section>
              <q-item-section>
                <q-item-label class="custom-label" caption>Nome completo</q-item-label>
                <q-item-label class="custom-label">{{ selectedUser.name }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="selectedUser.apelido">
              <q-item-section avatar><q-icon name="badge" color="primary" /></q-item-section>
              <q-item-section>
                <q-item-label class="custom-label" caption>Apelido</q-item-label>
                <q-item-label class="custom-label">{{ selectedUser.apelido }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="selectedUser.telefone">
              <q-item-section avatar><q-icon name="phone" color="primary" /></q-item-section>
              <q-item-section>
                <q-item-label class="custom-label" caption>Telefone</q-item-label>
                <q-item-label class="custom-label">{{ selectedUser.telefone }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="selectedUser.email">
              <q-item-section avatar><q-icon name="email" color="primary" /></q-item-section>
              <q-item-section>
                <q-item-label class="custom-label" caption>Email</q-item-label>
                <q-item-label class="custom-label">{{ selectedUser.email }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="selectedUser.social_network">
              <q-item-section avatar><q-icon name="share" color="primary" /></q-item-section>
              <q-item-section>
                <q-item-label class="custom-label" caption>Origem</q-item-label>
                <q-item-label class="custom-label">{{ selectedUser.social_network }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="selectedUser.created_at">
              <q-item-section avatar><q-icon name="calendar_today" color="primary" /></q-item-section>
              <q-item-section>
                <q-item-label class="custom-label" caption>Data de registo (Firebase)</q-item-label>
                <q-item-label class="custom-label">{{ formatDate(selectedUser.created_at) }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar><q-icon name="fingerprint" color="grey" /></q-item-section>
              <q-item-section>
                <q-item-label class="custom-label" caption>UID Firebase</q-item-label>
                <q-item-label class="custom-label">{{ selectedUser.uid }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <!-- Aviso sobre password -->
          <q-banner class="bg-amber-1 text-amber-9 q-mt-md rounded-borders" dense>
            <template v-slot:avatar>
              <q-icon name="lock" color="amber-9" />
            </template>
            A password guardada no Firebase será usada para criar a conta no Django.
          </q-banner>
        </q-scroll-area>

        <!-- Botão criar conta -->
        <div class="q-pa-md">
          <q-btn
            color="positive"
            icon="person_add"
            label="Criar conta no Django"
            class="full-width"
            size="md"
            :loading="creatingUid === selectedUser.uid"
            @click="confirmCreateAccount(selectedUser)"
          />
        </div>
      </div>
    </q-drawer>

    <!-- Dialog de confirmação -->
    <q-dialog v-model="confirmDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-avatar icon="person_add" color="positive" text-color="white" />
          <span class="q-ml-sm text-h6">Criar conta no Django</span>
        </q-card-section>
        <q-card-section v-if="userToCreate">
          <p>Vai ser criada uma conta com os seguintes dados:</p>
          <q-list dense>
            <q-item>
              <q-item-section><q-item-label caption>Nome</q-item-label><q-item-label>{{ userToCreate.name || '—' }}</q-item-label></q-item-section>
            </q-item>
            <q-item>
              <q-item-section><q-item-label caption>Telefone</q-item-label><q-item-label>{{ userToCreate.telefone || '—' }}</q-item-label></q-item-section>
            </q-item>
            <q-item>
              <q-item-section><q-item-label caption>Email</q-item-label><q-item-label>{{ userToCreate.email || '—' }}</q-item-label></q-item-section>
            </q-item>
          </q-list>
          <p class="q-mt-sm text-caption text-grey-7">
            A password usada será a que está guardada no Firebase para este utilizador.
          </p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="positive" label="Criar conta" :loading="creatingUid === (userToCreate && userToCreate.uid)" @click="doCreateAccount" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

const columns = [
  { name: 'uid', label: 'UID Firebase', field: 'uid', align: 'left', style: 'max-width: 160px; overflow: hidden; text-overflow: ellipsis;' },
  { name: 'nome', label: 'Nome', field: 'name', align: 'left' },
  { name: 'telefone', label: 'Telefone', field: 'telefone', align: 'left' },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'social_network', label: 'Origem', field: 'social_network', align: 'left' },
  { name: 'created_at', label: 'Data registo', field: 'created_at', align: 'left', sortable: true },
  { name: 'acoes', label: 'Ações', field: 'acoes', align: 'center' },
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

    // Drawer de detalhes
    const drawerOpen = ref(false)
    const selectedUser = ref(null)

    // Dialog de confirmação de criação
    const confirmDialog = ref(false)
    const userToCreate = ref(null)
    const creatingUid = ref(null)

    function formatDate(val) {
      if (!val) return '—'
      const d = new Date(val)
      if (isNaN(d.getTime())) return String(val)
      return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    function avatarLetter(user) {
      const name = user?.name || user?.username || user?.email || '?'
      return name.charAt(0).toUpperCase()
    }

    function openDetail(user) {
      selectedUser.value = user
      drawerOpen.value = true
    }

    function confirmCreateAccount(user) {
      userToCreate.value = user
      confirmDialog.value = true
    }

    async function doCreateAccount() {
      const user = userToCreate.value
      if (!user) return

      creatingUid.value = user.uid
      try {
        // Montar payload com dados do Firebase para o endpoint dedicado
        const payload = {
          name: user.name || '',
          apelido: user.apelido || '',
          telefone: user.telefone || '',
          email: user.email || '',
          password: user.firebase_password || '',
          gender: user.gender || '',
          provincia: user.provincia || '',
          birth_year: user.birth_year || user.birthYear || null,
          firebase_uid: user.uid || '',
        }

        // Validação mínima no frontend antes de enviar
        if (!payload.telefone && !payload.email) {
          $q.notify({ type: 'warning', message: 'Este utilizador não tem telefone nem email para criar a conta.' })
          return
        }
        if (!payload.password) {
          $q.notify({ type: 'warning', message: 'Este utilizador não tem password guardada no Firebase. Não é possível criar a conta automaticamente.' })
          return
        }

        await api.post('/users/firebase-create/', payload)

        $q.notify({
          type: 'positive',
          message: `Conta criada com sucesso para ${user.name || user.telefone || user.email}!`,
        })

        confirmDialog.value = false
        drawerOpen.value = false

        // Remover da lista local imediatamente (já foi sincronizado)
        rows.value = rows.value.filter(r => r.uid !== user.uid)
        pagination.value.rowsNumber = Math.max(0, pagination.value.rowsNumber - 1)

      } catch (err) {
        const msg =
          err.response?.data?.error ||
          err.response?.data?.detail ||
          (err.response?.data && typeof err.response.data === 'object'
            ? Object.values(err.response.data).flat().join(' ')
            : null) ||
          'Erro ao criar conta.'
        $q.notify({ type: 'negative', message: msg })
      } finally {
        creatingUid.value = null
      }
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
      avatarLetter,
      loadRows,
      applyFilters,
      clearFilters,
      onRequest,
      // drawer
      drawerOpen,
      selectedUser,
      openDetail,
      // criar conta
      confirmDialog,
      userToCreate,
      creatingUid,
      confirmCreateAccount,
      doCreateAccount,
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
.text-mono {
  font-family: monospace;
  font-size: 11px;
  word-break: break-all;
}

.custom-label {
  color: #fff;
  font-weight: bold;
}
</style>

<!-- <template>
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
</style> -->
