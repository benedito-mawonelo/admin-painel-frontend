<template>
  <q-page class="service-page">
    <div class="row q-col-gutter-lg">
      <!-- Search Section -->
      <div class="col-12">
        <q-card class="search-card">
          <q-card-section>
            <h1 class="text-h4 text-weight-bold q-mb-md">Consulta de Cliente</h1>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="searchQuery"
                  outlined
                  label="Telefone, Nome ou ID"
                  placeholder="Digite para pesquisar"
                  clearable
                  @keyup.enter="searchClient"
                >
                  <template v-slot:prepend>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-3">
                <q-btn
                  color="primary"
                  label="Pesquisar"
                  class="full-height"
                  @click="searchClient"
                  :loading="searchLoading"
                />
              </div>

              <div class="col-12 col-md-3">
                <q-btn
                  color="secondary"
                  label="Limpar"
                  class="full-height"
                  outline
                  @click="resetSearch"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Results Section -->
      <div class="col-12" v-if="clientData">
        <q-card class="client-card">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <q-avatar size="60px" class="q-mr-md">
                <img :src="clientData.avatar || 'https://cdn.quasar.dev/img/avatar.png'">
              </q-avatar>

              <div>
                <h2 class="text-h5 text-weight-bold q-mb-xs">{{ clientData.name }}</h2>
                <div class="text-subtitle1">
                  <q-icon name="phone" class="q-mr-xs" />
                  {{ clientData.phone }}
                </div>
              </div>

              <q-space />

              <div class="text-right">
                <q-badge
                  :color="clientData.status === 'active' ? 'positive' : 'negative'"
                  class="q-pa-sm"
                >
                  {{ clientData.status === 'active' ? 'Ativo' : 'Inativo' }}
                </q-badge>
                <div class="text-caption q-mt-xs">
                  Membro desde {{ formatDate(clientData.join_date) }}
                </div>
              </div>
            </div>

            <q-separator class="q-mb-lg" />

            <div class="row q-col-gutter-lg">
              <!-- Subscription Info -->
              <div class="col-12 col-md-6">
                <h3 class="text-h6 text-weight-bold q-mb-md">Assinatura</h3>

                <div class="subscription-info">
                  <div class="row items-center q-mb-sm">
                    <div class="col-6 text-grey-7">Plano:</div>
                    <div class="col-6 text-weight-bold">{{ clientData.subscription.plan }}</div>
                  </div>

                  <div class="row items-center q-mb-sm">
                    <div class="col-6 text-grey-7">Status:</div>
                    <div class="col-6">
                      <q-badge
                        :color="clientData.subscription.status === 'active' ? 'positive' : 'negative'"
                      >
                        {{ clientData.subscription.status === 'active' ? 'Ativo' : 'Inativo' }}
                      </q-badge>
                    </div>
                  </div>

                  <div class="row items-center q-mb-sm">
                    <div class="col-6 text-grey-7">Valor:</div>
                    <div class="col-6 text-weight-bold">{{ formatCurrency(clientData.subscription.amount) }}</div>
                  </div>

                  <div class="row items-center q-mb-sm">
                    <div class="col-6 text-grey-7">Método:</div>
                    <div class="col-6 text-weight-bold">{{ clientData.subscription.method }}</div>
                  </div>

                  <div class="row items-center q-mb-sm">
                    <div class="col-6 text-grey-7">Início:</div>
                    <div class="col-6">{{ formatDate(clientData.subscription.start_date) }}</div>
                  </div>

                  <div class="row items-center">
                    <div class="col-6 text-grey-7">Próximo pagamento:</div>
                    <div class="col-6">
                      <span :class="{'text-positive': isDateFuture(clientData.subscription.next_payment)}">
                        {{ formatDate(clientData.subscription.next_payment) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Payment History -->
              <div class="col-12 col-md-6">
                <h3 class="text-h6 text-weight-bold q-mb-md">Histórico de Pagamentos</h3>

                <q-list bordered separator class="payment-history">
                  <q-item v-for="payment in clientData.payments" :key="payment.id">
                    <q-item-section>
                      <q-item-label>{{ formatDate(payment.date) }}</q-item-label>
                      <q-item-label caption>{{ payment.reference }}</q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <div class="text-right">
                        <div class="text-weight-bold">{{ formatCurrency(payment.amount) }}</div>
                        <q-badge
                          :color="payment.status === 'paid' ? 'positive' : payment.status === 'pending' ? 'warning' : 'negative'"
                          class="q-mt-xs"
                        >
                          {{ payment.status === 'paid' ? 'Pago' : payment.status === 'pending' ? 'Pendente' : 'Falha' }}
                        </q-badge>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>

                <q-btn
                  color="primary"
                  label="Ver histórico completo"
                  flat
                  dense
                  class="full-width q-mt-md"
                />
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              color="primary"
              label="Editar Cliente"
              outline
            />
            <q-btn
              color="primary"
              label="Enviar Mensagem"
            />
            <q-btn
              color="secondary"
              label="Renovar Assinatura"
            />
          </q-card-actions>
        </q-card>
      </div>

      <!-- Empty State -->
      <div class="col-12" v-if="!clientData && !searchLoading">
        <q-card class="empty-state-card">
          <q-card-section class="text-center">
            <q-icon name="search_off" size="xl" color="grey-5" class="q-mb-md" />
            <h3 class="text-h5 text-weight-bold q-mb-sm">Nenhum cliente selecionado</h3>
            <p class="text-grey-7">Digite um telefone, nome ou ID para pesquisar um cliente</p>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref } from 'vue'
// import { api } from 'boot/axios'

export default {
  setup() {
    const searchQuery = ref('')
    const searchLoading = ref(false)
    const clientData = ref(null)

    const mockClientData = {
      id: 'USR-2458',
      name: 'Carlos Mbanze',
      phone: '+258 84 123 4567',
      email: 'carlos.mbanze@example.com',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      status: 'active',
      join_date: '2023-05-15',
      subscription: {
        plan: 'Premium',
        status: 'active',
        amount: 750,
        method: 'Mpesa',
        start_date: '2024-01-10',
        next_payment: '2024-08-10'
      },
      payments: [
        { id: 1, date: '2024-07-10', amount: 750, reference: 'REF-78945', status: 'paid' },
        { id: 2, date: '2024-06-10', amount: 750, reference: 'REF-68932', status: 'paid' },
        { id: 3, date: '2024-05-10', amount: 750, reference: 'REF-57841', status: 'paid' },
        { id: 4, date: '2024-04-10', amount: 750, reference: 'REF-46789', status: 'paid' }
      ]
    }

    const searchClient = () => {
      if (!searchQuery.value) return

      searchLoading.value = true

      // Simulate API call
      setTimeout(() => {
        clientData.value = mockClientData
        searchLoading.value = false
      }, 1000)

      // In a real app:
      // api.get(`/clients?search=${searchQuery.value}`)
      //   .then(response => {
      //     clientData.value = response.data
      //   })
      //   .finally(() => {
      //     searchLoading.value = false
      //   })
    }

    const resetSearch = () => {
      searchQuery.value = ''
      clientData.value = null
    }

    const formatDate = (dateString) => {
      const options = { year: 'numeric', month: 'long', day: 'numeric' }
      return new Date(dateString).toLocaleDateString('pt-MZ', options)
    }

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN'
      }).format(value)
    }

    const isDateFuture = (dateString) => {
      return new Date(dateString) > new Date()
    }

    return {
      searchQuery,
      searchLoading,
      clientData,
      searchClient,
      resetSearch,
      formatDate,
      formatCurrency,
      isDateFuture
    }
  }
}
</script>

<style lang="scss">
.service-page {
  padding: 24px;
  background-color: #f5f7fa;
}

.search-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  .q-card__section {
    padding: 24px;
  }
}

.client-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  .q-card__section {
    padding: 24px;
  }

  .q-card__actions {
    padding: 16px 24px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }
}

.empty-state-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 48px 24px;

  .q-icon {
    font-size: 64px;
  }
}

.subscription-info {
  background: rgba(76, 175, 80, 0.05);
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid $primary;
}

.payment-history {
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;

  .q-item {
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    &:last-child {
      border-bottom: none;
    }
  }
}
</style>
