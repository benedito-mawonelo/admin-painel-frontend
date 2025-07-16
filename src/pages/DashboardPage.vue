<template>
  <q-page class="dashboard-page">
    <!-- Header with Date Filter -->
    <div class="row justify-between items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 text-weight-bold text-white">Painel</h1>
        <p class="text-subtitle1 text-grey-4">Visão geral das transações e usuários</p>
      </div>
      <div class="col-auto">
        <q-btn-dropdown
          color="accent"
          label="Últimos 7 dias"
          class="date-filter"
          menu-anchor="bottom right"
          menu-self="top right"
        >
          <q-list>
            <q-item clickable v-close-popup>
              <q-item-section>Hoje</q-item-section>
            </q-item>
            <q-item clickable v-close-popup>
              <q-item-section>Últimos 7 dias</q-item-section>
            </q-item>
            <q-item clickable v-close-popup>
              <q-item-section>Este mês</q-item-section>
            </q-item>
            <q-item clickable v-close-popup>
              <q-item-section>Personalizado</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="row q-col-gutter-lg q-mb-lg">
      <div class="col-12 col-md-3">
        <stat-card
          icon="people"
          title="Total de Usuários"
          value="2,458"
          trend="12%"
          :is-positive="true"
          color="primary"
        />
      </div>
      <div class="col-12 col-md-3">
        <stat-card
          icon="active_users"
          title="Usuários Ativos"
          value="1,892"
          trend="8%"
          :is-positive="true"
          color="secondary"
        />
      </div>
      <div class="col-12 col-md-3">
        <stat-card
          icon="payments"
          title="Pagamentos"
          value="1,756"
          trend="5%"
          :is-positive="true"
          color="accent"
        />
      </div>
      <div class="col-12 col-md-3">
        <stat-card
          icon="pending"
          title="Pendentes"
          value="342"
          trend="3%"
          :is-positive="false"
          color="negative"
        />
      </div>
    </div>

    <!-- Main Content -->
    <div class="row q-col-gutter-lg">
      <!-- Left Column -->
      <div class="col-12 col-lg-8">
        <!-- Revenue Chart -->
        <q-card class="glass-card q-mb-lg">
          <q-card-section>
            <div class="row justify-between items-center">
              <div>
                <h2 class="text-h6 text-weight-bold">Pagamentos Mensais</h2>
                <p class="text-caption text-grey-4">Performance dos últimos 12 meses</p>
              </div>
              <q-btn
                flat
                round
                icon="more_vert"
                color="grey-6"
              />
            </div>
            <div class="chart-container">
              <canvas ref="revenueChart"></canvas>
            </div>
          </q-card-section>
        </q-card>

        <!-- Recent Transactions -->
        <q-card class="glass-card">
          <q-card-section>
            <div class="row justify-between items-center q-mb-md">
              <div>
                <h2 class="text-h6 text-weight-bold">Transações Recentes</h2>
                <p class="text-caption text-grey-4">Últimas 20 transações</p>
              </div>
              <q-btn
                color="accent"
                label="Ver todas"
                flat
                dense
                to="/transactions"
              />
            </div>

            <q-table
              flat
              :rows="recentTransactions"
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
            </q-table>
          </q-card-section>
        </q-card>
      </div>

      <!-- Right Column -->
      <div class="col-12 col-lg-4">
        <!-- Payment Status -->
        <q-card class="glass-card q-mb-lg">
          <q-card-section>
            <h2 class="text-h6 text-weight-bold">Status de Pagamentos</h2>
            <p class="text-caption text-grey-4">Distribuição por status</p>
            <div class="chart-container">
              <canvas ref="paymentStatusChart"></canvas>
            </div>
          </q-card-section>
        </q-card>

        <!-- Top Providers -->
        <q-card class="glass-card">
          <q-card-section>
            <h2 class="text-h6 text-weight-bold">Provedores</h2>
            <p class="text-caption text-grey-4">Distribuição por provedor</p>
            <div class="chart-container">
              <canvas ref="providersChart"></canvas>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue'
import { api } from 'boot/axios'
import Chart from 'chart.js/auto'
import StatCard from 'components/StatCard.vue'
import StatusBadge from 'components/StatusBadge.vue'

export default {
  components: {
    StatCard,
    StatusBadge
  },
  setup() {
    const loading = ref(false)
    const recentTransactions = ref([])
    const revenueChart = ref(null)
    const paymentStatusChart = ref(null)
    const providersChart = ref(null)

    const transactionColumns = [
      { name: 'reference', label: 'Referência', field: 'reference', align: 'left' },
      { name: 'provider', label: 'Provedor', field: 'provider', align: 'left' },
      { name: 'amount', label: 'Valor', field: 'amount', align: 'right' },
      { name: 'status', label: 'Status', field: 'status', align: 'center' }
    ]

    const fetchRecentTransactions = async () => {
      loading.value = true
      try {
        const response = await api.get('/reports', {
          params: {
            per_page: 5,
            sort_by: 'created_at',
            order: 'desc'
          }
        })
        recentTransactions.value = response.data.data
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        loading.value = false
      }
    }

    const initCharts = () => {
      // Revenue Chart
      new Chart(revenueChart.value.getContext('2d'), {
        type: 'line',
        data: {
          labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
          datasets: [{
            label: 'Pagamentos',
            data: [12000, 19000, 15000, 18000, 22000, 24000, 28000, 26000, 30000, 32000, 35000, 38000],
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: '#BDBDBD'
              }
            },
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: '#BDBDBD'
              }
            }
          }
        }
      })

      // Payment Status Chart
      new Chart(paymentStatusChart.value.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Pago', 'Pendente', 'Falha'],
          datasets: [{
            data: [65, 20, 15],
            backgroundColor: [
              '#4CAF50',
              '#FFC107',
              '#F44336'
            ],
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

      // Providers Chart
      new Chart(providersChart.value.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Mpesa', 'Emola', 'Outros'],
          datasets: [{
            data: [45, 35, 20],
            backgroundColor: [
              '#4CAF50',
              '#8BC34A',
              '#CDDC39'
            ],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: '#BDBDBD'
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: '#BDBDBD'
              }
            }
          }
        }
      })
    }

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN'
      }).format(value)
    }

    onMounted(() => {
      fetchRecentTransactions()
      initCharts()
    })

    return {
      loading,
      recentTransactions,
      transactionColumns,
      revenueChart,
      paymentStatusChart,
      providersChart,
      formatCurrency
    }
  }
}
</script>

<style lang="scss">
.text-h6 {
  color: #E0E0E0;
}

.col-12 {
  color: orangered;
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
