<template>
  <q-page class="payments-page q-pa-lg">
    <div class="text-h4 text-weight-bold q-mb-sm flex items-center">
      <q-icon name="support_agent" size="md" class="q-mr-sm text-primary" />
      Atendimento — pagamentos &amp; desbloqueio
    </div>
    <p class="text-body2 text-grey-8 q-mb-md" style="max-width: 920px">
      Use esta página quando o utilizador <strong>diz que já pagou</strong> (M-Pesa / E-Mola) mas a <strong>app não desbloqueou</strong>.
      Pesquise pelo <strong>número usado no pagamento</strong>; a coluna <em>Validação</em> mostra se esse movimento <strong>já foi associado</strong> a uma conta da app e por quem.
      Se estiver <strong>livre para associar</strong>, escolha a <strong>conta do utilizador na Carta Fácil</strong> (pode ser outro número) e o plano correcto.
    </p>
    <div class="q-mb-lg">
      <q-btn
        outline
        color="primary"
        icon="verified_user"
        label="Ver histórico de validações (quem vinculou a quem)"
        :to="{ path: '/validacoes-pagamento' }"
        no-caps
      />
    </div>

    <q-card class="external-payments-card q-mb-lg">
      <q-card-section>
        <div class="text-h6 text-weight-bold q-mb-md flex items-center">
          <q-icon name="search" class="q-mr-sm" />
          Pesquisar pagamentos bem-sucedidos no gateway
        </div>
        <p class="text-caption text-grey-7 q-mb-md">
          Indique o telefone que aparece no comprovativo M-Pesa / E-Mola (o mesmo formato que o cliente usa).
        </p>

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

          <template v-slot:body-cell-amount="props">
            <q-td :props="props">
              <span class="text-weight-bold text-positive">
                {{ formatCurrency(props.value) }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-payment_date="props">
            <q-td :props="props">
              {{ formatDateTime(props.value) }}
            </q-td>
          </template>

          <template v-slot:body-cell-validation="props">
            <q-td :props="props">
              <template v-if="props.row.claim">
                <q-chip color="positive" text-color="white" size="sm" icon="check_circle">
                  Já vinculado a um utilizador
                </q-chip>
                <div class="text-caption text-grey-8 q-mt-xs">
                  <strong>Activado por:</strong> {{ props.row.claim.validated_by_name }}
                  <span class="q-ml-sm"><strong>Dia:</strong> {{ formatDateTime(props.row.claim.validated_at) }}</span>
                </div>
                <div class="text-caption text-grey-8">
                  <strong>Conta app:</strong> {{ props.row.claim.app_user_name }} (ID {{ props.row.claim.app_user_id }})
                </div>
              </template>
              <q-chip v-else outline color="amber" text-color="dark" size="sm" icon="person_add">
                Pode vincular a uma conta
              </q-chip>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                color="primary"
                icon="person_add"
                size="sm"
                :disable="!!props.row.claim"
                @click="openAssociateDialog(props.row)"
              >
                <q-tooltip>
                  {{ props.row.claim ? 'Este pagamento já foi validado para outro utilizador' : 'Associar a um utilizador' }}
                </q-tooltip>
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

      <q-card-section v-else-if="externalPaymentsSearched && !externalPaymentsLoading" class="q-pt-none">
        <q-separator class="q-mb-md" />
        <div class="text-center text-grey-7 q-py-xl">
          <q-icon name="info" size="xl" class="q-mb-md text-grey-5" />
          <div class="text-h6">Nenhum pagamento encontrado</div>
          <div class="text-caption">Para o número {{ externalPaymentQuery }}</div>
        </div>
      </q-card-section>
    </q-card>

    <q-dialog v-model="associateDialog" persistent maximized>
      <q-card class="associate-dialog">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Associar Pagamento a Utilizador</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <div class="row q-col-gutter-lg">
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

            <div class="col-12 col-md-7">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold q-mb-md">
                    <q-icon name="assignment" class="q-mr-sm" />
                    Vincular à conta na app
                  </div>
                  <q-banner dense rounded class="bg-blue-1 text-dark q-mb-md">
                    <template v-slot:avatar>
                      <q-icon name="info" color="primary" />
                    </template>
                    Escolha o <strong>utilizador da Carta Fácil</strong> que deve ficar com o plano activo — não confundir com o número que só serviu para pagar.
                  </q-banner>

                  <q-select
                    v-model="associationUser"
                    outlined
                    label="Conta do utilizador na app *"
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
            label="Vincular pagamento e activar plano"
            color="positive"
            @click="confirmAssociation"
            :loading="associationLoading"
            :disable="!canAssociate"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import { date } from 'quasar'

export default {
  name: 'PaymentsPage',

  setup() {
    const $q = useQuasar()
    const route = useRoute()

    const externalPaymentQuery = ref('')
    const externalPaymentsLoading = ref(false)
    const externalPayments = ref([])
    const externalPaymentsSearched = ref(false)

    const associateDialog = ref(false)
    const detailsDialog = ref(false)
    const selectedPayment = ref(null)

    const associationUser = ref(null)
    const associationCategory = ref('')
    const associationStartDate = ref(date.formatDate(Date.now(), 'YYYY-MM-DD'))
    const associationEndDate = ref('')
    const associationLoading = ref(false)

    const filteringUsers = ref(false)
    const userOptions = ref([])
    const selectedUserData = ref(null)

    const planOptions = [
      { label: 'Ganha Fácil', value: 'ganha-facil' },
      { label: 'Profissional', value: 'profissional' },
      { label: 'Ligeiro/Pesado', value: 'ligeiro_pesado' },
      { label: 'Vídeos', value: 'videos' },
      { label: 'Vídeos Prática Ligeiro', value: 'videos-practical-ligeiro' },
      { label: 'Vídeos Prática Pesado', value: 'videos-practical-pesado' }
    ]

    const externalPaymentColumns = [
      { name: 'method', label: 'Método', field: 'method', align: 'left', sortable: true },
      { name: 'phone_number', label: 'Telefone', field: 'phone_number', align: 'left', sortable: true },
      { name: 'amount', label: 'Valor', field: 'amount', align: 'right', sortable: true },
      { name: 'payment_date', label: 'Data', field: 'payment_date', align: 'center', sortable: true },
      { name: 'validation', label: 'Validação', field: 'validation', align: 'left', sortable: false },
      { name: 'actions', label: 'Ações', field: 'actions', align: 'center' }
    ]

    const totalExternalPayments = computed(() => {
      return externalPayments.value.reduce((sum, p) => sum + (p.amount || 0), 0)
    })

    const canAssociate = computed(() => {
      return !!(associationUser.value && associationCategory.value)
    })

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
        const response = await api.get('/payments/admin/external-with-claims/', {
          params: { phone: externalPaymentQuery.value }
        })

        const ts = Date.now()
        externalPayments.value = (response.data.payments || []).map((p, index) => ({
          ...p,
          id: `${p.method}-${index}-${ts}`
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
      if (payment.claim) {
        $q.notify({
          type: 'warning',
          message: 'Este pagamento externo já foi validado e não pode ser associado a outro utilizador.',
          caption: `Validado por ${payment.claim.validated_by_name} para ${payment.claim.app_user_name} (ID ${payment.claim.app_user_id}).`,
        })
        return
      }
      selectedPayment.value = payment
      associationUser.value = null
      associationCategory.value = ''
      associationStartDate.value = date.formatDate(Date.now(), 'YYYY-MM-DD')
      selectedUserData.value = null
      associateDialog.value = true

      filterUsers(payment.phone_number || '', (fn) => fn())
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
            user: user
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
        const selectedOption = userOptions.value.find(u => u.value === associationUser.value)

        if (!selectedOption) {
          throw new Error('Usuário não encontrado')
        }

        let paymentDate = selectedPayment.value.payment_date
        if (paymentDate && typeof paymentDate === 'object' && typeof paymentDate.toISOString === 'function') {
          paymentDate = paymentDate.toISOString()
        }

        const payload = {
          user_id: associationUser.value,
          category: associationCategory.value,
          start_at: associationStartDate.value,
          end_at: associationEndDate.value,
          phone_number: selectedPayment.value.phone_number,
          amount: selectedPayment.value.amount,
          external_source: {
            phone_number: selectedPayment.value.phone_number,
            payment_date: paymentDate,
            amount: selectedPayment.value.amount,
            method: selectedPayment.value.method
          }
        }

        await api.post('/payments/admin/add/', payload)

        $q.notify({
          type: 'positive',
          message: 'Pagamento associado e assinatura criada com sucesso!'
        })

        associateDialog.value = false
        await searchExternalPayments()
      } catch (err) {
        console.error('Erro ao associar pagamento:', err)
        $q.notify({
          type: 'negative',
          message: err.response?.data?.error || err.response?.data?.detail || 'Erro ao associar pagamento'
        })
      } finally {
        associationLoading.value = false
      }
    }

    watch(
      () => route.query.phone,
      (phoneParam) => {
        if (phoneParam != null && String(phoneParam).trim() !== '') {
          externalPaymentQuery.value = String(phoneParam).trim()
          searchExternalPayments()
        }
      },
      { immediate: true }
    )

    return {
      externalPaymentQuery,
      externalPaymentsLoading,
      externalPayments,
      externalPaymentsSearched,
      externalPaymentColumns,
      associateDialog,
      detailsDialog,
      selectedPayment,
      associationUser,
      associationCategory,
      associationStartDate,
      associationEndDate,
      associationLoading,
      filteringUsers,
      userOptions,
      planOptions,
      totalExternalPayments,
      canAssociate,
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
