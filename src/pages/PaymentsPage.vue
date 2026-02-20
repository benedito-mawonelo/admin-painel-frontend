<template>
  <q-page class="payments-page q-pa-lg">
    <!-- Cabeçalho -->
    <div class="text-h4 text-weight-bold q-mb-md flex items-center">
      <q-icon name="payments" size="md" class="q-mr-sm text-primary" />
      Gestão de Pagamentos
    </div>

    <!-- Card de Pesquisa Externa -->
    <q-card class="external-payments-card q-mb-lg">
      <q-card-section>
        <div class="text-h6 text-weight-bold q-mb-md flex items-center">
          <q-icon name="search" class="q-mr-sm" />
          Pesquisar Pagamentos Externos
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model="externalPaymentQuery"
              outlined
              label="Número de telefone"
              placeholder="Ex: 841234567"
              mask="###########"
              unmasked-value
              clearable
              @keyup.enter="searchExternalPayments"
              :disable="externalPaymentsLoading"
            >
              <template v-slot:prepend>
                <q-icon name="phone" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-3">
            <q-btn
              color="primary"
              label="Pesquisar"
              class="full-height full-width"
              @click="searchExternalPayments"
              :loading="externalPaymentsLoading"
              icon="search"
            />
          </div>

          <div class="col-12 col-md-3">
            <q-btn
              color="grey"
              label="Limpar"
              class="full-height full-width"
              outline
              @click="clearExternalPayments"
              :disable="!externalPayments.length && !externalPaymentsSearched"
            />
          </div>
        </div>

        <!-- Estatísticas rápidas -->
        <div v-if="externalPayments.length > 0" class="row q-mt-md">
          <div class="col-12">
            <q-chip color="positive" text-color="white" icon="check_circle">
              {{ externalPayments.length }} pagamento(s) encontrado(s)
            </q-chip>
            <q-chip color="secondary" text-color="white" icon="payments">
              Total: {{ formatCurrency(totalExternalPayments) }}
            </q-chip>
          </div>
        </div>
      </q-card-section>

      <!-- Resultados da Pesquisa -->
      <q-card-section v-if="externalPayments.length > 0" class="q-pt-none">
        <q-separator class="q-mb-md" />

        <q-table
          :rows="externalPayments"
          :columns="externalPaymentColumns"
          row-key="id"
          flat
          bordered
          :pagination="{ rowsPerPage: 10 }"
          :loading="externalPaymentsLoading"
          class="payments-table"
        >
          <!-- Coluna Método -->
          <template v-slot:body-cell-method="props">
            <q-td :props="props">
              <q-chip
                :color="props.value === 'mpesa' ? 'teal' : 'orange'"
                text-color="white"
                size="sm"
                :icon="props.value === 'mpesa' ? 'smartphone' : 'phone_android'"
              >
                {{ props.value.toUpperCase() }}
              </q-chip>
            </q-td>
          </template>

          <!-- Coluna Valor -->
          <template v-slot:body-cell-amount="props">
            <q-td :props="props">
              <span class="text-weight-bold text-positive">
                {{ formatCurrency(props.value) }}
              </span>
            </q-td>
          </template>

          <!-- Coluna Data -->
          <template v-slot:body-cell-payment_date="props">
            <q-td :props="props">
              {{ formatDateTime(props.value) }}
            </q-td>
          </template>

          <!-- Coluna Ações -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                color="primary"
                icon="person_add"
                size="sm"
                @click="openAssociateDialog(props.row)"
              >
                <q-tooltip>Associar a um utilizador</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                color="secondary"
                icon="visibility"
                size="sm"
                @click="viewPaymentDetails(props.row)"
              >
                <q-tooltip>Ver detalhes</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <!-- Estado Sem Resultados -->
      <q-card-section v-else-if="externalPaymentsSearched && !externalPaymentsLoading" class="q-pt-none">
        <q-separator class="q-mb-md" />
        <div class="text-center text-grey-7 q-py-xl">
          <q-icon name="info" size="xl" class="q-mb-md text-grey-5" />
          <div class="text-h6">Nenhum pagamento encontrado</div>
          <div class="text-caption">Para o número {{ externalPaymentQuery }}</div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Dialog de Associação -->
    <q-dialog v-model="associateDialog" persistent maximized>
      <q-card class="associate-dialog">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Associar Pagamento a Utilizador</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <div class="row q-col-gutter-lg">
            <!-- Coluna da Esquerda - Detalhes do Pagamento -->
            <div class="col-12 col-md-5">
              <q-card flat bordered class="payment-details-card">
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold q-mb-md">
                    <q-icon name="info" class="q-mr-sm" />
                    Detalhes do Pagamento
                  </div>

                  <div v-if="selectedPayment" class="payment-info">
                    <div class="row q-mb-sm">
                      <div class="col-5 text-grey-7">Método:</div>
                      <div class="col-7">
                        <q-chip
                          :color="selectedPayment.method === 'mpesa' ? 'teal' : 'orange'"
                          text-color="white"
                          size="sm"
                        >
                          {{ selectedPayment.method?.toUpperCase() }}
                        </q-chip>
                      </div>
                    </div>

                    <div class="row q-mb-sm">
                      <div class="col-5 text-grey-7">Telefone:</div>
                      <div class="col-7 text-weight-bold">{{ selectedPayment.phone_number }}</div>
                    </div>

                    <div class="row q-mb-sm">
                      <div class="col-5 text-grey-7">Valor:</div>
                      <div class="col-7">
                        <span class="text-positive text-weight-bold text-h6">
                          {{ formatCurrency(selectedPayment.amount) }}
                        </span>
                      </div>
                    </div>

                    <div class="row q-mb-sm">
                      <div class="col-5 text-grey-7">Data:</div>
                      <div class="col-7">{{ formatDateTime(selectedPayment.payment_date) }}</div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Coluna da Direita - Formulário de Associação -->
            <div class="col-12 col-md-7">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold q-mb-md">
                    <q-icon name="assignment" class="q-mr-sm" />
                    Configurar Assinatura
                  </div>

                  <q-select
                    v-model="associationUser"
                    outlined
                    label="Selecionar Utilizador *"
                    :options="userOptions"
                    option-label="label"
                    option-value="value"
                    emit-value
                    map-options
                    use-input
                    input-debounce="300"
                    @filter="filterUsers"
                    :loading="filteringUsers"
                    clearable
                    class="q-mb-md"
                    :rules="[val => !!val || 'Selecione um utilizador']"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Digite para pesquisar...
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>

                  <q-select
                    v-model="associationCategory"
                    outlined
                    label="Tipo de Plano *"
                    :options="planOptions"
                    option-value="value"
                    option-label="label"
                    emit-value
                    map-options
                    class="q-mb-md"
                    :rules="[val => !!val || 'Selecione um plano']"
                  />

                  <div class="row q-col-gutter-md">
                    <div class="col-6">
                      <q-input
                        v-model="associationStartDate"
                        outlined
                        label="Data de Início"
                        type="date"
                        class="q-mb-md"
                      />
                    </div>
                    <div class="col-6">
                      <q-input
                        v-model="associationEndDate"
                        outlined
                        label="Data de Expiração"
                        type="date"
                        readonly
                        class="q-mb-md"
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-lg">
          <q-btn flat label="Cancelar" color="negative" v-close-popup />
          <q-btn
            label="Associar e Criar Assinatura"
            color="positive"
            @click="confirmAssociation"
            :loading="associationLoading"
            :disable="!canAssociate"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog de Detalhes do Pagamento -->
    <q-dialog v-model="detailsDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Detalhes do Pagamento</div>
        </q-card-section>

        <q-card-section v-if="selectedPayment" class="q-pt-none">
          <q-list dense>
            <q-item>
              <q-item-section>
                <q-item-label caption>Método</q-item-label>
                <q-item-label>
                  <q-chip
                    :color="selectedPayment.method === 'mpesa' ? 'teal' : 'orange'"
                    text-color="white"
                    size="sm"
                  >
                    {{ selectedPayment.method?.toUpperCase() }}
                  </q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Número</q-item-label>
                <q-item-label>{{ selectedPayment.phone_number }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Valor</q-item-label>
                <q-item-label class="text-positive text-weight-bold">{{ formatCurrency(selectedPayment.amount) }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                <q-item-label caption>Data e Hora</q-item-label>
                <q-item-label>{{ formatDateTime(selectedPayment.payment_date) }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Fechar" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, watch, computed, onMounted } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import { date } from 'quasar'

export default {
  name: 'PaymentsPage',

  setup() {
    const $q = useQuasar()

    // Estados
    const externalPaymentQuery = ref('')
    const externalPaymentsLoading = ref(false)
    const externalPayments = ref([])
    const externalPaymentsSearched = ref(false)

    // Dialog states
    const associateDialog = ref(false)
    const detailsDialog = ref(false)
    const selectedPayment = ref(null)

    // Association form
    const associationUser = ref(null)
    const associationCategory = ref('')
    const associationStartDate = ref(date.formatDate(Date.now(), 'YYYY-MM-DD'))
    const associationEndDate = ref('')
    const associationLoading = ref(false)

    // User filter
    const filteringUsers = ref(false)
    const userOptions = ref([])
    const selectedUserData = ref(null)

    // Plan options - valores exatos que o backend espera
    const planOptions = [
      { label: 'Ganha Fácil', value: 'ganha-facil' },
      { label: 'Profissional', value: 'profissional' },
      { label: 'Ligeiro/Pesado', value: 'ligeiro_pesado' },
      { label: 'Vídeos', value: 'videos' },
      { label: 'Vídeos Prática Ligeiro', value: 'videos-practical-ligeiro' },
      { label: 'Vídeos Prática Pesado', value: 'videos-practical-pesado' }
    ]

    // Table columns
    const externalPaymentColumns = [
      { name: 'method', label: 'Método', field: 'method', align: 'left', sortable: true },
      { name: 'phone_number', label: 'Telefone', field: 'phone_number', align: 'left', sortable: true },
      { name: 'amount', label: 'Valor', field: 'amount', align: 'right', sortable: true },
      { name: 'payment_date', label: 'Data', field: 'payment_date', align: 'center', sortable: true },
      { name: 'actions', label: 'Ações', field: 'actions', align: 'center' }
    ]

    // Computed
    const totalExternalPayments = computed(() => {
      return externalPayments.value.reduce((sum, p) => sum + (p.amount || 0), 0)
    })

    const canAssociate = computed(() => {
      return associationUser.value && associationCategory.value
    })

    // Watch para calcular data de expiração
    watch([associationCategory, associationStartDate], ([newCategory, newStartDate]) => {
      if (newCategory && newStartDate) {
        const defaultValidityDays = newCategory === 'ganha-facil' ? 70 : 30
        const startDate = new Date(newStartDate || Date.now())
        associationEndDate.value = date.formatDate(
          startDate.getTime() + defaultValidityDays * 24 * 60 * 60 * 1000,
          'YYYY-MM-DD'
        )
      }
    })

    // Métodos
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN'
      }).format(value)
    }

    const formatDateTime = (dateString) => {
      if (!dateString) return '-'
      return date.formatDate(dateString, 'DD/MM/YYYY HH:mm')
    }

    const searchExternalPayments = async () => {
      if (!externalPaymentQuery.value) {
        $q.notify({
          type: 'warning',
          message: 'Digite um número de telefone para pesquisar'
        })
        return
      }

      externalPaymentsLoading.value = true
      externalPaymentsSearched.value = true

      try {
        const response = await api.get('/payments/external/', {
          params: { phone: externalPaymentQuery.value }
        })

        // Adiciona um ID único para cada pagamento
        externalPayments.value = (response.data.payments || []).map((p, index) => ({
          ...p,
          id: `${p.method}-${index}-${Date.now()}`
        }))

        if (externalPayments.value.length === 0) {
          $q.notify({
            type: 'info',
            message: 'Nenhum pagamento encontrado para este número'
          })
        } else {
          $q.notify({
            type: 'positive',
            message: `Encontrados ${externalPayments.value.length} pagamento(s)`
          })
        }
      } catch (err) {
        console.error('Erro ao buscar pagamentos externos:', err)
        $q.notify({
          type: 'negative',
          message: err.response?.data?.error || 'Erro ao buscar pagamentos'
        })
        externalPayments.value = []
      } finally {
        externalPaymentsLoading.value = false
      }
    }

    const clearExternalPayments = () => {
      externalPayments.value = []
      externalPaymentsSearched.value = false
      externalPaymentQuery.value = ''
    }

    const openAssociateDialog = (payment) => {
      selectedPayment.value = payment
      associationUser.value = null
      associationCategory.value = ''
      associationStartDate.value = date.formatDate(Date.now(), 'YYYY-MM-DD')
      selectedUserData.value = null
      associateDialog.value = true

      // Pré-preenche a busca de usuários
      filterUsers('', payment.phone_number)
    }

    const viewPaymentDetails = (payment) => {
      selectedPayment.value = payment
      detailsDialog.value = true
    }

    const filterUsers = async (val, update) => {
      const searchTerm = val || externalPaymentQuery.value
      if (!searchTerm) return

      filteringUsers.value = true

      try {
        const response = await api.get(`/users/filter/?telefone=${encodeURIComponent(searchTerm)}`)
        const users = response.data || []

        update(() => {
          userOptions.value = users.map(user => ({
            label: `${user.telefone} - ${user.first_name || user.username || 'Sem nome'}`,
            value: user.id,
            user: user // Guarda o objeto completo do usuário
          }))
        })
      } catch (err) {
        console.error('Erro ao buscar usuários:', err)
        update(() => {
          userOptions.value = []
        })
      } finally {
        filteringUsers.value = false
      }
    }

    const confirmAssociation = async () => {
      if (!canAssociate.value) return

      associationLoading.value = true

      try {
        // Encontrar o usuário selecionado
        const selectedOption = userOptions.value.find(u => u.value === associationUser.value)

        if (!selectedOption) {
          throw new Error('Usuário não encontrado')
        }

        // Preparar payload exatamente como o backend espera
        const payload = {
          user_id: associationUser.value, // ID do usuário
          category: associationCategory.value, // Apenas o valor string, não o objeto
          start_at: associationStartDate.value,
          end_at: associationEndDate.value,
          phone_number: selectedPayment.value.phone_number, // Número do pagamento
          amount: selectedPayment.value.amount // Valor do pagamento
        }

        console.log('Enviando payload:', payload) // Para debug

        // Criar assinatura
        await api.post('/payments/admin/add/', payload)

        $q.notify({
          type: 'positive',
          message: 'Pagamento associado e assinatura criada com sucesso!'
        })

        associateDialog.value = false

        // Remove o pagamento associado da lista
        externalPayments.value = externalPayments.value.filter(
          p => p.id !== selectedPayment.value.id
        )

      } catch (err) {
        console.error('Erro ao associar pagamento:', err)
        console.error('Resposta do erro:', err.response?.data) // Para debug

        $q.notify({
          type: 'negative',
          message: err.response?.data?.error || err.response?.data?.detail || 'Erro ao associar pagamento'
        })
      } finally {
        associationLoading.value = false
      }
    }

    // Inicialização
    onMounted(() => {
      // Verificar se há parâmetros na URL
      const query = new URLSearchParams(window.location.search)
      const phoneParam = query.get('phone')
      if (phoneParam) {
        externalPaymentQuery.value = phoneParam
        searchExternalPayments()
      }
    })

    return {
      // Estados
      externalPaymentQuery,
      externalPaymentsLoading,
      externalPayments,
      externalPaymentsSearched,
      externalPaymentColumns,
      associateDialog,
      detailsDialog,
      selectedPayment,

      // Formulário
      associationUser,
      associationCategory,
      associationStartDate,
      associationEndDate,
      associationLoading,
      filteringUsers,
      userOptions,
      planOptions,

      // Computed
      totalExternalPayments,
      canAssociate,

      // Métodos
      searchExternalPayments,
      clearExternalPayments,
      openAssociateDialog,
      viewPaymentDetails,
      filterUsers,
      confirmAssociation,
      formatCurrency,
      formatDateTime
    }
  }
}
</script>

<style lang="scss" scoped>
.payments-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.external-payments-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  .payments-table {
    :deep(th) {
      font-weight: 600;
      background-color: #f5f7fa;
    }

    :deep(.q-table) {
      border-radius: 8px;
    }
  }
}

.associate-dialog {
  width: 900px;
  max-width: 90vw;

  .payment-details-card {
    background-color: #f8f9fa;
  }

  .payment-info {
    .row {
      padding: 4px 0;
      border-bottom: 1px dashed #e0e0e0;

      &:last-child {
        border-bottom: none;
      }
    }
  }
}

.q-chip {
  font-weight: 500;
}

.q-btn {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
}
</style>
