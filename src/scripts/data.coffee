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
	nutrient_rich_water:
		name: "Nutrient Rich Water"
	electricity:
		name: "Electricity"
	

processDefs = 
	hydroponic_bed:
		name: "Hydroponic Bed"
		inputs: [ 
			"light"
			"co2"
			"water"
		]
		outputs: [
			"veggies"
			"biomass"
			"oxygen"
			"water"
		]
	fish_tank:
		name: "Fish Tank"
		inputs: [
			"light"
			"oxygen"
			"water"
		]
		outputs: [
			"tilapia"
			"co2"
			"water"
		]
	microbial_fuel_cell:
		name: "Microbial Fuel Cell"
		inputs: [ 
			"nutrient_rich_water"
			"oxygen"
	
		]
		outputs: [
			"electricity"
			"co2"
			"water"
		]

data =
	substanceDefs: substanceDefs
	processDefs: processDefs
