
dataTranslate = (d) -> "translate(#{d.x}, #{d.y})"

class GraphController

	currentSidebarDragProcess: null
	currentSocketDrag: null
	interProcessForce: null
	socketBindings: null

	constructor: ->
		@processNodes = []
		@socketBindings = []

	initialize: (o) ->
		{ @processList, } = o
		@svg = d3.select('#svg')
		@field = d3.select('#field')
		@$universe = $('#universe')
		@$sidebar = $('#sidebar')
		@renderSidebar()
		@bindEvents()
		
		{charge, linkDistance, linkStrength, length} = Settings.Force.Process
		@interProcessForce = d3.layout.force()
			.charge(charge)
			.linkDistance(linkDistance)
			.linkStrength(linkStrength)
			.size([length, length])
			.gravity(0)
		 

	bindEvents: ->
		@$sidebar.find('li')
			.on 'dragstart', (e) =>
				index = $(e.currentTarget).data('index')
				@currentSidebarDragProcess = @processList[index]
			.on 'dragend', (e) =>
				@currentSidebarDragProcess = null
		@$universe
			.on 'drop', (e) =>
				x = e.originalEvent.pageX
				y = e.originalEvent.pageY
				if @currentSidebarDragProcess?
					@addProcesses [
						new ProcessNode
							process: @currentSidebarDragProcess
							position: new Vec x, y
					]
			.on 'dragover', (e) =>
				e.preventDefault()

	renderSidebar: ->
		html = ""
		for p, i in @processList
			html += """
				<li data-index="#{ i }" draggable="true">#{ p.name }</li>
			"""
		@$sidebar.find('ul').html(html)

	addProcesses: (nodes) -> 
		@processNodes = @processNodes.concat nodes
		@updateProcesses()

	socketUpdateCallback: (sockets) -> 
		controller = this
		->
			sockets.each (s, i) ->
				if s.isPotentialMate
					this.classList.add 'potential-mate'
				else 
					this.classList.remove 'potential-mate'
			if controller.currentSocketDrag?
				socket = controller.currentSocketDrag
				for node in controller.processNodes when node isnt socket.processData
					for other in node.sockets()
						# console.log other
						L = Settings.sniffDistance + 2*Settings.socketCircleRadius
						if socket.canBindTo(other)
							other.isPotentialMate = true
							close = Math.abs(socket.x - other.x) < L and Math.abs(socket.y - other.y) < L
							if close
								other.processData.force.resume()
								other.attractTo socket

	updateProcesses: ->
		controller = this
		nodes = @field.selectAll('g.process')
			.data(@processNodes).enter().append('g')
			.attr
				class: 'process'
				# transform: dataTranslate

		socketGroups = nodes.append('g')
			.attr
				class: 'socket-group'

		nodes.append('circle')
			.attr
				class: 'handle process-handle'
				cx: (d) -> d.x
				cy: (d) -> d.y
				r: (d) -> d.radius
				# transform: "rotate(45)"
			.call(controller.processDragging())

		nodes.append('text')
			.attr
				class: 'label process-name'
				'text-anchor': 'middle'
				x: (d) -> d.x
				y: (d) -> d.y
			.text (d) -> d.process.name

		socketGroups.each (d, i) ->
			g = d3.select(this)
			# handle = d3.select(this.parentNode).select('.process-handle')
			# console.log handle

			{charge, linkDistance, linkStrength, length} = Settings.Force.Process
			force = d3.layout.force()
				.charge(charge)
				.linkDistance(linkDistance)
				.linkStrength(linkStrength)
				.size([length, length])
				.gravity(0)

			d.force = force
			d.fixed = true
			centerNode = d

			sox = d.sockets()
			force.nodes sox.concat [centerNode]
			force.links sox.map (s) ->
				if s.kind == 'input'
					source: s
					target: centerNode
					direction: 'input'
				else
					source: centerNode
					target: s
					direction: 'output'
			# force.links {}

			links = g.selectAll('process-socket-link').data(force.links()).enter().append('line')
				.attr
					class: (d) -> "process-socket-link #{ d.direction }"
					'marker-end': 'url(#arrowhead-triangle)'

			sockets = g.selectAll('.socket').data(sox).enter().append('g')
				.attr
					class: (d) -> "socket #{ d.kind }"
				.each (x, i) ->
					x.processData = d
				.call(controller.socketDragging())

			sockets.append('circle')
				.attr
					class: 'handle socket-handle'
					r: (d) -> d.radius

			sockets.append('text')
				.attr
					'text-anchor': 'middle'
					class: 'label substance-name'
					stroke: 'black'
				.text (d) -> d.substance.name

			setInterval controller.socketUpdateCallback(sockets), Settings.updateDelayMs

			force.on 'tick', (e) ->

				sockets.each (d, i) ->
					unless d.isDragging
						d.x += (centerNode.x - d.x) * e.alpha * Settings.processGravity 
						d.y += (centerNode.y - d.y) * e.alpha * Settings.processGravity

				sockets.select('.socket-handle')
					.attr
						cx: (d) -> d.x
						cy: (d) -> d.y

				sockets.select('text.substance-name')
					.attr
						dx: (d) -> d.x
						dy: (d) -> d.y

				links.each (d, i) ->
					diff =
						x: d.target.x - d.source.x
						y: d.target.y - d.source.y
					angle = Math.atan2(diff.y, diff.x)
					el = d3.select(this)
					strokeWidth = el.style('stroke-width').replace("px", "")
					el.attr
						x1: d.source.x + Math.cos(angle) * (d.source.radius)
						y1: d.source.y + Math.sin(angle) * (d.source.radius)
						x2: d.target.x - Math.cos(angle) * (d.target.radius + 3 * strokeWidth)
						y2: d.target.y - Math.sin(angle) * (d.target.radius + 3 * strokeWidth)

			force.start()
			for i in [0..Settings.warmStartIterations]
				force.tick()

	processDragging: ->
		d3.behavior.drag().origin( (d) -> d)
			.on 'drag', (d) ->
				{x, y} = d3.event
				node = d3.select(this)
				label = d3.select(this.parentNode).select('.process-name')
				d.px = x
				d.py = y
				d.force.resume()
				node.attr
					cx: (d) -> d.x
					cy: (d) -> d.y
				label.attr
					x: (d) -> x
					y: (d) -> y

	socketDragging: ->
		controller = this
		d3.behavior.drag()
			.on 'drag', (socket) ->
				{x, y} = d3.event
				socket.px = x
				socket.py = y
				socket.processData.force.resume()
				node = d3.select(this)
				handle = node.select('.socket-handle')
				handle.attr
					cx: x
					cy: y
				

			.on 'dragstart', (socket) ->
				controller.currentSocketDrag = socket
				socket.isDragging = true
				socket.fixed = true
				d3.event.sourceEvent.stopPropagation()
			.on 'dragend', (socket) ->
				controller.currentSocketDrag = null
				d3.selectAll('.socket').each (s) ->
					s.isPotentialMate = false
				socket.isDragging = false
				socket.fixed = false

	allSockets: ->
		all = []
		for node in @processNodes
			for socket in node.sockets()
				all.push(socket)
		all
