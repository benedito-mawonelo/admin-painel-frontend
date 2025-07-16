<template>
  <q-page class="service-page">
    <div class="row q-col-gutter-lg">
      <!-- Search Section -->
      <div class="col-12">
        <q-card class="search-card">
          <q-card-section>
            <h1 class="text-h4 text-weight-bold q-mb-md">Consulta de usuário</h1>

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
      <div class="col-12" v-if="clientData && !editMode">
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
              @click="enterEditMode"
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

      <!-- Edit Mode Section -->
      <div class="col-12" v-if="clientData && editMode">
        <q-card class="edit-card">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <div class="text-h5 text-weight-bold">Editar Cliente</div>
              <q-space />
              <q-btn
                icon="close"
                flat
                round
                dense
                @click="cancelEdit"
              />
            </div>

            <q-form @submit="saveChanges">
              <div class="row q-col-gutter-lg">
                <!-- Personal Info -->
                <div class="col-12 col-md-6">
                  <h3 class="text-h6 text-weight-bold q-mb-md">Informações Pessoais</h3>

                  <div class="row items-center q-mb-md">
                    <q-avatar size="80px" class="q-mr-md">
                      <img :src="editForm.avatar || 'https://cdn.quasar.dev/img/avatar.png'">
                    </q-avatar>
                    <q-btn
                      color="primary"
                      label="Alterar Foto"
                      outline
                      @click="triggerFileInput"
                    />
                    <input
                      type="file"
                      ref="fileInput"
                      style="display: none"
                      accept="image/*"
                      @change="handleFileUpload"
                    />
                  </div>

                  <q-input
                    v-model="editForm.name"
                    outlined
                    label="Nome Completo"
                    class="q-mb-md"
                    :rules="[val => !!val || 'Campo obrigatório']"
                  />

                  <q-input
                    v-model="editForm.phone"
                    outlined
                    label="Telefone"
                    mask="+### ## ### ####"
                    unmasked-value
                    class="q-mb-md"
                    :rules="[
                      val => !!val || 'Campo obrigatório',
                      val => val.length >= 9 || 'Telefone inválido'
                    ]"
                  />

                  <q-input
                    v-model="editForm.email"
                    outlined
                    label="Email"
                    type="email"
                    class="q-mb-md"
                    :rules="[
                      val => !val || /.+@.+\..+/.test(val) || 'Email inválido'
                    ]"
                  />

                  <q-select
                    v-model="editForm.status"
                    outlined
                    label="Status"
                    :options="statusOptions"
                    emit-value
                    map-options
                    class="q-mb-md"
                  />
                </div>

                <!-- Subscription Info -->
                <div class="col-12 col-md-6">
                  <h3 class="text-h6 text-weight-bold q-mb-md">Informações de Assinatura</h3>

                  <q-select
                    v-model="editForm.subscription.plan"
                    outlined
                    label="Plano"
                    :options="planOptions"
                    class="q-mb-md"
                  />

                  <q-select
                    v-model="editForm.subscription.status"
                    outlined
                    label="Status da Assinatura"
                    :options="subscriptionStatusOptions"
                    emit-value
                    map-options
                    class="q-mb-md"
                  />

                  <q-input
                    v-model.number="editForm.subscription.amount"
                    outlined
                    label="Valor (MZN)"
                    type="number"
                    prefix="MZN"
                    class="q-mb-md"
                  />

                  <q-select
                    v-model="editForm.subscription.method"
                    outlined
                    label="Método de Pagamento"
                    :options="paymentMethodOptions"
                    class="q-mb-md"
                  />

                  <q-input
                    v-model="editForm.subscription.start_date"
                    outlined
                    label="Data de Início"
                    type="date"
                    class="q-mb-md"
                  />

                  <q-input
                    v-model="editForm.subscription.next_payment"
                    outlined
                    label="Próximo Pagamento"
                    type="date"
                    class="q-mb-md"
                  />
                </div>
              </div>

              <q-card-actions align="right" class="q-pa-none q-mt-lg">
                <q-btn
                  label="Cancelar"
                  color="negative"
                  flat
                  @click="cancelEdit"
                  class="q-mr-sm"
                />
                <q-btn
                  label="Salvar Alterações"
                  color="positive"
                  type="submit"
                  :loading="saveLoading"
                />
              </q-card-actions>
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Empty State -->
      <div class="col-12" v-if="!clientData && !searchLoading">
        <q-card class="empty-state-card">
          <q-card-section class="text-center">
            <q-icon name="search_off" size="xl" color="grey-5" class="q-mb-md" />
            <h3 class="text-h5 text-weight-bold q-mb-sm">Nenhum usuário seleccionado</h3>
            <p class="text-grey-7">Digite um telefone, nome ou ID para pesquisar um cliente</p>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'

export default {
  setup() {
    const $q = useQuasar()
    const searchQuery = ref('')
    const searchLoading = ref(false)
    const clientData = ref(null)
    const editMode = ref(false)
    const saveLoading = ref(false)
    const fileInput = ref(null)

    const editForm = ref({
      name: '',
      phone: '',
      email: '',
      avatar: '',
      status: 'active',
      subscription: {
        plan: '',
        status: 'active',
        amount: 0,
        method: '',
        start_date: '',
        next_payment: ''
      }
    })

    const statusOptions = [
      { label: 'Ativo', value: 'active' },
      { label: 'Inativo', value: 'inactive' }
    ]

    const planOptions = [
      'Premium', 'Standard', 'Básico', 'Personalizado'
    ]

    const subscriptionStatusOptions = [
      { label: 'Ativo', value: 'active' },
      { label: 'Inativo', value: 'inactive' },
      { label: 'Suspenso', value: 'suspended' },
      { label: 'Cancelado', value: 'cancelled' }
    ]

    const paymentMethodOptions = [
      'Mpesa', 'E-Mola', 'Visa', 'Mastercard', 'Transferência Bancária', 'Dinheiro'
    ]

    const searchClient = () => {
      if (!searchQuery.value) return

      searchLoading.value = true

      api.get(`/users/filter/?telefone=${encodeURIComponent(searchQuery.value)}`)
        .then(response => {
          console.log('API response:', response.data)

          if (Array.isArray(response.data) && response.data.length > 0) {
            const raw = response.data[0]

            clientData.value = {
              id: raw.id,
              name: `${raw.name ?? ''} ${raw.apelido ?? ''}`.trim(),
              phone: raw.telefone ?? '-',
              email: raw.email ?? '-',
              avatar: raw.image || 'https://cdn.quasar.dev/img/avatar.png',
              status: 'active',
              join_date: raw.createdAt ?? '',

              subscription: {
                plan: raw.payments?.[0]?.category ?? 'Sem Plano',
                status: 'active',
                amount: 0,
                method: raw.payments?.[0]?.payedByNumber ?? '-',
                start_date: raw.payments?.[0]?.startAt ?? '',
                next_payment: raw.payments?.[0]?.endAt ?? ''
              },

              payments: (raw.payments || []).map((p, i) => ({
                id: i,
                date: p.startAt,
                amount: 0,
                reference: p.category,
                status: 'paid'
              }))
            }
          } else {
            clientData.value = null
          }
        })
        .catch(err => {
          console.error('Erro na busca:', err)
          clientData.value = null
        })
        .finally(() => {
          searchLoading.value = false
        })
    }

    const resetSearch = () => {
      searchQuery.value = ''
      clientData.value = null
      editMode.value = false
    }

    const enterEditMode = () => {
      editForm.value = {
        name: clientData.value.name,
        phone: clientData.value.phone,
        email: clientData.value.email,
        avatar: clientData.value.avatar,
        status: clientData.value.status,
        subscription: {
          plan: clientData.value.subscription.plan,
          status: clientData.value.subscription.status,
          amount: clientData.value.subscription.amount,
          method: clientData.value.subscription.method,
          start_date: formatDateForInput(clientData.value.subscription.start_date),
          next_payment: formatDateForInput(clientData.value.subscription.next_payment)
        }
      }
      editMode.value = true
    }

    const cancelEdit = () => {
      editMode.value = false
    }

    const saveChanges = () => {
      saveLoading.value = true

      // Aqui você faria a chamada API para salvar as alterações
      // api.put(`/users/${clientData.value.id}`, editForm.value)
      //   .then(response => {
      //     // Atualiza os dados do cliente com a resposta
      //     clientData.value = {
      //       ...clientData.value,
      //       ...editForm.value,
      //       subscription: {
      //         ...clientData.value.subscription,
      //         ...editForm.value.subscription
      //       }
      //     }
      //     editMode.value = false
      //     $q.notify({
      //       type: 'positive',
      //       message: 'Alterações salvas com sucesso!'
      //     })
      //   })
      //   .catch(err => {
      //     console.error('Erro ao salvar:', err)
      //     $q.notify({
      //       type: 'negative',
      //       message: 'Erro ao salvar alterações'
      //     })
      //   })
      //   .finally(() => {
      //     saveLoading.value = false
      //   })

      // Simulação de salvamento (remova quando implementar a API real)
      setTimeout(() => {
        clientData.value = {
          ...clientData.value,
          ...editForm.value,
          subscription: {
            ...clientData.value.subscription,
            ...editForm.value.subscription
          }
        }
        editMode.value = false
        saveLoading.value = false
        $q.notify({
          type: 'positive',
          message: 'Alterações salvas com sucesso!'
        })
      }, 1000)
    }

    const triggerFileInput = () => {
      fileInput.value.click()
    }

    const handleFileUpload = (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          editForm.value.avatar = e.target.result
        }
        reader.readAsDataURL(file)
      }
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-'
      const options = { year: 'numeric', month: 'long', day: 'numeric' }
      return new Date(dateString).toLocaleDateString('pt-MZ', options)
    }

    const formatDateForInput = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    }

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN'
      }).format(value)
    }

    const isDateFuture = (dateString) => {
      if (!dateString) return false
      return new Date(dateString) > new Date()
    }

    return {
      searchQuery,
      searchLoading,
      clientData,
      editMode,
      editForm,
      saveLoading,
      fileInput,
      statusOptions,
      planOptions,
      subscriptionStatusOptions,
      paymentMethodOptions,
      searchClient,
      resetSearch,
      enterEditMode,
      cancelEdit,
      saveChanges,
      triggerFileInput,
      handleFileUpload,
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

.edit-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  .q-card__section {
    padding: 24px;
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
