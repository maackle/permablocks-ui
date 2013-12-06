(function() {
  var GraphController, NodeView, Process, ProcessNode, Settings, Socket, Substance, Vec, dataTranslate;

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

    Socket.prototype.canBindTo = function(other) {
      var a, b;
      a = this.substance;
      b = other.substance;
      return this.kind !== other.kind && a.isSimilarTo(b);
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
        charge: -1000,
        linkDistance: 200,
        length: 600
      }
    },
    processRectSize: 100,
    socketCircleRadius: 50,
    sniffDistance: 50,
    warmStartIterations: 50
  };

  GraphController = (function() {
    GraphController.prototype.currentSidebarDragProcess = null;

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
        var centerNode, charge, force, g, handle, length, linkDistance, links, sockets, sox, _i, _ref, _ref1, _results;
        g = d3.select(this);
        handle = d3.select(this.parentNode).select('.process-handle');
        console.log(handle);
        _ref = Settings.Force.Process, charge = _ref.charge, linkDistance = _ref.linkDistance, length = _ref.length;
        force = d3.layout.force().charge(charge).linkDistance(linkDistance).size([length, length]).gravity(0);
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
        setInterval(function() {
          return sockets.each(function(d, i) {
            if (d.isPotentialMate) {
              return this.classList.add('potential-mate');
            } else {
              return this.classList.remove('potential-mate');
            }
          });
        }, 50);
        force.on('tick', function(e) {
          sockets.each(function(d, i) {
            if (!d.isDragging) {
              d.x += (centerNode.x - d.x) * e.alpha * 0.1;
              return d.y += (centerNode.y - d.y) * e.alpha * 0.1;
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
        var L, close, handle, node, other, x, y, _i, _len, _ref, _ref1, _results;
        _ref = d3.event, x = _ref.x, y = _ref.y;
        socket.px = x;
        socket.py = y;
        socket.processData.force.resume();
        node = d3.select(this);
        handle = node.select('.socket-handle');
        handle.attr({
          cx: x,
          cy: y
        });
        _ref1 = controller.processNodes;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          node = _ref1[_i];
          if (node !== socket.processData) {
            _results.push((function() {
              var _j, _len1, _ref2, _results1;
              _ref2 = node.sockets();
              _results1 = [];
              for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
                other = _ref2[_j];
                L = Settings.sniffDistance + 2 * Settings.socketCircleRadius;
                if (socket.canBindTo(other)) {
                  other.isPotentialMate = true;
                  close = Math.abs(socket.x - other.x) < L && Math.abs(socket.y - other.y) < L;
                  if (close) {
                    _results1.push(console.log(socket, other));
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
      }).on('dragstart', function(d) {
        d.isDragging = true;
        d.fixed = true;
        return d3.event.sourceEvent.stopPropagation();
      }).on('dragend', function(d) {
        d3.selectAll('.socket').each(function(d) {
          return d.isPotentialMate = false;
        });
        d.isDragging = false;
        return d.fixed = false;
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
        position: new Vec(700, 400)
      })
    ]);
  });

}).call(this);
