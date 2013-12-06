
Settings = 
	Force:
		Process:
			charge: -100
			linkDistance: 100
			# linkStrength: 100
			length: 600

	processRectSize: 100
	socketCircleSize: 10

nodeTranslate = (d) -> "translate(#{d.x}, #{d.y})"

nodeDragging = d3.behavior.drag().origin( (d) -> d)
	.on 'drag', (d) ->
		{x, y} = d3.event
		node = d3.select(this)
		d.x = x
		d.y = y
		node.attr
			transform: nodeTranslate

socketDragging = d3.behavior.drag()
	.on 'drag', (d) ->
		{x, y} = d3.event
		d.px = x
		d.py = y
		d.processData.force.resume()
		node = d3.select(this)
		node.attr
			cx: x
			cy: y
	.on 'dragstart', (d) ->
		d.isDragging = true
		d.fixed = true
		d3.event.sourceEvent.stopPropagation()
	.on 'dragend', (d) ->
		0
		d.isDragging = false
		d.fixed = false

updateNodes = (nodes) ->


initializeGraph = (data) ->
	svg = d3.select('#svg')
	field = d3.select('#field')
	nodes = field.selectAll('g.process-node')
		.data(data.nodes).enter().append('g')
		.attr
			class: 'process-node'
			transform: nodeTranslate
		.call(nodeDragging)

	socketGroups = nodes.append('g')
		.attr
			class: 'socket-group'

	processes = nodes.append('rect')
		.attr
			class: 'process'
			x: -Settings.processRectSize / 2
			y: -Settings.processRectSize / 2
			width: Settings.processRectSize
			height: Settings.processRectSize
			transform: "rotate(45)"
		.style
			fill: '#eee'
			stroke: 'black'
			strokeWidth: 2

	socketGroups.each (d, i) ->
		g = d3.select(this)

		{charge, linkDistance, length} = Settings.Force.Process
		force = d3.layout.force()
			.charge(charge)
			.linkDistance(linkDistance)
			.size([length, length])
			.gravity(0)

		d.force = force

		centerNode =
			x: 0
			y: 0
			fixed: true

		sox = d.process.buildSockets()
		force.nodes sox.concat [centerNode]
		force.links sox.map (s) ->
			source: centerNode
			target: s

		links = g.selectAll('process-socket-link').data(force.links()).enter().append('line')
			.attr
				class: 'process-socket-link'

		sockets = g.selectAll('.socket').data(sox).enter().append('circle')
			.attr
				class: (d) -> "socket #{ d.kind }"
				r: Settings.socketCircleSize
			.call(socketDragging)
			.each (x, i) ->
				x.processData = d

		force.on 'tick', (e) ->
			
			sockets.each (d, i) ->
				unless d.isDragging
					d.x -= d.x * e.alpha * 0.1
					d.y -= d.y * e.alpha * 0.1

			sockets
				.attr
					cx: (d) -> d.x# unless d.isDragging
					cy: (d) -> d.y# unless d.isDragging

			links.attr
				x1: (d) -> d.source.x
				y1: (d) -> d.source.y
				x2: (d) -> d.target.x
				y2: (d) -> d.target.y

		console.log 'nodes', force.nodes()
		console.log 'links', force.links()

		force.start()
		for i in [0..100]
			force.tick()

