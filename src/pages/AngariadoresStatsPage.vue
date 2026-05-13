<template>
  <q-page class="q-pa-lg bg-grey-1">
    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-4">
        <div class="text-h5 text-weight-bold">
          Estatísticas de Angariadores
        </div>
        <div class="text-caption text-grey-7">
          Visão global por angariador no mês selecionado
        </div>
      </div>
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
      <div class="col-12 col-md-3">
        <q-input
          v-model="q"
          outlined
          dense
          clearable
          label="Pesquisar angariador"
          placeholder="Nome, username ou telefone"
          @keyup.enter="carregar"
        />
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
          Resultados de {{ mesNome }} / {{ ano }}
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
import { ref, onMounted } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'

export default {
  name: 'AngariadoresStatsPage',
  setup() {
    const $q = useQuasar()
    const now = new Date()
    const mes = ref(now.getMonth() + 1)
    const ano = ref(now.getFullYear())
    const q = ref('')
    const loading = ref(false)
    const resumo = ref({})
    const resultados = ref([])
    const mesNome = ref('')

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
      try {
        const resp = await api.get('/angariadores/admin/stats/', {
          params: { mes: mes.value, ano: ano.value, q: q.value || undefined }
        })
        resumo.value = resp.data?.resumo || {}
        resultados.value = resp.data?.resultados || []
        mesNome.value = resp.data?.mes_nome || ''
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
      link.download = `angariadores-stats-${ano.value}-${String(mes.value).padStart(2, '0')}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    onMounted(carregar)

    return {
      mes,
      ano,
      q,
      loading,
      resumo,
      resultados,
      mesNome,
      columns,
      carregar,
      exportarCsv
    }
  }
}
</script>
