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

	//Initiates the module
	async init(config) {
		this.config = config

		this.consoles = { id: 0, label: 'no consoles loaded yet' }
		this.cpus = { id: 0, label: 'no cpus loaded yet', type: 'none' }

		this.updateStatus(InstanceStatus.Connecting)
		this.log('info', 'Initiate startup...')

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
						this.log('info', 'Startup finished')
					})
					.catch(() => {
						this.updateStatus(InstanceStatus.BadConfig)
					})
			})
			.catch(() => {
				this.updateStatus(InstanceStatus.ConnectionFailure)
			})
	}

	//Destroys object
	async destroy() {
		this.log('debug', 'destroy')
	}

	//Updates the available actions
	updateActions() {
		this.log('debug', 'Updating actions...')
		this.setActionDefinitions(getActions(this))
	}

	//Updates the available variables
	updateVariables() {
		this.log('debug', 'Updating variables...')
		this.setVariableDefinitions(getVariables(this))
	}

	//Sets the value of a variable
	setVariable(variableIdent, variableValue) {
		this.setVariableValues({ [variableIdent]: variableValue })
	}

	getConsolefromID () {

	}

	getCPUfromID () {

	}

	//Sets the config fields
	async configUpdated(config) {
		this.config = config
	}

	//Sends xml-command to configured server and returns answer
	async sendAction(xml) {
		return new Promise((resolve, reject) => {
			let client = new Socket()
			let answer = ''

			client.connect(this.config.matrix_port, this.config.matrix_ip, async () => {
				this.log('debug', 'Connect to Server...')
				client.write(xml)
				//this.log('debug', 'Send xml to Server...')
				//this.log('debug', 'Send: ' + xml)
			})

			client.on('data', async (data) => {
				data = decodeURIComponent(data.toString())
				//this.log('debug', 'Received: ' + data.length + ' bytes\n' + data)
				answer = answer + data
			})

			client.on('close', async () => {
				client.destroy()
				this.log('debug', 'Connection to Server closed...')
			})

			client.on('error', async () => {
				client.destroy()
				reject('Connection error')
				this.log('debug', 'Connection to Server closed...')
			})

			setTimeout(() => {
				if (answer == '') {
					reject('No answer from server')
				} else {
					resolve(answer)
				}
			}, 500)
		})
	}

	//Configuration of the config fields
	getConfigFields() {
		this.log('debug', 'Getting config fields...')
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

	//Checks connection to the matrix and returns connected devices
	async checkMatrix() {
		return new Promise((resolve, reject) => {
			this.log('debug', 'Checking connection to Matrix...')
			this.sendAction(xml_get.replace('target', '<DviMatrixSwitch/><DviConsole/><DviCpu/><VtCpu/>'))
				.then((answer) => {					
					if (answer.split('<DviMatrixSwitch>')[1].split('<DviMatrixSwitch>')[0].split('<name>')[1].split('</name>')[0] != '') {
						this.log('info', 'Connected to Matrix ' + answer.split('<DviMatrixSwitch>')[1].split('</DviMatrixSwitch>')[0].split('<name>')[1].split('</name>')[0])
						resolve(answer)
					} else {
						this.log('error', 'Error while checking matrix: No valid matrix name')
						reject()
					}
				})
				.catch((err) => {
					this.log('error', 'Error while checking matrix: ' + err.toString())
					reject()
				})
		})
	}

	//Loads devices from config file
	async loadConfig() {
		return new Promise((resolve, reject) => {
			this.log('info', 'Loading config file...')
			fs.readFile(this.config.config_file, 'utf-8', (err, data) => {
				let saved_data = {}
				if (err) {
					this.log('error','Error reading config file: ' + err.toString())
					reject()
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

	//Gets devices from matrix and compares them to devices from the config list
	async checkConfig(saved_data, connected_data) {
		this.log('debug', 'Compare connected Devices to config...')
		//this.log('debug', 'Connected Devices:')
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
				this.log('error', 'Error writing config file: ' + err.toString())
			}
		})
	}
}

runEntrypoint(PAWInstance, [])
