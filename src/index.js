import { InstanceBase, InstanceStatus, Regex, runEntrypoint } from '@companion-module/base'
import getActions from './actions.js'
import getVariables from './variables.js'
import { xml_get } from './xml.js'
import { Socket } from 'net'
import * as fs from 'fs'

class PAWInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config

		this.consoles = { id: 0, label: 'no consoles loaded yet' }
		this.cpus = { id: 0, label: 'no cpus loaded yet', type: 'none' }

		this.updateStatus(InstanceStatus.Connecting)

		this.updateActions()
		this.updateVariables()

		this.log('info', 'Connecting to Matrix...')
		this.checkMatrix()
			.then((connected_data) => {
				this.updateStatus(InstanceStatus.Ok)
				this.loadConfig()
					.then((saved_data) => {
						this.checkConfig(saved_data, connected_data)
						this.log('info', 'Config loaded')
						this.updateActions()
					})
					.catch((err) => {
						this.log('error', `Error loading config: ${err}`)
					})
			})
			.catch((err) => {
				this.log('error', `Error checking matrix: ${err}`)
				this.updateStatus(InstanceStatus.ConnectionFailure)
			})
	}
	async destroy() {
		this.log('debug', 'destroy')
	}

	updateActions() {
		this.log('debug', 'update actions....')
		this.setActionDefinitions(getActions(this))
	}

	updateVariables() {
		this.log('debug', 'update variables....')
		this.setVariableDefinitions(getVariables(this))
	}

	setVariable(variableIdent, variableValue) {
		this.setVariableValues({ [variableIdent]: variableValue })
	}

	async configUpdated(config) {
		this.config = config
	}

	async sendAction(xml) {
		return new Promise((resolve, reject) => {
			let client = new Socket()
			let answer = ''

			client.connect(this.config.matrix_port, this.config.matrix_ip, async () => {
				client.write(xml)
				this.log('debug', 'Connected....')
			})

			client.on('data', async (data) => {
				data = decodeURIComponent(data.toString())
				this.log('debug', 'Received ' + data.length + ' bytes\n' + data)
				answer = answer + data
			})

			client.on('close', async () => {
				client.destroy()
				this.log('debug', 'Connection closed...')
			})

			client.on('error', async () => {
				client.destroy()
				this.log('debug', 'Connection closed...')
			})

			setTimeout(() => {
				if (answer == '') {
					reject()
					console.log('Answer invalid')
				} else {
					resolve(answer)
				}
			}, 500)
		})
	}

	getConfigFields() {
		this.log('debug', 'getting config....')
		return [
			{
				type: 'textinput',
				id: 'matrix_ip',
				label: 'Matrix IP',
				width: 8,
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'matrix_port',
				label: 'Matrix Port',
				width: 4,
				regex: Regex.PORT,
			},
			{
				type: 'textinput',
				id: 'config_file',
				label: 'Config File',
				width: 4,
			},
		]
	}

	async checkMatrix() {
		return new Promise((resolve, reject) => {
			this.log('debug', 'Check connection to Matrix')
			this.log('debug', 'XML: ' + xml_get.replace('target', '<DviMatrixSwitch/><DviConsole/><DviCpu/><VtCpu/>'))
			this.sendAction(xml_get.replace('target', '<DviMatrixSwitch/><DviConsole/><DviCpu/><VtCpu/>'))
				.then((answer) => {					
					if (answer.split('<DviMatrixSwitch>')[1].split('<DviMatrixSwitch>')[0] != '') {
						this.log('info', 'Connected to Matrix ' + answer.split('<DviMatrixSwitch>')[1].split('</DviMatrixSwitch>')[0].split('<name>')[1].split('</name>')[0])
						resolve(answer)
					} else {
						reject('No valid Matrix')
					}
				})
				.catch(() => {
					reject('Connection failure')
				})
		})
	}

	async loadConfig() {
		return new Promise((resolve, reject) => {
			fs.readFile(this.config.config_file, 'utf-8', (err, data) => {
				let saved_data = {}
				if (err) {
					this.log('error', `Error reading config file: ${err}`)
					reject(err)
				} else if (data == 0){
					this.log('debug', `Config file is empty`)
					saved_data = JSON.parse('{"consoles":[],"cpus":[]}')
					saved_data.cpus.push({ id : "0", label : "-Selected CPU", type : "Dvi" })
					saved_data.cpus.push({ id : "1", label : "-Requested CPU", type : "Dvi" })
					resolve(saved_data)
				} else {
					this.log('debug', 'Read Data from file')
					saved_data = JSON.parse(data.toString())
					resolve(saved_data)
				}
			})
		})
	}

	async checkConfig(saved_data, connected_data) {
		this.log('debug', 'Connected Devices:')
		let connected_consoles = []
		let connected_cpus = []
		for (let item of connected_data.split('<item>')) {
			if (item.includes('<cl>')) {
				let device_type = item.split('<cl>')[1].split('</cl>')[0]
				let device_id = item.split('<id>')[1].split('</id>')[0]
				let device_label = item.split('<name>')[1].split('</name>')[0]
				if (device_type == 'DviConsole') {
					connected_consoles.push({ id : device_id, label : device_label })
				} else if (device_type == 'DviCpu') {
					connected_cpus.push({ id : device_id, label : device_label, type : 'Dvi' })
				} else if (device_type == 'VtCpu') {
					connected_cpus.push({ id : device_id, label : device_label, type : 'Vt' })
				} else {
					continue
				}
				//this.log('debug', 'Type: ' + device_type + ', ID: ' + device_id + ', Name: ' + device_label)
			}
		}
		for (let connected_console of connected_consoles) {
			let a = 0
			for (let saved_console of saved_data.consoles) {
				if ((connected_console.label == saved_console.label) && (connected_console.id == saved_console.id)) {
					this.log('debug', 'Console already registered, ID: ' + saved_console.id + ', Name: ' + saved_console.label)
					a = 1
				} else if (connected_console.label == saved_console.label) {
					this.log('info', 'Console name already registered, ID: ' + saved_console.id + ', Name: ' + saved_console.label)
					a = 1
				} else if (connected_console.id == saved_console.id) {
					this.log('info', 'Console ID already registered, ID: ' + saved_console.id + ', Name: ' + saved_console.label)
					a = 1
				}
			}
			if (a == 0) {
				this.log('info', 'New Console. ID: ' + connected_console.id + ', Name: ' + connected_console.label)
				saved_data.consoles.push({ id : connected_console.id, label : connected_console.label })
			}
		}
		for (let connected_cpu of connected_cpus) {
			let a = 0
			for (let saved_cpu of saved_data.cpus) {
				if ((connected_cpu.label == saved_cpu.label) && (connected_cpu.id == saved_cpu.id)) {
					this.log('debug', 'CPU already registered, ID: ' + saved_cpu.id + ', Name: ' + saved_cpu.label)
					a = 1
				} else if (connected_cpu.label == saved_cpu.label) {
					this.log('info', 'CPU name already registered, ID: ' + saved_cpu.id + ', Name: ' + saved_cpu.label)
					a = 1
				} else if (connected_cpu.id == saved_cpu.id) {
					this.log('info', 'CPU ID already registered, ID: ' + saved_cpu.id + ', Name: ' + saved_cpu.label)
					a = 1
				}
			}
			if (a == 0) {
				this.log('info', 'New CPU. ID: ' + connected_cpu.id + ', Name: ' + connected_cpu.label)
				saved_data.cpus.push({ id : connected_cpu.id, label : connected_cpu.label, type : connected_cpu.type })
			}
		}
		this.consoles = saved_data.consoles
		this.cpus = saved_data.cpus
		fs.writeFile(this.config.config_file, JSON.stringify(saved_data), (err, data) => {
			if (err) {
				this.log('error', `Error writing config file: ${err}`)
			}
		})
	}
}

runEntrypoint(PAWInstance, [])
