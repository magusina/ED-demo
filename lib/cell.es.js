import { select, drag, event } from 'd3';

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

var Cell = (function () {
    function Cell(parentid, id) {
        this._gen = { arc: undefined, bubble: undefined, chord: undefined, diag: undefined };
        this._pos = { chords: 0, nodes: 0 };
        this._search = { chord: {}, from: {}, node: {} };
        this.event = { drawn: undefined };
        this.margin = { top: 5, right: 5, bottom: 5, left: 5 };
        this.radius = { bubble: 0, inner: 0, link: 0, outer: 0 };
        this.title = { heading: undefined };
        this.transition = d3.transition().duration(500).ease(d3.easeQuadOut);
        this.id = id;
        this.event.drawn = new CustomEvent("drawn", { detail: { id: this.id } });
        var p = document.getElementById(parentid);
        var b = p.getBoundingClientRect();
        p.appendChild(ut.svg(id, b.width, b.height));
        this.svg = d3.select("#" + this.id).classed("cell", true);
        ut.style(this.id, ".link { fill: none; stroke: #ccc; stroke-width: 1.5px; stroke-linecap: round }\n    text.chord { fill: #777 }\n    text.chord > textPath { overflow: visible; text-anchor: middle }");
    }
    Cell.prototype.data = function (data) {
        var _this = this;
        this._data = data;
        this._data.from.forEach(function (fr) { return fr.value = 0; });
        this._data.to.forEach(function (to) { return to.forEach(function (t) { return t.value = 0; }); });
        this._data.links.forEach(function (t) {
            var i = _this._data.from.findIndex(function (d) { return d.id === t.from; });
            if (i > -1) {
                _this._data.from[i].value += t.value;
            }
            i = -1;
            var j = 0;
            while (i === -1 && j < _this._data.to.length) {
                i = _this._data.to[j].findIndex(function (d) { return d.id === t.to; });
                if (i > -1) {
                    _this._data.to[j][i].value += t.value;
                }
                j++;
            }
        });
        this._data.from.forEach(function (fr) { return _this._search.from[fr.id] = fr; });
        return this;
    };
    Cell.prototype.draw = function () {
        if (this._data === undefined) {
            return this;
        }
        var canvas = this.svg.select(".canvas");
        this.svg
            .select("g.pending")
            .style("display", "none");
        ut.title(this.id, this.title.heading);
        this.radius.outer = Math.min(this.innerWidth() * 0.47, this.innerHeight() * 0.47);
        this.radius.inner = this.radius.outer * 0.9;
        this.radius.bubble = this.radius.inner - 50;
        this.radius.link = this.radius.inner * 0.95;
        this._pos.nodes = this.radius.outer - this.radius.inner + (this.radius.inner - this.radius.bubble);
        this._pos.chords = this.radius.outer;
        canvas.append("g")
            .attr("class", "chords")
            .attr("transform", "translate(" + this._pos.chords + "," + (this._pos.chords + this.radius.inner * 0.15) + ")");
        canvas.append("g")
            .attr("class", "links")
            .attr("transform", "translate(" + this._pos.chords + "," + (this._pos.chords + this.radius.inner * 0.15) + ")");
        canvas.append("g")
            .attr("class", "nodes")
            .attr("transform", "translate(" + this._pos.nodes + "," + (this._pos.nodes + this.radius.inner * 0.15) + ")");
        this._buildShapeGenerators();
        var nodes = this._buildCircles();
        var chords = this._buildChords();
        this._buildSearchStructures();
        this._updateNodes(nodes);
        this._updateChords(chords);
        this._updateLinks();
        window.dispatchEvent(this.event.drawn);
        return this;
    };
    Cell.prototype.highlightLink = function (a, show) {
        var opac = show ? .6 : .1;
        this.svg.select("#l_" + a.id)
            .classed("fade", false)
            .transition(show ? 150 : 550)
            .style("fill-opacity", opac)
            .style("stroke-opacity", opac);
        this.svg.select("#a_" + a.id)
            .transition()
            .style("fill-opacity", show ? opac : .2);
        this.svg.select("#c_" + a.to)
            .transition(show ? 150 : 550)
            .style("opacity", show ? 1 : 0);
        this.svg.select("#t_" + a.from)
            .transition(show ? 0 : 550)
            .style("fill", show ? "#000" : "#777")
            .style("font-size", show ? Math.round(.035 * this.radius.inner) + "px" : "0px");
    };
    Cell.prototype.highlightLinks = function (data, show) {
        var _this = this;
        data.relatedLinks.forEach(function (link) { return _this.highlightLink(link, show); });
    };
    Cell.prototype.height = function () {
        return this.svg.node().getBoundingClientRect().height;
    };
    Cell.prototype.innerHeight = function () {
        return this.height() - this.margin.top - this.margin.bottom;
    };
    Cell.prototype.innerWidth = function () {
        return this.width() - this.margin.left - this.margin.right;
    };
    Cell.prototype.node_onMouseOver = function (data, category) {
        if (category === "TO") {
            if (data.depth < 2) {
                return;
            }
            this.tooltip(true, "Metric: " + data.label, data.relatedLinks.length + " feeds", "Weight: " + data.value);
            this.highlightLinks(data, true);
        }
        else {
            if (category === "TRANSACTION") {
                this.tooltip(true, "Metric: " + this._search.node[data.to].label, this._search.from[data.from].label, "Weight: " + data.value);
                this.highlightLink(data, true);
            }
            else {
                if (category === "FROM") {
                    this.tooltip(true, this._search.from[data.id].label, "", "Weight: " + this._search.from[data.id].value);
                    this.highlightLinks(this._search.chord[data.id], true);
                }
            }
        }
    };
    Cell.prototype.node_onMouseOut = function (a, b) {
        if (b === "TO") {
            this.highlightLinks(a, false);
        }
        else {
            if (b === "TRANSACTION") {
                this.highlightLink(a, false);
            }
            else {
                if (b === "FROM") {
                    this.highlightLinks(this._search.chord[a.id], false);
                }
            }
        }
        this.tooltip(false);
    };
    Cell.prototype.tooltip = function (show, h, h1, h2) {
        var toolTip = d3.select("#toolTip");
        if (show) {
            var pos = { x: d3.event.pageX + 15, y: d3.event.pageY - 150 };
            if (pos.x + 280 > window.innerWidth) {
                pos.x = d3.event.pageX - 280;
            }
            if (pos.y < 0) {
                pos.y = d3.event.pageY;
            }
            toolTip.transition().duration(200).style("opacity", ".9");
            toolTip.select("#header1").text(h1);
            toolTip.select("#head").text(h);
            toolTip.select("#header2").text(h2);
            toolTip.style("left", pos.x + "px").style("top", pos.y + "px");
        }
        else {
            toolTip.transition().duration(500).style("opacity", "0");
        }
    };
    Cell.prototype.reset = function () { ut.reset(this.id); return this; };
    Cell.prototype.width = function () {
        return this.svg.node().getBoundingClientRect().width;
    };
    Cell.prototype._buildChords = function () {
        var _this = this;
        var a = [];
        var indexByName = [];
        var nameByIndex = [];
        var n = 0;
        this._data.from.forEach(function (fr) {
            nameByIndex[n] = fr.id;
            indexByName[fr.id] = n++;
        });
        this._data.from.forEach(function (fr) {
            var c = indexByName[fr.id];
            var d = a[c];
            if (!d) {
                d = a[c] = [];
                for (var f = -1; ++f < n;) {
                    d[f] = 0;
                }
            }
            d[indexByName[fr.id]] = fr.value;
        });
        this._gen.chord.matrix(a);
        var chords = this._gen.chord.chords();
        var adj = 90 * Math.PI / 180;
        var labels = [];
        chords.forEach(function (d, i) {
            d.id = nameByIndex[i];
            d.angle = (d.source.startAngle + d.source.endAngle) / 2;
            _this._search.chord[d.id] = {
                currentAngle: d.source.startAngle,
                currentLinkAngle: d.source.startAngle,
                endAngle: d.source.endAngle,
                index: d.source.index,
                relatedLinks: [],
                source: d.source,
                startAngle: d.source.startAngle,
                value: d.source.value,
            };
            labels.push({
                angle: d.angle + adj,
                endAngle: d.source.endAngle + adj / 2,
                id: d.id,
                startAngle: d.source.startAngle - adj / 2,
            });
        });
        return { chords: chords, labels: labels };
    };
    Cell.prototype._buildCircles = function () {
        var _this = this;
        var toList = [];
        this._data.to.forEach(function (to) { return toList.push({ children: to, value: 0 }); });
        var nodes = this._gen.bubble.nodes({ children: toList, type: "root" });
        var circles = [];
        nodes.forEach(function (a) {
            if (a.depth === 2) {
                _this._search.node[a.id] = a;
                a.relatedLinks = [];
                a.currentValue = a.value;
                circles.push(a);
            }
        });
        return circles;
    };
    Cell.prototype._buildShapeGenerators = function () {
        this._gen.bubble = window.d3v3.layout.pack()
            .sort(null)
            .size([2 * this.radius.bubble, 2 * this.radius.bubble])
            .padding(1.5);
        this._gen.chord = window.d3v3.layout.chord()
            .padding(.05)
            .sortSubgroups(d3.descending)
            .sortChords(d3.descending);
        this._gen.diag = function (d, i) {
            var p0 = d.source;
            var p3 = d.target;
            var m = (p0.y + p3.y) / 2;
            var p = [p0, { x: p0.x, y: m }, { x: p3.x, y: m }, p3];
            return "M" + p[0].x + "," + p[0].y + "C" + p[1].x + "," + p[1].y + " " + p[2].x + "," + p[2].y + " " + p[3].x + "," + p[3].y;
        };
        this._gen.arc = d3.arc()
            .innerRadius(this.radius.inner)
            .outerRadius(this.radius.inner + 10);
    };
    Cell.prototype._buildSearchStructures = function () {
        var _this = this;
        this._data.links.forEach(function (tr) {
            _this._search.node[tr.to].relatedLinks.push(tr);
            _this._search.chord[tr.from].relatedLinks.push(tr);
        });
    };
    Cell.prototype._updateChords = function (data) {
        var _this = this;
        var ch = this.svg.select("g.chords");
        var a = ch.selectAll("g.arc")
            .data(data.chords, function (d) { return d.id; });
        var arcGroup = a.enter()
            .append("g")
            .attr("class", "arc");
        var defs = this.svg.select("defs");
        var c = defs.selectAll(".arcDefs")
            .data(data.labels, function (d) { return d.id; });
        c.enter().append("path")
            .attr("class", "arcDefs")
            .attr("id", function (d) { return "labelArc_" + d.id; })
            .attr("d", function (d) {
            var ac = d3.arc()
                .innerRadius(1.05 * _this.radius.inner)
                .outerRadius(1.05 * _this.radius.inner)(d);
            var re = /[Mm][\d\.\-e,\s]+[Aa][\d\.\-e,\s]+/;
            var path = re.exec(ac)[0];
            return path;
        });
        arcGroup.append("path")
            .style("fill-opacity", 0)
            .style("stroke", "#555")
            .style("stroke-opacity", .4);
        arcGroup.append("text")
            .attr("class", "chord")
            .attr("id", function (d) { return "t_" + d.id; })
            .on("mouseover", function (d) { return _this.node_onMouseOver(d, "FROM"); })
            .on("mouseout", function (d) { return _this.node_onMouseOut(d, "FROM"); })
            .style("font-size", "0px")
            .append("textPath")
            .text(function (d) { return _this._search.from[d.id].label; })
            .attr("startOffset", "50%")
            .attr("xlink:href", function (d) { return "#labelArc_" + d.id; });
        a.transition()
            .select("path")
            .attr("d", function (d, i) {
            var ar = d3.arc()
                .innerRadius(.95 * _this.radius.inner)
                .outerRadius(_this.radius.inner);
            return ar(d.source, i);
        });
        c.exit().remove();
        a.exit().remove();
    };
    Cell.prototype._updateLinks = function () {
        var _this = this;
        var i = this._data.links.length - 1;
        var nibble = i * 0.25;
        var renderLinks = [];
        var intervalId = window.setInterval(function () {
            if (i < 0) {
                window.clearInterval(intervalId);
            }
            else {
                for (var a = 0; a < nibble; a++) {
                    if (i > -1) {
                        renderLinks.push(_this._data.links[i--]);
                    }
                }
                _this._updateLinksBase(renderLinks);
            }
        }, 1);
    };
    Cell.prototype._updateLinksBase = function (data) {
        var _this = this;
        var lk = this.svg.select("g.links");
        var lg = lk.selectAll("g.nodelink")
            .data(data, function (d) { return d.id; });
        var c = lg.enter()
            .append("g")
            .attr("class", "nodelink");
        lg.transition();
        c.append("g")
            .attr("class", "arc")
            .append("path")
            .attr("id", function (d) { return "a_" + d.id; })
            .style("fill", function (d) { return d.fill; })
            .style("fill-opacity", .2)
            .attr("d", function (d, i) {
            var dp = _this._search.chord[d.from];
            var dc = {
                endAngle: undefined,
                startAngle: dp.currentAngle,
                value: d.value,
            };
            dp.currentAngle = dp.currentAngle + d.value / dp.value * (dp.endAngle - dp.startAngle);
            dc.endAngle = dp.currentAngle;
            var ar = d3.arc()
                .innerRadius(_this.radius.link)
                .outerRadius(_this.radius.inner);
            return ar(dc, i);
        })
            .on("mouseover", function (d) { return _this.node_onMouseOver(d, "TRANSACTION"); })
            .on("mouseout", function (d) { return _this.node_onMouseOut(d, "TRANSACTION"); });
        c.append("path")
            .attr("class", "link")
            .attr("id", function (d) { return "l_" + d.id; })
            .attr("d", function (d, i) {
            d.links = _this._updateLinksHelper(d);
            var path = _this._gen.diag(d.links[0], i);
            path += "L" + String(_this._gen.diag(d.links[1], i)).substr(1) + "A" + _this.radius.link + "," + _this.radius.link + " 0 0,0 " + d.links[0].source.x + "," + d.links[0].source.y;
            return path;
        })
            .style("stroke", function (d) { return d.fill; })
            .style("stroke-opacity", 0.1)
            .style("fill-opacity", 0.2)
            .style("fill", function (d) { return d.fill; })
            .on("mouseover", function (d) { return _this.node_onMouseOver(d, "TRANSACTION"); })
            .on("mouseout", function (d) { return _this.node_onMouseOut(d, "TRANSACTION"); });
        c.append("g")
            .attr("class", "node")
            .append("circle")
            .style("fill", function (d) { return d.fill; })
            .style("fill-opacity", .2)
            .style("stroke-opacity", 1)
            .attr("r", function (d) {
            var b = _this._search.node[d.to];
            b.currentValue = b.currentValue - d.value;
            return b.r * ((b.value - b.currentValue) / b.value);
        })
            .attr("transform", function (d) { return "translate(" + d.links[0].target.x + "," + d.links[0].target.y + ")"; });
        lg.exit().remove();
    };
    Cell.prototype._updateLinksHelper = function (a) {
        var b = { x: undefined, y: undefined };
        var d = { source: undefined, target: undefined };
        var e = { source: undefined, target: undefined };
        var g = this._search.chord[a.from];
        var h = this._search.node[a.to];
        var j = g.currentLinkAngle - 1.57079633;
        g.currentLinkAngle = g.currentLinkAngle + a.value / g.value * (g.endAngle - g.startAngle);
        var k = g.currentLinkAngle - 1.57079633;
        b.x = h.x - (this._pos.chords - this._pos.nodes);
        b.y = h.y - (this._pos.chords - this._pos.nodes);
        d.source = { x: this.radius.link * Math.cos(j), y: this.radius.link * Math.sin(j) };
        d.target = b;
        e.source = b;
        e.target = { x: this.radius.link * Math.cos(k), y: this.radius.link * Math.sin(k) };
        return [d, e];
    };
    Cell.prototype._updateNodes = function (data) {
        var _this = this;
        var gn = this.svg.select("g.nodes");
        var a = gn.selectAll("g.node")
            .data(data, function (d) { return d.id; });
        var b = a.enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
        b.append("circle")
            .attr("r", function (d) { return d.r; })
            .style("fill-opacity", function (d) { return d.depth < 2 ? 0 : .05; })
            .style("stroke", function (d) { return d.fill; })
            .style("stroke-opacity", function (d) { return d.depth < 2 ? 0 : .2; })
            .style("fill", function (d) { return d.fill; });
        var c = b.append("g")
            .attr("id", function (d) { return "c_" + d.id; })
            .style("opacity", 0);
        c.append("circle")
            .attr("r", function (d) { return d.r + 2; })
            .style("fill-opacity", 0)
            .style("stroke", "#fff")
            .style("stroke-width", 2.5)
            .style("stroke-opacity", .7);
        c.append("circle")
            .attr("r", function (d) { return d.r; })
            .style("fill-opacity", 0)
            .style("stroke", "#000")
            .style("stroke-width", 1.5)
            .style("stroke-opacity", 1)
            .on("mouseover", function (d) { return _this.node_onMouseOver(d, "TO"); })
            .on("mouseout", function (d) { return _this.node_onMouseOut(d, "TO"); });
        a.exit().remove()
            .transition(500)
            .style("opacity", 0);
    };
    return Cell;
}());

export { Cell };
