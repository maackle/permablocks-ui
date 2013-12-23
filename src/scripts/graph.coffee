
class GraphController

	currentSidebarDragProcess: null
	currentSocketDrag: null

	force: null
	forceNodes: null
	forceLinks: null
	allProcesses: null
	allBindings: null

	constructor: ->
		@allProcesses = []
		@allBindings = []

	initialize: (o) ->
		{ @processList, } = o
		@svg = d3.select('#svg')
		@field = d3.select('#field')
		@$universe = $('#universe')
		@$sidebar = $('#sidebar')
		@renderSidebar()
		@bindEvents()
		
		{charge, linkDistance, linkStrength, length} = Settings.Force.Process
		@force = d3.layout.force()
			.charge(charge)
			.linkDistance(linkDistance)
			.linkStrength(linkStrength)
			.size([length, length])
			.gravity(0)
			.nodes([])
			.links([])

		@force.on 'tick', @onTick

		@force.start()
		# for i in [0..Settings.warmStartIterations]
		# 	@force.tick()
		
	onTick: (e) =>

		processes = d3.selectAll('.process')
		sockets = d3.selectAll('.socket')
		bindings = d3.selectAll('.binding')
		links = d3.selectAll('.process-socket-link')

		sockets.each (d, i) ->
			unless d.isDragging
				d.x += (d.processData.x - d.x) * e.alpha * Settings.processGravity 
				d.y += (d.processData.y - d.y) * e.alpha * Settings.processGravity

		
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


		bindings.each (s, i) ->
			a = s.source
			b = s.target
			mean =
				x: (a.x + b.x) / 2
				y: (a.y + b.y) / 2
			dist = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
			s.x = mean.x
			s.y = mean.y
			s.radius = dist/2
			d3.select(this).select("circle").attr
				cx: s.x
				cy: s.y
				r: s.radius


	bindEvents: ->
		controller = this
		@$sidebar.find('li')
			.on 'dragstart', (e) ->
				index = $(e.currentTarget).data('index')
				e.originalEvent.dataTransfer.setData('Text', this.id)
				controller.currentSidebarDragProcess = controller.processList[index]
			.on 'dragend', (e) ->
				controller.currentSidebarDragProcess = null
		@$universe
			.on 'drop', (e) =>
				dummy = e.originalEvent.dataTransfer.getData("text/plain")
				x = e.originalEvent.pageX
				y = e.originalEvent.pageY
				if controller.currentSidebarDragProcess?
					controller.allProcesses.push new ProcessNode
						process: controller.currentSidebarDragProcess
						position: new Vec x, y
					controller.updateProcesses()
			.on 'dragenter', (e) =>
				e.preventDefault()
			.on 'dragover', (e) =>
				e.preventDefault()

		$(window).on 'resize', (e) ->
			d3.select('#svg')
				.attr
					width: $(window).width()
					height: $(window).height()

		$(window).trigger 'resize'


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
				for node in controller.allProcesses when node isnt socket.processData
					for other in node.sockets()
						L = Settings.sniffDistance + 2*Settings.socketCircleRadius
						if socket.canBindTo(other)
							other.isPotentialMate = true
							close = Math.abs(socket.x - other.x) < L and Math.abs(socket.y - other.y) < L
							if close
								other.attractTo socket

	updateBindings: ->
		controller = this
		@d3bindings = @field.select('g.bindings').selectAll('g.binding').data(@allBindings)
		bindings = @d3bindings.enter().append('g')
			.attr
				class: 'binding'
			.each (d, i) ->
				nodes = controller.force.nodes()
				links = controller.force.links()
				for binding in controller.allBindings
					nodes.push binding.source
					nodes.push binding.target
					links.push binding
				controller.force.nodes nodes
				controller.force.links links

		bindings.append('circle')
			.attr
				class: 'binding-circle'
				r: (d) -> d.radius
		
		@force.start()


	updateProcesses: ->
		controller = this

		processes = @field.selectAll('g.process')
			.data(@allProcesses).enter().append('g')
			.attr
				class: 'process'

		socketGroups = processes.append('g')
			.attr
				class: 'socket-group'

		processes.append('circle')
			.attr
				class: 'handle process-handle'
				cx: (d) -> d.x
				cy: (d) -> d.y
				r: (d) -> d.radius
				# transform: "rotate(45)"
			.call(controller.processDragging())

		processes.append('text')
			.attr
				class: 'label process-name'
				'text-anchor': 'middle'
				x: (d) -> d.x
				y: (d) -> d.y
			.text (d) -> d.process.name

		forceNodes = @force.nodes()
		forceLinks = @force.links()

		socketGroups.each (process, i) ->
			g = d3.select(this)
			# handle = d3.select(this.parentNode).select('.process-handle')
			# console.log handle

			process.fixed = true

			sox = process.sockets()
			socketLinks = sox.map (s) ->
				if s.kind == 'input'
					source: s
					target: process
					direction: 'input'
				else
					source: process
					target: s
					direction: 'output'
			forceNodes.push process
			forceNodes = forceNodes.concat sox
			forceLinks = forceLinks.concat socketLinks

			links = g.selectAll('process-socket-link').data(socketLinks).enter().append('line')
				.attr
					class: (d) -> "process-socket-link #{ d.direction }"
					'marker-end': 'url(#arrowhead-triangle)'

			sockets = g.selectAll('.socket').data(sox).enter().append('g')
				.attr
					class: (d) -> "socket #{ d.kind }"
				.each (x, i) ->
					x.processData = process
				.call(controller.socketDragging())

			sockets.append('circle')
				.each (d, i) ->
					N = sox.length
					d.x = d.px = d.processData.x + 200 * Math.cos(i * 2 * Math.PI / N)
					d.y = d.py = d.processData.y + 200 * Math.sin(i * 2 * Math.PI / N)
				.attr
					class: 'handle socket-handle'
					cx: (d) -> d.x
					cy: (d) -> d.y
					r: (d) -> d.radius

			sockets.append('text')
				.attr
					'text-anchor': 'middle'
					class: 'label substance-name'
					stroke: 'black'
				.text (d) -> d.substance.name

			setInterval controller.socketUpdateCallback(sockets), Settings.updateDelayMs

		@force.nodes forceNodes
		@force.links forceLinks
		@force.start()

	processDragging: ->
		controller = this
		d3.behavior.drag().origin( (d) -> d )
			.on 'dragstart', (d) ->
				d3.event.sourceEvent.stopPropagation()
			.on 'drag', (d) ->
				{x, y} = d3.event
				node = d3.select(this)
				label = d3.select(this.parentNode).select('.process-name')
				d.px = x
				d.py = y
				node.attr
					cx: (d) -> x
					cy: (d) -> y
				label.attr
					x: (d) -> x
					y: (d) -> y
				controller.force.resume()

	socketDragging: ->
		controller = this
		d3.behavior.drag().origin( (d) -> d )
			.on 'drag', (socket) ->
				{x, y} = d3.event
				socket.px = x
				socket.py = y
				controller.force.resume()
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
					if socket isnt s and Math.abs(socket.x - s.x) < 100 and Math.abs(socket.y - s.y) < 100
						controller.allBindings.push new SocketBinding socket, s
						controller.updateBindings()
					s.isPotentialMate = false
				socket.isDragging = false
				socket.fixed = false


	renderSidebar: ->
		html = ""
		for p, i in @processList
			html += """
				<li data-index="#{ i }" draggable="true" class="draggable">#{ p.name }</li>
			"""
		@$sidebar.find('ul').html(html)
