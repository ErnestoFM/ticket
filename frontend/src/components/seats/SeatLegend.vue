<template>
  <div class="seat-legend">
    <h4>{{ $t('seatMap.legend') }}</h4>
    <ul>
      <li><span class="legend-dot available"></span>{{ $t('seatMap.available') }}</li>
      <li><span class="legend-dot held"></span>{{ $t('seatMap.held') }}</li>
      <li><span class="legend-dot sold"></span>{{ $t('seatMap.sold') }}</li>
      <li><span class="legend-dot selected"></span>{{ $t('seatMap.selected') }}</li>
      <li><span class="legend-dot inactive"></span>{{ $t('seatMap.inactive') }}</li>
    </ul>
  </div>
</template>
