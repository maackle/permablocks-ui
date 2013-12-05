(function() {
  var Node, NodeView, Process, Settings, Substance, Vec, initializeGraph, nodeDragging, nodeTranslate;

  Vec = (function() {
    Vec.prototype.x = 0;

    Vec.prototype.y = 0;

    function Vec(x, y) {
      this.x = x;
      this.y = y;
    }

    Vec.polar = function(r, t) {
      return new Vec(Math.cos(t) * r, Math.sin(t) * r);
    };

    return Vec;

  })();

  Substance = (function() {
    function Substance(o) {
      this.name = o.name;
    }

    return Substance;

  })();

  Process = (function() {
    function Process(o) {
      this.name = o.name, this.inputs = o.inputs, this.outputs = o.outputs;
    }

    return Process;

  })();

  Node = (function() {
    Node.prototype.position = null;

    function Node(o) {
      this.process = o.process, this.position = o.position;
    }

    return Node;

  })();

  NodeView = (function() {
    NodeView.prototype.$el = null;

    function NodeView(node) {
      var substance, _i, _j, _len, _len1, _ref, _ref1;
      this.node = node;
      _ref = this.node.process.inputs;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        substance = _ref[_i];
        0;
      }
      _ref1 = this.node.process.outputs;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        substance = _ref1[_j];
        0;
      }
    }

    return NodeView;

  })();

  Settings = {
    graphCharge: -100,
    linkDistance: 100,
    processRectSize: 100
  };

  nodeTranslate = function(d) {
    return "translate(" + d.position.x + ", " + d.position.y + ")";
  };

  nodeDragging = d3.behavior.drag().origin(function(d) {
    return d.position;
  }).on('drag', function(d) {
    var node, x, y, _ref;
    _ref = d3.event, x = _ref.x, y = _ref.y;
    node = d3.select(this);
    d.position.x = x;
    d.position.y = y;
    return node.attr({
      transform: nodeTranslate
    });
  });

  initializeGraph = function(data) {
    var field, nodes, processes, socketGroups, svg;
    svg = d3.select('#svg');
    field = d3.select('#field');
    nodes = field.selectAll('g.process-node').data(data.nodes).enter().append('g').attr({
      "class": 'process-node',
      transform: nodeTranslate
    }).call(nodeDragging);
    processes = nodes.append('rect').attr({
      "class": 'process',
      x: -Settings.processRectSize / 2,
      y: -Settings.processRectSize / 2,
      width: Settings.processRectSize,
      height: Settings.processRectSize,
      transform: "rotate(45)"
    }).style({
      fill: '#eee',
      stroke: 'black',
      strokeWidth: 2
    });
    socketGroups = nodes.append('g').attr({
      "class": 'sockets'
    });
    return socketGroups.each(function(d, i) {
      var N, g, input, j, output, x, y, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3, _results;
      g = d3.select(this);
      _ref = d.process.inputs;
      for (j = _i = 0, _len = _ref.length; _i < _len; j = ++_i) {
        input = _ref[j];
        N = d.process.inputs.length;
        _ref1 = Vec.polar(Settings.processRectSize, Math.PI * j / N), x = _ref1.x, y = _ref1.y;
        console.log(x, y);
        g.append('circle').attr({
          "class": 'socket input',
          r: 10,
          cx: x,
          cy: y
        });
      }
      _ref2 = d.process.outputs;
      _results = [];
      for (j = _j = 0, _len1 = _ref2.length; _j < _len1; j = ++_j) {
        output = _ref2[j];
        N = d.process.outputs.length;
        _ref3 = Vec.polar(Settings.processRectSize, Math.PI * j / N + Math.PI), x = _ref3.x, y = _ref3.y;
        _results.push(g.append('circle').attr({
          "class": 'socket output',
          r: 10,
          cx: x,
          cy: y
        }));
      }
      return _results;
    });
  };

  $(function() {
    var biomass, co2, food, hydroponicBed, light, oxygen, tilapia, tilapiaTank, veggies, water;
    light = new Substance({
      name: "Light"
    });
    tilapia = new Substance({
      name: "Tilapia"
    });
    food = new Substance({
      name: "Food"
    });
    veggies = new Substance({
      name: "Veggies"
    });
    biomass = new Substance({
      name: "Biomass"
    });
    water = new Substance({
      name: "Water"
    });
    co2 = new Substance({
      name: "Carbon Dioxide (CO2)"
    });
    oxygen = new Substance({
      name: "Oxygen (O2)"
    });
    tilapiaTank = new Process({
      name: "Tilapia Tank",
      inputs: [light, co2, water],
      outputs: [veggies, biomass, oxygen, water]
    });
    hydroponicBed = new Process({
      name: "Hydroponic Bed",
      inputs: [light, co2, water],
      outputs: [tilapia, co2, water]
    });
    return initializeGraph({
      nodes: [
        new Node({
          process: tilapiaTank,
          position: new Vec(100, 100)
        }), new Node({
          process: hydroponicBed,
          position: new Vec(200, 200)
        })
      ]
    });
  });

}).call(this);
