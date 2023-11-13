import { createServer } from 'net'
import { xmlConnectionList, xmlConsoleList, xmlCpuList, xmlVtCpuList, xmlMatrixList, xmlConnect } from './xml.js'

//Start the mockserver with "cmd>yarn run mockserver" from local directory
//Creates a server that listens on the local socket and answers with a dummy answer to a request 
createServer((socket) => {
	function writeToSocket(data) {
		socket.write(Buffer.from(data, 'utf-8').toString())
	}

	socket.on('connection', () => {
		console.log('someone connected')
	})

	socket.on('data', (data) => {
		if (data.includes('<MatrixConnectionList/>')) {
			console.log('responding to connection list')
			writeToSocket(xmlConnectionList)
			return
		}
		if (data.includes('<connect>')) {
			console.log('responding to connect')
			writeToSocket(xmlConnect.replace('cmd','connect').replace('cmd','connect'))
			return
		}
		if (data.includes('<executeScriptlet>')) {
			console.log('responding to executeScriptlet')
			writeToSocket(xmlConnect.replace('cmd','executeScriptlet').replace('cmd','executeScriptlet'))
			return
		}
		if (data.includes('<list>')) {
			console.log('responding to list')
			let answer = `<?xml version="1.0" encoding="utf-8"?><root><result type="list">`
			if (data.includes('<DviMatrixSwitch/>')) {
				answer = answer + xmlMatrixList
			}
			if (data.includes('<DviConsole/>')) {
				answer = answer + xmlConsoleList
			}	
			if (data.includes('<DviCpu/>')) {
				answer = answer + xmlCpuList
			}	
			if (data.includes('<VtCpu/>')) {
				answer = answer + xmlVtCpuList
			}
			answer = answer + `</result></root>`
			writeToSocket(answer)
			return
		}
	})

	socket.on('error', (err) => {
		console.error(err)
	})

	socket.on('close', () => {
		console.log('Mock server closed')
	})
}).listen(8080, () => {
	console.log('Mock server listening on port 8080')
})