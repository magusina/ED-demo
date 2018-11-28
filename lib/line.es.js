import { select, format, drag, event, timeSecond, timeFormat, timeMinute, timeHour, timeDay, timeMonth, timeWeek, timeYear } from 'd3';

function reset(id) {
    const s = select(`#${id}`);
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
    const s = select(`#${id}`);
    s.select(".accessibleTitle")
        .text(msg);
    const canvas = s.select(".canvas");
    if (!canvas.empty()) {
        canvas.append("text")
            .attr("class", "heading")
            .attr("x", 20)
            .attr("y", 20)
            .text(msg)
            .call(drag()
            .on("drag", function () {
            select(this)
                .attr("x", event.x)
                .attr("y", event.y);
        }));
    }
}

var ut = {
    reset,
    style,
    svg,
    title
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
    return (timeSecond(date) < date ? timeFormat(".%L")
        : timeMinute(date) < date ? timeFormat(":%S")
            : timeHour(date) < date ? timeFormat("%I:%M")
                : timeDay(date) < date ? timeFormat("%I %p")
                    : timeMonth(date) < date
                        ? (timeWeek(date) < date
                            ? timeFormat("%a %d")
                            : timeFormat("%b %d"))
                        : timeYear(date) < date ? timeFormat("%b")
                            : timeFormat("%b %Y"))(date);
}

function formatNumber(n) {
    return (isInteger(n)
        ? n > 999
            ? format("~s")
            : format("")
        : format(".2f"))(n);
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
        p.appendChild(ut.svg(id, b.width, b.height));
        this.svg = d3.select("#" + this.id).classed("line", true);
        ut.style(this.id, "circle.area { stroke-width: 1px }\n    path.areaFill { fill-opacity: 0.8 }\n    path.areaLine { fill: none; stroke-width: 1.5; stroke-linejoin: round }\n    circle.areaLineDot { cursor: pointer; fill: #0facf3 }\n    circle.bookmark { fill: #fff; fill-opacity: 0.8; stroke: #000; stroke-width: 1px }\n    text.areaLineDot { cursor: move; font-size: 0.9em }\n    rect.bookmark { fill: #fff; fill-opacity: 0.8; stroke: #000 }");
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
        ut.title(this.id, this.title.heading);
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
    Line.prototype.reset = function () { ut.reset(this.id); return this; };
    Line.prototype.width = function () {
        return this.svg.node().getBoundingClientRect().width;
    };
    return Line;
}());

export { Line };
