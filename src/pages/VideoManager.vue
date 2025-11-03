<template>
  <q-card class="q-mt-md">
    <q-card-section class="row items-center">
      <div class="text-h6">🎥 Gerenciar Vídeos da Premiação</div>
      <q-space />
      <q-btn
        color="primary"
        icon="add"
        label="Adicionar Vídeo"
        @click="showAddVideoDialog = true"
      />
    </q-card-section>

    <q-separator />

    <q-card-section>
      <!-- Vídeo Atual -->
      <div class="q-mb-md">
        <div class="text-subtitle2 q-mb-sm">Vídeo Ativo Atual</div>
        <q-card v-if="currentVideo" bordered class="bg-grey-1">
          <q-card-section>
            <div class="row items-center">
              <div class="col-8">
                <div class="text-h6">{{ currentVideo.title }}</div>
                <div class="text-caption text-grey-7 q-mb-sm">
                  {{ currentVideo.description }}
                </div>
                <div class="text-caption">
                  <strong>URL:</strong> {{ currentVideo.youtube_url }}
                </div>
                <div class="text-caption">
                  <strong>Atualizado em:</strong> {{ formatDate(currentVideo.updated_at) }}
                </div>
              </div>
              <div class="col-4 text-right">
                <q-btn
                  color="green"
                  icon="play_arrow"
                  label="Assistir"
                  @click="previewVideo(currentVideo)"
                  class="q-mb-xs"
                />
                <q-btn
                  color="orange"
                  icon="edit"
                  label="Editar"
                  @click="editVideo(currentVideo)"
                  class="q-mb-xs q-ml-xs"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
        <div v-else class="text-center text-grey-7 q-py-md">
          <q-icon name="ondemand_video" size="48px" />
          <div>Nenhum vídeo ativo no momento</div>
        </div>
      </div>

      <!-- Lista de Todos os Vídeos -->
      <div>
        <div class="text-subtitle2 q-mb-sm">Todos os Vídeos</div>
        <q-table
          :rows="videos"
          :columns="videoColumns"
          row-key="id"
          :loading="loadingVideos"
          flat
          bordered
        >
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="props.row.active ? 'green' : 'grey'" class="q-pa-sm">
                {{ props.row.active ? 'Ativo' : 'Inativo' }}
              </q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="text-center">
              <q-btn
                flat
                color="primary"
                icon="visibility"
                @click="previewVideo(props.row)"
                size="sm"
              >
                <q-tooltip>Visualizar</q-tooltip>
              </q-btn>
              <q-btn
                flat
                color="orange"
                icon="edit"
                @click="editVideo(props.row)"
                size="sm"
                class="q-ml-xs"
              >
                <q-tooltip>Editar</q-tooltip>
              </q-btn>
              <q-btn
                flat
                color="green"
                icon="check"
                @click="setVideoActive(props.row)"
                size="sm"
                class="q-ml-xs"
                :disabled="props.row.active"
              >
                <q-tooltip>Definir como Ativo</q-tooltip>
              </q-btn>
              <q-btn
                flat
                color="negative"
                icon="delete"
                @click="deleteVideo(props.row)"
                size="sm"
                class="q-ml-xs"
              >
                <q-tooltip>Excluir</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey q-gutter-sm">
              <q-icon name="info" size="2em" />
              <span>Nenhum vídeo cadastrado</span>
            </div>
          </template>
        </q-table>
      </div>
    </q-card-section>

    <!-- Dialog para Adicionar/Editar Vídeo -->
    <q-dialog v-model="showAddVideoDialog" persistent>
      <q-card style="width: 600px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">{{ editingVideo ? 'Editar Vídeo' : 'Adicionar Novo Vídeo' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="saveVideo" class="q-gutter-md">
            <q-input
              v-model="videoForm.title"
              label="Título do Vídeo *"
              :rules="[val => !!val || 'Título é obrigatório']"
              filled
            />

            <q-input
              v-model="videoForm.youtube_url"
              label="URL do YouTube *"
              :rules="[
                val => !!val || 'URL é obrigatória',
                val => isValidYouTubeUrl(val) || 'URL do YouTube inválida'
              ]"
              filled
              placeholder="https://www.youtube.com/watch?v=..."
            />

            <q-input
              v-model="videoForm.description"
              label="Descrição"
              type="textarea"
              filled
              rows="3"
            />

            <q-checkbox
              v-model="videoForm.active"
              label="Definir como vídeo ativo"
              :disable="editingVideo && editingVideo.active"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn
            :label="editingVideo ? 'Atualizar' : 'Adicionar'"
            color="primary"
            @click="saveVideo"
            :loading="savingVideo"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog para Visualizar Vídeo -->
    <q-dialog v-model="showPreviewDialog" maximized>
      <q-card style="width: 800px; max-width: 90vw;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ previewVideoData?.title }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div v-if="previewVideoData" class="text-center">
            <div class="q-mb-md">
              <iframe
                :src="getYouTubeEmbedUrl(previewVideoData.youtube_url)"
                style="width: 100%; height: 400px; border-radius: 12px"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              />
            </div>
            <div class="text-left">
              <div class="text-subtitle1 q-mb-sm"><strong>Descrição:</strong></div>
              <div class="text-body1">{{ previewVideoData.description }}</div>
              <div class="text-caption text-grey-7 q-mt-md">
                <strong>URL Original:</strong> {{ previewVideoData.youtube_url }}
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script>
import { ref, onMounted } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'

export default {
  name: 'VideoManager',

  setup() {
    const $q = useQuasar()

    // Variáveis reativas
    const loadingVideos = ref(false)
    const savingVideo = ref(false)
    const showAddVideoDialog = ref(false)
    const showPreviewDialog = ref(false)

    const videos = ref([])
    const currentVideo = ref(null)
    const previewVideoData = ref(null)
    const editingVideo = ref(null)

    const videoForm = ref({
      title: '',
      youtube_url: '',
      description: '',
      active: false
    })

    const videoColumns = ref([
      {
        name: 'title',
        label: 'Título',
        field: 'title',
        align: 'left',
        sortable: true
      },
      {
        name: 'url',
        label: 'URL do YouTube',
        field: 'youtube_url',
        align: 'left',
        sortable: true
      },
      {
        name: 'status',
        label: 'Status',
        field: 'active',
        align: 'center',
        sortable: true
      },
      {
        name: 'created_at',
        label: 'Data de Criação',
        field: 'created_at',
        align: 'center',
        sortable: true,
        format: (val) => formatDate(val)
      },
      {
        name: 'actions',
        label: 'Ações',
        align: 'center',
        style: 'width: 200px'
      }
    ])

    // Métodos
    const loadVideos = async () => {
      loadingVideos.value = true
      try {
        const [videosResponse, currentResponse] = await Promise.all([
          api.get('/videos/'),
          api.get('/videos/current/')
        ])

        videos.value = videosResponse.data
        currentVideo.value = currentResponse.data.message === 'Nenhum vídeo ativo encontrado'
          ? null
          : currentResponse.data
      } catch (error) {
        console.error('Erro ao carregar vídeos:', error)
        $q.notify({
          type: 'negative',
          message: 'Erro ao carregar vídeos'
        })
      } finally {
        loadingVideos.value = false
      }
    }

    const saveVideo = async () => {
      savingVideo.value = true
      try {
        if (editingVideo.value) {
          // Editar vídeo existente
          await api.patch(`/videos/${editingVideo.value.id}/`, videoForm.value)
          $q.notify({
            type: 'positive',
            message: 'Vídeo atualizado com sucesso!'
          })
        } else {
          // Criar novo vídeo
          await api.post('/videos/create/', videoForm.value)
          $q.notify({
            type: 'positive',
            message: 'Vídeo adicionado com sucesso!'
          })
        }

        // Recarregar lista
        await loadVideos()
        showAddVideoDialog.value = false
        resetVideoForm()

      } catch (error) {
        console.error('Erro ao salvar vídeo:', error)
        $q.notify({
          type: 'negative',
          message: 'Erro ao salvar vídeo'
        })
      } finally {
        savingVideo.value = false
      }
    }

    const editVideo = (video) => {
      editingVideo.value = video
      videoForm.value = {
        title: video.title,
        youtube_url: video.youtube_url,
        description: video.description || '',
        active: video.active
      }
      showAddVideoDialog.value = true
    }

    const previewVideo = (video) => {
      previewVideoData.value = video
      showPreviewDialog.value = true
    }

    const setVideoActive = async (video) => {
      try {
        await api.patch(`/videos/${video.id}/set-active/`)
        $q.notify({
          type: 'positive',
          message: 'Vídeo definido como ativo!'
        })
        await loadVideos()
      } catch (error) {
        console.error('Erro ao definir vídeo como ativo:', error)
        $q.notify({
          type: 'negative',
          message: 'Erro ao definir vídeo como ativo'
        })
      }
    }

    const deleteVideo = async (video) => {
      $q.dialog({
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja excluir o vídeo "${video.title}"?`,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          await api.delete(`/videos/${video.id}/delete/`)
          $q.notify({
            type: 'positive',
            message: 'Vídeo excluído com sucesso!'
          })
          await loadVideos()
        } catch (error) {
          console.error('Erro ao excluir vídeo:', error)
          $q.notify({
            type: 'negative',
            message: 'Erro ao excluir vídeo'
          })
        }
      })
    }

    const resetVideoForm = () => {
      videoForm.value = {
        title: '',
        youtube_url: '',
        description: '',
        active: false
      }
      editingVideo.value = null
    }

    const isValidYouTubeUrl = (url) => {
      const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/
      return regex.test(url)
    }

    const getYouTubeEmbedUrl = (url) => {
      const videoId = extractYouTubeId(url)
      return videoId ? `https://www.youtube.com/embed/${videoId}` : ''
    }

    const extractYouTubeId = (url) => {
      const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\\s]{11})/
      const match = url.match(regex)
      return match ? match[1] : null
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'Não disponível'
      return new Date(dateString).toLocaleString('pt-BR')
    }

    // Carregar vídeos quando o componente for montado
    onMounted(() => {
      loadVideos()
    })

    return {
      // Variáveis
      loadingVideos,
      savingVideo,
      showAddVideoDialog,
      showPreviewDialog,
      videos,
      currentVideo,
      previewVideoData,
      editingVideo,
      videoForm,
      videoColumns,

      // Métodos
      loadVideos,
      saveVideo,
      editVideo,
      previewVideo,
      setVideoActive,
      deleteVideo,
      isValidYouTubeUrl,
      getYouTubeEmbedUrl,
      formatDate
    }
  }
}
</script>

<style scoped>
.q-card {
  border-radius: 12px;
}
</style>
