<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue';
import Sidebar from './components/SidebarMenu.vue';
import { ref } from 'vue';

const isExpanded = ref(localStorage.getItem("is_expanded") === "true");

const handleSidebarToggle = (value: boolean) => {
  isExpanded.value = value;
  localStorage.setItem("is_expanded", value.toString());
};

</script>

<template>
  <div id="app">


    <NavBar />
    <Sidebar @sidebarToggle="handleSidebarToggle" />
    <main class="main-content" :class="{ 'expanded': isExpanded }">
      <RouterView :class="{ 'expanded': isExpanded }" />
    	</main>
  
  </div>
</template>


<style lang="scss">
:root {
	--primary: #000000;
	--primary-alt: #22c55e;
	--grey: #64748b;
	--dark: #1e293b;
	--dark-alt: #334155;
	--light: #f1f5f9;
	--sidebar-width: 300px;
}

* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
	font-family: 'Fira sans', sans-serif;
}

body {
	background: var(--light);
}

button {
	cursor: pointer;
	appearance: none;
	border: none;
	outline: none;
	background: none;
}

.app {
	display: flex;
  flex: 1;
  padding: 2rem;

	main {
		flex: 1;
		padding: 2rem;

		@media (max-width: 1024px) {
			padding-left: 6rem;
		}
	}
}

.main-content {
  margin-left: 7rem;
  transition: margin-left 0.2s ease-in-out; /* Transición suave al expandir/contraer el Sidebar */
  flex: 1; /* Asegura que el contenido ocupe el espacio restante */
  padding: 2rem; /* Ajusta según sea necesario */

  &.expanded {
    margin-left: calc(var(--sidebar-width) + 3rem); /* Ajusta el ancho cuando el sidebar está expandido */
    transition: margin-left 0.2s ease-in-out; /* Transición suave al expandir/contraer el Sidebar */
  }
}

.RouterView {
  transition: margin-left 0.2s ease-in-out; /* Agrega una transición al cambiar el ancho */
  flex: 1; /* Asegura que el contenido ocupe el espacio restante */

  &.expanded {
    margin-left: calc(var(--sidebar-width) + 3rem); /* Ajusta el ancho cuando el sidebar está expandido */
    transition: margin-left 0.2s ease-in-out; /* Transición suave al expandir/contraer el Sidebar */
  }
}

</style>
