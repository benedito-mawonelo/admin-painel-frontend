<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h4 text-weight-bold">Gestão de Usuários</div>
      <q-space />
      <q-btn
        color="primary"
        icon="add"
        label="Novo Usuário"
        @click="showUserForm(null)"
        class="q-ml-md"
      />
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
        @request="onRequest"
        binary-state-sort
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
              flat
              round
              :color="props.row.status === 'active' ? 'negative' : 'positive'"
              :icon="props.row.status === 'active' ? 'block' : 'check'"
              @click="toggleUserStatus(props.row)"
            >
              <q-tooltip>{{ props.row.status === 'active' ? 'Desativar' : 'Ativar' }} usuário</q-tooltip>
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
                    <div class="text-subtitle2 q-mb-sm">Perfis do usuário</div>
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
          <div class="text-h6">{{ formUser.id ? 'Editar Usuário' : 'Novo Usuário' }}</div>
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
                  label="Status"
                  outlined
                />
              </div>
              <div class="col-12">
                <q-select
                  v-model="formUser.roles"
                  :options="roleOptions"
                  label="Perfis"
                  outlined
                  multiple
                  use-chips
                  :rules="[val => val && val.length > 0 || 'Selecione pelo menos um perfil']"
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
export default {
  name: 'UsersPage',
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
      formUser: this.getDefaultUser(),
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
          label: 'Perfis',
          field: row => row.roles.join(', '),
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
      roleOptions: [
        'Administrador', 'Gerente', 'Usuário', 'Suporte', 'Financeiro'
      ],
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
  created() {
    this.loadUsers();
  },
  methods: {
    loadUsers() {
      this.loading = true;
      // Simulação de chamada API
      setTimeout(() => {
        this.users = [
          {
            id: 1,
            name: 'Estevão Sitefane',
            email: 'mawonelo@gmail.com',
            phone: '+258 841313121',
            cpf: '123.456.789-00',
            birth_date: '1990-05-15',
            status: 'active',
            roles: ['Administrador', 'Gerente'],
            permissions: ['users.create', 'users.delete'],
            address: 'Rua das Flores, 123 - Maputo',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
            created_at: new Date('2023-01-15')
          },
          {
            id: 1,
            name: 'Benedito Muianga',
            email: 'bennedito01@gmail.com',
            phone: '+258 972720108',
            cpf: '123.456.789-00',
            birth_date: '1999-05-15',
            status: 'active',
            roles: ['Administrador', 'Gerente'],
            permissions: ['users.create', 'users.delete'],
            address: 'Magoanine c, 22 - Maputo',
            avatar: 'https://randomuser.me/api/portraits/men/36.jpg',
            created_at: new Date('2023-01-15')
          },
          {
            id: 2,
            name: 'Gracinda Manhiça',
            email: 'gracinda@gmail.com',
            phone: '+258 843746364',
            cpf: '987.654.321-00',
            birth_date: '1985-08-22',
            status: 'active',
            roles: ['Usuário'],
            permissions: [],
            address: 'Matola cimento, 456 - Matola',
            avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
            created_at: new Date('2023-02-20')
          },
          {
            id: 3,
            name: 'Sara Maxalela',
            email: 'Sara@example.com',
            phone: '+258 843434227',
            cpf: '456.789.123-00',
            birth_date: '1978-11-30',
            status: 'inactive',
            roles: ['Financeiro'],
            permissions: ['financial.reports'],
            address: 'Rua das Pedras, 789 - Belo Horizonte/MG',
            avatar: 'https://randomuser.me/api/portraits/women/45.jpg',
            created_at: new Date('2023-03-10')
          }
        ];
        this.filteredUsers = [...this.users];
        this.pagination.rowsNumber = this.users.length;
        this.loading = false;
      }, 800);
    },
      filterUsers() {
      this.loading = true;
      // Filtro por telefone
      let filtered = this.users;

      if (this.searchPhone) {
        const phoneToSearch = this.searchPhone.replace(/\D/g, '');
        filtered = filtered.filter(user =>
          user.phone.replace(/\D/g, '').includes(phoneToSearch)
        ); // Aqui faltava o parêntese de fechamento
      }

      // Filtro por status
      if (this.statusFilter) {
        filtered = filtered.filter(user => user.status === this.statusFilter.value);
      }

      // Filtro por perfis
      if (this.roleFilter && this.roleFilter.length > 0) {
        filtered = filtered.filter(user =>
          this.roleFilter.some(role => user.roles.includes(role))
        ); // Aqui faltava o parêntese de fechamento
      }

      this.filteredUsers = filtered;
      this.pagination.rowsNumber = filtered.length;
      this.loading = false;
    },

    onRequest(props) {
      const { page, rowsPerPage, sortBy, descending } = props.pagination;

      // Ordenação
      let sorted = [...this.filteredUsers];
      if (sortBy) {
        sorted.sort((a, b) => {
          const x = descending ? b : a;
          const y = descending ? a : b;

          if (sortBy === 'roles') {
            return x.roles.join(', ').localeCompare(y.roles.join(', '));
          }

          return x[sortBy] < y[sortBy] ? -1 : x[sortBy] > y[sortBy] ? 1 : 0;
        });
      }

      // Paginação
      const startRow = (page - 1) * rowsPerPage;
      const paginated = sorted.slice(startRow, startRow + rowsPerPage);

      this.pagination = {
        ...props.pagination,
        rowsNumber: this.filteredUsers.length
      };

      this.filteredUsers = paginated;
    },
    viewUser(user) {
      this.selectedUser = { ...user };
      this.userDialog = true;
    },
    showUserForm(user) {
      this.formUser = user ? { ...user } : this.getDefaultUser();
      this.userFormDialog = true;
    },
    getDefaultUser() {
      return {
        name: '',
        email: '',
        phone: '',
        cpf: '',
        birth_date: '',
        status: 'active',
        roles: [],
        permissions: [],
        address: '',
        password: ''
      };
    },
    saveUser() {
      this.loading = true;
      // Simulação de chamada API
      setTimeout(() => {
        if (this.formUser.id) {
          // Atualizar usuário existente
          const index = this.users.findIndex(u => u.id === this.formUser.id);
          if (index !== -1) {
            this.users[index] = { ...this.formUser };
          }
        } else {
          // Criar novo usuário
          const newUser = {
            ...this.formUser,
            id: Math.max(...this.users.map(u => u.id)) + 1,
            created_at: new Date(),
            avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg`
          };
          this.users.unshift(newUser);
        }

        this.filterUsers();
        this.userFormDialog = false;
        this.loading = false;

        this.$q.notify({
          type: 'positive',
          message: `Usuário ${this.formUser.id ? 'atualizado' : 'criado'} com sucesso!`
        });
      }, 1000);
    },
    toggleUserStatus(user) {
      this.loading = true;
      // Simulação de chamada API
      setTimeout(() => {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index].status = user.status === 'active' ? 'inactive' : 'active';
          this.filterUsers();

          this.$q.notify({
            type: 'positive',
            message: `Usuário ${user.status === 'active' ? 'desativado' : 'ativado'} com sucesso!`
          });
        }
        this.loading = false;
      }, 800);
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
