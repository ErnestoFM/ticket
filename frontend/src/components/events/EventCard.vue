<script setup>
const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <article class="event-card">
    <img v-if="event.posterUrl" :src="event.posterUrl" :alt="event.title" />
    <div class="event-card__content">
      <h3>{{ event.title }}</h3>
      <p>{{ new Date(event.date).toLocaleString() }}</p>
      <p>{{ event.venue?.name }} · {{ event.venue?.city }}</p>
      <router-link :to="`/events/${event.id}`" class="primary">{{ $t('events.details') }}</router-link>
    </div>
  </article>
</template>
