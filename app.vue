<template>
  <Sidebar position="top" visible style="height: 6rem; z-index:999; box-shadow: 0 0 4px rgba(0,0,0,.25) !important;" :showCloseIcon="false">
    <div class="p-grid p-jc-between p-ai-center">
      <div class="p-col-12 p-md-12 p-lg-3">
        <span class="p-text-bold">Calabash Panel</span>
      </div>

      <div class="p-col-12 p-sm-12 p-lg-6 p-input-icon-left">
        <i class="la la-play"></i>
        <InputText type="text" v-model="input_job" style="width: 70%;"
         placeholder="Run job" class="p-inputtext-sm p-m-2"/>

        <SplitButton label="Run" :model="run_btn_model"></SplitButton>
      </div>

      <div class="p-col-12 p-md-12 p-lg-3 p-d-flex p-jc-end">
        <i class="las la-sun"></i>
        <i class="hspacer"></i>
        <InputSwitch v-model="nightTheme"/>
        <i class="hspacer"></i>
        <i class="las la-moon"></i>
      </div>
    </div>
  </Sidebar>

  <Toast position="top-right"/>

  <div style="height: 5rem"/>

  <Dialog :header="dialog_title" position="top" v-model:visible="dialog_show" :dismissableMask="true">
    <template v-for="(val, key) in job_description" :key="key">
      <Fieldset :legend="key">
        <p v-if="key === 'exec' && Array.isArray(val)">
          <pre v-for="(item, idx) in val" :key="idx">
            {{item}}
          </pre>
        </p>
        <p v-else>{{val}}</p>
      </Fieldset>
    </template>
  </Dialog>

  <div class="p-d-flex">
    <div>
      <Menu :model="menu_model"/>
    </div>

    <div style="flex-grow: 1;">

      <div class="p-d-flex p-jc-center">
      </div>

      <div style="background-color: blue; height: 2000px; width: 30px;"/>
    </div>
  </div>

</template>

<script>
const calabash_url = 'http://localhost:8964'
const axios = require('axios')

module.exports = {
  mounted: function() {
    this.attachDefaultTheme()
    this.updateJobList()
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
      nightTheme: false,
      input_job: '',
      menu_model: [],
      dialog_show: false,
      dialog_title: '',
      job_job_description: {},
      run_btn_model: [
        {
          label: 'Show job',
          icon: 'pi pi-file',
          command: this.showJob
        },
      ]
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

    updateJobList() {
      const vm = this
      axios.get(`${calabash_url}/get/jobs`)
      .then(res => {
        const data = res.data
        const items = data.jobs.reduce((dict, cur) => {
          const [scope, act] = cur.name.split(':')
          if (scope in dict) {
            dict[scope].push({
              label: act,
              command: () => {
                vm.input_job = cur.name
              }
            })
          } else {
            dict[scope] = [{
              label: act,
              command: () => {
                vm.input_job = cur.name
              }
            }]
          }
          return dict
        }, {})

        const model = Object.keys(items).map((key) => {
          return {
            label: key,
            items: items[key]
          }
        })
        vm.menu_model = [
          {separator: true},
          ...model
        ]
      })
      .catch(err => {
        vm.$toast.add({severity:'warn', summary: err.toString()});
      })
    },

    showJob() {
      const jobname = this.input_job
      const vm = this
      axios.get(`${calabash_url}/get/job/${jobname}`)
      .then(res => {
        const data = res.data
        vm.dialog_show = true
        vm.job_description = data.props
        vm.dialog_title = data.jobname
      })
      .catch(err => {
        vm.$toast.add({severity:'warn', summary: err.toString()});
      })
    }
  }
}
</script>

<style>
</style>
