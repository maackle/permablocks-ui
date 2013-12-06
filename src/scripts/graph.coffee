
dataTranslate = (d) -> "translate(#{d.x}, #{d.y})"

Settings = 
	Force:
		Process:
			charge: -200
			linkDistance: 200
			length: 600

	processRectSize: 100
	socketCircleRadius: 50

	sniffDistance: 50
	warmStartIterations: 50

class GraphController

	currentSidebarDragProcess: null

	constructor: ->
		@processNodes = []

	initialize: (o) ->
		{ @processList, } = o
		@svg = d3.select('#svg')
		@field = d3.select('#field')
		@$universe = $('#universe')
		@$sidebar = $('#sidebar')
		@renderSidebar()
		@bindEvents()

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

	updateProcesses: ->
		self = @
		nodes = @field.selectAll('g.process')
			.data(@processNodes).enter().append('g')
			.attr
				class: 'process'
				transform: dataTranslate
			.call(self.processDragging())

		socketGroups = nodes.append('g')
			.attr
				class: 'socket-group'

		nodes.append('rect')
			.attr
				class: 'handle process-handle'
				x: -Settings.processRectSize / 2
				y: -Settings.processRectSize / 2
				width: Settings.processRectSize
				height: Settings.processRectSize
				transform: "rotate(45)"

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

			sox = d.sockets()
			force.nodes sox.concat [centerNode]
			force.links sox.map (s) ->
				source: centerNode
				target: s

			links = g.selectAll('process-socket-link').data(force.links()).enter().append('line')
				.attr
					class: 'process-socket-link'

			sockets = g.selectAll('.socket').data(sox).enter().append('g')
				.attr
					class: (d) -> "socket #{ d.kind }"
				.each (x, i) ->
					x.processData = d
				.call(self.socketDragging())

			sockets.append('circle')
				.attr
					class: 'handle socket-handle'
					r: Settings.socketCircleRadius

			sockets.append('text')
				.attr
					'text-anchor': 'middle'
					class: 'substance-name'
					stroke: 'black'
				.text (d) -> d.substance.name

			setInterval ->  # non-force related update function
				sockets.each (d, i) ->
					if d.isPotentialMate then this.classList.add 'potential-mate'
					else this.classList.remove 'potential-mate'
			, 50

			force.on 'tick', (e) ->

				sockets.each (d, i) ->
					unless d.isDragging
						d.x -= d.x * e.alpha * 0.1
						d.y -= d.y * e.alpha * 0.1
					d.wx = d.x + d.processData.x
					d.wy = d.y + d.processData.y

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
				d.x = x
				d.y = y
				node.attr
					transform: dataTranslate

	socketDragging: ->
		self = this
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
				for node in self.processNodes when node isnt socket.processData
					for other in node.sockets()
						# console.log other
						L = Settings.sniffDistance + 2*Settings.socketCircleRadius
						if socket.canBindTo(other)
							other.isPotentialMate = true
							close = Math.abs(socket.wx - other.wx) < L and Math.abs(socket.wy - other.wy) < L
							if close
								console.log socket, other

			.on 'dragstart', (d) ->
				# console.log 'dragstart', d
				d.isDragging = true
				d.fixed = true
				d3.event.sourceEvent.stopPropagation()
			.on 'dragend', (d) ->
				d3.selectAll('.socket').each (d) ->
					d.isPotentialMate = false
				d.isDragging = false
				d.fixed = false

	allSockets: ->
		all = []
		for node in @processNodes
			for socket in node.sockets()
				all.push(socket)
		all
