<template>
  <div class="p-grid p-jc-between p-ai-center topbar">
    <div class="p-col-12 p-md-4 p-lg-3 p-d-flex p-ai-center">
      <img style="width: 64px; height: 64px;" :src="logo"/>
      <h2 class="p-ml-4 logo">Calabash Panel</h2>
    </div>

    <div class="p-col-12 p-md-8 p-lg-6 p-input-icon-left p-d-flex p-ai-center">
      <i class="pi pi-caret-right p-pl-3"></i>
      <InputText type="text" v-model="input_job" style="flex-grow: 1;"
       placeholder="Run job ..." class="p-inputtext-sm p-m-2"/>
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
      <Button icon="lab la-github" class="p-button-text p-button-rounded" @click="onClickGithub"/>
    </div>

    <div class="p-col-12 p-md-12 p-lg-12" v-if="tabViewActiveIndex === 5">
      <Toolbar>
        <template v-slot:left>
          <div class="p-grid p-pt-4">
            <Button class="p-mx-2 p-button-text" label="Add node" icon="las la-server"
              @click="center_dialog_show = true; center_dialog_for = 'Add Node'"/>

            <Button class="p-mx-2 p-button-text" label="Create service" icon="las la-microchip"
              @click="center_dialog_show = true; center_dialog_for = 'Create Service'"/>

            <Button v-for="item in clusterTreeSelModel" :key="item.label"
              class="p-mx-2 p-button-text" :label="item.label" :icon="item.icon"
              @click="input_job = item.query" />
          </div>
        </template>
      </Toolbar>
    </div>

  </div>

  <Toast position="top-right"/>

  <Dialog :header="top_dialog_title" position="top" v-model:visible="top_dialog_show"
          :maximizable="top_dialog_maximizable">
    <Textarea v-model="top_dialog_content" class="top_dialog" :disabled="true"/>
  </Dialog>

  <Dialog :header="center_dialog_for" v-model:visible="center_dialog_show" style="min-width: 500px">
    <div v-for="field in center_dialog_model[center_dialog_for]" :key="field.label">
      <h4> {{field.label}} </h4>
      <Listbox v-model="field.value" :options="field.options" optionLabel="name"/>

      <h4 v-if="field.value">Description:</h4>
      <pre style="overflow-x: auto">{{ field.value && field.value['desc'] }}</pre>
    </div>

    <template #footer>
      <Button label="Query" icon="pi pi-check" @click="onCenterDialogConfirm()"
              :disabled="!center_dialog_model[center_dialog_for].every(field => field.value)"/>
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
        <Fieldset legend="Server List" class="p-mt-4">
          <TabView v-model:activeIndex="tabViewActiveIndex">

            <TabPanel header="Blank">
            </TabPanel>

            <TabPanel header="IaaS">
              <DataTable :value="cluster_iaas_nodes" :scrollable="true" style="width: 100%">
                <Column field="provider" header="Provider"></Column>
                <Column field="id" header="ID"></Column>
                <Column field="label" header="Label"></Column>
                <Column field="inject_ip" header="IP"></Column>
                <Column field="description" header="Specs"></Column>
                <Column field="create_time" header="Creation"></Column>
                <Column field="status" header="Status"></Column>
              </DataTable>
            </TabPanel>

            <TabPanel header="Swarm Nodes">
              <DataTable :value="cluster_swarm_nodes" :scrollable="true" style="width: 100%">
                <Column field="ID" header="ID"></Column>
                <Column field="Spec.Role" header="Role"></Column>
                <Column field="Description.Hostname" header="Hostname"></Column>
                <Column field="Status.Addr" header="Address"></Column>
                <Column field="Description.Engine.EngineVersion" header="Docker"></Column>
                <Column field="inject_cpu" header="Nano CPU"></Column>
                <Column field="inject_memory" header="Memory"></Column>
                <Column field="Status.State" header="State"></Column>
                <Column field="inject_labels" header="Labels"></Column>
              </DataTable>
            </TabPanel>

            <TabPanel header="Swarm Services">
              <DataTable :value="cluster_services" :scrollable="true" style="width: 100%">
                <Column field="ID" header="ID"></Column>
                <Column field="Spec.Name" header="Name"></Column>
                <Column field="inject_ports" header="Ports"></Column>
                <Column field="inject_constraints" header="Constraints"></Column>
                <Column field="Spec.Mode.Replicated.Replicas" header="Replicas"></Column>
                <Column field="inject_createtime" header="Created"></Column>
                <Column field="inject_updatetime" header="Updated"></Column>
                <Column field="inject_labels" header="Labels"></Column>
              </DataTable>
            </TabPanel>

            <TabPanel header="Swarm Tasks">
              <DataTable :value="cluster_tasks" :scrollable="true" style="width: 100%">
                <Column field="NodeID" header="Node" sortable="true"></Column>
                <Column field="ServiceID" header="Service"></Column>
                <Column field="inject_createtime" header="Created"></Column>
                <Column field="inject_updatetime" header="Updated"></Column>
                <Column field="Status.State" header="State" sortable="true"></Column>
                <Column field="inject_timestamp" header="Timestamp" sortable="true"></Column>
                <Column field="Status.Err" header="Error"></Column>
              </DataTable>
            </TabPanel>

            <TabPanel header="Cluster Tree">
              <Toolbar>
                <template v-slot:right>
                  <div class="p-grid p-pt-4 p-pr-4 p-ai-center">
                    <i class="las la-tree"></i>
                    Top-level
                    <i class="hspacer"></i>
                    <InputSwitch v-model="clusterTreeTopLevel"/>
                  </div>
                </template>
              </Toolbar>
              <Tree :value="clusterTree" selectionMode="single" v-model:selectionKeys="clusterTreeSel">
              </Tree>
            </TabPanel>

          </TabView>
        </Fieldset>

        <Fieldset legend="Calabash Tasks" class="p-mt-4" style="position: relative">
          <Toolbar>
            <template v-slot:right>
              <Dropdown v-model="taskFilter" class="p-m-2" :options="taskFilterOptions"
                        optionLabel="optionName" placeholder="Filter tasks"/>

              <Button class="p-button-raised p-m-2" label="Master Logs"
               icon="las la-terminal" @click="showConsole('log/MASTER')"/>

              <Button class="p-button-raised p-button-secondary p-m-2" label="Tasks Cleanup"
               icon="las la-trash" @click="onClickTasksCleanup()"/>
            </template>
          </Toolbar>

          <Toolbar v-for="task in tasks" :key="task.taskid">
            <template v-slot:left>
              <div style="width: 100%; overflow-x: auto;" class="p-d-flex p-ai-center">
                <span>#{{task.taskid}}</span>
                <i class="hspacer"></i>
                <Button v-for="(job, idx) in task.runList" :key="idx" :label="job.jobname"
                :icon="chipIcon(job)" :class="chipClass(job)" :badge="chipBadge(job)"
                badgeClass="p-badge-warning" @click="onClickTaskLog(task.taskid, idx)"/>
              </div>
            </template>
            <template v-slot:right>
              <Button class="p-button-text p-m-2" icon="las la-terminal"
               @click="onClickTaskLog(task.taskid)"/>
              <Button class="p-button-text p-m-2" icon="las la-user-secret"
               @click="onClickLog('task', task.taskid)"/>
              <Button class="p-button-text p-m-2" icon="las la-times"
               @click="onClickDeleteTask(task.taskid)"/>
            </template>
          </Toolbar>

          <ProgressBar mode="indeterminate" v-show="task_loading" class="bottom_progress"/>
        </Fieldset>

        <Fieldset legend="Github Workflows" class="p-mt-4">
          <Toolbar>
            <template v-slot:right>
              <InputText type="text" placeholder="Filter Repository ..." v-model="gh_filter"/>
            </template>
          </Toolbar>
          <div v-for="(wf, key) in gh_workflows" :key="key" style="position: relative">
            <div v-show="gh_filter.trim() === '' || key.includes(gh_filter)" class="p-py-6">
              <ProgressBar mode="indeterminate" v-show="wf.loading" class="bottom_progress"/>
              <Toolbar>
                <template v-slot:left>
                  <i class="lab la-github-alt"></i>
                  <i class="hspacer"></i>
                  <a :href="'https://github.com/' + wf.repo" target="_blank">{{wf.repo}}</a>
                </template>
                <template v-slot:right>
                  <div class="p-m-2">
                    <i class="las la-sync"></i>
                    Refresh
                    <i class="hspacer"></i>
                    <InputSwitch v-model="wf.refresh"/>
                  </div>
                </template>
              </Toolbar>
              <DataTable :value="wf.recent_runs" style="width: 100%"
                         :scrollable="true" selectionMode="single">
                <Column field="workflow_name" header="Workflow"></Column>
                <Column field="head_branch" header="Branch"></Column>
                <Column field="head_sha" header="Commit"></Column>
                <Column field="created" header="Created"></Column>
                <Column field="updated" header="Updated"></Column>
                <Column header="State">
                  <template #body="slotProps">
                    <div :class="slotProps.data.css_class">
                    <a :href="slotProps.data.url" target="_blank"
                       style="color: var(--primary-color-text);">
                      {{slotProps.data.state}}
                    </a>
                    </div>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
        </Fieldset>

      </div>
    </div>
  </div>

  <!-- placeholder to compensate bottom overlay console -->
  <div style="height: 500px"></div>

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

      <div class="p-d-flex p-ai-center">
        <span class="p-mr-2">
          <i class="pi pi-palette"></i>
          Use Xterm
        </span>
        <Checkbox v-model="use_xterm" :binary="true"/>
      </div>

      <div>
        <Button class="p-button-text" :icon="console_full ? 'las la-download' : 'las la-upload'"
                @click="console_full=!console_full"/>
        <Button class="p-button-text" icon="las la-times"
                @click="updateRecurFetcher('console_fetcher'); console_show = false"/>
      </div>
    </div>

    <div style="height: 100%; position: relative" class="p-mt-3">
      <ProgressBar mode="indeterminate" v-show="console_loading" style="z-index:9"/>
      <div v-if="use_xterm" id="xterm_console" class="p-shadow-4 abstop"></div>
      <pre v-else id="console" class="console p-shadow-4 abstop">
        {{console_content}}
      </pre>
    </div>
  </Sidebar>

</template>

<script>
const calabash_url = CALABASH_URL
const workflow_num = 6

const axios = require('axios')

const dayjs = require('dayjs')
const relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(relativeTime)

const Terminal = require('xterm').Terminal

module.exports = {
  mounted: function() {
    const vm = this
    vm.attachDefaultTheme()
    vm.updateConfigs()
    vm.updateJobList()
    vm.updateTaskList()

    setTimeout(vm.updateWorkflows, 1 * 1000)
    setInterval(vm.updateWorkflows, 10 * 1000)

    vm.xterm = new Terminal({
      disableStdin: true,
      cols: 160,
      convertEol: true /* important to make newline alignment correct */
    })
  },

  watch: {
    use_xterm: function(inUse) {
      if (inUse) {
        this.$nextTick(function() {
          this.xterm.open(document.getElementById('xterm_console'))
          this.xterm.clear()
          this.xterm.write(this.console_content)
        })
      }
    },

    console_content: function(newContent, oldContent) {
      if (this.use_xterm) {
        if (newContent.startsWith(oldContent)) {
          const appendContent = newContent.slice(oldContent.length)
          this.xterm.write(appendContent)
        } else {
          this.xterm.clear()
          this.xterm.write(newContent)
        }

        if (this.console_stickbt) {
          const vm = this
          setTimeout(function() {
            vm.xterm.scrollToBottom()
          }, 100)
        }
      }
    },

    nightTheme: function(becomeNightTheme, _) {
      if (becomeNightTheme) {
        this.changeTheme('night.css')
      } else {
        this.changeTheme('light.css')
      }
    },

    selectedHistory: function(selectedJob) {
      if (selectedJob && 'jobname' in selectedJob)
        this.input_job = selectedJob['jobname']
    },

    taskFilter: function(filter) {
      this.updateTaskList()
    },

    tasks: function(newTasks) {
      vm = this
      newTasks.forEach((task) => {
        /* copy run list */
        const runList = JSON.parse(JSON.stringify(task.runList))
        /* allocate an pseudo item to ensure item[0] and [1] are accessible */
        runList.push({exitcode: 0})

        /* prohibit loading task output from unfinished job */
        if (runList.some(j => j.exitcode !== 0)) {
          return
        }

        if (task.taskid == 1) {
          const log = runList[1].log || ''
          vm.cluster_iaas_nodes = vm.parseJSON(log, vm.cluster_iaas_nodes)
          vm.cluster_iaas_nodes = vm.cluster_iaas_nodes.map(item => {
            item.inject_ip = item.ip.join(', ')
            return item
          })

        } else if (task.taskid == 2) {
          const log = runList[0].log || ''
          vm.cluster_swarm_nodes = vm.parseJSON(log, vm.cluster_swarm_nodes)
          vm.cluster_swarm_nodes = vm.cluster_swarm_nodes.map(item => {
            const MemoryBytes = item['Description']['Resources']['MemoryBytes']
            const MemoryGB = Math.round(MemoryBytes / (1024 * 1024 * 1024))
            item.inject_memory = `${MemoryGB} GB`

            /* See https://github.com/moby/moby/blob/v1.12.0-rc4
               /daemon/cluster/executor/container/container.go#L328-L332 */
            const CPUPeriod = 100
            const NanoCPUs = item['Description']['Resources']['NanoCPUs']
            item.inject_cpu = NanoCPUs * CPUPeriod / parseFloat('1e9')

            const Labels = item['Spec']['Labels']
            item.inject_labels = JSON.stringify(Labels)

            return item
          })

        } else if (task.taskid == 3) {
          const log = runList[0].log || ''
          vm.cluster_services = vm.parseJSON(log, vm.cluster_services)
          vm.cluster_services = vm.cluster_services.map(item => {
            const Labels = item['Spec']['Labels']
            item.inject_labels = JSON.stringify(Labels)

            const createtime = item['CreatedAt']
            item.inject_createtime = dayjs(createtime).fromNow()

            const updatetime = item['UpdatedAt']
            item.inject_updatetime = dayjs(updatetime).fromNow()

            const Constraints = item['Spec']['TaskTemplate']['Placement']['Constraints']
            item.inject_constraints = JSON.stringify(Constraints)

            const Ports = item['Endpoint']['Ports']
            item.inject_ports = JSON.stringify(Ports)

            return item
          })

        } else if (task.taskid == 4) {
          const log = runList[0].log || ''
          vm.cluster_tasks = vm.parseJSON(log, vm.cluster_tasks)
          vm.cluster_tasks = vm.cluster_tasks.map(item => {
            const createtime = item['CreatedAt']
            item.inject_createtime = dayjs(createtime).fromNow()

            const updatetime = item['UpdatedAt']
            item.inject_updatetime = dayjs(updatetime).fromNow()

            const timestamp = item['CreatedAt']
            item.inject_timestamp = dayjs(timestamp).format('YYYY/MM/DD HH:mm')

            return item
          })
        }
      })
    },

    cluster_iaas_nodes: function() {
      this.updateClusterTree()
    },

    cluster_swarm_nodes: function() {
      this.updateClusterTree()
    },

    cluster_services: function() {
      this.updateClusterTree()
    },

    cluster_tasks: function() {
      this.updateClusterTree()
    },

    clusterTreeSel: function() {
      this.clusterTreeOnSelected()
    },

    center_dialog_show: function(onShow) {
      if (!onShow) return

      const about = this.center_dialog_for
      const fields = this.center_dialog_model[about]
      const vm = this

      fields.forEach(field => {
        field.options = []

        if (field.label === 'Usage') {
          const obj = vm.configs.node_usage
          field.options = Object.keys(obj).map(name => {
            return {
              name: name,
              meta: obj[name],
              desc: vm.prettyJSON(obj[name])
            }
          })

        } else if (field.label === 'IaaS Config') {
          vm.configs.iaas.providers.forEach(provider => {
            const cfg = vm.configs.iaas[provider]
            const keys = Object.keys(cfg).filter(nm => nm.startsWith('config_'))
            keys.forEach(key => {
              field.options.push({
                name: `${provider}_${key}`,
                meta: cfg[key],
                desc: vm.prettyJSON(cfg[key])
              })
            })
          })

        } else if (field.label === 'Service') {
          field.options = vm.services.map(srv => {
            return {
              name: srv.name,
              meta: srv.meta,
              desc: vm.prettyJSON(srv.meta)
            }
          })

        } else {
          throw new Error('No desired config entry!')
        }

      })
    }

  },

  computed: {
    services() {
      const vm = this
      const raw_services = vm.configs.service || {}
      return Object.keys(raw_services).reduce((dict, key) => {
        const val = raw_services[key]
        if (!Array.isArray(val) && typeof(val) !== 'string') {
          dict.push({
            name: key,
            meta: val
          })
        }
        return dict
      }, [])
    }
  },

  data: function() {
    return {
      logo: require('./resource/logo-128.png'),

      gh_workflows: {},
      gh_filter: '',

      tasks: [],
      task_loading: false,
      taskFetcher: null,
      taskFilter: {name: 'recent'},
      taskFilterOptions: [
        {name: 'recent', optionName: 'Recent and active tasks'},
        {name: 'active', optionName: 'Only active tasks'},
        {name: 'inactive', optionName: 'Only inactive tasks'}
      ],

      configs: {},

      nightTheme: false,
      input_job: '',
      menu_model: [],

      selectedHistory: '',
      jobHistory: [],

      tabViewActiveIndex: 0,

      top_dialog_show: false,
      top_dialog_title: '',
      top_dialog_content: '',
      top_dialog_maximizable: false,

      center_dialog_show: false,
      center_dialog_for: '',
      center_dialog_model: {
        'Add Node': [
          {
            label: 'Usage',
            value: '', /* chosen option */
            options: []
          },
          {
            label: 'IaaS Config',
            value: '',
            options: []
          }
        ],

        'Create Service': [
          {
            label: 'Service',
            value: '', /* chosen option */
            options: []
          }
        ]
      },

      lastDisplayError: null,

      run_btn_model: [
        {
          label: 'Run and follow logs',
          icon: 'pi pi-circle-on',
          command: () => {
            this.runJob(false, false, true)
          }
        },
        {
          label: 'Run as single job',
          icon: 'pi pi-chevron-circle-right',
          command: () => {
            this.runJob(false, true, false)
          }
        },
        {
          label: 'Dry run',
          icon: 'pi pi-minus-circle',
          command: () => {
            this.runJob(true, false, false)
          }
        }
      ],

      log_btn_model: [
        {
          label: 'Job logs',
          icon: 'pi pi-file',
          command: () => {
            this.onClickLog('job', this.input_job)
          }
        }
      ],

      clusterTree: [],
      clusterTreeTopLevel: false,
      clusterTreeSel: null,
      clusterTreeSelModel: [],

      cluster_iaas_nodes: [],
      cluster_swarm_nodes: [],
      cluster_services: [],
      cluster_tasks: [],

      xterm: null,
      use_xterm: false,
      console_show: false,
      console_full: false,
      console_refresh: true,
      console_stickbt: true,
      console_title: 'Console',
      console_content: '',
      console_loading: false,
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
        vm.displayMessage('error', err.toString(), json)
        return oldObj
      }
    },

    prettyJSON(json) {
      return JSON.stringify(json, null, 2).replaceAll('\\n', '\n')
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

      const max_detail_len = 256
      if (detail.length > max_detail_len)
        detail = detail.substr(0, max_detail_len) + ' ...'

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

    loginRedirect(axiosRet) {
      /* rewrite original AJAX target URL to this page */
      const redirectURI = axiosRet.request.responseURL.split('?')[0]
      const currentURL = window.location.href
      const redirectURL = redirectURI + '?next=' + encodeURIComponent(currentURL)
      setTimeout(function() {
        window.location.replace(redirectURL)
        /* replace() is better than `window.location.href = ...' because
         * it does not keep the originating page in the session history,
         * meaning the user won't get stuck in a never-ending back-button fiasco.
         */
      }, 3000)

      this.displayMessage('error', 'No permission', 'Redirecting in a few seconds...')
    },

    updateConfigs() {
      const vm = this
      axios.get(`${calabash_url}/get/config`)
      .then(res => {
        const data = res.data
        vm.configs = data
      })
      .catch(err => {
        vm.displayMessage('error', 'Error', err.toString())
      })
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
        vm.top_dialog_show = true
        vm.top_dialog_maximizable = false
        vm.top_dialog_content = JSON.stringify(data.props, null, 2)
        vm.top_dialog_title = data.jobname
      })
      .catch(err => {
        vm.displayMessage('error', 'Error', err.toString())
      })
    },

    showConfigs() {
      const cfg = this.configs
      this.top_dialog_show = true
      this.top_dialog_maximizable = true
      this.top_dialog_content = JSON.stringify(cfg, null, 2).replaceAll('\\n', '\n')
      this.top_dialog_title = 'Configurations'
    },

    pushJobHistory(jobname) {
      const jobnames = this.jobHistory.map(item => item.jobname)
      if (jobnames.indexOf(jobname) == -1) {
        this.jobHistory.unshift({jobname})
        if (this.jobHistory.length > 30)
          this.jobHistory.pop()
      }
    },

    updateRecurFetcher(fetcherName, callbk) {
      if (this[fetcherName] !== null) {
        clearTimeout(this[fetcherName])
      }
      this[fetcherName] = (callbk || null)
    },

    updateTaskList() {
      const vm = this
      const taskFilter = this.taskFilter.name

      function fetcher() {
        vm.task_loading = true

        axios.get(`${calabash_url}/get/tasks/${taskFilter}`)
        .then(res => {
          const data = res.data
          vm.tasks = data.all_tasks.reverse()

          vm.task_loading = false
          vm.updateRecurFetcher('taskFetcher', setTimeout(fetcher, 2000))
        })
        .catch(err => {
          vm.displayMessage('error', 'Error', err.toString())
          vm.updateRecurFetcher('taskFetcher', setTimeout(fetcher, 2000))
        })
      }

      vm.updateRecurFetcher('taskFetcher', setTimeout(fetcher, 0))
    },

    runJob(dryrun, single, follow) {
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
        insist_job: false,
        pin_id_job: false
      }

      axios.post(`${calabash_url}/runjob`, options)
      .then(function (res) {
        const contentType = res.headers['content-type']
        if (contentType.includes('application/json')) {
          const data = res.data
          if (data.error)
            throw new Error(data.error)

          vm.displayMessage('success', jobname, JSON.stringify(data))
          vm.updateTaskList()

          /* do we open console to follow logs? */
          if (follow) {
            const taskID = data['task_id']
            taskID && vm.onClickTaskLog(taskID)
          }
        } else {
          vm.loginRedirect(res)
        }
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
      if (typeof id === 'string' && id.trim() === '') {
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

    onClickTasksCleanup() {
      axios.delete(`${calabash_url}/del/inactive_tasks`)
      .then(res => {
        const data = res.data
        if (data.error)
          throw new Error(data.error)

        vm.displayMessage('success', JSON.stringify(data))
      })
      .catch(err => {
        if (err.response && err.response.status === 405)
          vm.loginRedirect(err)
        else
          vm.displayMessage('error', err.toString())
      })
    },

    onClickDeleteTask(taskID) {
      axios.delete(`${calabash_url}/del/task/${taskID}`)
      .then(res => {
        const data = res.data
        if (data.error)
          throw new Error(data.error)

        vm.displayMessage('success', taskID, JSON.stringify(data))
      })
      .catch(err => {
        if (err.response && err.response.status === 405)
          vm.loginRedirect(err)
        else
          vm.displayMessage('error', err.toString())
      })
    },

    consoleStickToBottom() {
      const element = document.getElementById("console")
      if (element) element.scrollTop = element.scrollHeight
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
        if (!vm.console_show) {
          return

        } else if (!vm.console_refresh) {
          vm.updateRecurFetcher('console_fetcher', setTimeout(fetcher, 2000))
          return
        }

        vm.console_loading = true
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

          if (vm.console_stickbt) {
            /* stick console scroll bar to the bottom */
            setTimeout(vm.consoleStickToBottom, 0)
          }

          /* wait and refresh */
          vm.console_loading = false
          vm.updateRecurFetcher('console_fetcher', setTimeout(fetcher, 2000))
        })
        .catch(err => {
          vm.displayMessage('error', 'Error', err.toString())
          vm.updateRecurFetcher('console_fetcher', setTimeout(fetcher, 2000))
        })
      };

      /* start right away */
      vm.updateRecurFetcher('console_fetcher', setTimeout(fetcher, 0))
    },

    updateClusterTree(level, key) {
      const vm = this
      if (level === undefined) {
        const startLevel = vm.clusterTreeTopLevel ? 0 : 1;
        vm.clusterTree = []
        vm.clusterTree = vm.updateClusterTree(startLevel)

      } else if (level == 0) {
        return vm.cluster_iaas_nodes.map(node => {
          const label = `${node.label} [ ${node.provider}#${node.id} ] ${node.inject_ip}`
          return {
            icon: 'las la-server',
            label: label,
            key: [level, node.provider, node.id, node.inject_ip].join(),
            children: vm.updateClusterTree(level + 1, node.label)
          }
        })

      } else if (level == 1) {
        return vm.cluster_swarm_nodes
          .filter(node => {
            if (key === undefined) {
              return true
            } else {
              return node.Description.Hostname === key
            }
          })
          .map(node => {
            let leader = ''
            let address = node.Status.Addr
            if (node.ManagerStatus) {
              address = node.ManagerStatus.Addr.split(':')[0]
              leader = node.ManagerStatus.Leader && '(leader)' || ''
            }
            const drain = (node.Spec.Availability == 'active') ? '' : '(drain)'
            const label = `${node.Spec.Role} ${leader} ${drain} ${address} ${node.inject_labels}`
            return {
              icon: 'las la-brain',
              label: label,
              key: [level, node.ID, address].join(),
              children: vm.updateClusterTree(level + 1, node.ID)
            }
          })

      } else if (level == 2) {
        return Object.values(vm.cluster_tasks
          .filter(node => {
            if (key === undefined) {
              return true
            } else {
              return node.NodeID === key
            }
          })
          .reduce((uniq_set, node) => {
            const service = node.ServiceID
            if (node.Status.State !== 'running') {
              return uniq_set
            }

            if (service in uniq_set) {
              uniq_set[service].replicas += 1
            } else {
              uniq_set[service] = node
              uniq_set[service].replicas = 1
            }
            return uniq_set
          }, {}))
          .map(node => {
            const servInfo = vm.cluster_services.filter(m => m.ID === node.ServiceID)
            let name = node.ServiceID
            let meta = []
            let total_instances = node.replicas
            if (servInfo.length > 0) {
              const info = servInfo[0]
              name = info.Spec.Name
              meta = [info.inject_constraints, info.inject_updatetime]
              total_instances = info.Spec.Mode.Replicated.Replicas
            }
            const label = `${name} ${node.Status.Err || ''}`
            let replicas = `(${node.replicas} / ${total_instances})`
            if (node.replicas === 1 && total_instances === 1) { replicas = '' }
            return {
              icon: 'las la-microchip',
              label: label + ' ' + replicas + ' ' + meta.join(' '),
              key: [level, name].join(),
              leaf: true
            }
          })
      }
    },

    clusterTreeOnSelected() {
      const clusterTreeSel = this.clusterTreeSel
      this.clusterTreeSelModel = []
      if (clusterTreeSel) {
        const keys = Object.keys(clusterTreeSel)
        const [level, arg1, arg2, arg3] = keys[0].split(',')
        let query = ''
        if (level === '0') {
          this.clusterTreeSelModel = [{
            label: 'Delete node',
            icon: 'las la-trash',
            query: `${arg1}:delete-node?nodeid=${arg2}`
          }, {
            label: 'SSH command',
            icon: 'las la-terminal',
            query: `ssh ${arg3}`
          }]

        } else if (level === '1') {
          this.clusterTreeSelModel = [{
            label: 'Address',
            icon: 'las la-phone',
            query: `${arg2}`
          }, {
            label: 'Promote',
            icon: 'las la-angle-double-up',
            query: `swarm:node-promote?swarmNode=${arg1}`
          }, {
            label: 'Demote',
            icon: 'las la-angle-double-down',
            query: `swarm:node-demote?swarmNode=${arg1}`
          }, {
            label: 'Set label',
            icon: 'las la-tag',
            query: `swarm:node-label-set?swarmNode=${arg1}&label=FOO=BAR`
          }, {
            label: 'Remove label',
            icon: 'las la-cut',
            query: `swarm:node-label-rm?swarmNode=${arg1}&labelkey=FOO`
          }, {
            label: 'Drain',
            icon: 'las la-expand-arrows-alt',
            query: `swarm:node-update-availability?swarmNode=${arg1}&availability=drain`
          }, {
            label: 'Make available',
            icon: 'las la-expand',
            query: `swarm:node-update-availability?swarmNode=${arg1}&availability=active`
          }]

        } else if (level === '2') {
          this.clusterTreeSelModel = [{
            label: 'Update service',
            icon: 'las la-sync',
            query: `swarm:service-update?service=${arg1}`
          }, {
            label: 'Scale service',
            icon: 'las la-layer-group',
            query: `swarm:service-scale?service=${arg1}&replicas=NUM_REPLICAS`
          }, {
            label: 'Remove service',
            icon: 'las la-trash',
            query: `swarm:rm-service?service=${arg1}`
          }, {
            label: 'Remove services',
            icon: 'las la-radiation-alt',
            query: `swarm:rm-services?service_prefix=${arg1}___`
          }, {
            label: 'Service logs',
            icon: 'las la-terminal',
            query: `swarm:service-logs?service=${arg1}`
          } /* , {
            label: 'Set label',
            icon: 'las la-tag',
            query: `swarm:service-label-set?service=${arg1}&label=FOO=BAR`
          }, {
            label: 'Remove label',
            icon: 'las la-cut',
            query: `swarm:service-label-rm?service=${arg1}&labelkey=FOO`
          } */ ]

        } else {
          console.error('Unexpected clusterTreeSel', clusterTreeSel)
          return
        }
      }
    },

    onCenterDialogConfirm() {
      const about = this.center_dialog_for
      const fields = this.center_dialog_model[about]

      if (about === 'Add Node') {
        const usage = fields[0].value.name
        const iaasc = fields[1].value.name
        this.input_job = `swarm:expand?node_usage=${usage}&iaascfg=${iaasc}`

      } else if (about === 'Create Service') {
        const service = fields[0].value.name
        this.input_job = `swarm:service-create?service=${service}`
      }

      this.center_dialog_show = false
    },

    updateWorkflows() {
      const vm = this
      if (vm.configs.github === undefined) return
      const workflows = vm.configs.github.workflows || []

      workflows.forEach(repo_ => {
        const github_pat = vm.configs.github.open_PAT

        const fetcher = function(repo) {
          const randtok = Math.random().toString(36).substr(2)
          axios.get(`https://api.github.com/repos/${repo}/actions/runs?r=${randtok}`, {
            headers: {
              'Authorization': `token ${github_pat}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          })
          .then(res => {
            const data = res.data
            const workflow_runs = data['workflow_runs'] || []
            const recent_runs__promise = workflow_runs
            .slice(0, workflow_num).map(async (run) => {
              const workflow_api = run.workflow_url
              const workflow = await axios.get(workflow_api, {
                headers: {
                  'Authorization': `token ${github_pat}`
                }
              }).then(res => {
                return res.data
              })

              const workflow_badge = workflow.badge_url
              const workflow_name = workflow.name
              const state = run.conclusion ? run.conclusion : run.status
              const state2css = function(state) {
                if (state.includes('progress'))
                  return 'p-tag p-tag-info'
                else if (state.includes('failure'))
                  return 'p-tag p-tag-danger'
                else if (state.includes('success'))
                  return 'p-tag p-tag-success'
                else
                  return 'p-tag p-tag-warning'
              };
              return {
                id: run.id,
                state: state,
                css_class: state2css(state),
                head_branch: run.head_branch,
                head_sha: run.head_sha.slice(0, 7),
                created: dayjs(run.created_at).fromNow(),
                updated: dayjs(run.updated_at).fromNow(),
                url: run.html_url,
                workflow_badge, workflow_name
              }
            })

            Promise.all(recent_runs__promise).then(recent_runs => {
              const old = vm.gh_workflows[repo]
              const gh_repo = {
                repo: repo,
                refresh: (old ? old.refresh : false),
                fetcher: fetcher,
                loading: false,
                recent_runs: recent_runs
              };
              vm.gh_workflows[repo] = gh_repo
            })

          })
          .catch(err => {
            console.log(err.toString())
          })

        } /* end fetcher */

        const gh_repo = vm.gh_workflows[repo_]
        if (gh_repo === undefined || gh_repo.refresh) {
          if (gh_repo) gh_repo.loading = true
          fetcher(repo_)
        }
      })
    }, /* end function */

    onClickGithub() {
      window.open('https://github.com/approach0/ui-calabash', '_blank')
    }
  }
}
</script>

<style>
.logo {
  color: #ff4a4a;
  font-family: sans-serif;
  font-size: 23px;
  font-weight: bold;
  letter-spacing: 2px;
  text-transform: uppercase;
}

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
  margin: 1.5rem;
}

pre.console {
  white-space: pre-wrap;
  overflow: auto;
  font-size: 14px;
  background-color: #424443;
  padding: 8px;
  color: white;
  height: 100%;
  margin: 0 !important;
  font-family: InconsolataMono, "Courier New", Courier, monospace;
}

div.console_head {
  height: 3rem;
}

div.p-sidebar-content {
  height: calc(100% - 3rem);
  overflow-y: initial;
}

td {
  overflow-wrap: break-word;
}

.p-disabled, .p-component:disabled {
  opacity: 1.0 !important;
}

.top_dialog {
  width: 100%;
  height: 100%;
  min-height: 400px;
  min-width: 600px;
}

.abstop {
  position: absolute;
  top: 0;
  width: 100%;
}

.bottom_progress {
  position: absolute !important;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 99;
}
</style>
