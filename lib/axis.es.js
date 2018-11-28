import { select, timeSecond, timeFormat, timeMinute, timeHour, timeDay, timeMonth, timeWeek, timeYear, format, drag, event } from 'd3';

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

function isInteger(n) {
    return typeof n === "number" &&
        isFinite(n) &&
        Math.floor(n) === n;
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

var Axis = (function () {
    function Axis(chart, options) {
        var _this = this;
        this.chart = chart;
        this.axis = {
            x: { show: false, ticks: 5, type: "number" },
            y: { show: false, ticks: 5, type: "number" }
        };
        if (options) {
            if (options.x) {
                this.axis.x.show = options.x.show || false;
                this.axis.x.ticks = options.x.ticks || 5;
                this.axis.x.type = options.x.type || "number";
            }
            if (options.y) {
                this.axis.y.show = options.y.show || false;
                this.axis.y.ticks = options.y.ticks || 5;
                this.axis.y.type = options.y.type || "number";
            }
        }
        if (this.axis.x.show) {
            chart.margin.bottom = 25;
            chart.margin.right = 5;
        }
        if (this.axis.y.show) {
            chart.margin.left = 25;
            chart.margin.top = 5;
            if (chart.margin.bottom < 5) {
                chart.margin.bottom = 5;
            }
        }
        ut.style(this.chart.id, ".axis-label-x {\n      fill: #000; font-size: 0.9em; text-anchor: end\n    }\n    .axis-label-y {\n      fill: #000; font-size: 0.9em; text-anchor: end\n    }\n    .tick > text { font-size: 0.9em }");
        window.addEventListener("drawn", function (e) {
            if (_this.chart.id === e.detail.id) {
                _this.draw();
            }
        });
    }
    Axis.prototype.draw = function () {
        if (this.axis.x.show) {
            this.drawXAxis();
        }
        if (this.axis.y.show) {
            this.drawYAxis();
        }
        return this;
    };
    Axis.prototype.drawXAxis = function () {
        var canvas = this.chart.svg.select(".canvas");
        var box = this.chart.svg.node().getBoundingClientRect();
        var width = box.width - this.chart.margin.left - this.chart.margin.right;
        var height = box.height - this.chart.margin.top - this.chart.margin.bottom;
        var scale;
        if (this.axis.x.type === "time") {
            scale = d3.scaleTime()
                .domain(this.chart.domain.x)
                .range([0, width]);
        }
        else if (this.axis.x.type === "number") {
            scale = d3.scaleLinear()
                .domain(this.chart.domain.x)
                .range([0, width]);
        }
        else {
            scale = d3.scaleOrdinal()
                .domain(this.chart.domain.x)
                .range([0, width]);
        }
        var g = canvas.append("g")
            .attr("transform", "translate(0, " + height + ")")
            .call(d3.axisBottom(scale)
            .ticks(this.axis.x.ticks)
            .tickFormat(this.axis.x.type === "time"
            ? f.formatDate
            : this.axis.x.type === "number"
                ? f.formatNumber
                : null));
        if (this.chart.title.x) {
            g.append("text")
                .attr("class", "axis-label-x")
                .attr("x", width - this.chart.margin.right)
                .attr("y", -4)
                .text(this.chart.title.x);
        }
        return this;
    };
    Axis.prototype.drawYAxis = function () {
        var canvas = this.chart.svg.select(".canvas");
        var box = this.chart.svg.node().getBoundingClientRect();
        var height = box.height - this.chart.margin.top - this.chart.margin.bottom;
        var scale;
        if (this.axis.y.type === "number") {
            scale = d3.scaleLinear()
                .domain(this.chart.domain.y)
                .range([height, 0]);
        }
        var g = canvas.append("g")
            .attr("transform", "translate(0, 0)")
            .call(d3.axisLeft(scale)
            .ticks(this.axis.y.ticks)
            .tickFormat(f.formatNumber));
        if (this.chart.title.y) {
            g.append("text")
                .attr("class", "axis-label-y")
                .attr("transform", "rotate(-90)")
                .attr("y", 4)
                .attr("dy", ".71em")
                .text(this.chart.title.y);
        }
        return this;
    };
    return Axis;
}());

export { Axis };
