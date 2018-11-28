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

export { Legend };
