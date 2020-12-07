<template>
  <v-card flat>
    <v-list class="pt-0 pb-0">
      <v-list-item
        v-for="item of listItem"
        :key="item"
        class="legend-item pt-0 pb-0 pl-0"
      >
        <v-icon
          medium
          class="item mt-0 mb-0 mr-0 ml-0"
          :style="{color: color(item)}"
          >mdi-square</v-icon
        >
        <v-tooltip bottom>
          <template v-slot:activator="{on, attrs}">
            <span v-bind="attrs" v-on="on"
              ><v-list-item-title
                class="legend legend-with-tooltip"
                :style="{color: color(item)}"
              >
                {{ item }}
              </v-list-item-title></span
            >
          </template>
          <span class="legend-content-tooltip">{{ item }}</span>
        </v-tooltip>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script>
export default {
  props: {
    listItem: Array,
    color: Function
  }
};
</script>

<style scoped>
.item {
  margin-right: 4px;
}

.legend {
  font-size: 12px;
  top: 5px;
}

.legend-with-tooltip {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 58px;
  position: absolute;
}

.legend-content-tooltip {
  display: block;
  word-wrap: break-word;
  max-width: 300px;
}

.legend-item {
  min-height: 0 !important;
}
</style>
