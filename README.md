<img align='right' src='https://github.com/approach0/ui-calabash/raw/master/resource/logo-128.png' width='200"'>

## Calabash Panel
Calabash panel is an UI dashboard for [calabash](https://github.com/approach0/calabash).

Let us orchestrate! :bowtie:

:guitar: :musical_keyboard: :violin: :drum:

### Local test
```
# docker build -t ui-calabash .
# docker run -it -p 19985:19985 ui-calabash
```

### Setup
In calabash repo, run a calabash daemon for bootstrap
```
# node ./jobd/jobd.js --config ./config.toml --no-looptask
# node cli/cli.js -j 'swarm:bootstrap?node_usage=host_persistent&iaascfg=ucloud_config_2'
```
(Use a higher performance node `ucloud_config_2` for hosting swarm manager, at least 2 GiB memory)

There are five essential services to be bootstrapped in this process:

* gateway (API gateway)
* usersdb (users' credentials database)
* lattice (authentication service)
* calabash and its Web UI service `ui_calabash`

At the end of bootstrap, calabash daemon will print public IP (refer it as `bootstrap_IP`) for the newly setup node.
Now go visiting the minimalistic login page `http://<bootstrap_IP>/auth/login` (usually used for debugging *lattice*,
but here we use it to finish our first login) and login with `Long-live cookie` checked.

After login, you can visit `http://<bootstrap_IP>/backend` and run calabash jobs from Web UI now.

Usually the very first jobs you need to run:

1. Add a few nodes (to allocate space to spread future and re-distribute current running services)
2. Create `ui_login` service for later login (e.g. when *lattice* service is re-distributed)
3. Update service `ui_calabash` and `usersdb` to rebalance workload among nodes
4. After `usersdb` is updated, we can start updating `lattice` service since the latter depends on `usersdb`
5. Your login token may be invalidated at this point, so dry-run any job and you will be redirected to login UI
6. Login, and create `monitor` service to collect monitoring data. Now you have all important
   "gateway jobs" running (those jobs require access to docker swarm manager node)
7. Create `grafana` service, login `http://<bootstrap_IP>/grafana` and setup Grafana to start monitoring
8. Set labels `shard=n` where n = 1, 2, ... for each swarm node for running sharding services later
9. Create other peripheral services (such as `corpus_syncd` and `crawler`
