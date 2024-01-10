import { InstanceBase, InstanceStatus, Regex, runEntrypoint } from '@companion-module/base'
import getActions from './actions.js'
import getVariables from './variables.js'
import { xml_get } from './xml.js'
import { Socket } from 'net'

let reload

class PAWInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this.reload = 0
	}

	//Initiates the module
	async init(config) {
		this.config = config
		this.consoles = { id : 0, snr: 0, label: 'no consoles loaded yet' }
		this.cpus = { id : 1, snr: 1, label: 'no cpus loaded yet', type: 'none' }

		this.updateStatus(InstanceStatus.Connecting)
		this.log('info', 'Initiate startup...')

		this.updateActions()
		this.updateVariables()

		this.log('info', 'Connecting to Matrix...')
		this.checkMatrix()
			.then((connected_data) => {
				this.updateStatus(InstanceStatus.Ok)
				this.checkConfig(connected_data)
				this.log('info', 'Config loaded')
				this.updateActions()
				this.log('info', 'Startup finished')
				//this.updateStatus(InstanceStatus.BadConfig)
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
	
	//Returns the device type for a device ID
	async getCPUTypefromID (id) {
		return new Promise((resolve, reject) => {
			for (let device of this.cpus) {
				if (id == device.id) {
					resolve(device.type)
				}
			}
			reject('Device ID not found')
		})
	}

	//Sets the config fields
	async configUpdated(config) {
		this.config = config
	}

	//Schedules multiple server requests until timeout
	async sendAction(xml, timeout = 750, retry = 4) {
		return new Promise(async (resolve, reject) => {
			for (let i = retry; i >= 1; i--) {
				try {
					const answer = await this.connectToServer(xml, timeout)
					resolve(answer)
					this.reload = 0
					break	
				} catch(error) {
					if (i == 1)  {
						this.updateStatus(InstanceStatus.ConnectionFailure)	
						reject(error)
						setTimeout(() => {
							if (this.reload <= 4) {
								this.log('warn', 'Reinit...' + this.reload)
								this.init(this.config)
								this.reload++
							} else {
								this.log('error', 'Please restart module!')
							}
						}, 2000)	
					} else {
						this.log('warn', 'Retry...')
					}
				} 			
			}
		})
	}

	//Sends xml command to configured server and returns answer
	async connectToServer(xml, timeout) {
		return new Promise((resolve, reject) => {
			let client = new Socket()
			let answer = ''		
			client.connect(this.config.matrix_port, this.config.matrix_ip, async () => {
				this.log('debug', 'Connect to Server...')
				client.write(xml)
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
				client.end()
				if (answer != '') {
					resolve(answer)
				} else {
					reject('No answer from server')						
				}
			}, timeout)
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
		]
	}

	//Checks connection to the matrix and returns connected devices
	async checkMatrix() {
		return new Promise((resolve, reject) => {
			this.log('debug', 'Checking connection to Matrix...')
			this.sendAction(xml_get.replace('target', '<IpMatrixSwitch/><IpConsole/><IpCpu/><VtCpu/>'))
				.then((answer) => {					
					if (answer.split('<IpMatrixSwitch>')[1].split('<IpMatrixSwitch>')[0].split('<name>')[1].split('</name>')[0] != '') {
						this.log('info', 'Connected to Matrix ' + answer.split('<IpMatrixSwitch>')[1].split('</IpMatrixSwitch>')[0].split('<name>')[1].split('</name>')[0])
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

	//Gets devices from matrix and compares them to devices from the config list
	async checkConfig(connected_data) {
		let connected_consoles = []
		let connected_cpus = []
		this.log('debug', 'Loads connected devices...')
		for (let item of connected_data.split('<item>')) {
			if (item.includes('<cl>')) {
				let device_type = item.split('<cl>')[1].split('</cl>')[0]
				let device_id = item.split('<id>')[1].split('</id>')[0]
				let device_label = item.split('<name>')[1].split('</name>')[0]
				if (device_type == 'IpConsole') {
					connected_consoles.push({ id : device_label, snr : device_id, label : device_label })
				} else if (device_type == 'IpCpu') {
					connected_cpus.push({ id : device_label, snr : device_id, label : device_label, type : 'Dvi' })
				} else if (device_type == 'VtCpu') {
					connected_cpus.push({ id : device_label, snr : device_id, label : device_label, type : 'Vt' })
				} else {
					continue
				}
				this.log('debug', 'New device detected. Type: ' + device_type + ', ID: ' + device_id + ', Name: ' + device_label)
			}
		}
		connected_cpus.push({ id : 0, snr : "0", label : "-Selected CPU", type : "Ip" })
		connected_cpus.push({ id : 1, snr : "1", label : "-Requested CPU", type : "Ip" })
		this.consoles = connected_consoles
		this.cpus = connected_cpus
	}
}

runEntrypoint(PAWInstance, [])
