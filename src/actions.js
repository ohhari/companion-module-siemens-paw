import { xml_get, xml_push } from './xml.js'

export default function (instance) {
	return {
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
				let sel_cpu_id = event.options.cpu
				let sel_console_id = event.options.console
				let sel_cpu_label = ""
				let sel_console_label = ""
				let vt = 0
				console.log(instance.cpus)

				for (let cpu in instance.cpus) {
					console.log(cpu.id)
					if (sel_cpu_id == cpu.id) {
						sel_cpu_label = cpu.label
						instance.log('error', sel_cpu_label)
						if (cpu.label == "_ Selected CPU") {
							try {
								sel_cpu_label = instance.getVariableValue('sel_cpu')
							} catch (err) {
								instance.log('error', `Error while getting variable sel_cpu: ${err}`)
							}
						}
						if (cpu.label == "_ Requested CPU") {
							try {
								sel_cpu_label = instance.getVariableValue('req_cpu')
							} catch (err) {
								instance.log('error', `Error while getting variable req_cpu: ${err}`)
							}
						}
						if (cpu.type == 'Vt') {
							vt = 1
						}	
						break
					}
				}
				for (let console in instance.consoles) {
					if (sel_console_id == console.id) {
						sel_console_label = console.label
						break
					}
				}
				console.log('Push CPU %s to Console %s', sel_cpu_label, sel_console_label)
				let xml = xml_push.replace('target_console', sel_console_label).replace('target_cpu', sel_cpu_label)
				if (vt == 1) {
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
		getCPUfromConsole: {
			name: 'Get CPU from Console',
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
	}
}
