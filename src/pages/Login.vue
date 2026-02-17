<!-- src/pages/Login.vue -->
<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-1">
    <q-page-container>
      <q-page class="full-height column flex-center">
        <q-card class="login-card shadow-10 q-pa-lg">
          <q-card-section class="text-center">
            <q-avatar size="80px" class="q-mb-md">
              <img src="https://cdn.quasar.dev/img/avatar3.jpg" alt="Logo" />
            </q-avatar>
            <h1 class="text-h5 text-weight-bold text-green-10">Mawonelo</h1>
            <div class="text-subtitle1 text-grey-7 q-mb-md">Faça login para continuar</div>
          </q-card-section>

          <q-card-section>
            <q-form @submit="login" greedy>
              <q-input
                v-model="form.username"
                outlined
                label="Usuário"
                class="q-mb-md"
                :rules="[val => !!val || 'Campo obrigatório']"
                lazy-rules
              >
                <template v-slot:prepend>
                  <q-icon name="person" color="green-10" />
                </template>
              </q-input>

              <q-input
                v-model="form.password"
                outlined
                label="Senha"
                :type="showPassword ? 'text' : 'password'"
                class="q-mb-md"
                :rules="[val => !!val || 'Campo obrigatório', val => val.length >= 6 || 'Mínimo 6 caracteres']"
                lazy-rules
              >
                <template v-slot:prepend>
                  <q-icon name="lock" color="green-10" />
                </template>
                <template v-slot:append>
                  <q-icon
                    :name="showPassword ? 'visibility' : 'visibility_off'"
                    class="cursor-pointer"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </q-input>

              <q-btn
                color="green-10"
                text-color="white"
                label="Entrar"
                type="submit"
                class="full-width q-mt-md"
                :loading="loading"
                rounded
              />
            </q-form>
          </q-card-section>

          <q-card-section class="text-center">
            <q-btn flat color="grey-7" label="Esqueceu a senha?" to="/forgot-password" />
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { useRouter } from 'vue-router'

export default {
  name: 'LoginPage',
  setup() {
    const $q = useQuasar()
    const router = useRouter()
    const form = ref({
      username: '',
      password: ''
    })
    const loading = ref(false)
    const showPassword = ref(false)

    const login = async () => {
      loading.value = true
      try {
        // Carta Fácil: JWT em /api/auth/login/ → { access, refresh }
        const response = await api.post('/auth/login/', {
          username: form.value.username,
          password: form.value.password
        })
        const { access, refresh } = response.data
        localStorage.setItem('auth_token', access)
        if (refresh) localStorage.setItem('auth_refresh_token', refresh)
        $q.notify({
          type: 'positive',
          message: 'Login realizado com sucesso!'
        })
        router.push('/')
      } catch (error) {
        const msg = error.response?.data?.error || error.response?.data?.non_field_errors?.[0] || 'Erro ao fazer login'
        $q.notify({
          type: 'negative',
          message: msg
        })
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      loading,
      showPassword,
      login
    }
  }
}
</script>

<style lang="scss" scoped>
.full-height {
  height: 100vh;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: linear-gradient(145deg, #ffffff, #f5f7fa);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }

  .q-btn {
    transition: all 0.3s ease;
    font-weight: 500;
  }

  .q-input {
    .q-field__control {
      background: rgba(255, 255, 255, 0.9);
      border-radius: 8px;
    }
  }
}

.body--dark {
  .login-card {
    background: linear-gradient(145deg, #1e1e2d, #252535);
    color: #ffffff;

    .q-field__control {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>
