import { Legend } from "../lib/legend.es";
import { Contour } from "../lib/contour.es";
import { Plot } from "../lib/plot.es";
import { Sankey } from "../lib/sankey.es";
import { Cell } from "./cell";
import { StreamGraph } from "../lib/stream.es";
import { Line } from "../lib/line.es";
import { extent } from "d3-array";
import { scaleLinear } from "d3-scale";

declare var d3: any;

export class Start {
  public slides: any[] = [
    { /* Slide 1 */
      init: () => {
        console.log("Running slide 1");
        //const sankey1 = new Sankey("sankey1", "san001");
        const sankey2 = new Sankey("sankey2", "san002");

        /*this.getJSON("data/slide12.json", d1 => {
          sankey1.data(d1).draw();
        });*/

        this.getJSON("data/slide13.json", d2 => {
          sankey2.data(d2).draw();
        });
      }
    },
    { /* Slide 2 */
      init: () => {
        console.log("Running slide 2");
        const stream1 = new StreamGraph("stream1", "s001");
        const stream2 = new StreamGraph("stream2", "s002");

        this.getJSON("data/slide20.json", d1 => {
          stream1.data(d1).draw();
        });

        this.getJSON("data/slide21.json", d2 => {
          stream2.data(d2).draw();
        });
      }
    },
    { /* Slide 3 */
      init: () => {
        console.log("Running slide 3");
        const cell = new Cell("viz", "cell");

        this.getJSON("data/slide31.json", data => {
          cell.data(data).draw();
        });
      }
    },
    { /* Slide 4 */
      init: () => {
        console.log("Running slide 4");
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

        this.getJSON("data/slide4.json", data => {
          const contourData = flatten(data);
          contour.data(contourData);
          plot.data(data).draw();
          const areaData = transformLineX(data);
          line.data(areaData).draw();
        });

        function flatten(data: any) {
          const f = [];
          data.series.forEach(s => s.values.forEach(v => f.push(v)));
          return f;
        }

        function transformLineX(data: any) {
          const r = {
            series: [
              { label: "ED-based", values: [] },
              { label: "UCC-based", values: [] }
            ]
          };
          data.series.forEach(s => {
            const i = s.label === "UCC-based" ? 1 : 0;
            s.values.forEach(v => r.series[i].values.push(v[0]));
          });

          r.series.forEach(s => {
            const ext = extent(s.values);
            const x = scaleLinear().domain(ext).range([0, 553]);
            const res = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(40))(s.values);
            s.values = res;
          });
          return r;
        }

        // https://bl.ocks.org/mbostock/4341954
        function kernelDensityEstimator(kernel: any, X: any): any {
          return function(V: any) {
            return X.map(function(x: any) {
              return [x, d3.mean(V, function(v: any) { return kernel(x - v); })];
            });
          };
        }

        function kernelEpanechnikov(k: any): any {
          return function(v: any): any {
            return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
          };
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
      }
    }
  ];

  constructor() {}

  public run(index: number): Start {
    this.slides[index].init();
    return this;
  }

  public getJSON(url: string, success: Function) {
    const xhr = XMLHttpRequest
      ? new XMLHttpRequest()
      : new ActiveXObject("Microsoft.XMLHTTP");
    xhr.open("GET", url);
    xhr.onreadystatechange = () => {
      if (xhr.readyState > 3 && xhr.status === 200) {
        success(JSON.parse(xhr.responseText));
      }
    };
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.send();
    return xhr;
  }
}