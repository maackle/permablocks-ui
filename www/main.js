(function() {
  var Process, Substance, Vec;

  Vec = (function() {
    Vec.prototype.x = 0;

    Vec.prototype.y = 0;

    function Vec(x, y) {
      this.x = x;
      this.y = y;
    }

    return Vec;

  })();

  Substance = (function() {
    function Substance() {
      this.name = arguments.name;
    }

    return Substance;

  })();

  Process = (function() {
    function Process() {
      this.name = arguments.name, this.inputs = arguments.inputs, this.outputs = arguments.outputs, this.position = arguments.position;
    }

    return Process;

  })();

  $(function() {
    var biodigester;
    return biodigester = new Process({
      name: "Biodigester",
      position: new Vec(100, 100)
    });
  });

}).call(this);
