import { createServer } from 'net'

const xmlConnectionList = `<?xml version="1.0" encoding="UTF-8"?>
<root>
    <list>
        <item>
          <cpuName>A</cpuName>
          <consoleName>B</consoleName>
        </item>
    </list>
</root>`

const xmlConsoleList = `<?xml version="1.0" encoding="UTF-8"?>
<root>
    <list>
        <item>
          <name>A</name>
        </item>
    </list>
</root>`

const xmlMatrixList = `<?xml version="1.0" encoding="UTF-8"?>
<root>
    <list>
        <item>
          <name>Matrix</name>
        </item>
    </list>
</root>`

const xmlConnect = `<?xml version="1.0" encoding="utf-8"?>
<root>
    <result type="connect">
        Connection successfull
    </result>
</root>`

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
			writeToSocket(xmlConnect)
			return
		}

		if (data.includes('<MatrixConnectionList/>')) {
			console.log('responding to connection list')
			writeToSocket(xmlConnectionList)
			return
		}

		if (data.includes('<DviConsole/>')) {
			console.log('responding to console list')
			writeToSocket(xmlConsoleList)
			return
		}

		if (data.includes('<DviMatrix/>')) {
			console.log('responding to matrix list')
			writeToSocket(xmlMatrixList)
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
