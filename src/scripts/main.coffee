$ ->

	light = new Substance
		name: "Light"

	tilapia = new Substance
		name: "Tilapia"

	food = new Substance
		name: "Food"

	veggies = new Substance
		name: "Veggies"

	biomass = new Substance
		name: "Biomass"

	water = new Substance
		name: "Water"

	co2 = new Substance
		name: "CO2"

	oxygen = new Substance
		name: "O2"

	hydroponicBed = new Process
		name: "Hydroponic Bed"
		inputs: [light, co2, water]
		outputs: [veggies, biomass, oxygen, water]

	tilapiaTank = new Process
		name: "Fish Tank"
		inputs: [light, oxygen, water]
		outputs: [tilapia, co2, water]

	graph = new GraphController
	graph.initialize
		processList: [
			tilapiaTank, 
			hydroponicBed,
		]
	# graph.addProcesses [
	# 	new ProcessNode
	# 		process: tilapiaTank
	# 		position: new Vec 400, 400
	# 	new ProcessNode
	# 		process: hydroponicBed
	# 		position: new Vec 900, 400
	# ]

	