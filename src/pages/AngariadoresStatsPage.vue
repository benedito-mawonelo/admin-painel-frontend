<template>
  <q-page class="ang-stats-page q-pa-lg">
    <!-- Cabeçalho -->
    <div class="row items-end q-col-gutter-md q-mb-lg">
      <div class="col-12 col-lg-5">
        <div class="text-h5 text-weight-bold text-grey-9">
          Performance dos angariadores
        </div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Leads angariados, conversões e pendências · {{ tituloResultados }}
        </div>
      </div>
      <div class="col-12 col-lg-7 text-right">
        <q-btn
          outline
          color="primary"
          icon="download"
          label="Exportar CSV"
          no-caps
          :disable="!resultados.length"
          @click="exportarCsv"
        />
      </div>
    </div>

    <!-- Filtros -->
    <q-card flat bordered class="stats-panel-card q-mb-lg">
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-md-auto">
            <div class="text-caption text-grey-7 q-mb-xs text-uppercase text-weight-medium">
              Período
            </div>
            <q-btn-toggle
              v-model="periodo"
              no-caps
              unelevated
              toggle-color="primary"
              color="grey-3"
              text-color="grey-8"
              :options="[
                { label: 'Dia', value: 'dia' },
                { label: 'Semana', value: 'semana' },
                { label: 'Mês', value: 'mes' }
              ]"
            />
          </div>

          <template v-if="periodo === 'mes'">
            <div class="col-6 col-md-2">
              <q-input v-model.number="mes" type="number" min="1" max="12" outlined dense label="Mês" />
            </div>
            <div class="col-6 col-md-2">
              <q-input v-model.number="ano" type="number" min="2000" max="2100" outlined dense label="Ano" />
            </div>
          </template>
          <template v-else-if="periodo === 'dia'">
            <div class="col-12 col-md-4">
              <q-input v-model="dataDiaDisplay" outlined dense readonly label="Dia">
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="dataDiaPicker" mask="YYYY-MM-DD" minimal>
                        <div class="row items-center justify-end q-gutter-sm q-pa-sm">
                          <q-btn v-close-popup label="Fechar" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </template>
          <template v-else>
            <div class="col-12 col-md-5">
              <q-input
                v-model="dataSemanaDisplay"
                outlined
                dense
                readonly
                label="Semana (ISO)"
                :hint="intervaloSemanaHint"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="dataSemanaPicker" mask="YYYY-MM-DD" minimal>
                        <div class="row items-center justify-end q-gutter-sm q-pa-sm">
                          <q-btn v-close-popup label="Fechar" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </template>

          <div class="col-12 col-md-4">
            <q-select
              v-model="angariadorSeleccionado"
              outlined
              dense
              clearable
              use-input
              fill-input
              hide-selected
              input-debounce="300"
              label="Filtrar angariador"
              placeholder="Nome, apelido ou telefone"
              :options="angariadorOptions"
              option-label="label"
              :loading="angariadorSearchLoading"
              @filter="filtrarAngariadores"
              @update:model-value="onAngariadorSeleccionado"
              @clear="onAngariadorLimpo"
              @keyup.enter="carregar"
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">Digite pelo menos 2 caracteres…</q-item-section>
                </q-item>
              </template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label v-if="scope.opt.telefone" caption>{{ scope.opt.telefone }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-auto">
            <q-btn
              color="primary"
              icon="refresh"
              label="Actualizar"
              no-caps
              unelevated
              :loading="loading"
              @click="carregar"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-inner-loading :showing="loading" color="primary">
      <q-spinner-dots size="48px" color="primary" />
    </q-inner-loading>

    <!-- ——— PRIMEIRA PARTE (layout referência) ——— -->

    <q-banner
      v-if="avisoTotaisPlataforma"
      rounded
      class="stats-alert-banner q-mb-md"
      dense
    >
      <template v-slot:avatar>
        <q-icon name="info" color="warning" />
      </template>
      A API não devolveu totais da plataforma. Verifique o deploy do backend ou <code>VITE_API_URL</code>.
    </q-banner>

    <div v-if="alertaGlobalPlataforma && !loading" class="stats-alert-line q-mb-md">
      <q-icon name="notifications" size="20px" class="q-mr-sm text-warning" />
      <span class="text-body2">
        <strong>Atenção:</strong> {{ alertaGlobalPlataforma }}
      </span>
    </div>

    <!-- KPIs resumo (4 + métrica em falta) -->
    <div class="row q-col-gutter-md q-mb-md">
      <div
        v-for="kpi in kpisTopo"
        :key="kpi.key"
        class="col-12"
        :class="kpi.colClass"
      >
        <q-card flat bordered class="stats-kpi-card stats-kpi-card--compact">
          <q-card-section class="q-py-md">
            <div class="text-caption text-grey-7 text-uppercase stats-kpi-label">
              {{ kpi.label }}
            </div>
            <div class="text-h4 text-weight-bold q-mt-xs q-mb-xs" :class="kpi.valueClass">
              {{ kpi.value }}
            </div>
            <div class="text-caption" :class="kpi.hintClass">
              {{ kpi.hint }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="stats-section-title q-mb-md q-mt-lg">
      PERFORMANCE POR ANGARIADOR
    </div>

    <div v-if="!resultadosPerformance.length && !loading" class="q-mb-xl">
      <q-card flat bordered class="stats-panel-card">
        <q-card-section class="text-center text-grey-7 q-py-xl">
          <q-icon name="group_off" size="48px" color="grey-5" class="q-mb-md" />
          <div>Sem dados para o filtro seleccionado.</div>
        </q-card-section>
      </q-card>
    </div>

    <template v-else>
      <!-- Máx. 3 banners — um angariador por linha -->
      <div class="q-mb-lg">
        <div
          v-for="row in resultadosPerformance"
          :key="`banner-${chaveAngariador(row)}`"
          class="stats-alert-line q-mb-sm"
        >
          <q-icon name="notifications" size="20px" class="q-mr-sm text-warning" />
          <span class="text-body2">
            <strong>Atenção — {{ row.nome }}:</strong> {{ textoBannerAngariador(row) }}
          </span>
        </div>
      </div>

      <div class="row q-col-gutter-lg q-mb-xl">
        <div
          v-for="(row, idx) in resultadosPerformance"
          :key="`card-${chaveAngariador(row)}`"
          class="col-12 col-md-4"
        >
          <q-card
            flat
            bordered
            class="stats-person-card"
            :class="classeCartaoAngariador(row)"
          >
            <q-card-section>
              <div class="row items-center q-mb-lg no-wrap">
              <q-avatar
                size="52px"
                :color="avatarCorReferencia(idx)"
                text-color="white"
                class="text-weight-bold text-h6"
              >
                {{ iniciais(row.nome) }}
              </q-avatar>
              <div class="col q-pl-md">
                <div class="text-h6 text-weight-bold ellipsis">{{ row.nome }}</div>
                <div class="text-body2 text-grey-7 q-mt-xs">
                  Taxa: {{ row.taxa_conversao }}% · {{ etiquetaDesempenho(row) }}
                </div>
              </div>
            </div>

            <div class="stats-metric-list stats-metric-list--ref">
              <div class="stats-metric-row">
                <span>Leads angariados</span>
                <strong>{{ row.total_angariados }}</strong>
              </div>
              <div class="stats-metric-row">
                <span>Convertidos</span>
                <strong>{{ row.total_convertidos }}</strong>
              </div>
              <div class="stats-metric-row">
                <span>Pending ativos</span>
                <strong>{{ row.pending_activos }}</strong>
              </div>
              <div class="stats-metric-row">
                <span>Expirados</span>
                <strong>{{ row.pending_expirados }}</strong>
              </div>
            </div>

            <div class="q-mt-lg">
              <div class="row items-center text-caption text-grey-8 q-mb-xs">
                <span>Meta {{ rotuloMetaPeriodo }} conversão</span>
                <span class="q-ml-auto text-weight-medium">
                  {{ row.total_convertidos }}/{{ metasPeriodo.conv }}
                </span>
              </div>
              <q-linear-progress
                :value="progressoMeta(row.total_convertidos, metasPeriodo.conv)"
                rounded
                size="8px"
                :color="corBarraMeta(row.total_convertidos, metasPeriodo.conv)"
                track-color="grey-4"
              />
            </div>

            <div class="q-mt-md">
              <div class="row items-center text-caption text-grey-8 q-mb-xs">
                <span>Meta {{ rotuloMetaPeriodo }} leads</span>
                <span class="q-ml-auto text-weight-medium">
                  {{ row.total_angariados }}/{{ metasPeriodo.leads }}
                </span>
              </div>
              <q-linear-progress
                :value="progressoMeta(row.total_angariados, metasPeriodo.leads)"
                rounded
                size="8px"
                :color="corBarraMeta(row.total_angariados, metasPeriodo.leads)"
                track-color="grey-4"
              />
            </div>
          </q-card-section>
        </q-card>
        </div>
      </div>
    </template>

    <q-separator class="q-my-xl" />

    <div class="text-subtitle2 text-weight-bold text-grey-8 q-mb-sm section-label">
      Mais detalhes e exportação
    </div>

    <!-- Snapshot plataforma -->
    <div class="text-subtitle2 text-weight-bold text-grey-8 q-mb-sm section-label">
      Panorama da plataforma · {{ textoReferenciaTemporal }}
    </div>
    <div class="row q-col-gutter-md q-mb-xl">
      <div v-for="snap in snapshotsPlataforma" :key="snap.key" class="col-12 col-md-4">
        <q-card flat bordered class="stats-snap-card" :class="snap.cardClass">
          <q-card-section>
            <div class="text-caption text-grey-8">{{ snap.title }}</div>
            <div class="text-h5 text-weight-bold q-my-xs">{{ snap.leads }}</div>
            <div class="text-body2 text-grey-7">
              <span class="text-weight-medium text-positive">{{ snap.convertidos }}</span> convertidos
              <span class="q-mx-xs">·</span>
              <q-badge :color="snap.taxaColor" text-color="white" :label="`${snap.taxa}%`" />
            </div>
            <div class="text-caption text-grey-6 q-mt-sm">{{ snap.rotulo }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Mix de pacotes — barras agrupadas (top 4 angariadores) -->
    <q-card v-if="resultados.length" flat bordered class="stats-panel-card q-mb-xl">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold text-grey-9 q-mb-xs">
          Mix de pacotes vendidos — {{ tituloPeriodoGrafico }}
        </div>
        <div class="text-caption text-grey-7 q-mb-md">
          Top {{ mixPacotes.angariadores.length }} angariadores no período · barras agrupadas por pacote
        </div>
        <div v-if="chartTemDados" class="stats-chart-wrap stats-chart-wrap--mix">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
        <div v-else class="text-center text-grey-6 q-py-lg">
          Sem conversões com pacote identificado neste período.
        </div>
      </q-card-section>
    </q-card>

    <!-- Tabela detalhada -->
    <q-card flat bordered class="stats-panel-card">
      <q-card-section class="q-pb-none">
        <div class="text-subtitle1 text-weight-bold text-grey-9">
          Detalhe completo
        </div>
        <div class="text-caption text-grey-7">
          Ordenado por pontos e convertidos · exportável em CSV
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pa-none">
        <q-table
          :rows="resultados"
          :columns="columns"
          row-key="angariador_id"
          flat
          :pagination="{ rowsPerPage: 10, sortBy: 'total_pontos', descending: true }"
          class="stats-table"
        >
          <template v-slot:body-cell-nome="props">
            <q-td :props="props">
              <div class="row items-center no-wrap">
                <q-avatar size="32px" :color="avatarCor(props.rowIndex)" text-color="white" class="q-mr-sm">
                  <span class="text-caption text-weight-bold">{{ iniciais(props.row.nome) }}</span>
                </q-avatar>
                <div>
                  <div class="text-weight-medium">{{ props.row.nome }}</div>
                  <div class="text-caption text-grey-6">{{ props.row.telefone || '—' }}</div>
                </div>
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-total_pontos="props">
            <q-td :props="props">
              <span class="text-weight-bold text-primary">{{ props.value }}</span>
            </q-td>
          </template>
          <template v-slot:body-cell-taxa_conversao="props">
            <q-td :props="props">
              <q-chip dense :color="corTaxa(props.value)" text-color="white">
                {{ props.value }}%
              </q-chip>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import {
  format,
  startOfISOWeek,
  endOfISOWeek,
  getISOWeek,
  getISOWeekYear,
} from 'date-fns'
import { pt } from 'date-fns/locale'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const AVATAR_CORES = ['primary', 'secondary', 'info', 'accent', 'positive', 'warning']
const AVATAR_CORES_REF = ['positive', 'info', 'warning']

const METAS_POR_PERIODO = {
  dia: { conv: 3, leads: 5 },
  semana: { conv: 25, leads: 30 },
  mes: { conv: 80, leads: 100 },
}

function fromYMD(ymd) {
  const parts = String(ymd || '').split('-').map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return new Date(NaN)
  const [y, m, d] = parts
  return new Date(y, m - 1, d)
}

function iniciais(nome) {
  const parts = String(nome || '?').trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return (parts[0] || '?').slice(0, 2).toUpperCase()
}

const MAX_CARTOES_PERFORMANCE = 3
const MAX_ANGARIADORES_GRAFICO = 4

const CHART_CORES_ANGARIADOR = [
  'rgba(25, 118, 210, 0.88)',
  'rgba(38, 166, 154, 0.88)',
  'rgba(255, 152, 0, 0.88)',
  'rgba(156, 39, 176, 0.88)',
]

const PACOTES_LABELS_FALLBACK = [
  'Básico',
  'Pro-Max',
  'Profissional',
  'Teóricas',
  'Práticas L.',
  'Práticas P.',
]

function chaveAngariador(row) {
  const id = row?.angariador_id ?? row?.id
  if (id != null && id !== '') return String(id)
  const nome = String(row?.nome || '').trim().toLowerCase()
  const user = String(row?.username || '').trim().toLowerCase()
  return `n:${nome}|u:${user}`
}

function deduplicarResultados(rows) {
  if (!Array.isArray(rows)) return []
  const byKey = new Map()
  for (const row of rows) {
    const key = chaveAngariador(row)
    const normalizado = {
      ...row,
      angariador_id: row.angariador_id ?? row.id ?? null,
    }
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, normalizado)
      continue
    }
    if ((normalizado.total_pontos || 0) > (existing.total_pontos || 0)) {
      byKey.set(key, normalizado)
    }
  }
  return Array.from(byKey.values())
}

export default {
  name: 'AngariadoresStatsPage',
  components: { Bar },
  setup() {
    const $q = useQuasar()
    const now = new Date()
    const periodo = ref('mes')
    const mes = ref(now.getMonth() + 1)
    const ano = ref(now.getFullYear())
    const hojeIso = format(now, 'yyyy-MM-dd')
    const dataDiaPicker = ref(hojeIso)
    const dataSemanaPicker = ref(hojeIso)
    const q = ref('')
    const angariadorSeleccionado = ref(null)
    const angariadorOptions = ref([])
    const angariadorSearchLoading = ref(false)
    const loading = ref(false)
    const resumo = ref({})
    const totaisPlataforma = ref({})
    const resultadoStatsOk = ref(false)
    const resultados = ref([])
    const mixPacotes = ref({ pacotes: [], angariadores: [] })
    const mesNome = ref('')

    const avisoTotaisPlataforma = computed(() => {
      if (loading.value || !resultadoStatsOk.value) return false
      const tp = totaisPlataforma.value
      return !tp?.referencia_data || !tp?.hoje
    })

    const textoReferenciaTemporal = computed(() => {
      const r = totaisPlataforma.value?.referencia_data
      if (!r) return '—'
      const d = fromYMD(r)
      if (Number.isNaN(d.getTime())) return r
      return format(d, "d 'de' MMMM 'de' yyyy", { locale: pt })
    })

    const intervaloSemanaPlataforma = computed(() => {
      const s = totaisPlataforma.value?.semana_actual?.data_inicio
      const e = totaisPlataforma.value?.semana_actual?.data_fim
      if (!s || !e) return ''
      const ds = fromYMD(s)
      const de = fromYMD(e)
      if (Number.isNaN(ds.getTime()) || Number.isNaN(de.getTime())) return `${s} – ${e}`
      return `${format(ds, 'd MMM', { locale: pt })} – ${format(de, 'd MMM yyyy', { locale: pt })}`
    })

    const dataDiaDisplay = computed(() => {
      const d = fromYMD(dataDiaPicker.value)
      if (Number.isNaN(d.getTime())) return ''
      return format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })
    })

    const dataSemanaDisplay = computed(() => {
      const d = fromYMD(dataSemanaPicker.value)
      if (Number.isNaN(d.getTime())) return ''
      return format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })
    })

    const intervaloSemanaHint = computed(() => {
      const d = fromYMD(dataSemanaPicker.value)
      if (Number.isNaN(d.getTime())) return ''
      const s = startOfISOWeek(d)
      const e = endOfISOWeek(d)
      const w = getISOWeek(d)
      const yIso = getISOWeekYear(d)
      return `Semana ISO ${w}/${yIso} · ${format(s, 'd MMM', { locale: pt })} – ${format(e, 'd MMM yyyy', { locale: pt })}`
    })

    const tituloResultados = computed(() => {
      if (periodo.value === 'mes') {
        if (mesNome.value) return `${mesNome.value} / ${ano.value}`
        const d = new Date(ano.value, mes.value - 1, 1)
        if (Number.isNaN(d.getTime())) return '—'
        return format(d, 'MMMM yyyy', { locale: pt })
      }
      if (periodo.value === 'dia') return dataDiaDisplay.value || '—'
      return intervaloSemanaHint.value || '—'
    })

    const resultadosOrdenados = computed(() => {
      return [...resultados.value].sort((a, b) => {
        if (b.total_pontos !== a.total_pontos) return b.total_pontos - a.total_pontos
        return b.total_convertidos - a.total_convertidos
      })
    })

    /** Top 3 angariadores na secção performance (sem repetir o mesmo nome/ID). */
    const resultadosPerformance = computed(() => {
      return resultadosOrdenados.value.slice(0, MAX_CARTOES_PERFORMANCE)
    })

    const maxAngariados = computed(() => {
      const vals = resultados.value.map((r) => r.total_angariados || 0)
      return Math.max(...vals, 1)
    })

    const tituloPeriodoGrafico = computed(() => {
      if (periodo.value === 'dia') return 'dia'
      if (periodo.value === 'semana') return 'semana'
      return 'mês'
    })

    const chartTemDados = computed(() => {
      const angs = mixPacotes.value.angariadores || []
      return angs.some((a) => (a.valores || []).some((v) => v > 0))
    })

    const chartData = computed(() => {
      const mix = mixPacotes.value
      const labels = mix.pacotes?.length ? mix.pacotes : PACOTES_LABELS_FALLBACK
      const angs = mix.angariadores || []
      return {
        labels,
        datasets: angs.map((ang, i) => {
          const nome = ang.nome || `Angariador ${i + 1}`
          return {
            label: nome.length > 18 ? `${nome.slice(0, 16)}…` : nome,
            data: labels.map((_, idx) => (ang.valores || [])[idx] ?? 0),
            backgroundColor: CHART_CORES_ANGARIADOR[i % CHART_CORES_ANGARIADOR.length],
            borderRadius: 6,
            maxBarThickness: 40,
          }
        }),
      }
    })

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'start',
          labels: { boxWidth: 14, padding: 16 },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 0, stepSize: 1 },
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
      },
    }

    const metasPeriodo = computed(() => {
      return METAS_POR_PERIODO[periodo.value] || METAS_POR_PERIODO.mes
    })

    const rotuloMetaPeriodo = computed(() => {
      if (periodo.value === 'dia') return 'diária'
      if (periodo.value === 'semana') return 'semanal'
      return 'mensal'
    })

    const formatReceitaEstimada = (pontos) => {
      const mzn = (pontos || 0) * 50
      if (mzn >= 1000) return `${(mzn / 1000).toFixed(1)}K`
      return String(mzn)
    }

    const kpisTopo = computed(() => {
      const r = resumo.value
      const taxa = r.taxa_conversao_global ?? 0
      const exp = r.pending_expirados ?? 0
      const ang = r.total_angariados ?? 0
      const pctExp = ang > 0 ? ((exp / ang) * 100).toFixed(1) : '0'
      const pontos = r.total_pontos ?? 0
      return [
        {
          key: 'leads',
          label: 'Leads novos',
          value: ang,
          hint: `${r.total_angariadores ?? 0} angariador(es) no período`,
          hintClass: 'text-grey-7',
          valueClass: 'text-grey-9',
          colClass: 'col-sm-6 col-md-3',
        },
        {
          key: 'conv',
          label: 'Total convertidos',
          value: r.total_convertidos ?? 0,
          hint: `${taxa}% taxa global`,
          hintClass: taxa >= 30 ? 'text-positive' : 'text-warning',
          valueClass: 'text-grey-9',
          colClass: 'col-sm-6 col-md-3',
        },
        {
          key: 'receita',
          label: 'Receita estimada',
          value: formatReceitaEstimada(pontos),
          hint: 'MZN · via pontos (estimativa)',
          hintClass: 'text-grey-7',
          valueClass: 'text-grey-9',
          colClass: 'col-sm-6 col-md-3',
        },
        {
          key: 'exp',
          label: 'Leads expirados',
          value: exp,
          hint: ang ? `${pctExp}% do total` : '—',
          hintClass: exp > 0 ? 'text-negative' : 'text-grey-7',
          valueClass: exp > 0 ? 'text-negative' : 'text-grey-9',
          colClass: 'col-sm-6 col-md-3',
        },
        {
          key: 'chamadas',
          label: 'Chamadas registadas',
          value: '—',
          hint: 'Métrica em falta',
          hintClass: 'text-negative',
          valueClass: 'text-grey-6',
          colClass: 'col-12 col-md-4',
        },
      ]
    })

    const alertaGlobalPlataforma = computed(() => {
      const taxaGlobal = resumo.value.taxa_conversao_global ?? 0
      const ang = resumo.value.total_angariados ?? 0
      const pend = resumo.value.pending_activos ?? 0
      const conv = resumo.value.total_convertidos ?? 0
      if (taxaGlobal < 25 && ang >= 5) {
        return `taxa global de conversão baixa (${taxaGlobal}%) no período.`
      }
      if (pend > conv * 2 && conv > 0) {
        return 'há muitos pending activos face aos convertidos na plataforma.'
      }
      return ''
    })

    function pctMetaConversao(row) {
      const metaConv = metasPeriodo.value.conv
      if (!metaConv) return 0
      return Math.round(((row.total_convertidos || 0) / metaConv) * 100)
    }

    /** Uma única mensagem de atenção por angariador (só quando há algo a rever). */
    function alertaAngariador(row) {
      const pct = pctMetaConversao(row)
      if (
        (row.total_angariados || 0) >= 3 &&
        pct < 50 &&
        (row.taxa_conversao || 0) < 40
      ) {
        return `A ${pct}% da meta ${rotuloMetaPeriodo.value} de conversão.`
      }
      if ((row.pending_expirados || 0) >= 5) {
        return `${row.pending_expirados} leads expirados — rever follow-up.`
      }
      if ((row.pending_activos || 0) >= 5) {
        return `${row.pending_activos} pending activos — priorizar contacto.`
      }
      if (
        (row.total_angariados || 0) >= 2 &&
        etiquetaDesempenho(row) === 'Abaixo meta'
      ) {
        return `Taxa ${row.taxa_conversao}% — abaixo da meta do período.`
      }
      return ''
    }

    function textoBannerAngariador(row) {
      const alerta = alertaAngariador(row)
      if (alerta) return alerta
      return `Taxa ${row.taxa_conversao}% · ${row.total_convertidos} convertidos · ${row.total_angariados} leads angariados.`
    }

    const snapshotsPlataforma = computed(() => {
      const tp = totaisPlataforma.value
      const mk = (bloco, title, cardClass) => {
        if (!bloco) {
          return { title, leads: '—', convertidos: 0, taxa: 0, taxaColor: 'grey-6', rotulo: '', cardClass }
        }
        const taxa = bloco.taxa_conversao ?? 0
        return {
          title,
          leads: bloco.total_angariados ?? 0,
          convertidos: bloco.total_convertidos ?? 0,
          taxa,
          taxaColor: corTaxa(taxa),
          rotulo: bloco.rotulo || '',
          cardClass,
        }
      }
      return [
        { key: 'hoje', ...mk(tp.hoje, 'Hoje', 'stats-snap-card--primary') },
        { key: 'sem', ...mk(tp.semana_actual, 'Semana actual (ISO)', 'stats-snap-card--secondary') },
        { key: 'mes', ...mk(tp.mes_actual, 'Mês corrente', 'stats-snap-card--accent') },
      ]
    })

    function corTaxa(taxa) {
      if (taxa >= 50) return 'positive'
      if (taxa >= 20) return 'warning'
      return 'negative'
    }

    function avatarCor(idx) {
      return AVATAR_CORES[idx % AVATAR_CORES.length]
    }

    function avatarCorReferencia(idx) {
      return AVATAR_CORES_REF[idx % AVATAR_CORES_REF.length]
    }

    function progressoMeta(actual, meta) {
      if (!meta) return 0
      return Math.min((actual || 0) / meta, 1)
    }

    function corBarraMeta(actual, meta) {
      const p = progressoMeta(actual, meta)
      if (p >= 1) return 'positive'
      if (p >= 0.5) return 'warning'
      return 'negative'
    }

    function classeCartaoAngariador(row) {
      const classes = []
      if (etiquetaDesempenho(row) === 'Destaque') {
        classes.push('stats-person-card--highlight')
      }
      if (etiquetaDesempenho(row) === 'Abaixo meta') {
        classes.push('stats-person-card--at-risk')
      }
      return classes
    }

    function etiquetaDesempenho(row) {
      const convMeta = progressoMeta(
        row.total_convertidos,
        metasPeriodo.value.conv
      )
      if (row.taxa_conversao >= 55 || convMeta >= 1) return 'Destaque'
      if (row.taxa_conversao >= 40 || convMeta >= 0.5) return 'Na meta'
      if (row.total_angariados < 2) return 'Pouco volume'
      return 'Abaixo meta'
    }

    const filtrarAngariadores = (val, update) => {
      const termo = (val || '').trim()
      q.value = termo
      angariadorSeleccionado.value = null
      if (termo.length < 2) {
        update(() => {
          angariadorOptions.value = []
        })
        return
      }
      angariadorSearchLoading.value = true
      api
        .get('/angariadores/admin/search/', { params: { q: termo } })
        .then((resp) => {
          const lista = Array.isArray(resp.data) ? resp.data : []
          update(() => {
            angariadorOptions.value = lista
          })
        })
        .catch(() => {
          update(() => {
            angariadorOptions.value = []
          })
        })
        .finally(() => {
          angariadorSearchLoading.value = false
        })
    }

    const onAngariadorSeleccionado = (opt) => {
      if (!opt) return
      q.value = opt.label || ''
      carregar()
    }

    const onAngariadorLimpo = () => {
      angariadorSeleccionado.value = null
      q.value = ''
      angariadorOptions.value = []
    }

    function buildQueryParams() {
      const base = {
        periodo: periodo.value,
        q: angariadorSeleccionado.value ? undefined : (q.value || undefined),
        angariador_id: angariadorSeleccionado.value?.id || undefined,
      }
      if (periodo.value === 'mes') {
        return { ...base, mes: mes.value, ano: ano.value }
      }
      if (periodo.value === 'dia') {
        return { ...base, data: dataDiaPicker.value }
      }
      const d = fromYMD(dataSemanaPicker.value)
      if (Number.isNaN(d.getTime())) return base
      const inicio = startOfISOWeek(d)
      const fim = endOfISOWeek(d)
      return {
        ...base,
        semana: getISOWeek(d),
        ano: getISOWeekYear(d),
        data_inicio: format(inicio, 'yyyy-MM-dd'),
        data_fim: format(fim, 'yyyy-MM-dd'),
      }
    }

    function nomeFicheiroCsv() {
      if (periodo.value === 'mes') {
        return `angariadores-stats-${ano.value}-${String(mes.value).padStart(2, '0')}.csv`
      }
      if (periodo.value === 'dia') {
        return `angariadores-stats-dia-${dataDiaPicker.value}.csv`
      }
      const d = fromYMD(dataSemanaPicker.value)
      if (!Number.isNaN(d.getTime())) {
        const w = getISOWeek(d)
        const yIso = getISOWeekYear(d)
        return `angariadores-stats-semana-${yIso}-W${String(w).padStart(2, '0')}.csv`
      }
      return 'angariadores-stats.csv'
    }

    const columns = [
      { name: 'nome', label: 'Angariador', field: 'nome', align: 'left', sortable: true },
      { name: 'username', label: 'Username', field: 'username', align: 'left', sortable: true },
      { name: 'total_angariados', label: 'Angariados', field: 'total_angariados', align: 'right', sortable: true },
      { name: 'total_convertidos', label: 'Convertidos', field: 'total_convertidos', align: 'right', sortable: true },
      { name: 'pending_activos', label: 'Pending', field: 'pending_activos', align: 'right', sortable: true },
      { name: 'pending_expirados', label: 'Expirados', field: 'pending_expirados', align: 'right', sortable: true },
      { name: 'total_pontos', label: 'Pontos', field: 'total_pontos', align: 'right', sortable: true },
      { name: 'taxa_conversao', label: 'Taxa', field: 'taxa_conversao', align: 'center', sortable: true },
    ]

    const carregar = async () => {
      loading.value = true
      resultadoStatsOk.value = false
      try {
        const resp = await api.get('/angariadores/admin/stats/', {
          params: buildQueryParams(),
        })
        const body = resp.data || {}
        resumo.value = body.resumo || {}
        const tp = body.totais_plataforma || body.totaisPlataforma || {}
        totaisPlataforma.value = typeof tp === 'object' && tp !== null ? { ...tp } : {}
        resultados.value = deduplicarResultados(body.resultados || [])
        const mix = body.mix_pacotes || body.mixPacotes || {}
        mixPacotes.value = {
          pacotes: mix.pacotes || PACOTES_LABELS_FALLBACK,
          angariadores: (mix.angariadores || []).slice(0, MAX_ANGARIADORES_GRAFICO),
        }
        mesNome.value = body.mes_nome || ''
        resultadoStatsOk.value = true
      } catch (err) {
        $q.notify({
          type: 'negative',
          message: err.response?.data?.error || 'Erro ao carregar estatísticas de angariadores',
        })
      } finally {
        loading.value = false
      }
    }

    const csvEscape = (value) => {
      if (value === null || value === undefined) return ''
      const text = String(value).replace(/"/g, '""')
      return `"${text}"`
    }

    const exportarCsv = () => {
      if (!resultados.value.length) return

      const header = [
        'angariador_id',
        'nome',
        'username',
        'telefone',
        'mes',
        'ano',
        'mes_nome',
        'total_angariados',
        'total_convertidos',
        'pending_activos',
        'pending_expirados',
        'total_pontos',
        'taxa_conversao',
      ]

      const lines = []
      lines.push(['Resumo', '', '', '', '', '', '', '', '', '', '', '', ''].map(csvEscape).join(','))
      lines.push(['total_angariadores', resumo.value.total_angariadores || 0].map(csvEscape).join(','))
      lines.push(['total_angariados', resumo.value.total_angariados || 0].map(csvEscape).join(','))
      lines.push(['total_convertidos', resumo.value.total_convertidos || 0].map(csvEscape).join(','))
      lines.push(['total_pontos', resumo.value.total_pontos || 0].map(csvEscape).join(','))
      lines.push(['pending_activos', resumo.value.pending_activos || 0].map(csvEscape).join(','))
      lines.push(['pending_expirados', resumo.value.pending_expirados || 0].map(csvEscape).join(','))
      lines.push(['taxa_conversao_global', resumo.value.taxa_conversao_global || 0].map(csvEscape).join(','))
      lines.push('')
      lines.push(header.map(csvEscape).join(','))

      resultados.value.forEach((row) => {
        lines.push(
          [
            row.angariador_id,
            row.nome,
            row.username,
            row.telefone,
            row.mes,
            row.ano,
            row.mes_nome,
            row.total_angariados,
            row.total_convertidos,
            row.pending_activos,
            row.pending_expirados,
            row.total_pontos,
            row.taxa_conversao,
          ]
            .map(csvEscape)
            .join(',')
        )
      })

      const csvContent = '\uFEFF' + lines.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = nomeFicheiroCsv()
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    watch(periodo, () => {
      carregar()
    })

    onMounted(carregar)

    return {
      periodo,
      mes,
      ano,
      dataDiaPicker,
      dataSemanaPicker,
      dataDiaDisplay,
      dataSemanaDisplay,
      intervaloSemanaHint,
      tituloResultados,
      angariadorSeleccionado,
      angariadorOptions,
      angariadorSearchLoading,
      filtrarAngariadores,
      onAngariadorSeleccionado,
      onAngariadorLimpo,
      loading,
      avisoTotaisPlataforma,
      resumo,
      totaisPlataforma,
      textoReferenciaTemporal,
      intervaloSemanaPlataforma,
      resultados,
      resultadosOrdenados,
      resultadosPerformance,
      chaveAngariador,
      textoBannerAngariador,
      maxAngariados,
      mixPacotes,
      tituloPeriodoGrafico,
      chartTemDados,
      chartData,
      chartOptions,
      kpisTopo,
      metasPeriodo,
      rotuloMetaPeriodo,
      alertaGlobalPlataforma,
      alertaAngariador,
      snapshotsPlataforma,
      iniciais,
      corTaxa,
      avatarCor,
      avatarCorReferencia,
      progressoMeta,
      corBarraMeta,
      classeCartaoAngariador,
      etiquetaDesempenho,
      mesNome,
      columns,
      carregar,
      exportarCsv,
    }
  },
}
</script>

<style lang="scss" scoped>
.ang-stats-page {
  background: #f5f5f5;
  min-height: 100%;
}

.section-label {
  letter-spacing: 0.04em;
}

.stats-panel-card {
  background: #fff;
  border-radius: 12px;
  border-color: rgba(0, 0, 0, 0.08);
}

.stats-alert-banner {
  background: #fff8e1;
  border: 1px solid #ffe082;
  color: #5d4037;
}

.stats-alert-line {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  background: #faf6f0;
  border: 1px solid #e8dcc8;
  border-radius: 10px;
  color: #5d4037;

  &--ok {
    background: #f1f8e9;
    border-color: #c8e6c9;
    color: #33691e;
  }
}

.stats-section-title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #616161;
}

.stats-kpi-card {
  background: #fff;
  border-radius: 12px;
  border-color: rgba(0, 0, 0, 0.08);
  height: 100%;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(25, 118, 210, 0.12);
  }

  &--compact .stats-kpi-label {
    letter-spacing: 0.06em;
  }
}

.stats-snap-card {
  background: #fff;
  border-radius: 12px;
  height: 100%;
  border-left: 4px solid #bdbdbd;

  &--primary {
    border-left-color: #1976d2;
  }

  &--secondary {
    border-left-color: #26a69a;
  }

  &--accent {
    border-left-color: #9c27b0;
  }
}

.stats-chart-wrap {
  position: relative;
  height: 280px;
  width: 100%;

  &--mix {
    height: 320px;
  }
}

.stats-person-card {
  background: #fff;
  border-radius: 12px;
  height: 100%;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  }

  &--highlight {
    border-color: #26a69a;
    box-shadow: 0 4px 14px rgba(38, 166, 154, 0.2);
  }

  &--at-risk {
    border-color: #ffb74d;
    box-shadow: 0 2px 10px rgba(255, 152, 0, 0.15);
  }
}

.stats-metric-list--ref .stats-metric-row {
  border-bottom: none;
  padding: 6px 0;
}

.stats-person-alert {
  display: flex;
  align-items: flex-start;
  padding: 8px 10px;
  border-radius: 8px;
  line-height: 1.35;

  &--warn {
    background: #fff8e1;
    border: 1px solid #ffe082;
    color: #5d4037;
  }

  &--ok {
    background: #f1f8e9;
    border: 1px solid #c8e6c9;
    color: #33691e;
  }

  &--muted {
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    color: #616161;
  }
}

.stats-metric-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stats-metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #616161;
  padding: 4px 0;
  border-bottom: 1px dashed #eeeeee;

  &:last-child {
    border-bottom: none;
  }

  strong {
    color: #212121;
  }
}

.stats-table :deep(thead tr th) {
  background: #e8f5e9;
  color: #1b5e20;
  font-weight: 600;
}

.stats-table :deep(tbody tr:hover) {
  background: #f1f8e9;
}
</style>
