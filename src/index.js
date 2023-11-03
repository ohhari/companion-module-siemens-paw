import { InstanceBase, InstanceStatus, Regex, runEntrypoint } from '@companion-module/base'
import { getActions } from './actions.js'
import { getVariables, setVariable } from './variables.js'
import { Socket } from 'net';
import * as fs from 'fs'

const xml_get = `<?xml version="1.0" encoding="UTF-8"?>
<root>
	<list>
		target
	</list>
</root>`

class PAWInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this.checkMatrix = this.checkMatrix.bind(this)
		this.getConnectedConsoles = this.getConnectedConsoles.bind(this)
		this.sendAction = this.sendAction.bind(this)
		//this.getActions = getActions.bind(this)

	}

	async init(config) {
		this.config = config
		this.consoles = { id: 0, label: 'no consoles loaded yet' }
		this.updateStatus(InstanceStatus.Connecting)
		//this.updateStatus(InstanceStatus.Ok)
		this.updateActions()
		this.updateVariables()

		this.checkMatrix(this)
		.then(() => {
			this.log('info', 'Matrix found')
			this.updateStatus(InstanceStatus.Ok)
			let known_consoles = []
			fs.readFile(this.config.config_file, 'utf-8', function (err, data) {
				if (err){
					this.log('error', err.toString()) 
			} else {
					this.log('Debug', 'Read Data from file: ' + data.toString())
					var mydata = JSON.parse(data.toString())
					this.log('Debug','Consoles:')
					for (let item of mydata.consoles) {
						this.log('debug', "ID: " + item.id + ', Name: ' + item.label)
					}
					
					this.getConnectedConsoles(this)
					.then((consoles) => {
						for (let item of consoles) {
							let a = 0
							let b = 0
							for (let known_item of mydata.consoles) {
								if (item.label == known_item.label){
									a = 1
								}
								b = b + 1
							}
							if (a == 0){
								this.log('info', 'New Console. ID: ' + b + ', Name: ' + item.label)
								mydata.consoles.push({id : [b], label : item.label})
							}
						}
						this.consoles = mydata.consoles
						this.updateActions()
						fs.writeFile(this.config.config_file, JSON.stringify(mydata), function (err, data) {
							if (err){
								this.log('error', err.toString()) 
							}
						}.bind(this))
					})
					.catch((err) => {
						this.log('error', err.toString())		
					})					
				}

				
			}.bind(this));


		})
		.catch((err) => {
			this.log('error', err)
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
		setVariable(this, variableIdent, variableValue)
	}

	async configUpdated(config) {
		this.config = config
	}

	async sendAction(xml){
		return new Promise ((resolve, reject) => {
				var client = new Socket()
				var answer = ""
	
				client.connect(
					this.config.matrix_port,
					this.config.matrix_ip,
					async function() {
						client.write(xml)
						this.log('debug', 'Connected....')
					}.bind(this)
				);
	
				client.on('data', async function(data) {
					data = data.toString().replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace('&quot;', '"').replace('&#39;', "'").replace('&#x2F;', "/").replace('&apos;', "'")
					this.log('debug', 'Received ' + data.length + ' bytes\n' + data)
					answer = answer + data
				}.bind(this))

				client.on('close', async function() {
					client.destroy()
					this.log('debug','Connection closed...')
				}.bind(this))

				client.on('error', async function() {
					client.destroy()
					this.log('debug','Connection closed...')
				}.bind(this))

				setTimeout(function() {
					if (answer == '') {
						reject()
					} else {
						resolve(answer)
					}
				}, 500);
		});
	}

	async getConnectedConsoles() {
		return new Promise ((resolve, reject) => {
			this.log('debug', 'Get all connected Consoles')
			this.log('debug', 'XML: ' + xml_get.replace('target','<DviConsole/>'))

			this.sendAction(xml_get.replace('target','<DviConsole/>'))
			.then((answer) => {
				this.log('debug','Connected Consoles:')
				let items = answer.split("<item>")
				let unsorted_consoles = []
				for (let item of items) {
					if (!item.includes("<name>")) {
						continue;
					} else {
						unsorted_consoles.push(item.split("<name>")[1].split("</name>")[0])
					}
				}
				let connected_consoles = []
				var ID = 0
				for (let item of unsorted_consoles) {//.sort()
						connected_consoles.push({id : [ID], label : item})
						this.log('debug', ID + ": " + item);
						ID = ID + 1

				} 
				resolve(connected_consoles)
			})
			.catch(() => {
				reject()
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

	async checkMatrix(){
		return new Promise ((resolve, reject) => {
			this.log('debug', 'Check connection to Matrix')
			this.log('debug', 'XML: ' + xml_get.replace('target','<DviMatrixSwitch/>'))
			this.sendAction(xml_get.replace('target','<DviConsole/>'))
			.then((answer) => {
				this.log('debug', answer.split("<name>")[1].split("</name>")[0])
				if (answer.split("<name>")[1].split("</name>")[0] != '') {
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