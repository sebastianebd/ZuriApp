<template>
  <main>
      <FullCalendar :options="calendarOptions"/>
  </main>
</template>



<script lang="ts">
import { ref, onMounted, type Ref, nextTick } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export default {
name: 'Calendario',
components: {
  FullCalendar,
},
setup() {
  const nombresaliente: Ref<string> = ref("");
  const isModalOpen: Ref<boolean> = ref(false);
  const selectedDate: Ref<string> = ref('');
  const selectedEvent: Ref<any> = ref(null); 
  const events: Ref<any[]> = ref([]);
  const calendar: Ref<InstanceType<typeof FullCalendar> | null> = ref(null);

  const handleDateClick = (arg: any) => {
    selectedDate.value = arg.dateStr;
    selectedEvent.value = events.value.find(event => 
      new Date(event.start) <= new Date(arg.dateStr) && new Date(arg.dateStr) <= new Date(event.end)
    ); 
    isModalOpen.value = true;
  };





  const calendarOptions: Ref<any> = ref({
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      dateClick: handleDateClick,
      events: events.value
  });

  onMounted(() => {
      nextTick(() => {
      if (calendar.value && calendar.value.getApi) {
          calendar.value.getApi().render();
      }
      });
  });

  return {
      calendarOptions,
      isModalOpen,
      selectedDate,
      selectedEvent, 
      nombresaliente,
      calendar,
      handleDateClick,

      
  };
},
};
</script>
