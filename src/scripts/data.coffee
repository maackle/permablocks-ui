
substanceDefs =
	light:
		name: "Light"
	tilapia:
		name: "Tilapia"
	food:
		name: "Food"
	veggies:
		name: "Veggies"
	biomass:
		name: "Biomass"
	water:
		name: "Water"
	co2:
		name: "CO2"
	oxygen:
		name: "O2"

processDefs = 
	hydroponic_bed:
		name: "Hydroponic Bed"
		inputs: ["light", "co2", "water"]
		outputs: ["veggies", "biomass", "oxygen", "water"]
	fish_tank:
		name: "Fish Tank"
		inputs: ["light", "oxygen", "water"]
		outputs: ["tilapia", "co2", "water"]

data =
	substanceDefs: substanceDefs
	processDefs: processDefs