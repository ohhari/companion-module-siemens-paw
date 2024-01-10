//Client requests
const xml_get = `<?xml version="1.0" encoding="UTF-8"?>
<root>
	<list>
		target
	</list>
</root>`

const xml_script = `<?xml version="1.0" encoding="UTF-8"?>
<root>
	<executeScriptlet>
		<IpConsole type="name">target_console</IpConsole>
		<Name>scriptlet</Name>
	</executeScriptlet>
</root>`

const xml_push = `<?xml version="1.0" encoding="UTF-8"?>
<root>
	<connect>
		<IpConsole type="name">target_console</IpConsole>
		<IpCpu type="name">target_cpu</IpCpu>
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
		<item>
			<cpuName>CPU_B</cpuName>
			<consoleName>Console_B</consoleName>
	  </item>
    </list>
</root>`

const xmlConsoleList = `
<DviConsole>
	<item><id>0x0000000A</id><cl>IpConsole</cl><type>DVI-CON (2.0)</type><name>Console_A</name><ownerId>0x000004BC</ownerId>
		<ownerCl>IpMatrix</ownerCl><ownerPort>4.6</ownerPort><ownerName>CCIP PAW</ownerName><enable>1</enable>
		<poweredOn>false</poweredOn><transmission>1</transmission>
	</item>
	<item><id>0x0000000B</id><cl>IpConsole</cl><type>DVI-CON (2.0)</type><name>Console_B</name><ownerId>0x000004BC</ownerId>
		<ownerCl>IpMatrix</ownerCl><ownerPort>4.6</ownerPort><ownerName>CCIP PAW</ownerName><enable>1</enable>
		<poweredOn>false</poweredOn><transmission>1</transmission>
	</item>
</DviConsole>`

const xmlCpuList = `
<IpCpu>
	<item><id>0x00000082</id><cl>VtCpu</cl><type>RemoteTarget</type><name>CPU_A</name><poweredOn>true</poweredOn></item>
	<item><id>0x0000007G</id><cl>VtCpu</cl><type>RemoteTarget</type><name>CPU_B</name><poweredOn>true</poweredOn></item>
</IpCpu>`

const xmlVtCpuList = `
<VtCpu>
	<item><id>0x0000007E</id><cl>VtCpu</cl><type>RemoteTarget</type><name>Remote_A</name><poweredOn>true</poweredOn></item>
	<item><id>0x00000083</id><cl>VtCpu</cl><type>RemoteTarget</type><name>Remote_B</name><poweredOn>true</poweredOn></item>
</VtCpu>`

const xmlMatrixList = `
<IpMatrixSwitch>
	<item><id>0x00000001</id><cl>IpMatrix</cl><type>ControlCenter-IP 2.0</type><name>CCIP 2.0</name>
	<poweredOn>true</poweredOn><pushGet>yes</pushGet><tradeSwitching>yes</tradeSwitching><ipSwitching>yes</ipSwitching>
	<gridModeCapable>yes</gridModeCapable><matrixGuard>no</matrixGuard></item>
</IpMatrixSwitch>`

const xmlConnect = `<?xml version="1.0" encoding="utf-8"?>
<root>
    <result type="cmd">
		<commandStatus>Command &apos;cmd&apos; succeeded.</commandStatus>
    </result>
</root>`
//<Warning>Could not connect console 00006266:00000201 to target 000347DD:00000401: User already connected</Warning>

export { xml_get, xml_push, xml_script, xmlConnectionList, xmlConsoleList, xmlCpuList, xmlVtCpuList, xmlMatrixList, xmlConnect }