declare var d3: any;

export class Cell {
  private _data: any;
  private _parent: any;

  public svg: any;
  public renderLinks: any[] = [];
  public outerRadius: number;
  public innerRadius: number;
  public bubbleRadius: number;
  public linkRadius: number;
  public nodesTranslate: any;
  public chordsTranslate: number;
  public topMargin: number;
  public chordsSvg: any;
  public linksSvg: any;
  public nodesSvg: any;
  public bubble: any;
  public chord: any;
  public diagonal: any;
  public arc: any;
  public labelChords: any[];
  public format: any = d3.format(",d");
  public linkGroup: any;
  public circleList: any = [];
  public listFromById: any = {};
  public chordsById: any = {};
  public nodesById: any = {};
  public formatNumber: any = d3.format(",.0f");
  public indexByName: any = {};
  public nameByIndex: any;
  public chords: any = [];

  constructor(containerId: string, chartId: string) {
    this._parent = d3.select(`#${containerId}`);
    const box = this._parent.node().getBoundingClientRect();
    this._parent.node().appendChild(this._toSVG(chartId, box.width * 0.6, box.height * 0.6));
    this.svg = this._parent.select("svg");
    this.svg.select("defs")
      .append("style")
        .text(`.link { fill: none; stroke: #ccc; stroke-width: 1.5px; stroke-linecap: round }
        text.chord { font-size: 8px }`);
    this.outerRadius = box.width * .25;
    this.innerRadius = .9 * this.outerRadius;
    this.bubbleRadius = this.innerRadius - 50;
    this.linkRadius = .95 * this.innerRadius;
    this.nodesTranslate = this.outerRadius - this.innerRadius + (this.innerRadius - this.bubbleRadius);
    this.chordsTranslate = this.outerRadius;
    this.topMargin = .15 * this.innerRadius;
    this.chordsSvg = this.svg.append("g")
      .attr("class", "chords")
      .attr("transform", "translate(" + this.chordsTranslate + "," + (this.chordsTranslate + this.topMargin) + ")");
    this.linksSvg = this.svg.append("g")
      .attr("class", "links")
      .attr("transform", "translate(" + this.chordsTranslate + "," + (this.chordsTranslate + this.topMargin) + ")");
    this.nodesSvg = this.svg.append("g")
      .attr("class", "nodes")
      .attr("transform", "translate(" + this.nodesTranslate + "," + (this.nodesTranslate + this.topMargin) + ")");
    this.bubble = d3.layout.pack()
      .sort(null)
      .size([2 * this.bubbleRadius, 2 * this.bubbleRadius])
      .padding(1.5);
    this.chord = d3.layout.chord()
      .padding(.05)
      .sortSubgroups(d3.descending)
      .sortChords(d3.descending);
    this.diagonal = d3.svg.diagonal.radial();
    this.arc = d3.svg.arc()
      .innerRadius(this.innerRadius)
      .outerRadius(this.innerRadius + 10);
  }

  public data(data: any): Cell {
    this._data = data;
    this._data.from.forEach(fr => fr.value = 0);
    this._data.to.forEach(to => to.forEach(t => t.value = 0));
    this._data.links.forEach((t: any) => {
      let i = this._data.from.findIndex(d => d.id === t.from);
      if (i > -1) {
        this._data.from[i].value += t.value;
      }

      i = -1;
      let j = 0;
      while (i === -1 && j < this._data.to.length) {
        i = this._data.to[j].findIndex(d => d.id === t.to);
        if (i > -1) {
          this._data.to[j][i].value += t.value;
        }
        j++;
      }
    });
    this._data.from.forEach(fr => this.listFromById[fr.id] = fr);
    return this;
  }

  public draw() {
    const toList = [];
    this._data.to.forEach(to => toList.push({ children: to, value: 0 }));

    const nodes = this.bubble.nodes({ children: toList, type: "root" });
    nodes.forEach(a => {
      if (a.depth === 2) {
        this.nodesById[a.id] = a;
        a.relatedLinks = [];
        a.currentValue = a.value;
        this.circleList.push(a);
      }
    });

    this.buildChords();
    this._data.links.forEach(tr => {
      this.nodesById[tr.to].relatedLinks.push(tr);
      this.chordsById[tr.from].relatedLinks.push(tr);
    });
    this.updateNodes();
    this.updateChords();

    let i = this._data.links.length - 1;
    const nibble = i * 0.25;
    const intervalId = window.setInterval(() => {
      if (i < 0) {
        window.clearInterval(intervalId);
      } else {
        for (let a = 0; a < nibble; a++) {
          if (i > -1) {
            this.renderLinks.push(this._data.links[i--]);
          }
        }
        this.updateLinks(this.renderLinks);
      }
    }, 1);
  }

  public tooltipHide() {
    const toolTip = d3.select("#toolTip");
    toolTip.transition()
      .duration(500)
      .style("opacity", "0");
  }

  public node_onMouseOver(data: any, category: string): void {
    let pos = d3.event.pageX + 15;
    if (pos + 250 > window.innerWidth) {
      pos = d3.event.pageX - 280;
    }
    if (category === "TO") {
      if (data.depth < 2) { return; }
      this.tooltipMessage(pos,
        data.label,
        "To",
        "Total: " + data.value
      );
      this.highlightLinks(data, true);
    } else {
      if (category === "TRANSACTION") {
        this.tooltipMessage(pos,
          this.nodesById[data.to].label,
          this.listFromById[data.from].label,
          data.value
        );
        this.highlightLink(data, true);
      } else {
        if (category === "FROM") {
          this.tooltipMessage(d3.event.pageX + 15,
            this.listFromById[data.from].label,
            "From",
            "Total: " + this.listFromById[data.from].value
          );
          this.highlightLinks(this.chordsById[data.from], true);
        }
      }
    }
  }

  public node_onMouseOut(a: any, b: string) {
    if (b === "TO") {
      this.highlightLinks(a, false);
    } else {
      if (b === "TRANSACTION") {
        this.highlightLink(a, false);
      } else {
        if (b === "FROM") {
          this.highlightLinks(this.chordsById[a.from], false);
        }
      }
    }
    this.tooltipHide();
  }

  public highlightLinks(data: any, show: boolean) {
    data.relatedLinks.forEach((a: any) => this.highlightLink(a, show));
  }

  public buildChords() {
    const a = [];
    this.labelChords = [];
    const indexByName = [];
    const nameByIndex = [];
    let n = 0;

    this._data.from.forEach((fr: any) => {
      nameByIndex[n] = fr.id;
      indexByName[fr.id] = n++;
    });

    this._data.from.forEach((fr: any) => {
      const c = indexByName[fr.id];
      let d = a[c];
      if (!d) {
        d = a[c] = [];
        for (let f = -1; ++f < n;) {
          d[f] = 0;
        }
      }
      d[indexByName[fr.id]] = fr.value;
    });

    this.chord.matrix(a);
    this.chords = this.chord.chords();
    const adj = 90 * Math.PI / 180;
    let b = 0;

    this.chords.forEach((d: any, i: number) => {
      d.id = nameByIndex[i];
      d.angle = (d.source.startAngle + d.source.endAngle) / 2;

      this.chordsById[d.id] = {
        currentAngle: d.source.startAngle,
        currentLinkAngle: d.source.startAngle,
        endAngle: d.source.endAngle,
        index: d.source.index,
        relatedLinks: [],
        source: d.source,
        startAngle: d.source.startAngle,
        value: d.source.value
      };

      this.labelChords.push({
        angle: d.angle + adj,
        endAngle: d.source.endAngle + adj / 2,
        id: d.id,
        startAngle: d.source.startAngle - adj / 2
      });

      b++;
    });
  }

  public b(a: any) {
    const b = { x: undefined, y: undefined };
    const c = { x: undefined, y: undefined };
    const d = { source: undefined, target: undefined };
    const e = { source: undefined, target: undefined };
    const f = { x: undefined, y: undefined };
    const g = this.chordsById[a.from];
    const h = this.nodesById[a.to];
    const i = this.linkRadius;
    const j = (
      i * Math.cos(g.currentLinkAngle - 1.57079633),
      i * Math.sin(g.currentLinkAngle - 1.57079633),
      g.currentLinkAngle - 1.57079633);
    g.currentLinkAngle = g.currentLinkAngle + a.value / g.value * (g.endAngle - g.startAngle);
    const k = g.currentLinkAngle - 1.57079633;
    c.x = i * Math.cos(j);
    c.y = i * Math.sin(j);
    b.x = h.x - (this.chordsTranslate - this.nodesTranslate);
    b.y = h.y - (this.chordsTranslate - this.nodesTranslate);
    f.x = i * Math.cos(k);
    f.y = i * Math.sin(k);
    d.source = c;
    d.target = b;
    e.source = b;
    e.target = f;
    return [d, e];
  }

  public updateLinks(a: any) {
    this.linkGroup = this.linksSvg.selectAll("g.nodelink")
      .data(a, d => d.id);

    const c = this.linkGroup.enter()
      .append("g")
        .attr("class", "nodelink");

    this.linkGroup.transition();

    c.append("g")
      .attr("class", "arc")
      .append("path")
        .attr("id", d => "a_" + d.id)
        .style("fill", d => d.fill)
        .style("fill-opacity", .2)
        .attr("d", (d: any, i: number) => {
          const dp = this.chordsById[d.from];
          const dc = {
            endAngle: undefined,
            startAngle: dp.currentAngle,
            value: d.value
          };
          dp.currentAngle = dp.currentAngle + d.value / dp.value * (dp.endAngle - dp.startAngle);
          dc.endAngle = dp.currentAngle;
          const ar = d3.svg.arc(d, i)
            .innerRadius(this.linkRadius)
            .outerRadius(this.innerRadius);
          return ar(dc, i);
        })
        .on("mouseover", d => this.node_onMouseOver(d, "TRANSACTION"))
        .on("mouseout", d => this.node_onMouseOut(d, "TRANSACTION"));

    c.append("path")
      .attr("class", "link")
      .attr("id", d => "l_" + d.id)
      .attr("d", (d: any, i: number) => {
        d.links = this.b(d);
        let path = this.diagonal(d.links[0], i);
        path += `L${String(this.diagonal(d.links[1], i)).substr(1)}A${this.linkRadius},${this.linkRadius} 0 0,0 ${d.links[0].source.x},${d.links[0].source.y}`;
        return path;
      })
      .style("stroke", d => d.fill)
      .style("stroke-opacity", .07)
      .style("fill-opacity", .1)
      .style("fill", d => d.fill)
      .on("mouseover", d => this.node_onMouseOver(d, "TRANSACTION"))
      .on("mouseout", d => this.node_onMouseOut(d, "TRANSACTION"));

    c.append("g")
      .attr("class", "node")
      .append("circle")
        .style("fill", d => d.fill)
        .style("fill-opacity", .2)
        .style("stroke-opacity", 1)
        .attr("r", d => {
          const b = this.nodesById[d.to];
          b.currentValue = b.currentValue - d.value;
          return b.r * ((b.value - b.currentValue) / b.value);
        })
        .attr("transform", d => "translate(" + d.links[0].target.x + "," + d.links[0].target.y + ")");

    this.linkGroup.exit().remove();
  }

  public updateNodes() {
    const a = this.nodesSvg.selectAll("g.node")
      .data(this.circleList, d => d.id);

    const b = a.enter()
      .append("g")
        .attr("class", "node")
        .attr("transform", d => "translate(" + d.x + "," + d.y + ")");

    b.append("circle")
      .attr("r", d => d.r)
      .style("fill-opacity", d => d.depth < 2 ? 0 : .05)
      .style("stroke", d => d.fill)
      .style("stroke-opacity", d => d.depth < 2 ? 0 : .2)
      .style("fill", d => d.fill);

    const c = b.append("g")
      .attr("id", d => "c_" + d.id)
      .style("opacity", 0);

    c.append("circle")
      .attr("r", d => d.r + 2)
      .style("fill-opacity", 0)
      .style("stroke", "#FFF")
      .style("stroke-width", 2.5)
      .style("stroke-opacity", .7);

    c.append("circle")
      .attr("r", d => d.r)
      .style("fill-opacity", 0)
      .style("stroke", "#000")
      .style("stroke-width", 1.5)
      .style("stroke-opacity", 1)
      .on("mouseover", d => this.node_onMouseOver(d, "TO"))
      .on("mouseout", d => this.node_onMouseOut(d, "TO"));

    a.exit().remove()
      .transition(500)
      .style("opacity", 0);
  }

  public updateChords() {
    const a = this.chordsSvg.selectAll("g.arc")
      .data(this.chords, d => d.id);

    const arcGroup = a.enter()
      .append("g")
        .attr("class", "arc");

    const defs = this.svg.select("defs");

    const c = defs.selectAll(".arcDefs")
      .data(this.labelChords, d => d.id);

    c.enter().append("path")
      .attr("class", "arcDefs")
      .attr("id", d => `labelArc_${d.id}`);

    arcGroup.append("path")
      .style("fill-opacity", 0)
      .style("stroke", "#555")
      .style("stroke-opacity", .4);

    arcGroup.append("text")
      .attr("class", "chord")
      .attr("id", d => `t_${d.id}`)
      .on("mouseover", d => this.node_onMouseOver(d, "FROM"))
      .on("mouseout", d => this.node_onMouseOut(d, "FROM"))
      .style("font-size", "0px")
      .style("fill", "#777")
      .append("textPath")
      .text(d => this.listFromById[d.id].label)
      .attr("text-anchor", "middle")
      .attr("startOffset", "50%")
      .style("overflow", "visible")
      .attr("xlink:href", d => `#labelArc_${d.id}`);

    c.attr("d", d => {
      const ac = d3.svg.arc()
        .innerRadius(1.05 * this.innerRadius)
        .outerRadius(1.05 * this.innerRadius)(d);
      const re = /[Mm][\d\.\-e,\s]+[Aa][\d\.\-e,\s]+/;
      const path = re.exec(ac)[0];
      return path;
    });

    a.transition()
      .select("path")
      .attr("d", (data: any, index: number) => {
        const ar = d3.svg.arc(data, index)
          .innerRadius(.95 * this.innerRadius)
          .outerRadius(this.innerRadius);
        return ar(data.source, index);
      });

    c.exit().remove();
    a.exit().remove();
  }

  public tooltipMessage(pos: number, h: string, h1: string, h2: string) {
    const toolTip = d3.select("#toolTip");
    toolTip.transition().duration(200).style("opacity", ".9");
    toolTip.select("#header1").text(h1);
    toolTip.select("#head").text(h);
    toolTip.select("#header2").text(h2);
    toolTip.style("left", pos + "px")
      .style("top", d3.event.pageY - 150 + "px")
      .style("height", "100px");
  }

  public trimLabel(a: any) {
    return a.length > 25 ? String(a).substr(0, 25) + "..." : a;
  }

  public highlightLink(a: any, show: boolean) {
    const opac = show ? .6 : .1;
    d3.select("#l_" + a.id)
      .transition(show ? 150 : 550)
      .style("fill-opacity", opac)
      .style("stroke-opacity", opac);
    d3.select("#a_" + a.id)
      .transition()
      .style("fill-opacity", show ? opac : .2);
    d3.select("#c_" + a.to)
      .transition(show ? 150 : 550)
      .style("opacity", show ? 1 : 0);
    d3.select("#t_" + a.from)
      .transition(show ? 0 : 550)
      .style("fill", show ? "#000" : "#777")
      .style("font-size", show ? Math.round(.035 * this.innerRadius) + "px" : "0px");
  }

  private _toNodes(template: string): any {
    return new DOMParser().parseFromString(template, "text/html").body.childNodes[0];
  }

  private _toSVG(id: string, width: number, height: number): any {
    return this._toNodes(`<svg id ="${id}"
      aria-labelledBy="title" role="presentation"
      preserveAspectRatio="xMinYMin meet"
      height="100%" width="100%" viewBox="0 0 ${width} ${height}"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink">
      <title lang="en">Chart</title>
      <defs>
        <style type="text/css">
          svg {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 0.9em;
            user-select: none
          }
        </style>
      </defs>
      <g class="canvas"></g>
    </svg>`);
  }
}
