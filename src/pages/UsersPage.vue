<template>
  <q-page class="service-page">
    <!-- Search Section -->
    <div class="row q-col-gutter-lg">
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
                <q-btn
                  color="positive"
                  label="Nova Conta"
                  class="full-height q-ml-sm"
                  @click="showCreateUserDialog"
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
                <img :src="clientData.image || 'https://cdn.quasar.dev/img/avatar.png'" />
              </q-avatar>

              <div>
                <h2 class="text-h5 text-weight-bold q-mb-xs">
                  {{ clientData.name }} {{ clientData.apelido }}
                </h2>
                <div class="text-subtitle1">
                  <q-icon name="phone" class="q-mr-xs" />
                  {{ clientData.telefone }}
                </div>
                <div class="text-subtitle2 q-mt-xs row items-center">
                  <span class="text-grey-7">Senha:</span>
                  <span class="q-ml-sm">{{ clientData.password || 'Não definida (use Editar para redefinir)' }}</span>
                  <q-btn
                    v-if="clientData.password"
                    flat
                    round
                    dense
                    size="sm"
                    icon="content_copy"
                    color="primary"
                    class="q-ml-xs"
                    @click="copyPassword(clientData.password)"
                  >
                    <q-tooltip>Copiar senha</q-tooltip>
                  </q-btn>
                </div>
              </div>

              <q-space />

              <div class="text-right">
                <div class="text-caption q-mt-xs">
                  Membro desde {{ formatDate(clientData.createdAt) }}
                </div>
              </div>
            </div>

            <q-separator class="q-mb-lg" />

            <!-- Subscription Section -->
            <div class="row q-col-gutter-lg">
              <div class="col-12">
                <h3 class="text-h6 text-weight-bold q-mb-md">Assinaturas</h3>

                <div v-if="clientData.payments && clientData.payments.length > 0">
                  <q-tabs
                    v-model="activeSubscriptionTab"
                    dense
                    class="bg-grey-2"
                    active-color="primary"
                    indicator-color="primary"
                    align="left"
                    narrow-indicator
                  >
                    <q-tab
                      v-for="(subscription, index) in clientData.payments"
                      :key="index"
                      :name="index"
                      :label="subscription.category || `Plano ${index + 1}`"
                    />
                  </q-tabs>

                  <q-tab-panels v-model="activeSubscriptionTab" animated>
                    <q-tab-panel
                      v-for="(subscription, index) in clientData.payments"
                      :key="index"
                      :name="index"
                    >
                      <div class="subscription-info">
                        <div class="row items-center q-mb-sm">
                          <div class="col-4 col-md-2 text-grey-7">Plano:</div>
                          <div class="col-8 col-md-4 text-weight-bold text-capitalize">
                            {{ subscription.category }}
                          </div>

                          <div class="col-4 col-md-2 text-grey-7">Status:</div>
                          <div class="col-8 col-md-4">
                            <q-badge :color="getSubscriptionStatusColor(subscription)">
                              {{ getSubscriptionStatus(subscription) }}
                            </q-badge>
                          </div>
                        </div>

                        <div class="row items-center q-mb-sm">
                          <div class="col-4 col-md-2 text-grey-7">Pagamento:</div>
                          <div class="col-8 col-md-4 text-weight-bold">
                            {{ subscription.payedByNumber }}
                          </div>

                          <div class="col-4 col-md-2 text-grey-7">Início:</div>
                          <div class="col-8 col-md-4">{{ formatDate(subscription.startAt) }}</div>
                        </div>

                        <div class="row items-center">
                          <div class="col-4 col-md-2 text-grey-7">Expira em:</div>
                          <div class="col-8 col-md-4">
                            <span
                              :class="{
                                'text-positive': isDateFuture(subscription.endAt),
                                'text-negative': !isDateFuture(subscription.endAt),
                              }"
                            >
                              {{ formatDate(subscription.endAt) }}
                            </span>
                          </div>

                          <div class="col-4 col-md-2 text-grey-7">Dias restantes:</div>
                          <div class="col-8 col-md-4">
                            {{ getDaysRemaining(subscription.endAt) }}
                          </div>
                        </div>
                      </div>
                    </q-tab-panel>
                  </q-tab-panels>
                </div>

                <div v-else class="text-grey-7">Nenhuma assinatura ativa</div>
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn color="primary" label="Editar Perfil" outline @click="enterEditMode" />

            <q-btn color="primary" label="Enviar Mensagem" />
            <q-btn
              color="secondary"
              label="Adicionar Assinatura"
              @click="showAddSubscriptionDialog"
            />
          </q-card-actions>
        </q-card>
      </div>

      <!-- Edit Mode Section -->
      <div class="col-12" v-if="clientData && editMode">
        <q-card class="edit-card">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <div class="text-h5 text-weight-bold">Editar Perfil</div>
              <q-space />
              <q-btn icon="close" flat round dense @click="cancelEdit" />
            </div>

            <q-form @submit="saveChanges">
              <div class="row q-col-gutter-lg">
                <!-- Personal Info -->
                <div class="col-12 col-md-6">
                  <h3 class="text-h6 text-weight-bold q-mb-md">Informações Pessoais</h3>

                  <div class="row items-center q-mb-md">
                    <q-avatar size="80px" class="q-mr-md">
                      <img :src="editForm.image || 'https://cdn.quasar.dev/img/avatar.png'" />
                    </q-avatar>
                    <q-btn color="primary" label="Alterar Foto" outline @click="triggerFileInput" />
                    <input
                      type="file"
                      ref="fileInput"
                      style="display: none"
                      accept="image/*"
                      @change="handleFileUpload"
                    />
                  </div>

                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-6">
                      <q-input
                        v-model="editForm.name"
                        outlined
                        label="Nome"
                        class="q-mb-md"
                        :rules="[(val) => !!val || 'Campo obrigatório']"
                      />
                    </div>
                    <div class="col-12 col-md-6">
                      <q-input
                        v-model="editForm.apelido"
                        outlined
                        label="Apelido"
                        class="q-mb-md"
                      />
                    </div>
                  </div>

                  <q-input
                    v-model="editForm.telefone"
                    outlined
                    label="Telefone"
                    mask="###########"
                    unmasked-value
                    class="q-mb-md"
                    :rules="[
                      (val) => !!val || 'Campo obrigatório',
                      (val) => val.length >= 8 || 'Telefone inválido',
                    ]"
                  />
                  <!-- <q-input
                    v-model="editForm.password"
                    outlined
                    label="Senha"
                    class="q-mb-md"
                    readonly
                  /> -->

                  <div class="row items-center q-mb-md">
                    <q-input
                      v-model="editForm.password"
                      outlined
                      label="Senha actual (só leitura)"
                      readonly
                      class="col"
                      :hint="editForm.password ? 'Senha guardada no sistema' : 'Sem senha guardada. Defina uma abaixo.'"
                    />
                    <q-btn
                      v-if="editForm.password"
                      flat
                      round
                      icon="content_copy"
                      color="primary"
                      class="q-ml-sm"
                      @click="copyPassword(editForm.password)"
                      dense
                    />
                  </div>
                  <div class="row items-center q-mb-md">
                    <q-input
                      v-model="editForm.newPassword"
                      outlined
                      type="password"
                      label="Nova senha (redefinir)"
                      placeholder="Mín. 6 caracteres"
                      class="col"
                      clearable
                    />
                    <q-btn
                      label="Aplicar"
                      color="primary"
                      outline
                      class="q-ml-sm"
                      :loading="passwordLoading"
                      :disable="!editForm.newPassword || editForm.newPassword.length < 6"
                      @click="applyNewPassword"
                    />
                  </div>

                  <q-input
                    v-model="editForm.email"
                    outlined
                    label="Email"
                    type="email"
                    class="q-mb-md"
                    :rules="[(val) => !val || /.+@.+\..+/.test(val) || 'Email inválido']"
                  />

                  <q-select
                    v-model="editForm.gender"
                    outlined
                    label="Gênero"
                    :options="genderOptions"
                    class="q-mb-md"
                  />

                  <q-input
                    v-model="editForm.birthYear"
                    outlined
                    label="Ano de Nascimento"
                    type="number"
                    class="q-mb-md"
                  />

                  <q-select
                    v-model="editForm.provincia"
                    outlined
                    label="Província"
                    :options="provinceOptions"
                    class="q-mb-md"
                  />
                </div>

                <!-- Subscription Info -->
                <div class="col-12 col-md-6">
                  <div class="row items-center justify-between q-mb-md">
                    <h3 class="text-h6 text-weight-bold">Assinaturas</h3>
                    <q-btn
                      color="primary"
                      label="Adicionar Plano"
                      icon="add"
                      dense
                      @click="addNewSubscription"
                    />
                  </div>

                  <q-tabs
                    v-model="activeEditSubscriptionTab"
                    dense
                    class="bg-grey-2"
                    active-color="primary"
                    indicator-color="primary"
                    align="left"
                    narrow-indicator
                  >
                    <q-tab
                      v-for="(subscription, index) in editForm.payments"
                      :key="index"
                      :name="index"
                      :label="subscription.category || `Plano ${index + 1}`"
                    >
                      <q-btn
                        icon="close"
                        dense
                        flat
                        round
                        size="xs"
                        @click.stop="removeSubscription(index)"
                        class="q-ml-xs"
                      />
                    </q-tab>
                  </q-tabs>

                  <q-tab-panels v-model="activeEditSubscriptionTab" animated>
                    <q-tab-panel
                      v-for="(subscription, index) in editForm.payments"
                      :key="index"
                      :name="index"
                    >
                      <div class="row q-col-gutter-md">
                        <div class="col-12 col-md-6">
                          <q-select
                            v-model="subscription.category"
                            outlined
                            label="Tipo de Plano"
                            :options="planOptions"
                            class="q-mb-md"
                            :rules="[(val) => !!val || 'Selecione um plano']"
                          />
                        </div>

                        <div class="col-12 col-md-6">
                          <q-input
                            v-model="subscription.payedByNumber"
                            outlined
                            label="Número de Pagamento"
                            mask="###########"
                            unmasked-value
                            class="q-mb-md"
                            :rules="[(val) => !!val || 'Campo obrigatório']"
                          />
                        </div>

                        <div class="col-12 col-md-6">
                          <q-input
                            v-model="subscription.startAt"
                            outlined
                            label="Data de Início"
                            type="date"
                            class="q-mb-md"
                          />
                        </div>

                        <div class="col-12 col-md-6">
                          <q-input
                            v-model="subscription.endAt"
                            outlined
                            label="Data de Expiração"
                            type="date"
                            class="q-mb-md"
                          />
                        </div>
                      </div>
                    </q-tab-panel>
                  </q-tab-panels>
                </div>
              </div>

              <q-card-actions align="right" class="q-pa-none q-mt-lg">
                <q-btn label="Cancelar" color="negative" flat @click="cancelEdit" class="q-mr-sm" />
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
      <div class="col-12" v-if="!clientData && !searchLoading && !showCreateUser">
        <q-card class="empty-state-card">
          <q-card-section class="text-center">
            <q-icon name="search_off" size="xl" color="grey-5" class="q-mb-md" />
            <h3 class="text-h5 text-weight-bold q-mb-sm">Nenhum usuário seleccionado</h3>
            <p class="text-grey-7">Digite um telefone, nome ou ID para pesquisar um cliente</p>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialog para adicionar nova assinatura -->
    <q-dialog v-model="addSubscriptionDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Adicionar Nova Assinatura</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-select
            v-model="newSubscription.category"
            outlined
            label="Tipo de Plano"
            :options="planOptions"
            class="q-mb-md"
          />

          <q-input
            v-model="newSubscription.payedByNumber"
            outlined
            label="Número de Pagamento"
            mask="###########"
            unmasked-value
            class="q-mb-md"
          />

          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-input
                v-model="newSubscription.startAt"
                outlined
                label="Data de Início"
                type="date"
              />
            </div>
            <div class="col-6">
              <q-input
                v-model="newSubscription.endAt"
                outlined
                label="Data de Expiração"
                type="date"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="negative" v-close-popup />
          <q-btn label="Adicionar" color="primary" @click="confirmAddSubscription" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- <q-dialog v-model="createUserDialog">
  <q-card style="min-width: 400px">
    <q-card-section>
      <div class="text-h6">Criar Nova Conta</div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <q-input v-model="newUser.name" outlined label="Nome" class="q-mb-md" />
      <q-input v-model="newUser.apelido" outlined label="Apelido" class="q-mb-md" />
      <q-input v-model="newUser.telefone" outlined label="Telefone" mask="###########" class="q-mb-md" />
      <q-input v-model="newUser.email" outlined label="Email" type="email" class="q-mb-md" />
      <q-input v-model="newUser.password" outlined label="Senha" type="password" class="q-mb-md" />

      <q-select v-model="newUser.gender" outlined label="Gênero" :options="genderOptions" class="q-mb-md" />
      <q-input v-model="newUser.birthYear" outlined label="Ano de Nascimento" type="number" class="q-mb-md" />
      <q-select v-model="newUser.provincia" outlined label="Província" :options="provinceOptions" class="q-mb-md" />
    </q-card-section>

    <q-card-actions align="right">
      <q-btn flat label="Cancelar" color="negative" v-close-popup />
      <q-btn label="Criar" color="positive" @click="createUser" />
    </q-card-actions>
  </q-card>
</q-dialog> -->

    <!-- Formulário de Criação de Usuário -->
    <div class="col-12" v-if="showCreateUser">
      <q-card class="q-pa-md q-mt-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">Criar Nova Conta</div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="newUser.name" outlined label="Nome" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="newUser.apelido" outlined label="Apelido" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="newUser.telefone" outlined label="Telefone" mask="###########" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="newUser.password" outlined label="Senha" type="password" />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="newUser.confirmPassword"
                outlined
                label="Confirmar Senha"
                type="password"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-select v-model="newUser.gender" outlined label="Gênero" :options="genderOptions" />
            </div>
            <div class="col-12 col-md-6">
              <q-select
                v-model="newUser.birthYear"
                outlined
                label="Ano de Nascimento"
                :options="birthYearOptions"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-select
                v-model="newUser.provincia"
                outlined
                label="Província"
                :options="provinceOptions"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="negative" @click="showCreateUser = false" />
          <q-btn label="Criar" color="positive" @click="createUser" />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { ref, watch } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import { date } from 'quasar'

export default {
  setup() {
    const $q = useQuasar()
    const searchQuery = ref('')
    const searchLoading = ref(false)
    const clientData = ref(null)
    const editMode = ref(false)
    const saveLoading = ref(false)
    const fileInput = ref(null)
    const activeSubscriptionTab = ref(0)
    const activeEditSubscriptionTab = ref(0)
    const addSubscriptionDialog = ref(false)
    const originalPaymentIds = ref([])

    const newSubscription = ref({
      category: '',
      payedByNumber: '',
      startAt: date.formatDate(Date.now(), 'YYYY-MM-DD'),
      endAt: date.formatDate(Date.now() + 30 * 24 * 60 * 60 * 1000, 'YYYY-MM-DD'),
    })

    const editForm = ref({
      id: '',
      name: '',
      apelido: '',
      telefone: '',
      email: '',
      image: '',
      gender: '',
      birthYear: '',
      provincia: '',
      payments: [],
      password: '',
      newPassword: '',
    })
    const passwordLoading = ref(false)

    const planOptions = [
      'ganha-facil',
      'videos-practical-pesado',
      'profissional',
      'videos',
      'ligeiro_pesado',
      'videos-practical-ligeiro',
    ]

    const genderOptions = ['Masculino', 'Feminino', 'Outro']
    const provinceOptions = [
      'Maputo',
      'Gaza',
      'Inhambane',
      'Sofala',
      'Manica',
      'Tete',
      'Zambézia',
      'Nampula',
      'Cabo Delgado',
      'Niassa',
    ]

    // Watcher para atualizar a validade quando a categoria ou data de início mudar
    watch(
      [() => newSubscription.value.category, () => newSubscription.value.startAt],
      ([newCategory, newStartAt]) => {
        const defaultValidityDays = newCategory === 'ganha-facil' ? 70 : 30
        const startDate = new Date(newStartAt || Date.now())
        newSubscription.value.endAt = date.formatDate(
          startDate.getTime() + defaultValidityDays * 24 * 60 * 60 * 1000,
          'YYYY-MM-DD',
        )
      },
    )

    const copyPassword = (password) => {
      if (!password) return
      navigator.clipboard
        .writeText(password)
        .then(() => {
          $q.notify({
            type: 'positive',
            message: 'Senha copiada para a área de transferência!',
          })
        })
        .catch(() => {
          $q.notify({
            type: 'negative',
            message: 'Não foi possível copiar a senha.',
          })
        })
    }

    const showAddSubscriptionDialog = () => {
      if (!clientData.value) {
        $q.notify({
          type: 'negative',
          message: 'Nenhum cliente seleccionado.',
        })
        return
      }
      // Inicializa com validade padrão de 30 dias
      newSubscription.value = {
        category: '',
        payedByNumber: clientData.value.telefone,
        startAt: date.formatDate(Date.now(), 'YYYY-MM-DD'),
        endAt: date.formatDate(Date.now() + 30 * 24 * 60 * 60 * 1000, 'YYYY-MM-DD'),
      }
      addSubscriptionDialog.value = true
    }

    const confirmAddSubscription = async () => {
      if (!clientData.value) {
        $q.notify({
          type: 'negative',
          message: 'Nenhum cliente seleccionado.',
        })
        return
      }

      if (!newSubscription.value.category) {
        $q.notify({
          type: 'warning',
          message: 'Por favor, selecione um tipo de plano.',
        })
        return
      }

      try {
        // Garante que a validade seja correta antes de salvar
        const defaultValidityDays = newSubscription.value.category === 'ganha-facil' ? 70 : 30
        newSubscription.value.endAt = date.formatDate(
          new Date(newSubscription.value.startAt).getTime() +
            defaultValidityDays * 24 * 60 * 60 * 1000,
          'YYYY-MM-DD',
        )

        // Carta Fácil: criar pagamento via endpoint admin
        await api.post('/payments/admin/add/', {
          user_id: clientData.value.id,
          category: newSubscription.value.category,
          start_at: newSubscription.value.startAt,
          end_at: newSubscription.value.endAt,
          phone_number: newSubscription.value.payedByNumber || clientData.value.telefone,
        })

        // Rebuscar user para actualizar lista de payments
        const res = await api.get(`/users/${clientData.value.id}/`)
        clientData.value = normalizeUser(res.data)
        addSubscriptionDialog.value = false
        $q.notify({
          type: 'positive',
          message: 'Assinatura adicionada com sucesso!',
        })
      } catch (err) {
        console.error('Erro ao adicionar assinatura:', err)
        $q.notify({
          type: 'negative',
          message: err.response?.data?.error || err.response?.data?.detail || 'Erro ao adicionar assinatura',
        })
      }
    }

    const addNewSubscription = () => {
      // Inicializa nova assinatura com validade padrão de 30 dias
      const newSub = {
        category: '',
        payedByNumber: editForm.value.telefone,
        startAt: date.formatDate(Date.now(), 'YYYY-MM-DD'),
        endAt: date.formatDate(Date.now() + 30 * 24 * 60 * 60 * 1000, 'YYYY-MM-DD'),
      }

      editForm.value.payments.push(newSub)
      activeEditSubscriptionTab.value = editForm.value.payments.length - 1
    }

    // Watcher para atualizar a validade das assinaturas no modo de edição
    watch(
      () => editForm.value.payments,
      (newPayments) => {
        newPayments.forEach((subscription) => {
          if (subscription.category && subscription.startAt) {
            const defaultValidityDays = subscription.category === 'ganha-facil' ? 70 : 30
            const startDate = new Date(subscription.startAt)
            subscription.endAt = date.formatDate(
              startDate.getTime() + defaultValidityDays * 24 * 60 * 60 * 1000,
              'YYYY-MM-DD',
            )
          }
        })
      },
      { deep: true },
    )

    const removeSubscription = (index) => {
      // if (editForm.value.payments.length <= 1) {
      //   $q.notify({
      //     type: 'warning',
      //     message: 'O usuário deve ter pelo menos uma assinatura'
      //   })
      //   return
      // }

      editForm.value.payments.splice(index, 1)
      if (activeEditSubscriptionTab.value >= editForm.value.payments.length) {
        activeEditSubscriptionTab.value = editForm.value.payments.length - 1
      }
    }

    // Normaliza user do Carta Fácil (first_name, last_name, payments com start_at/end_at) para o formato do painel
    const normalizeUser = (data) => {
      if (!data) return null
      const payments = (data.payments || []).map((p) => ({
        ...p,
        startAt: p.start_at || p.startAt,
        endAt: p.end_at || p.endAt,
        payedByNumber: p.phone_number || p.payedByNumber || data.telefone,
      }))
      return {
        ...data,
        name: [data.first_name, data.last_name].filter(Boolean).join(' ').trim() || data.username || 'Usuário',
        birthYear: data.birth_year ?? data.birthYear,
        createdAt: data.date_joined || data.createdAt,
        password: data.password_debug ?? data.password ?? '',
       
        payments,
      }
    
    }

    const searchClient = async () => {
      if (!searchQuery.value) {
        $q.notify({
          type: 'warning',
          message: 'Digite um telefone, nome ou ID para pesquisar',
        })
        return
      }

      searchLoading.value = true

      try {
        const response = await api.get(
          `/users/filter/?telefone=${encodeURIComponent(searchQuery.value)}`,
        )
        if (Array.isArray(response.data) && response.data.length > 0) {
          clientData.value = normalizeUser(response.data[0])
          $q.notify({
            type: 'positive',
            message: 'Usuário encontrado com sucesso!',
          })
        } else {
          clientData.value = null
          $q.notify({
            type: 'warning',
            message: 'Nenhum usuário encontrado',
          })
        }
      } catch (err) {
        console.error('Erro na busca:', err)
        clientData.value = null
        $q.notify({
          type: 'negative',
          message: err.response?.data?.error || err.response?.data?.detail || 'Erro ao buscar usuário',
        })
      } finally {
        searchLoading.value = false
      }
    }

    const resetSearch = () => {
      searchQuery.value = ''
      clientData.value = null
      editMode.value = false
      showCreateUser.value = false
    }

    const enterEditMode = () => {
      if (!clientData.value) return

      const payments = clientData.value.payments ? [...clientData.value.payments] : []
      editForm.value = {
        id: clientData.value.id,
        name: clientData.value.name,
        apelido: clientData.value.apelido,
        telefone: clientData.value.telefone,
        email: clientData.value.email,
        image: clientData.value.image,
        gender: clientData.value.gender,
        birthYear: clientData.value.birthYear,
        provincia: clientData.value.provincia,
        payments,
        password: clientData.value.password || '',
        newPassword: '',
      }
      originalPaymentIds.value = payments.map((p) => p.id).filter(Boolean)
      editMode.value = true
    }

    const cancelEdit = () => {
      editMode.value = false
    }

    const applyNewPassword = async () => {
      if (!editForm.value.newPassword || editForm.value.newPassword.length < 6) {
        $q.notify({ type: 'warning', message: 'Nova senha deve ter pelo menos 6 caracteres.' })
        return
      }
      passwordLoading.value = true
      try {
        await api.patch(`/users/${editForm.value.id}/`, { password: editForm.value.newPassword })
        editForm.value.password = editForm.value.newPassword
        editForm.value.newPassword = ''
        if (clientData.value && clientData.value.id === editForm.value.id) {
          clientData.value.password = editForm.value.password
        }
        $q.notify({ type: 'positive', message: 'Senha actualizada. O utilizador já pode usar esta senha para entrar.' })
      } catch (err) {
        $q.notify({
          type: 'negative',
          message: err.response?.data?.error || err.response?.data?.detail || 'Erro ao redefinir senha',
        })
      } finally {
        passwordLoading.value = false
      }
    }

    const saveChanges = async () => {
      saveLoading.value = true

      try {
        const payload = {
          name: editForm.value.name,
          apelido: editForm.value.apelido,
          telefone: editForm.value.telefone,
          email: editForm.value.email,
          gender: editForm.value.gender,
          birthYear: editForm.value.birthYear,
          provincia: editForm.value.provincia,
        }

        await api.patch(`/users/${editForm.value.id}/`, payload)

        const currentPayments = editForm.value.payments || []
        const originalIds = originalPaymentIds.value
        const toDeleteIds = originalIds.filter((id) => !currentPayments.some((p) => p.id === id))
        const toUpdate = currentPayments.filter((p) => p.id)
        const toCreate = currentPayments.filter((p) => !p.id)

        for (const id of toDeleteIds) {
          await api.delete(`/payments/admin/${id}/delete/`)
        }
        for (const p of toUpdate) {
          await api.patch(`/payments/admin/${p.id}/`, {
            category: p.category,
            start_at: p.startAt || p.start_at,
            end_at: p.endAt || p.end_at,
            phone_number: p.payedByNumber || p.phone_number || undefined,
            amount: p.amount,
          })
        }
        for (const p of toCreate) {
          if (p.category && (p.endAt || p.end_at)) {
            await api.post('/payments/admin/add/', {
              user_id: editForm.value.id,
              category: p.category,
              start_at: p.startAt || p.start_at,
              end_at: p.endAt || p.end_at,
              phone_number: p.payedByNumber || p.phone_number || undefined,
            })
          }
        }

        const response = await api.get(`/users/${editForm.value.id}/`)
        clientData.value = normalizeUser(response.data)
        editMode.value = false
        $q.notify({
          type: 'positive',
          message: 'Alterações salvas com sucesso!',
        })
      } catch (err) {
        console.error('Erro ao salvar:', err)
        $q.notify({
          type: 'negative',
          message: err.response?.data?.error || err.response?.data?.detail || 'Erro ao salvar alterações',
        })
      } finally {
        saveLoading.value = false
      }
    }

    const triggerFileInput = () => {
      fileInput.value.click()
    }

    const handleFileUpload = (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          editForm.value.image = e.target.result
        }
        reader.readAsDataURL(file)
      }
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-'
      return date.formatDate(dateString, 'DD/MM/YYYY')
    }

    const isDateFuture = (dateString) => {
      if (!dateString) return false
      return new Date(dateString) > new Date()
    }

    const getDaysRemaining = (endDate) => {
      if (!endDate) return '-'
      const today = new Date()
      const end = new Date(endDate)
      const diff = end - today
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

      if (days > 0) {
        return `${days} dias`
      } else if (days === 0) {
        return 'Hoje'
      } else {
        return `Expirado há ${Math.abs(days)} dias`
      }
    }

    const getSubscriptionStatus = (subscription) => {
      if (!subscription.endAt) return 'Desconhecido'
      return isDateFuture(subscription.endAt) ? 'Ativo' : 'Expirado'
    }

    const getSubscriptionStatusColor = (subscription) => {
      if (!subscription.endAt) return 'grey'
      return isDateFuture(subscription.endAt) ? 'positive' : 'negative'
    }

    //     const createUserDialog = ref(false)
    // const newUser = ref({
    //   name: '',
    //   apelido: '',
    //   telefone: '',
    //   email: '',
    //   password: '',
    //   gender: '',
    //   birthYear: '',
    //   provincia: ''
    // })

    // const showCreateUserDialog = () => {
    //   createUserDialog.value = true
    //   newUser.value = {
    //     name: '',
    //     apelido: '',
    //     telefone: '',
    //     email: '',
    //     password: '',
    //     gender: '',
    //     birthYear: '',
    //     provincia: ''
    //   }
    // }

    // const createUser = async () => {
    //   if (!newUser.value.telefone || !newUser.value.password) {
    //     $q.notify({ type: 'negative', message: 'Telefone e senha são obrigatórios!' })
    //     return
    //   }

    //   try {
    //     const response = await api.post('/client/register/', newUser.value)
    //     $q.notify({ type: 'positive', message: 'Usuário criado com sucesso!' })
    //     createUserDialog.value = false
    //     clientData.value = response.data
    //   } catch (err) {
    //     console.error(err)
    //     $q.notify({ type: 'negative', message: 'Erro ao criar usuário' })
    //   }
    // }

    const showCreateUser = ref(false)

    const newUser = ref({
      name: '',
      apelido: '',
      telefone: '',
      password: '',
      confirmPassword: '',
      gender: '',
      birthYear: null,
      provincia: '',
    })

    const currentYear = new Date().getFullYear()
    const birthYearOptions = Array.from({ length: 100 }, (_, i) => currentYear - i).filter(
      (y) => currentYear - y >= 17,
    )

    const resetNewUser = () => {
      newUser.value = {
        name: '',
        apelido: '',
        telefone: '',
        email: '',
        password: '',
        gender: '',
        birthYear: '',
        provincia: '',
      }
    }

    const showCreateUserDialog = () => {
      resetNewUser() // opcional, limpa o formulário
      searchQuery.value = ''
      clientData.value = null
      editMode.value = false
      showCreateUser.value = true
    }

    // const createUser = async () => {
    //   if (!newUser.value.telefone || !newUser.value.password) {
    //     $q.notify({ type: 'negative', message: 'Telefone e senha são obrigatórios!' })
    //     return
    //   }

    //   try {
    //     const response = await api.post('/client/register/', newUser.value)

    //     $q.notify({
    //       type: 'positive',
    //       message: response.data?.message || 'Usuário criado com sucesso!'
    //     })

    //     clientData.value = response.data
    //     resetNewUser()
    //   } catch (err) {
    //     console.error(err)

    //     const errorMsg =
    //       err.response?.data?.error ||
    //       err.response?.data?.detail ||
    //       'Erro ao criar usuário'

    //     $q.notify({ type: 'negative', message: errorMsg })
    //   }
    // }

    const createUser = async () => {
      if (!newUser.value.telefone || !newUser.value.password) {
        $q.notify({ type: 'negative', message: 'Telefone e senha são obrigatórios!' })
        return
      }

      if (newUser.value.password !== newUser.value.confirmPassword) {
        $q.notify({ type: 'negative', message: 'As senhas não coincidem!' })
        return
      }

      try {
        // Carta Fácil: POST /api/auth/register/ → { user, access, refresh }
        const response = await api.post('/auth/register/', {
          name: newUser.value.name,
          apelido: newUser.value.apelido,
          telefone: newUser.value.telefone,
          email: newUser.value.email || undefined,
          password: newUser.value.password,
        })
        const created = response.data?.user
        clientData.value = normalizeUser(created)
        $q.notify({
          type: 'positive',
          message: 'Usuário criado com sucesso!',
        })
        resetNewUser()
        showCreateUser.value = false
      } catch (err) {
        console.error(err)
        const errorMsg =
          err.response?.data?.error || err.response?.data?.detail || 'Erro ao criar usuário'
        $q.notify({ type: 'negative', message: errorMsg })
      }
    }

    return {
      searchQuery,
      searchLoading,
      clientData,
      editMode,
      editForm,
      saveLoading,
      fileInput,
      activeSubscriptionTab,
      activeEditSubscriptionTab,
      addSubscriptionDialog,
      newSubscription,
      planOptions,
      genderOptions,
      provinceOptions,
      searchClient,
      resetSearch,
      enterEditMode,
      cancelEdit,
      saveChanges,
      passwordLoading,
      applyNewPassword,
      triggerFileInput,
      handleFileUpload,
      formatDate,
      isDateFuture,
      getDaysRemaining,
      getSubscriptionStatus,
      getSubscriptionStatusColor,
      showAddSubscriptionDialog,
      confirmAddSubscription,
      addNewSubscription,
      removeSubscription,

      showCreateUser,
      newUser,
      createUser,
      resetNewUser,
      showCreateUserDialog,
      birthYearOptions,
      copyPassword,
    }
  },
}
</script>

<style lang="scss">
.service-page {
  padding: 24px;
  background-color: #f5f7fa;
}

.search-card,
.client-card,
.edit-card,
.empty-state-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.client-card,
.edit-card {
  .q-card__section {
    padding: 24px;
  }

  .q-card__actions {
    padding: 16px 24px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }
}

.empty-state-card {
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

.q-tab--active {
  background-color: rgba(25, 118, 210, 0.1);
}
</style>
