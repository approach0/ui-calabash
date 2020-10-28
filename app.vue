<template>
  <div class="p-grid p-jc-between p-ai-center topbar">
    <div class="p-col-12 p-md-4 p-lg-3">
      <h2>Calabash Panel</h2>
    </div>

    <div class="p-col-12 p-md-8 p-lg-6 p-input-icon-left">
      <i class="la la-play"></i>
      <InputText type="text" v-model="input_job" style="width: 70%;"
       placeholder="Run job" class="p-inputtext-sm p-m-2"/>

      <SplitButton label="Run" :model="run_btn_model" @click="runJob"></SplitButton>
    </div>

    <div class="p-col-12 p-md-12 p-lg-3 p-d-flex p-jc-end">
      <div class="p-d-flex p-ai-center p-mr-4">
        <i class="las la-sun"></i>
        <i class="hspacer"></i>
        <InputSwitch v-model="nightTheme"/>
        <i class="hspacer"></i>
        <i class="las la-moon"></i>
      </div>

      <Button icon="pi pi-cog" class="p-button-rounded" @click="showConfigs"/>
    </div>

  </div>

  <Toast position="top-right"/>

  <Dialog :header="dialog_title" position="top" v-model:visible="dialog_show">
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
    <div style="width:12em">
      <Listbox v-model="selectedHistory" :options="jobHistory" optionLabel="jobname"
               listStyle="max-height:250px" :filter="true" filterPlaceholder="History"/>
      <Menu :model="menu_model" style="width:100%"/>
    </div>

    <div style="flex-grow: 1;" class="p-d-flex p-jc-center">
      <div class="main p-d-flex p-jc-center">

        <Message style="position: absolute; top: 30px; max-width: 500px"
                 v-if="msg.content" :severity="msg.type">
          {{msg.content}}
        </Message>

        <div>
          hello
        </div>

      </div>
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
    nightTheme: function(becomeNightTheme, _) {
      if (becomeNightTheme) {
        this.changeTheme('night.css')
      } else {
        this.changeTheme('light.css')
      }
    },

    selectedHistory: function(selectedJob) {
      this.input_job = selectedJob['jobname']
    }
  },

  data: function() {
    return {
      nightTheme: false,
      input_job: '',
      menu_model: [],
      selectedHistory: '',
      jobHistory: [],
      dialog_show: false,
      dialog_title: '',
      job_job_description: {},
      msg: {
        content: '',
        type: ''
      },
      run_btn_model: [
        {
          label: 'Show job',
          icon: 'pi pi-file',
          command: this.showJob
        },
        {
          label: 'Run as single job',
          icon: 'pi pi-chevron-circle-right',
          command: () => {
            this.runJob(false, true)
          }
        },
        {
          label: 'Run as status job',
          icon: 'pi pi-check-square',
          command: this.showJob
        },
        {
          label: 'Dry run',
          icon: 'pi pi-minus-circle',
          command: () => {
            this.runJob(true, false)
          }
        }
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

    extractRequiredArgs(exec) {
      let exes = exec
      if (!Array.isArray(exes)) {
        exes = exes.split('\n')
      }
      for (var i = 0; i < exes.length; i ++) {
        const str = exes[i]
        if (str.includes('require_args')) {
          let args = str.split(' ')
          args.shift()
          args = args.map(v => v + '=' + v.toUpperCase())
          return '?' + args.join('&')
        }
      }
      return ''
    },

    updateJobList() {
      const vm = this
      axios.get(`${calabash_url}/get/jobs`)
      .then(res => {
        const data = res.data
        const items = data.jobs.reduce((dict, cur) => {
          const [scope, act] = cur.name.split(':')
          const exec = cur.props.exec || ''
          const params = vm.extractRequiredArgs(exec)

          if (scope in dict) {
            dict[scope].push({
              label: act,
              command: () => {
                vm.input_job = cur.name + params
              }
            })
          } else {
            dict[scope] = [{
              label: act,
              command: () => {
                vm.input_job = cur.name + params
              }
            }]
          }

          vm.pushJobHistory(cur.name + params)
          return dict
        }, {})

        const model = Object.keys(items).map((key) => {
          return {
            label: key,
            items: items[key]
          }
        })
        vm.menu_model = [
          {},
          {label: "All Job Names"},
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
    },

    showConfigs() {
      const vm = this
      axios.get(`${calabash_url}/get/config`)
      .then(res => {
        const data = res.data
        vm.dialog_show = true
        vm.job_description = data
        vm.dialog_title = 'Configs'
      })
      .catch(err => {
        vm.$toast.add({severity:'warn', summary: err.toString()});
      })
    },

    pushJobHistory(jobname) {
      const jobnames = this.jobHistory.map(item => item.jobname)
      if (jobnames.indexOf(jobname) == -1) {
        this.jobHistory.unshift({jobname})
        if (this.jobHistory.length > 30)
          this.jobHistory.pop()
      }
    },

    displayMsg(content, type) {
      this.msg = {
        content: content,
        type: type || 'success'
      }

      const vm = this
      setTimeout(function() {
        vm.msg = {content: ''}
      }, 3000)
    },

    runJob(dryrun, single, pinID) {
      const jobname = this.input_job
      const vm = this
      if (jobname.trim() === '') {
        this.$toast.add({severity:'warn', summary: 'Please enter a job'});
        return
      }

      const options = {
        goal: jobname,
        dry_run: dryrun || false,
        single_job: single || false,
        insist_job: pinID && true || false,
        pin_id_job: pinID || '-1'
      }

      axios.post(`${calabash_url}/runjob`, options)
      .then(function (res) {
        const ret = res.data

        vm.displayMsg(JSON.stringify(ret))

        // ret['task_id']
      })
      .catch(function (err) {
        this.$toast.add({severity:'warn', summary: err.toString()});
      })

      /* push to job history */
      this.pushJobHistory(jobname)
    }
  }
}
</script>

<style>
div.topbar {
  z-index:999;
  box-shadow: 0 0 4px rgba(0,0,0,.25);
  padding: 10px;
}

div.main {
  position: relative;
  width: 100%;
}
</style>
