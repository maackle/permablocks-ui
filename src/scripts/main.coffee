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
		name: "Carbon \nDioxide \n(CO2)"

	oxygen = new Substance
		name: "Oxygen (O2)"

	tilapiaTank = new Process
		name: "Tilapia Tank"
		inputs: [light, co2, water]
		outputs: [veggies, biomass, oxygen, water]

	hydroponicBed = new Process
		name: "Hydroponic Bed"
		inputs: [light, oxygen, water]
		outputs: [tilapia, co2, water]

	graph = new GraphController
	graph.initialize
		processList: [
			tilapiaTank, 
			hydroponicBed,
		]
	graph.addProcesses [
		new ProcessNode
			process: tilapiaTank
			position: new Vec 400, 400
		new ProcessNode
			process: hydroponicBed
			position: new Vec 700, 400
	]

	