
class Substance

	constructor: ->
		{ @name, } = arguments


class Process

	constructor: ->
		{ @name, @inputs, @outputs} = arguments



class Node

	position: null

	constructor: (o)->
		console.log o
		{ @process, @position } = o

