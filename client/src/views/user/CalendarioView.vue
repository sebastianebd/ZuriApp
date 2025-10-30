<template>
  <main>
    <div class="rounded-xl shadow-md p-4 h-[80vh] overflow-auto">
      <FullCalendar :options="calendarOptions" />
    </div>
  </main>
</template>

<script lang="ts">
import { ref, onMounted, type Ref, nextTick } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Calendario',
  components: {
    FullCalendar
  },
  setup() {
    const nombresaliente: Ref<string> = ref('')
    const isModalOpen: Ref<boolean> = ref(false)
    const selectedDate: Ref<string> = ref('')
    const selectedEvent: Ref<any> = ref(null)
    const events: Ref<any[]> = ref([])
    const calendar: Ref<InstanceType<typeof FullCalendar> | null> = ref(null)

    const handleDateClick = (arg: any) => {
      selectedDate.value = arg.dateStr
      selectedEvent.value = events.value.find(
        (event) =>
          new Date(event.start) <= new Date(arg.dateStr) &&
          new Date(arg.dateStr) <= new Date(event.end)
      )
      isModalOpen.value = true
    }

    const calendarOptions: Ref<any> = ref({
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      dateClick: handleDateClick,
      events: events.value,
      height: '80vh',
      contentHeight: '80vh',
      aspectRatio: 1.5,
      locale: 'es',
      firstDay: 1,
      buttonText:{
        today: 'Hoy',
        month: 'Mes',
        week: 'Semana',
        day: 'Día'
      },
    },
  )

    onMounted(() => {
      nextTick(() => {
        if (calendar.value && calendar.value.getApi) {
          calendar.value.getApi().render()
        }
      })
    })

    return {
      calendarOptions,
      isModalOpen,
      selectedDate,
      selectedEvent,
      nombresaliente,
      calendar,
      handleDateClick
    }
  }
}
</script>

<style >

.fc-col-header-cell-cushion {
  text-transform: capitalize;
  color: #6f32c4;
}


.fc-daygrid-day-number {
  color: #6f32c4;  /* gris oscuro tipo Bootstrap */
  font-weight: 600;
}

.fc-toolbar-title {
  text-transform: capitalize;
  color: #4d02a1; /* azul Bootstrap */
  font-weight: bold;
}


</style>
