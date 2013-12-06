
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

	constructor: (o) ->
		{ @substance, @kind } = o

	canBindTo: (other) ->
		a = this.substance
		b = other.substance
		this.kind isnt other.kind and a.isSimilarTo b


class ProcessNode

	x: null
	y: null
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
