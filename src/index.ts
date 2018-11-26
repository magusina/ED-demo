import { Legend } from "../lib/legend.es";
import { Axis } from "../lib/axis.es";
import { Contour } from "../lib/contour.es";
import { Plot } from "../lib/plot.es";
import { Sankey } from "../lib/sankey.es";
import { Cell } from "./cell";
import { StreamGraph } from "../lib/stream.es";
import { Line } from "../lib/line.es";
import { extent } from "d3-array";
import { scaleLinear } from "d3-scale";
import { kde, kernelEpanechnikov } from "../lib/kde.es";

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
            const scale = scaleLinear()
              .domain(extent(s.values))
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