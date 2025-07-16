<template>
  <div class="auth-page row items-center justify-center">
    <div class="col-12 col-sm-8 col-md-6 col-lg-4">
      <q-card class="auth-card q-pa-lg shadow-10">
        <q-card-section class="text-center">
          <div class="text-h4 text-primary q-mb-sm">Welcome Back</div>
          <div class="text-grey-7">Sign in to access your dashboard</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="handleLogin" class="q-gutter-y-md">
            <q-input
              v-model="form.email"
              label="Email"
              outlined
              lazy-rules
              :rules="[val => !!val || 'Email is required']"
              type="email"
            >
              <template v-slot:prepend>
                <q-icon name="email" />
              </template>
            </q-input>

            <q-input
              v-model="form.password"
              label="Password"
              outlined
              lazy-rules
              :rules="[val => !!val || 'Password is required']"
              :type="showPassword ? 'text' : 'password'"
            >
              <template v-slot:prepend>
                <q-icon name="lock" />
              </template>
              <template v-slot:append>
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>

            <div class="row items-center justify-between">
              <q-checkbox v-model="form.remember" label="Remember me" />
              <q-btn
                flat
                label="Forgot password?"
                no-caps
                color="primary"
                size="sm"
                to="/forgot-password"
              />
            </div>

            <div>
              <q-btn
                type="submit"
                label="Login"
                color="primary"
                class="full-width"
                size="lg"
                :loading="loading"
              />
            </div>
          </q-form>
        </q-card-section>

        <q-separator class="q-my-md" />

        <q-card-section class="text-center">
          <div class="text-grey-7 q-mb-sm">Don't have an account?</div>
          <q-btn
            label="Create an account"
            no-caps
            flat
            color="primary"
            to="/register"
          />
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const router = useRouter()

const form = ref({
  email: '',
  password: '',
  remember: false
})

const showPassword = ref(false)
const loading = ref(false)

const handleLogin = () => {
  loading.value = true

  // Simulate API call
  setTimeout(() => {
    loading.value = false
    $q.notify({
      message: 'Login successful',
      color: 'positive',
      icon: 'check_circle'
    })
    router.push('/dashboard')
  }, 1500)
}
</script>

<style lang="scss">
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, rgba($primary, 0.1) 0%, rgba($primary, 0.05) 100%);

  .auth-card {
    border-radius: 12px;
    transform: translateY(0);
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }
  }
}
</style>
