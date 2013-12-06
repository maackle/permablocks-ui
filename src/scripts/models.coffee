
class Substance

	constructor: (o) ->
		{ @name, } = o


class Process

	constructor: (o) ->
		{ @name, @inputs, @outputs} = o

	buildSockets: ->
		all = []
		ins = @inputs.map (a) -> 
			new Socket 
				substance: a
				kind: "input"
		outs = @outputs.map (a) -> 
			new Socket 
				substance: a
				kind: "output"
		console.log ins, outs
		ins.concat outs

class Socket

	constructor: (o) ->
		{ @substance, @kind } = o

class Node

	x: null
	y: null
	fixed: true  # for force-directed layout

	constructor: (o)->
		{ @process, position } = o
		{ @x, @y } = position

