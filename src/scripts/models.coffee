
class Substance

	constructor: (o) ->
		{ @name, } = o


class Process

	constructor: (o) ->
		{ @name, @inputs, @outputs} = o


class Node

	position: null

	constructor: (o)->
		{ @process, @position } = o

