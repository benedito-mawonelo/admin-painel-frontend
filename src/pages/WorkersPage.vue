<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h4 text-weight-bold">Gestão de Funcionarios</div>
      <q-space />
      <q-btn
        color="primary"
        icon="add"
        outline
        label="Novo utilizador com painel"
        class="q-ml-md"
        @click="hintCreateStaff"
      >
        <q-tooltip>Criação de contas com acesso ao painel continua no Django Admin</q-tooltip>
      </q-btn>
    </div>

    <!-- Filtros e busca -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model="searchPhone"
              label="Filtrar por telefone"
              placeholder="Digite o telefone"
              clearable
              outlined
              mask="(##) #####-####"
              @keyup.enter="filterUsers"
            >
              <template v-slot:append>
                <q-icon name="search" @click="filterUsers" class="cursor-pointer" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-4">
            <q-select
              v-model="statusFilter"
              :options="statusOptions"
              label="Filtrar por status"
              outlined
              clearable
              @update:model-value="filterUsers"
            />
          </div>

          <div class="col-12 col-md-4">
            <q-select
              v-model="roleFilter"
              :options="roleOptions"
              label="Filtrar por perfil"
              outlined
              clearable
              multiple
              use-chips
              @update:model-value="filterUsers"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Tabela de usuários -->
    <q-card flat bordered>
      <q-table
        :rows="filteredUsers"
        :columns="columns"
        row-key="id"
        :loading="loading"
        v-model:pagination="pagination"
        flat
      >
        <template v-slot:body-cell-avatar="props">
          <q-td :props="props">
            <q-avatar size="40px">
              <img :src="props.row.avatar || 'https://cdn.quasar.dev/img/avatar.png'">
            </q-avatar>
          </q-td>
        </template>

        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-badge
              :color="props.row.status === 'active' ? 'positive' : 'negative'"
              :label="props.row.status === 'active' ? 'Ativo' : 'Inativo'"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              flat
              round
              color="primary"
              icon="visibility"
              @click="viewUser(props.row)"
            >
              <q-tooltip>Visualizar detalhes</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              color="secondary"
              icon="edit"
              @click="showUserForm(props.row)"
              class="q-mx-sm"
            >
              <q-tooltip>Editar usuário</q-tooltip>
            </q-btn>
            <q-btn
              v-if="isSuperUserMe"
              flat
              round
              :color="props.row.status === 'active' ? 'negative' : 'positive'"
              :icon="props.row.status === 'active' ? 'block' : 'check'"
              @click="toggleUserStatus(props.row)"
            >
              <q-tooltip>{{ props.row.status === 'active' ? 'Desativar' : 'Ativar' }} conta</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Dialog de detalhes do usuário -->
    <q-dialog v-model="userDialog" maximized>
      <q-card style="width: 800px; max-width: 90vw;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Detalhes do Usuário</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedUser" class="q-pt-none">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-avatar size="120px" class="q-mb-md">
                <img :src="selectedUser.avatar || 'https://cdn.quasar.dev/img/avatar.png'">
              </q-avatar>
              <div class="text-h6">{{ selectedUser.name }}</div>
              <div class="text-subtitle1">{{ selectedUser.email }}</div>
              <div class="text-caption q-mt-sm">
                <q-icon name="phone" class="q-mr-xs" />
                {{ selectedUser.phone }}
              </div>
              <q-chip
                :color="selectedUser.status === 'active' ? 'positive' : 'negative'"
                text-color="white"
              >
                {{ selectedUser.status === 'active' ? 'Ativo' : 'Inativo' }}
              </q-chip>
            </div>

            <div class="col-12 col-md-8">
              <q-tabs
                v-model="userDetailsTab"
                dense
                class="text-grey"
                active-color="primary"
                indicator-color="primary"
                align="justify"
                narrow-indicator
              >
                <q-tab name="info" label="Informações" />
                <q-tab name="permissions" label="Permissões" />
                <q-tab name="activity" label="Atividades" />
              </q-tabs>

              <q-separator />

              <q-tab-panels v-model="userDetailsTab" animated>
                <q-tab-panel name="info">
                  <div class="row q-col-gutter-y-md">
                    <div class="col-12 col-md-6">
                      <div class="text-caption text-grey">Nome completo</div>
                      <div>{{ selectedUser.name }}</div>
                    </div>
                    <div class="col-12 col-md-6">
                      <div class="text-caption text-grey">Login (username)</div>
                      <div>{{ selectedUser.username || '—' }}</div>
                    </div>
                    <div class="col-12 col-md-6">
                      <div class="text-caption text-grey">CPF</div>
                      <div>{{ selectedUser.cpf || 'Não informado' }}</div>
                    </div>
                    <div class="col-12 col-md-6">
                      <div class="text-caption text-grey">Data de Nascimento</div>
                      <div>{{ selectedUser.birth_date || 'Não informado' }}</div>
                    </div>
                    <div class="col-12 col-md-6">
                      <div class="text-caption text-grey">Data de Cadastro</div>
                      <div>{{ formatDate(selectedUser.created_at) }}</div>
                    </div>
                    <div class="col-12">
                      <div class="text-caption text-grey">Endereço</div>
                      <div>{{ selectedUser.address || 'Não informado' }}</div>
                    </div>
                  </div>
                </q-tab-panel>

                <q-tab-panel name="permissions">
                  <div class="q-mb-md">
                    <div class="text-caption text-grey q-mb-xs">Nível de acesso Django (identificação no painel)</div>
                    <q-badge
                      :color="selectedUser.is_superuser ? 'purple' : 'primary'"
                      :label="selectedUser.is_superuser ? 'Superuser (superadmin)' : 'Staff (acesso ao painel)'"
                      class="q-mb-sm"
                    />
                    <div v-if="selectedUser.profile_role" class="text-body2 q-mb-md">
                      Função na app: <strong>{{ selectedUser.profile_role }}</strong>
                    </div>
                    <div class="text-subtitle2 q-mb-sm">Etiquetas na lista</div>
                    <div class="row q-col-gutter-sm">
                      <div class="col-auto" v-for="role in selectedUser.roles" :key="role">
                        <q-chip color="primary" text-color="white">{{ role }}</q-chip>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div class="text-subtitle2 q-mb-sm">Permissões específicas</div>
                    <q-list bordered separator v-if="selectedUser.permissions && selectedUser.permissions.length">
                      <q-item v-for="permission in selectedUser.permissions" :key="permission">
                        <q-item-section>{{ permission }}</q-item-section>
                      </q-item>
                    </q-list>
                    <div v-else class="text-grey">Nenhuma permissão específica</div>
                  </div>
                </q-tab-panel>

                <q-tab-panel name="activity">
                  <div class="text-subtitle2 q-mb-sm">Últimas atividades</div>
                  <q-timeline color="secondary">
                    <q-timeline-entry
                      v-for="activity in userActivities"
                      :key="activity.id"
                      :title="activity.title"
                      :subtitle="formatDate(activity.date)"
                      :icon="activity.icon"
                    >
                      <div>{{ activity.description }}</div>
                    </q-timeline-entry>
                  </q-timeline>
                </q-tab-panel>
              </q-tab-panels>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Formulário de usuário -->
    <q-dialog v-model="userFormDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ formUser.id ? 'Editar funcionário' : 'Novo utilizador' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveUser">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formUser.name"
                  label="Nome completo"
                  outlined
                  :rules="[val => !!val || 'Campo obrigatório']"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formUser.email"
                  label="E-mail"
                  type="email"
                  outlined
                  :rules="[val => !!val || 'Campo obrigatório', val => /.+@.+\..+/.test(val) || 'E-mail inválido']"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formUser.phone"
                  label="Telefone"
                  outlined
                  mask="(##) #####-####"
                  :rules="[val => !!val || 'Campo obrigatório']"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formUser.cpf"
                  label="CPF"
                  outlined
                  mask="###.###.###-##"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formUser.birth_date"
                  label="Data de Nascimento"
                  outlined
                  type="date"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-select
                  v-model="formUser.status"
                  :options="statusOptions"
                  option-value="value"
                  option-label="label"
                  emit-value
                  map-options
                  label="Conta activa"
                  outlined
                  :disable="!isSuperUserMe"
                  :hint="isSuperUserMe ? '' : 'Só o superadmin pode activar ou desactivar contas.'"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formUser.username"
                  label="Login (username)"
                  outlined
                  readonly
                  hint="Não pode ser alterado aqui"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-select
                  v-model="formUser.profile_role_id"
                  :options="appRolesOptions"
                  option-value="value"
                  option-label="label"
                  emit-value
                  map-options
                  clearable
                  outlined
                  label="Função na app (perfil)"
                  hint="Papel associado ao UserProfile no Django"
                />
              </div>
              <div v-if="isSuperUserMe" class="col-12 col-md-6">
                <q-select
                  v-model="formUser.panel_access"
                  :options="panelAccessOptions"
                  option-value="value"
                  option-label="label"
                  emit-value
                  map-options
                  outlined
                  label="Acesso ao painel (Django)"
                  hint="Staff: painel sem superuser. Superadmin: superuser."
                />
              </div>
              <div class="col-12">
                <q-input
                  v-model="formUser.address"
                  label="Endereço"
                  outlined
                  type="textarea"
                  autogrow
                />
              </div>
              <div class="col-12" v-if="!formUser.id">
                <q-input
                  v-model="formUser.password"
                  label="Senha"
                  outlined
                  :type="isPwd ? 'password' : 'text'"
                  :rules="[val => !!val || 'Campo obrigatório', val => val.length >= 6 || 'Mínimo 6 caracteres']"
                >
                  <template v-slot:append>
                    <q-icon
                      :name="isPwd ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="isPwd = !isPwd"
                    />
                  </template>
                </q-input>
              </div>
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Salvar" @click="saveUser" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { api } from 'boot/axios'

export default {
  name: 'WorkersPage',
  data() {
    return {
      loading: false,
      searchPhone: '',
      statusFilter: null,
      roleFilter: null,
      userDialog: false,
      userFormDialog: false,
      userDetailsTab: 'info',
      selectedUser: null,
      formUser: {
        id: null,
        username: '',
        name: '',
        email: '',
        phone: '',
        cpf: '',
        birth_date: '',
        status: 'active',
        profile_role_id: null,
        panel_access: 'staff',
        permissions: [],
        address: '',
        password: ''
      },
      isSuperUserMe: false,
      appRolesOptions: [],
      panelAccessOptions: [
        { label: 'Staff (acesso ao painel)', value: 'staff' },
        { label: 'Superadmin (superuser)', value: 'superadmin' },
      ],
      isPwd: true,
      pagination: {
        sortBy: 'name',
        descending: false,
        page: 1,
        rowsPerPage: 10,
        rowsNumber: 0
      },
      columns: [
        {
          name: 'avatar',
          label: '',
          field: 'avatar',
          align: 'center',
          sortable: false
        },
        {
          name: 'name',
          label: 'Nome',
          field: 'name',
          align: 'left',
          sortable: true
        },
        {
          name: 'username',
          label: 'Login (username)',
          field: 'username',
          align: 'left',
          sortable: true
        },
        {
          name: 'email',
          label: 'E-mail',
          field: 'email',
          align: 'left',
          sortable: true
        },
        {
          name: 'phone',
          label: 'Telefone',
          field: 'phone',
          align: 'left',
          sortable: true
        },
        {
          name: 'status',
          label: 'Status',
          field: 'status',
          align: 'center',
          sortable: true
        },
        {
          name: 'roles',
          label: 'Perfis / nível',
          field: row => (row.roles || []).join(', '),
          align: 'left',
          sortable: true
        },
        {
          name: 'actions',
          label: 'Ações',
          field: '',
          align: 'center',
          sortable: false
        }
      ],
      users: [],
      filteredUsers: [],
      statusOptions: [
        { label: 'Ativo', value: 'active' },
        { label: 'Inativo', value: 'inactive' }
      ],
      roleOptions: ['Superadmin', 'Staff do painel'],
      userActivities: [
        {
          id: 1,
          title: 'Login realizado',
          description: 'O usuário acessou o sistema',
          date: new Date(Date.now() - 3600000),
          icon: 'login'
        },
        {
          id: 2,
          title: 'Perfil atualizado',
          description: 'Dados pessoais foram modificados',
          date: new Date(Date.now() - 86400000),
          icon: 'edit'
        },
        {
          id: 3,
          title: 'Senha alterada',
          description: 'A senha foi redefinida',
          date: new Date(Date.now() - 172800000),
          icon: 'lock'
        }
      ]
    }
  },
  async created() {
    await Promise.all([this.loadMe(), this.loadAppRoles()])
    await this.loadUsers()
  },
  methods: {
    async loadUsers() {
      this.loading = true
      try {
        const { data } = await api.get('/users/staff/')
        const list = Array.isArray(data) ? data : []
        this.users = list.map((u) => this.mapStaffFromApi(u))
        this.applyFilters()
      } catch (e) {
        const msg =
          e.response?.data?.detail ||
          (typeof e.response?.data === 'string' ? e.response.data : null) ||
          e.message ||
          'Erro ao carregar funcionários'
        this.$q.notify({ type: 'negative', message: msg })
        this.users = []
        this.filteredUsers = []
        this.pagination.rowsNumber = 0
      } finally {
        this.loading = false
      }
    },
    mapStaffFromApi(u) {
      const roles = []
      if (u.is_superuser) {
        roles.push('Superadmin')
      } else {
        roles.push('Staff do painel')
      }
      if (u.profile_role) {
        roles.push(`Função app: ${u.profile_role}`)
      }
      const name =
        (u.display_name || '').trim() ||
        [u.first_name, u.last_name].filter(Boolean).join(' ').trim() ||
        u.username ||
        `#${u.id}`
      return {
        id: u.id,
        username: u.username || '',
        name,
        email: u.email || '',
        phone: u.telefone || '',
        status: u.is_active ? 'active' : 'inactive',
        roles,
        profile_role: u.profile_role || null,
        profile_role_id: u.profile_role_id != null ? u.profile_role_id : null,
        is_superuser: !!u.is_superuser,
        cpf: '',
        birth_date: '',
        permissions: [],
        address: '',
        avatar: null,
        created_at: u.date_joined,
        last_login: u.last_login
      }
    },
    filterUsers() {
      this.loading = true
      this.applyFilters()
      this.loading = false
    },
    applyFilters() {
      let filtered = [...this.users]

      if (this.searchPhone) {
        const phoneToSearch = this.searchPhone.replace(/\D/g, '')
        if (phoneToSearch) {
          filtered = filtered.filter((user) =>
            (user.phone || '').replace(/\D/g, '').includes(phoneToSearch)
          )
        }
      }

      if (this.statusFilter) {
        filtered = filtered.filter((user) => user.status === this.statusFilter.value)
      }

      if (this.roleFilter && this.roleFilter.length > 0) {
        filtered = filtered.filter((user) =>
          this.roleFilter.some((role) => {
            if (role === 'Superadmin') return !!user.is_superuser
            if (role === 'Staff do painel') return !user.is_superuser
            return (user.roles || []).includes(role)
          })
        )
      }

      this.filteredUsers = filtered
      this.pagination.rowsNumber = filtered.length
      this.pagination.page = 1
    },
    viewUser(user) {
      this.selectedUser = { ...user };
      this.userDialog = true;
    },
    hintCreateStaff() {
      this.$q.notify({
        type: 'info',
        message:
          'Para criar uma conta nova com acesso ao painel, use o Django Admin → Utilizadores → Adicionar (marque «Acesso à equipa» / staff e defina a palavra-passe). Depois pode ajustar nome, função na app e superadmin aqui.',
        timeout: 8000,
      })
    },
    async loadMe() {
      try {
        const { data } = await api.get('/me/')
        this.isSuperUserMe = !!data.is_superuser
      } catch {
        this.isSuperUserMe = false
      }
    },
    async loadAppRoles() {
      try {
        const { data } = await api.get('/users/roles/')
        const list = Array.isArray(data) ? data : []
        this.appRolesOptions = list.map((r) => ({ label: r.name, value: r.id }))
      } catch {
        this.appRolesOptions = []
      }
    },
    async showUserForm(user) {
      if (!user) {
        this.hintCreateStaff()
        return
      }
      this.loading = true
      try {
        const { data } = await api.get(`/users/${user.id}/`)
        const name = [data.first_name, data.last_name].filter(Boolean).join(' ').trim() || data.username || ''
        const prof = data.profile && data.profile.role
        this.formUser = {
          id: data.id,
          username: data.username || '',
          name,
          email: data.email || '',
          phone: data.telefone || '',
          cpf: '',
          birth_date: '',
          status: data.is_active === false ? 'inactive' : 'active',
          profile_role_id: prof && prof.id != null ? prof.id : null,
          panel_access: data.is_superuser ? 'superadmin' : 'staff',
          permissions: [],
          address: '',
          password: '',
        }
        this.userFormDialog = true
      } catch (e) {
        const msg =
          e.response?.data?.detail ||
          e.response?.data?.error ||
          e.message ||
          'Erro ao carregar utilizador'
        this.$q.notify({ type: 'negative', message: String(msg) })
      } finally {
        this.loading = false
      }
    },
    getDefaultUser() {
      return {
        id: null,
        username: '',
        name: '',
        email: '',
        phone: '',
        cpf: '',
        birth_date: '',
        status: 'active',
        profile_role_id: null,
        panel_access: 'staff',
        permissions: [],
        address: '',
        password: '',
      }
    },
    async saveUser() {
      if (!this.formUser.id) {
        this.hintCreateStaff()
        return
      }
      const name = (this.formUser.name || '').trim()
      if (!name) {
        this.$q.notify({ type: 'warning', message: 'Indique o nome.' })
        return
      }
      this.loading = true
      try {
        const payload = {
          name,
          email: (this.formUser.email || '').trim(),
          telefone: (this.formUser.phone || '').replace(/\D/g, '').slice(0, 20),
          profile_role_id: this.formUser.profile_role_id,
        }
        const pwd = (this.formUser.password || '').trim()
        if (pwd.length >= 6) {
          payload.password = pwd
        }
        if (this.isSuperUserMe) {
          payload.is_active = this.formUser.status === 'active'
          payload.is_staff = true
          payload.is_superuser = this.formUser.panel_access === 'superadmin'
        }
        await api.patch(`/users/${this.formUser.id}/`, payload)
        this.$q.notify({ type: 'positive', message: 'Funcionário actualizado.' })
        this.userFormDialog = false
        await this.loadUsers()
      } catch (e) {
        const msg =
          e.response?.data?.error ||
          e.response?.data?.detail ||
          e.message ||
          'Erro ao guardar'
        this.$q.notify({ type: 'negative', message: String(msg) })
      } finally {
        this.loading = false
      }
    },
    async toggleUserStatus(user) {
      if (!this.isSuperUserMe) {
        this.$q.notify({
          type: 'info',
          message: 'Só o superadmin pode activar ou desactivar contas do painel.',
        })
        return
      }
      this.loading = true
      try {
        await api.patch(`/users/${user.id}/`, {
          is_active: user.status !== 'active',
        })
        this.$q.notify({
          type: 'positive',
          message: user.status === 'active' ? 'Conta desactivada.' : 'Conta activada.',
        })
        await this.loadUsers()
      } catch (e) {
        const msg =
          e.response?.data?.error ||
          e.response?.data?.detail ||
          e.message ||
          'Erro ao actualizar'
        this.$q.notify({ type: 'negative', message: String(msg) })
      } finally {
        this.loading = false
      }
    },
    formatDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.q-table {
  thead tr {
    th {
      font-weight: bold;
      font-size: 1rem;
    }
  }

  tbody tr {
    transition: background-color 0.3s;

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
  }
}

.q-timeline {
  max-height: 400px;
  overflow-y: auto;
}
</style>
