//Client requests
const xml_get = `<?xml version="1.0" encoding="UTF-8"?>
<root>
	<list>
		target
	</list>
</root>`

const xml_push = `<?xml version="1.0" encoding="UTF-8"?>
<root>
	<connect>
		<DviConsole type="name">target_console</DviConsole>
		<DviCpu type="name">target_cpu</DviCpu>
		<CloseDialogs/>
	</connect>
</root>`

//Server responses
const xmlConnectionList = `<?xml version="1.0" encoding="UTF-8"?>
<root>
    <list>
        <item>
          <cpuName>CPU_A</cpuName>
          <consoleName>Console_A</consoleName>
        </item>
    </list>
</root>`

const xmlConsoleList = `
<DviConsole>
	<item><id>0x0000000A</id><cl>DviConsole</cl><type>DVI-CON (2.0)</type><name>Console_A</name><ownerId>0x000004BC</ownerId>
		<ownerCl>DviMatrix</ownerCl><ownerPort>4.6</ownerPort><ownerName>CCD DemoCenter</ownerName><enable>1</enable>
		<poweredOn>false</poweredOn><transmission>1</transmission>
	</item>
	<item><id>0x0000000B</id><cl>DviConsole</cl><type>DVI-CON (2.0)</type><name>Console_B</name><ownerId>0x000004BC</ownerId>
		<ownerCl>DviMatrix</ownerCl><ownerPort>4.6</ownerPort><ownerName>CCD DemoCenter</ownerName><enable>1</enable>
		<poweredOn>false</poweredOn><transmission>1</transmission>
	</item>
</DviConsole>`

const xmlCpuList = `
<DviCpu>
	<item><id>0x0000007D</id><cl>VtCpu</cl><type>RemoteTarget</type><name>CPU_A</name><poweredOn>true</poweredOn></item>
	<item><id>0x00000082</id><cl>VtCpu</cl><type>RemoteTarget</type><name>CPU_B</name><poweredOn>true</poweredOn></item>
</DviCpu>`

const xmlVtCpuList = `
<VtCpu>
	<item><id>0x0000007E</id><cl>VtCpu</cl><type>RemoteTarget</type><name>Remote_A</name><poweredOn>true</poweredOn></item>
	<item><id>0x00000083</id><cl>VtCpu</cl><type>RemoteTarget</type><name>Remote_B</name><poweredOn>true</poweredOn></item>
</VtCpu>`

const xmlMatrixList = `
<DviMatrixSwitch>
	<item><id>0x00000001</id><cl>DviMatrix</cl><type>ControlCenter-Digital 160</type><name>CCD 160</name>
	<poweredOn>true</poweredOn><pushGet>yes</pushGet><tradeSwitching>yes</tradeSwitching><ipSwitching>yes</ipSwitching>
	<gridModeCapable>yes</gridModeCapable><matrixGuard>no</matrixGuard></item>
</DviMatrixSwitch>`

const xmlConnect = `<?xml version="1.0" encoding="utf-8"?>
<root>
    <result type="connect">
        Connection successfull
    </result>
</root>`

export { xml_get, xml_push, xmlConnectionList, xmlConsoleList, xmlCpuList, xmlVtCpuList, xmlMatrixList, xmlConnect }
