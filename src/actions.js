import { xml_get, xml_push, xml_script } from './xml.js'

export default function (instance) {
	return {
		//Action to push a cpu to a console
		pushCPUtoConsole: {
			name: 'Push CPU to Console',
			options: [
				{
					type: 'dropdown',
					label: 'Push CPU',
					id: 'cpu',
					default: '0',
					tooltip: 'Select CPU',
					choices: Object.keys(instance.cpus)
						.map((key) => ({
							id: instance.cpus[key].id,
							label: instance.cpus[key].label,
						}))
						.sort((a, b) => {
							if (a.id < b.id) {
								return -1
							}
							if (a.id > b.id) {
								return 1
							}
							return 0
						}),
					minChoicesForSearch: 5,
				},
				{
					type: 'dropdown',
					label: 'to Console',
					id: 'console',
					default: '0',
					tooltip: 'Select Console',
					choices: Object.keys(instance.consoles)
						.map((key) => ({
							id: instance.consoles[key].id,
							label: instance.consoles[key].label,
						}))
						.sort((a, b) => {
							if (a.id < b.id) {
								return -1
							}
							if (a.id > b.id) {
								return 1
							}
							return 0
						}),
					minChoicesForSearch: 5,
				},
			],
			callback: async (event) => {
				let sel_cpu_label = event.options.cpu
				let sel_console_label = event.options.console
				if (event.options.cpu == 0) {
					sel_cpu_label = instance.getVariableValue('selectedCPU')
				} 
				if (event.options.cpu == 1) {
					sel_cpu_label = instance.getVariableValue('requestedCPU')
				}
				instance.getCPUTypefromID(sel_cpu_label)
					.then((sel_cpu_type) => {
						if (sel_cpu_label != '' && sel_console_label != '') {
							instance.log('info','Pushing CPU ' + sel_cpu_label + ' to Console ' + sel_console_label + '...')
							let xml = xml_push.replace('target_console', sel_console_label).replace('target_cpu', sel_cpu_label)
							if (sel_cpu_type == 'Vt') {
								xml = xml.replace('<DviCpu type="name">', '<VtCpu type="name">').replace('</DviCpu>', '</VtCpu>')
							}	
							instance.sendAction(xml)
								.then((answer) => {
									answer = answer.split('<result type="connect">')[1].split('</result>')[0].replace('&apos;', `'`).replace('&apos;', `'`)
									if (answer.includes('<Warning>')) {
										instance.log('warn', answer.replace('<Warning>', '').replace('</Warning>', ''))
									} else if (answer.includes('<Error>')) {
										instance.log('error', answer.replace('<Error>', '').replace('</Error>', ''))
									} else {
										instance.log('info', answer.replace('<commandStatus>', '').replace('</commandStatus>', ''))
									}
								})
								.catch((err) => {
									instance.log('error', 'Error while pushing CPU to Console: ' + err.toString())
								})
						} else {
							instance.log('error', 'No CPU/Console selected')
						}
					})
					.catch((err) => {
						instance.log('error', 'Error getting CPU type: ' + err.toString())
					})
			},
		},
		//Action that writes a cpu to the variable "selectedCPU"
		selectCPU: {
			name: 'Select CPU',
			options: [
				{
					type: 'dropdown',
					label: 'Select CPU',
					id: 'cpu',
					default: '0',
					tooltip: 'Select CPU',
					choices: Object.keys(instance.cpus)
						.map((key) => ({
							id: instance.cpus[key].id,
							label: instance.cpus[key].label,
						}))
						.sort((a, b) => {
							if (a.id < b.id) {
								return -1
							}
							if (a.id > b.id) {
								return 1
							}
							return 0
						}),
					minChoicesForSearch: 5,
				},
			],
			callback: async (event) => {
				instance.log('info','Set selected CPU to ' + event.options.cpu)
				instance.setVariable('selectedCPU', event.options.cpu)
			},
		},
		//Action that request a cpu from a console and writes it to the variable "requestedCPU"
		requestCPUfromConsole: {
			name: 'Request CPU from Console',
			options: [
				{
					type: 'dropdown',
					label: 'Select Console',
					id: 'console',
					default: '0',
					tooltip: 'Select Console',
					choices: Object.keys(instance.consoles)
						.map((key) => ({
							id: instance.consoles[key].id,
							label: instance.consoles[key].label,
						}))
						.sort((a, b) => {
							if (a.id < b.id) {
								return -1
							}
							if (a.id > b.id) {
								return 1
							}
							return 0
						}),
					minChoicesForSearch: 5,
				},
			],
			callback: async (event) => {
				let sel_console_label = event.options.console
				instance.log('info','Requesting CPU from Console ' + sel_console_label + '...')
				instance.sendAction(xml_get.replace('target', '<MatrixConnectionList/>'))
					.then((answer) => {
						let a = 0
						let items = answer.split('<item>')
						for (let item of items) {
							if (!item.includes('<cpuName>')) {
								continue
							} else {
								let req_cpu_label = item.split('<cpuName>')[1].split('</cpuName>')[0]
								let req_console_label = item.split('<consoleName>')[1].split('</consoleName>')[0]
								if (sel_console_label == req_console_label) {
									a = 1	
									instance.log('info','Set requested CPU to ' + req_cpu_label)
									instance.setVariable('requestedCPU', req_cpu_label)		
								}
							}
						}
						if (a == 0) {
							instance.log('warn', 'Console has no connection')
						}
					})
					.catch((err) => {
						instance.log('error', 'Error while requesting CPU from Console: ' + err.toString())
					})
			},
		},
		//Action to push a cpu to a console
		executeScriptlet: {
			name: 'Execute Scriptlet',
			options: [
				{				
					type: 'textinput',
					label: 'Execute Scriptlet',
					id: 'scriptlet',
					default: '',
					tooltip: 'Select Scriptlet',
				},
				{
					type: 'dropdown',
					label: 'on Console',
					id: 'console',
					default: '0',
					tooltip: 'Select Console',
					choices: Object.keys(instance.consoles)
						.map((key) => ({
							id: instance.consoles[key].id,
							label: instance.consoles[key].label,
						}))
						.sort((a, b) => {
							if (a.id < b.id) {
								return -1
							}
							if (a.id > b.id) {
								return 1
							}
							return 0
						}),
					minChoicesForSearch: 5,
				},
			],
			callback: async (event) => {
				//instance.log('debug', xml_script.replace('target_console', event.options.console).replace('scriptlet', event.options.scriptlet))
				instance.sendAction(xml_script.replace('target_console', event.options.console).replace('scriptlet', event.options.scriptlet))
					.then((answer) => {
						answer = answer.split('<result type="executeScriptlet">')[1].split('</result>')[0]
						if (answer.includes('<Warning>')) {
							instance.log('warn', answer.replace('<Warning>', '').replace('</Warning>', ''))
						} else if (answer.includes('<Error>')) {
							instance.log('error', answer.replace('<Error>', '').replace('</Error>', ''))
						} else {
							instance.log('info', answer.replace('<commandStatus>', '').replace('</commandStatus>', '').replace('&apos;', `'`).replace('&apos;', `'`))
						}
					})
					.catch((err) => {
						instance.log('error', 'Error while executing scriptlet on Console: ' + err.toString())
					})
			},
		},
	}
}