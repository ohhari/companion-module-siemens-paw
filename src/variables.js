export const getVariables = function (instance) {
	const variables = []
	variables.push({ variableId: 'req_cpu', name: 'Requested CPU' })
	variables.push({ variableId: 'sel_cpu', name: 'Selected CPU' })
	return variables
}

export const setVariable = function(instance, variableIdent, variableValue){
	instance.setVariableValues({[variableIdent] : variableValue})
}




