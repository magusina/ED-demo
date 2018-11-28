(function (d3$1) {
  'use strict';

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

  var StreamGraph = (function () {
      function StreamGraph(parentid, id) {
          this._data = [];
          this._dataMod = [];
          this._series = [];
          this.axis = { x: undefined };
          this.domain = { x: undefined, y: undefined };
          this.event = { drawn: undefined };
          this.formatMillisecond = d3.timeFormat(".%L");
          this.formatSecond = d3.timeFormat(":%S");
          this.formatMinute = d3.timeFormat("%I:%M");
          this.formatHour = d3.timeFormat("%I %p");
          this.formatDay = d3.timeFormat("%a %d");
          this.formatWeek = d3.timeFormat("%b %d");
          this.formatMonth = d3.timeFormat("%b");
          this.formatYear = d3.timeFormat("%b %Y");
          this.margin = { top: 5, right: 20, bottom: 25, left: 15 };
          this.parseDate = d3.timeParse("%Y-%m-%d");
          this.scale = { c: undefined, x: undefined, y: undefined };
          this.title = { heading: undefined, x: undefined, y: undefined };
          this.id = id;
          this.event.drawn = new CustomEvent("drawn", { detail: { id: this.id } });
          var p = document.getElementById(parentid);
          var b = p.getBoundingClientRect();
          p.appendChild(ut.svg(id, b.width, b.height));
          this._svg = d3.select("#" + this.id).classed("stream", true);
          ut.style(this.id, ".data-item { transition: opacity 500ms ease-out }\n    .fade { fill-opacity: 0.05 }");
      }
      StreamGraph.prototype.data = function (data) {
          var _this = this;
          this._data = data;
          if (this._data.label) {
              this.title.heading = this._data.label.title;
              this.title.x = this._data.label.x;
              this.title.y = this._data.label.y;
          }
          this.scale.c = d3.scaleOrdinal(d3.schemeCategory10);
          if (!data.series[0].fill) {
              var c_1 = [];
              this._data.series
                  .forEach(function (s) { return c_1.push(s.label); });
              this.domain.c = c_1.filter(function (v, i, a) { return a.indexOf(v) === i; });
              this._data.series
                  .forEach(function (s) { return s.fill = _this.scale.c(s.label); });
          }
          data.series.forEach(function (s) {
              s.values.forEach(function (v, i) {
                  if (_this._dataMod.length === i) {
                      _this._dataMod.push({
                          date: is.isDate(v[0]) ? _this.parseDate(v[0]) : v[0]
                      });
                  }
                  _this._dataMod[i][s.label] = v[1];
              });
          });
          this._stack = d3.stack()
              .keys(data.series.map(function (d) { return d.label; }))
              .order(d3.stackOrderInsideOut)
              .offset(d3.stackOffsetWiggle);
          this._series = this._stack(this._dataMod);
          var mx = d3.max(this._series, function (layer) { return d3.max(layer, function (d) { return d[0] + d[1]; }); });
          var mi = d3.min(this._series, function (layer) { return d3.min(layer, function (d) { return d[0]; }); });
          this.domain.x = d3.extent(this._dataMod, function (d) { return d.date; });
          this.domain.y = [mi, mx];
          this._area = d3.area()
              .x(function (d) { return _this.scale.x(d.data.date); })
              .y0(function (d) { return _this.scale.y(d[0]); })
              .y1(function (d) { return _this.scale.y(d[1]); })
              .curve(d3.curveBasis);
          return this;
      };
      StreamGraph.prototype.draw = function () {
          var _this = this;
          if (this._data === undefined) {
              return this;
          }
          var canvas = this._svg.select(".canvas");
          var box = this._svg.node().getBoundingClientRect();
          var height = box.height;
          var width = box.width;
          var adjHeight = height - this.margin.top - this.margin.bottom;
          var adjWidth = width - this.margin.left - this.margin.right;
          canvas.attr("transform", "translate(" + this.margin.left + " " + this.margin.top + ")");
          this._svg
              .select("g.pending")
              .style("display", "none");
          ut.title(this.id, this.title.heading);
          this.scale.x = d3.scaleTime()
              .domain(this.domain.x)
              .range([0, adjWidth])
              .nice();
          this.scale.y = d3.scaleLinear()
              .domain(this.domain.y)
              .range([adjHeight, 0])
              .nice();
          this.axis.x = function (n) { return n
              .attr("transform", "translate(0, " + (height - _this.margin.bottom - _this.margin.top) + ")")
              .call(d3.axisBottom(_this.scale.x)
              .tickFormat(function (d) { return _this._multiDateFormat(d); })
              .ticks(5))
              .append("text")
              .attr("class", "axis-label-x")
              .attr("x", adjWidth)
              .attr("y", -4)
              .text(_this.title.x); };
          var p = canvas.selectAll("path")
              .data(this._series)
              .enter()
              .append("path")
              .attr("d", this._area)
              .attr("class", "data-item")
              .attr("fill", function (d) { return _this.scale.c(d.key); });
          p.on("mouseover", function (d, i) {
              _this._svg.selectAll(".data-item")
                  .style("opacity", function (d1, j) { return j !== i ? 0.1 : 1; });
          }).on("mouseout", function () {
              return _this._svg.selectAll(".data-item")
                  .style("opacity", 1);
          });
          p.append("title").text(function (d) { return d.key; });
          canvas.append("g").call(this.axis.x);
          window.dispatchEvent(this.event.drawn);
          return this;
      };
      StreamGraph.prototype.reset = function () { ut.reset.call(this); return this; };
      StreamGraph.prototype._multiDateFormat = function (date) {
          return (d3.timeSecond(date) < date ? this.formatMillisecond
              : d3.timeMinute(date) < date ? this.formatSecond
                  : d3.timeHour(date) < date ? this.formatMinute
                      : d3.timeDay(date) < date ? this.formatHour
                          : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? this.formatDay : this.formatWeek)
                              : d3.timeYear(date) < date ? this.formatMonth
                                  : this.formatYear)(date);
      };
      return StreamGraph;
  }());

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

  var stream1 = new StreamGraph("stream1", "s001");
  var stream2 = new StreamGraph("stream2", "s002");
  getJSON("data/slide20.json", function (data1) {
      stream1
          .data(data1)
          .draw();
  });
  getJSON("data/slide21.json", function (data2) {
      stream2
          .data(data2)
          .draw();
  });

}(d3));
