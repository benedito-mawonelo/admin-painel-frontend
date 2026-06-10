<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-sm flex items-center">
      <q-icon name="forum" size="md" class="q-mr-sm text-primary" />
      Moderacao do chat do ranking
    </div>
    <p class="text-body2 text-grey-7 q-mb-md" style="max-width: 920px">
      Mensagens e denuncias em tempo real a partir do Firebase. Pode ver dados do utilizador (telefone, email)
      quando a conta existe no backend e eliminar mensagens inadequadas.
    </p>

    <q-banner v-if="loadError" dense rounded class="bg-negative text-white q-mb-md">
      {{ loadError }}
    </q-banner>

    <q-tabs v-model="tab" dense class="text-primary q-mb-md" align="left" active-color="primary" indicator-color="primary">
      <q-tab name="messages" label="Mensagens" icon="chat" />
      <q-tab name="reports" label="Denuncias" icon="flag" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated>
      <!-- Mensagens -->
      <q-tab-panel name="messages" class="q-pa-none">
        <q-card flat bordered>
          <q-card-section class="row items-end q-col-gutter-md">
            <div class="col-12 col-md-5">
              <q-input
                v-model="messageSearch"
                outlined
                dense
                clearable
                debounce="300"
                label="Pesquisar mensagens"
                placeholder="Texto, nome, telefone, email, ID..."
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-3">
              <q-input
                v-model="messageUserId"
                outlined
                dense
                clearable
                label="Filtrar por ID utilizador"
                type="number"
              />
            </div>
            <div class="col-12 col-md-4 row q-gutter-sm">
              <q-btn color="primary" icon="refresh" label="Actualizar" :loading="messagesLoading" @click="loadMessages" />
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-none">
            <q-table
              flat
              bordered
              :rows="messageRows"
              :columns="messageColumns"
              row-key="firebase_id"
              :loading="messagesLoading"
              :pagination="{ rowsPerPage: 20 }"
              :rows-per-page-options="[10, 20, 50]"
            >
              <template v-slot:body-cell-user="props">
                <q-td :props="props">
                  <div class="row items-center no-wrap">
                    <q-avatar size="36px" class="q-mr-sm">
                      <img :src="props.row.user_photo || defaultAvatar" />
                    </q-avatar>
                    <div>
                      <div class="text-weight-medium">{{ props.row.user_name || '—' }}</div>
                      <div class="text-caption text-grey-7">ID {{ props.row.user_id || '—' }}</div>
                    </div>
                  </div>
                </q-td>
              </template>
              <template v-slot:body-cell-user_details="props">
                <q-td :props="props">
                  <template v-if="props.row.user">
                    <div class="text-body2">{{ props.row.user.telefone || '—' }}</div>
                    <div class="text-caption text-grey-7">{{ props.row.user.email || '—' }}</div>
                  </template>
                  <span v-else class="text-grey-5">Sem conta Django</span>
                </q-td>
              </template>
              <template v-slot:body-cell-text="props">
                <q-td :props="props">
                  <div class="message-text-cell">{{ props.row.text }}</div>
                  <q-chip v-if="props.row.edited" dense size="sm" color="grey-3" label="editada" class="q-mt-xs" />
                </q-td>
              </template>
              <template v-slot:body-cell-timestamp="props">
                <q-td :props="props">{{ formatDate(props.row.timestamp) }}</q-td>
              </template>
              <template v-slot:body-cell-actions="props">
                <q-td :props="props" class="q-gutter-xs">
                  <q-btn
                    flat
                    dense
                    round
                    color="primary"
                    icon="person_search"
                    @click="goToUser(props.row.user_id)"
                  >
                    <q-tooltip>Ver utilizador no painel</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    dense
                    round
                    color="negative"
                    icon="delete"
                    :loading="deletingId === props.row.firebase_id"
                    @click="confirmDeleteMessage(props.row)"
                  >
                    <q-tooltip>Eliminar mensagem</q-tooltip>
                  </q-btn>
                </q-td>
              </template>
              <template v-slot:no-data>
                <div class="full-width text-center q-pa-lg text-grey-6">
                  Nenhuma mensagem encontrada nas ultimas 48h (ou filtros activos).
                </div>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <!-- Denuncias -->
      <q-tab-panel name="reports" class="q-pa-none">
        <q-card flat bordered>
          <q-card-section class="row items-center q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-select
                v-model="reportStatusFilter"
                outlined
                dense
                emit-value
                map-options
                label="Estado"
                :options="reportStatusOptions"
                @update:model-value="loadReports"
              />
            </div>
            <q-space />
            <q-btn color="primary" icon="refresh" label="Actualizar" :loading="reportsLoading" @click="loadReports" />
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-none">
            <q-table
              flat
              bordered
              :rows="reportRows"
              :columns="reportColumns"
              row-key="firebase_id"
              :loading="reportsLoading"
              :pagination="{ rowsPerPage: 15 }"
            >
              <template v-slot:body-cell-reported_user="props">
                <q-td :props="props">
                  <div class="text-weight-medium">{{ props.row.reported_user_name || '—' }}</div>
                  <div class="text-caption">ID {{ props.row.reported_user_id || '—' }}</div>
                  <div v-if="props.row.reported_user" class="text-caption text-grey-7">
                    {{ props.row.reported_user.telefone }}
                  </div>
                </q-td>
              </template>
              <template v-slot:body-cell-message_text="props">
                <q-td :props="props">
                  <div class="message-text-cell">{{ props.row.message_text }}</div>
                </q-td>
              </template>
              <template v-slot:body-cell-status="props">
                <q-td :props="props">
                  <q-select
                    dense
                    outlined
                    :model-value="props.row.status"
                    :options="reportStatusOptions.filter(o => o.value)"
                    emit-value
                    map-options
                    style="min-width: 130px"
                    :loading="updatingReportId === props.row.firebase_id"
                    @update:model-value="val => updateReportStatus(props.row, val)"
                  />
                </q-td>
              </template>
              <template v-slot:body-cell-timestamp="props">
                <q-td :props="props">{{ formatDate(props.row.timestamp) }}</q-td>
              </template>
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn
                    flat
                    dense
                    round
                    color="primary"
                    icon="person_search"
                    :disable="!props.row.reported_user_id"
                    @click="goToUser(props.row.reported_user_id)"
                  >
                    <q-tooltip>Ver utilizador denunciado</q-tooltip>
                  </q-btn>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

export default {
  name: 'ChatModerationPage',
  setup() {
    const $q = useQuasar()
    const router = useRouter()

    const tab = ref('messages')
    const loadError = ref('')
    const defaultAvatar = 'https://cdn.quasar.dev/img/avatar.png'

    const messageSearch = ref('')
    const messageUserId = ref('')
    const messagesLoading = ref(false)
    const messageRows = ref([])
    const deletingId = ref(null)

    const reportsLoading = ref(false)
    const reportRows = ref([])
    const reportStatusFilter = ref('')
    const updatingReportId = ref(null)

    const reportStatusOptions = [
      { label: 'Todos', value: '' },
      { label: 'Pendente', value: 'pending' },
      { label: 'Revisada', value: 'reviewed' },
      { label: 'Resolvida', value: 'resolved' },
      { label: 'Descartada', value: 'dismissed' },
    ]

    const messageColumns = [
      { name: 'user', label: 'Autor', field: 'user_name', align: 'left', sortable: true },
      { name: 'user_details', label: 'Contacto (backend)', align: 'left' },
      { name: 'text', label: 'Mensagem', field: 'text', align: 'left' },
      { name: 'timestamp', label: 'Data', field: 'timestamp', align: 'left', sortable: true },
      { name: 'actions', label: 'Accoes', align: 'center' },
    ]

    const reportColumns = [
      { name: 'reported_user', label: 'Denunciado', align: 'left' },
      { name: 'message_text', label: 'Mensagem', align: 'left' },
      { name: 'reason', label: 'Motivo', field: 'reason', align: 'left' },
      { name: 'status', label: 'Estado', field: 'status', align: 'left' },
      { name: 'timestamp', label: 'Data', field: 'timestamp', align: 'left' },
      { name: 'actions', label: '', align: 'center' },
    ]

    function formatDate(iso) {
      if (!iso) return '—'
      try {
        return new Date(iso).toLocaleString('pt-PT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      } catch {
        return iso
      }
    }

    async function loadMessages() {
      messagesLoading.value = true
      loadError.value = ''
      try {
        const params = { limit: 300 }
        if (messageSearch.value?.trim()) params.q = messageSearch.value.trim()
        if (messageUserId.value) params.user_id = messageUserId.value
        const resp = await api.get('/chat/moderation/messages/', { params })
        messageRows.value = Array.isArray(resp.data?.results) ? resp.data.results : []
      } catch (err) {
        loadError.value = err.response?.data?.error || err.message || 'Erro ao carregar mensagens.'
        messageRows.value = []
      } finally {
        messagesLoading.value = false
      }
    }

    async function loadReports() {
      reportsLoading.value = true
      loadError.value = ''
      try {
        const params = { limit: 150 }
        if (reportStatusFilter.value) params.status = reportStatusFilter.value
        const resp = await api.get('/chat/moderation/reports/', { params })
        reportRows.value = Array.isArray(resp.data?.results) ? resp.data.results : []
      } catch (err) {
        loadError.value = err.response?.data?.error || err.message || 'Erro ao carregar denuncias.'
        reportRows.value = []
      } finally {
        reportsLoading.value = false
      }
    }

    function confirmDeleteMessage(row) {
      $q.dialog({
        title: 'Eliminar mensagem',
        message: `Eliminar mensagem de ${row.user_name || row.user_id}? Esta accao remove o conteudo do Firebase.`,
        cancel: true,
        persistent: true,
      }).onOk(() => deleteMessage(row))
    }

    async function deleteMessage(row) {
      deletingId.value = row.firebase_id
      try {
        await api.delete(`/chat/moderation/messages/${row.firebase_id}/`)
        messageRows.value = messageRows.value.filter(m => m.firebase_id !== row.firebase_id)
        $q.notify({ type: 'positive', message: 'Mensagem eliminada.' })
      } catch (err) {
        $q.notify({
          type: 'negative',
          message: err.response?.data?.error || 'Falha ao eliminar mensagem.',
        })
      } finally {
        deletingId.value = null
      }
    }

    async function updateReportStatus(row, newStatus) {
      updatingReportId.value = row.firebase_id
      try {
        const resp = await api.patch(`/chat/moderation/reports/${row.firebase_id}/`, {
          status: newStatus,
        })
        const idx = reportRows.value.findIndex(r => r.firebase_id === row.firebase_id)
        if (idx >= 0) reportRows.value[idx] = resp.data
        $q.notify({ type: 'positive', message: 'Estado actualizado.' })
      } catch (err) {
        $q.notify({
          type: 'negative',
          message: err.response?.data?.error || 'Falha ao actualizar denuncia.',
        })
      } finally {
        updatingReportId.value = null
      }
    }

    function goToUser(userId) {
      if (!userId) return
      router.push({ path: '/users', query: { user_id: String(userId) } })
    }

    let searchTimer = null
    watch([messageSearch, messageUserId], () => {
      clearTimeout(searchTimer)
      searchTimer = setTimeout(loadMessages, 400)
    })

    watch(tab, (val) => {
      if (val === 'reports' && !reportRows.value.length) loadReports()
    })

    onMounted(() => {
      loadMessages()
    })

    return {
      tab,
      loadError,
      defaultAvatar,
      messageSearch,
      messageUserId,
      messagesLoading,
      messageRows,
      messageColumns,
      deletingId,
      reportsLoading,
      reportRows,
      reportColumns,
      reportStatusFilter,
      reportStatusOptions,
      updatingReportId,
      formatDate,
      loadMessages,
      loadReports,
      confirmDeleteMessage,
      updateReportStatus,
      goToUser,
    }
  },
}
</script>

<style scoped>
.message-text-cell {
  max-width: 320px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
