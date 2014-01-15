(function() {
  var GraphController, NodeView, Process, ProcessNode, Settings, Socket, SocketBinding, Substance, Vec, circleIntersection, data, processDefs, substanceDefs,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Settings = {
    Force: {
      Socket: {
        charge: -500,
        linkDistance: 500,
        linkStrength: 0.1,
        length: 600
      },
      Binding: {
        charge: -300,
        linkStrength: 5
      }
    },
    arrowheadLength: 16,
    processCircleRadius: 50,
    socketCircleRadius: 35,
    bindingCircleRadiusFactor: 1.5,
    bindingDecouplingRadiusFactor: 1.5,
    processGravity: 0.2,
    sniffDistance: 200,
    decouplingDistance: 200,
    updateDelayMs: 50,
    warmStartIterations: 50
  };

  Array.prototype.remove = function() {
    var L, a, ax, what;
    a = arguments;
    L = a.length;
    while (L && this.length) {
      what = a[--L];
      while ((ax = this.indexOf(what)) !== -1) {
        this.splice(ax, 1);
      }
    }
    return this;
  };

  circleIntersection = function(a, b) {
    var dist, v;
    v = new Vec(a);
    v.sub(new Vec(b));
    dist = v.length();
    return dist < (a.radius + b.radius);
  };

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

    Vec.distance = function(a, b) {
      var x, y;
      x = a.x - b.x;
      y = a.y - b.y;
      return Math.sqrt(x * x + y * y);
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

    Socket.prototype.binding = null;

    Socket.prototype.radius = Settings.socketCircleRadius;

    function Socket(o) {
      this.substance = o.substance, this.kind = o.kind;
    }

    Socket.prototype.canBindTo = function(socket) {
      var a, b;
      a = this.substance;
      b = socket.substance;
      return this.kind !== socket.kind && a.isSimilarTo(b);
    };

    Socket.prototype.bindTo = function(socket) {
      var binding;
      console.assert(this.canBindTo(socket));
      binding = socket.kind === 'input' ? new SocketBinding(this, socket) : new SocketBinding(socket, this);
      this.binding = binding;
      return socket.binding = binding;
    };

    Socket.prototype.partner = function() {
      if (this.binding) {
        if (this === this.binding.source) {
          return this.binding.target;
        } else {
          return this.binding.source;
        }
      }
    };

    Socket.prototype.unbind = function() {
      var source, target, _ref;
      if (this.binding != null) {
        _ref = this.binding, source = _ref.source, target = _ref.target;
        source.binding = null;
        return target.binding = null;
      }
    };

    Socket.prototype.attractTo = function(socket) {
      var diff, len2;
      diff = new Vec(socket);
      diff.sub(this);
      len2 = diff.lengthSquared();
      diff.div(len2);
      diff.mul(100);
      diff.clamp(5);
      this.px -= diff.x;
      return this.py -= diff.y;
    };

    return Socket;

  })();

  SocketBinding = (function() {
    SocketBinding.prototype.source = null;

    SocketBinding.prototype.target = null;

    SocketBinding.prototype.weight = 1;

    function SocketBinding(source, target) {
      this.source = source;
      this.target = target;
    }

    SocketBinding.prototype.radius = function() {
      return (this.source.radius + this.target.radius) / 2 * Settings.bindingCircleRadiusFactor;
    };

    return SocketBinding;

  })();

  ProcessNode = (function() {
    ProcessNode.prototype.x = null;

    ProcessNode.prototype.y = null;

    ProcessNode.prototype.radius = Settings.processCircleRadius;

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

  substanceDefs = {
    light: {
      name: "Light"
    },
    tilapia: {
      name: "Tilapia"
    },
    food: {
      name: "Food"
    },
    veggies: {
      name: "Veggies"
    },
    biomass: {
      name: "Biomass"
    },
    water: {
      name: "Water"
    },
    co2: {
      name: "CO2"
    },
    oxygen: {
      name: "O2"
    },
    nutrient_rich_water: {
      name: "Nutrient Rich Water"
    },
    electricity: {
      name: "Electricity"
    },
    food_scraps: {
      name: "Food Scraps"
    },
    biogas: {
      name: "Biogas"
    },
    heat: {
      name: "Heat"
    },
    burnable_material: {
      name: "Burnable Material"
    },
    kinetic_energy: {
      name: "Kinetic Energy"
    },
    methane: {
      name: "Methane"
    },
    iron_sulfide: {
      name: "Iron Sulfide"
    },
    steel_wool: {
      name: "Steel Wool"
    },
    feces: {
      name: "Feces"
    },
    urine: {
      name: "Urine"
    }
  };

  processDefs = {
    hydroponic_bed: {
      name: "Hydroponic Bed",
      inputs: ["light", "co2", "water"],
      outputs: ["veggies", "biomass", "oxygen", "water"]
    },
    fish_tank: {
      name: "Fish Tank",
      inputs: ["light", "oxygen", "water"],
      outputs: ["tilapia", "co2", "water"]
    },
    microbial_fuel_cell: {
      name: "Microbial Fuel Cell",
      inputs: ["nutrient_rich_water", "oxygen"],
      outputs: ["electricity", "co2", "water"]
    },
    biodigester: {
      name: "Biodigester",
      inputs: ["water", "food_scraps"],
      outputs: ["biogas", "nutrient_rich_water"]
    },
    solar_panel: {
      name: "Solar Panel",
      inputs: ["light"],
      outputs: ["electricity"]
    },
    gas_mantle: {
      name: "Gas Mantle",
      inputs: ["biogas", "oxygen"],
      outputs: ["light", "heat", "co2"]
    },
    hot_compost: {
      name: "Hot Compost Water Heater",
      inputs: ["food_scraps", "biomass", "oxygen", "water"],
      outputs: ["water", "heat", "co2"]
    },
    gasifier: {
      name: "Gasifier",
      inputs: ["burnable material", "oxygen"],
      outputs: ["light", "heat", "co2"]
    },
    solid_oxide_fuel_cell: {
      name: "Solid Oxide Fuel Cell",
      inputs: ["methane", "oxygen", "water"],
      outputs: ["co2", "water", "heat", "electricity"]
    },
    biogas_scrubber: {
      name: "Biogas Scrubber",
      inputs: ["biogas", "steel_wool"],
      outputs: ["methane", "iron_sulfide"]
    },
    human: {
      name: "Human",
      inputs: ["water", "oxygen", "food"],
      outputs: ["feces", "urine", "co2"]
    }
  };

  data = {
    substanceDefs: substanceDefs,
    processDefs: processDefs
  };

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

  GraphController = (function() {
    GraphController.prototype.currentSidebarDragProcess = null;

    GraphController.prototype.currentSocketDrag = null;

    GraphController.prototype.socketForce = null;

    GraphController.prototype.bindingForce = null;

    GraphController.prototype.allProcesses = null;

    GraphController.prototype.allBindings = null;

    function GraphController() {
      this.socketTick = __bind(this.socketTick, this);
      this.bindingTick = __bind(this.bindingTick, this);
      this.allProcesses = [];
      this.allBindings = [];
    }

    GraphController.prototype.initialize = function(o) {
      var charge, length, linkDistance, linkStrength, _ref;
      this.processList = o.processList;
      this.svg = d3.select('#svg');
      this.field = d3.select('#field');
      this.$universe = $('#universe');
      this.$sidebar = $('#sidebar');
      this.renderSidebar();
      this.bindEvents();
      _ref = Settings.Force.Socket, charge = _ref.charge, linkDistance = _ref.linkDistance, linkStrength = _ref.linkStrength, length = _ref.length;
      this.socketForce = d3.layout.force().charge(charge).gravity(0).nodes([]).links([]).linkDistance(linkDistance).linkStrength(linkStrength);
      this.bindingForce = d3.layout.force().charge(Settings.Force.Binding.charge).linkStrength(Settings.Force.Binding.linkStrength).gravity(0).nodes([]).links([]);
      this.bindingForce.linkDistance(function(d, i) {
        if (!(d instanceof SocketBinding)) {
          console.error(d);
        }
        return d.radius() * 2;
      });
      this.socketForce.on('tick', this.socketTick);
      return this.bindingForce.on('tick', this.bindingTick);
    };

    GraphController.prototype.bindingTick = function(e) {
      var bindings;
      bindings = d3.selectAll('.binding');
      return bindings.each(function(binding, i) {
        var a, b, dist, mean;
        a = binding.source;
        b = binding.target;
        mean = {
          x: (a.x + b.x) / 2,
          y: (a.y + b.y) / 2
        };
        dist = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
        binding.x = mean.x;
        binding.y = mean.y;
        return d3.select(this).select("circle").attr({
          cx: binding.x,
          cy: binding.y,
          r: binding.radius()
        });
      });
    };

    GraphController.prototype.socketTick = function(e) {
      var links, processes, sockets;
      processes = d3.selectAll('.process');
      sockets = d3.selectAll('.socket');
      links = d3.selectAll('.process-socket-link');
      sockets.each(function(d, i) {
        if (!d.isDragging) {
          d.x += (d.processData.x - d.x) * e.alpha * Settings.processGravity;
          return d.y += (d.processData.y - d.y) * e.alpha * Settings.processGravity;
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
      return links.each(function(d, i) {
        var angle, diff, el, strokeWidth;
        diff = {
          x: d.target.x - d.source.x,
          y: d.target.y - d.source.y
        };
        angle = Math.atan2(diff.y, diff.x);
        el = d3.select(this);
        strokeWidth = el.style('stroke-width').replace("px", "");
        return el.attr({
          x1: d.source.x + Math.cos(angle) * d.source.radius,
          y1: d.source.y + Math.sin(angle) * d.source.radius,
          x2: d.target.x - Math.cos(angle) * (d.target.radius + 3 * strokeWidth),
          y2: d.target.y - Math.sin(angle) * (d.target.radius + 3 * strokeWidth)
        });
      });
    };

    GraphController.prototype.bindEvents = function() {
      var controller,
        _this = this;
      controller = this;
      this.$sidebar.find('li').on('dragstart', function(e) {
        var index;
        index = $(e.currentTarget).data('index');
        e.originalEvent.dataTransfer.setData('Text', this.id);
        return controller.currentSidebarDragProcess = controller.processList[index];
      }).on('dragend', function(e) {
        return controller.currentSidebarDragProcess = null;
      });
      this.$universe.on('drop', function(e) {
        var dummy, x, y;
        dummy = e.originalEvent.dataTransfer.getData("text/plain");
        x = e.originalEvent.pageX;
        y = e.originalEvent.pageY;
        if (controller.currentSidebarDragProcess != null) {
          controller.allProcesses.push(new ProcessNode({
            process: controller.currentSidebarDragProcess,
            position: new Vec(x, y)
          }));
          return controller.updateProcesses();
        }
      }).on('dragenter', function(e) {
        return e.preventDefault();
      }).on('dragover', function(e) {
        return e.preventDefault();
      });
      $(window).on('resize', function(e) {
        return d3.select('#svg').attr({
          width: $(window).width(),
          height: $(window).height()
        });
      });
      return $(window).trigger('resize');
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
          _ref = controller.allProcesses;
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

    GraphController.prototype.addBinding = function(binding) {
      var bespoke, dupe, ends, source, target;
      source = binding.source, target = binding.target;
      ends = [source, target];
      dupe = _.some(this.allBindings, function(b) {
        var _ref, _ref1;
        return (_ref = b.source, __indexOf.call(ends, _ref) >= 0) && (_ref1 = b.target, __indexOf.call(ends, _ref1) >= 0);
      });
      bespoke = _.some(this.allBindings, function(b) {
        var _ref, _ref1;
        return (_ref = b.source, __indexOf.call(ends, _ref) >= 0) || (_ref1 = b.target, __indexOf.call(ends, _ref1) >= 0);
      });
      if (!dupe && !bespoke) {
        this.allBindings.push(binding);
        return true;
      } else {
        return false;
      }
    };

    GraphController.prototype.removeBinding = function(binding) {
      return this.allBindings.remove(binding);
    };

    GraphController.prototype.updateBindings = function() {
      var binding, bindings, controller, links, nodes, _i, _len, _ref;
      controller = this;
      this.d3bindings = this.field.select('g.bindings').selectAll('g.binding').data(this.allBindings);
      nodes = [];
      links = [];
      bindings = this.d3bindings.enter().append('g').attr({
        "class": 'binding'
      });
      this.d3bindings.exit().remove();
      _ref = this.allBindings;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        binding = _ref[_i];
        nodes.push(binding);
        links.push(binding);
      }
      controller.bindingForce.nodes(nodes);
      controller.bindingForce.links(links);
      bindings.append('circle').attr({
        "class": 'binding-circle binding-handle',
        r: function(d) {
          return d.radius();
        }
      });
      return this.bindingForce.start();
    };

    GraphController.prototype.updateProcesses = function() {
      var controller, forceLinks, forceNodes, processes, socketGroups;
      controller = this;
      processes = this.field.selectAll('g.process').data(this.allProcesses).enter().append('g').attr({
        "class": 'process'
      });
      socketGroups = processes.append('g').attr({
        "class": 'socket-group'
      });
      processes.append('circle').attr({
        "class": 'handle process-handle',
        cx: function(d) {
          return d.x;
        },
        cy: function(d) {
          return d.y;
        },
        r: function(d) {
          return d.radius;
        }
      }).call(controller.processDragging());
      processes.append('text').attr({
        "class": 'label process-name',
        'text-anchor': 'middle',
        x: function(d) {
          return d.x;
        },
        y: function(d) {
          return d.y;
        }
      }).text(function(d) {
        return d.process.name;
      });
      forceNodes = this.socketForce.nodes();
      forceLinks = this.socketForce.links();
      socketGroups.each(function(process, i) {
        var g, links, socketLinks, sockets, sox;
        g = d3.select(this);
        process.fixed = true;
        sox = process.sockets();
        socketLinks = sox.map(function(s) {
          if (s.kind === 'input') {
            return {
              source: s,
              target: process,
              direction: 'input'
            };
          } else {
            return {
              source: process,
              target: s,
              direction: 'output'
            };
          }
        });
        forceNodes.push(process);
        forceNodes = forceNodes.concat(sox);
        forceLinks = forceLinks.concat(socketLinks);
        links = g.selectAll('process-socket-link').data(socketLinks).enter().append('line').attr({
          "class": function(d) {
            return "process-socket-link " + d.direction;
          },
          'marker-end': 'url(#arrowhead-triangle)'
        });
        sockets = g.selectAll('.socket').data(sox).enter().append('g').attr({
          "class": function(d) {
            return "socket " + d.kind;
          }
        }).each(function(x, i) {
          return x.processData = process;
        }).call(controller.socketDragging());
        sockets.append('circle').each(function(d, i) {
          var N;
          N = sox.length;
          d.x = d.px = d.processData.x + 200 * Math.cos(i * 2 * Math.PI / N);
          return d.y = d.py = d.processData.y + 200 * Math.sin(i * 2 * Math.PI / N);
        }).attr({
          "class": 'handle socket-handle',
          cx: function(d) {
            return d.x;
          },
          cy: function(d) {
            return d.y;
          },
          r: function(d) {
            return d.radius;
          }
        });
        sockets.append('text').attr({
          'text-anchor': 'middle',
          "class": 'label substance-name',
          stroke: 'black'
        }).text(function(d) {
          return d.substance.name;
        });
        return setInterval(controller.socketUpdateCallback(sockets), Settings.updateDelayMs);
      });
      this.socketForce.nodes(forceNodes);
      this.socketForce.links(forceLinks);
      this.socketForce.start();
      return this.bindingForce.resume();
    };

    GraphController.prototype.processDragging = function() {
      var controller;
      controller = this;
      return d3.behavior.drag().origin(function(d) {
        return d;
      }).on('dragstart', function(d) {
        return d3.event.sourceEvent.stopPropagation();
      }).on('drag', function(d) {
        var label, node, x, y, _ref;
        _ref = d3.event, x = _ref.x, y = _ref.y;
        node = d3.select(this);
        label = d3.select(this.parentNode).select('.process-name');
        d.px = x;
        d.py = y;
        node.attr({
          cx: function(d) {
            return x;
          },
          cy: function(d) {
            return y;
          }
        });
        label.attr({
          x: function(d) {
            return x;
          },
          y: function(d) {
            return y;
          }
        });
        controller.socketForce.resume();
        return controller.bindingForce.resume();
      });
    };

    GraphController.prototype.socketDragging = function() {
      var controller;
      controller = this;
      return d3.behavior.drag().origin(function(d) {
        return d;
      }).on('drag', function(socket) {
        var handle, node, x, y, _ref;
        _ref = d3.event, x = _ref.x, y = _ref.y;
        socket.px = x;
        socket.py = y;
        node = d3.select(this);
        handle = node.select('.socket-handle');
        handle.attr({
          cx: x,
          cy: y
        });
        controller.socketForce.resume();
        return controller.bindingForce.resume();
      }).on('dragstart', function(socket) {
        controller.currentSocketDrag = socket;
        socket.isDragging = true;
        socket.fixed = true;
        if (socket.binding) {
          socket.partner().fixed = true;
        }
        return d3.event.sourceEvent.stopPropagation();
      }).on('dragend', function(socket) {
        var source, target, _ref;
        controller.currentSocketDrag = null;
        d3.selectAll('.socket').each(function(s) {
          var binding;
          if (socket !== s && circleIntersection(socket, s)) {
            binding = socket.bindTo(s);
            if (controller.addBinding(binding)) {
              controller.updateBindings();
            }
          }
          return s.isPotentialMate = false;
        });
        socket.isDragging = false;
        socket.fixed = false;
        if (socket.binding) {
          _ref = socket.binding, source = _ref.source, target = _ref.target;
          socket.partner().fixed = false;
          if (Vec.distance(source, target) > 2 * socket.binding.radius() * Settings.bindingDecouplingRadiusFactor) {
            controller.removeBinding(socket.binding);
            controller.updateBindings();
            return socket.unbind();
          }
        }
      });
    };

    GraphController.prototype.renderSidebar = function() {
      var html, i, p, _i, _len, _ref;
      html = "";
      _ref = this.processList;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        p = _ref[i];
        html += "<li data-index=\"" + i + "\" draggable=\"true\" class=\"draggable\">" + p.name + "</li>";
      }
      return this.$sidebar.find('ul').html(html);
    };

    return GraphController;

  })();

  $(function() {
    var def, graph, k, name, p, processes, slug, substances, _ref, _ref1;
    substances = {};
    processes = {};
    _ref = data.substanceDefs;
    for (slug in _ref) {
      def = _ref[slug];
      substances[slug] = new Substance(def);
    }
    _ref1 = data.processDefs;
    for (slug in _ref1) {
      def = _ref1[slug];
      def.inputs = (function() {
        var _i, _len, _ref2, _results;
        _ref2 = def.inputs;
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          name = _ref2[_i];
          _results.push(substances[name]);
        }
        return _results;
      })();
      def.outputs = (function() {
        var _i, _len, _ref2, _results;
        _ref2 = def.outputs;
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          name = _ref2[_i];
          _results.push(substances[name]);
        }
        return _results;
      })();
      processes[slug] = new Process(def);
    }
    graph = new GraphController;
    return graph.initialize({
      processList: (function() {
        var _results;
        _results = [];
        for (k in processes) {
          p = processes[k];
          _results.push(p);
        }
        return _results;
      })()
    });
  });

}).call(this);
