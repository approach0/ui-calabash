<template>
  <div class="p-grid p-jc-between p-ai-center topbar">
    <div class="p-col-12 p-md-4 p-lg-3 p-d-flex p-ai-center">
      <img style="width: 64px; height: 64px;" :src="logo"/>
      <h2 class="p-ml-4">Calabash Panel</h2>
    </div>

    <div class="p-col-12 p-md-8 p-lg-6 p-input-icon-left p-d-flex p-ai-center">
      <i class="pi pi-caret-right p-pl-3"></i>
      <InputText type="text" v-model="input_job" style="flex-grow: 1;"
       placeholder="Run job" class="p-inputtext-sm p-m-2"/>
      <SplitButton label="Run" :model="run_btn_model" @click="runJob()"/>
      <SplitButton label="Info" class="p-ml-2 p-button-secondary" :model="log_btn_model"
       @click="showJob()"/>
    </div>

    <div class="p-col-12 p-md-12 p-lg-3 p-d-flex p-jc-end">
      <div class="p-d-flex p-ai-center p-mr-4">
        <i class="las la-sun"></i>
        <i class="hspacer"></i>
        <InputSwitch v-model="nightTheme"/>
        <i class="hspacer"></i>
        <i class="las la-moon"></i>
      </div>

      <Button icon="pi pi-cog" class="p-button-text p-button-rounded" @click="showConfigs"/>
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

        <Fieldset legend="Cluster" class="mainfield">
          <Toolbar>
            <template v-slot:right>
              <Button label="Test" @click="test()"/>
            </template>
          </Toolbar>

          <Tree :value="clusterTree"></Tree>
        </Fieldset>

        <Fieldset legend="Tasks" class="mainfield">
          <Toolbar>
            <template v-slot:right>
              <Button class="p-button-raised p-mr-4" label="Master Logs"
               icon="las la-terminal" @click="showConsole('log/MASTER')"/>

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
                badgeClass="p-badge-warning" @click="onClickTaskLog(task.taskid, idx)"/>
              </div>
            </template>
            <template v-slot:right>
              <Button class="p-button-text" icon="las la-terminal"
               @click="onClickTaskLog(task.taskid)"/>
              <Button class="p-button-text p-ml-2" icon="las la-user-secret"
               @click="onClickLog('task', task.taskid)"/>
            </template>
          </Toolbar>
        </Fieldset>

      </div>
    </div>
  </div>

  <Sidebar :visible="console_show" class="p-sidebar-lg" :showCloseIcon="false"
           :position="console_full ? 'full' : 'bottom'" :modal="false">
    <div class="p-grid p-fluid p-jc-between console_head">
      <h4 class="p-ml-4">{{console_title}}</h4>

      <div class="p-d-flex p-ai-center">
        <span class="p-mr-2">
          <i class="pi pi-refresh"></i>
          Auto refresh
        </span>
        <Checkbox v-model="console_refresh" :binary="true"/>
      </div>

      <div class="p-d-flex p-ai-center">
        <span class="p-mr-2">
          <i class="pi pi-sort-down"></i>
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
    },

    tasks: function(newTasks) {
      vm = this
      newTasks.forEach((task) => {
        const runList = task.runList
        if (task.taskid == 1) {
          const log = runList[1].log
          vm.cluster_iaas_nodes = vm.parseJSON(log, vm.cluster_iaas_nodes)

        } else if (task.taskid == 2) {
          const log = runList[0].log
          vm.cluster_swarm_nodes = vm.parseJSON(log, vm.cluster_swarm_nodes)

        } else if (task.taskid == 3) {
          const log = runList[0].log
          vm.cluster_services = vm.parseJSON(log, vm.cluster_services)
        }
      })
    }
  },

  data: function() {
    return {
      logo: require('./resource/logo-128.png'),
      tasks: [],
      taskFilter: {name: 'active'},
      taskFilterOptions: [
        {name: 'all', optionName: 'No filter'},
        {name: 'active', optionName: 'Only active tasks'}
      ],
      nightTheme: false,
      input_job: '',
      menu_model: [],
      selectedHistory: '',
      jobHistory: [],
      dialog_show: false,
      lastDisplayError: null,
      dialog_title: '',
      job_job_description: {},
      log_btn_model: [
        {
          label: 'Show job',
          icon: 'pi pi-file',
          command: () => {
            this.onClickLog('job', this.input_job)
          }
        }
      ],
      run_btn_model: [
        {
          label: 'Run as single job',
          icon: 'pi pi-chevron-circle-right',
          command: () => {
            this.runJob(false, true)
          }
        },
        {
          label: 'Dry run',
          icon: 'pi pi-minus-circle',
          command: () => {
            this.runJob(true, false)
          }
        }
      ],
      clusterTree:  [
        {
            "key": "1",
            "label": "Events",
            "data": "Events Folder",
            "icon": "pi pi-fw pi-calendar",
            "children": [
                { "key": "1-0", "label": "Meeting", "icon": "pi pi-fw pi-calendar-plus", "data": "Meeting" },
                { "key": "1-1", "label": "Product Launch", "icon": "pi pi-fw pi-calendar-plus", "data": "Product Launch" },
                { "key": "1-2", "label": "Report Review", "icon": "pi pi-fw pi-calendar-plus", "data": "Report Review" }]
        },
        {
            "key": "2",
            "label": "Movies",
            "data": "Movies Folder",
            "icon": "pi pi-fw pi-star",
            "children": [{
                "key": "2-0",
                "icon": "pi pi-fw pi-star",
                "label": "Al Pacino",
                "data": "Pacino Movies",
                "children": [{ "key": "2-0-0", "label": "Scarface", "icon": "pi pi-fw pi-video", "data": "Scarface Movie" }, { "key": "2-0-1", "label": "Serpico", "icon": "pi pi-fw pi-video", "data": "Serpico Movie" }]
            },
            {
                "key": "2-1",
                "label": "Robert De Niro",
                "icon": "pi pi-fw pi-star",
                "data": "De Niro Movies",
                "children": [{ "key": "2-1-0", "label": "Goodfellas", "icon": "pi pi-fw pi-video", "data": "Goodfellas Movie" }, { "key": "2-1-1", "label": "Untouchables", "icon": "pi pi-fw pi-video", "data": "Untouchables Movie" }]
            }]
        }
    ],

      cluster_iaas_nodes: [],
      cluster_swarm_nodes: [],
      cluster_services: [],

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
    parseJSON(json, oldObj) {
      if (json.trim() === '')
        return oldObj

      try {
        const obj = JSON.parse(json)
        return obj
      } catch (err) {
        vm.displayMessage('error', err.toString(), JSON)
        return oldObj
      }
    },

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
      const displayLife = 5000
      const vm = this

      if (vm.lastDisplayError !== null && type === 'error') {
        /* to avoid too frequent error messages */
        return
      }

      vm.$toast.add({
        severity: type || 'success',
        summary: summary,
        detail: detail,
        life: life || displayLife
      })

      vm.lastDisplayError = setTimeout(function() {
        vm.lastDisplayError = null
      }, displayLife)
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
          {label: 'Job List', icon: 'pi pi-fw pi-list'},
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

      if (jobname.trim() === '') {
        vm.displayMessage('warn', 'Please enter a job name')
        return
      }

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
        vm.displayMessage('warn', 'Please enter a job name')
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

    onClickTaskLog(taskID, idx) {
      this.showConsole(`task/${taskID}`, idx)
    },

    onClickLog(type, id) {
      if (id.trim() === '') {
        this.displayMessage('warn', 'Please enter a log ID')
        return
      }

      this.showConsole(`log/${type}-${id}`)
    },

    collectTaskJobLogs(runList) {
      return runList.reduce((logs, taskJob) => {
        logs += taskJob['log']
        return logs
      }, '')
    },

    showConsole(fetch_uri, idx) {
      /* fetch_uri: 'log/:logid' or 'task/:taskid' */
      const vm = this
      const [type, _] = fetch_uri.split('/')
      vm.console_show = true
      vm.console_full = false
      vm.console_title = fetch_uri + (idx === undefined ? '' : `/job[${idx}]`)
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
            const runList = res.data['task']['runList']
            if (idx === undefined) {
              vm.console_content = vm.collectTaskJobLogs(runList)
            } else {
              vm.console_content = runList[idx]['log']
            }
          }
        })
        .catch(err => {
          vm.displayMessage('error', 'Error', err.toString())
        })
      };

      if (vm.console_fetcher) clearInterval(vm.console_fetcher)
      vm.console_fetcher = setInterval(fetcher, 1000)
      setTimeout(fetcher, 0)
    },

    test() {
      console.log(this.cluster_iaas_nodes[0])
      console.log(this.cluster_swarm_nodes)
      console.log(this.cluster_services)
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

.mainfield {
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
