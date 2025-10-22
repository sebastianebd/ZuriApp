<template>
  
  <div id="login">
    <h6 class="card-title">Bievenid@ a ZuriApp</h6>
    <div class="container">
      <div class="card card-body mt-4">

        <h6 class="card-title">Inicio de sesion</h6>
        <form @submit.prevent="submit">
          <div class="mb-3">
            <label for="email" class="form-label">Rut</label>
            <input v-model="loginData.rut" type="text" class="form-control" id="email" autocomplete="off">
          </div>
          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input v-model="loginData.password" type="password" class="form-control" id="password">
          </div>
          <button type="submit" class="btn btn-warning">Ingresar</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore, type LoginData } from '../../stores/auth';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const authStore = useAuthStore()
const router = useRouter()

const loginData = reactive<LoginData>({
  rut: "",
  password: "",
})

const errorMessage = ref<string>("")

async function submit(){
  await authStore.login(loginData)
    .then(res => {
      router.replace({name: "calendario"})
    })
    .catch(err => {
      errorMessage.value = err.message
    })
}

</script>

<style scoped>
#login .card{
  max-width: 25vw;
  margin: left;
}
textarea:focus, input:focus, input[type]:focus {
border-color: rgb(255, 144, 0);
box-shadow: 0 1px 1px rgba(229, 103, 23, 0.075)inset, 0 0 8px rgba(255,144,0,0.6);
outline: 0 none;
}
.container {
  margin-top: 10rem;
  padding-left: 18rem;
}
</style>