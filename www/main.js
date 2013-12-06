(function() {
  var GraphController, NodeView, Process, ProcessNode, Settings, Socket, Substance, Vec, dataTranslate;

  Vec = (function() {
    Vec.prototype.x = 0;

    Vec.prototype.y = 0;

    Vec.immutable = function() {
      var v;
      v = new Vec(arguments);
      return Object.freeze(v);
    };

    Vec.polar = function(r, t) {
      var x, y;
      x = Math.cos(t) * r;
      y = Math.sin(t) * r;
      return new Vec(x, y);
    };

    function Vec() {
      var v;
      if (arguments.length === 1) {
        v = arguments[0];
        this.x = v.x;
        this.y = v.y;
      } else if (arguments.length === 2) {
        this.x = arguments[0], this.y = arguments[1];
      }
    }

    Vec.prototype.add = function(v) {
      this.x += v.x;
      this.y += v.y;
      return this;
    };

    Vec.prototype.sub = function(v) {
      this.x -= v.x;
      this.y -= v.y;
      return this;
    };

    Vec.prototype.mul = function(s) {
      this.x *= s;
      return this.y *= s;
    };

    Vec.prototype.div = function(s) {
      this.x /= s;
      return this.y /= s;
    };

    Vec.prototype.clamp = function(s) {
      if (this.x > s) {
        this.mul(s / this.x);
      }
      if (this.y > s) {
        return this.mul(s / this.y);
      }
    };

    Vec.prototype.lengthSquared = function() {
      return this.x * this.x + this.y * this.y;
    };

    Vec.prototype.length = function() {
      return Math.sqrt(this.lengthSquared());
    };

    Vec.prototype.angle = function() {
      return clampAngleSigned(Math.atan2(this.y, this.x));
    };

    return Vec;

  })();

  Vec.zero = Vec.immutable(0, 0);

  Vec.one = Vec.immutable(1, 1);

  Substance = (function() {
    function Substance(o) {
      this.name = o.name;
    }

    Substance.prototype.isSimilarTo = function(other) {
      return this === other;
    };

    return Substance;

  })();

  Process = (function() {
    function Process(o) {
      this.name = o.name, this.inputs = o.inputs, this.outputs = o.outputs;
    }

    Process.prototype.getSockets = function() {
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
      return ins.concat(outs);
    };

    return Process;

  })();

  Socket = (function() {
    Socket.prototype.isPotentialMate = false;

    function Socket(o) {
      this.substance = o.substance, this.kind = o.kind;
    }

    Socket.prototype.canBindTo = function(socket) {
      var a, b;
      a = this.substance;
      b = socket.substance;
      return this.kind !== socket.kind && a.isSimilarTo(b);
    };

    Socket.prototype.attractTo = function(socket) {
      var diff, len2;
      diff = new Vec(socket);
      diff.sub(this);
      len2 = diff.lengthSquared();
      diff.div(len2);
      diff.mul(200);
      diff.clamp(5);
      this.px -= diff.x;
      return this.py -= diff.y;
    };

    return Socket;

  })();

  ProcessNode = (function() {
    ProcessNode.prototype.x = null;

    ProcessNode.prototype.y = null;

    ProcessNode.prototype._sockets = null;

    function ProcessNode(o) {
      var position;
      this.process = o.process, position = o.position;
      this.x = position.x, this.y = position.y;
    }

    ProcessNode.prototype.sockets = function() {
      var ins, outs;
      if (this._sockets == null) {
        ins = this.process.inputs.map(function(a) {
          return new Socket({
            substance: a,
            kind: "input"
          });
        });
        outs = this.process.outputs.map(function(a) {
          return new Socket({
            substance: a,
            kind: "output"
          });
        });
        this._sockets = ins.concat(outs);
      }
      return this._sockets;
    };

    return ProcessNode;

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

  dataTranslate = function(d) {
    return "translate(" + d.x + ", " + d.y + ")";
  };

  Settings = {
    Force: {
      Process: {
        charge: -300,
        linkDistance: 200,
        linkStrength: 0.1,
        length: 600
      }
    },
    processRectSize: 100,
    socketCircleRadius: 50,
    processGravity: 0.1,
    sniffDistance: 300,
    updateDelayMs: 50,
    warmStartIterations: 50
  };

  GraphController = (function() {
    GraphController.prototype.currentSidebarDragProcess = null;

    GraphController.prototype.currentSocketDrag = null;

    function GraphController() {
      this.processNodes = [];
    }

    GraphController.prototype.initialize = function(o) {
      this.processList = o.processList;
      this.svg = d3.select('#svg');
      this.field = d3.select('#field');
      this.$universe = $('#universe');
      this.$sidebar = $('#sidebar');
      this.renderSidebar();
      return this.bindEvents();
    };

    GraphController.prototype.bindEvents = function() {
      var _this = this;
      this.$sidebar.find('li').on('dragstart', function(e) {
        var index;
        index = $(e.currentTarget).data('index');
        return _this.currentSidebarDragProcess = _this.processList[index];
      }).on('dragend', function(e) {
        return _this.currentSidebarDragProcess = null;
      });
      return this.$universe.on('drop', function(e) {
        var x, y;
        x = e.originalEvent.pageX;
        y = e.originalEvent.pageY;
        if (_this.currentSidebarDragProcess != null) {
          return _this.addProcesses([
            new ProcessNode({
              process: _this.currentSidebarDragProcess,
              position: new Vec(x, y)
            })
          ]);
        }
      }).on('dragover', function(e) {
        return e.preventDefault();
      });
    };

    GraphController.prototype.renderSidebar = function() {
      var html, i, p, _i, _len, _ref;
      html = "";
      _ref = this.processList;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        p = _ref[i];
        html += "<li data-index=\"" + i + "\" draggable=\"true\">" + p.name + "</li>";
      }
      return this.$sidebar.find('ul').html(html);
    };

    GraphController.prototype.addProcesses = function(nodes) {
      this.processNodes = this.processNodes.concat(nodes);
      return this.updateProcesses();
    };

    GraphController.prototype.socketUpdateCallback = function(sockets) {
      var controller;
      controller = this;
      return function() {
        var L, close, node, other, socket, _i, _len, _ref, _results;
        sockets.each(function(s, i) {
          if (s.isPotentialMate) {
            return this.classList.add('potential-mate');
          } else {
            return this.classList.remove('potential-mate');
          }
        });
        if (controller.currentSocketDrag != null) {
          socket = controller.currentSocketDrag;
          _ref = controller.processNodes;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            node = _ref[_i];
            if (node !== socket.processData) {
              _results.push((function() {
                var _j, _len1, _ref1, _results1;
                _ref1 = node.sockets();
                _results1 = [];
                for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                  other = _ref1[_j];
                  L = Settings.sniffDistance + 2 * Settings.socketCircleRadius;
                  if (socket.canBindTo(other)) {
                    other.isPotentialMate = true;
                    close = Math.abs(socket.x - other.x) < L && Math.abs(socket.y - other.y) < L;
                    if (close) {
                      other.processData.force.resume();
                      _results1.push(other.attractTo(socket));
                    } else {
                      _results1.push(void 0);
                    }
                  } else {
                    _results1.push(void 0);
                  }
                }
                return _results1;
              })());
            }
          }
          return _results;
        }
      };
    };

    GraphController.prototype.updateProcesses = function() {
      var controller, nodes, socketGroups;
      controller = this;
      nodes = this.field.selectAll('g.process').data(this.processNodes).enter().append('g').attr({
        "class": 'process'
      });
      socketGroups = nodes.append('g').attr({
        "class": 'socket-group'
      });
      nodes.append('rect').attr({
        "class": 'handle process-handle',
        x: function(d) {
          return d.x - Settings.processRectSize / 2;
        },
        y: function(d) {
          return d.y - Settings.processRectSize / 2;
        },
        width: Settings.processRectSize,
        height: Settings.processRectSize
      }).call(controller.processDragging());
      return socketGroups.each(function(d, i) {
        var centerNode, charge, force, g, length, linkDistance, linkStrength, links, sockets, sox, _i, _ref, _ref1, _results;
        g = d3.select(this);
        _ref = Settings.Force.Process, charge = _ref.charge, linkDistance = _ref.linkDistance, linkStrength = _ref.linkStrength, length = _ref.length;
        force = d3.layout.force().charge(charge).linkDistance(linkDistance).linkStrength(linkStrength).size([length, length]).gravity(0);
        d.force = force;
        d.fixed = true;
        centerNode = d;
        sox = d.sockets();
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
        sockets = g.selectAll('.socket').data(sox).enter().append('g').attr({
          "class": function(d) {
            return "socket " + d.kind;
          }
        }).each(function(x, i) {
          return x.processData = d;
        }).call(controller.socketDragging());
        sockets.append('circle').attr({
          "class": 'handle socket-handle',
          r: Settings.socketCircleRadius
        });
        sockets.append('text').attr({
          'text-anchor': 'middle',
          "class": 'substance-name',
          stroke: 'black'
        }).text(function(d) {
          return d.substance.name;
        });
        setInterval(controller.socketUpdateCallback(sockets), Settings.updateDelayMs);
        force.on('tick', function(e) {
          sockets.each(function(d, i) {
            if (!d.isDragging) {
              d.x += (centerNode.x - d.x) * e.alpha * Settings.processGravity;
              return d.y += (centerNode.y - d.y) * e.alpha * Settings.processGravity;
            }
          });
          sockets.select('.socket-handle').attr({
            cx: function(d) {
              return d.x;
            },
            cy: function(d) {
              return d.y;
            }
          });
          sockets.select('text.substance-name').attr({
            dx: function(d) {
              return d.x;
            },
            dy: function(d) {
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
        for (i = _i = 0, _ref1 = Settings.warmStartIterations; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          _results.push(force.tick());
        }
        return _results;
      });
    };

    GraphController.prototype.processDragging = function() {
      return d3.behavior.drag().origin(function(d) {
        return d;
      }).on('drag', function(d) {
        var node, x, y, _ref;
        _ref = d3.event, x = _ref.x, y = _ref.y;
        node = d3.select(this);
        d.px = x;
        d.py = y;
        d.force.resume();
        return node.attr({
          x: function(d) {
            return d.x - Settings.processRectSize / 2;
          },
          y: function(d) {
            return d.y - Settings.processRectSize / 2;
          }
        });
      });
    };

    GraphController.prototype.socketDragging = function() {
      var controller;
      controller = this;
      return d3.behavior.drag().on('drag', function(socket) {
        var handle, node, x, y, _ref;
        _ref = d3.event, x = _ref.x, y = _ref.y;
        socket.px = x;
        socket.py = y;
        socket.processData.force.resume();
        node = d3.select(this);
        handle = node.select('.socket-handle');
        return handle.attr({
          cx: x,
          cy: y
        });
      }).on('dragstart', function(socket) {
        controller.currentSocketDrag = socket;
        socket.isDragging = true;
        socket.fixed = true;
        return d3.event.sourceEvent.stopPropagation();
      }).on('dragend', function(socket) {
        controller.currentSocketDrag = null;
        d3.selectAll('.socket').each(function(s) {
          return s.isPotentialMate = false;
        });
        socket.isDragging = false;
        return socket.fixed = false;
      });
    };

    GraphController.prototype.allSockets = function() {
      var all, node, socket, _i, _j, _len, _len1, _ref, _ref1;
      all = [];
      _ref = this.processNodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        _ref1 = node.sockets();
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          socket = _ref1[_j];
          all.push(socket);
        }
      }
      return all;
    };

    return GraphController;

  })();

  $(function() {
    var biomass, co2, food, graph, hydroponicBed, light, oxygen, tilapia, tilapiaTank, veggies, water;
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
      name: "Carbon \nDioxide \n(CO2)"
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
      inputs: [light, oxygen, water],
      outputs: [tilapia, co2, water]
    });
    graph = new GraphController;
    graph.initialize({
      processList: [tilapiaTank, hydroponicBed]
    });
    return graph.addProcesses([
      new ProcessNode({
        process: tilapiaTank,
        position: new Vec(400, 400)
      }), new ProcessNode({
        process: hydroponicBed,
        position: new Vec(900, 400)
      })
    ]);
  });

}).call(this);
