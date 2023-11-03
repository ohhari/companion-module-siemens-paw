import { xml_get, xml_push } from './xml'

export default function (instance) {
	return {
		pushCPUtoConsole: {
			name: 'Push CPU to Console',
			options: [
				{
					id: 'cpu',
					type: 'textinput',
					label: 'Push CPU',
					default: '',
				},
				{
					id: 'console',
					type: 'textinput',
					label: 'to Console',
					default: '',
				},
			],
			callback: async (event) => {
				let cpu = event.options.cpu

				if (cpu == '$(PAW:sel_cpu)') {
					try {
						cpu = instance.getVariableValue('sel_cpu')
					} catch (err) {
						instance.log('error', `Error while getting variable sel_cpu: ${err.toString()}`)
					}
				}
				if (cpu == '$(PAW:req_cpu)') {
					try {
						cpu = instance.getVariableValue('req_cpu')
					} catch (err) {
						instance.log('error', `Error while getting variable req_cpu: ${err.toString()}`)
					}
				}
				console.log('Push CPU %s to Console %s', cpu, event.options.console)
				let xml = xml_push.replace('target_console', event.options.console).replace('target_cpu', cpu)
				if (cpu.includes('Tabl.')) {
					xml = xml.replace('<DviCpu type="name">', '<VtCpu type="name">').replace('</DviCpu>', '</VtCpu>')
				}
				instance.log('debug', 'XML: ' + xml)

				instance
					.sendAction(xml)
					.then((answer) => {
						answer = answer.replace('&apos;', "'").split('<result type="connect">')[1].split('</result>')[0]
						if (answer.includes('<Warning>')) {
							instance.log('warn', answer.replace('<Warning>', '').replace('</Warning>', ''))
						} else if (answer.includes('<Error>')) {
							instance.log('error', answer.replace('<Error>', '').replace('</Error>', ''))
						} else {
							instance.log('info', answer.replace('<commandStatus>', '').replace('</commandStatus>', ''))
						}
					})
					.catch(() => {
						instance.log('error', 'Connection failure')
					})
			},
		},
		getCPUfromConsole: {
			name: 'Get CPU from Console',
			options: [
				{
					id: 'console',
					type: 'textinput',
					label: 'Console',
					default: '',
				},
			],
			callback: async (event) => {
				console.log('Get CPU from Console %s', event.options.console)
				instance.log('debug', 'XML: ' + xml_get.replace('target', '<MatrixConnectionList/>'))

				instance
					.sendAction(xml_get.replace('target', '<MatrixConnectionList/>'))
					.then((answer) => {
						console.log('Connected Consoles:')
						let a = 0
						let items = answer.split('<item>')
						for (let item of items) {
							if (!item.includes('<cpuName>')) {
								continue
							} else {
								let matrix_cpu = item.split('<cpuName>')[1].split('</cpuName>')[0]
								let matrix_console = item.split('<consoleName>')[1].split('</consoleName>')[0]
								if (event.options.console == matrix_console) {
									console.log('Target CPU: ' + matrix_cpu)
									instance.setVariable('req_cpu', matrix_cpu)
									a = 1
								}
							}
						}
						if (a == 0) {
							instance.log('warn', 'Console has no connection')
						}
					})
					.catch(() => {
						instance.log('error', 'Connection failure')
					})
			},
		},
		set_selected_cpu: {
			name: 'Set selected CPU',
			options: [
				{
					id: 'cpu',
					type: 'textinput',
					label: 'CPU',
					default: '',
				},
			],
			callback: async (event) => {
				console.log('Set selected CPU: ' + event.options.cpu)
				instance.setVariable('sel_cpu', event.options.cpu)
			},
		},
		read_file: {
			name: 'Read File',
			options: [],
			callback: async (event) => {},
		},
		test: {
			name: 'test',
			options: [
				{
					type: 'dropdown',
					label: 'Select Console',
					id: 'consoles',
					default: '0',
					tooltip: 'Select Console',
					choices: Object.keys(instance.consoles)
						.map((key) => ({
							id: instance.consoles[key].id,
							label: instance.consoles[key].label,
						}))
						.sort((a, b) => {
							if (a.label < b.label) {
								return -1
							}
							if (a.label > b.label) {
								return 1
							}
							return 0
						}),
					minChoicesForSearch: 5,
				},
			],
			callback: async (event) => {
				//console.log("Consolen: " + CONSOLES)
			},
		},
	}
}
