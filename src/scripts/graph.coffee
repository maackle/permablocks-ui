
dataTranslate = (d) -> "translate(#{d.x}, #{d.y})"

Settings = 
	Force:
		Process:
			charge: -300
			linkDistance: 200
			linkStrength: 0.1
			length: 600

	processRectSize: 80
	socketCircleRadius: 35

	processGravity: 0.1
	sniffDistance: 300  # how close for a dragging socket to start affecting a compatible socket
	updateDelayMs: 50
	warmStartIterations: 50  # how many force iterations to burn through before really starting?

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

		nodes.append('rect')
			.attr
				class: 'handle process-handle'
				x: (d) -> d.x - Settings.processRectSize / 2
				y: (d) -> d.y - Settings.processRectSize / 2
				width: Settings.processRectSize
				height: Settings.processRectSize
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
				source: centerNode
				target: s
			# force.links {}

			links = g.selectAll('process-socket-link').data(force.links()).enter().append('line')
				.attr
					class: 'process-socket-link'

			sockets = g.selectAll('.socket').data(sox).enter().append('g')
				.attr
					class: (d) -> "socket #{ d.kind }"
				.each (x, i) ->
					x.processData = d
				.call(controller.socketDragging())

			sockets.append('circle')
				.attr
					class: 'handle socket-handle'
					r: Settings.socketCircleRadius

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

				links.attr
					x1: (d) -> d.source.x
					y1: (d) -> d.source.y
					x2: (d) -> d.target.x
					y2: (d) -> d.target.y

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
					x: (d) -> d.x - Settings.processRectSize / 2
					y: (d) -> d.y - Settings.processRectSize / 2
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
