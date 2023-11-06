import { createServer } from 'net'
import { xmlConnectionList, xmlConsoleList, xmlCpuList, xmlVtCpuList, xmlMatrixList, xmlConnect } from './xml.js'

let debuglevel = 1

createServer((socket) => {
	function writeToSocket(data) {
		socket.write(Buffer.from(data, 'utf-8').toString())
		//console.log(`Sending data: ${data.toString()}`)
	}

	socket.on('connection', () => {
		console.log('someone connected')
	})

	socket.on('data', (data) => {
		if (data.includes('<connect>')) {
			console.log('responding to connect')
			if (debuglevel == 1) {console.log(xmlConnect)}
			writeToSocket(xmlConnect)
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
			console.log(answer)
			writeToSocket(answer)
			return
		}
		if (data.includes('<MatrixConnectionList/>')) {
			console.log('responding to connection list')
			writeToSocket(xmlConnectionList)
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
