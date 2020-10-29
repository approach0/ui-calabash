<template>
  <div class="p-grid p-jc-between p-ai-center topbar">
    <div class="p-col-12 p-md-4 p-lg-3">
      <h2>Calabash Panel</h2>
    </div>

    <div class="p-col-12 p-md-8 p-lg-6 p-input-icon-left p-d-flex p-ai-center">
      <i class="pi pi-caret-right p-pl-3"></i>
      <InputText type="text" v-model="input_job" style="flex-grow: 1;"
       placeholder="Run job" class="p-inputtext-sm p-m-2"/>
      <SplitButton label="Run" :model="run_btn_model" @click="runJob()"></SplitButton>
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
      <div class="main">

        <div class="tasks">
          <Fieldset legend="Tasks">
            <Toolbar>
              <template v-slot:right>
                <Button class="p-button-raised p-mr-4" label="Master Logs"
                 icon="las la-terminal" @click="onClickJobLog('MASTER')"/>
                <Dropdown v-model="taskFilter" :options="taskFilterOptions"
                          optionLabel="optionName" placeholder="Filter tasks"/>
              </template>
            </Toolbar>

            <Toolbar v-for="task in tasks" :key="task.taskid">
              <template v-slot:left>
                <div style="width: 100%; overflow-x: auto;">
                  <p>#{{task.taskid}}</p>
                  <Button v-for="(job, idx) in task.runList" :key="idx" :label="job.jobname"
                  :icon="chipIcon(job)" :class="chipClass(job)" :badge="chipBadge(job)"
                  badgeClass="p-badge-warning" @click="onClickTaskJob(task.taskid, idx)"/>
                </div>
              </template>
              <template v-slot:right>
                <Button class="p-button-text" icon="las la-terminal"
                 @click="onClickTaskLog(task.taskid)"/>
              </template>
            </Toolbar>
          </Fieldset>
        </div>

      </div>
    </div>
  </div>

  <Sidebar :visible="console_show" class="p-sidebar-lg" :showCloseIcon="false"
           :position="console_full ? 'full' : 'bottom'" :modal="false">
    <div class="p-grid p-fluid p-jc-between console_head">
      <h4 class="p-ml-4">{{console_title}}</h4>

      <div class="p-d-flex p-ai-center">
        <span class="p-mr-1">
          Auto refresh
        </span>
        <Checkbox v-model="console_refresh" :binary="true"/>
      </div>

      <div class="p-d-flex p-ai-center">
        <span class="p-mr-1">
          Stick to bottom
        </span>
        <Checkbox v-model="console_stickbt" :binary="true"/>
      </div>

      <div>
        <Button class="p-button-text" :icon="console_full ? 'las la-download' : 'las la-upload'"
                @click="console_full=!console_full"/>
        <Button class="p-button-text" icon="las la-times" @click="console_show=false"/>
      </div>
    </div>

    <pre id="console" class="console p-shadow-4">{{console_content}}</pre>
  </Sidebar>

</template>

<script>
const calabash_url = 'http://localhost:8964'
const axios = require('axios')

module.exports = {
  mounted: function() {
    const vm = this
    vm.attachDefaultTheme()
    vm.updateJobList()

    setInterval(function() {
      vm.updateTaskList()
    }, 1000)
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
    },

    taskFilter: function(filter) {
      this.updateTaskList()
    }
  },

  data: function() {
    return {
      tasks: [],
      taskFilter: {name: 'active'},
      taskFilterOptions: [
        {name: 'all', optionName: 'No filter'},
        {name: 'active', optionName: 'Only active tasks'},
        {name: 'unactive', optionName: 'Inactive tasks'}
      ],
      nightTheme: false,
      input_job: '',
      menu_model: [],
      selectedHistory: '',
      jobHistory: [],
      dialog_show: false,
      dialog_title: '',
      job_job_description: {},
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
      ],
      console_show: false,
      console_full: false,
      console_refresh: true,
      console_stickbt: true,
      console_title: 'Console',
      console_content: '',
      console_fetcher: null
    }
  },

  methods: {
    chipIcon(taskJob) {
      /* Example:
        jobname: "ucloud:source"
        alive: false
        exitcode: 0
        pid: -1
        spawn_time: 1603881900897
        exit_time: 1603881900898
      */
      if (taskJob.alive)
        return 'las la-running'
      else if (taskJob.exitcode == 0)
        return 'las la-check'
      else if (taskJob.pid < 0)
        return 'las la-clock'
      else
        return 'las la-exclamation-triangle'
    },

    chipClass(taskJob) {
      const baseclass = "p-ml-2 p-mt-2 p-button-sm p-button-rounded "
      if (taskJob.alive)
        return baseclass + 'p-button-info'
      else if (taskJob.exitcode == 0)
        return baseclass + 'p-button-success'
      else if (taskJob.pid < 0)
        return baseclass + 'p-button-outlined p-button-text p-button-plain'
      else
        return baseclass + 'p-button-danger'
    },

    chipBadge(taskJob) {
      if (!taskJob.alive && taskJob.pid >= 0) {
        const spawn_time = taskJob.spawn_time
        const exit_time = taskJob.exit_time
        const time_cost = Math.round((exit_time - spawn_time) / 1000)
        if (time_cost == 0) {
          return ''
        } else {
          return `${time_cost}`
        }
      } else {
        return ''
      }
    },

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

    displayMessage(type, summary, detail, life) {
      this.$toast.add({
        severity: type || 'success',
        summary: summary,
        detail: detail,
        life: life || 5000
      })
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
        vm.displayMessage('error', 'Error', err.toString())
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
        vm.displayMessage('error', 'Error', err.toString())
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
        vm.displayMessage('error', 'Error', err.toString())
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

    updateTaskList() {
      const vm = this
      const taskFilter = this.taskFilter.name
      axios.get(`${calabash_url}/get/tasks/${taskFilter}`)
      .then(res => {
        const data = res.data
        vm.tasks = data.all_tasks.reverse()
      })
      .catch(err => {
        vm.displayMessage('error', 'Error', err.toString())
      })
    },

    runJob(dryrun, single, pinID) {
      const jobname = this.input_job
      const vm = this
      if (jobname.trim() === '') {
        vm.displayMessage('warn', 'Please enter a job')
        return
      }

      const options = {
        goal: jobname,
        dry_run: dryrun || false,
        single_job: single || false,
        insist_job: pinID && true || false,
        pin_id_job: pinID
      }

      axios.post(`${calabash_url}/runjob`, options)
      .then(function (res) {
        const ret = res.data

        vm.displayMessage('success', jobname, JSON.stringify(ret))

        vm.updateTaskList(ret['task_id'])
      })
      .catch(function (err) {
        vm.displayMessage('error', 'Error', err.toString())
      })

      /* push to job history */
      this.pushJobHistory(jobname)
    },

    onClickTaskJob(taskID, itemIdx) {
      console.log(taskID, itemIdx)
    },

    onClickTaskLog(taskID) {
      this.showConsole(`task/${taskID}`)
    },

    onClickJobLog(logID) {
      this.showConsole(`log/${logID}`)
    },

    collectTaskJobLogs(res) {
      const runList = res.data['task']['runList']
      return runList.reduce((logs, taskJob) => {
        logs += taskJob['log']
        return logs
      }, '')
    },

    showConsole(fetch_uri) {
      /* fetch_uri: 'log/:logid' or 'task/:taskid' */
      const vm = this
      const [type, _] = fetch_uri.split('/')
      vm.console_show = true
      vm.console_full = false
      vm.console_title = fetch_uri
      vm.console_content = ''

      const fetcher = function() {
        if (vm.console_stickbt) {
          const element = document.getElementById("console")
          if (element) element.scrollTop = element.scrollHeight
        }

        if (!vm.console_refresh) {
          return
        }

        axios.get(`${calabash_url}/get/${fetch_uri}`)
        .then(res => {
          if (type === 'log') {
            const data = res.data
            vm.console_content = data.log
          } else if (type === 'task') {
            vm.console_content = vm.collectTaskJobLogs(res)
          }
        })
        .catch(err => {
          vm.displayMessage('error', 'Error', err.toString())
        })
      };

      if (vm.console_fetcher) clearInterval(vm.console_fetcher)
      vm.console_fetcher = setInterval(fetcher, 1000)
      setTimeout(fetcher, 0)
    }
  }
}
</script>

<style>
div.topbar {
  z-index:999;
  box-shadow: 0 0 4px rgba(0,0,0,.25);
  padding: 10px;
  position: sticky;
  top: 0;
  background-color:var(--surface-e);
}

div.main {
  position: relative;
  width: 100%;
}

div.tasks {
  margin: 15px;
  width: 100%;
}

pre.console {
  white-space: pre-wrap;
  overflow: auto;
  font-size: 14px;
  background-color: #424443;
  padding: 8px;
  color: white;
  height: 100%;
  font-family: InconsolataMono, "Courier New", Courier, monospace;
}

div.console_head {
  height: 3rem;
}

div.p-sidebar-content {
  height: calc(100% - 3rem);
}
</style>
