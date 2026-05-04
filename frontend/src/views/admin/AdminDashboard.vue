<template>
  <section class="page">
    <h2>{{ $t('admin.dashboard') }}</h2>
    <p class="muted">{{ $t('admin.dashboardSubtitle') }}</p>

    <div class="admin-grid">
      <router-link class="admin-card" to="/admin/events">
        <h3>{{ $t('admin.events') }}</h3>
        <p>{{ $t('admin.eventsDescription') }}</p>
      </router-link>
      <router-link class="admin-card" to="/admin/venues">
        <h3>{{ $t('admin.venues') }}</h3>
        <p>{{ $t('admin.venuesDescription') }}</p>
      </router-link>
      <router-link class="admin-card" to="/admin/users">
        <h3>{{ $t('admin.users') }}</h3>
        <p>{{ $t('admin.usersDescription') }}</p>
      </router-link>
      <router-link class="admin-card" to="/admin/reports">
        <h3>{{ $t('admin.reports') }}</h3>
        <p>{{ $t('admin.reportsDescription') }}</p>
      </router-link>
    </div>
  </section>
</template>
