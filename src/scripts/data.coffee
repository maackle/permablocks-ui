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
	food_scraps:
		name: "Food Scraps"
	biogas:
		name: "Biogas"
	heat:
		name: "Heat"
	burnable_material:
		name: "Burnable Material"
	kinetic_energy:
		name: "Kinetic Energy"
	methane:
		name: "Methane"
	iron_sulfide:
		name: "Iron Sulfide"
	steel_wool:
		name: "Steel Wool"
	feces:
		name: "Feces"
	urine:
		name: "Urine"
	

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
	biodigester:
		name: "Biodigester"
		inputs: [ 
			"water"
			"food_scraps"
	
		]
		outputs: [
			"biogas"
			"nutrient_rich_water"
		]
	solar_panel:
		name: "Solar Panel"
		inputs: [ 
			"light"
	
		]
		outputs: [
			"electricity"
		]
	gas_mantle:
		name: "Gas Mantle"
		inputs: [ 
			"biogas"
			"oxygen"
	
		]
		outputs: [
			"light"
			"heat"
			"co2"
		]
	hot_compost:
		name: "Hot Compost Water Heater"
		inputs: [ 
			"food_scraps"
			"biomass"
			"oxygen"
			"water"
	
		]
		outputs: [
			"water"
			"heat"
			"co2"
		]
	gasifier:
		name: "Gasifier"
		inputs: [ 
			"burnable material"
			"oxygen"
	
		]
		outputs: [
			"light"
			"heat"
			"co2"
		]

	solid_oxide_fuel_cell:
		name: "Solid Oxide Fuel Cell"
		inputs: [ 
			"methane"
			"oxygen"
			"water"
	
		]
		outputs: [
			"co2"
			"water"
			"heat"
			"electricity"
		]
	biogas_scrubber:
		name: "Biogas Scrubber"
		inputs: [ 
			"biogas"
			"steel_wool"
	
		]
		outputs: [
			"methane"
			"iron_sulfide"
		]
	human:
		name: "Human"
		inputs: [ 
			"water"
			"oxygen"
			"food"
	
		]
		outputs: [
			"feces"
			"urine"
			"co2"
		]
data =
	substanceDefs: substanceDefs
	processDefs: processDefs
