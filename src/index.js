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

		this.updateStatus(InstanceStatus.Connecting)

		this.updateActions()
		this.updateVariables()

		this.checkMatrix()
			.then(() => {
				this.log('info', 'Matrix found')
				this.updateStatus(InstanceStatus.Ok)
				fs.readFile(this.config.config_file, 'utf-8', (err, data) => {
					if (err) {
						this.log('error', `Error reading config file: ${err}`)
						return
					}
					this.log('Debug', 'Read Data from file: ' + data.toString())
					let saved_consoles = JSON.parse(data.toString())

					if (saved_consoles.consoles) {
						this.log('Debug', 'Consoles:')
						for (let item of saved_consoles.consoles) {
							this.log('debug', 'ID: ' + item.id + ', Name: ' + item.label)
						}
					} else {
						saved_consoles.consoles = []
					}

					this.getConnectedConsoles()
						.then((connected_consoles) => {
							for (let connected_console of connected_consoles) {
								let a = 0
								for (let saved_console of saved_consoles.consoles) {
									this.log('info', 'Test. ID: ' + saved_console.id + ', Name: ' + saved_console.label)
									if ((connected_consoles.label == saved_console.label) && (connected_consoles.id == saved_console.id)) {
										this.log('info', 'Console already registered, ID: ' + saved_console.id + ', Name: ' + saved_console.label)
										a = 1
									} else if (connected_consoles.label == saved_console.label) {
										this.log('info', 'Console name already registered, ID: ' + saved_console.id + ', Name: ' + saved_console.label)
										a = 1
									} else if (connected_consoles.id == saved_console.id) {
										this.log('info', 'Console ID already registered, ID: ' + saved_console.id + ', Name: ' + saved_console.label)
										a = 1
									}
								}
								if (a == 0) {
									this.log('info', 'New Console. ID: ' + connected_console.id + ', Name: ' + connected_console.label)
									saved_consoles.consoles.push({ id: [connected_console.id], label: connected_console.label })
								}
							}
							this.consoles = saved_consoles.consoles
							this.updateActions()
							fs.writeFile(this.config.config_file, JSON.stringify(saved_consoles), (err, data) => {
								if (err) {
									this.log('error', `Error writing config file: ${err}`)
								}
							})
						})
						.catch((err) => {
							this.log('error', `Error getting connected consoles: ${err}`)
						})
				})
			})
			.catch((err) => {
				this.log('error', `Error checking matrix: ${err.toString()}`)
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

	async getConnectedConsoles() {
		return new Promise((resolve, reject) => {
			this.log('debug', 'Get all connected Consoles')
			this.log('debug', 'XML: ' + xml_get.replace('target', '<DviConsole/>'))

			this.sendAction(xml_get.replace('target', '<DviConsole/>'))
				.then((answer) => {
					this.log('debug', 'Connected Consoles:')
					this.log(answer)
					let items = answer.split('<item>')
					let connected_consoles = []
					for (let item of items) {
						if (item.includes('<name>')) {
							let id = item.split('<id>')[1].split('</id>')[0]
							let label = item.split('<name>')[1].split('</name>')[0]
							connected_consoles.push({ id: [id], label: [label] })
							this.log('debug', 'ID: ' + id + ', Name: ' + item)
						}
					}
					resolve(connected_consoles)
				})
				.catch((err) => {
					reject(err)
				})
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
			this.log('debug', 'XML: ' + xml_get.replace('target', '<DviMatrixSwitch/>'))
			this.sendAction(xml_get.replace('target', '<DviConsole/>'))
				.then((answer) => {
					this.log('debug', answer.split('<name>')[1].split('</name>')[0])
					if (answer.split('<name>')[1].split('</name>')[0] != '') {
						resolve()
					} else {
						reject('No valid Matrix')
					}
				})
				.catch(() => {
					reject('Connection failure')
				})
		})
	}
}

runEntrypoint(PAWInstance, [])
