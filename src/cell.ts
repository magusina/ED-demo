declare var d3: any;

export type TCellLink = { fill: string, from: string, id: string, to: string, value: number };
export type TCellData = { from: any[], links: TCellLink[], to: any[] };

export class Cell {
  private _data: any;
  private _gen: any = { arc: undefined, bubble: undefined, chord: undefined, diag: undefined };
  private _pos: any = { chords: 0, nodes: 0 };
  public _search: any = { chord: {}, from: {}, node: {} };
  private _svg: any;

  public radius: any = { bubble: 0, inner: 0, link: 0, outer: 0 };
  public title: any = { heading: undefined };

  constructor(containerId: string, chartId: string) {
    const parent = d3.select(`#${containerId}`);
    const box = parent.node().getBoundingClientRect();
    parent.node().appendChild(this._toSVG(chartId, box.width * 0.6, box.height * 0.6));
    this._svg = parent.select("svg");
    this._svg.select("defs")
      .append("style")
        .attr("type", "text/css")
        .text(`
        .link { fill: none; stroke: #ccc; stroke-width: 1.5px; stroke-linecap: round }
        text.chord { fill: #777 }
        text.chord > textPath { overflow: visible; text-anchor: middle }`);
  }

  public data(data: TCellData): Cell {
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
    this._data.from.forEach(fr => this._search.from[fr.id] = fr);
    return this;
  }

  public draw(): Cell {
    const box = this._svg.node().getBoundingClientRect();
    this.radius.outer = Math.min(box.width * 0.27, box.height * 0.27);
    this.radius.inner = this.radius.outer * 0.9;
    this.radius.bubble = this.radius.inner - 50;
    this.radius.link = this.radius.inner * 0.95;
    this._pos.nodes = this.radius.outer - this.radius.inner + (this.radius.inner - this.radius.bubble);
    this._pos.chords = this.radius.outer;
    const canvas = this._svg.select("g.canvas");

    canvas.append("g")
      .attr("class", "chords")
      .attr("transform", `translate(${this._pos.chords},${this._pos.chords + this.radius.inner * 0.15})`);

    canvas.append("g")
      .attr("class", "links")
      .attr("transform", `translate(${this._pos.chords},${this._pos.chords + this.radius.inner * 0.15})`);

    canvas.append("g")
      .attr("class", "nodes")
      .attr("transform", `translate(${this._pos.nodes},${this._pos.nodes + this.radius.inner * 0.15})`);

    this._buildShapeGenerators();
    const nodes = this._buildCircles();
    const chords = this._buildChords();
    this._buildSearchStructures();
    this._updateNodes(nodes);
    this._updateChords(chords);
    this._updateLinks();

    return this;
  }

  public highlightLink(a: any, show: boolean): void {
    const opac = show ? .6 : .1;

    d3.select("#l_" + a.id)
      .classed("fade", false)
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
      .style("font-size", show ? Math.round(.035 * this.radius.inner) + "px" : "0px");
  }

  public highlightLinks(data: any, show: boolean): void {
    data.relatedLinks.forEach(link => this.highlightLink(link, show));
  }

  public node_onMouseOver(data: any, category: string): void {
    if (category === "TO") {
      if (data.depth < 2) { return; }
      this.tooltip(true,
        `Metric: ${data.label}`,
        `${data.relatedLinks.length} feeds`,
        `Weight: ${data.value}`
      );
      this.highlightLinks(data, true);
    } else {
      if (category === "TRANSACTION") {
        this.tooltip(true,
          `Metric: ${this._search.node[data.to].label}`,
          this._search.from[data.from].label,
          `Weight: ${data.value}`
        );
        this.highlightLink(data, true);
      } else {
        if (category === "FROM") {
          this.tooltip(true,
            this._search.from[data.id].label,
            "",
            `Weight: ${this._search.from[data.id].value}`
          );
          this.highlightLinks(this._search.chord[data.id], true);
        }
      }
    }
  }

  public node_onMouseOut(a: any, b: string): void {
    if (b === "TO") {
      this.highlightLinks(a, false);
    } else {
      if (b === "TRANSACTION") {
        this.highlightLink(a, false);
      } else {
        if (b === "FROM") {
          this.highlightLinks(this._search.chord[a.id], false);
        }
      }
    }
    this.tooltip(false);
  }

  public tooltip(show: boolean, h?: string, h1?: string, h2?: string): void {
    const toolTip = d3.select("#toolTip");
    if (show) {
      const pos: any = { x: d3.event.pageX + 15, y: d3.event.pageY - 150 };
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
      toolTip.style("left", `${pos.x}px`).style("top", `${pos.y}px`);
    } else {
      toolTip.transition().duration(500).style("opacity", "0");
    }
  }

  private _buildChords(): { chords: any[], labels: any[] } {
    const a = [];
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

    this._gen.chord.matrix(a);
    const chords = this._gen.chord.chords();
    const adj = 90 * Math.PI / 180;
    const labels = [];

    chords.forEach((d: any, i: number) => {
      d.id = nameByIndex[i];
      d.angle = (d.source.startAngle + d.source.endAngle) / 2;

      this._search.chord[d.id] = {
        currentAngle: d.source.startAngle,
        currentLinkAngle: d.source.startAngle,
        endAngle: d.source.endAngle,
        index: d.source.index,
        relatedLinks: [],
        source: d.source,
        startAngle: d.source.startAngle,
        value: d.source.value
      };

      labels.push({
        angle: d.angle + adj,
        endAngle: d.source.endAngle + adj / 2,
        id: d.id,
        startAngle: d.source.startAngle - adj / 2
      });
    });

    return { chords: chords, labels: labels };
  }

  private _buildCircles(): any[] {
    const toList = [];
    this._data.to.forEach(to => toList.push({ children: to, value: 0 }));
    const nodes = this._gen.bubble.nodes({ children: toList, type: "root" });
    const circles = [];
    nodes.forEach(a => {
      if (a.depth === 2) {
        this._search.node[a.id] = a;
        a.relatedLinks = [];
        a.currentValue = a.value;
        circles.push(a);
      }
    });
    return circles;
  }

  private _buildShapeGenerators(): void {
    this._gen.bubble = d3.layout.pack()
      .sort(null)
      .size([2 * this.radius.bubble, 2 * this.radius.bubble])
      .padding(1.5);

    this._gen.chord = d3.layout.chord()
      .padding(.05)
      .sortSubgroups(d3.descending)
      .sortChords(d3.descending);

    this._gen.diag = d3.svg.diagonal.radial();

    this._gen.arc = d3.svg.arc()
      .innerRadius(this.radius.inner)
      .outerRadius(this.radius.inner + 10);
  }

  private _buildSearchStructures(): void {
    this._data.links.forEach(tr => {
      this._search.node[tr.to].relatedLinks.push(tr);
      this._search.chord[tr.from].relatedLinks.push(tr);
    });
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

  private _updateChords(data: { chords: any, labels: any[] }): void {
    const ch = this._svg.select("g.chords");
    const a = ch.selectAll("g.arc")
      .data(data.chords, d => d.id);

    const arcGroup = a.enter()
      .append("g")
        .attr("class", "arc");

    const defs = this._svg.select("defs");

    const c = defs.selectAll(".arcDefs")
      .data(data.labels, d => d.id);

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
      .append("textPath")
        .text(d => this._search.from[d.id].label)
        //.attr()
        .attr("startOffset", "50%")
        .attr("xlink:href", d => `#labelArc_${d.id}`);

    c.attr("d", d => {
      const ac = d3.svg.arc()
        .innerRadius(1.05 * this.radius.inner)
        .outerRadius(1.05 * this.radius.inner)(d);
      const re = /[Mm][\d\.\-e,\s]+[Aa][\d\.\-e,\s]+/;
      const path = re.exec(ac)[0];
      return path;
    });

    a.transition()
      .select("path")
      .attr("d", (d, i) => {
        const ar = d3.svg.arc(d, i)
          .innerRadius(.95 * this.radius.inner)
          .outerRadius(this.radius.inner);
        return ar(d.source, i);
      });

    c.exit().remove();
    a.exit().remove();
  }

  private _updateLinks(): void {
    let i = this._data.links.length - 1;
    const nibble = i * 0.25;
    const renderLinks: TCellLink[] = [];
    const intervalId = window.setInterval(() => {
      if (i < 0) {
        window.clearInterval(intervalId);
      } else {
        for (let a = 0; a < nibble; a++) {
          if (i > -1) {
            renderLinks.push(this._data.links[i--]);
          }
        }
        this._updateLinksBase(renderLinks);
      }
    }, 1);
  }

  private _updateLinksBase(data: TCellLink[]): void {
    const lk = this._svg.select("g.links");
    const lg = lk.selectAll("g.nodelink")
      .data(data, d => d.id);

    const c = lg.enter()
      .append("g")
        .attr("class", "nodelink");

    lg.transition();

    c.append("g")
      .attr("class", "arc")
      .append("path")
        .attr("id", d => "a_" + d.id)
        .style("fill", d => d.fill)
        .style("fill-opacity", .2)
        .attr("d", (d: any, i: number) => {
          const dp = this._search.chord[d.from];
          const dc = {
            endAngle: undefined,
            startAngle: dp.currentAngle,
            value: d.value
          };
          dp.currentAngle = dp.currentAngle + d.value / dp.value * (dp.endAngle - dp.startAngle);
          dc.endAngle = dp.currentAngle;
          const ar = d3.svg.arc(d, i)
            .innerRadius(this.radius.link)
            .outerRadius(this.radius.inner);
          return ar(dc, i);
        })
        .on("mouseover", d => this.node_onMouseOver(d, "TRANSACTION"))
        .on("mouseout", d => this.node_onMouseOut(d, "TRANSACTION"));

    c.append("path")
      .attr("class", "link")
      .attr("id", d => `l_${d.id}`)
      .attr("d", (d: any, i: number) => {
        d.links = this._updateLinksHelper(d);
        let path = this._gen.diag(d.links[0], i);
        path += `L${String(this._gen.diag(d.links[1], i)).substr(1)}A${this.radius.link},${this.radius.link} 0 0,0 ${d.links[0].source.x},${d.links[0].source.y}`;
        return path;
      })
      .style("stroke", d => d.fill)
      .style("stroke-opacity", 0.1)
      .style("fill-opacity", 0.2)
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
          const b = this._search.node[d.to];
          b.currentValue = b.currentValue - d.value;
          return b.r * ((b.value - b.currentValue) / b.value);
        })
        .attr("transform", d => `translate(${d.links[0].target.x},${d.links[0].target.y})`);

    lg.exit().remove();
  }

  private _updateLinksHelper(a: any): [{ source: any, target: any }, { source: any, target: any }] {
    const b: { x: number, y: number } = { x: undefined, y: undefined };
    const d: { source: any, target: any } = { source: undefined, target: undefined };
    const e: { source: any, target: any } = { source: undefined, target: undefined };
    const g = this._search.chord[a.from];
    const h = this._search.node[a.to];
    const j = g.currentLinkAngle - 1.57079633;
    g.currentLinkAngle = g.currentLinkAngle + a.value / g.value * (g.endAngle - g.startAngle);
    const k = g.currentLinkAngle - 1.57079633;
    b.x = h.x - (this._pos.chords - this._pos.nodes);
    b.y = h.y - (this._pos.chords - this._pos.nodes);
    d.source = { x: this.radius.link * Math.cos(j), y: this.radius.link * Math.sin(j) };
    d.target = b;
    e.source = b;
    e.target = { x: this.radius.link * Math.cos(k), y: this.radius.link * Math.sin(k) };
    return [d, e];
  }

  private _updateNodes(data: any[]): void {
    const gn = this._svg.select("g.nodes");
    const a = gn.selectAll("g.node")
      .data(data, d => d.id);

    const b = a.enter()
      .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x},${d.y})`);

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
      .style("stroke", "#fff")
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
}
