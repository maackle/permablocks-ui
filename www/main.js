(function() {
  var Node, NodeView, Process, Settings, Socket, Substance, Vec, initializeGraph, nodeDragging, nodeTranslate, socketDragging;

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

    Process.prototype.buildSockets = function() {
      var all, ins, outs;
      all = [];
      ins = this.inputs.map(function(a) {
        return new Socket({
          substance: a,
          kind: "input"
        });
      });
      outs = this.outputs.map(function(a) {
        return new Socket({
          substance: a,
          kind: "output"
        });
      });
      console.log(ins, outs);
      return ins.concat(outs);
    };

    return Process;

  })();

  Socket = (function() {
    function Socket(o) {
      this.substance = o.substance, this.kind = o.kind;
    }

    return Socket;

  })();

  Node = (function() {
    Node.prototype.x = null;

    Node.prototype.y = null;

    Node.prototype.fixed = true;

    function Node(o) {
      var position;
      this.process = o.process, position = o.position;
      this.x = position.x, this.y = position.y;
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
    Force: {
      Process: {
        charge: -100,
        linkDistance: 100,
        length: 600
      }
    },
    processRectSize: 100,
    socketCircleSize: 10
  };

  nodeTranslate = function(d) {
    return "translate(" + d.x + ", " + d.y + ")";
  };

  nodeDragging = d3.behavior.drag().origin(function(d) {
    return d;
  }).on('drag', function(d) {
    var node, x, y, _ref;
    _ref = d3.event, x = _ref.x, y = _ref.y;
    node = d3.select(this);
    d.x = x;
    d.y = y;
    return node.attr({
      transform: nodeTranslate
    });
  });

  socketDragging = d3.behavior.drag().on('drag', function(d) {
    var node, x, y, _ref;
    _ref = d3.event, x = _ref.x, y = _ref.y;
    d.px = x;
    d.py = y;
    d.processData.force.resume();
    node = d3.select(this);
    return node.attr({
      cx: x,
      cy: y
    });
  }).on('dragstart', function(d) {
    d.isDragging = true;
    d.fixed = true;
    return d3.event.sourceEvent.stopPropagation();
  }).on('dragend', function(d) {
    0;
    d.isDragging = false;
    return d.fixed = false;
  });

  initializeGraph = function(data) {
    var field, nodes, processes, socketGroups, svg;
    svg = d3.select('#svg');
    field = d3.select('#field');
    nodes = field.selectAll('g.process-node').data(data.nodes).enter().append('g').attr({
      "class": 'process-node',
      transform: nodeTranslate
    }).call(nodeDragging);
    socketGroups = nodes.append('g').attr({
      "class": 'socket-group'
    });
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
    return socketGroups.each(function(d, i) {
      var centerNode, charge, force, g, length, linkDistance, links, sockets, sox, _i, _ref, _results;
      g = d3.select(this);
      _ref = Settings.Force.Process, charge = _ref.charge, linkDistance = _ref.linkDistance, length = _ref.length;
      force = d3.layout.force().charge(charge).linkDistance(linkDistance).size([length, length]).gravity(0);
      d.force = force;
      centerNode = {
        x: 0,
        y: 0,
        fixed: true
      };
      sox = d.process.buildSockets();
      force.nodes(sox.concat([centerNode]));
      force.links(sox.map(function(s) {
        return {
          source: centerNode,
          target: s
        };
      }));
      links = g.selectAll('process-socket-link').data(force.links()).enter().append('line').attr({
        "class": 'process-socket-link'
      });
      sockets = g.selectAll('.socket').data(sox).enter().append('circle').attr({
        "class": function(d) {
          return "socket " + d.kind;
        },
        r: Settings.socketCircleSize
      }).each(function(x, i) {
        return x.processData = d;
      }).call(socketDragging);
      force.on('tick', function(e) {
        sockets.each(function(d, i) {
          if (!d.isDragging) {
            d.x -= d.x * e.alpha * 0.1;
            return d.y -= d.y * e.alpha * 0.1;
          }
        });
        sockets.attr({
          cx: function(d) {
            return d.x;
          },
          cy: function(d) {
            return d.y;
          }
        });
        return links.attr({
          x1: function(d) {
            return d.source.x;
          },
          y1: function(d) {
            return d.source.y;
          },
          x2: function(d) {
            return d.target.x;
          },
          y2: function(d) {
            return d.target.y;
          }
        });
      });
      force.start();
      _results = [];
      for (i = _i = 0; _i <= 100; i = ++_i) {
        _results.push(force.tick());
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
          position: new Vec(200, 200)
        }), new Node({
          process: hydroponicBed,
          position: new Vec(400, 400)
        })
      ]
    });
  });

}).call(this);
