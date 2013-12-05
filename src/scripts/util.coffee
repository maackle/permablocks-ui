class Vec
	x: 0
	y: 0

	constructor: (@x, @y) ->

	@polar: (r, t) ->
		new Vec (Math.cos(t) * r), (Math.sin(t) * r)