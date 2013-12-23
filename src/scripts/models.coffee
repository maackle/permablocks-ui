
class Substance

	constructor: (o) ->
		{ @name, } = o

	isSimilarTo: (other) ->
		this == other

class Process

	constructor: (o) ->
		{ @name, @inputs, @outputs} = o

	getSockets: ->
		all = []
		ins = @inputs.map (a) -> 
			new Socket 
				substance: a
				kind: "input"
		outs = @outputs.map (a) -> 
			new Socket 
				substance: a
				kind: "output"
		ins.concat outs

class Socket

	isPotentialMate: false  # if another socket is being dragged around and this is a match
	binding: null
	radius: Settings.socketCircleRadius

	constructor: (o) ->
		{ @substance, @kind } = o

	canBindTo: (socket) ->
		a = this.substance
		b = socket.substance
		this.kind isnt socket.kind and a.isSimilarTo b

	bindTo: (socket) ->
		console.assert this.canBindTo socket
		this.binding = socket
		socket.binding = this
		if socket.kind is 'input'
			new SocketBinding this, socket
		else
			new SocketBinding socket, this


	unbind: ->
		if this.binding?
			this.binding.binding = null
			this.binding = null

	attractTo: (socket) ->
		diff = new Vec socket
		diff.sub this
		len2 = diff.lengthSquared()
		diff.div len2
		diff.mul 100
		diff.clamp 5

		@px -= diff.x
		@py -= diff.y

class SocketBinding

	source: null
	target: null

	constructor: (@source, @target) ->

	radius: -> (@source.radius + @target.radius) / 2 * 1.5

class ProcessNode

	x: null
	y: null
	radius: Settings.processCircleRadius
	_sockets: null

	constructor: (o)->
		{ @process, position } = o
		{ @x, @y } = position

	sockets: ->
		if not @_sockets?
			ins = @process.inputs.map (a) -> 
				new Socket 
					substance: a
					kind: "input"
			outs = @process.outputs.map (a) -> 
				new Socket 
					substance: a
					kind: "output"
			@_sockets = ins.concat outs
		@_sockets
