(function (d3$1) {
    'use strict';

    function pathArc(x1, y1, x2, y2, r1, r2) {
        r1 = r1 || 0;
        r2 = r2 || 0;
        const theta = Math.atan((x2 - x1) / (y2 - y1));
        const phi = Math.atan((y2 - y1) / (x2 - x1));
        const sinTheta = r1 * Math.sin(theta);
        const cosTheta = r1 * Math.cos(theta);
        const sinPhi = r2 * Math.sin(phi);
        const cosPhi = r2 * Math.cos(phi);
        if (y2 > y1) {
            x1 = x1 + sinTheta;
            y1 = y1 + cosTheta;
        }
        else {
            x1 = x1 - sinTheta;
            y1 = y1 - cosTheta;
        }
        if (x1 > x2) {
            x2 = x2 + cosPhi;
            y2 = y2 + sinPhi;
        }
        else {
            x2 = x2 - cosPhi;
            y2 = y2 - sinPhi;
        }
        const dx = x2 - x1, dy = y2 - y1;
        const dr = Math.sqrt(dx * dx + dy * dy);
        return `M${x1},${y1}A${dr},${dr} 0 0,1 ${x2},${y2}`;
    }

    function pathEllipse(cx, cy, rx = 1, ry = 1) {
        let output = `M${cx - rx},${cy}`;
        output += ` a${rx},${ry} 0 1,0 ${2 * rx},0`;
        output += ` a${rx},${ry} 0 1,0 ${-2 * rx},0`;
        return output;
    }

    function pathCircle(cx, cy, r = 1) {
        return pathEllipse(cx, cy, r, r);
    }

    function pathCross(x, y, l) {
        let output = `M${x - l * 0.5}, ${y - l * 1.25}`;
        output += ` h${l} v${l} h${l} v${l} h-${l} v${l} h-${l} v-${l} h-${l} v-${l} h${l}z`;
        return output;
    }

    function pathDiamond(x, y, h, w) {
        const sw = w / 2.0;
        const sh = h / 2.0;
        let output = `M${x - sw},${y}`;
        output += ` L${x},${y + sh} L${x + sw},${y} L${x},${y - sh}z`;
        return output;
    }

    function pathLine(x1, y1, x2, y2, r1, r2) {
        r1 = r1 || 0;
        r2 = r2 || 0;
        const theta = Math.atan((x2 - x1) / (y2 - y1));
        const phi = Math.atan((y2 - y1) / (x2 - x1));
        const sinTheta = r1 * Math.sin(theta);
        const cosTheta = r1 * Math.cos(theta);
        const sinPhi = r2 * Math.sin(phi);
        const cosPhi = r2 * Math.cos(phi);
        if (y2 > y1) {
            x1 = x1 + sinTheta;
            y1 = y1 + cosTheta;
        }
        else {
            x1 = x1 - sinTheta;
            y1 = y1 - cosTheta;
        }
        if (x1 > x2) {
            x2 = x2 + cosPhi;
            y2 = y2 + sinPhi;
        }
        else {
            x2 = x2 - cosPhi;
            y2 = y2 - sinPhi;
        }
        return `M${x1},${y1}L${x2},${y2}`;
    }

    function pathRectangle(x, y, h, w) {
        const sx = x - (w / 2.0);
        const sy = y - (h / 2.0);
        let output = `M${sx},${sy}`;
        output += ` L${sx},${sy + h} L${sx + w},${sy + h} L${sx + w},${sy}z`;
        return output;
    }

    function pathSquare(x, y, l) {
        return pathRectangle(x, y, l, l);
    }

    function pathTriangle(a, b, c) {
        let output = `M${a[0]},${a[1]}`;
        output += ` L${b[0]},${b[1]} L${c[0]},${c[1]}z`;
        return output;
    }

    var p = {
        pathArc,
        pathCircle,
        pathCross,
        pathDiamond,
        pathEllipse,
        pathLine,
        pathRectangle,
        pathSquare,
        pathTriangle
    };

    var Legend = (function () {
        function Legend(chart) {
            var _this = this;
            this._color = function (n) {
                var d = _this.datum(n);
                return d.fill;
            };
            this._open = false;
            this._icon = function () { return "circle"; };
            this._chart = chart;
            window.addEventListener("drawn", function (e) {
                if (e.detail.id === chart.id) {
                    _this.draw();
                }
            });
        }
        Legend.prototype.color = function (cb) {
            this._color = cb;
            return this;
        };
        Legend.prototype.datum = function (node) {
            return d3.select(node).datum();
        };
        Legend.prototype.draw = function () {
            var _this = this;
            var self = this;
            var data = [];
            if (!this._style) {
                var def = this._chart.svg.select("defs");
                this._style = def.append("style")
                    .attr("type", "text/css")
                    .text(".legend { font-family: Arial; font-size: 0.9em; transition: transform 500ms ease-in }\n        .legend-link { fill: #999; font-size: 0.9em; cursor: pointer; stroke-linecap: round; user-select: none }\n        .legend:hover .heading { fill: #333 }\n        .item > .label { font-size: 0.7em }");
            }
            if (this.el && !this.el.empty()) {
                this.el.remove();
            }
            this.el = this._chart.svg
                .append("g")
                .attr("class", "legend")
                .style("display", "none");
            this.el.append("text")
                .classed("legend-link", true)
                .attr("transform", "rotate(90)")
                .attr("x", 0)
                .attr("y", 0)
                .text("LEGEND")
                .on("click", function () { return _this.toggle(); });
            this._chart.svg.selectAll(this._selector)
                .each(function () {
                data.push({
                    fill: self._color(this),
                    label: self._label(this),
                    icon: self._icon(this)
                });
            });
            var items = this.el.selectAll("g.item")
                .data(data);
            items.selectAll(".label").text(function (d) { return d.label; });
            items.selectAll(".icon").attr("fill", function (d) { return d.fill; });
            var item = items.enter();
            var g = item.append("g")
                .classed("item", true)
                .attr("transform", function (d, i) { return "translate(25 " + i * 20 + ")"; });
            g.append("path")
                .attr("class", "icon")
                .attr("d", function (d) {
                if (d.icon === "triangle") {
                    return p.pathTriangle([1, 11], [11, 11], [6, 1]);
                }
                else if (d.icon === "diamond") {
                    return p.pathDiamond(6, 6, 10, 10);
                }
                else if (d.icon === "square") {
                    return p.pathSquare(6, 6, 5, 5);
                }
                else {
                    return p.pathCircle(6, 6, 5);
                }
            })
                .attr("transform", "translate(-13 0)")
                .style("opacity", 0.6)
                .style("fill", function (d) { return d.fill; })
                .style("stroke", "none");
            g.append("text")
                .attr("class", "label")
                .attr("x", 0)
                .attr("y", 9)
                .text(function (d) { return d.label; })
                .append("title")
                .text(function (d) { return d.label; });
            items.merge(items);
            items.exit().remove();
            var box = this._chart.svg.node().getBoundingClientRect();
            var hbox = this._chart.svg.select("text.legend-link").node().getBoundingClientRect();
            this._width = box.width - hbox.width + 2;
            this.el.attr("transform", "translate(" + this._width + " 4)");
            setTimeout(function () { return _this.el.style("display", null); }, 1000);
            return this;
        };
        Legend.prototype.icon = function (cb) {
            this._icon = cb;
            return this;
        };
        Legend.prototype.label = function (cb) {
            this._label = cb;
            return this;
        };
        Legend.prototype.node = function (selector) {
            this._selector = selector;
            return this;
        };
        Legend.prototype.toggle = function () {
            this._open = !this._open;
            this._nudge();
            return this;
        };
        Legend.prototype._nudge = function () {
            var container = this._chart.svg.select("g.legend");
            var link = container.select("text.legend-link");
            var lbox = container.node().getBoundingClientRect();
            var hbox = link.node().getBoundingClientRect();
            this.el.attr("transform", "translate(" + (this._width - (this._open ? lbox.width : hbox.width) + 15) + " 4)");
        };
        return Legend;
    }());

    var Contour = (function () {
        function Contour(chart) {
            var _this = this;
            this._chart = chart;
            var defs = this._chart.svg.select("defs");
            defs.append("style")
                .attr("type", "text/css")
                .text(".contour { fill: none; stroke: #999; stroke-dasharray: 1 }");
            window.addEventListener("drawn", function (e) {
                if (e.detail.id = chart.id) {
                    _this.draw();
                }
            });
        }
        Contour.prototype.data = function (d) {
            this._data = d;
            return this;
        };
        Contour.prototype.draw = function () {
            var _this = this;
            var canvas = this._chart.svg.select(".canvas");
            var box = canvas.node().getBoundingClientRect();
            canvas.insert("g", "g")
                .selectAll("path")
                .data(d3.contourDensity()
                .x(function (d) { return _this._chart.scale.x(d[0]); })
                .y(function (d) { return _this._chart.scale.y(d[1]); })
                .size([box.width, box.height])
                .bandwidth(40)(this._data))
                .enter()
                .append("path")
                .attr("class", "contour")
                .attr("stroke-linejoin", "round")
                .attr("d", d3.geoPath());
            return this;
        };
        return Contour;
    }());

    function reset(id) {
        const s = d3$1.select(`#${id}`);
        const canvas = s.select("g.canvas");
        if (canvas && !canvas.empty()) {
            canvas.selectAll("*").remove();
            canvas.attr("transform", null);
            s.select("g.pending")
                .style("display", null);
        }
    }

    function toNodes(template, isSVG = false) {
        try {
            const d = new DOMParser();
            let root;
            if (isSVG) {
                root = d.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${template}</svg>`, "image/svg+xml");
                return root.documentElement.children[0];
            }
            else {
                root = d.parseFromString(template, "text/html");
                return root.body.childNodes[0];
            }
        }
        catch (_a) {
            throw new Error("Error parsing templates string");
        }
    }

    function style(id, css) {
        const s = document.getElementById(id);
        s.querySelector("defs")
            .appendChild(toNodes(`<style type="text/css">${css}</style>`, true));
    }

    function svg(id, width, height) {
        return toNodes(`<svg id ="${id}"
    aria-labelledBy="title" role="presentation"
    preserveAspectRatio="xMinYMin meet"
    height="100%" width="100%" viewBox="0 0 ${width} ${height}"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink">
    <title class="accessibleTitle" lang="en">Chart</title>
    <defs>
      <style type="text/css">
        svg {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 1em;
          user-select: none
        }
        .heading {
          cursor: move;
          font-size: 1.4em
        }
      </style>
    </defs>
    <g class="canvas"></g>
    <g class="pending">
      <rect height="100%" width="100%" fill="#eee" stroke="#ccc"></rect>
      <text y="50%" x="50%" alignment-baseline="central" fill="#666" style="font-size:1.1em" text-anchor="middle">Data pending</text>
    </g>
  </svg>`, true);
    }

    function title(id, msg) {
        const s = d3$1.select(`#${id}`);
        s.select(".accessibleTitle")
            .text(msg);
        const canvas = s.select(".canvas");
        if (!canvas.empty()) {
            canvas.append("text")
                .attr("class", "heading")
                .attr("x", 20)
                .attr("y", 20)
                .text(msg)
                .call(d3$1.drag()
                .on("drag", function () {
                d3$1.select(this)
                    .attr("x", d3$1.event.x)
                    .attr("y", d3$1.event.y);
            }));
        }
    }

    var ut = {
        reset,
        style,
        svg,
        title
    };

    function pathArc$1(x1, y1, x2, y2, r1, r2) {
        r1 = r1 || 0;
        r2 = r2 || 0;
        const theta = Math.atan((x2 - x1) / (y2 - y1));
        const phi = Math.atan((y2 - y1) / (x2 - x1));
        const sinTheta = r1 * Math.sin(theta);
        const cosTheta = r1 * Math.cos(theta);
        const sinPhi = r2 * Math.sin(phi);
        const cosPhi = r2 * Math.cos(phi);
        if (y2 > y1) {
            x1 = x1 + sinTheta;
            y1 = y1 + cosTheta;
        }
        else {
            x1 = x1 - sinTheta;
            y1 = y1 - cosTheta;
        }
        if (x1 > x2) {
            x2 = x2 + cosPhi;
            y2 = y2 + sinPhi;
        }
        else {
            x2 = x2 - cosPhi;
            y2 = y2 - sinPhi;
        }
        const dx = x2 - x1, dy = y2 - y1;
        const dr = Math.sqrt(dx * dx + dy * dy);
        return `M${x1},${y1}A${dr},${dr} 0 0,1 ${x2},${y2}`;
    }

    function pathEllipse$1(cx, cy, rx = 1, ry = 1) {
        let output = `M${cx - rx},${cy}`;
        output += ` a${rx},${ry} 0 1,0 ${2 * rx},0`;
        output += ` a${rx},${ry} 0 1,0 ${-2 * rx},0`;
        return output;
    }

    function pathCircle$1(cx, cy, r = 1) {
        return pathEllipse$1(cx, cy, r, r);
    }

    function pathCross$1(x, y, l) {
        let output = `M${x - l * 0.5}, ${y - l * 1.25}`;
        output += ` h${l} v${l} h${l} v${l} h-${l} v${l} h-${l} v-${l} h-${l} v-${l} h${l}z`;
        return output;
    }

    function pathDiamond$1(x, y, h, w) {
        const sw = w / 2.0;
        const sh = h / 2.0;
        let output = `M${x - sw},${y}`;
        output += ` L${x},${y + sh} L${x + sw},${y} L${x},${y - sh}z`;
        return output;
    }

    function pathLine$1(x1, y1, x2, y2, r1, r2) {
        r1 = r1 || 0;
        r2 = r2 || 0;
        const theta = Math.atan((x2 - x1) / (y2 - y1));
        const phi = Math.atan((y2 - y1) / (x2 - x1));
        const sinTheta = r1 * Math.sin(theta);
        const cosTheta = r1 * Math.cos(theta);
        const sinPhi = r2 * Math.sin(phi);
        const cosPhi = r2 * Math.cos(phi);
        if (y2 > y1) {
            x1 = x1 + sinTheta;
            y1 = y1 + cosTheta;
        }
        else {
            x1 = x1 - sinTheta;
            y1 = y1 - cosTheta;
        }
        if (x1 > x2) {
            x2 = x2 + cosPhi;
            y2 = y2 + sinPhi;
        }
        else {
            x2 = x2 - cosPhi;
            y2 = y2 - sinPhi;
        }
        return `M${x1},${y1}L${x2},${y2}`;
    }

    function pathRectangle$1(x, y, h, w) {
        const sx = x - (w / 2.0);
        const sy = y - (h / 2.0);
        let output = `M${sx},${sy}`;
        output += ` L${sx},${sy + h} L${sx + w},${sy + h} L${sx + w},${sy}z`;
        return output;
    }

    function pathSquare$1(x, y, l) {
        return pathRectangle$1(x, y, l, l);
    }

    function pathTriangle$1(a, b, c) {
        let output = `M${a[0]},${a[1]}`;
        output += ` L${b[0]},${b[1]} L${c[0]},${c[1]}z`;
        return output;
    }

    var p$1 = {
        pathArc: pathArc$1,
        pathCircle: pathCircle$1,
        pathCross: pathCross$1,
        pathDiamond: pathDiamond$1,
        pathEllipse: pathEllipse$1,
        pathLine: pathLine$1,
        pathRectangle: pathRectangle$1,
        pathSquare: pathSquare$1,
        pathTriangle: pathTriangle$1
    };

    var Plot = (function () {
        function Plot(parentId, id) {
            this._boundCharts = [];
            this.addon = [];
            this.domain = { c: undefined, r: [3, 3], s: undefined, x: undefined, y: undefined };
            this.event = { drawn: undefined };
            this.margin = { top: 0, right: 0, bottom: 0, left: 0 };
            this.radius = 3;
            this.scale = { c: d3.scaleOrdinal(d3.schemeCategory10), r: undefined, s: undefined, x: undefined, y: undefined };
            this.shapes = [{ path: p$1.pathCircle(3, 3, 2), name: "circle" }];
            this.title = { heading: undefined, x: undefined, y: undefined };
            this.transition = d3.transition().duration(500).ease(d3.easeQuadOut);
            this.id = id;
            this.event.drawn = new CustomEvent("drawn", { detail: { id: this.id } });
            var parent = document.getElementById(parentId);
            var b = parent.getBoundingClientRect();
            parent.appendChild(ut.svg(id, b.width, b.height));
            this.svg = d3.select("#" + this.id).classed("plot", true);
            ut.style(this.id, ".data-item { cursor: pointer; transition: 500ms ease-in-out }\n    .fade { fill-opacity: 0.05 }");
        }
        Plot.prototype.add = function (feature) {
            var _this = this;
            if (Array.isArray(feature)) {
                feature.forEach(function (f) { return _this.addon.push(f); });
            }
            else {
                this.addon.push(feature);
            }
            return this;
        };
        Plot.prototype.bind = function (charts) {
            var _this = this;
            if (Array.isArray(charts)) {
                charts.forEach(function (c) { return _this._boundCharts.push(c); });
            }
            else {
                this._boundCharts.push(charts);
            }
            return this;
        };
        Plot.prototype.data = function (data) {
            var _this = this;
            this._data = data;
            if (this._data.labels) {
                this.title.heading = this._data.labels.title;
                this.title.x = this._data.labels.x;
                this.title.y = this._data.labels.y;
            }
            if (this._data) {
                if (!data.series[0].fill) {
                    var c_1 = [];
                    this._data.series
                        .forEach(function (s) { return c_1.push(s.label); });
                    this.domain.c = c_1.filter(function (v, i, a) { return a.indexOf(v) === i; });
                    this._data.series
                        .forEach(function (s) { return s.fill = _this.scale.c(s.label); });
                }
                if (data.series[0].shape) {
                    var t_1 = [];
                    this._data.series
                        .forEach(function (s) { return t_1.push(s.shape); });
                    this.domain.s = t_1.filter(function (v, i, a) { return a.indexOf(v) === i; });
                    this.shapes.push({ path: p$1.pathTriangle([1, 5], [5, 5], [3, 1]), name: "triangle" });
                    this.shapes.push({ path: p$1.pathSquare(3, 3, 4), name: "square" });
                    this.shapes.push({ path: p$1.pathDiamond(3, 3, 6, 6), name: "diamond" });
                }
                else {
                    this.domain.s = ["circle"];
                }
                if (data.series[0].values[0][2]) {
                    var r_1 = [];
                    this._data.series
                        .forEach(function (s) { return s.values.forEach(function (v) { return r_1.push(v[2]); }); });
                    this.domain.r = d3.extent(r_1);
                }
                if (data.series[0].values[0][0]) {
                    var x_1 = [];
                    this._data.series
                        .forEach(function (s) { return s.values.forEach(function (v) { return x_1.push(v[0]); }); });
                    this.domain.x = d3.extent(x_1);
                    this.domain.x[0] -= (this.domain.x[0] * 0.1);
                    this.domain.x[1] *= 1.1;
                }
                if (data.series[0].values[0][1]) {
                    var y_1 = [];
                    this._data.series
                        .forEach(function (s) { return s.values.forEach(function (v) { return y_1.push(v[1]); }); });
                    this.domain.y = d3.extent(y_1);
                    this.domain.y[0] -= (this.domain.y[0] * 0.1);
                    this.domain.y[1] *= 1.1;
                }
            }
            return this;
        };
        Plot.prototype.draw = function () {
            var _this = this;
            if (this._data === undefined) {
                return this;
            }
            var self = this;
            var canvas = this.svg.select(".canvas");
            canvas.attr("transform", "translate(" + this.margin.left + " " + this.margin.top + ")");
            this.svg
                .select("g.pending")
                .style("display", "none");
            ut.title(this.id, this.title.heading);
            if (this.domain.r[0] >= 0 && this.domain.r[1] > 0) {
                this.scale.r = d3.scaleLinear()
                    .domain(this.domain.r)
                    .range([1, 20]);
            }
            this.scale.s = d3.scaleOrdinal()
                .domain(this.domain.s)
                .range(this.shapes.map(function (sh) { return sh.path; }));
            this.scale.x = d3.scaleLinear()
                .domain(this.domain.x)
                .range([0, this.innerWidth()]);
            this.scale.y = d3.scaleLinear()
                .domain(this.domain.y)
                .range([this.innerHeight(), 0]);
            var points = canvas.selectAll("g")
                .data(this._data.series);
            var gEnter = points.enter()
                .append("g")
                .attr("class", "series")
                .attr("id", function (d, i) { return _this.id + "_s" + i; });
            gEnter.selectAll(".data-item")
                .data(function (d) { return d.values; })
                .enter()
                .append("path")
                .classed("data-item", true)
                .attr("id", function (d, i) { return this.parentNode.id + "_p" + i; })
                .attr("d", function () {
                var parent = d3.select(this.parentNode);
                var d = parent.datum();
                return self.scale.s(d.shape);
            })
                .attr("transform", function (d) { return "translate(" + _this.scale.x(d[0]) + "," + _this.scale.y(d[1]) + ")"; })
                .style("fill", function () {
                var parent = d3.select(this.parentNode);
                var d = parent.datum();
                return d.fill;
            })
                .on("click", function () {
                self.select(this, d3.event.ctrlKey);
                var label = self._seriesLabel(self.selected);
                self._boundCharts.forEach(function (bc) {
                    bc.selectSeries(label);
                });
            })
                .append("title")
                .text(function (d) { return "x: " + d[0] + " y: " + d[1]; });
            window.dispatchEvent(this.event.drawn);
            return this;
        };
        Plot.prototype.height = function () {
            return this.svg.node().getBoundingClientRect().height;
        };
        Plot.prototype.innerHeight = function () {
            return this.height() - this.margin.top - this.margin.bottom;
        };
        Plot.prototype.innerWidth = function () {
            return this.width() - this.margin.left - this.margin.right;
        };
        Plot.prototype.reset = function () { ut.reset(this.id); return this; };
        Plot.prototype.select = function (node, selectOne) {
            if (selectOne === void 0) { selectOne = false; }
            this.svg.selectAll(".data-item")
                .classed("fade", false);
            if (node === undefined) {
                this.selected = undefined;
                return this;
            }
            var self = this;
            if (this.selected && node) {
                this.selected = node.id === this.selected.id ? null : node || null;
            }
            else {
                this.selected = node;
            }
            if (this.selected) {
                if (selectOne) {
                    this.svg.selectAll(".data-item")
                        .each(function () {
                        var sn = d3.select(this);
                        var n = sn.node();
                        sn.classed("fade", n.id === self.selected.id
                            ? false
                            : true);
                    });
                }
                else {
                    var parent_1 = this.selected.parentNode;
                    this.svg.selectAll(".data-item")
                        .each(function () {
                        var result = this.id !== self.selected.id &&
                            this.parentNode.id !== parent_1.id
                            ? true
                            : false;
                        d3.select(this).classed("fade", result);
                    });
                }
            }
            return this;
        };
        Plot.prototype.width = function () {
            return this.svg.node().getBoundingClientRect().width;
        };
        Plot.prototype.selectSeries = function (label) {
            var self = this;
            var found = false;
            self.select();
            if (label !== "") {
                this.svg.selectAll(".series")
                    .each(function () {
                    var n = self.svg.select("#" + this.id);
                    if (!found && n.datum().label === label) {
                        self.select(n.select(".data-item").node());
                        found = true;
                    }
                });
            }
            return this;
        };
        Plot.prototype._seriesLabel = function (node) {
            if (node) {
                var n = node.nodeName === "g"
                    ? node
                    : node.parentNode;
                return this.svg.select("#" + n.id).datum().label;
            }
            return "";
        };
        return Plot;
    }());

    function reset$1(id) {
        const s = d3$1.select(`#${id}`);
        const canvas = s.select("g.canvas");
        if (canvas && !canvas.empty()) {
            canvas.selectAll("*").remove();
            canvas.attr("transform", null);
            s.select("g.pending")
                .style("display", null);
        }
    }

    function toNodes$1(template, isSVG = false) {
        try {
            const d = new DOMParser();
            let root;
            if (isSVG) {
                root = d.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${template}</svg>`, "image/svg+xml");
                return root.documentElement.children[0];
            }
            else {
                root = d.parseFromString(template, "text/html");
                return root.body.childNodes[0];
            }
        }
        catch (_a) {
            throw new Error("Error parsing templates string");
        }
    }

    function style$1(id, css) {
        const s = document.getElementById(id);
        s.querySelector("defs")
            .appendChild(toNodes$1(`<style type="text/css">${css}</style>`, true));
    }

    function svg$1(id, width, height) {
        return toNodes$1(`<svg id ="${id}"
    aria-labelledBy="title" role="presentation"
    preserveAspectRatio="xMinYMin meet"
    height="100%" width="100%" viewBox="0 0 ${width} ${height}"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink">
    <title class="accessibleTitle" lang="en">Chart</title>
    <defs>
      <style type="text/css">
        svg {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 1em;
          user-select: none
        }
        .heading {
          cursor: move;
          font-size: 1.4em
        }
      </style>
    </defs>
    <g class="canvas"></g>
    <g class="pending">
      <rect height="100%" width="100%" fill="#eee" stroke="#ccc"></rect>
      <text y="50%" x="50%" alignment-baseline="central" fill="#666" style="font-size:1.1em" text-anchor="middle">Data pending</text>
    </g>
  </svg>`, true);
    }

    function title$1(id, msg) {
        const s = d3$1.select(`#${id}`);
        s.select(".accessibleTitle")
            .text(msg);
        const canvas = s.select(".canvas");
        if (!canvas.empty()) {
            canvas.append("text")
                .attr("class", "heading")
                .attr("x", 20)
                .attr("y", 20)
                .text(msg)
                .call(d3$1.drag()
                .on("drag", function () {
                d3$1.select(this)
                    .attr("x", d3$1.event.x)
                    .attr("y", d3$1.event.y);
            }));
        }
    }

    var ut$1 = {
        reset: reset$1,
        style: style$1,
        svg: svg$1,
        title: title$1
    };

    var isBrowser = typeof window !== undefined && typeof document !== undefined;

    function isDate(d) {
        const pd = Date.parse(d);
        const rd = isNaN(d);
        const pdt = !isNaN(pd);
        return d instanceof Date || (rd && pdt);
    }

    function isFunction(fn) {
        return fn && {}.toString.call(fn) === "[object Function]";
    }

    const isIE11 = isBrowser &&
        !!(window.MSInputMethodContext && document.documentMode);
    const isIE10 = isBrowser && /MSIE 10/.test(navigator.userAgent);
    function isIE(version) {
        return (version === 11)
            ? isIE11
            : version === 10
                ? isIE10
                : isIE11 || isIE10;
    }

    function isInteger(n) {
        return typeof n === "number" &&
            isFinite(n) &&
            Math.floor(n) === n;
    }

    function isNumeric(n) {
        return !isNaN(n - parseFloat(n));
    }

    function isPostcode(p) {
        const uk = /^([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z])))) [0-9][A-Za-z]{2})$/;
        return uk.test(p);
    }

    var is = {
        isBrowser,
        isDate,
        isFunction,
        isIE,
        isInteger,
        isNumeric,
        isPostcode
    };

    function formatDate(date) {
        return (d3$1.timeSecond(date) < date ? d3$1.timeFormat(".%L")
            : d3$1.timeMinute(date) < date ? d3$1.timeFormat(":%S")
                : d3$1.timeHour(date) < date ? d3$1.timeFormat("%I:%M")
                    : d3$1.timeDay(date) < date ? d3$1.timeFormat("%I %p")
                        : d3$1.timeMonth(date) < date
                            ? (d3$1.timeWeek(date) < date
                                ? d3$1.timeFormat("%a %d")
                                : d3$1.timeFormat("%b %d"))
                            : d3$1.timeYear(date) < date ? d3$1.timeFormat("%b")
                                : d3$1.timeFormat("%b %Y"))(date);
    }

    function formatNumber(n) {
        return (isInteger(n)
            ? n > 999
                ? d3$1.format("~s")
                : d3$1.format("")
            : d3$1.format(".2f"))(n);
    }

    function percentize(number, precision = 1) {
        return (number * 100).toFixed(precision) + "%";
    }

    function formatPostcode(s) {
        if (s && s.length > 0) {
            const raw = s.replace(/ /g, "").toUpperCase();
            if (raw.length < 5 || raw.length > 7) {
                return s;
            }
            const x = raw.length - 3;
            return raw.substring(0, x) + " " + raw.substring(x);
        }
        return "";
    }

    var f = {
        formatDate,
        formatNumber,
        formatPercent: percentize,
        formatPostcode
    };

    var Line = (function () {
        function Line(parentid, id) {
            this._bisectXAxis = d3.bisector(function (d) { return d[0]; }).left;
            this._boundCharts = [];
            this._curveFunction = d3.curveLinear;
            this._showArea = true;
            this._showPoints = false;
            this.domain = { x: undefined, y: undefined };
            this.event = { drawn: undefined };
            this.margin = { top: 5, right: 5, bottom: 5, left: 5 };
            this.parseDate = d3.timeParse("%Y-%m-%d");
            this.scale = { c: d3.scaleOrdinal(d3.schemeCategory10), x: undefined, y: undefined };
            this.title = { heading: undefined, x: undefined, y: undefined };
            this.transition = d3.transition().duration(500).ease(d3.easeQuadOut);
            this.id = id;
            this.event.drawn = new CustomEvent("drawn", { detail: { id: this.id } });
            var p = document.getElementById(parentid);
            var b = p.getBoundingClientRect();
            p.appendChild(ut$1.svg(id, b.width, b.height));
            this.svg = d3.select("#" + this.id).classed("line", true);
            ut$1.style(this.id, "circle.area { stroke-width: 1px }\n    path.areaFill { fill-opacity: 0.8 }\n    path.areaLine { fill: none; stroke-width: 1.5; stroke-linejoin: round }\n    circle.areaLineDot { cursor: pointer; fill: #0facf3 }\n    circle.bookmark { fill: #fff; fill-opacity: 0.8; stroke: #000; stroke-width: 1px }\n    text.areaLineDot { cursor: move; font-size: 0.9em }\n    rect.bookmark { fill: #fff; fill-opacity: 0.8; stroke: #000 }");
        }
        Line.prototype.area = function (show) {
            if (show === void 0) { show = true; }
            this._showArea = show;
            return this;
        };
        Line.prototype.bind = function (charts) {
            var _this = this;
            if (Array.isArray(charts)) {
                charts.forEach(function (c) { return _this._boundCharts.push(c); });
            }
            else {
                this._boundCharts.push(charts);
            }
            return this;
        };
        Line.prototype.curve = function (show) {
            if (show === void 0) { show = false; }
            this._curveFunction = show ? d3.curveBasis : d3.curveLinear;
            return this;
        };
        Line.prototype.data = function (data) {
            var _this = this;
            this._data = data;
            if (this._data.label) {
                this.title.heading = this._data.label.title;
                this.title.x = this._data.label.x;
                this.title.y = this._data.label.y;
            }
            var dom = [];
            this._data.series.forEach(function (s) {
                if (s.fill === undefined) {
                    s.fill = _this.scale.c(s.label);
                }
                s.values.forEach(function (v) {
                    if (is.isDate(v[0])) {
                        v[0] = v[0] instanceof Date ? v[0] : _this.parseDate(v[0]);
                    }
                    else {
                        v[0] = +v[0];
                    }
                    dom.push(v);
                });
            });
            this.domain.x = d3.extent(dom, function (d) { return d[0]; });
            this.domain.y = d3.extent(dom, function (d) { return d[1]; });
            return this;
        };
        Line.prototype.draw = function () {
            var _this = this;
            if (this._data === undefined) {
                return this;
            }
            var self = this;
            var canvas = this.svg.select(".canvas");
            canvas.attr("transform", "translate(" + this.margin.left + " " + this.margin.top + ")");
            this.svg
                .select("g.pending")
                .style("display", "none");
            ut$1.title(this.id, this.title.heading);
            if (is.isDate(this.domain.x[0])) {
                this.scale.x = d3.scaleTime()
                    .domain(this.domain.x)
                    .range([0, this.innerWidth()]);
            }
            else {
                this.scale.x = d3.scaleLinear()
                    .domain(this.domain.x)
                    .range([0, this.innerWidth()]);
            }
            this.scale.y = d3.scaleLinear()
                .domain(this.domain.y)
                .range([this.innerHeight(), 0]);
            var areaFill = d3.area()
                .curve(self._curveFunction)
                .x(function (d) { return self.scale.x(d[0]); })
                .y0(self.scale.y(self.domain.y[0]))
                .y1(function (d) { return self.scale.y(d[1]); });
            var areaLine = d3.line()
                .curve(self._curveFunction)
                .x(function (d) { return _this.scale.x(d[0]); })
                .y(function (d) { return _this.scale.y(d[1]); });
            var g = canvas.selectAll("g")
                .data(this._data.series)
                .enter()
                .append("g");
            g.each(function (d) {
                var grp = d3.select(this);
                self._topLayer = grp;
                if (self._showArea) {
                    grp.append("path")
                        .datum(d.values)
                        .attr("d", areaFill)
                        .attr("class", "areaFill")
                        .attr("fill", function () { return d.fill; })
                        .on("click", function () {
                        grp.raise();
                        self._topLayer = grp;
                    });
                }
                grp.append("path")
                    .datum(d.values)
                    .attr("d", areaLine)
                    .attr("class", "areaLine")
                    .attr("stroke", function () { return self._showArea ? d3.color(d.fill).darker(1) : d.fill; })
                    .on("click", function () {
                    grp.raise();
                    self._topLayer = grp;
                });
                if (self._showPoints) {
                    grp.selectAll("circle")
                        .data(d.values)
                        .enter()
                        .append("circle")
                        .attr("class", "area")
                        .attr("fill", function () { return self._showArea ? d3.color(d.fill).darker(1) : d.fill; })
                        .attr("cx", function (d1) { return self.scale.x(d1[0]); })
                        .attr("cy", function (d1) { return self.scale.y(d1[1]); })
                        .attr("r", 3);
                }
                var lb = grp.append("text")
                    .attr("class", "areaLineDot")
                    .call(d3.drag()
                    .on("start", function () { d3.select(this).raise().classed("active", true); })
                    .on("drag", function () { d3.select(this).attr("x", d3.event.x).attr("y", d3.event.y); })
                    .on("end", function () { d3.select(this).classed("active", false); }));
                grp.selectAll("circle.areaLineDot")
                    .data(d.values)
                    .enter()
                    .filter(function (d1) { return d1[2] !== undefined; })
                    .append("circle")
                    .attr("cx", function (d1) { return self.scale.x(d1[0]); })
                    .attr("cy", function (d1) { return self.scale.y(d1[1]); })
                    .attr("class", "areaLineDot")
                    .attr("r", 6)
                    .on("click", function (d1, i, n) {
                    var c = d3.select(n[0]);
                    var x = parseFloat(c.attr("cx"));
                    var y = parseFloat(c.attr("cy")) + 20;
                    canvas.select("text.areaLineDot")
                        .attr("text-anchor", function () {
                        return (x > self.width() * 0.9)
                            ? "end"
                            : (x < self.width() * 0.1)
                                ? "start"
                                : "middle";
                    })
                        .attr("x", x)
                        .attr("y", y)
                        .text(d[2]);
                });
            });
            var left = function () { return; };
            var moved = function () {
                var m = d3.mouse(this);
                var mouseDate = self.scale.x.invert(m[0]);
                self.moveBookmark(mouseDate);
                if (self._boundCharts.length > 0) {
                    self._boundCharts.forEach(function (c) {
                        if (c.moveBookmark) {
                            c.moveBookmark(mouseDate, true);
                        }
                    });
                }
            };
            var entered = function () { self.createBookmark(); self._bookmark.raise(); };
            if ("ontouchstart" in document) {
                g.on("touchmove", moved)
                    .on("touchstart", entered)
                    .on("touchend", left);
            }
            else {
                g.on("mousemove", moved)
                    .on("mouseenter", entered)
                    .on("mouseleave", left);
            }
            window.dispatchEvent(this.event.drawn);
            return this;
        };
        Line.prototype.height = function () {
            return this.svg.node().getBoundingClientRect().height;
        };
        Line.prototype.innerHeight = function () {
            return this.height() - this.margin.top - this.margin.bottom;
        };
        Line.prototype.innerWidth = function () {
            return this.width() - this.margin.left - this.margin.right;
        };
        Line.prototype.createBookmark = function () {
            if (this._bookmark) {
                this._bookmark.remove();
            }
            var canvas = this.svg.select(".canvas");
            this._bookmark = canvas.append("g");
            this._bookmark.append("line").attr("class", "bookmark");
            this._bookmark.append("circle").attr("class", "bookmark").attr("r", 4);
            var gy = this._bookmark.append("g")
                .attr("class", "bookmark y");
            gy.append("rect")
                .attr("class", "bookmark y")
                .attr("rx", "5px")
                .attr("ry", "5px");
            gy.append("text")
                .attr("class", "bookmark y")
                .attr("dy", -10)
                .attr("x", 0)
                .attr("y", 0);
            var gx = this._bookmark.append("g")
                .attr("class", "bookmark x");
            gx.append("rect")
                .attr("class", "bookmark x")
                .attr("rx", "5px")
                .attr("ry", "5px");
            gx.append("text")
                .attr("class", "bookmark x")
                .attr("dy", -10)
                .attr("x", 0)
                .attr("y", 0);
            return this;
        };
        Line.prototype.moveBookmark = function (axisValue, remote) {
            if (remote === void 0) { remote = false; }
            var box = this.svg.node().getBoundingClientRect();
            var width = box.width;
            var datum = this._topLayer.datum().values;
            var i = this._bisectXAxis(datum, axisValue);
            if (i < 1 || i > datum.length - 1) {
                return this;
            }
            var d0 = datum[i - 1];
            var d1 = datum[i];
            var data = axisValue - d0[0] > d1[0] - axisValue ? d1 : d0;
            var x = this.scale.x(data[0]);
            var y = this.scale.y(data[1]);
            if (remote || !this._bookmark) {
                this.createBookmark();
            }
            this._bookmark.select("circle.bookmark")
                .attr("cx", x)
                .attr("cy", y);
            var ypos = y + (box.height - box.top) * 0.05 > box.height - box.top
                ? y - 50
                : y < 50
                    ? 50
                    : y;
            var gy = this._bookmark.select("g.bookmark.y")
                .attr("transform", "translate(" + x + "," + ypos + ")");
            var msgy = is.isDate(data[1]) ? f.formatDate(data[1]) : data[1];
            var ty = gy.select("text")
                .attr("text-anchor", function () {
                return (x > width * 0.8)
                    ? "end"
                    : (x < width * 0.2)
                        ? "start"
                        : "middle";
            })
                .text(msgy);
            var tybox = ty.node().getBBox();
            gy.select("rect")
                .attr("height", (tybox.height + 5) + "px")
                .attr("width", (tybox.width + 10) + "px")
                .attr("x", (tybox.x - 5) + "px")
                .attr("y", (tybox.y - 2) + "px");
            var gx = this._bookmark.select("g.bookmark.x")
                .attr("transform", "translate(" + x + "," + this.scale.y(this.domain.y[0]) + ")");
            var msgx = is.isDate(data[0]) ? f.formatDate(data[0]) : data[0];
            var tx = gx.select("text")
                .attr("text-anchor", function () {
                return (x > width * 0.8)
                    ? "end"
                    : (x < width * 0.2)
                        ? "start"
                        : "middle";
            })
                .text(msgx);
            var txbox = tx.node().getBBox();
            gx.select("rect")
                .attr("height", (txbox.height + 5) + "px")
                .attr("width", (txbox.width + 10) + "px")
                .attr("x", (txbox.x - 5) + "px")
                .attr("y", (txbox.y - 2) + "px");
            return this;
        };
        Line.prototype.points = function (show) {
            if (show === void 0) { show = false; }
            this._showPoints = show;
            return this;
        };
        Line.prototype.reset = function () { ut$1.reset(this.id); return this; };
        Line.prototype.width = function () {
            return this.svg.node().getBoundingClientRect().width;
        };
        return Line;
    }());

    function kde(kernel, X) {
        return function (V) {
            return X.map(function (x) { return [x, d3.mean(V, function (v) { return kernel(x - v); })]; });
        };
    }
    function kernelEpanechnikov(bandwidth) {
        return function (v) {
            return Math.abs(v /= bandwidth) <= 1 ? 0.75 * (1 - v * v) / bandwidth : 0;
        };
    }

    function getJSON(url, fn) {
        const xhr = XMLHttpRequest
            ? new XMLHttpRequest()
            : new ActiveXObject("Microsoft.XMLHTTP");
        xhr.open("GET", url);
        xhr.onreadystatechange = () => {
            if (xhr.readyState > 3 && xhr.status === 200) {
                fn(JSON.parse(xhr.responseText));
            }
        };
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        xhr.send();
        return xhr;
    }

    var plot = new Plot("mainPlot", "scatterPlot");
    var line = new Line("topPlot", "linePlot");
    var legend = new Legend(plot);
    legend
        .node("g.series")
        .icon(function (n) {
        var d = legend.datum(n);
        var path = plot.scale.s(d.shape);
        var shape = plot.shapes.find(function (sh) { return sh.path === path; });
        return shape.name;
    })
        .label(function (n) {
        var d = legend.datum(n);
        return d.label + " " + d.shape;
    });
    var contour = new Contour(plot);
    getJSON("data/slide4.json", function (data) {
        var contourData = flatten(data);
        contour.data(contourData);
        plot.data(data).draw();
        var areaData = transformLineX(data, plot.innerWidth());
        line.margin = plot.margin;
        line.data(areaData).draw();
    });
    function flatten(data) {
        var f = [];
        data.series.forEach(function (s) { return s.values.forEach(function (v) { return f.push(v); }); });
        return f;
    }
    function transformLineX(data, width) {
        var r = {
            series: [
                { label: "ED-based", values: [] },
                { label: "UCC-based", values: [] }
            ]
        };
        data.series.forEach(function (s) {
            var i = s.label === "UCC-based" ? 1 : 0;
            s.values.forEach(function (v) {
                r.series[i].values.push(v[0] * 100.0);
            });
        });
        r.series.forEach(function (s) {
            var scale = d3$1.scaleLinear()
                .domain(d3$1.extent(s.values))
                .range([0, width]);
            var ticks = scale.ticks(s.values.length * 0.2);
            var res = kde(kernelEpanechnikov(7), ticks)(s.values);
            s.values = res;
        });
        return r;
    }
    document.querySelector(".ask")
        .addEventListener("click", function (e) {
        var note = document.querySelector(".note");
        note.style.display = "block";
        setTimeout(function () { return note.style.opacity = "1"; }, 10);
    });
    document.querySelector(".close")
        .addEventListener("click", function (e) {
        var note = document.querySelector(".note");
        note.style.opacity = null;
        setTimeout(function () { return note.style.display = "none"; }, 600);
    });

}(d3));
