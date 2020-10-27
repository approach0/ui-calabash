<template>
  <Toolbar>
    <template v-slot:left>
      <h3>Test</h3>
    </template>

    <template v-slot:right>
      <i class="las la-sun"></i>
      <InputSwitch v-model="nightTheme"/>
      <i class="las la-moon"></i>
    </template>
  </Toolbar>
</template>

<script>
module.exports = {
  mounted: function() {
    this.attachDefaultTheme()
  },

  watch: {
    nightTheme: function (becomeNightTheme, _) {
      if (becomeNightTheme) {
        this.changeTheme('night.css')
      } else {
        this.changeTheme('light.css')
      }
    }
  },

  data: function() {
    return {
      nightTheme: false
    }
  },

  methods: {
    changeTheme(cssFile) {
      let theme = document.getElementById("theme")
      theme.href = cssFile
    },

    attachDefaultTheme() {
      const theme = document.createElement('link')
      theme.type = "text/css"
      theme.rel = "stylesheet"
      theme.id = "theme"
      theme.href = 'light.css' /* default */
      document.head.appendChild(theme)
    },
  }
}
</script>

<style>
</style>
