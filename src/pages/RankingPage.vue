<template>
  <q-page class="q-pa-md">
    <!-- Estatísticas Gerais -->
    <div class="row q-gutter-md q-mb-md">
      <q-card class="col-grow bg-primary text-white">
        <q-card-section>
          <div class="text-h6">Usuários no Ranking</div>
          <div class="text-h4">{{ stats.total_ranking_users }}</div>
          <div class="text-caption">
            {{ stats.ranking_percentage }}% do total de usuários
          </div>
        </q-card-section>
      </q-card>

      <q-card class="col-grow bg-green text-white">
        <q-card-section>
          <div class="text-h6">Total de Usuários</div>
          <div class="text-h4">{{ stats.total_users }}</div>
        </q-card-section>
      </q-card>

      <q-card class="col-grow bg-orange text-white">
        <q-card-section>
          <div class="text-h6">Mês Atual</div>
          <div class="text-h4">{{ stats.current_month }}</div>
          <div class="text-caption">Competição Ativa</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Filtros -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center q-gutter-md">
          <q-select
            v-model="filters.provincia"
            :options="provinciasOptions"
            label="Filtrar por Província"
            clearable
            style="min-width: 200px"
          />
          <q-select
            v-model="filters.nivel"
            :options="niveisOptions"
            label="Filtrar por Nível"
            clearable
            style="min-width: 200px"
          />
          <q-input
            v-model.number="filters.min_points"
            type="number"
            label="Pontos Mínimos"
            clearable
            style="min-width: 150px"
          />
          <q-space />
          <q-btn
            color="primary"
            icon="refresh"
            label="Atualizar"
            @click="loadRankingData"
            :loading="loading"
          />
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md">
      <!-- Ranking Atual -->
      <div class="col-8">
        <q-card>
          <q-card-section class="row items-center">
            <div class="text-h6">🏆 Ranking Atual - {{ stats.current_month }}</div>
            <q-space />
            <q-btn
              flat
              round
              icon="info"
              color="primary"
            >
              <q-tooltip>
                Ranking baseado nos pontos acumulados no mês atual
              </q-tooltip>
            </q-btn>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <q-table
              :rows="filteredRanking"
              :columns="rankingColumns"
              row-key="id"
              :loading="loading"
              :pagination="pagination"
              flat
              bordered
            >
              <template v-slot:body-cell-posicao="props">
                <q-td :props="props">
                  <q-badge
                    :color="getPositionColor(props.row.ranking_position)"
                    class="q-pa-sm ranking-badge"
                  >
                    <q-icon
                      v-if="props.row.ranking_position <= 3"
                      :name="getTrophyIcon(props.row.ranking_position)"
                      class="q-mr-xs"
                    />
                    {{ props.row.ranking_position }}º
                  </q-badge>
                </q-td>
              </template>

              <template v-slot:body-cell-usuario="props">
                <q-td :props="props">
                  <div class="row items-center no-wrap">
                    <q-avatar size="40px" class="q-mr-sm">
                      <img :src="props.row.photo || props.row.image || 'https://cdn.quasar.dev/img/avatar3.jpg'" />
                    </q-avatar>
                    <div>
                      <div class="text-weight-medium">{{ props.row.name }}</div>
                      <div class="text-caption text-grey-7">
                        {{ props.row.telefone }}
                      </div>
                    </div>
                  </div>
                </q-td>
              </template>

              <template v-slot:body-cell-pontos="props">
                <q-td :props="props" class="text-center">
                  <q-badge color="blue" class="q-pa-sm">
                    {{ props.row.points || props.row.ranking_points }} pts
                  </q-badge>
                </q-td>
              </template>

              <template v-slot:body-cell-exames="props">
                <q-td :props="props" class="text-center">
                  {{ props.row.exams || props.row.ranking_exams_count }}
                </q-td>
              </template>

              <template v-slot:body-cell-actions="props">
                <q-td :props="props" class="text-center">
                  <q-btn
                    flat
                    color="primary"
                    icon="visibility"
                    @click="showUserDetails(props.row)"
                    size="sm"
                  >
                    <q-tooltip>Ver Detalhes</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    color="orange"
                    icon="edit"
                    @click="editUserRanking(props.row)"
                    size="sm"
                    class="q-ml-xs"
                  >
                    <q-tooltip>Editar Pontos</q-tooltip>
                  </q-btn>
                </q-td>
              </template>

              <template v-slot:no-data>
                <div class="full-width row flex-center text-grey q-gutter-sm">
                  <q-icon name="info" size="2em" />
                  <span>Nenhum usuário no ranking este mês</span>
                </div>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>

      <!-- Vencedores Mês Anterior e Estatísticas -->
      <div class="col-4">
        <!-- Vencedores Mês Anterior -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h6">🥈 Vencedores Mês Anterior</div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <q-list bordered separator>
              <q-item
                v-for="winner in previousWinners"
                :key="winner.id"
                clickable
                @click="showUserDetails(winner)"
                class="q-pa-sm"
              >
                <q-item-section avatar>
                  <q-avatar :color="getPositionColor(winner.position)" text-color="white">
                    {{ winner.position }}
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    {{ winner.name || winner.user_name }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ winner.telefone || 'Telefone não informado' }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-badge color="green">
                    {{ winner.points || winner.ranking_points }} pts
                  </q-badge>
                </q-item-section>
              </q-item>

              <q-item v-if="previousWinners.length === 0">
                <q-item-section class="text-center text-grey">
                  <q-item-label>Nenhum vencedor registrado</q-item-label>
                  <q-item-label caption>Mês anterior sem competição</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Estatísticas de Distribuição -->
        <q-card>
          <q-card-section>
            <div class="text-h6">📊 Estatísticas</div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <!-- Distribuição por Nível -->
            <div class="q-mb-md">
              <div class="text-subtitle2 q-mb-sm">Distribuição por Nível</div>
              <q-list dense>
                <q-item v-for="(count, nivel) in stats.distribution_by_level" :key="nivel">
                  <q-item-section>
                    <q-item-label>{{ nivel }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge color="primary">{{ count }}</q-badge>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <q-separator class="q-my-md" />

            <!-- Distribuição por Província -->
            <div>
              <div class="text-subtitle2 q-mb-sm">Distribuição por Província</div>
              <q-list dense>
                <q-item v-for="(count, provincia) in stats.distribution_by_province" :key="provincia">
                  <q-item-section>
                    <q-item-label>{{ provincia || 'Não informada' }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge color="green">{{ count }}</q-badge>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-card-section>
        </q-card>

      </div>
    </div>

    <!-- Dialog de Detalhes do Usuário -->
    <q-dialog v-model="userDetailsDialog" maximized>
      <q-card style="width: 800px; max-width: 90vw;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Detalhes do Usuário</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedUser" class="q-pt-none">
          <div class="row q-col-gutter-md">
            <div class="col-4">
              <q-img
                :src="selectedUser.photo || selectedUser.image || 'https://cdn.quasar.dev/img/avatar3.jpg'"
                style="height: 200px"
                class="rounded-borders"
              />
              <div class="text-center q-mt-md">
                <q-badge :color="getPositionColor(selectedUser.ranking_position)" class="q-pa-md text-h6">
                  {{ selectedUser.ranking_position }}º Lugar
                </q-badge>
              </div>
            </div>

            <div class="col-8">
              <div class="text-h5 q-mb-md">
                {{ selectedUser.name }}
              </div>

              <div class="row q-col-gutter-y-md">
                <div class="col-6">
                  <strong>Telefone:</strong> {{ selectedUser.telefone || 'Não informado' }}
                </div>
                <div class="col-6">
                  <strong>Email:</strong> {{ selectedUser.email || 'Não informado' }}
                </div>
                <div class="col-6">
                  <strong>Idade:</strong> {{ calculateAge(selectedUser.birthYear) }}
                </div>
                <div class="col-6">
                  <strong>Sexo:</strong> {{ selectedUser.gender || 'Não informado' }}
                </div>
                <div class="col-6">
                  <strong>Província:</strong> {{ selectedUser.provincia || 'Não informada' }}
                </div>
                <div class="col-6">
                  <strong>Status PRO:</strong>
                  <q-badge :color="selectedUser.isPro ? 'green' : 'grey'">
                    {{ selectedUser.isPro ? 'Sim' : 'Não' }}
                  </q-badge>
                </div>
                <div class="col-6">
                  <strong>Pontuação:</strong> {{ selectedUser.points || selectedUser.ranking_points || 0 }} pontos
                </div>
                <div class="col-6">
                  <strong>Exames Realizados:</strong> {{ selectedUser.exams || selectedUser.ranking_exams_count || 0 }}
                </div>
                <div class="col-6">
                  <strong>Participa no Ranking:</strong>
                  <q-badge :color="selectedUser.acceptedRanking ? 'green' : 'orange'">
                    {{ selectedUser.acceptedRanking ? 'Sim' : 'Não' }}
                  </q-badge>
                </div>
                <div class="col-6">
                  <strong>Última Atualização:</strong>
                  {{ formatDate(selectedUser.updatedAt || selectedUser.last_ranking_update) }}
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Dialog de Edição de Pontos -->
    <q-dialog v-model="editPointsDialog">
      <q-card style="width: 400px;">
        <q-card-section>
          <div class="text-h6">Editar Pontuação</div>
        </q-card-section>

        <q-card-section v-if="editingUser">
          <div class="q-mb-md">
            <strong>Usuário:</strong> {{ editingUser.name }}
          </div>
          <q-input
            v-model.number="newPoints"
            label="Nova Pontuação"
            type="number"
            min="0"
            class="q-mb-md"
          />
          <q-input
            v-model.number="newExams"
            label="Número de Exames"
            type="number"
            min="0"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn
            label="Salvar"
            color="primary"
            @click="saveUserPoints"
            :loading="updatingUser"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>


        <!-- Seção de Gerenciamento de Vídeos -->
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
    </q-card>

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
  </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'

export default {
  name: 'RankingPage',

  setup() {
// Variáveis para gerenciamento de vídeos
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


// Métodos para gerenciamento de vídeos
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

// const extractYouTubeId = (url) => {
//   const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
//   const match = url.match(regex)
//   return match ? match[1] : null
// }
const extractYouTubeId = (url) => {
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}




    const $q = useQuasar()

    const loading = ref(false)
    const updatingUser = ref(false)
    const userDetailsDialog = ref(false)
    const editPointsDialog = ref(false)

    const stats = ref({
      total_ranking_users: 0,
      total_users: 0,
      ranking_percentage: 0,
      current_month: '',
      distribution_by_level: {},
      distribution_by_province: {}
    })

    const currentRanking = ref([])
    const previousWinners = ref([])
    const selectedUser = ref(null)
    const editingUser = ref(null)
    const newPoints = ref(0)
    const newExams = ref(0)

    const filters = ref({
      provincia: null,
      nivel: null,
      min_points: null
    })

    const provinciasOptions = ref([
      'Maputo', 'Gaza', 'Inhambane', 'Sofala', 'Manica',
      'Tete', 'Zambézia', 'Nampula', 'Cabo Delgado', 'Niassa'
    ])

    const niveisOptions = ref([
      'Iniciante', 'Intermediário', 'Avançado', 'Expert'
    ])

    const pagination = ref({
      sortBy: 'ranking_position',
      descending: false,
      page: 1,
      rowsPerPage: 25
    })

    const rankingColumns = ref([
      {
        name: 'posicao',
        label: 'Posição',
        field: 'ranking_position',
        align: 'center',
        sortable: true,
        style: 'width: 100px'
      },
      {
        name: 'usuario',
        label: 'Usuário',
        field: 'name',
        align: 'left',
        sortable: true
      },
      {
        name: 'provincia',
        label: 'Província',
        field: 'provincia',
        align: 'left',
        sortable: true
      },
      {
        name: 'pontos',
        label: 'Pontos',
        field: 'points',
        align: 'center',
        sortable: true,
        style: 'width: 120px'
      },
      {
        name: 'exames',
        label: 'Exames',
        field: 'exams',
        align: 'center',
        sortable: true,
        style: 'width: 100px'
      },
      {
        name: 'actions',
        label: 'Ações',
        align: 'center',
        style: 'width: 120px'
      }
    ])

    const filteredRanking = computed(() => {
      let filtered = currentRanking.value

      if (filters.value.provincia) {
        filtered = filtered.filter(user =>
          user.provincia === filters.value.provincia
        )
      }

      if (filters.value.nivel) {
        filtered = filtered.filter(user => {
          const pontos = user.points || user.ranking_points || 0
          return getNivelByPoints(pontos) === filters.value.nivel
        })
      }

      if (filters.value.min_points) {
        filtered = filtered.filter(user =>
          (user.points || user.ranking_points || 0) >= filters.value.min_points
        )
      }

      return filtered
    })

    const loadRankingData = async () => {
      loading.value = true
      try {
        // Carrega dashboard completo
        const dashboardResponse = await api.get('/ranking/dashboard/')
        const dashboardData = dashboardResponse.data

        stats.value = {
          total_ranking_users: dashboardData.total_ranking_users,
          total_users: dashboardData.total_users,
          ranking_percentage: dashboardData.ranking_percentage,
          current_month: dashboardData.current_month || new Date().toISOString().slice(0, 7),
          distribution_by_level: dashboardData.distribution_by_level || {},
          distribution_by_province: dashboardData.distribution_by_province || {}
        }

        currentRanking.value = dashboardData.current_ranking || []
        previousWinners.value = dashboardData.previous_winners || []

      } catch (error) {
        console.error('Erro ao carregar dados do ranking:', error)
        $q.notify({
          type: 'negative',
          message: 'Erro ao carregar dados do ranking'
        })
      } finally {
        loading.value = false
      }
    }

    const showUserDetails = async (user) => {
      try {
        // Se o usuário já tem dados completos, usa diretamente
        if (user.telefone && user.email) {
          selectedUser.value = user
          userDetailsDialog.value = true
          return
        }

        // Caso contrário, busca detalhes completos
        const userId = user.uid || user.id
        if (userId) {
          const response = await api.get(`/users/${userId}/details/`)
          selectedUser.value = { ...user, ...response.data }
          userDetailsDialog.value = true
        } else {
          selectedUser.value = user
          userDetailsDialog.value = true
        }
      } catch (error) {
        console.error('Erro ao carregar detalhes do usuário:', error)
        $q.notify({
          type: 'negative',
          message: 'Erro ao carregar detalhes do usuário'
        })
      }
    }

    const editUserRanking = (user) => {
      editingUser.value = user
      newPoints.value = user.points || user.ranking_points || 0
      newExams.value = user.exams || user.ranking_exams_count || 0
      editPointsDialog.value = true
    }

    const saveUserPoints = async () => {
      updatingUser.value = true
      try {
        const userId = editingUser.value.uid || editingUser.value.id

        await api.patch(`/users/${userId}/update-ranking/`, {
          pontos: newPoints.value,
          nivel: getNivelByPoints(newPoints.value),
          exams: newExams.value
        })

        $q.notify({
          type: 'positive',
          message: 'Pontuação atualizada com sucesso!'
        })

        // Recarregar dados
        await loadRankingData()
        editPointsDialog.value = false

      } catch (error) {
        console.error('Erro ao atualizar pontuação:', error)
        $q.notify({
          type: 'negative',
          message: 'Erro ao atualizar pontuação'
        })
      } finally {
        updatingUser.value = false
      }
    }

    const calculateAge = (birthYear) => {
      if (!birthYear) return 'Não informada'
      const currentYear = new Date().getFullYear()
      const age = currentYear - birthYear
      return `${age} anos`
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'Não disponível'
      return new Date(dateString).toLocaleString('pt-BR')
    }

    const getPositionColor = (position) => {
      if (position === 1) return 'yellow-8'
      if (position === 2) return 'grey-6'
      if (position === 3) return 'orange'
      if (position <= 10) return 'primary'
      return 'green'
    }

    const getTrophyIcon = (position) => {
      if (position === 1) return 'emoji_events'
      if (position === 2) return 'military_tech'
      if (position === 3) return 'workspace_premium'
      return 'star'
    }

    const getNivelByPoints = (pontos) => {
      if (pontos >= 100) return "Expert"
      if (pontos >= 50) return "Avançado"
      if (pontos >= 20) return "Intermediário"
      return "Iniciante"
    }

    onMounted(() => {
      loadRankingData(),
      loadVideos()
    })

    return {
      loading,
      updatingUser,
      userDetailsDialog,
      editPointsDialog,
      stats,
      currentRanking,
      previousWinners,
      selectedUser,
      editingUser,
      newPoints,
      newExams,
      filters,
      provinciasOptions,
      niveisOptions,
      pagination,
      rankingColumns,
      filteredRanking,
      loadRankingData,
      showUserDetails,
      editUserRanking,
      saveUserPoints,
      calculateAge,
      formatDate,
      getPositionColor,
      getTrophyIcon,
      getNivelByPoints,


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

  // Métodos de vídeo
  loadVideos,
  saveVideo,
  editVideo,
  previewVideo,
  setVideoActive,
  deleteVideo,
  isValidYouTubeUrl,
  getYouTubeEmbedUrl
    }
  }
}
</script>

<style scoped>
.q-card {
  border-radius: 12px;
}

.ranking-badge {
  font-size: 1em;
  font-weight: bold;
}

:deep(.q-table th) {
  font-weight: bold;
  background-color: #f5f5f5;
}

:deep(.q-table tbody tr:hover) {
  background-color: #f0f8ff;
}
</style>
