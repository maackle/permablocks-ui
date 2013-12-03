class Vec
	x: 0
	y: 0

	constructor: (@x, @y) ->

class Substance

	constructor: ->
		{ @name, } = arguments


class Process

	constructor: ->
		{ @name, @inputs, @outputs, @position} = arguments

$ ->
	biodigester = new Process
		name: "Biodigester"
		position: new Vec 100, 100