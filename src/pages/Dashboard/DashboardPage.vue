<template>
  <q-page class="q-pa-lg">
    <div class="row q-col-gutter-lg">
      <!-- Total Users Card -->
      <div class="col-12 col-sm-6 col-md-3">
        <dashboard-card
          title="Total Users"
          value="1,254"
          icon="people"
          color="primary"
          :trend="12.5"
        />
      </div>

      <!-- Active Users Card -->
      <div class="col-12 col-sm-6 col-md-3">
        <dashboard-card
          title="Active Users"
          value="843"
          icon="person"
          color="positive"
          :trend="5.2"
        />
      </div>

      <!-- Paid Users Card -->
      <div class="col-12 col-sm-6 col-md-3">
        <dashboard-card
          title="Paid Users"
          value="672"
          icon="paid"
          color="info"
          :trend="8.7"
        />
      </div>

      <!-- Unpaid Users Card -->
      <div class="col-12 col-sm-6 col-md-3">
        <dashboard-card
          title="Unpaid Users"
          value="582"
          icon="money_off"
          color="warning"
          :trend="-3.4"
        />
      </div>
    </div>

    <div class="row q-col-gutter-lg q-mt-md">
      <!-- Main Chart -->
      <div class="col-12 col-lg-8">
        <q-card class="animated-card">
          <q-card-section>
            <div class="text-h6">User Activity</div>
            <div class="text-caption text-grey">Last 30 days</div>
          </q-card-section>
          <q-card-section>
            <line-chart :data="userActivityData" />
          </q-card-section>
        </q-card>
      </div>

      <!-- Payment Status -->
      <div class="col-12 col-lg-4">
        <q-card class="animated-card">
          <q-card-section>
            <div class="text-h6">Payment Status</div>
          </q-card-section>
          <q-card-section>
            <pie-chart :data="paymentStatusData" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="row q-mt-lg">
      <div class="col-12">
        <q-card class="animated-card">
          <q-card-section>
            <div class="row items-center">
              <div class="text-h6">Recent Transactions</div>
              <q-space />
              <q-btn
                flat
                color="primary"
                label="View All"
                icon-right="chevron_right"
                to="/reports"
              />
            </div>
          </q-card-section>
          <q-card-section>
            <transaction-table :transactions="recentTransactions" />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import DashboardCard from 'components/DashboardCards/DashboardCard.vue'
import LineChart from 'components/Charts/LineChart.vue'
import PieChart from 'components/Charts/PieChart.vue'
import TransactionTable from 'components/DataTables/TransactionTable.vue'

// Mock data - replace with API calls
const userActivityData = ref({
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  datasets: [
    {
      label: 'Active Users',
      data: [320, 450, 380, 510, 490, 600, 730],
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      tension: 0.3,
      fill: true
    },
    {
      label: 'New Users',
      data: [120, 180, 150, 210, 190, 250, 310],
      borderColor: '#2196F3',
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      tension: 0.3,
      fill: true
    }
  ]
})

const paymentStatusData = ref({
  labels: ['Paid', 'Unpaid', 'Pending', 'Failed'],
  datasets: [
    {
      data: [672, 582, 120, 85],
      backgroundColor: ['#4CAF50', '#FFC107', '#2196F3', '#F44336']
    }
  ]
})

const recentTransactions = ref([
  {
    id: 24,
    wallet_id: "123456",
    provider: "mpesa",
    amount: "45.00",
    phone: "258851234568",
    reference: "REF12352",
    status: "falha",
    created_at: "2024-07-07T17:15:00.000000Z"
  },
  {
    id: 23,
    wallet_id: "123456",
    provider: "emola",
    amount: "90.00",
    phone: "258871234568",
    reference: "REF12351",
    status: "pago",
    created_at: "2024-07-06T13:50:00.000000Z"
  },
  {
    id: 22,
    wallet_id: "123456",
    provider: "mpesa",
    amount: "120.00",
    phone: "258841234568",
    reference: "REF12350",
    status: "pago",
    created_at: "2024-07-05T08:20:00.000000Z"
  }
])
</script>

<style lang="scss">
.animated-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 12px;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  }
}
</style>
