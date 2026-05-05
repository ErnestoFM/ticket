<script setup>
const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <article class="event-card glass-card">
    <div v-if="event.posterUrl" class="event-card__image-wrapper">
      <img :src="event.posterUrl" :alt="event.title" class="event-card__image" />
    </div>
    <div class="event-card__content">
      <h3>{{ event.title }}</h3>
      <p>{{ new Date(event.date).toLocaleString() }}</p>
      <p>{{ event.venue?.name }} · {{ event.venue?.city }}</p>
      <router-link :to="`/events/${event.id}`" class="primary">{{ $t('events.details') }}</router-link>
    </div>
  </article>
</template>

<style scoped>
.event-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}
.event-card__image-wrapper {
  width: 100%;
  height: 200px;
  overflow: hidden;
  border-bottom: 1px solid var(--border);
}
.event-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.event-card:hover .event-card__image {
  transform: scale(1.05);
}
.event-card__content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.event-card__content .primary {
  margin-top: auto;
}
</style>
