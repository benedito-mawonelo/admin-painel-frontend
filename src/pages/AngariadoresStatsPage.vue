<template>
  <q-page class="q-pa-lg bg-grey-1">
    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-4">
        <div class="text-h5 text-weight-bold">
          Estatísticas de Angariadores
        </div>
        <div class="text-caption text-grey-7">
          Visão global por angariador no período selecionado (dia, semana ou mês)
        </div>
      </div>
      <div class="col-12 col-md-8">
        <q-btn-toggle
          v-model="periodo"
          spread
          no-caps
          unelevated
          toggle-color="primary"
          color="grey-4"
          text-color="grey-9"
          :options="[
            { label: 'Dia', value: 'dia' },
            { label: 'Semana', value: 'semana' },
            { label: 'Mês', value: 'mes' }
          ]"
        />
      </div>
      <template v-if="periodo === 'mes'">
        <div class="col-12 col-md-2">
          <q-input
            v-model.number="mes"
            type="number"
            min="1"
            max="12"
            outlined
            label="Mês"
            dense
          />
        </div>
        <div class="col-12 col-md-2">
          <q-input
            v-model.number="ano"
            type="number"
            min="2000"
            max="2100"
            outlined
            label="Ano"
            dense
          />
        </div>
      </template>
      <template v-else-if="periodo === 'dia'">
        <div class="col-12 col-md-4">
          <q-input
            v-model="dataDiaDisplay"
            outlined
            dense
            readonly
            label="Dia"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="dataDiaPicker" mask="YYYY-MM-DD" minimal>
                    <div class="row items-center justify-end q-gutter-sm">
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
        <div class="col-12 col-md-4">
          <q-input
            v-model="dataSemanaDisplay"
            outlined
            dense
            readonly
            label="Qualquer dia da semana"
            :hint="intervaloSemanaHint"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="dataSemanaPicker" mask="YYYY-MM-DD" minimal>
                    <div class="row items-center justify-end q-gutter-sm">
                      <q-btn v-close-popup label="Fechar" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>
      </template>
      <div class="col-12 col-md-3">
        <q-select
          v-model="angariadorSeleccionado"
          outlined
          dense
          clearable
          use-input
          fill-input
          hide-selected
          input-debounce="300"
          label="Pesquisar angariador"
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
              <q-item-section class="text-grey">
                Digite pelo menos 2 caracteres…
              </q-item-section>
            </q-item>
          </template>
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
                <q-item-label v-if="scope.opt.telefone" caption>
                  {{ scope.opt.telefone }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
      <div class="col-12 col-md-1">
        <q-btn
          color="primary"
          icon="search"
          class="full-width"
          :loading="loading"
          @click="carregar"
        />
      </div>
      <div class="col-12 col-md-12">
        <q-btn
          outline
          color="secondary"
          icon="download"
          label="Exportar CSV"
          no-caps
          :disable="!resultados.length"
          @click="exportarCsv"
        />
      </div>
    </div>

    <q-banner
      v-if="avisoTotaisPlataforma"
      rounded
      class="bg-amber-2 text-grey-9 q-mb-md"
      dense
    >
      <template v-slot:avatar>
        <q-icon name="info" color="amber-9" />
      </template>
      A API não devolveu <code>totais_plataforma</code> (resposta de backend antigo ou URL errada).
      Faça <strong>deploy do backend</strong> com a versão actual ou defina <code>VITE_API_URL</code> no painel para apontar para esse servidor.
    </q-banner>

    <div class="text-subtitle2 text-grey-8 q-mb-sm">
      Totais da plataforma (dia / semana / mês correntes · {{ textoReferenciaTemporal }})
    </div>
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-4">
        <q-card flat bordered class="bg-blue-1">
          <q-card-section>
            <div class="text-caption text-grey-8">Angariados hoje</div>
            <div class="text-h5 text-weight-bold">{{ totaisPlataforma.hoje?.total_angariados ?? '—' }}</div>
            <div class="text-caption text-grey-7 q-mt-xs">
              {{ totaisPlataforma.hoje?.rotulo || '' }}
              · {{ totaisPlataforma.hoje?.total_convertidos ?? 0 }} convertidos ({{ totaisPlataforma.hoje?.taxa_conversao ?? 0 }}%)
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-4">
        <q-card flat bordered class="bg-teal-1">
          <q-card-section>
            <div class="text-caption text-grey-8">Angariados na semana (ISO)</div>
            <div class="text-h5 text-weight-bold">{{ totaisPlataforma.semana_actual?.total_angariados ?? '—' }}</div>
            <div class="text-caption text-grey-7 q-mt-xs">
              {{ totaisPlataforma.semana_actual?.rotulo || '' }}
              · {{ intervaloSemanaPlataforma }}
            </div>
            <div class="text-caption text-grey-7">
              {{ totaisPlataforma.semana_actual?.total_convertidos ?? 0 }} convertidos ({{ totaisPlataforma.semana_actual?.taxa_conversao ?? 0 }}%)
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-4">
        <q-card flat bordered class="bg-amber-1">
          <q-card-section>
            <div class="text-caption text-grey-8">Angariados no mês corrente</div>
            <div class="text-h5 text-weight-bold">{{ totaisPlataforma.mes_actual?.total_angariados ?? '—' }}</div>
            <div class="text-caption text-grey-7 q-mt-xs">
              {{ totaisPlataforma.mes_actual?.rotulo || '' }}
              · {{ totaisPlataforma.mes_actual?.total_convertidos ?? 0 }} convertidos ({{ totaisPlataforma.mes_actual?.taxa_conversao ?? 0 }}%)
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="text-subtitle2 text-grey-8 q-mb-sm">
      Resumo da consulta seleccionada (filtros · {{ tituloResultados }})
    </div>
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7">Total Angariadores</div>
            <div class="text-h6 text-weight-bold">{{ resumo.total_angariadores || 0 }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7">Total Angariados</div>
            <div class="text-h6 text-weight-bold">{{ resumo.total_angariados || 0 }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7">Total Convertidos</div>
            <div class="text-h6 text-weight-bold text-positive">{{ resumo.total_convertidos || 0 }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7">Taxa Global</div>
            <div class="text-h6 text-weight-bold">{{ resumo.taxa_conversao_global || 0 }}%</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card flat bordered>
      <q-card-section class="q-pb-none">
        <div class="text-subtitle1 text-weight-medium">
          Resultados · {{ tituloResultados }}
        </div>
      </q-card-section>
      <q-card-section>
        <q-table
          :rows="resultados"
          :columns="columns"
          row-key="angariador_id"
          :loading="loading"
          flat
          bordered
          :pagination="{ rowsPerPage: 15 }"
        >
          <template v-slot:body-cell-total_pontos="props">
            <q-td :props="props">
              <span class="text-weight-bold text-primary">{{ props.value }}</span>
            </q-td>
          </template>
          <template v-slot:body-cell-taxa_conversao="props">
            <q-td :props="props">
              <q-chip
                dense
                :color="props.value >= 50 ? 'positive' : props.value >= 20 ? 'warning' : 'grey-6'"
                text-color="white"
              >
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

function fromYMD(ymd) {
  const parts = String(ymd || '').split('-').map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return new Date(NaN)
  const [y, m, d] = parts
  return new Date(y, m - 1, d)
}

export default {
  name: 'AngariadoresStatsPage',
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
      return `Semana ISO ${w} de ${yIso} · ${format(s, 'd MMM', { locale: pt })} – ${format(e, 'd MMM yyyy', { locale: pt })}`
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
      { name: 'nome', label: 'Nome', field: 'nome', align: 'left', sortable: true },
      { name: 'username', label: 'Username', field: 'username', align: 'left', sortable: true },
      { name: 'telefone', label: 'Telefone', field: 'telefone', align: 'left', sortable: true },
      { name: 'total_angariados', label: 'Angariados', field: 'total_angariados', align: 'right', sortable: true },
      { name: 'total_convertidos', label: 'Convertidos', field: 'total_convertidos', align: 'right', sortable: true },
      { name: 'pending_activos', label: 'Pending ativos', field: 'pending_activos', align: 'right', sortable: true },
      { name: 'pending_expirados', label: 'Pending expirados', field: 'pending_expirados', align: 'right', sortable: true },
      { name: 'total_pontos', label: 'Pontos', field: 'total_pontos', align: 'right', sortable: true },
      { name: 'taxa_conversao', label: 'Taxa', field: 'taxa_conversao', align: 'center', sortable: true }
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
        const tp =
          body.totais_plataforma ||
          body.totaisPlataforma ||
          {}
        totaisPlataforma.value = typeof tp === 'object' && tp !== null ? { ...tp } : {}
        resultados.value = body.resultados || []
        mesNome.value = body.mes_nome || ''
        resultadoStatsOk.value = true
      } catch (err) {
        $q.notify({
          type: 'negative',
          message: err.response?.data?.error || 'Erro ao carregar estatísticas de angariadores'
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
        'taxa_conversao'
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
        lines.push([
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
          row.taxa_conversao
        ].map(csvEscape).join(','))
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
      q,
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
      mesNome,
      columns,
      carregar,
      exportarCsv,
    }
  }
}
</script>
