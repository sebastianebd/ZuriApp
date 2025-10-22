<template>
	<aside v-if="isAuthenticated" :class="`${is_expanded ? 'is-expanded' : ''}`">
		<div class="logo">
			<img :src="logoURL" alt="Xu" /> 
		</div>

		<div class="menu-toggle-wrap">
			<button class="menu-toggle" @click="ToggleMenu">
				<span class="material-icons">keyboard_double_arrow_right</span>
			</button>
		</div>
		<h3>Calendario</h3>
		<div class="menu">
			<router-link to="calendario" class="button" >
				<span class="material-icons">calendar_month</span>
				<span class="text">Calendario</span>
			</router-link>

		</div>
		<h3>Turnos</h3>
		<div class="menu">
			<router-link :to="{ name: 'reemplazos' }" class="button">
				<span class="material-icons">edit_document</span>
				<span class="text">Reemplazos</span>
			</router-link>
			<router-link :to="{ name: 'ver_historial' }" class="button" >
				<span class="material-icons">manage_search</span>
				<span class="text">Historial</span>
			</router-link>
		</div>

		<h3>Usuarios</h3>
		<div class="menu">
			<router-link to="/ver_usuarios" class="button">
				<span class="material-icons">groups</span>
				<span class="text">Usuarios</span>
			</router-link>
		</div>


		
	</aside>
</template>

<script lang="ts" setup>
import { ref, computed, defineEmits } from 'vue'
import logoURL from '../assets/logo-zuri.png'
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)

const is_expanded = ref(localStorage.getItem("is_expanded") === "true")

const emitSidebarToggle = defineEmits(['sidebarToggle']);
const ToggleMenu = () => {
	is_expanded.value = !is_expanded.value
	localStorage.setItem("is_expanded", is_expanded.value.toString())
	emitSidebarToggle('sidebarToggle', is_expanded.value);
}


</script>

<style lang="scss" scoped>
aside {
	display: flex;
	flex-direction: column;
	position: fixed;
	top: 0;
	left: 0;


	background-color: rgba(221, 102, 44);
	color: var(--light);

	width: calc(3.5rem + 32px);
	overflow: hidden;
	min-height: 100vh;
	padding: 1rem;

	transition: 0.2s ease-in-out;

	.flex {
		flex: 1 1 0%;
	}

	.logo {
		margin-bottom: 0.2rem;
		display: flex;

		img {
			width: 3rem;
		}
	}

	.menu-toggle-wrap {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 1rem;

		position: relative;
		top: 0;
		transition: 0.2s ease-in-out;

		.menu-toggle {
			transition: 0.2s ease-in-out;
			.material-icons {
				font-size: 2rem;
				color: var(--light);
				transition: 0.2s ease-out;
			}
			
			&:hover {
				.material-icons {
					color: var(--primary);
					transform: translateX(0.5rem);
				}
			}
		}
	}

	h3, .button .text {
		opacity: 0;
		transition: opacity 0.3s ease-in-out;
	}

	h3 {
		color: rgb(59, 58, 58);
		font-size: 0.875rem;
		margin-bottom: 0.7rem;
		text-transform: uppercase;
		margin-top: 1rem;
	}

	.menu {
		margin: 0 -1rem;

		.button {
			display: flex;
			align-items: center;
			text-decoration: none;

			transition: 0.2s ease-in-out;
			padding: 0.5rem 1rem;

			.material-icons {
				font-size: 1.7rem;
				color: var(--light);
				transition: 0.2s ease-in-out;
			}
			.text {
				color: var(--light);
				transition: 0.2s ease-in-out;
			}

			&:hover {
				background-color: rgba(191, 26, 34, 0.48);

				.material-icons, .text {
					color: var(--primary);
				}
			}

			&.router-link-exact-active {
				background-color: rgb(191, 26, 33);
				border-right: 5px solid var(--primary);

				.material-icons, .text {
					color: var(--primary);
				}
			}
		}
	}

	.footer {
		opacity: 0;
		transition: opacity 0.3s ease-in-out;

		p {
			font-size: 0.875rem;
			color: var(--grey);
		}
	}

	&.is-expanded {
		width: var(--sidebar-width);

		.menu-toggle-wrap {
			top: -3rem;
			
			.menu-toggle {
				transform: rotate(-180deg);
			}
		}

		h3, .button .text {
			opacity: 1;
		}

		.button {
			.material-icons {
				margin-right: 1rem;
			}
		}

		.footer {
			opacity: 0;
		}
	}

	@media (max-width: 1024px) {
		position: absolute;
		z-index: 99;
	}
}
</style>