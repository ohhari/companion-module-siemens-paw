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

export { xml_get, xml_push }
