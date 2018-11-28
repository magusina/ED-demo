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

  var Sankey = (function () {
      function Sankey(parentId, id) {
          this._nodePadding = 10;
          this._nodeWidth = 15;
          this.event = { drawn: undefined };
          this.margin = { top: 5, right: 5, bottom: 5, left: 5 };
          this.scale = { c: d3.scaleOrdinal(d3.schemeCategory10) };
          this.title = { heading: undefined };
          this.transition = d3.transition().duration(500).ease(d3.easeQuadOut);
          this.id = id;
          this.event.drawn = new CustomEvent("drawn", { detail: { id: this.id } });
          var p = document.getElementById(parentId);
          var b = p.getBoundingClientRect();
          p.appendChild(ut.svg(id, b.width, b.height));
          this._svg = d3.select("#" + this.id).classed("sankey", true);
          ut.style(this.id, ".sankey { border: none; font-family: Arial, Helvetica, sans-serif; overflow: hidden; padding: 0; transition: opacity 500ms; user-select: none }\n    .sankey path.link { fill: none; stroke-opacity: 0.5 }\n    .sankey path.link:hover { stroke-opacity: 0.2 }\n    .sankey rect.node { fill-opacity: 0.9; shape-rendering: crispEdges }\n    .sankey text.node { fill: #333; font-weight: bold }\n    .sankey .hidden { display: none }\n    .sankey .fade { fill-opacity: 0.2 }\n    .sankey .pending > rect { fill: #fff; stroke: none }\n    .sankey .pending > text { text-anchor: middle; transition: all 500ms ease-in-out }");
      }
      Sankey.prototype.data = function (d) {
          var _this = this;
          this._data = d;
          if (this._data.label) {
              this.title.heading = this._data.label.title;
          }
          this._data.nodes.forEach(function (item) {
              if (item.fill === undefined) {
                  item.fill = _this.scale.c(item.label);
              }
          });
          return this;
      };
      Sankey.prototype.dragStart = function (d) {
          if (!d._drag) {
              d._drag = {
                  x: d3.event.x, x0: d.x0, x1: d.x1,
                  y: d3.event.y, y0: d.y0, y1: d.y1
              };
          }
      };
      Sankey.prototype.dragMove = function (d, cx) {
          var box = cx._svg.node().getBoundingClientRect();
          d3.select(this)
              .attr('transform', function (d1) {
              var dx = d3.event.x - d1._drag.x;
              var dy = d3.event.y - d1._drag.y;
              d1.x0 = d1._drag.x0 + dx;
              d1.x1 = d1._drag.x1 + dx;
              d1.y0 = d1._drag.y0 + dy;
              d1.y1 = d1._drag.y1 + dy;
              if (d1.x0 < 0) {
                  d1.x1 = Math.abs(d1.x1 - d1.x0);
                  d1.x0 = 0;
              }
              if (d1.x1 + cx._nodeWidth > box.width) {
                  d1.x0 = box.width - cx._nodeWidth - 10;
                  d1.x1 = box.width - 10;
              }
              if (d1.y0 < 0) {
                  d1.y0 = 0;
                  d1.y1 = d1._drag.y1 - d1._drag.y0;
              }
              if (d1.y1 > box.height) {
                  d1.y0 = box.height - (d1._drag.y1 - d1._drag.y0) - 10;
                  d1.y1 = box.height - 10;
              }
              return "translate(" + d1.x0 + "," + d1.y0 + ")";
          });
          cx._sankey.update(cx._graph);
          cx._svg
              .selectAll("path.link")
              .attr("d", d3.sankeyLinkHorizontal());
      };
      Sankey.prototype.dragEnd = function (d) { delete d._drag; };
      Sankey.prototype.draw = function () {
          var _this = this;
          if (this._data === undefined) {
              return this;
          }
          var self = this;
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
          ut.title.call(this, this.title.heading);
          this._sankey = d3.sankey()
              .nodeAlign(d3.sankeyCenter)
              .nodeWidth(this._nodeWidth)
              .nodePadding(this._nodePadding)
              .extent([[0, 0], [adjWidth, adjHeight]]);
          this._graph = this._sankey({
              nodes: this._data.nodes.map(function (d) { return Object.assign({}, d); }),
              links: this._data.links.map(function (d) { return Object.assign({}, d); })
          });
          var node = canvas.selectAll("g.node")
              .data(this._graph.nodes)
              .enter().append("g")
              .attr("id", function (d) { return "g_" + d.id; })
              .classed("node", true)
              .attr("transform", function (d) { return "translate(" + d.x0 + ", " + (d.y0 > d.y1 ? d.y1 : d.y0) + ")"; });
          node.append("rect")
              .classed("node", true)
              .attr("height", function (d) { return Math.abs(d.y1 - d.y0); })
              .attr("width", function (d) { return Math.abs(d.x1 - d.x0); })
              .attr("fill", function (d) { return d.fill; })
              .attr("stroke", function (d) { return d3.color(d.fill).darker(1); })
              .append("title")
              .text(function (d) { return d.label + "\n" + d.value; });
          node.append("text")
              .classed("node", true)
              .attr("text-anchor", function (d) { return d.x0 < width / 2 ? "start" : "end"; })
              .attr("x", function (d) { return Math.abs(d.x0 < width / 2 ? 6 : -6); })
              .attr("y", function (d) { return Math.abs(d.y1 - d.y0) / 2; })
              .attr("dy", "0.35em")
              .attr('font-size', 10)
              .text(function (d) { return d.label; });
          node.attr("cursor", "move")
              .call(d3.drag()
              .on("start", function (d) { return _this.dragStart(d); })
              .on("drag", function (d) { self.dragMove.call(this, d, self); })
              .on("end", function (d) { self.dragEnd(d); d3.select(this).raise(); }));
          var link = canvas.selectAll("g.link")
              .data(this._graph.links)
              .enter().append("g")
              .attr("id", function (d) { return "g_" + d.source.id + "_" + d.target.id; })
              .classed("link", true)
              .attr("fill", "none")
              .attr("stroke-opacity", 0.5)
              .style("mix-blend-mode", "normal");
          link.on("click", function (d) {
              var path = event.target;
              var nodes = path.id.split("_");
              var glink = d3.select("#g_" + nodes[1] + "_" + nodes[2]);
              glink.raise();
              var srcnode = d3.select("#g_" + nodes[1]);
              srcnode.raise();
              var tgtnode = d3.select("#g_" + nodes[2]);
              tgtnode.raise();
          });
          var gradient = link.append("linearGradient")
              .attr("id", function (d) {
              d.uid = "lg_" + d.source.id + "_" + d.target.id;
              return d.uid;
          })
              .attr("gradientUnits", "userSpaceOnUse")
              .attr("x1", function (d) { return d.source.x1; })
              .attr("x2", function (d) { return d.target.x0; });
          gradient.append("stop")
              .attr("offset", "0%")
              .attr("stop-color", function (d) { return d.source.fill; });
          gradient.append("stop")
              .attr("offset", "100%")
              .attr("stop-color", function (d) { return d.target.fill; });
          link.append("path")
              .classed("link", true)
              .attr("id", function (d) { return "p_" + d.source.id + "_" + d.target.id; })
              .attr("d", d3.sankeyLinkHorizontal())
              .attr("stroke", function (d) { return "url(#" + d.uid + ")"; })
              .attr("stroke-width", function (d) { return Math.max(1, d.width); });
          link.append("title")
              .text(function (d) { return d.source.label + " \u2192 " + d.target.label + "\n" + d.value; });
          window.dispatchEvent(this.event.drawn);
          return this;
      };
      Sankey.prototype.reset = function () { ut.reset.call(this); return this; };
      return Sankey;
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

  var sankey = new Sankey("sankey2", "s1");
  getJSON("data/slide13.json", function (data) {
      sankey
          .data(data)
          .draw();
  });

}(d3));
