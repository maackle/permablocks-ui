
Settings = 
	graphCharge: -100
	linkDistance: 100

	processRectSize: 100

nodeTranslate = (d) -> "translate(#{d.position.x}, #{d.position.y})"

nodeDragging = d3.behavior.drag().origin( (d) -> d.position)
	.on 'drag', (d) ->
		{x, y} = d3.event
		node = d3.select(this)
		d.position.x = x
		d.position.y = y
		node.attr
			transform: nodeTranslate

initializeGraph = (data) ->
	svg = d3.select('#svg')
	field = d3.select('#field')
	nodes = field.selectAll('g.process-node')
		.data(data.nodes).enter().append('g')
		.attr
			class: 'process-node'
			transform: nodeTranslate
		.call(nodeDragging)

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

	socketGroups = nodes.append('g')
		.attr
			class: 'sockets'

	socketGroups.each (d, i) ->
		g = d3.select(this)

		for input, j in d.process.inputs
			N = d.process.inputs.length
			{x, y} = Vec.polar Settings.processRectSize, Math.PI * j / N
			console.log x, y
			g.append('circle')
				.attr
					class: 'socket input'
					r: 10
					cx: x
					cy: y
		for output, j in d.process.outputs
			N = d.process.outputs.length
			{x, y} = Vec.polar Settings.processRectSize, Math.PI * j / N + Math.PI
			g.append('circle')
				.attr
					class: 'socket output'
					r: 10
					cx: x
					cy: y

