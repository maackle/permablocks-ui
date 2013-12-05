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
		name: "Carbon Dioxide (CO2)"
	oxygen = new Substance
		name: "Oxygen (O2)"

	tilapiaTank = new Process
		name: "Tilapia Tank"
		inputs: [light, co2, water]
		outputs: [veggies, biomass, oxygen, water]

	hydroponicBed = new Process
		name: "Hydroponic Bed"
		inputs: [light, co2, water]
		outputs: [tilapia, co2, water]

	
	initializeGraph
		nodes: [
			new Node
				process: tilapiaTank
				position: new Vec 100, 100
			new Node
				process: hydroponicBed
				position: new Vec 200, 200
		]

	