
Settings = 
	Force:
		Socket:
			charge: -500
			linkDistance: 500
			linkStrength: 0.1
			length: 600
		Binding:
			charge: -300
			linkStrength: 5

	arrowheadLength: 16
	processCircleRadius: 50
	socketCircleRadius: 35
	bindingCircleRadiusFactor: 1.5  # what multiple of the socket radius?
	bindingDecouplingRadiusFactor: 1.5  # what multiple of the binding radius at which to allow decoupling?

	processGravity: 0.2
	sniffDistance: 200  # how close for a dragging socket to start affecting a compatible socket
	decouplingDistance: 200  # how far do two bound sockets need to go before unbinding
	updateDelayMs: 50
	warmStartIterations: 50  # how many force iterations to burn through before really starting?
