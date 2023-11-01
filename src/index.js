import { InstanceBase, InstanceStatus, Regex, runEntrypoint } from '@companion-module/base'
import { getActions } from './actions.js'
import { getVariables, setVariable } from './variables.js'
import { Socket } from 'net';

const xml_get = `<?xml version="1.0" encoding="UTF-8"?>
<root>
	<list>
		target
	</list>
</root>`

class PAWInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {

		let c = this
		this.config = config
		this.consoles = { id: 0, Name: 'no consoles loaded yet' }
		this.updateStatus(InstanceStatus.Connecting)
		//this.updateStatus(InstanceStatus.Ok)
		this.updateActions()
		this.updateVariables()

		this.checkMatrix(this)
		.then(() => {
			this.log('info', 'Matrix found')
			this.updateStatus(InstanceStatus.Ok)	
		})
		.catch((err) => {
			this.log('error', err)
			this.updateStatus(InstanceStatus.ConnectionFailure)				
		})



		/*this.getAllDataFromMatrix().then(() => {

			instance.consoles =
			this.log('info', 'Daten von Matrix geladen')
			//console.log(this.consoles)
			this.updateStatus(InstanceStatus.Ok)
			this.updateActions()
			this.updateVariables()
			/*const fs = require('fs')
				fs.readFile(this.config.config_file, (err, inputD) => {
				if (err) throw err;
			   console.log(inputD.toString());
		 	})
		})*/

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

	async sendAction(instance, xml){
		return new Promise ((resolve, reject) => {
				var client = new Socket()
				var answer = ""

				client.connect(
					instance.config.matrix_port,
					instance.config.matrix_ip,
					async function() {
						client.write(xml)
						instance.log('debug', 'Connected....')
					}
				);
	
				client.on('data', async function(data) {
					data = data.toString().replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace('&quot;', '"').replace('&#39;', "'").replace('&#x2F;', "/").replace('&apos;', "'")
					instance.log('debug', 'Received ' + data.length + ' bytes\n' + data)
					answer = answer + data
	
				});  

				client.on('close', async function() {
					client.destroy()
					instance.log('debug','Connection closed...')
				})

				client.on('error', async function() {
					client.destroy()
					instance.log('debug','Connection closed...')
				})

				setTimeout(function() {
					if (answer == '') {
						reject()
					} else {
						resolve(answer)
					}
				}, 500);
		});
	}

	async getConnectedConsoles(instance) {
		return new Promise ((resolve, reject) => {
			instance.log('debug', 'Get all connected Consoles')
			instance.log('debug', 'XML: ' + xml_get.replace('target','<DviConsole/>'))

			instance.sendAction(instance, xml_get.replace('target','<DviConsole/>'))
			.then((answer) => {
				instance.log('debug','Connected Consoles:')
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
						instance.log('debug', ID + ": " + item);
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

	async checkMatrix(instance){
		return new Promise ((resolve, reject) => {
			instance.log('debug', 'Check connection to Matrix')
			instance.log('debug', 'XML: ' + xml_get.replace('target','<DviMatrixSwitch/>'))
			instance.sendAction(instance, xml_get.replace('target','<DviConsole/>'))
			.then((answer) => {
				instance.log('debug', answer.split("<name>")[1].split("</name>")[0])
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
