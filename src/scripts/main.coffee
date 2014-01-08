$ ->

	substances = {}
	processes = {}

	for slug, def of data.substanceDefs
		substances[slug] = new Substance(def)

	for slug, def of data.processDefs
		def.inputs = (substances[name] for name in def.inputs)
		def.outputs = (substances[name] for name in def.outputs)
		processes[slug] = new Process(def)

	graph = new GraphController
	graph.initialize
		processList: (p for k, p of processes)

	# graph.addProcesses [
	# 	new ProcessNode
	# 		process: tilapiaTank
	# 		position: new Vec 400, 400
	# 	new ProcessNode
	# 		process: hydroponicBed
	# 		position: new Vec 900, 400
	# ]

	