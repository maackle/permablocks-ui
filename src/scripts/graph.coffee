
Settings = 
	graphCharge: -100
	linkDistance: 100

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

	nodes.append('rect')
		.attr
			class: 'process'
			width: 100
			height: 100
			transform: "rotate(45)"
		.style
			fill: '#eee'
			stroke: 'black'
			strokeWidth: 2
