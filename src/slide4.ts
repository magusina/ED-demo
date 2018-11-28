import * as d3 from "d3";
import { Legend } from "../lib/legend.es";
import { Contour } from "../lib/contour.es";
import { Plot } from "../lib/plot.es";
import { Line } from "../lib/line.es";
import { kde, kernelEpanechnikov } from "../lib/kde.es";
import { getJSON} from "../lib/get-json.es";

const plot = new Plot("mainPlot", "scatterPlot");
const line = new Line("topPlot", "linePlot");

const legend = new Legend(plot);
legend
  .node("g.series")
  .icon(n => {
    const d = legend.datum(n);
    const path = plot.scale.s(d.shape);
    const shape = plot.shapes.find(sh => sh.path === path);
    return shape.name;
  })
  .label(n => {
    const d = legend.datum(n);
    return d.label + " " + d.shape;
  });

const contour = new Contour(plot);

getJSON("data/slide4.json", data => {
  const contourData = flatten(data);
  contour.data(contourData);
  plot.data(data).draw();
  const areaData = transformLineX(data, plot.innerWidth());
  line.margin = plot.margin;
  line.data(areaData).draw();
});

function flatten(data: any) {
  const f = [];
  data.series.forEach(s => s.values.forEach(v => f.push(v)));
  return f;
}

function transformLineX(data: any, width: number) {
  const r = {
    series: [
      { label: "ED-based", values: [] },
      { label: "UCC-based", values: [] }
    ]
  };

  data.series.forEach(s => {
    const i = s.label === "UCC-based" ? 1 : 0;
    s.values.forEach(v => {
      // x100 required to make density function input values
      r.series[i].values.push(v[0] * 100.0);
    });
  });

  r.series.forEach(s => {
    const scale = d3.scaleLinear()
      .domain(d3.extent(s.values))
      .range([0, width]);
    const ticks = scale.ticks(s.values.length * 0.2);
    const res = kde(kernelEpanechnikov(7), ticks)(s.values);
    s.values = res;
  });
  return r;
}

document.querySelector(".ask")
  .addEventListener("click", e => {
    const note = document.querySelector(".note") as HTMLElement;
    note.style.display = "block";
    setTimeout(() => note.style.opacity = "1", 10);
  });

document.querySelector(".close")
  .addEventListener("click", e => {
    const note = document.querySelector(".note") as HTMLElement;
    note.style.opacity = null;
    setTimeout(() => note.style.display = "none", 600);
  });