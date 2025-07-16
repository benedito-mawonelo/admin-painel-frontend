<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-1">
    <q-header elevated class="bg-green-10 text-white" style="height: 70px">
      <q-toolbar class="q-py-sm">
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
          class="q-mr-sm"
        />

        <q-toolbar-title class="text-h5 text-weight-bold">
          <div class="row items-center">
            <q-icon name="insights" size="md" class="q-mr-sm" color="accent" />
            <span>Mawonelo</span>
          </div>
        </q-toolbar-title>

        <q-space />

        <div class="row items-center q-gutter-x-sm">
          <q-btn flat round dense icon="search" />

          <q-btn round flat class="relative-position">
            <q-icon name="notifications" size="20px" />
            <q-badge color="red" floating rounded>3</q-badge>
          </q-btn>

          <q-btn round flat class="glow-avatar">
            <q-avatar size="36px">
              <img src="https://cdn.quasar.dev/img/avatar3.jpg">
            </q-avatar>
            <q-menu anchor="bottom right" self="top right" class="shadow-5">
              <q-list style="min-width: 180px" class="text-dark">
                <q-item clickable v-close-popup class="text-dark">
                  <q-item-section avatar>
                    <q-icon name="person" color="primary" />
                  </q-item-section>
                  <q-item-section>Meu Perfil</q-item-section>
                </q-item>
                <q-item clickable v-close-popup class="text-dark">
                  <q-item-section avatar>
                    <q-icon name="settings" color="primary" />
                  </q-item-section>
                  <q-item-section>Configurações</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup class="text-dark">
                  <q-item-section avatar>
                    <q-icon name="logout" color="negative" />
                  </q-item-section>
                  <q-item-section>Sair</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="280"
      class="bg-green-10 text-white"
    >
      <q-scroll-area class="fit">
        <div class="q-pa-md text-center q-mb-md">
          <q-avatar size="70px" class="q-mb-sm">
            <img src="https://cdn.quasar.dev/img/avatar3.jpg">
          </q-avatar>
          <div class="text-h6 text-weight-medium">Olá, Admin</div>
          <div class="text-caption text-grey-5">Bem-vindo de volta</div>
        </div>

        <q-separator color="grey-8" />

        <q-list padding class="menu-list">
          <q-item clickable active v-ripple to="/" class="text-white">
            <q-item-section avatar>
              <q-icon name="dashboard" color="accent" />
            </q-item-section>
            <q-item-section>
              <div class="text-weight-medium">Dashboard</div>
            </q-item-section>
            <q-item-section side>
              <q-badge color="accent" rounded />
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/reports" class="text-white">
            <q-item-section avatar>
              <q-icon name="assessment" color="blue-3" />
            </q-item-section>
            <q-item-section>
              <div class="text-weight-medium">Usuários</div>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/users" class="text-white">
            <q-item-section avatar>
              <q-icon name="group" color="teal-3" />
            </q-item-section>
            <q-item-section>
              <div class="text-weight-medium">Trabalhadores</div>
            </q-item-section>
            <q-item-section side>
              <q-badge color="teal" label="5" rounded />
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/payments" class="text-white">
            <q-item-section avatar>
              <q-icon name="paid" color="green-3" />
            </q-item-section>
            <q-item-section>
              <div class="text-weight-medium">Pagamentos</div>
            </q-item-section>
          </q-item>

          <q-separator color="grey-8" class="q-my-md" />

          <q-item-label header class="text-uppercase text-grey-5 q-pl-md">
            Configurações
          </q-item-label>

          <q-item clickable v-ripple class="text-white">
            <q-item-section avatar>
              <q-icon name="settings" color="orange-3" />
            </q-item-section>
            <q-item-section>
              <div class="text-weight-medium">Configurações</div>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple class="text-white">
            <q-item-section avatar>
              <q-icon name="help_outline" color="purple-3" />
            </q-item-section>
            <q-item-section>
              <div class="text-weight-medium">Ajuda & Suporte</div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>

      <div class="absolute-bottom q-pa-md">
        <q-btn
          outline
          rounded
          color="accent"
          icon="brightness_4"
          label="Modo Escuro"
          class="full-width"
          @click="toggleDarkMode"
        />
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { ref } from 'vue'
import { useQuasar } from 'quasar'

export default {
  setup () {
    const $q = useQuasar()
    const leftDrawerOpen = ref(false)

    const toggleDarkMode = () => {
      $q.dark.toggle()
    }

    return {
      leftDrawerOpen,
      toggleDarkMode
    }
  }
}
</script>

<style lang="scss">


.menu-list {
  .q-item {
    border-radius: 8px;
    margin: 4px 8px;
    transition: all 0.3s ease;

    &.q-router-link--active, &:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateX(4px);

      .q-icon {
        transform: scale(1.1);
      }
    }

    .q-icon {
      transition: all 0.3s ease;
    }
  }
}

.q-header {
  background: linear-gradient(145deg, #1e1e2d, #2a2a3a);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.q-drawer {
  background: linear-gradient(180deg, #1e1e2d, #252535);
  border-right: none !important;

  .q-item__label--header {
    font-size: 0.75rem;
    letter-spacing: 1px;
    padding: 16px 0 8px;
  }
}

.glow-avatar {
  transition: all 0.3s ease;

  &:hover {
    filter: drop-shadow(0 0 8px rgba(100, 150, 255, 0.5));
  }
}

.q-page-container {
  background: #f5f7fa;
}

// Dark mode styles
.body--dark {
  .q-page-container {
    background: #121212;
  }

  .q-drawer {
    background: #1e1e1e;
  }

  .q-header {
    background: linear-gradient(145deg, #121212, #1e1e1e);
  }
}
</style>
