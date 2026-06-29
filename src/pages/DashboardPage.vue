<template>
  <q-page class="dashboard-page">
    <div class="row justify-between items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 text-weight-bold text-white">Painel</h1>
        <p class="text-subtitle1 text-grey-4">Visão geral operacional do painel administrativo</p>
      </div>
      <div class="col-auto">
        <q-btn-dropdown
          color="accent"
          :label="periodLabel"
          class="date-filter"
          menu-anchor="bottom right"
          menu-self="top right"
        >
          <q-list>
            <q-item clickable v-close-popup @click="setPeriod('all')">
              <q-item-section>Tempo real (tudo)</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="setPeriod('today')">
              <q-item-section>Hoje</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="setPeriod('week')">
              <q-item-section>Últimos 7 dias</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="setPeriod('month')">
              <q-item-section>Este mês</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </div>

    <q-banner v-if="loadError" dense rounded class="bg-negative text-white q-mb-md">
      {{ loadError }}
    </q-banner>

    <div class="row q-col-gutter-lg q-mb-lg">
      <div class="col-12 col-md-3">
        <stat-card
          icon="people"
          title="Total de Usuários"
          :value="formatCount(dashboardStats.totalUsers)"
          :trend="periodTrendLabel"
          :is-positive="true"
          color="primary"
        />
      </div>
      <div class="col-12 col-md-3">
        <stat-card
          icon="person_search"
          title="Sem Pagamento"
          :value="formatCount(dashboardStats.unpaidUsers)"
          trend="necessita acompanhamento"
          :is-positive="false"
          color="secondary"
        />
      </div>
      <div class="col-12 col-md-3">
        <stat-card
          icon="payments"
          title="Pagamentos Validados"
          :value="formatCount(dashboardStats.validatedPayments)"
          trend="vinculados no painel"
          :is-positive="true"
          color="accent"
        />
      </div>
      <div class="col-12 col-md-3">
        <stat-card
          icon="warning"
          title="Pagamentos Falhados"
          :value="formatCount(dashboardStats.failedPayments)"
          trend="precisam assistência"
          :is-positive="false"
          color="negative"
        />
      </div>
    </div>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-lg-8">
        <q-card class="glass-card q-mb-lg">
          <q-card-section>
            <div class="row justify-between items-center">
              <div>
                <h2 class="text-h6 text-weight-bold">Evolução Semanal</h2>
                <p class="text-caption text-grey-4">Últimas 4 semanas — validados vs falhados</p>
              </div>
            </div>
            <div class="chart-container">
              <canvas ref="revenueChart"></canvas>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="glass-card">
          <q-card-section>
            <div class="row justify-between items-center q-mb-md">
              <div>
                <h2 class="text-h6 text-weight-bold">Atividade Recente</h2>
                <p class="text-caption text-grey-4">Validações e falhas no período seleccionado</p>
              </div>
              <q-btn color="accent" label="Ver pagamentos" flat dense to="/payments" />
            </div>

            <q-table
              flat
              :rows="recentActivity"
              :columns="transactionColumns"
              row-key="id"
              hide-pagination
              :loading="loading"
              class="transparent-table"
            >
              <template v-slot:body-cell-status="props">
                <q-td :props="props">
                  <status-badge :status="props.row.status" />
                </q-td>
              </template>

              <template v-slot:body-cell-amount="props">
                <q-td :props="props" class="text-right">
                  <span class="text-weight-bold">{{ formatCurrency(props.row.amount) }}</span>
                </q-td>
              </template>

              <template v-slot:body-cell-reference="props">
                <q-td :props="props">
                  {{ props.row.reference }}
                  <div v-if="props.row.timestamp" class="text-caption text-grey-5">
                    {{ formatActivityDate(props.row.timestamp) }}
                  </div>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-lg-4">
        <q-card class="glass-card q-mb-lg">
          <q-card-section>
            <h2 class="text-h6 text-weight-bold">Status de Pagamentos</h2>
            <p class="text-caption text-grey-4">Distribuição no período</p>
            <div class="chart-container">
              <canvas ref="paymentStatusChart"></canvas>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="glass-card">
          <q-card-section>
            <h2 class="text-h6 text-weight-bold">Resumo rápido</h2>
            <p class="text-caption text-grey-4">Atalhos para operação</p>
            <q-list dense class="text-grey-3 q-pa-sm">
              <q-item clickable to="/users">
                <q-item-section avatar><q-icon name="person_search" color="primary" /></q-item-section>
                <q-item-section>Consulta de utilizador</q-item-section>
              </q-item>
              <q-item clickable to="/payments">
                <q-item-section avatar><q-icon name="payments" color="positive" /></q-item-section>
                <q-item-section>Pagamentos e vinculação</q-item-section>
              </q-item>
              <q-item clickable to="/relatorios">
                <q-item-section avatar><q-icon name="assignment" color="orange" /></q-item-section>
                <q-item-section>Utilizadores sem pagamento</q-item-section>
              </q-item>
              <q-item clickable to="/pagamentos-falhados">
                <q-item-section avatar><q-icon name="report_problem" color="negative" /></q-item-section>
                <q-item-section>Pagamentos falhados</q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { api } from 'boot/axios'
import Chart from 'chart.js/auto'
import StatCard from 'components/StatCard.vue'
import StatusBadge from 'components/StatusBadge.vue'

const PERIOD_LABELS = {
  all: 'Tempo real (tudo)',
  today: 'Hoje',
  week: 'Últimos 7 dias',
  month: 'Este mês'
}

export default {
  components: {
    StatCard,
    StatusBadge
  },
  setup() {
    const loading = ref(false)
    const loadError = ref('')
    const selectedPeriod = ref('all')
    const recentActivity = ref([])
    const weeklySeries = ref({ labels: [], validated: [], failed: [] })
    const revenueChart = ref(null)
    const paymentStatusChart = ref(null)
    const dashboardStats = ref({
      totalUsers: 0,
      unpaidUsers: 0,
      validatedPayments: 0,
      failedPayments: 0
    })

    let revenueChartInstance = null
    let paymentStatusChartInstance = null

    const periodLabel = computed(() => PERIOD_LABELS[selectedPeriod.value] || PERIOD_LABELS.all)
    const periodTrendLabel = computed(() => {
      if (selectedPeriod.value === 'all') return 'total na base'
      return periodLabel.value.toLowerCase()
    })

    const transactionColumns = [
      { name: 'reference', label: 'Referência', field: 'reference', align: 'left' },
      { name: 'provider', label: 'Provedor', field: 'provider', align: 'left' },
      { name: 'amount', label: 'Valor', field: 'amount', align: 'right' },
      { name: 'status', label: 'Status', field: 'status', align: 'center' }
    ]

    const formatActivityDate = (value) => {
      if (!value) return '-'
      const dt = new Date(value)
      if (Number.isNaN(dt.getTime())) return value
      return dt.toLocaleString('pt-PT')
    }

    const formatCount = (value) => {
      return new Intl.NumberFormat('pt-PT').format(Number(value || 0))
    }

    const renderCharts = () => {
      if (!revenueChart.value || !paymentStatusChart.value) return
      if (revenueChartInstance) revenueChartInstance.destroy()
      if (paymentStatusChartInstance) paymentStatusChartInstance.destroy()

      const labels = weeklySeries.value.labels.length
        ? weeklySeries.value.labels
        : ['—', '—', '—', '—']
      const validatedData = weeklySeries.value.validated.length
        ? weeklySeries.value.validated
        : [0, 0, 0, 0]
      const failedData = weeklySeries.value.failed.length
        ? weeklySeries.value.failed
        : [0, 0, 0, 0]

      revenueChartInstance = new Chart(revenueChart.value.getContext('2d'), {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Validados',
              data: validatedData,
              borderColor: '#4CAF50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true
            },
            {
              label: 'Falhados',
              data: failedData,
              borderColor: '#F44336',
              backgroundColor: 'rgba(244, 67, 54, 0.08)',
              borderWidth: 2,
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#E0E0E0' }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: '#BDBDBD' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.1)' },
              ticks: { color: '#BDBDBD' }
            }
          }
        }
      })

      const validated = dashboardStats.value.validatedPayments
      const failed = dashboardStats.value.failedPayments
      const unpaid = dashboardStats.value.unpaidUsers

      paymentStatusChartInstance = new Chart(paymentStatusChart.value.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Pago', 'Pendente', 'Falha'],
          datasets: [{
            data: [validated, unpaid, failed],
            backgroundColor: ['#4CAF50', '#FFC107', '#F44336'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#E0E0E0',
                padding: 20,
                usePointStyle: true
              }
            }
          }
        }
      })
    }

    const loadDashboardData = async () => {
      loading.value = true
      loadError.value = ''
      try {
        const response = await api.get('/users/dashboard-stats/', {
          params: { period: selectedPeriod.value }
        })
        const data = response.data || {}
        const counts = data.counts || {}

        dashboardStats.value = {
          totalUsers: counts.total_users || 0,
          unpaidUsers: counts.unpaid_users || 0,
          validatedPayments: counts.validated_payments || 0,
          failedPayments: counts.failed_payments || 0
        }

        weeklySeries.value = data.weekly_series || { labels: [], validated: [], failed: [] }
        recentActivity.value = Array.isArray(data.recent_activity) ? data.recent_activity : []

        renderCharts()
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error)
        loadError.value =
          error.response?.data?.detail ||
          error.response?.data?.error ||
          'Não foi possível carregar o dashboard.'
      } finally {
        loading.value = false
      }
    }

    const setPeriod = (period) => {
      selectedPeriod.value = period
      loadDashboardData()
    }

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN'
      }).format(Number(value || 0))
    }

    onMounted(() => {
      loadDashboardData()
    })

    onBeforeUnmount(() => {
      if (revenueChartInstance) revenueChartInstance.destroy()
      if (paymentStatusChartInstance) paymentStatusChartInstance.destroy()
    })

    return {
      loading,
      loadError,
      selectedPeriod,
      periodLabel,
      periodTrendLabel,
      recentActivity,
      dashboardStats,
      transactionColumns,
      revenueChart,
      paymentStatusChart,
      formatCurrency,
      formatCount,
      formatActivityDate,
      setPeriod
    }
  }
}
</script>

<style lang="scss">
.text-h6 {
  color: #E0E0E0;
}

.dashboard-page {
  background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
  padding: 24px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);

  .q-card__section {
    padding: 20px;
  }
}

.transparent-table {
  background: transparent;

  thead th {
    background: transparent;
    color: #BDBDBD;
    font-weight: 500;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  tbody td {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: #E0E0E0;
  }

  tbody tr:hover td {
    background: rgba(255, 255, 255, 0.05);
  }
}

.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}

.date-filter {
  .q-btn__content {
    text-transform: none;
    letter-spacing: normal;
  }
}
</style>
